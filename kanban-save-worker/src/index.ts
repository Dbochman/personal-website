import { serializeBoard, getAllCardIds } from './markdown';
import {
  getHeadSha,
  getFileContent,
  getDirectoryContents,
  commitFilesAtomic,
  triggerDispatch,
  GitHubApiError,
} from './github';
import type { KanbanBoard, SaveRequest, SaveResponse, BoardResponse } from './types';

export interface Env {
  GITHUB_PAT: string;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  SESSIONS: KVNamespace;
}

interface Session {
  githubUsername: string;
  accessToken: string;
  createdAt: number;
}

const REPO_OWNER = 'Dbochman';
const REPO_NAME = 'personal-website';
const SESSION_TTL = 60 * 60 * 24 * 7; // 7 days
const WORKER_URL = 'https://api.dylanbochman.com';
const ALLOWED_ORIGINS = [
  'https://dylanbochman.com',
  'http://localhost:8080',
  'http://localhost:5173',
];

// Board ID validation regex (prevents path traversal)
const SAFE_ID = /^[a-z0-9][a-z0-9-]{0,48}[a-z0-9]?$/;

// Allowed board IDs
const ALLOWED_BOARDS = ['roadmap', 'house'];

function getCorsOrigin(request: Request): string {
  const origin = request.headers.get('Origin') || '';
  return ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
}

function corsHeaders(request: Request) {
  return {
    'Access-Control-Allow-Origin': getCorsOrigin(request),
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
      return new Response(null, { headers: corsHeaders(request) });
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
    const boardMatch = url.pathname.match(/^\/board\/([a-z0-9-]+)$/);
    if (boardMatch && request.method === 'GET') {
      return handleGetBoard(request, boardMatch[1], env);
    }

    // Save route (requires auth)
    if (request.method === 'POST' && url.pathname === '/save') {
      return handleSave(request, env);
    }

    return new Response('Not found', { status: 404, headers: corsHeaders(request) });
  },
};

function handleLogin(request: Request, env: Env): Response {
  const url = new URL(request.url);
  const returnTo = url.searchParams.get('return_to') || `${ALLOWED_ORIGINS[0]}/projects/kanban`;

  // Validate return_to to prevent open redirect
  // Parse as URL and check origin exactly (not startsWith, which allows bypasses)
  try {
    const returnUrl = new URL(returnTo);
    if (!ALLOWED_ORIGINS.includes(returnUrl.origin)) {
      return new Response('Invalid return_to', { status: 400 });
    }
  } catch {
    return new Response('Invalid return_to URL', { status: 400 });
  }

  const state = crypto.randomUUID();
  const authUrl = new URL('https://github.com/login/oauth/authorize');
  authUrl.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', `${WORKER_URL}/auth/callback`);
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
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  // Parse state and return_to from cookie
  const cookies = parseCookies(request.headers.get('Cookie') || '');
  const [savedState, returnTo] = (cookies.oauth_state || '').split('|');
  const redirectUrl = returnTo || `${ALLOWED_ORIGINS[0]}/projects/kanban`;

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
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/collaborators/${userData.login}`,
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
      headers: { ...corsHeaders(request), 'Content-Type': 'application/json' },
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
      ...corsHeaders(request),
      'Content-Type': 'application/json',
      'Set-Cookie': 'session=; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Path=/',
    },
  });
}

/**
 * Handle GET /board/:boardId
 * Returns board data from precompiled source plus current HEAD SHA
 */
async function handleGetBoard(
  request: Request,
  boardId: string,
  env: Env
): Promise<Response> {
  // Validate board ID
  if (!SAFE_ID.test(boardId) || !ALLOWED_BOARDS.includes(boardId)) {
    return Response.json(
      { error: 'invalid_board_id' },
      { status: 400, headers: corsHeaders(request) }
    );
  }

  try {
    // Get current HEAD SHA
    const headCommitSha = await getHeadSha(env);

    // Get board from precompiled JS file
    const boardFile = await getFileContent(`src/generated/kanban/${boardId}.js`, env);
    if (!boardFile) {
      return Response.json(
        { error: 'board_not_found' },
        { status: 404, headers: corsHeaders(request) }
      );
    }

    // Parse the board data from the JS file
    // The file format is: export const board = {...};
    const match = boardFile.content.match(/export const board = (\{[\s\S]*\});/);
    if (!match) {
      return Response.json(
        { error: 'invalid_board_format' },
        { status: 500, headers: corsHeaders(request) }
      );
    }

    const board = JSON.parse(match[1]) as KanbanBoard;

    const response: BoardResponse = {
      board,
      headCommitSha,
    };

    return Response.json(response, {
      headers: corsHeaders(request),
    });
  } catch (err) {
    console.error('Error getting board:', err);
    return Response.json(
      { error: 'internal_error', message: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500, headers: corsHeaders(request) }
    );
  }
}

/**
 * Handle POST /save
 * Saves board to markdown files via GitHub Trees API
 */
async function handleSave(request: Request, env: Env): Promise<Response> {
  const session = await getSession(request, env);
  if (!session) {
    return Response.json(
      { error: 'not_authenticated' },
      { status: 401, headers: corsHeaders(request) }
    );
  }

  let payload: SaveRequest;
  try {
    payload = (await request.json()) as SaveRequest;
  } catch {
    return Response.json(
      { error: 'invalid_json' },
      { status: 400, headers: corsHeaders(request) }
    );
  }

  const { board, boardId, headCommitSha, deletedCardIds } = payload;

  // Validate board ID
  if (!SAFE_ID.test(boardId) || !ALLOWED_BOARDS.includes(boardId)) {
    return Response.json(
      { error: 'invalid_board_id' },
      { status: 400, headers: corsHeaders(request) }
    );
  }

  // Validate all card IDs
  const allCardIds = getAllCardIds(board);
  for (const cardId of allCardIds) {
    if (!SAFE_ID.test(cardId)) {
      return Response.json(
        { error: 'invalid_card_id', cardId },
        { status: 400, headers: corsHeaders(request) }
      );
    }
  }

  // Validate deleted card IDs
  for (const cardId of deletedCardIds || []) {
    if (!SAFE_ID.test(cardId)) {
      return Response.json(
        { error: 'invalid_deleted_card_id', cardId },
        { status: 400, headers: corsHeaders(request) }
      );
    }
  }

  try {
    // Get current HEAD to check for conflicts
    const currentSha = await getHeadSha(env);
    if (currentSha !== headCommitSha) {
      return Response.json(
        { error: 'conflict', message: 'Board was modified externally. Please reload.' } as SaveResponse,
        { status: 409, headers: corsHeaders(request) }
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

    // Trigger precompile workflow
    await triggerDispatch('precompile-content', env);

    const response: SaveResponse = {
      success: true,
      newHeadSha: newSha,
    };

    return Response.json(response, {
      headers: corsHeaders(request),
    });
  } catch (err) {
    console.error('Save error:', err);

    if (err instanceof GitHubApiError) {
      if (err.status === 409) {
        return Response.json(
          { error: 'conflict', message: 'Concurrent modification detected' } as SaveResponse,
          { status: 409, headers: corsHeaders(request) }
        );
      }

      return Response.json(
        { error: 'github_error', message: err.message } as SaveResponse,
        { status: err.status >= 500 ? 502 : err.status, headers: corsHeaders(request) }
      );
    }

    return Response.json(
      { error: 'internal_error', message: err instanceof Error ? err.message : 'Unknown error' } as SaveResponse,
      { status: 500, headers: corsHeaders(request) }
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
