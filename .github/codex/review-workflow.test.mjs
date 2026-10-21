import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { load } from 'js-yaml';

const workflow = load(readFileSync(new URL('../workflows/codex-review.yml', import.meta.url), 'utf8'));
const AsyncFunction = Object.getPrototypeOf(async function() {}).constructor;
const publishScript = workflow.jobs.publish.steps.find(step => step.name === 'Publish review or explicit infrastructure failure').with.script;
const goodReport = {
  summary: 'Example change', review: 'No findings', verdict: 'LGTM', execution: 'verified',
  commands: ['node', 'diff', 'typecheck', 'unit'].map(kind => ({ kind, command: `check ${kind}`, exit_code: 0 })),
};

async function publish(report, result = 'success') {
  const comments = [];
  const failures = [];
  await new AsyncFunction('process', 'github', 'context', 'core', publishScript)(
    { env: { REVIEW_RESULT: result, REVIEW_REPORT: typeof report === 'string' ? report : JSON.stringify(report) } },
    { rest: { issues: { createComment: async comment => comments.push(comment) } } },
    { repo: { owner: 'owner', repo: 'repo' }, issue: { number: 123 }, runId: 456 },
    { setFailed: message => failures.push(message) },
  );
  assert.equal(comments.length, 1);
  return { body: comments[0].body, failures };
}

test('publishes complete command evidence and execution logs', async () => {
  const result = await publish(goodReport);
  assert.deepEqual(result.failures, []);
  assert.match(result.body, /Execution:\*\* verified/);
  assert.match(result.body, /check unit — exit 0/);
  assert.match(result.body, /actions\/runs\/456/);
});

test('sandbox failure cannot publish LGTM or pass the execution check', async () => {
  const result = await publish({ ...goodReport, execution: 'unavailable', commands: [] });
  assert.equal(result.failures.length, 1);
  assert.match(result.body, /Needs Discussion/);
  assert.doesNotMatch(result.body, /Verdict:\*\* LGTM/);
});

for (const [name, report] of [
  ['invalid JSON', 'not JSON'],
  ['missing commands', { ...goodReport, commands: [] }],
  ['partial commands', { ...goodReport, commands: goodReport.commands.slice(0, 1) }],
  ['invalid exit code', { ...goodReport, commands: [{ kind: 'node', command: 'node --version', exit_code: null }] }],
]) {
  test(`rejects ${name}`, async () => {
    const result = await publish(report);
    assert.equal(result.failures.length, 1);
    assert.match(result.body, /No approval was produced/);
  });
}

test('action failure is explicit even when it produced a partial report', async () => {
  const result = await publish(goodReport, 'failure');
  assert.equal(result.failures.length, 1);
  assert.match(result.body, /Codex review job failed/);
});

test('test failures remain visible findings rather than sandbox failures', async () => {
  const result = await publish({ ...goodReport, verdict: 'Needs Changes',
    commands: goodReport.commands.map(c => ({ ...c, exit_code: c.kind === 'unit' ? 1 : 0 })),
  });
  assert.deepEqual(result.failures, []);
  assert.match(result.body, /Needs Changes/);
  assert.match(result.body, /check unit — exit 1/);
});

test('model text is data, never evaluated as shell or JavaScript', async () => {
  const text = '$(touch /tmp/not-executed) `${throw new Error("not code")}`';
  const result = await publish({ ...goodReport, review: text });
  assert.deepEqual(result.failures, []);
  assert.ok(result.body.includes(text));
});

test('review and publishing privileges are isolated', () => {
  assert.deepEqual(workflow.permissions, { contents: 'read' });
  assert.deepEqual(workflow.jobs.publish.permissions, { 'pull-requests': 'write' });
  assert.ok(!workflow.jobs.publish.steps.some(s => s.uses?.startsWith('actions/checkout@')));
  const action = workflow.jobs.review.steps.at(-1);
  assert.match(action.uses, /^openai\/codex-action@[a-f0-9]{40}$/);
  assert.equal(action.with['safety-strategy'], 'drop-sudo');
  assert.equal(action.with.sandbox, 'workspace-write');
  const checkout = workflow.jobs.review.steps.find(s => s.name === 'Checkout');
  assert.equal(checkout.with['persist-credentials'], false);
  assert.match(workflow.jobs.review.if, /head.repo.full_name == github.repository/);
});

test('trusted actor gate rejects read-only contributors before checkout', async () => {
  const script = workflow.jobs.review.steps.find(step => step.uses?.startsWith('actions/github-script@')).with.script;
  const execute = permission => new AsyncFunction('github', 'context', script)(
    { rest: { repos: { getCollaboratorPermissionLevel: async () => ({ data: { permission } }) } } },
    { repo: { owner: 'owner', repo: 'repo' }, actor: 'contributor' },
  );
  await execute('write');
  await assert.rejects(execute('read'), /write access/);
});

test('workflow shell steps have valid Bash syntax', () => {
  for (const step of workflow.jobs.review.steps.filter(s => s.run)) {
    // No synchronous stdio pipes: restricted Linux sandboxes can reject their
    // socket operations. -c supplies the script without waiting for stdin EOF.
    const result = spawnSync('bash', ['-n', '-c', step.run], { stdio: 'inherit', timeout: 5000 });
    assert.ifError(result.error);
    assert.equal(result.status, 0, step.name);
  }
});
