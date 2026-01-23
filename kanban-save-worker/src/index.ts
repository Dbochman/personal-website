import { serializeBoard, serializeBoardMeta, getAllCardIds } from './markdown';
import {
  getHeadSha,
  getFileContent,
  getDirectoryContents,
  commitFilesAtomic,
  triggerDispatch,
  GitHubApiError,
} from './github';
import type {
  KanbanBoard,
  KanbanColumn,
  SaveRequest,
  SaveResponse,
  BoardResponse,
  BoardSummary,
  CreateBoardRequest,
  CreateBoardResponse,
} from './types';

export interface Env {
  GITHUB_PAT: string;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  SESSIONS: KVNamespace;
  // Configuration env vars (from wrangler.toml [vars])
  REPO_OWNER: string;
  REPO_NAME: string;
  WORKER_URL: string;
  ALLOWED_ORIGINS: string;
}

interface Session {
  githubUsername: string;
  accessToken: string;
  createdAt: number;
}

const SESSION_TTL = 60 * 60 * 24 * 7; // 7 days

// Safe default for local development (wrangler dev)
const DEV_ORIGINS = ['http://localhost:5173', 'http://localhost:8080'];

/**
 * Parse and validate ALLOWED_ORIGINS from env var
 * Rejects empty strings and origins that don't start with http
 * Falls back to DEV_ORIGINS if not configured (for local dev)
 * Logs warning when using fallback
 */
function getAllowedOrigins(env: Env): string[] {
  // Handle missing or empty ALLOWED_ORIGINS
  if (!env.ALLOWED_ORIGINS || env.ALLOWED_ORIGINS.trim() === '') {
    console.warn('ALLOWED_ORIGINS not set, using dev defaults:', DEV_ORIGINS);
    return DEV_ORIGINS;
  }

  const origins = env.ALLOWED_ORIGINS
    .split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0 && s.startsWith('http'));

  if (origins.length === 0) {
    console.warn('ALLOWED_ORIGINS contains no valid origins, using dev defaults:', DEV_ORIGINS);
    return DEV_ORIGINS;
  }

  return origins;
}

// Board ID validation regex (prevents path traversal)
const SAFE_ID = /^[a-z0-9][a-z0-9-]{0,48}[a-z0-9]?$/;

// Validation limits
const MAX_COLUMNS = 10;
const MAX_TITLE_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 5000;
const MAX_SUMMARY_LENGTH = 200;
const MAX_ARCHIVE_REASON_LENGTH = 500;
const MAX_LABEL_LENGTH = 50;
const MAX_LABELS_PER_CARD = 20;

// Default columns for new boards
const DEFAULT_COLUMNS = [
  { id: 'ideas', title: 'Ideas', description: 'Draft plans and ideas' },
  { id: 'todo', title: 'To Do', description: 'Planned tasks ready to start' },
  { id: 'in-progress', title: 'In Progress' },
  { id: 'done', title: 'Done' },
];

function getCorsOrigin(request: Request, env: Env): string {
  const allowedOrigins = getAllowedOrigins(env);
  const origin = request.headers.get('Origin') || '';
  return allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
}

function corsHeaders(request: Request, env: Env) {
  return {
    'Access-Control-Allow-Origin': getCorsOrigin(request, env),
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Credentials': 'true',
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(request, env) });
    }

    // OAuth routes
    if (url.pathname === '/auth/login') {
      return handleLogin(request, env);
    }
    if (url.pathname === '/auth/callback') {
      return handleCallback(request, env);
    }
    if (url.pathname === '/auth/status') {
      return handleStatus(request, env);
    }
    if (url.pathname === '/auth/logout') {
      return handleLogout(request, env);
    }

    // Board routes
    // GET /boards - list all boards
    if (url.pathname === '/boards' && request.method === 'GET') {
      return handleListBoards(request, env);
    }

    // POST /boards - create a new board (requires auth)
    if (url.pathname === '/boards' && request.method === 'POST') {
      return handleCreateBoard(request, env);
    }

    // GET /board/:boardId - get a specific board
    const boardMatch = url.pathname.match(/^\/board\/([a-z0-9-]+)$/);
    if (boardMatch && request.method === 'GET') {
      return handleGetBoard(request, boardMatch[1], env);
    }

    // Save route (requires auth)
    if (request.method === 'POST' && url.pathname === '/save') {
      return handleSave(request, env);
    }

    return new Response('Not found', { status: 404, headers: corsHeaders(request, env) });
  },
};

