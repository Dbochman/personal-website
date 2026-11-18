import assert from 'node:assert/strict';
import { test } from 'node:test';
import { reviewAudit, reviewScopeDigest, PICOMATCH_EXCEPTION } from '../../scripts/audit-dependencies.mjs';

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

function picomatchFixture() {
  return {
    report: { metadata: { vulnerabilities: { total: 1 } }, vulnerabilities: {
      picomatch: { via: [{ url: PICOMATCH_EXCEPTION.advisory, title: 'Repeated extglob ReDoS' }], nodes: ['node_modules/picomatch'] },
    } },
    lock: { packages: { 'node_modules/picomatch': { version: '4.0.5' } } },
  };
}
const reviewed = { now: Date.parse('2026-11-18T12:00:00Z'), scopeVerified: true };

test('temporarily accepts only the reviewed picomatch finding, separately from false positives', () => {
  const { report, lock } = picomatchFixture();
  const result = reviewAudit(report, lock, () => '4.0.5', reviewed);
  assert.equal(result.exceptions.length, 1);
  assert.equal(result.accepted.length, 0);
  assert.equal(result.rejected.length, 0);
});
test('exception fails closed before review, at expiry, with invalid clocks, or without verified scope', () => {
  const { report, lock } = picomatchFixture();
  for (const options of [
    { ...reviewed, now: PICOMATCH_EXCEPTION.startsAt - 1 },
    { ...reviewed, now: PICOMATCH_EXCEPTION.expiresAt },
    { ...reviewed, now: PICOMATCH_EXCEPTION.expiresAt + 1 },
    { ...reviewed, now: NaN },
    { ...reviewed, scopeVerified: false },
    { now: reviewed.now },
  ]) assert.equal(reviewAudit(report, lock, () => '4.0.5', options).rejected.length, 1);
  assert.equal(reviewAudit(report, lock, () => '4.0.5', {
    ...reviewed, now: PICOMATCH_EXCEPTION.expiresAt - 1,
  }).exceptions.length, 1);
});
test('exception rejects changed versions, installed/lock mismatches, nested or missing nodes, and new advisories', () => {
  for (const mutate of [
    ({ lock }) => { lock.packages['node_modules/picomatch'].version = '4.0.7'; },
    ({ report }) => { report.vulnerabilities.picomatch.nodes = []; },
    ({ report }) => { report.vulnerabilities.picomatch.nodes.push('node_modules/tool/node_modules/picomatch'); },
    ({ report }) => { report.vulnerabilities.picomatch.nodes = ['node_modules/tool/node_modules/picomatch']; },
    ({ report }) => { report.vulnerabilities.picomatch.via[0].url += '-different'; },
  ]) {
    const fixture = picomatchFixture();
    mutate(fixture);
    assert.equal(reviewAudit(fixture.report, fixture.lock, () => '4.0.5', reviewed).rejected.length, 1);
  }
  const { report, lock } = picomatchFixture();
  assert.equal(reviewAudit(report, lock, () => '4.0.7', reviewed).rejected.length, 1);
  report.vulnerabilities.picomatch.via.push({ url: 'https://github.com/advisories/new-finding', title: 'New finding' });
  const result = reviewAudit(report, lock, () => '4.0.5', reviewed);
  assert.equal(result.exceptions.length, 1);
  assert.equal(result.rejected.length, 1);
});
test('review digest detects additions, removals, renames, and content changes independent of file order', () => {
  const content = { 'vite.config.ts': 'config', 'package-lock.json': 'lock' };
  const paths = Object.keys(content);
  const original = reviewScopeDigest(paths, path => content[path]);
  assert.equal(reviewScopeDigest([...paths].reverse(), path => content[path]), original);
  assert.notEqual(reviewScopeDigest([...paths, 'src/new.ts'], path => content[path] ?? 'new'), original);
  assert.notEqual(reviewScopeDigest(paths.slice(1), path => content[path]), original);
  assert.notEqual(reviewScopeDigest(['renamed.ts', paths[1]], path => content[path] ?? 'config'), original);
  assert.notEqual(reviewScopeDigest(paths, path => content[path] + 'changed'), original);
  assert.throws(() => reviewScopeDigest(paths, () => { throw new Error('Missing file'); }));
});
