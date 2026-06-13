#!/usr/bin/env node
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFileSync, mkdirSync, readFileSync, copyFileSync, rmSync } from 'fs';

const execAsync = promisify(exec);

const BASE_URL = process.env.BASE_URL || 'https://dylanbochman.com';

// Lighthouse scores from a single run swing 10-15 points on shared CI
// hardware (CPU contention skews TBT and LCP most). Running each page a few
// times and keeping the median run damps that noise. Override with
// LIGHTHOUSE_RUNS=1 for a fast local check.
const RUNS = Math.max(1, Number(process.env.LIGHTHOUSE_RUNS || 3));

// Pages to test
const PAGES = [
  { name: 'home', url: BASE_URL },
  { name: 'blog', url: `${BASE_URL}/blog` },
  { name: 'blog-post-404', url: `${BASE_URL}/blog/2026-01-08-fixing-404-errors-on-github-pages-spas` },
  { name: 'projects', url: `${BASE_URL}/projects` },
  { name: 'project-slo', url: `${BASE_URL}/projects/slo-tool` },
  { name: 'project-statuspage', url: `${BASE_URL}/projects/statuspage-update` },
  { name: 'project-oncall', url: `${BASE_URL}/projects/oncall-coverage` },
  { name: 'runbook', url: `${BASE_URL}/runbook` }
];

async function runLighthouse(url, outputPath) {
  try {
    await execAsync(
      `npx lighthouse "${url}" --output=json --output-path="${outputPath}" --chrome-flags='--headless' --quiet`
    );
    return true;
  } catch (error) {
    console.error(`❌ Failed to run Lighthouse on ${url}:`, error.message);
    return false;
  }
}

// Pull both the human-readable display values (for the dashboard) and the
// raw numeric values (for median selection and spread) out of one report.
function extractRun(reportPath) {
  try {
    const report = JSON.parse(readFileSync(reportPath, 'utf8'));
    const cat = report.categories || {};
    const audits = report.audits || {};
    return {
      performance: Math.round((cat.performance?.score ?? 0) * 100),
      accessibility: Math.round((cat.accessibility?.score ?? 0) * 100),
      seo: Math.round((cat.seo?.score ?? 0) * 100),
      bestPractices: Math.round((cat['best-practices']?.score ?? 0) * 100),
      lcp: audits['largest-contentful-paint']?.displayValue || 'N/A',
      fcp: audits['first-contentful-paint']?.displayValue || 'N/A',
      cls: audits['cumulative-layout-shift']?.displayValue || 'N/A',
      tbt: audits['total-blocking-time']?.displayValue || 'N/A',
      // numeric (ms) for selection + spread; null if the audit didn't run
      lcpMs: audits['largest-contentful-paint']?.numericValue ?? null,
      tbtMs: audits['total-blocking-time']?.numericValue ?? null
    };
  } catch (error) {
    console.error(`❌ Failed to read report:`, error.message);
    return null;
  }
}

