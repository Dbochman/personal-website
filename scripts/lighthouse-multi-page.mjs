#!/usr/bin/env node
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFileSync, mkdirSync, readFileSync } from 'fs';
import { dirname } from 'path';

const execAsync = promisify(exec);

const BASE_URL = process.env.BASE_URL || 'https://dylanbochman.com';

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
  console.log(`\n🔦 Running Lighthouse on ${url}...`);

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

function extractScores(reportPath) {
  try {
    const report = JSON.parse(readFileSync(reportPath, 'utf8'));
    return {
      performance: Math.round((report.categories?.performance?.score ?? 0) * 100),
      accessibility: Math.round((report.categories?.accessibility?.score ?? 0) * 100),
      seo: Math.round((report.categories?.seo?.score ?? 0) * 100),
      bestPractices: Math.round((report.categories?.['best-practices']?.score ?? 0) * 100),
      lcp: report.audits?.['largest-contentful-paint']?.displayValue || 'N/A',
      fcp: report.audits?.['first-contentful-paint']?.displayValue || 'N/A',
      cls: report.audits?.['cumulative-layout-shift']?.displayValue || 'N/A',
      tbt: report.audits?.['total-blocking-time']?.displayValue || 'N/A'
    };
  } catch (error) {
    console.error(`❌ Failed to read report:`, error.message);
    return null;
  }
}

async function main() {
  console.log('🚀 Starting multi-page Lighthouse audit...\n');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Testing ${PAGES.length} pages...\n`);

  // Create reports directory
  const reportsDir = 'lighthouse-reports';
  mkdirSync(reportsDir, { recursive: true });

  const results = [];

  for (const page of PAGES) {
    const reportPath = `${reportsDir}/lighthouse-${page.name}.json`;
    const success = await runLighthouse(page.url, reportPath);

    if (success) {
      const scores = extractScores(reportPath);
      if (scores) {
        results.push({
          page: page.name,
          url: page.url,
          ...scores
        });

        console.log(`✅ ${page.name}:`);
        console.log(`   Performance: ${scores.performance}`);
        console.log(`   Accessibility: ${scores.accessibility}`);
        console.log(`   SEO: ${scores.seo}`);
        console.log(`   Best Practices: ${scores.bestPractices}`);
        console.log(`   LCP: ${scores.lcp}, FCP: ${scores.fcp}`);
      }
    }
  }

  // Save summary
  const summaryPath = `${reportsDir}/summary.json`;
  writeFileSync(summaryPath, JSON.stringify(results, null, 2));
  console.log(`\n📊 Summary saved to ${summaryPath}`);

  // Print summary table
  console.log('\n📋 Performance Summary:');
  console.log('┌─────────────────┬──────┬──────┬─────┬───────┐');
  console.log('│ Page            │ Perf │ A11y │ SEO │ Best  │');
  console.log('├─────────────────┼──────┼──────┼─────┼───────┤');
  results.forEach(r => {
    const page = r.page.padEnd(15);
    const perf = String(r.performance).padStart(4);
    const a11y = String(r.accessibility).padStart(4);
    const seo = String(r.seo).padStart(3);
    const best = String(r.bestPractices).padStart(5);
    console.log(`│ ${page} │ ${perf} │ ${a11y} │ ${seo} │ ${best} │`);
  });
  console.log('└─────────────────┴──────┴──────┴─────┴───────┘');

  // Check for failures
  const failures = results.filter(r =>
    r.performance < 50 || r.accessibility < 95 || r.seo < 90 || r.bestPractices < 90
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
