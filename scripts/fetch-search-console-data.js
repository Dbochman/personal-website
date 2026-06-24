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
import {
  FRESHNESS_LOOKBACK_DAYS,
  HISTORY_RETENTION_DAYS,
  SEARCH_ANALYTICS_PAGE_SIZE,
  SEARCH_WINDOW_DAYS,
  addDays,
  aggregateRows,
  buildDateRange,
  buildDetailCoverage,
  buildRollingHistory,
  fetchAllRows,
  formatDateInTimeZone,
  resolveLatestFinalDate,
} from './search-console-utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HISTORY_FILE = path.join(__dirname, '../docs/metrics/search-console-history.json');
const SITE_URL = 'sc-domain:dylanbochman.com'; // or 'https://dylanbochman.com'

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
  updateMetricsSummary(dataEntry.summary, dataEntry.collectedAt ?? dataEntry.timestamp);
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

    const query = (params) => searchconsole.searchanalytics.query(params);
    const collectedAt = new Date().toISOString();
    const todayInPacific = formatDateInTimeZone(new Date());
    const freshnessRange = buildDateRange(todayInPacific, FRESHNESS_LOOKBACK_DAYS);

    // Search Console exposes the first incomplete date only for fresh data
    // grouped by date. Use it to choose the newest fully finalized day.
    const freshnessResponse = await query({
      siteUrl: SITE_URL,
      requestBody: {
        startDate: freshnessRange.start,
        endDate: freshnessRange.end,
        dataState: 'all',
        dimensions: ['date'],
        rowLimit: SEARCH_ANALYTICS_PAGE_SIZE,
      },
    });
    const latestFinalDate = resolveLatestFinalDate(freshnessResponse.data);
    const reportingPeriod = buildDateRange(latestFinalDate, SEARCH_WINDOW_DAYS);

    console.log(
      `📊 Fetching finalized Search Console data from ${reportingPeriod.start} to ${reportingPeriod.end}...`
    );

    // Fetch enough finalized daily totals to rebuild one year of exact rolling
    // seven-day summaries. Date-only grouping provides authoritative totals.
    const firstHistoryEndDate = addDays(latestFinalDate, -(HISTORY_RETENTION_DAYS - 1));
    const dailyHistoryStartDate = addDays(firstHistoryEndDate, -(SEARCH_WINDOW_DAYS - 1));
    const dailyRowsPromise = fetchAllRows({
      query,
      siteUrl: SITE_URL,
      requestBody: {
        startDate: dailyHistoryStartDate,
        endDate: latestFinalDate,
        dataState: 'final',
      },
      dimensions: ['date'],
    });

    // Query and page dimensions must be fetched independently. Combining them
    // makes each row a query/page pair and biases both top-ten lists.
    const detailRequest = {
      startDate: reportingPeriod.start,
      endDate: reportingPeriod.end,
      dataState: 'final',
    };
    const queryRowsPromise = fetchAllRows({
      query,
      siteUrl: SITE_URL,
      requestBody: detailRequest,
      dimensions: ['query'],
    });
    const pageRowsPromise = fetchAllRows({
      query,
      siteUrl: SITE_URL,
      requestBody: detailRequest,
      dimensions: ['page'],
    });

    const [dailyRows, queryRows, pageRows] = await Promise.all([
      dailyRowsPromise,
      queryRowsPromise,
      pageRowsPromise,
    ]);
    const history = buildRollingHistory({
      dailyRows,
      latestFinalDate,
    });
    const dataEntry = history[history.length - 1];

    if (!dataEntry) {
      throw new Error('Could not build Search Console history from finalized data');
    }

    dataEntry.collectedAt = collectedAt;
    dataEntry.detailCoverage = {
      queries: buildDetailCoverage(queryRows, dataEntry.summary.totalImpressions),
      pages: buildDetailCoverage(pageRows, dataEntry.summary.totalImpressions),
    };
    dataEntry.topQueries = aggregateRows(queryRows, 0, 'query').slice(0, 10);
    dataEntry.topPages = aggregateRows(pageRows, 0, 'page').slice(0, 10);

    // Replace the legacy fresh/eight-day snapshots with a deterministic year
    // of finalized, exact seven-day windows.
    writeHistory(history);

    console.log('✅ Search Console data saved to history');
    console.log(
      `📈 Clicks: ${dataEntry.summary.totalClicks}, ` +
      `Impressions: ${dataEntry.summary.totalImpressions}, ` +
      `Avg Position: ${dataEntry.summary.averagePosition}`
    );
    console.log(
      `🔎 Detail coverage: ${dataEntry.detailCoverage.queries.impressionShare}% queries, ` +
      `${dataEntry.detailCoverage.pages.impressionShare}% pages`
    );
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
