/**
 * Fetch Google Analytics 4 (GA4) data
 *
 * This script fetches analytics data from the GA4 Data API
 * and saves it to docs/metrics/ga4-history.json for tracking visitor engagement.
 *
 * Required environment variables:
 * - GA4_CREDENTIALS: Base64-encoded service account JSON credentials
 * - GA4_PROPERTY_ID: Your GA4 property ID (format: properties/123456789)
 *
 * Setup instructions:
 * 1. Go to https://console.cloud.google.com/
 * 2. Create a new project or select existing
 * 3. Enable "Google Analytics Data API"
 * 4. Create a service account and download JSON key
 * 5. In GA4 (https://analytics.google.com), go to Admin > Property Access Management
 * 6. Add the service account email as a Viewer
 * 7. Get your property ID from Admin > Property Settings
 * 8. Base64 encode the JSON key: cat service-account.json | base64
 * 9. Add to GitHub secrets:
 *    - GA4_CREDENTIALS (base64-encoded JSON)
 *    - GA4_PROPERTY_ID (e.g., properties/123456789)
 */

import { BetaAnalyticsDataClient } from '@google-analytics/data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HISTORY_FILE = path.join(__dirname, '../docs/metrics/ga4-history.json');

async function fetchGA4Data() {
  try {
    // Check for credentials
    if (!process.env.GA4_CREDENTIALS || !process.env.GA4_PROPERTY_ID) {
      console.log('⚠️  No GA4 credentials found, skipping');
      console.log('💡 To enable: Set GA4_CREDENTIALS and GA4_PROPERTY_ID environment variables');
      return;
    }

    // Decode and parse credentials
    const credentials = JSON.parse(
      Buffer.from(process.env.GA4_CREDENTIALS, 'base64').toString('utf-8')
    );

    const propertyId = process.env.GA4_PROPERTY_ID;

    // Initialize GA4 client
    const analyticsDataClient = new BetaAnalyticsDataClient({
      credentials,
    });

    console.log(`📊 Fetching GA4 data for property ${propertyId}...`);

    // Fetch data for last 7 days (pages + devices)
    const [response] = await analyticsDataClient.runReport({
      property: propertyId,
      dateRanges: [
        {
          startDate: '7daysAgo',
          endDate: 'today',
        },
      ],
      dimensions: [
        { name: 'pagePath' },
        { name: 'deviceCategory' },
      ],
      metrics: [
        { name: 'sessions' },
        { name: 'totalUsers' },
        { name: 'screenPageViews' },
        { name: 'averageSessionDuration' },
        { name: 'bounceRate' },
      ],
    });

    // Fetch Web Vitals (RUM data)
    const [vitalsResponse] = await analyticsDataClient.runReport({
      property: propertyId,
      dateRanges: [
        {
          startDate: '7daysAgo',
          endDate: 'today',
        },
      ],
      dimensions: [
        { name: 'eventName' },
      ],
      metrics: [
        { name: 'eventCount' },
        { name: 'eventValue' },
      ],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          inListFilter: {
            values: ['LCP', 'CLS', 'INP', 'FCP', 'TTFB'],
          },
        },
      },
    });

    // Fetch traffic sources separately (different dimension set)
    const [trafficResponse] = await analyticsDataClient.runReport({
      property: propertyId,
      dateRanges: [
        {
          startDate: '7daysAgo',
          endDate: 'today',
        },
      ],
      dimensions: [
        { name: 'sessionDefaultChannelGroup' },
        { name: 'sessionSource' },
        { name: 'sessionMedium' },
      ],
      metrics: [
        { name: 'sessions' },
        { name: 'totalUsers' },
      ],
    });

    // First, check if tool_interaction events exist at all (no custom dimensions needed)
    try {
      const [toolEventCheck] = await analyticsDataClient.runReport({
        property: propertyId,
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'eventName' }],
        metrics: [{ name: 'eventCount' }],
        dimensionFilter: {
          filter: {
            fieldName: 'eventName',
            stringFilter: { value: 'tool_interaction' },
          },
        },
      });
      if (toolEventCheck.rows?.length > 0) {
        const count = toolEventCheck.rows[0].metricValues[0].value;
        console.log(`📊 Found ${count} tool_interaction events in last 30 days`);
        console.log('   Events ARE being received - register custom dimensions in GA4 to see details');
      } else {
        console.log('ℹ️  No tool_interaction events found in last 30 days');
      }
    } catch (checkError) {
      console.log('⚠️  Could not check for tool events:', checkError.message);
    }

    // Fetch tool interaction events with details (requires custom dimensions to be registered in GA4)
    let toolEventsResponse = { rows: [] };
    try {
      const [toolResponse] = await analyticsDataClient.runReport({
        property: propertyId,
        dateRanges: [
          {
            startDate: '7daysAgo',
            endDate: 'today',
          },
        ],
        dimensions: [
          { name: 'customEvent:tool_name' },
          { name: 'customEvent:action' },
        ],
        metrics: [
          { name: 'eventCount' },
        ],
        dimensionFilter: {
          filter: {
            fieldName: 'eventName',
            stringFilter: {
              value: 'tool_interaction',
            },
          },
        },
      });
      toolEventsResponse = toolResponse;
    } catch (toolError) {
      console.log('⚠️  Tool interaction details query failed (custom dimensions may not be registered):', toolError.message);
      console.log('   To fix: Register tool_name and action as custom dimensions in GA4 Admin');
    }

    // Extract overall metrics
    let totalSessions = 0;
    let totalUsers = 0;
    let totalPageViews = 0;
    let totalSessionDuration = 0;
    let totalBounceRate = 0;

    const pageMetrics = {};
    const deviceMetrics = {};

    response.rows?.forEach(row => {
      const pagePath = row.dimensionValues[0].value;
      const deviceCategory = row.dimensionValues[1].value;
      const sessions = parseInt(row.metricValues[0].value || '0', 10);
      const users = parseInt(row.metricValues[1].value || '0', 10);
      const pageViews = parseInt(row.metricValues[2].value || '0', 10);
      const sessionDuration = parseFloat(row.metricValues[3].value || '0');
      const bounceRate = parseFloat(row.metricValues[4].value || '0');

      totalSessions += sessions;
      totalUsers += users;
      totalPageViews += pageViews;
      totalSessionDuration += sessionDuration * sessions;
      totalBounceRate += bounceRate * sessions;

      // Track by page
      if (!pageMetrics[pagePath]) {
        pageMetrics[pagePath] = { sessions: 0, users: 0, pageViews: 0 };
      }
      pageMetrics[pagePath].sessions += sessions;
      pageMetrics[pagePath].users += users;
      pageMetrics[pagePath].pageViews += pageViews;

      // Track by device
      if (!deviceMetrics[deviceCategory]) {
        deviceMetrics[deviceCategory] = { sessions: 0, users: 0 };
      }
      deviceMetrics[deviceCategory].sessions += sessions;
      deviceMetrics[deviceCategory].users += users;
    });

    const avgSessionDuration = totalSessions > 0 ? totalSessionDuration / totalSessions : 0;
    const avgBounceRate = totalSessions > 0 ? totalBounceRate / totalSessions : 0;

    // Get top pages
    const topPages = Object.entries(pageMetrics)
      .map(([page, metrics]) => ({ page, ...metrics }))
      .sort((a, b) => b.pageViews - a.pageViews)
      .slice(0, 10);

    // Process traffic sources
    const channelMetrics = {};
    const sourceMetrics = {};

    trafficResponse.rows?.forEach(row => {
      const channel = row.dimensionValues[0].value;
      const source = row.dimensionValues[1].value;
      const medium = row.dimensionValues[2].value;
      const sessions = parseInt(row.metricValues[0].value || '0', 10);
      const users = parseInt(row.metricValues[1].value || '0', 10);

      // Track by channel group
      if (!channelMetrics[channel]) {
        channelMetrics[channel] = { sessions: 0, users: 0 };
      }
      channelMetrics[channel].sessions += sessions;
      channelMetrics[channel].users += users;

      // Track by source/medium
      const sourceKey = `${source} / ${medium}`;
      if (!sourceMetrics[sourceKey]) {
        sourceMetrics[sourceKey] = { source, medium, sessions: 0, users: 0 };
      }
      sourceMetrics[sourceKey].sessions += sessions;
      sourceMetrics[sourceKey].users += users;
    });

    // Get top channels and sources
    const topChannels = Object.entries(channelMetrics)
      .map(([channel, metrics]) => ({ channel, ...metrics }))
      .sort((a, b) => b.sessions - a.sessions);

    const topSources = Object.values(sourceMetrics)
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 10);

    // Process tool interaction events
    const toolMetrics = {};
    let totalToolInteractions = 0;

    toolEventsResponse.rows?.forEach(row => {
      const toolName = row.dimensionValues[0].value;
      const action = row.dimensionValues[1].value;
      const count = parseInt(row.metricValues[0].value || '0', 10);

      totalToolInteractions += count;

      if (!toolMetrics[toolName]) {
        toolMetrics[toolName] = { total: 0, actions: {} };
      }
      toolMetrics[toolName].total += count;
      toolMetrics[toolName].actions[action] = (toolMetrics[toolName].actions[action] || 0) + count;
    });

    // Process Web Vitals (RUM) data
    // Note: web-vitals library reports all timing metrics in milliseconds
    const webVitals = {};
    vitalsResponse.rows?.forEach(row => {
      const metric = row.dimensionValues[0].value;
      const count = parseInt(row.metricValues[0].value || '0', 10);
      const totalValue = parseFloat(row.metricValues[1].value || '0');

      // Calculate average (eventValue is cumulative)
      const avgValue = count > 0 ? totalValue / count : 0;

      webVitals[metric] = {
        count,
        // CLS is scaled by 1000 when sent, so divide back to get actual value
        // All timing metrics (LCP, FCP, INP, TTFB) are in milliseconds
        average: metric === 'CLS' ? avgValue / 1000 : avgValue,
        unit: metric === 'CLS' ? '' : 'ms',
      };
    });

    // Create data entry
    const dataEntry = {
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
      period: {
        description: 'Last 7 days',
      },
      summary: {
        sessions: totalSessions,
        users: totalUsers,
        pageViews: totalPageViews,
        averageSessionDuration: Math.round(avgSessionDuration),
        bounceRate: Math.round(avgBounceRate * 100) / 100,
      },
      topPages,
      deviceBreakdown: Object.entries(deviceMetrics).map(([device, metrics]) => ({
        device,
        ...metrics,
      })),
      trafficSources: {
        channels: topChannels,
        sources: topSources,
      },
      webVitals: Object.keys(webVitals).length > 0 ? webVitals : null,
      toolInteractions: totalToolInteractions > 0 ? {
        total: totalToolInteractions,
        byTool: Object.entries(toolMetrics).map(([name, data]) => ({
          name,
          total: data.total,
          actions: Object.entries(data.actions).map(([action, count]) => ({
            action,
            count,
          })).sort((a, b) => b.count - a.count),
        })).sort((a, b) => b.total - a.total),
      } : null,
    };

    // Read existing history
    let history = [];
    if (fs.existsSync(HISTORY_FILE)) {
      history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
    }

    // Check if we already have an entry for today - replace instead of append
    const todayDate = dataEntry.date;
    const existingIndex = history.findIndex(entry => entry.date === todayDate);

    if (existingIndex !== -1) {
      // Replace existing entry for today with updated data
      history[existingIndex] = dataEntry;
      console.log(`📝 Updated existing entry for ${todayDate}`);
    } else {
      // Append new data for a new day
      history.push(dataEntry);
    }

    // Keep only last 90 entries (~3 months of daily data)
    if (history.length > 90) {
      history = history.slice(-90);
    }

    // Write updated history
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));

    console.log('✅ GA4 data saved to history');
    console.log(`📈 Sessions: ${totalSessions}, Users: ${totalUsers}, Page Views: ${totalPageViews}`);
    if (Object.keys(webVitals).length > 0) {
      console.log(`⚡ Web Vitals: ${Object.keys(webVitals).join(', ')}`);
    }
    if (totalToolInteractions > 0) {
      console.log(`🔧 Tool Interactions: ${totalToolInteractions} (${Object.keys(toolMetrics).join(', ')})`);
    }
    console.log(`📊 Total historical entries: ${history.length}`);

    // Update the metrics summary
    updateMetricsSummary(dataEntry.summary, topPages, webVitals);

  } catch (error) {
    console.error('❌ Error fetching GA4 data:', error.message);
    if (error.code === 'PERMISSION_DENIED') {
      console.error('💡 Make sure the service account has Viewer access to the GA4 property');
    }
    // Don't fail the build if GA4 fetch fails
    process.exit(0);
  }
}

