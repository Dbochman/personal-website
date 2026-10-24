import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';

// Place fixtures under the repo so the generator resolves its declared js-yaml.
const root = new URL('../../', import.meta.url);
function check(mutate) {
  const fixture = mkdtempSync(new URL('.workflow-test-', root));
  try {
    cpSync(new URL('../security/', import.meta.url), join(fixture, 'security'), { recursive: true });
    cpSync(new URL('../workflows/', import.meta.url), join(fixture, 'workflows'), { recursive: true });
    const path = join(fixture, 'workflows/pr-checks.yml');
    writeFileSync(path, mutate(readFileSync(path, 'utf8')));
    return spawnSync(process.execPath, [join(fixture, 'security/sync-workflows.mjs'), '--check'], { encoding: 'utf8' });
  } finally {
    rmSync(fixture, { recursive: true });
  }
}

test('current required-check trigger passes', () => {
  const result = check(text => text);
  assert.equal(result.status, 0, result.stderr);
});

for (const [name, mutate] of [
  ['path exclusions', text => text.replace('    branches: [main]', "    branches: [main]\n    paths-ignore: ['docs/**']")],
  ['missing reopened event', text => text.replace('synchronize, reopened, closed', 'synchronize, closed')],
  ['renamed required check', text => text.replace('  test:\n', '  test:\n    name: renamed\n')],
  ['allowed failure', text => text.replace('  test:\n', '  test:\n    continue-on-error: true\n')],
]) {
  test(`rejects ${name}`, () => {
    const result = check(mutate);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Required test check/);
  });
}

for (const [name, mutate] of [
  ['repository permission', text => text.replace('permissions: {}', 'permissions: {contents: read}')],
  ['job permission', text => text.replace('  test:\n', '  test:\n    permissions: {contents: write}\n')],
  ['environment secrets', text => text.replace('  test:\n', '  test:\n    environment: production\n')],
  ['secret expression', text => text.replace('    env:\n', '    env:\n      TOKEN: ${{ secrets.DEPLOY_TOKEN }}\n')],
  ['JavaScript action', text => text + '\n      - uses: actions/checkout@v7\n'],
  ['unbounded timeout', text => text.replace('    timeout-minutes: 30', '    timeout-minutes: 360')],
  ['approval from event instead of operator', text => text.replace('vars.PR_339_APPROVED_HEAD', 'github.event.pull_request.head.sha')],
]) {
  test(`exception rejects ${name}`, () => {
    const result = check(mutate);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /PR exception requires/);
  });
}

test('functional tests cannot be removed to obtain a passing exception run', () => {
  const result = check(text => text.replace('        run: npm run typecheck', '        run: echo skipped'));
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Missing required PR validation/);
});

test('functional tests cannot be skipped or allowed to fail', () => {
  for (const flag of ['if: false', 'continue-on-error: true']) {
    const result = check(text => text.replace('      - name: Type check\n', `      - name: Type check\n        ${flag}\n`));
    assert.notEqual(result.status, 0);
  }
});

test('only PR checks embeds exception policy; deployment remains strict', () => {
  const deploy = readFileSync(new URL('../workflows/deploy.yml', import.meta.url), 'utf8');
  assert.ok(!deploy.includes('allow_pr_validation_exception'));
  assert.ok(deploy.includes('              main()'));
  const pr = readFileSync(new URL('../workflows/pr-checks.yml', import.meta.url), 'utf8');
  assert.ok(pr.includes('main(exception=allow_pr_validation_exception)'));
  assert.ok(!pr.includes('uses:'));
});
