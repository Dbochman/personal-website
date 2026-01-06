/**
 * SEO Metrics Check Script
 *
 * This script fetches and displays PageSpeed Insights metrics for the website.
 * Run with: npx tsx scripts/check-seo-metrics.ts
 *
 * Requirements: npm install -D tsx
 */

import { getPageSpeedMetrics, isPageSpeedError, assessCoreWebVitals } from '../src/lib/pageSpeedInsights';

const SITE_URL = 'https://dylanbochman.com';

async function main() {
  console.log('🔍 Fetching SEO and Performance Metrics...\n');
  console.log(`URL: ${SITE_URL}\n`);

  // Fetch metrics for both mobile and desktop
  const [mobileResult, desktopResult] = await Promise.all([
    getPageSpeedMetrics(SITE_URL, 'mobile'),
    getPageSpeedMetrics(SITE_URL, 'desktop'),
  ]);

  // Check for errors
  if (isPageSpeedError(mobileResult)) {
    console.error('❌ Mobile Error:', mobileResult.message);
    process.exit(1);
  }

  if (isPageSpeedError(desktopResult)) {
    console.error('❌ Desktop Error:', desktopResult.message);
    process.exit(1);
  }

  // Display Mobile Metrics
  console.log('📱 MOBILE METRICS');
  console.log('─'.repeat(50));
  console.log(`Performance:     ${getScoreEmoji(mobileResult.performance)} ${mobileResult.performance}/100`);
  console.log(`Accessibility:   ${getScoreEmoji(mobileResult.accessibility)} ${mobileResult.accessibility}/100`);
  console.log(`Best Practices:  ${getScoreEmoji(mobileResult.bestPractices)} ${mobileResult.bestPractices}/100`);
  console.log(`SEO:             ${getScoreEmoji(mobileResult.seo)} ${mobileResult.seo}/100`);
  console.log();

  // Display Mobile Core Web Vitals
  const mobileAssessment = assessCoreWebVitals(mobileResult.coreWebVitals);
  console.log('Core Web Vitals (Mobile):');
  console.log(`  LCP: ${getVitalEmoji(mobileAssessment.lcp)} ${Math.round(mobileResult.coreWebVitals.lcp)}ms (${mobileAssessment.lcp})`);
  console.log(`  FID: ${getVitalEmoji(mobileAssessment.fid)} ${Math.round(mobileResult.coreWebVitals.fid)}ms (${mobileAssessment.fid})`);
  console.log(`  CLS: ${getVitalEmoji(mobileAssessment.cls)} ${mobileResult.coreWebVitals.cls.toFixed(3)} (${mobileAssessment.cls})`);
  if (mobileResult.coreWebVitals.inp && mobileAssessment.inp) {
    console.log(`  INP: ${getVitalEmoji(mobileAssessment.inp)} ${Math.round(mobileResult.coreWebVitals.inp)}ms (${mobileAssessment.inp})`);
  }
  console.log(`  FCP: ${Math.round(mobileResult.coreWebVitals.fcp)}ms`);
  console.log(`  TTFB: ${Math.round(mobileResult.coreWebVitals.ttfb)}ms`);
  console.log();

  // Display Desktop Metrics
  console.log('💻 DESKTOP METRICS');
  console.log('─'.repeat(50));
  console.log(`Performance:     ${getScoreEmoji(desktopResult.performance)} ${desktopResult.performance}/100`);
  console.log(`Accessibility:   ${getScoreEmoji(desktopResult.accessibility)} ${desktopResult.accessibility}/100`);
  console.log(`Best Practices:  ${getScoreEmoji(desktopResult.bestPractices)} ${desktopResult.bestPractices}/100`);
  console.log(`SEO:             ${getScoreEmoji(desktopResult.seo)} ${desktopResult.seo}/100`);
  console.log();

  // Display Desktop Core Web Vitals
  const desktopAssessment = assessCoreWebVitals(desktopResult.coreWebVitals);
  console.log('Core Web Vitals (Desktop):');
  console.log(`  LCP: ${getVitalEmoji(desktopAssessment.lcp)} ${Math.round(desktopResult.coreWebVitals.lcp)}ms (${desktopAssessment.lcp})`);
  console.log(`  FID: ${getVitalEmoji(desktopAssessment.fid)} ${Math.round(desktopResult.coreWebVitals.fid)}ms (${desktopAssessment.fid})`);
  console.log(`  CLS: ${getVitalEmoji(desktopAssessment.cls)} ${desktopResult.coreWebVitals.cls.toFixed(3)} (${desktopAssessment.cls})`);
  if (desktopResult.coreWebVitals.inp && desktopAssessment.inp) {
    console.log(`  INP: ${getVitalEmoji(desktopAssessment.inp)} ${Math.round(desktopResult.coreWebVitals.inp)}ms (${desktopAssessment.inp})`);
  }
  console.log(`  FCP: ${Math.round(desktopResult.coreWebVitals.fcp)}ms`);
  console.log(`  TTFB: ${Math.round(desktopResult.coreWebVitals.ttfb)}ms`);
  console.log();

  // Summary
  const avgPerformance = Math.round((mobileResult.performance + desktopResult.performance) / 2);
  const avgSEO = Math.round((mobileResult.seo + desktopResult.seo) / 2);

  console.log('📊 SUMMARY');
  console.log('─'.repeat(50));
  console.log(`Average Performance: ${getScoreEmoji(avgPerformance)} ${avgPerformance}/100`);
  console.log(`Average SEO Score:   ${getScoreEmoji(avgSEO)} ${avgSEO}/100`);
  console.log();
  console.log(`Tested at: ${mobileResult.fetchTime}`);
}

function getScoreEmoji(score: number): string {
  if (score >= 90) return '🟢';
  if (score >= 50) return '🟡';
  return '🔴';
}

function getVitalEmoji(assessment: 'good' | 'needs-improvement' | 'poor'): string {
  if (assessment === 'good') return '🟢';
  if (assessment === 'needs-improvement') return '🟡';
  return '🔴';
}

// Run the script
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