function handleLogin(request: Request, env: Env): Response {
  const allowedOrigins = getAllowedOrigins(env);
  const url = new URL(request.url);
  const returnTo = url.searchParams.get('return_to') || `${allowedOrigins[0]}/projects/kanban`;

  // Validate return_to to prevent open redirect
  // Parse as URL and check origin exactly (not startsWith, which allows bypasses)
  try {
    const returnUrl = new URL(returnTo);
    if (!allowedOrigins.includes(returnUrl.origin)) {
      return new Response('Invalid return_to', { status: 400 });
    }
  } catch {
    return new Response('Invalid return_to URL', { status: 400 });
  }

  const state = crypto.randomUUID();
  const authUrl = new URL('https://github.com/login/oauth/authorize');
  authUrl.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', `${env.WORKER_URL}/auth/callback`);
  authUrl.searchParams.set('scope', 'read:user');
  authUrl.searchParams.set('state', state);

  // Store state and return_to in cookie (pipe-separated)
  return new Response(null, {
    status: 302,
    headers: {
      Location: authUrl.toString(),
      'Set-Cookie': `oauth_state=${state}|${returnTo}; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
    },
  });
}

async function handleCallback(request: Request, env: Env): Promise<Response> {
  const allowedOrigins = getAllowedOrigins(env);
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  // Parse state and return_to from cookie
  const cookies = parseCookies(request.headers.get('Cookie') || '');
  const [savedState, returnTo] = (cookies.oauth_state || '').split('|');
  const redirectUrl = returnTo || `${allowedOrigins[0]}/projects/kanban`;

  if (state !== savedState) {
    return redirectWithError('State mismatch', redirectUrl);
  }

  // Exchange code for access token
  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  const tokenData = (await tokenResponse.json()) as { access_token?: string; error?: string };
  if (!tokenData.access_token) {
    return redirectWithError('Token exchange failed', redirectUrl);
  }

  // Get GitHub username
  const userResponse = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      'User-Agent': 'kanban-save-worker',
    },
  });
  const userData = (await userResponse.json()) as { login: string };

  // Check if user is a collaborator on the repo
  const collabResponse = await fetch(
    `https://api.github.com/repos/${env.REPO_OWNER}/${env.REPO_NAME}/collaborators/${userData.login}`,
    {
      headers: {
        Authorization: `Bearer ${env.GITHUB_PAT}`,
        'User-Agent': 'kanban-save-worker',
      },
    }
  );

  if (collabResponse.status !== 204) {
    return redirectWithError('Not a collaborator', redirectUrl);
  }

  // Create session
  const sessionId = crypto.randomUUID();
  const session: Session = {
    githubUsername: userData.login,
    accessToken: tokenData.access_token,
    createdAt: Date.now(),
  };

  await env.SESSIONS.put(sessionId, JSON.stringify(session), {
    expirationTtl: SESSION_TTL,
  });

  // Redirect back with session cookie
  return new Response(null, {
    status: 302,
    headers: {
      Location: redirectUrl,
      'Set-Cookie': `session=${sessionId}; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_TTL}; Path=/`,
    },
  });
}

async function handleStatus(request: Request, env: Env): Promise<Response> {
  const session = await getSession(request, env);

  return new Response(
    JSON.stringify({
      authenticated: !!session,
      username: session?.githubUsername || null,
    }),
    {
      headers: { ...corsHeaders(request, env), 'Content-Type': 'application/json' },
    }
  );
}

async function handleLogout(request: Request, env: Env): Promise<Response> {
  const cookies = parseCookies(request.headers.get('Cookie') || '');
  if (cookies.session) {
    await env.SESSIONS.delete(cookies.session);
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: {
      ...corsHeaders(request, env),
      'Content-Type': 'application/json',
      'Set-Cookie': 'session=; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Path=/',
    },
  });
}

/**
 * Handle GET /boards
 * Returns list of all available boards via dynamic discovery
 */
async function handleListBoards(request: Request, env: Env): Promise<Response> {
  try {
    const boards = await discoverBoards(env);
    return Response.json({ boards }, { headers: corsHeaders(request, env) });
  } catch (err) {
    console.error('Error listing boards:', err);
    // Fallback to empty list on error
    return Response.json({ boards: [] }, { headers: corsHeaders(request, env) });
  }
}

/**
 * Discover all boards by scanning content/kanban/ directory
 */
async function discoverBoards(env: Env): Promise<BoardSummary[]> {
  const contents = await getDirectoryContents('content/kanban', env);
  const boards: BoardSummary[] = [];

  for (const item of contents) {
    if (item.type !== 'dir') continue;
    if (!SAFE_ID.test(item.name)) continue;

    // Check for _board.md (required for valid board)
    const boardMeta = await getFileContent(`content/kanban/${item.name}/_board.md`, env);
    if (!boardMeta) continue;

    // Parse title from frontmatter
    const titleMatch = boardMeta.content.match(/^title:\s*["']?(.+?)["']?\s*$/m);
    const title = titleMatch ? titleMatch[1] : item.name;

    // Count cards in this board's directory
    const boardContents = await getDirectoryContents(`content/kanban/${item.name}`, env);
    const cardCount = boardContents.filter(
      (c) => c.name.endsWith('.md') && c.name !== '_board.md'
    ).length;

    boards.push({
      id: item.name,
      title,
      cardCount,
    });
  }

  return boards;
}

/**
 * Parse board metadata from _board.md content
 * Returns a minimal board structure (columns only, no cards)
 */
function parseBoardMetaMarkdown(content: string): KanbanBoard | null {
  // Extract frontmatter
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) return null;

  const frontmatter = frontmatterMatch[1];

  // Parse basic fields
  const schemaVersionMatch = frontmatter.match(/^schemaVersion:\s*(\d+)$/m);
  const idMatch = frontmatter.match(/^id:\s*(.+)$/m);
  const titleMatch = frontmatter.match(/^title:\s*["']?(.+?)["']?\s*$/m);
  const createdAtMatch = frontmatter.match(/^createdAt:\s*["']?(.+?)["']?\s*$/m);
  const updatedAtMatch = frontmatter.match(/^updatedAt:\s*["']?(.+?)["']?\s*$/m);

  if (!idMatch || !titleMatch) return null;

  // Parse columns array (simplified YAML parsing)
  const columns: KanbanColumn[] = [];
  const columnsMatch = frontmatter.match(/^columns:\n((?:  - [\s\S]*?(?=\n[a-z]|\n---|\n$))*)/m);

  // Valid column colors
  const validColors = new Set(['default', 'yellow', 'orange', 'purple', 'blue', 'green', 'red', 'pink']);

  if (columnsMatch) {
    const columnBlocks = columnsMatch[1].split(/\n  - /).filter(Boolean);
    for (const block of columnBlocks) {
      const colIdMatch = block.match(/id:\s*(.+)/);
      const colTitleMatch = block.match(/title:\s*["']?(.+?)["']?\s*$/m);
      const colDescMatch = block.match(/description:\s*["']?(.+?)["']?\s*$/m);
      const colColorMatch = block.match(/color:\s*["']?(\w+)["']?\s*$/m);

      if (colIdMatch && colTitleMatch) {
        const colorValue = colColorMatch ? colColorMatch[1].trim() : undefined;
        columns.push({
          id: colIdMatch[1].trim(),
          title: colTitleMatch[1].trim(),
          description: colDescMatch ? colDescMatch[1].trim() : undefined,
          // Only include color if it's a valid ColumnColor value
          color: colorValue && validColors.has(colorValue) ? colorValue as KanbanColumn['color'] : undefined,
          cards: [],
        });
      }
    }
  }

  return {
    schemaVersion: schemaVersionMatch ? parseInt(schemaVersionMatch[1], 10) : 1,
    id: idMatch[1].trim(),
    title: titleMatch[1].trim(),
    columns,
    createdAt: createdAtMatch ? createdAtMatch[1].trim() : new Date().toISOString(),
    updatedAt: updatedAtMatch ? updatedAtMatch[1].trim() : new Date().toISOString(),
  };
}

/**
 * Handle GET /board/:boardId
 * Returns board data from precompiled source plus current HEAD SHA
 * Falls back to parsing _board.md directly for new boards
 */
async function handleGetBoard(
  request: Request,
  boardId: string,
  env: Env
): Promise<Response> {
  // Validate board ID format
  if (!SAFE_ID.test(boardId)) {
    return Response.json(
      { error: 'invalid_board_id' },
      { status: 400, headers: corsHeaders(request, env) }
    );
  }

  try {
    // Get current HEAD SHA
    const headCommitSha = await getHeadSha(env);

    // Try precompiled JS first (with fallback on parse failure)
    const boardFile = await getFileContent(`src/generated/kanban/${boardId}.js`, env);
    if (boardFile) {
      try {
        // Parse the board data from the JS file
        const match = boardFile.content.match(/export const board = (\{[\s\S]*\});/);
        if (match) {
          const board = JSON.parse(match[1]) as KanbanBoard;
          const response: BoardResponse = {
            board,
            headCommitSha,
            precompiled: true,
          };
          return Response.json(response, { headers: corsHeaders(request, env) });
        }
        // No match - fall through to _board.md fallback
        console.warn(`Precompiled file for ${boardId} exists but regex didn't match`);
      } catch (parseErr) {
        // Parse failed (truncated content, format change, etc.) - fall through to _board.md
        console.warn(`Failed to parse precompiled board ${boardId}:`, parseErr);
      }
    }

    // Fallback: parse _board.md directly (new boards before precompile)
    const boardMeta = await getFileContent(`content/kanban/${boardId}/_board.md`, env);
    if (!boardMeta) {
      return Response.json(
        { error: 'board_not_found' },
        { status: 404, headers: corsHeaders(request, env) }
      );
    }

    const board = parseBoardMetaMarkdown(boardMeta.content);
    if (!board) {
      return Response.json(
        { error: 'invalid_board_format' },
        { status: 500, headers: corsHeaders(request, env) }
      );
    }

    const response: BoardResponse = {
      board,
      headCommitSha,
      precompiled: false,
    };

    return Response.json(response, { headers: corsHeaders(request, env) });
  } catch (err) {
    console.error('Error getting board:', err);
    return Response.json(
      { error: 'internal_error', message: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500, headers: corsHeaders(request, env) }
    );
  }
}

/**
 * Handle POST /boards
 * Creates a new board with default or custom columns
 */
async function handleCreateBoard(request: Request, env: Env): Promise<Response> {
  const session = await getSession(request, env);
  if (!session) {
    return Response.json(
      { error: 'not_authenticated' } as CreateBoardResponse,
      { status: 401, headers: corsHeaders(request, env) }
    );
  }

  let payload: CreateBoardRequest;
  try {
    payload = (await request.json()) as CreateBoardRequest;
  } catch {
    return Response.json(
      { success: false, error: 'invalid_json' } as CreateBoardResponse,
      { status: 400, headers: corsHeaders(request, env) }
    );
  }

  // Validate types (payload may have non-string values)
  if (typeof payload.id !== 'string' || typeof payload.title !== 'string') {
    return Response.json(
      { success: false, error: 'invalid_payload', message: 'Board ID and title must be strings' } as CreateBoardResponse,
      { status: 400, headers: corsHeaders(request, env) }
    );
  }

  const id = payload.id.trim();
  const title = payload.title.trim();

  // Validate board ID format
  if (!SAFE_ID.test(id)) {
    return Response.json(
      { success: false, error: 'invalid_board_id', message: 'Board ID must be lowercase alphanumeric with hyphens' } as CreateBoardResponse,
      { status: 400, headers: corsHeaders(request, env) }
    );
  }

  // Validate title
  if (!title || title.length > MAX_TITLE_LENGTH) {
    return Response.json(
      { success: false, error: 'invalid_title', message: `Title required and must be under ${MAX_TITLE_LENGTH} characters` } as CreateBoardResponse,
      { status: 400, headers: corsHeaders(request, env) }
    );
  }

  // Validate columns if provided
  const columns = payload.columns || DEFAULT_COLUMNS;
  const columnValidation = validateColumns(columns);
  if (columnValidation) {
    return Response.json(
      { success: false, error: 'invalid_columns', message: columnValidation } as CreateBoardResponse,
      { status: 400, headers: corsHeaders(request, env) }
    );
  }

  const MAX_RETRIES = 2;
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    attempt++;

    try {
      // Check board doesn't already exist
      const existing = await getFileContent(`content/kanban/${id}/_board.md`, env);
      if (existing) {
        return Response.json(
          { success: false, error: 'board_exists', message: 'A board with this ID already exists' } as CreateBoardResponse,
          { status: 409, headers: corsHeaders(request, env) }
        );
      }

      const headSha = await getHeadSha(env);
      const now = new Date().toISOString();

      // Create board structure
      const board: KanbanBoard = {
        schemaVersion: 1,
        id,
        title,
        columns: columns.map((c) => ({ ...c, cards: [] })),
        createdAt: now,
        updatedAt: now,
      };

      const boardMarkdown = serializeBoardMeta(board);

      // Commit the new board
      const newSha = await commitFilesAtomic(
        [{ path: `content/kanban/${id}/_board.md`, content: boardMarkdown }],
        [],
        `kanban: create board ${id} (by ${session.githubUsername})`,
        headSha,
        env
      );

      // Trigger precompile (non-blocking - board created even if dispatch fails)
      let warning: string | undefined;
      try {
        await triggerDispatch('precompile-content', env);
      } catch (err) {
        console.error('Failed to trigger precompile:', err);
        warning = 'Board created but precompile may be delayed.';
      }

      return Response.json(
        { success: true, boardId: id, newHeadSha: newSha, message: warning } as CreateBoardResponse,
        { status: 201, headers: corsHeaders(request, env) }
      );
    } catch (err) {
      if (err instanceof GitHubApiError && err.status === 409) {
        if (attempt < MAX_RETRIES) {
          // Race condition: another commit happened. Retry.
          console.log(`Create board retry attempt ${attempt} due to concurrent modification`);
          continue;
        }
        // Retries exhausted - return 409 to client
        return Response.json(
          { success: false, error: 'conflict', message: 'Too many concurrent modifications, please try again' } as CreateBoardResponse,
          { status: 409, headers: corsHeaders(request, env) }
        );
      }

      console.error('Error creating board:', err);
      return Response.json(
        {
          success: false,
          error: 'github_error',
          message: err instanceof Error ? err.message : 'Unknown error',
        } as CreateBoardResponse,
        { status: 500, headers: corsHeaders(request, env) }
      );
    }
  }

  // Should not reach here, but return 409 as fallback
  return Response.json(
    { success: false, error: 'conflict', message: 'Too many concurrent modifications, please try again' } as CreateBoardResponse,
    { status: 409, headers: corsHeaders(request, env) }
  );
}

/**
 * Validate columns configuration
 * Returns error message if invalid, null if valid
 */
function validateColumns(
  columns: Array<{ id: string; title: string; description?: string }>
): string | null {
  if (columns.length === 0) {
    return 'At least one column is required';
  }

  if (columns.length > MAX_COLUMNS) {
    return `Maximum ${MAX_COLUMNS} columns allowed`;
  }

  const columnIds = new Set<string>();
  for (const col of columns) {
    // Validate types first
    if (typeof col.id !== 'string' || typeof col.title !== 'string') {
      return 'Column ID and title must be strings';
    }

    const colId = col.id.trim();
    const colTitle = col.title.trim();

    if (!SAFE_ID.test(colId)) {
      return `Invalid column ID: ${colId}`;
    }
    if (columnIds.has(colId)) {
      return `Duplicate column ID: ${colId}`;
    }
    columnIds.add(colId);

    if (!colTitle || colTitle.length > MAX_TITLE_LENGTH) {
      return `Column title required and must be under ${MAX_TITLE_LENGTH} characters`;
    }

    // Validate description length if provided
    if (col.description && col.description.length > MAX_DESCRIPTION_LENGTH) {
      return `Column description too long (max ${MAX_DESCRIPTION_LENGTH} characters)`;
    }
  }

  return null;
}

/**
 * Validate board structure for save operations
 * Returns error message if invalid, null if valid
 */
function validateBoard(board: KanbanBoard): string | null {
  // Validate column count and IDs
  const columnValidation = validateColumns(
    board.columns.map((c) => ({ id: c.id, title: c.title, description: c.description }))
  );
  if (columnValidation) return columnValidation;

  // Validate cards
  const cardIds = new Set<string>();
  for (const col of board.columns) {
    for (const card of col.cards) {
      if (!SAFE_ID.test(card.id)) {
        return `Invalid card ID: ${card.id}`;
      }
      if (cardIds.has(card.id)) {
        return `Duplicate card ID: ${card.id}`;
      }
      cardIds.add(card.id);

      if (!card.title || card.title.length > MAX_TITLE_LENGTH) {
        return `Card title required and must be under ${MAX_TITLE_LENGTH} characters`;
      }
      if (card.description && card.description.length > MAX_DESCRIPTION_LENGTH) {
        return `Card description too long: ${card.id}`;
      }
      if (card.summary && card.summary.length > MAX_SUMMARY_LENGTH) {
        return `Card summary too long: ${card.id} (max ${MAX_SUMMARY_LENGTH} characters)`;
      }
      if (card.labels) {
        if (card.labels.length > MAX_LABELS_PER_CARD) {
          return `Too many labels on card ${card.id} (max ${MAX_LABELS_PER_CARD})`;
        }
        for (const label of card.labels) {
          if (label.length > MAX_LABEL_LENGTH) {
            return `Label too long on card ${card.id}: "${label.substring(0, 20)}..." (max ${MAX_LABEL_LENGTH} characters)`;
          }
        }
      }
    }
  }

  return null;
}

/**
 * Handle POST /save
 * Saves board to markdown files via GitHub Trees API
 */
async function handleSave(request: Request, env: Env): Promise<Response> {
  const session = await getSession(request, env);
  if (!session) {
    return Response.json(
      { success: false, error: 'not_authenticated' } as SaveResponse,
      { status: 401, headers: corsHeaders(request, env) }
    );
  }

  let payload: SaveRequest;
  try {
    payload = (await request.json()) as SaveRequest;
  } catch {
    return Response.json(
      { success: false, error: 'invalid_json' } as SaveResponse,
      { status: 400, headers: corsHeaders(request, env) }
    );
  }

  const { board, boardId, headCommitSha, deletedCardIds } = payload;

  // Shape validation - ensure basic structure before validateBoard
  if (typeof boardId !== 'string') {
    return Response.json(
      { success: false, error: 'invalid_payload', message: 'boardId must be a string' } as SaveResponse,
      { status: 400, headers: corsHeaders(request, env) }
    );
  }
  if (typeof headCommitSha !== 'string') {
    return Response.json(
      { success: false, error: 'invalid_payload', message: 'headCommitSha must be a string' } as SaveResponse,
      { status: 400, headers: corsHeaders(request, env) }
    );
  }
  if (!board || typeof board !== 'object') {
    return Response.json(
      { success: false, error: 'invalid_payload', message: 'board must be an object' } as SaveResponse,
      { status: 400, headers: corsHeaders(request, env) }
    );
  }
  if (!Array.isArray(board.columns)) {
    return Response.json(
      { success: false, error: 'invalid_payload', message: 'board.columns must be an array' } as SaveResponse,
      { status: 400, headers: corsHeaders(request, env) }
    );
  }
  for (const col of board.columns) {
    if (!col || typeof col !== 'object' || !Array.isArray(col.cards)) {
      return Response.json(
        { success: false, error: 'invalid_payload', message: 'Each column must have a cards array' } as SaveResponse,
        { status: 400, headers: corsHeaders(request, env) }
      );
    }
  }
  if (deletedCardIds !== undefined && !Array.isArray(deletedCardIds)) {
    return Response.json(
      { success: false, error: 'invalid_payload', message: 'deletedCardIds must be an array' } as SaveResponse,
      { status: 400, headers: corsHeaders(request, env) }
    );
  }

  // Validate board ID format
  if (!SAFE_ID.test(boardId)) {
    return Response.json(
      { success: false, error: 'invalid_board_id' } as SaveResponse,
      { status: 400, headers: corsHeaders(request, env) }
    );
  }

  // Verify board exists
  const boardMeta = await getFileContent(`content/kanban/${boardId}/_board.md`, env);
  if (!boardMeta) {
    return Response.json(
      { success: false, error: 'board_not_found' } as SaveResponse,
      { status: 404, headers: corsHeaders(request, env) }
    );
  }

  // Validate board structure (includes column and card ID validation)
  const boardValidation = validateBoard(board);
  if (boardValidation) {
    return Response.json(
      { success: false, error: 'invalid_board', message: boardValidation } as SaveResponse,
      { status: 400, headers: corsHeaders(request, env) }
    );
  }

  // Ensure board.id matches the boardId in the URL path
  if (board.id !== boardId) {
    return Response.json(
      { success: false, error: 'board_id_mismatch', message: 'Board ID in payload does not match URL' } as SaveResponse,
      { status: 400, headers: corsHeaders(request, env) }
    );
  }

  // Validate deleted card IDs
  for (const cardId of deletedCardIds || []) {
    if (!SAFE_ID.test(cardId)) {
      return Response.json(
        { success: false, error: 'invalid_deleted_card_id', message: `Invalid card ID: ${cardId}` } as SaveResponse,
        { status: 400, headers: corsHeaders(request, env) }
      );
    }
  }

  try {
    // Get current HEAD to check for conflicts
    const currentSha = await getHeadSha(env);
    if (currentSha !== headCommitSha) {
      return Response.json(
        { success: false, error: 'conflict', message: 'Board was modified externally. Please reload.' } as SaveResponse,
        { status: 409, headers: corsHeaders(request, env) }
      );
    }

    // Update board timestamps
    const now = new Date().toISOString();
    const boardWithTimestamp: KanbanBoard = {
      ...board,
      updatedAt: now,
    };

    // Serialize board to markdown files
    const files = serializeBoard(boardWithTimestamp, boardId);

    // Build deletions list (explicit deletions only)
    const deletions = (deletedCardIds || []).map(
      (id) => `content/kanban/${boardId}/${id}.md`
    );

    // Commit message includes saved by info
    const message = `kanban: save ${boardId} (by ${session.githubUsername})`;

    // Atomic commit with parent SHA check
    const newSha = await commitFilesAtomic(files, deletions, message, headCommitSha, env);

    // Trigger precompile workflow (non-blocking - save succeeded even if dispatch fails)
    let warning: string | undefined;
    try {
      await triggerDispatch('precompile-content', env);
    } catch (err) {
      console.error('Failed to trigger precompile:', err);
      warning = 'Save succeeded but precompile may be delayed.';
    }

    const response: SaveResponse = {
      success: true,
      newHeadSha: newSha,
      message: warning,
    };

    return Response.json(response, {
      headers: corsHeaders(request, env),
    });
  } catch (err) {
    console.error('Save error:', err);

    if (err instanceof GitHubApiError) {
      if (err.status === 409) {
        return Response.json(
          { success: false, error: 'conflict', message: 'Concurrent modification detected' } as SaveResponse,
          { status: 409, headers: corsHeaders(request, env) }
        );
      }

      return Response.json(
        { success: false, error: 'github_error', message: err.message } as SaveResponse,
        { status: err.status >= 500 ? 502 : err.status, headers: corsHeaders(request, env) }
      );
    }

    return Response.json(
      { success: false, error: 'internal_error', message: err instanceof Error ? err.message : 'Unknown error' } as SaveResponse,
      { status: 500, headers: corsHeaders(request, env) }
    );
  }
}

// Helper functions
async function getSession(request: Request, env: Env): Promise<Session | null> {
  const cookies = parseCookies(request.headers.get('Cookie') || '');
  if (!cookies.session) return null;

  const sessionData = await env.SESSIONS.get(cookies.session);
  if (!sessionData) return null;

  return JSON.parse(sessionData) as Session;
}

function parseCookies(cookieHeader: string): Record<string, string> {
  return Object.fromEntries(
    cookieHeader.split(';').map((c) => {
      const [key, ...val] = c.trim().split('=');
      return [key, val.join('=')];
    })
  );
}

function redirectWithError(error: string, returnTo: string): Response {
  const url = new URL(returnTo);
  url.searchParams.set('auth_error', error);
  return new Response(null, { status: 302, headers: { Location: url.toString() } });
}
