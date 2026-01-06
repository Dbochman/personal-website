/**
 * Generate latest metrics summary
 *
 * Creates docs/metrics/latest.json with the most recent scores
 * from all monitoring sources for easy at-a-glance viewing.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HISTORY_FILE = path.join(__dirname, '../docs/metrics/lighthouse-history.json');
const OUTPUT_FILE = path.join(__dirname, '../docs/metrics/latest.json');

function generateSummary() {
  try {
    const summary = {
      generated: new Date().toISOString(),
      lighthouse: null,
      seo: null,
      analytics: null,
    };

    // Get latest Lighthouse scores
    if (fs.existsSync(HISTORY_FILE)) {
      const history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
      if (history.length > 0) {
        const latest = history[history.length - 1];
        summary.lighthouse = {
          date: latest.date,
          scores: {
            performance: latest.performance,
            accessibility: latest.accessibility,
            bestPractices: latest.bestPractices,
            seo: latest.seo,
          },
          coreWebVitals: latest.coreWebVitals,
        };
      }
    }

    // Placeholder for SEO data (will be populated by weekly workflow)
    summary.seo = {
      note: "Populated by weekly SEO check workflow",
      lastCheck: null,
      mobilePerformance: null,
      desktopPerformance: null,
      seoScore: null,
    };

    // Placeholder for Search Console data (will be populated by weekly workflow)
    summary.searchConsole = {
      note: "Populated by weekly Search Console workflow",
      lastCheck: null,
      clicks: null,
      impressions: null,
      averageCTR: null,
      averagePosition: null,
    };

    // Placeholder for Analytics data (will be populated by GA4 workflow)
    summary.analytics = {
      note: "Will be populated by GA4 Data API when configured",
      pageviews_7d: null,
      sessions_7d: null,
      topPages: [],
    };

    // Write summary
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(summary, null, 2));
    console.log('✅ Metrics summary generated at docs/metrics/latest.json');

  } catch (error) {
    console.error('❌ Error generating metrics summary:', error.message);
    process.exit(0);
  }
}

generateSummary();
