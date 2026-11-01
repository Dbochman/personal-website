import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { addDays, formatDateInTimeZone } from './ga4-analytics-utils.js';

const historyFile = new URL('../docs/metrics/ga4-blog-daily.json', import.meta.url);
const firstDate = '2026-01-01';
const blogFilter = { andGroup: { expressions: [
  { filter: { fieldName: 'pagePath', stringFilter: { matchType: 'BEGINS_WITH', value: '/blog/', caseSensitive: true } } },
  { notExpression: { filter: { fieldName: 'pagePath', stringFilter: { matchType: 'EXACT', value: '/blog/', caseSensitive: true } } } },
] } };

function assertDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || addDays(value, 0) !== value) throw new Error('Invalid report date');
}

function checkQuality(metadata) {
  if (!metadata?.timeZone || metadata.emptyReason || metadata.dataLossFromOtherRow || metadata.subjectToThresholding
    || metadata.dataTruncationReasons?.length || metadata.schemaRestrictionResponse?.activeMetricRestrictions?.length
    || metadata.samplingMetadatas?.some(s => BigInt(String(s.samplesReadCount)) < BigInt(String(s.samplingSpaceSize)))) {
    throw new Error('GA4 daily blog report is incomplete, restricted, sampled, or missing timezone metadata');
  }
}

/** Query date + path directly: never reconstruct days from rolling windows. */
export async function collectDailyBlogReport(client, { property, previous = null, now = new Date(), pageSize = 10000 }) {
  // GA4 interprets relative dates in the property's timezone. Resolve the fixed
  // end date once before pagination, even if collection crosses local midnight.
  const [probe] = await client.runReport({
    property, dateRanges: [{ startDate: '2daysAgo', endDate: '2daysAgo' }],
    dimensions: [{ name: 'date' }], metrics: [{ name: 'screenPageViews' }], limit: 1,
  });
  const timeZone = probe.metadata?.timeZone;
  if (!timeZone) throw new Error('GA4 property timezone unavailable');
  const endDate = addDays(formatDateInTimeZone(now, timeZone), -2);
  if (previous && (previous.schemaVersion !== 1 || previous.timeZone !== timeZone)) {
    throw new Error('Existing daily report schema/timezone differs; explicit migration required');
  }
  let startDate = firstDate;
  if (previous) {
    assertDate(previous.coverage.startDate); assertDate(previous.coverage.endDate);
    if (previous.coverage.endDate > endDate) throw new Error('Existing daily report is ahead of the reporting clock');
    // Refresh fourteen days for late processing; also fill any collection gap.
    startDate = [previous.coverage.startDate, addDays(previous.coverage.endDate, -13)].sort()[1];
  }
  assertDate(startDate); assertDate(endDate);
  if (startDate > endDate) throw new Error('Invalid reporting range');

  const byDate = new Map();
  for (let date = startDate; date <= endDate; date = addDays(date, 1)) byDate.set(date, new Map());
  let offset = 0;
  let expectedRows;
  do {
    const [response] = await client.runReport({
      property, dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'date' }, { name: 'pagePath' }],
      metrics: [{ name: 'screenPageViews' }, { name: 'sessions' }, { name: 'totalUsers' }],
      dimensionFilter: blogFilter,
      orderBys: [{ dimension: { dimensionName: 'date' } }, { dimension: { dimensionName: 'pagePath' } }],
      offset, limit: pageSize,
    });
    checkQuality(response.metadata);
    if (response.metadata.timeZone !== timeZone) throw new Error('GA4 timezone changed during pagination');
    const count = Number(response.rowCount ?? 0);
    if (!Number.isSafeInteger(count) || count < 0 || (expectedRows !== undefined && count !== expectedRows)) {
      throw new Error('GA4 row count changed or is invalid');
    }
    expectedRows = count;
    const rows = response.rows ?? [];
    if ((!rows.length && offset < count) || offset + rows.length > count) throw new Error('Incomplete GA4 pagination');
    for (const row of rows) {
      const rawDate = row.dimensionValues?.[0]?.value ?? '';
      const date = rawDate.replace(/^(\d{4})(\d{2})(\d{2})$/, '$1-$2-$3');
      const page = row.dimensionValues?.[1]?.value;
      const counts = row.metricValues?.map(m => Number(m.value));
      if (!byDate.has(date) || !page?.startsWith('/blog/') || page === '/blog/'
        || counts?.length !== 3 || counts.some(n => !Number.isSafeInteger(n) || n < 0)) {
        throw new Error('Unexpected daily blog row');
      }
      if (byDate.get(date).has(page)) throw new Error('Duplicate daily blog row across pages');
      byDate.get(date).set(page, { page, pageViews: counts[0], sessions: counts[1], users: counts[2] });
    }
    offset += rows.length;
  } while (offset < expectedRows);

  const refreshed = [...byDate].map(([date, pages]) => ({
    date,
    pageViews: [...pages.values()].reduce((sum, p) => sum + p.pageViews, 0),
    pages: [...pages.values()].sort((a, b) => a.page.localeCompare(b.page)),
  }));
  return {
    schemaVersion: 1, collectedAt: now.toISOString(), timeZone,
    coverage: { startDate: previous?.coverage.startDate ?? startDate, endDate },
    source: 'GA4 date + pagePath; completed property-timezone days',
    notes: 'Page views are additive. Sessions/users can overlap across posts and days. Empty pages means no activity reported by GA4, not proof tracking was active.',
    days: [...(previous?.days ?? []).filter(d => d.date < startDate), ...refreshed],
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    if (!process.env.GA4_CREDENTIALS || !process.env.GA4_PROPERTY_ID) throw new Error('GA4 credentials/property required');
    const client = new BetaAnalyticsDataClient({
      credentials: JSON.parse(Buffer.from(process.env.GA4_CREDENTIALS, 'base64').toString('utf8')),
    });
    const previous = existsSync(historyFile) ? JSON.parse(readFileSync(historyFile, 'utf8')) : null;
    const report = await collectDailyBlogReport(client, { property: process.env.GA4_PROPERTY_ID, previous });
    const temporary = new URL(`${historyFile.href}.tmp`);
    writeFileSync(temporary, JSON.stringify(report, null, 2) + '\n');
    renameSync(temporary, historyFile);
    console.log(`Daily blog data: ${report.coverage.startDate}–${report.coverage.endDate}; ${report.days.length} days, ${report.days.reduce((n, d) => n + d.pages.length, 0)} date/path rows.`);
  } catch (error) {
    // Avoid credential-bearing client/request details in workflow logs.
    console.error(`Daily blog export failed: ${error.message}`);
    process.exitCode = 1;
  }
}