function median(nums) {
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// Pick a single representative run rather than synthesizing per-metric medians
// (which would describe a run that never happened). The run whose performance
// score is closest to the median is the headline-stable choice; ties break on
// the run closest to the median LCP. With RUNS=3 this is simply the middle run.
function pickRepresentativeIndex(runs) {
  const medPerf = median(runs.map(r => r.performance));
  const medLcp = median(runs.map(r => r.lcpMs ?? Infinity));

  let bestIdx = 0;
  let best = { perfDist: Infinity, lcpDist: Infinity };
  runs.forEach((r, i) => {
    const perfDist = Math.abs(r.performance - medPerf);
    const lcpDist = Math.abs((r.lcpMs ?? Infinity) - medLcp);
    if (perfDist < best.perfDist || (perfDist === best.perfDist && lcpDist < best.lcpDist)) {
      bestIdx = i;
      best = { perfDist, lcpDist };
    }
  });
  return bestIdx;
}

async function auditPage(page, reportsDir) {
  const canonicalPath = `${reportsDir}/lighthouse-${page.name}.json`;
  const runs = [];
  const runPaths = [];

  for (let i = 0; i < RUNS; i++) {
    const runPath = RUNS === 1 ? canonicalPath : `${reportsDir}/lighthouse-${page.name}-run${i + 1}.json`;
    process.stdout.write(`\n🔦 ${page.name} (run ${i + 1}/${RUNS}) ${page.url} ... `);
    const success = await runLighthouse(page.url, runPath);
    if (!success) continue;
    const run = extractRun(runPath);
    if (!run) continue;
    runs.push(run);
    runPaths.push(runPath);
    process.stdout.write(`perf ${run.performance}, lcp ${run.lcp}, tbt ${run.tbt}`);
  }

  if (runs.length === 0) {
    console.log(`\n⚠️  ${page.name}: all runs failed`);
    return null;
  }

  const repIdx = pickRepresentativeIndex(runs);
  const rep = runs[repIdx];

  // Keep the representative run's full report under the canonical name; drop
  // the per-run temp files so only one report per page is committed.
  if (RUNS > 1) {
    copyFileSync(runPaths[repIdx], canonicalPath);
    for (const p of runPaths) {
      if (p !== canonicalPath) rmSync(p, { force: true });
    }
  }

  const perfs = runs.map(r => r.performance);
  const tbts = runs.map(r => r.tbtMs).filter(v => v != null);

  console.log(`\n✅ ${page.name}: perf ${rep.performance} (median of ${runs.length}), lcp ${rep.lcp}`);

  return {
    page: page.name,
    url: page.url,
    performance: rep.performance,
    accessibility: rep.accessibility,
    seo: rep.seo,
    bestPractices: rep.bestPractices,
    lcp: rep.lcp,
    fcp: rep.fcp,
    cls: rep.cls,
    tbt: rep.tbt,
    // Sampling metadata: lets the dashboard show how noisy each number is
    // instead of presenting one run as if it were precise.
    runs: runs.length,
    performanceRange: [Math.min(...perfs), Math.max(...perfs)],
    tbtRangeMs: tbts.length ? [Math.round(Math.min(...tbts)), Math.round(Math.max(...tbts))] : null
  };
}

async function main() {
  console.log('🚀 Starting multi-page Lighthouse audit...\n');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Testing ${PAGES.length} pages, ${RUNS} run(s) each (median)...\n`);

  const reportsDir = 'lighthouse-reports';
  mkdirSync(reportsDir, { recursive: true });

  const results = [];
  for (const page of PAGES) {
    const result = await auditPage(page, reportsDir);
    if (result) results.push(result);
  }

  const summaryPath = `${reportsDir}/summary.json`;
  writeFileSync(summaryPath, JSON.stringify(results, null, 2));
  console.log(`\n📊 Summary saved to ${summaryPath}`);

  // Print summary table
  console.log('\n📋 Performance Summary (median run):');
  console.log('┌─────────────────┬──────┬─────────┬──────┬─────┬───────┐');
  console.log('│ Page            │ Perf │ Range   │ A11y │ SEO │ Best  │');
  console.log('├─────────────────┼──────┼─────────┼──────┼─────┼───────┤');
  results.forEach(r => {
    const page = r.page.padEnd(15);
    const perf = String(r.performance).padStart(4);
    const range = `${r.performanceRange[0]}-${r.performanceRange[1]}`.padStart(7);
    const a11y = String(r.accessibility).padStart(4);
    const seo = String(r.seo).padStart(3);
    const best = String(r.bestPractices).padStart(5);
    console.log(`│ ${page} │ ${perf} │ ${range} │ ${a11y} │ ${seo} │ ${best} │`);
  });
  console.log('└─────────────────┴──────┴─────────┴──────┴─────┴───────┘');

  // Check for failures (based on the representative run)
  const failures = results.filter(r =>
    r.performance < 50 || r.accessibility < 90 || r.seo < 90 || r.bestPractices < 90
  );

  if (failures.length > 0) {
    console.log('\n❌ Some pages failed thresholds:');
    failures.forEach(f => {
      console.log(`   - ${f.page}: ${f.url}`);
    });
    process.exit(1);
  }

  console.log('\n✅ All pages passed thresholds!');
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
