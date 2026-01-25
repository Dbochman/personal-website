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

async function fetchSearchConsoleData() {
  try {
    // Check for credentials
    if (!process.env.SEARCH_CONSOLE_CREDENTIALS) {
      console.log('⚠️  No Search Console credentials found, skipping');
      console.log('💡 To enable: Set SEARCH_CONSOLE_CREDENTIALS environment variable');
      return;
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

    // Fetch search analytics data
    const response = await searchconsole.searchanalytics.query({
      siteUrl: SITE_URL,
      requestBody: {
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        dimensions: ['query', 'page'],
        rowLimit: 100,
        dataState: 'all', // fresher data, may include low-volume queries hidden by 'final'
      },
    });

    // Extract metrics
    const rows = response.data.rows || [];
    const totalClicks = rows.reduce((sum, row) => sum + (row.clicks || 0), 0);
    const totalImpressions = rows.reduce((sum, row) => sum + (row.impressions || 0), 0);
    const avgPosition = rows.length > 0
      ? rows.reduce((sum, row) => sum + (row.position || 0), 0) / rows.length
      : 0;
    const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

    // Get top queries and pages
    const topQueries = rows
      .filter(row => row.keys && row.keys[0])
      .sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
      .slice(0, 10)
      .map(row => ({
        query: row.keys[0],
        clicks: row.clicks || 0,
        impressions: row.impressions || 0,
        ctr: row.ctr || 0,
        position: row.position || 0,
      }));

    const topPages = rows
      .filter(row => row.keys && row.keys[1])
      .reduce((acc, row) => {
        const page = row.keys[1];
        if (!acc[page]) {
          acc[page] = { page, clicks: 0, impressions: 0 };
        }
        acc[page].clicks += row.clicks || 0;
        acc[page].impressions += row.impressions || 0;
        return acc;
      }, {});

    const topPagesArray = Object.values(topPages)
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10);

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
        averageCTR: Math.round(avgCTR * 100) / 100,
        averagePosition: Math.round(avgPosition * 10) / 10,
      },
      topQueries,
      topPages: topPagesArray,
    };

    // Read existing history
    let history = [];
    if (fs.existsSync(HISTORY_FILE)) {
      history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
    }

    // Append new data
    history.push(dataEntry);

    // Keep only last 52 entries (1 year of weekly data)
    if (history.length > 52) {
      history = history.slice(-52);
    }

    // Write updated history
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));

    console.log('✅ Search Console data saved to history');
    console.log(`📈 Clicks: ${totalClicks}, Impressions: ${totalImpressions}, Avg Position: ${Math.round(avgPosition * 10) / 10}`);
    console.log(`📊 Total historical entries: ${history.length}`);

    // Update the metrics summary
    updateMetricsSummary(dataEntry.summary);

  } catch (error) {
    console.error('❌ Error fetching Search Console data:', error.message);
    if (error.code === 404) {
      console.error('💡 Make sure the site is verified in Search Console and the service account has access');
    }
    // Don't fail the build if Search Console fetch fails
    process.exit(0);
  }
}

function updateMetricsSummary(searchData) {
  const SUMMARY_FILE = path.join(__dirname, '../docs/metrics/latest.json');

  try {
    let summary = { generated: new Date().toISOString() };

    if (fs.existsSync(SUMMARY_FILE)) {
      summary = JSON.parse(fs.readFileSync(SUMMARY_FILE, 'utf8'));
    }

    summary.searchConsole = {
      lastCheck: new Date().toISOString(),
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

fetchSearchConsoleData();
