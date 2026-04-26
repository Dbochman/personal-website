/**
 * Fetch Google Search Console data
 *
 * This script fetches search performance data from Google Search Console API
 * and saves it to docs/metrics/search-console-history.json for tracking SEO visibility.
 *
 * Required environment variables:
 * - SEARCH_CONSOLE_CREDENTIALS: Base64-encoded service account JSON credentials
 *
 * Setup instructions:
 * 1. Go to https://console.cloud.google.com/
 * 2. Create a new project or select existing
 * 3. Enable "Google Search Console API"
 * 4. Create a service account and download JSON key
 * 5. In Search Console (https://search.google.com/search-console), add the service account email as a user
 * 6. Base64 encode the JSON key: cat service-account.json | base64
 * 7. Add to GitHub secrets as SEARCH_CONSOLE_CREDENTIALS
 */

import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HISTORY_FILE = path.join(__dirname, '../docs/metrics/search-console-history.json');
const SITE_URL = 'sc-domain:dylanbochman.com'; // or 'https://dylanbochman.com'
const DATA_STATE = 'all'; // fresher data, may include low-volume queries hidden by 'final'

function round(value, decimals) {
  const multiplier = 10 ** decimals;
  return Math.round(value * multiplier) / multiplier;
}

function asPercent(ctrRatio) {
  return round((ctrRatio || 0) * 100, 2);
}

function weightedAveragePosition(entries) {
  const weightedTotal = entries.reduce((sum, entry) => {
    const impressions = entry.impressions || 0;
    return sum + ((entry.position || 0) * impressions);
  }, 0);
  const impressionsTotal = entries.reduce((sum, entry) => sum + (entry.impressions || 0), 0);

  return impressionsTotal > 0
    ? round(weightedTotal / impressionsTotal, 1)
    : 0;
}

function summarizeRows(rows) {
  const clicks = rows.reduce((sum, row) => sum + (row.clicks || 0), 0);
  const impressions = rows.reduce((sum, row) => sum + (row.impressions || 0), 0);

  return {
    clicks,
    impressions,
    ctr: impressions > 0 ? clicks / impressions : 0,
    position: weightedAveragePosition(rows),
  };
}

function aggregateRows(rows, keyIndex, label) {
  const byKey = new Map();

  for (const row of rows) {
    const key = row.keys?.[keyIndex];
    if (!key) continue;

    const current = byKey.get(key) ?? {
      [label]: key,
      clicks: 0,
      impressions: 0,
      weightedPosition: 0,
    };

    current.clicks += row.clicks || 0;
    current.impressions += row.impressions || 0;
    current.weightedPosition += (row.position || 0) * (row.impressions || 0);
    byKey.set(key, current);
  }

  return Array.from(byKey.values())
    .map(({ weightedPosition, ...entry }) => ({
      ...entry,
      ctr: entry.impressions > 0 ? entry.clicks / entry.impressions : 0,
      position: entry.impressions > 0 ? round(weightedPosition / entry.impressions, 1) : 0,
    }))
    .sort((a, b) => (
      b.clicks - a.clicks ||
      b.impressions - a.impressions ||
      a.position - b.position
    ));
}

function readHistory() {
  if (!fs.existsSync(HISTORY_FILE)) {
    return [];
  }

  return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
}

function writeHistory(history) {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
}

function updateMetricsSummaryFromEntry(dataEntry) {
  updateMetricsSummary(dataEntry.summary, dataEntry.timestamp);
}

