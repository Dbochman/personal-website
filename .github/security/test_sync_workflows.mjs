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
