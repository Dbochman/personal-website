import assert from 'node:assert/strict';
import { test } from 'node:test';
import { reviewAudit } from '../../scripts/audit-dependencies.mjs';

function fixture(version = '3.1.4', url = 'https://github.com/advisories/GHSA-g3hv-75wg-m249') {
  return {
    report: { metadata: { vulnerabilities: { total: 2 } }, vulnerabilities: {
      minimatch: { via: [{ url, title: 'Pattern amplification' }], nodes: ['node_modules/minimatch'] },
      eslint: { via: ['minimatch'], nodes: ['node_modules/eslint'] },
    } },
    lock: { packages: { 'node_modules/minimatch': { version } } },
  };
}
test('accepts only the reviewed advisory on the exact installed and locked legacy version', () => {
  const { report, lock } = fixture();
  const result = reviewAudit(report, lock, () => '3.1.4');
  assert.equal(result.rejected.length, 0);
  assert.equal(result.accepted.length, 1);
});
test('fails on affected modern versions, new advisories, or installed/locked mismatches', () => {
  for (const [version, url, installed] of [
    ['10.2.6', undefined, '10.2.6'],
    ['3.1.4', 'https://github.com/advisories/a-new-advisory', '3.1.4'],
    ['3.1.4', undefined, '3.1.5'],
  ]) {
    const { report, lock } = fixture(version, url);
    assert.equal(reviewAudit(report, lock, () => installed).rejected.length, 1);
  }
});
test('fails closed on missing, failed, or incomplete audit results', () => {
  for (const report of [null, { error: {} }, {
    vulnerabilities: {}, metadata: { vulnerabilities: { total: 1 } },
  }]) assert.throws(() => reviewAudit(report, {}, () => '3.1.4'));
});
