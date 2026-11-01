import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { load } from 'js-yaml';

const script = fileURLToPath(new URL('../../scripts/publish-metrics.sh', import.meta.url));
function fixture() {
  const directory = mkdtempSync(join(tmpdir(), 'metrics-publisher-'));
  const cwd = join(directory, 'source');
  const remote = join(directory, 'remote.git');
  const bin = join(directory, 'bin');
  mkdirSync(cwd); mkdirSync(bin);
  function git(...args) {
    const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    return result.stdout.trim();
  }
  git('init', '--bare', remote);
  git('init', '-b', 'main');
  git('config', 'user.email', 'test@example.invalid');
  git('config', 'user.name', 'Test');
  mkdirSync(join(cwd, 'docs/metrics'), { recursive: true });
  writeFileSync(join(cwd, 'docs/metrics/latest.json'), '{}\n');
  git('add', '.'); git('commit', '-m', 'Initial');
  git('remote', 'add', 'origin', remote); git('push', 'origin', 'main');
  const initial = git('rev-parse', 'HEAD');
  const calls = join(directory, 'gh-calls');
  writeFileSync(join(bin, 'gh'), `#!/usr/bin/env bash
printf '%s\\n' "$*" >> "$TEST_CALLS"
if [[ "$1 $2" == 'pr create' ]]; then
  echo 'https://github.com/example/site/pull/1'
fi
`, { mode: 0o755 });
  return {
    cwd, git, initial,
    change(file = 'docs/metrics/latest.json') { writeFileSync(join(cwd, file), '{"updated":true}\n'); },
    run() { return spawnSync('bash', [script], {
      cwd, encoding: 'utf8', env: { ...process.env, PATH: `${bin}:${process.env.PATH}`,
        GH_TOKEN: 'fixture-only', GITHUB_REPOSITORY: 'example/site',
        GITHUB_RUN_ID: '123', GITHUB_RUN_ATTEMPT: '1', TEST_CALLS: calls },
    }); },
    calls() { return readFileSync(calls, 'utf8'); },
    cleanup() { rmSync(directory, { recursive: true, force: true }); },
  };
}

test('publishes a metrics-only PR and requests protected auto-merge, leaving main untouched', () => {
  const f = fixture();
  try {
    f.change();
    const result = f.run();
    assert.equal(result.status, 0, result.stderr);
    assert.equal(f.git('rev-parse', 'origin/main'), f.initial);
    assert.equal(f.git('diff', '--name-only', 'origin/main', 'origin/automation/metrics-123-1'), 'docs/metrics/latest.json');
    assert.match(f.calls(), /pr create .*--base main --head automation\/metrics-123-1/);
    assert.match(f.calls(), /pr merge .*--auto --squash --match-head-commit [0-9a-f]{40}/);
    assert.doesNotMatch(f.calls(), /--admin/);
  } finally { f.cleanup(); }
});

test('unchanged reports do not create branches or PRs', () => {
  const f = fixture();
  try {
    assert.equal(f.run().status, 0);
    assert.equal(f.git('branch', '--show-current'), 'main');
    assert.equal(f.git('rev-parse', 'HEAD'), f.initial);
  } finally { f.cleanup(); }
});

test('rejects staged code and non-JSON metrics before pushing', () => {
  for (const file of ['unexpected.js', 'docs/metrics/unexpected.sh']) {
    const f = fixture();
    try {
      f.change(); f.change(file); f.git('add', file);
      const result = f.run();
      assert.notEqual(result.status, 0);
      assert.match(result.stderr, /Refusing to publish a non-metrics change/);
      assert.equal(f.git('branch', '--show-current'), 'main');
    } finally { f.cleanup(); }
  }
});

test('daily and manual exports all use the checked publishing path', () => {
  for (const file of ['daily-analytics.yml', 'ga4-export.yml', 'search-console.yml']) {
    const text = readFileSync(new URL(`../workflows/${file}`, import.meta.url), 'utf8');
    const workflow = load(text);
    const job = Object.values(workflow.jobs).find(job => job.steps.some(s => s.run === 'bash scripts/publish-metrics.sh'));
    assert.ok(job, file);
    assert.equal(job.steps.find(s => s.name === 'Checkout repository').with.token, '${{ secrets.DEPLOY_TOKEN }}');
    assert.equal(job.steps.find(s => s.run === 'bash scripts/publish-metrics.sh').env.GH_TOKEN, '${{ secrets.DEPLOY_TOKEN }}');
    assert.equal(workflow.concurrency.group, 'analytics-publishing');
    assert.doesNotMatch(text, /git push/);
  }
});
