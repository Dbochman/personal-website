import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

// GHSA-g3hv-75wg-m249 describes firstPhasePreProcess(optimizationLevel >= 2).
// ESLint's minimatch 3.1.4 has neither that function nor that option. The
// advisory's broad <11.0.1 range also flags this unrelated legacy implementation.
// Match only that advisory and exact installed/locked version; no severity skips.
export function reviewAudit(report, lock, installedVersion) {
  if (!report || report.error || !report.vulnerabilities || !report.metadata?.vulnerabilities) {
    throw new Error('Missing or failed npm audit report');
  }
  const rejected = new Set();
  const accepted = new Set();
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
      (legacyOnly ? accepted : rejected).add(message);
    }
  }
  if (report.metadata.vulnerabilities.total > 0 && advisoryCount === 0) {
    throw new Error('Audit reported vulnerabilities without reviewable advisories');
  }
  return { rejected: [...rejected], accepted: [...accepted] };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const audit = spawnSync('npm', ['audit', '--json'], { encoding: 'utf8', timeout: 180_000, maxBuffer: 10_000_000 });
    if (audit.error || ![0, 1].includes(audit.status)) throw new Error('npm audit failed to run');
    const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'));
    const result = reviewAudit(JSON.parse(audit.stdout), lock, node => {
      if (!/^node_modules\/(?:[@a-zA-Z0-9_.-]+\/)*minimatch$/.test(node)) return null;
      return JSON.parse(readFileSync(`${node}/package.json`, 'utf8')).version;
    });
    for (const item of result.accepted) console.log(`Reviewed non-applicable legacy finding: ${item}`);
    for (const item of result.rejected) console.error(`Unresolved advisory: ${item}`);
    console.log(`Dependency audit: ${result.rejected.length} unresolved, ${result.accepted.length} reviewed non-applicable finding(s).`);
    process.exitCode = result.rejected.length ? 1 : 0;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
