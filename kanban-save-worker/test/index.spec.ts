import { env, fetchMock, SELF } from 'cloudflare:test';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import worker from '../src/index';

const origin = 'https://app.test';
const repo = '/repos/fixture-owner/fixture-repo';
const head = 'a'.repeat(40);

beforeAll(() => {
  fetchMock.activate();
  fetchMock.disableNetConnect();
});

afterEach(() => {
  fetchMock.assertNoPendingInterceptors();
});

async function signIn() {
  await env.SESSIONS.put('test-session', JSON.stringify({
    githubUsername: 'fixture-owner', accessToken: 'test-only-token', createdAt: Date.now(),
  }));
  return { Cookie: 'session=test-session', Origin: origin, 'Content-Type': 'application/json' };
}

function github(path: string, data: unknown, method = 'GET', status = 200) {
  return fetchMock.get('https://api.github.com')
    .intercept({ path: `${repo}${path}`, method })
    .reply(status, JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
}

describe('routing and CORS', () => {
  it('returns 404 for an unknown route through the handler', async () => {
    const response = await worker.fetch(new Request('https://worker.test/'), env);
    expect(response.status).toBe(404);
    expect(await response.text()).toBe('Not found');
  });

  it('returns 404 through the Worker entry point', async () => {
    const response = await SELF.fetch('https://worker.test/missing');
    expect(response.status).toBe(404);
    expect(await response.text()).toBe('Not found');
  });

  it('allows preflight from a configured origin', async () => {
    const response = await SELF.fetch('https://worker.test/save', {
      method: 'OPTIONS', headers: { Origin: origin },
    });
    expect(response.status).toBe(200);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(origin);
    expect(response.headers.get('Access-Control-Allow-Credentials')).toBe('true');
    expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
    expect(await response.text()).toBe('');
  });

  it('does not grant CORS access to an untrusted origin', async () => {
    const response = await SELF.fetch('https://worker.test/save', {
      method: 'OPTIONS', headers: { Origin: 'https://untrusted.test' },
    });
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(origin);
  });
});

describe('sessions and OAuth', () => {
  it('reports an anonymous session', async () => {
    const response = await SELF.fetch('https://worker.test/auth/status');
    expect(await response.json()).toEqual({ authenticated: false, username: null });
  });

  it('reports a stored session and deletes it on logout', async () => {
    const headers = await signIn();
    const status = await SELF.fetch('https://worker.test/auth/status', { headers });
    expect(await status.json()).toEqual({ authenticated: true, username: 'fixture-owner' });
    const logout = await SELF.fetch('https://worker.test/auth/logout', { headers });
    expect(await logout.json()).toEqual({ success: true });
    expect(logout.headers.get('Set-Cookie')).toContain('Max-Age=0');
    expect(await env.SESSIONS.get('test-session')).toBeNull();
  });

  it.each([
    ['https://app.test/projects/kanban?board=roadmap', 'https://app.test/projects/kanban?board=roadmap'],
    ['https://app.test.untrusted.test/steal', 'https://app.test/projects/kanban'],
  ])('validates the OAuth return origin: %s', async (returnTo, expectedReturn) => {
    const response = await SELF.fetch(`https://worker.test/auth/login?return_to=${encodeURIComponent(returnTo)}`, { redirect: 'manual' });
    expect(response.status).toBe(302);
    const location = new URL(response.headers.get('Location')!);
    expect(location.origin + location.pathname).toBe('https://github.com/login/oauth/authorize');
    expect(location.searchParams.get('redirect_uri')).toBe('https://worker.test/auth/callback');
    const state = location.searchParams.get('state');
    expect(state).toBeTruthy();
    expect(response.headers.get('Set-Cookie')).toContain(`oauth_state=${state}|${expectedReturn}; HttpOnly; Secure;`);
  });

  it('rejects an OAuth state mismatch before exchanging credentials', async () => {
    const response = await SELF.fetch('https://worker.test/auth/callback?code=test-code&state=wrong', {
      redirect: 'manual', headers: { Cookie: `oauth_state=expected|${origin}/projects/kanban` },
    });
    expect(response.status).toBe(302);
    expect(new URL(response.headers.get('Location')!).searchParams.get('auth_error')).toBe('State mismatch');
  });
});

describe('board requests', () => {
  it.each(['/boards', '/save'])('rejects unauthenticated writes to %s', async (path) => {
    for (const Cookie of ['', 'session=nonexistent']) {
      const response = await SELF.fetch(`https://worker.test${path}`, { method: 'POST', headers: { Cookie } });
      expect(response.status).toBe(401);
      expect(await response.json()).toMatchObject({ error: 'not_authenticated' });
    }
  });

  it.each(['/boards', '/save'])('rejects malformed JSON on %s', async (path) => {
    const response = await SELF.fetch(`https://worker.test${path}`, {
      method: 'POST', headers: await signIn(), body: '{',
    });
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: 'invalid_json' });
  });

  it.each([
    [{ id: '../escape', title: 'Board' }, 'invalid_board_id'],
    [{ id: 'board', title: '' }, 'invalid_title'],
    [{ id: 'board', title: 'Board', columns: [] }, 'invalid_columns'],
  ])('rejects invalid board creation payloads: %j', async (payload, error) => {
    const response = await SELF.fetch('https://worker.test/boards', {
      method: 'POST', headers: await signIn(), body: JSON.stringify(payload),
    });
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error });
  });

  it.each([null, [], { boardId: 'roadmap', headCommitSha: head, board: { columns: [{}] } }])('rejects malformed save payloads: %j', async (payload) => {
    const response = await SELF.fetch('https://worker.test/save', {
      method: 'POST', headers: await signIn(), body: JSON.stringify(payload),
    });
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: 'invalid_payload' });
  });

  it('reads a precompiled board with its current revision', async () => {
    const board = { id: 'roadmap', title: 'Roadmap', columns: [] };
    github('/git/ref/heads/main', { object: { sha: head } });
    github('/contents/src/generated/kanban/roadmap.js', {
      content: btoa(`export const board = ${JSON.stringify(board)};`), sha: 'file-sha', encoding: 'base64',
    });
    const response = await SELF.fetch('https://worker.test/board/roadmap');
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ board, headCommitSha: head, precompiled: true });
  });

  it('creates a board through an atomic GitHub commit', async () => {
    github('/contents/content/kanban/new-board/_board.md', {}, 'GET', 404);
    github('/git/ref/heads/main', { object: { sha: head } }).times(2);
    github(`/git/commits/${head}`, { tree: { sha: 'base-tree' } });
    fetchMock.get('https://api.github.com').intercept({
      path: `${repo}/git/trees`, method: 'POST',
      body: (body) => {
        const payload = JSON.parse(body);
        expect(payload.base_tree).toBe('base-tree');
        expect(payload.tree).toHaveLength(1);
        expect(payload.tree[0].path).toBe('content/kanban/new-board/_board.md');
        expect(payload.tree[0].content).toContain('id: new-board');
        expect(payload.tree[0].content).toContain('New board');
        return true;
      },
    }).reply(201, { sha: 'new-tree' });
    github('/git/commits', { sha: 'new-commit' }, 'POST', 201);
    github('/git/refs/heads/main', { object: { sha: 'new-commit' } }, 'PATCH');
    github('/dispatches', {}, 'POST');
    const response = await SELF.fetch('https://worker.test/boards', {
      method: 'POST', headers: await signIn(), body: JSON.stringify({ id: 'new-board', title: 'New board' }),
    });
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ success: true, boardId: 'new-board', newHeadSha: 'new-commit' });
  });
});