async function fetchSearchConsoleData() {
  try {
    // Check for credentials
    if (!process.env.SEARCH_CONSOLE_CREDENTIALS) {
      throw new Error('Missing SEARCH_CONSOLE_CREDENTIALS environment variable');
    }

    // Decode and parse credentials
    const credentials = JSON.parse(
      Buffer.from(process.env.SEARCH_CONSOLE_CREDENTIALS, 'base64').toString('utf-8')
    );

    // Initialize Google Auth
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    });

    const searchconsole = google.searchconsole({
      version: 'v1',
      auth: await auth.getClient(),
    });

    // Get data for last 7 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const formatDate = (date) => date.toISOString().split('T')[0];

    console.log(`📊 Fetching Search Console data from ${formatDate(startDate)} to ${formatDate(endDate)}...`);

    const commonRequest = {
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      dataState: DATA_STATE,
    };

    // Fetch authoritative summary metrics separately from dimensional rows.
    const summaryResponse = await searchconsole.searchanalytics.query({
      siteUrl: SITE_URL,
      requestBody: commonRequest,
    });

    // Fetch dimensional rows for top queries/pages.
    const detailResponse = await searchconsole.searchanalytics.query({
      siteUrl: SITE_URL,
      requestBody: {
        ...commonRequest,
        dimensions: ['query', 'page'],
        rowLimit: 100,
      },
    });

    // Extract metrics
    const rows = detailResponse.data.rows || [];
    const summaryRow = summaryResponse.data.rows?.[0];
    const rowSummary = summarizeRows(rows);
    const totalClicks = summaryRow?.clicks ?? rowSummary.clicks;
    const totalImpressions = summaryRow?.impressions ?? rowSummary.impressions;
    const avgCTR = summaryRow?.ctr ?? rowSummary.ctr;
    const avgPosition = summaryRow?.position ?? rowSummary.position;

    // Get top queries and pages
    const topQueries = aggregateRows(rows, 0, 'query').slice(0, 10);
    const topPagesArray = aggregateRows(rows, 1, 'page').slice(0, 10);

    // Create data entry
    const dataEntry = {
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
      period: {
        start: formatDate(startDate),
        end: formatDate(endDate),
      },
      summary: {
        totalClicks,
        totalImpressions,
        averageCTR: asPercent(avgCTR),
        averagePosition: round(avgPosition, 1),
      },
      topQueries,
      topPages: topPagesArray,
    };

    // Read existing history
    let history = readHistory();

    const existingIndex = history.findIndex(entry => entry.date === dataEntry.date);
    if (existingIndex !== -1) {
      history[existingIndex] = dataEntry;
      console.log(`📝 Updated existing entry for ${dataEntry.date}`);
    } else {
      history.push(dataEntry);
    }

    // Keep only last 52 entries (1 year of weekly data)
    if (history.length > 52) {
      history = history.slice(-52);
    }

    // Write updated history
    writeHistory(history);

    console.log('✅ Search Console data saved to history');
    console.log(`📈 Clicks: ${totalClicks}, Impressions: ${totalImpressions}, Avg Position: ${round(avgPosition, 1)}`);
    console.log(`📊 Total historical entries: ${history.length}`);

    // Update the metrics summary
    updateMetricsSummaryFromEntry(dataEntry);

  } catch (error) {
    console.error('❌ Error fetching Search Console data:', error.message);

    if (error.code === 401 || error.code === 403) {
      console.error(`💡 Re-add the service account from SEARCH_CONSOLE_CREDENTIALS to the Search Console property ${SITE_URL}`);
      console.error('💡 In Search Console: Settings > Users and permissions > Add user');
    } else if (error.code === 404) {
      console.error(`💡 Make sure the property ${SITE_URL} exists in Search Console and the service account has access`);
    } else if (error instanceof SyntaxError) {
      console.error('💡 SEARCH_CONSOLE_CREDENTIALS is not valid base64-encoded JSON');
    }

    process.exit(1);
  }
}

function updateMetricsSummary(searchData, lastCheck = new Date().toISOString()) {
  const SUMMARY_FILE = path.join(__dirname, '../docs/metrics/latest.json');

  try {
    let summary = { generated: new Date().toISOString() };

    if (fs.existsSync(SUMMARY_FILE)) {
      summary = JSON.parse(fs.readFileSync(SUMMARY_FILE, 'utf8'));
    }

    summary.searchConsole = {
      lastCheck,
      clicks: searchData.totalClicks,
      impressions: searchData.totalImpressions,
      averageCTR: searchData.averageCTR,
      averagePosition: searchData.averagePosition,
    };

    summary.generated = new Date().toISOString();

    fs.writeFileSync(SUMMARY_FILE, JSON.stringify(summary, null, 2));
    console.log('✅ Updated metrics summary with Search Console data');
  } catch (error) {
    console.error('⚠️  Could not update metrics summary:', error.message);
  }
}

function updateMetricsSummaryOnly() {
  const history = readHistory();
  const latest = history[history.length - 1];

  if (!latest) {
    throw new Error('No Search Console history entries found');
  }

  updateMetricsSummaryFromEntry(latest);
}

if (process.argv.includes('--update-summary-only')) {
  try {
    updateMetricsSummaryOnly();
  } catch (error) {
    console.error('❌ Error updating Search Console summary:', error.message);
    process.exit(1);
  }
} else {
  fetchSearchConsoleData();
}