function updateMetricsSummary(analyticsData, topPages, webVitals) {
  const SUMMARY_FILE = path.join(__dirname, '../docs/metrics/latest.json');

  try {
    let summary = { generated: new Date().toISOString() };

    if (fs.existsSync(SUMMARY_FILE)) {
      summary = JSON.parse(fs.readFileSync(SUMMARY_FILE, 'utf8'));
    }

    summary.analytics = {
      lastCheck: new Date().toISOString(),
      sessions_7d: analyticsData.sessions,
      users_7d: analyticsData.users,
      pageviews_7d: analyticsData.pageViews,
      avgSessionDuration: analyticsData.averageSessionDuration,
      bounceRate: analyticsData.bounceRate,
      topPages: topPages.slice(0, 5).map(p => ({
        page: p.page,
        pageViews: p.pageViews,
      })),
    };

    // Add Web Vitals (RUM) data if available, clear if empty to avoid stale data
    if (webVitals && Object.keys(webVitals).length > 0) {
      summary.webVitals = {
        lastCheck: new Date().toISOString(),
        source: 'rum',
        metrics: webVitals,
      };
    } else {
      // Clear stale data when no RUM metrics available
      delete summary.webVitals;
    }

    summary.generated = new Date().toISOString();

    fs.writeFileSync(SUMMARY_FILE, JSON.stringify(summary, null, 2));
    console.log('✅ Updated metrics summary with GA4 data');
  } catch (error) {
    console.error('⚠️  Could not update metrics summary:', error.message);
  }
}

fetchGA4Data();
