/**
 * Save Lighthouse scores to historical tracking file
 *
 * This script reads the latest Lighthouse report and appends
 * the scores to docs/metrics/lighthouse-history.json for trend tracking.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HISTORY_FILE = path.join(__dirname, '../docs/metrics/lighthouse-history.json');
const LIGHTHOUSE_REPORT = path.join(__dirname, '../lighthouse-report.json');

async function saveLighthouseScores() {
  try {
    // Check if Lighthouse report exists
    if (!fs.existsSync(LIGHTHOUSE_REPORT)) {
      console.log('⚠️  No Lighthouse report found, skipping score tracking');
      return;
    }

    // Read Lighthouse report
    const reportData = JSON.parse(fs.readFileSync(LIGHTHOUSE_REPORT, 'utf8'));

    // Extract scores
    const scores = {
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
      performance: Math.round((reportData.categories?.performance?.score ?? 0) * 100),
      accessibility: Math.round((reportData.categories?.accessibility?.score ?? 0) * 100),
      bestPractices: Math.round((reportData.categories?.['best-practices']?.score ?? 0) * 100),
      seo: Math.round((reportData.categories?.seo?.score ?? 0) * 100),
      pwa: Math.round((reportData.categories?.pwa?.score ?? 0) * 100),
      // Core Web Vitals
      coreWebVitals: {
        lcp: reportData.audits?.['largest-contentful-paint']?.numericValue ?? 0,
        fid: reportData.audits?.['max-potential-fid']?.numericValue ?? 0,
        cls: reportData.audits?.['cumulative-layout-shift']?.numericValue ?? 0,
        fcp: reportData.audits?.['first-contentful-paint']?.numericValue ?? 0,
        tti: reportData.audits?.['interactive']?.numericValue ?? 0,
        tbt: reportData.audits?.['total-blocking-time']?.numericValue ?? 0,
        speedIndex: reportData.audits?.['speed-index']?.numericValue ?? 0,
      },
      // Metadata
      url: reportData.finalUrl || reportData.requestedUrl,
      userAgent: reportData.userAgent,
      fetchTime: reportData.fetchTime,
    };

    // Read existing history
    let history = [];
    if (fs.existsSync(HISTORY_FILE)) {
      history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
    }

    // Append new scores
    history.push(scores);

    // Keep only last 100 entries to avoid file bloat
    if (history.length > 100) {
      history = history.slice(-100);
    }

    // Write updated history
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));

    console.log('✅ Lighthouse scores saved to history');
    console.log(`📊 Performance: ${scores.performance}, SEO: ${scores.seo}, Accessibility: ${scores.accessibility}`);
    console.log(`📈 Total historical entries: ${history.length}`);

  } catch (error) {
    console.error('❌ Error saving Lighthouse scores:', error.message);
    // Don't fail the build if score tracking fails
    process.exit(0);
  }
}

saveLighthouseScores();
