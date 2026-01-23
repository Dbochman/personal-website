/**
 * GitHub API utilities for atomic multi-file commits
 * Uses the Trees API for single-commit multi-file updates
 */

export interface Env {
  GITHUB_PAT: string;
}

const REPO_OWNER = 'Dbochman';
const REPO_NAME = 'personal-website';
const GITHUB_API = 'https://api.github.com';

interface TreeItem {
  path: string;
  mode: '100644' | '100755' | '040000' | '160000' | '120000';
  type: 'blob' | 'tree' | 'commit';
  sha?: string | null; // null to delete
  content?: string;
}

interface GitHubError {
  message: string;
  status?: number;
}

/**
 * Make authenticated GitHub API request
 */
async function githubFetch(
  endpoint: string,
  env: Env,
  options: RequestInit = {}
): Promise<Response> {
  const response = await fetch(`${GITHUB_API}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${env.GITHUB_PAT}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json; charset=utf-8',
      'User-Agent': 'kanban-save-worker',
      'X-GitHub-Api-Version': '2022-11-28',
      ...options.headers,
    },
  });
  return response;
}

/**
 * Get the current HEAD SHA of the main branch
 */
export async function getHeadSha(env: Env): Promise<string> {
  const response = await githubFetch(
    `/repos/${REPO_OWNER}/${REPO_NAME}/git/ref/heads/main`,
    env
  );

  if (!response.ok) {
    const error = (await response.json()) as GitHubError;
    throw new GitHubApiError('Failed to get HEAD SHA', response.status, error.message);
  }

  const data = (await response.json()) as { object: { sha: string } };
  return data.object.sha;
}

/**
 * Get file content from the repository
 */
export async function getFileContent(
  path: string,
  env: Env
): Promise<{ content: string; sha: string } | null> {
  const response = await githubFetch(
    `/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`,
    env
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const error = (await response.json()) as GitHubError;
    throw new GitHubApiError(`Failed to get file: ${path}`, response.status, error.message);
  }

  const data = (await response.json()) as { content: string; sha: string; encoding: string };

  if (data.encoding !== 'base64') {
    throw new GitHubApiError(`Unexpected encoding: ${data.encoding}`, 400);
  }

  return {
    content: atob(data.content.replace(/\n/g, '')),
    sha: data.sha,
  };
}

/**
 * Get a directory listing from the repository
 */
export async function getDirectoryContents(
  path: string,
  env: Env
): Promise<Array<{ name: string; path: string; sha: string; type: string }>> {
  const response = await githubFetch(
    `/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`,
    env
  );

  if (response.status === 404) {
    return [];
  }

  if (!response.ok) {
    const error = (await response.json()) as GitHubError;
    throw new GitHubApiError(`Failed to list directory: ${path}`, response.status, error.message);
  }

  const data = (await response.json()) as Array<{
    name: string;
    path: string;
    sha: string;
    type: string;
  }>;

  return data;
}

/**
 * Create a blob in the repository
 */
async function createBlob(content: string, env: Env): Promise<string> {
  const response = await githubFetch(
    `/repos/${REPO_OWNER}/${REPO_NAME}/git/blobs`,
    env,
    {
      method: 'POST',
      body: JSON.stringify({
        content,
        encoding: 'utf-8',
      }),
    }
  );

  if (!response.ok) {
    const error = (await response.json()) as GitHubError;
    throw new GitHubApiError('Failed to create blob', response.status, error.message);
  }

  const data = (await response.json()) as { sha: string };
  return data.sha;
}

/**
 * Create a tree with the specified changes
 */
async function createTree(
  baseTreeSha: string,
  items: TreeItem[],
  env: Env
): Promise<string> {
  const response = await githubFetch(
    `/repos/${REPO_OWNER}/${REPO_NAME}/git/trees`,
    env,
    {
      method: 'POST',
      body: JSON.stringify({
        base_tree: baseTreeSha,
        tree: items,
      }),
    }
  );

  if (!response.ok) {
    const error = (await response.json()) as GitHubError;
    throw new GitHubApiError('Failed to create tree', response.status, error.message);
  }

  const data = (await response.json()) as { sha: string };
  return data.sha;
}

/**
 * Create a commit with the specified tree
 */
async function createCommit(
  treeSha: string,
  parentSha: string,
  message: string,
  env: Env
): Promise<string> {
  const response = await githubFetch(
    `/repos/${REPO_OWNER}/${REPO_NAME}/git/commits`,
    env,
    {
      method: 'POST',
      body: JSON.stringify({
        message,
        tree: treeSha,
        parents: [parentSha],
      }),
    }
  );

  if (!response.ok) {
    const error = (await response.json()) as GitHubError;
    throw new GitHubApiError('Failed to create commit', response.status, error.message);
  }

  const data = (await response.json()) as { sha: string };
  return data.sha;
}

/**
 * Update the main branch ref to point to a new commit
 * Uses compare-and-swap semantics - fails with 409 if HEAD has moved
 */
async function updateRef(newSha: string, expectedSha: string, env: Env): Promise<void> {
  // First, get current SHA to do compare-and-swap
  const currentSha = await getHeadSha(env);

  if (currentSha !== expectedSha) {
    throw new GitHubApiError(
      'Concurrent modification detected',
      409,
      `Expected HEAD ${expectedSha} but found ${currentSha}`
    );
  }

  const response = await githubFetch(
    `/repos/${REPO_OWNER}/${REPO_NAME}/git/refs/heads/main`,
    env,
    {
      method: 'PATCH',
      body: JSON.stringify({
        sha: newSha,
        force: false, // Don't force - reject if not fast-forward
      }),
    }
  );

  if (!response.ok) {
    const error = (await response.json()) as GitHubError;

    // GitHub returns 422 if the update is not a fast-forward
    if (response.status === 422) {
      throw new GitHubApiError('Concurrent modification detected', 409, error.message);
    }

    throw new GitHubApiError('Failed to update ref', response.status, error.message);
  }
}

/**
 * Get the tree SHA for a commit
 */
async function getCommitTree(commitSha: string, env: Env): Promise<string> {
  const response = await githubFetch(
    `/repos/${REPO_OWNER}/${REPO_NAME}/git/commits/${commitSha}`,
    env
  );

  if (!response.ok) {
    const error = (await response.json()) as GitHubError;
    throw new GitHubApiError('Failed to get commit', response.status, error.message);
  }

  const data = (await response.json()) as { tree: { sha: string } };
  return data.tree.sha;
}

/**
 * Commit multiple files atomically using the Trees API
 * Returns the new commit SHA
 */
export async function commitFilesAtomic(
  files: Array<{ path: string; content: string }>,
  deletions: string[],
  message: string,
  parentSha: string,
  env: Env
): Promise<string> {
  // Get the tree SHA for the parent commit
  const baseTreeSha = await getCommitTree(parentSha, env);

  // Build tree items for files to add/update
  // Use inline content instead of creating separate blobs to avoid
  // hitting Cloudflare Workers' 50 subrequest limit
  const treeItems: TreeItem[] = files.map((file) => ({
    path: file.path,
    mode: '100644' as const,
    type: 'blob' as const,
    content: file.content,
  }));

  // Add deletions (sha: null removes the file)
  for (const path of deletions) {
    treeItems.push({
      path,
      mode: '100644',
      type: 'blob',
      sha: null,
    });
  }

  // Create the new tree
  const newTreeSha = await createTree(baseTreeSha, treeItems, env);

  // Create the commit
  const newCommitSha = await createCommit(newTreeSha, parentSha, message, env);

  // Update the ref with compare-and-swap
  await updateRef(newCommitSha, parentSha, env);

  return newCommitSha;
}

/**
 * Trigger a repository dispatch event
 */
export async function triggerDispatch(eventType: string, env: Env): Promise<void> {
  const response = await githubFetch(
    `/repos/${REPO_OWNER}/${REPO_NAME}/dispatches`,
    env,
    {
      method: 'POST',
      body: JSON.stringify({
        event_type: eventType,
        client_payload: {},
      }),
    }
  );

  // 204 is success for dispatches
  if (!response.ok && response.status !== 204) {
    const error = (await response.json()) as GitHubError;
    throw new GitHubApiError('Failed to trigger dispatch', response.status, error.message);
  }
}

/**
 * Custom error class for GitHub API errors
 */
export class GitHubApiError extends Error {
  status: number;
  details?: string;

  constructor(message: string, status: number, details?: string) {
    super(message);
    this.name = 'GitHubApiError';
    this.status = status;
    this.details = details;
  }
}
