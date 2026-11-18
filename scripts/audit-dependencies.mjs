import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export const PICOMATCH_EXCEPTION = Object.freeze({
  advisory: 'https://github.com/advisories/GHSA-fc5q-39xc-vjpf',
  version: '4.0.5',
  startsAt: Date.parse('2026-11-18T00:00:00Z'),
  expiresAt: Date.parse('2026-11-25T00:00:00Z'),
});

// Freeze the reviewed application/tooling inputs for this short-lived exception.
// Generated content is included: changed content requires review too. The audit
// policy itself is reviewed separately and excluded to avoid a self-hash cycle.
export function reviewScopeDigest(paths, readFile) {
  const hash = createHash('sha256');
  for (const path of [...paths].sort()) {
    hash.update(path + '\0');
    hash.update(createHash('sha256').update(readFile(path)).digest('hex') + '\0');
  }
  return hash.digest('hex');
}

export function currentReviewScope() {
  const files = spawnSync('git', ['ls-files', '-z', '--',
    'src', 'scripts', '*.config.*', 'package.json', 'package-lock.json',
    'index.html', 'tsconfig*.json', 'netlify.toml', 'content', 'public',
  ], { encoding: 'utf8' });
  if (files.error || files.status !== 0) throw new Error('Cannot verify reviewed source scope');
  const paths = files.stdout.split('\0').filter(path => path && path !== 'scripts/audit-dependencies.mjs');
  if (!paths.length) throw new Error('Empty reviewed source scope');
  return reviewScopeDigest(paths, path => readFileSync(path));
}

function picomatchScopeVerified() {
  const review = JSON.parse(readFileSync('.github/security/picomatch-review.json', 'utf8'));
  return /^[a-f0-9]{64}$/.test(review.scopeSha256) && currentReviewScope() === review.scopeSha256;
}

// GHSA-g3hv-75wg-m249 describes firstPhasePreProcess(optimizationLevel >= 2).
// ESLint's minimatch 3.1.4 has neither that function nor that option. The
// advisory's broad <11.0.1 range also flags this unrelated legacy implementation.
// Match only that advisory and exact installed/locked version; no severity skips.
export function reviewAudit(report, lock, installedVersion, { now = Date.now(), scopeVerified = false } = {}) {
  if (!report || report.error || !report.vulnerabilities || !report.metadata?.vulnerabilities) {
    throw new Error('Missing or failed npm audit report');
  }
  const rejected = new Set();
  const accepted = new Set();
  const exceptions = new Set();
  let advisoryCount = 0;
  for (const [name, finding] of Object.entries(report.vulnerabilities)) {
    for (const advisory of finding.via) {
      if (typeof advisory === 'string') {
        if (!report.vulnerabilities[advisory]) throw new Error(`Missing transitive finding: ${advisory}`);
        continue;
      }
      advisoryCount++;
      const legacyOnly = name === 'minimatch'
        && advisory.url === 'https://github.com/advisories/GHSA-g3hv-75wg-m249'
        && finding.nodes.length > 0
        && finding.nodes.every(node => lock.packages[node]?.version === '3.1.4'
          && installedVersion(node) === '3.1.4');
      const message = `${name}: ${advisory.title} (${advisory.url})`;
      const temporaryPicomatch = name === 'picomatch'
        && advisory.url === PICOMATCH_EXCEPTION.advisory
        && now >= PICOMATCH_EXCEPTION.startsAt && now < PICOMATCH_EXCEPTION.expiresAt
        && scopeVerified === true
        && finding.nodes.length === 1 && finding.nodes[0] === 'node_modules/picomatch'
        && lock.packages['node_modules/picomatch']?.version === PICOMATCH_EXCEPTION.version
        && installedVersion('node_modules/picomatch') === PICOMATCH_EXCEPTION.version;
      (legacyOnly ? accepted : temporaryPicomatch ? exceptions : rejected).add(message);
    }
  }
  if (report.metadata.vulnerabilities.total > 0 && advisoryCount === 0) {
    throw new Error('Audit reported vulnerabilities without reviewable advisories');
  }
  return { rejected: [...rejected], accepted: [...accepted], exceptions: [...exceptions] };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const audit = spawnSync('npm', ['audit', '--json'], { encoding: 'utf8', timeout: 180_000, maxBuffer: 10_000_000 });
    if (audit.error || ![0, 1].includes(audit.status)) throw new Error('npm audit failed to run');
    const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'));
    const result = reviewAudit(JSON.parse(audit.stdout), lock, node => {
      if (!/^node_modules\/(?:[@a-zA-Z0-9_.-]+\/)*(?:minimatch|picomatch)$/.test(node)) return null;
      return JSON.parse(readFileSync(`${node}/package.json`, 'utf8')).version;
    }, { scopeVerified: picomatchScopeVerified() });
    for (const item of result.accepted) console.log(`Reviewed non-applicable legacy finding: ${item}`);
    for (const item of result.rejected) console.error(`Unresolved advisory: ${item}`);
    for (const item of result.exceptions) console.log(`Temporary exposure-reviewed exception (expires 2026-11-25T00:00:00Z): ${item}`);
    console.log(`Dependency audit: ${result.rejected.length} unresolved, ${result.accepted.length} reviewed non-applicable finding(s), ${result.exceptions.length} temporary exception(s).`);
    process.exitCode = result.rejected.length ? 1 : 0;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
