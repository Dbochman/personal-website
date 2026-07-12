const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const SEARCH_WINDOW_DAYS = 7;
export const HISTORY_RETENTION_DAYS = 365;
export const FRESHNESS_LOOKBACK_DAYS = 14;
export const SEARCH_ANALYTICS_PAGE_SIZE = 25_000;

function assertDateString(value, name = 'date') {
  if (!DATE_PATTERN.test(value)) {
    throw new Error(`${name} must use YYYY-MM-DD format`);
  }
}

export function addDays(dateString, days) {
  assertDateString(dateString);
  const date = new Date(`${dateString}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function formatDateInTimeZone(date, timeZone = 'America/Los_Angeles') {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new Error('date must be a valid Date');
  }

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));

  return `${values.year}-${values.month}-${values.day}`;
}

export function buildDateRange(endDate, days) {
  assertDateString(endDate, 'endDate');
  if (!Number.isInteger(days) || days < 1) {
    throw new Error('days must be a positive integer');
  }

  return {
    start: addDays(endDate, -(days - 1)),
    end: endDate,
  };
}

export function round(value, decimals) {
  const multiplier = 10 ** decimals;
  return Math.round(value * multiplier) / multiplier;
}

export function asPercent(ctrRatio) {
  return round((ctrRatio || 0) * 100, 2);
}

export function weightedAveragePosition(entries) {
  const weightedTotal = entries.reduce((sum, entry) => {
    const impressions = entry.impressions || 0;
    return sum + ((entry.position || 0) * impressions);
  }, 0);
  const impressionsTotal = entries.reduce((sum, entry) => sum + (entry.impressions || 0), 0);

  return impressionsTotal > 0
    ? round(weightedTotal / impressionsTotal, 1)
    : 0;
}

export function summarizeRows(rows) {
  const clicks = rows.reduce((sum, row) => sum + (row.clicks || 0), 0);
  const impressions = rows.reduce((sum, row) => sum + (row.impressions || 0), 0);

  return {
    clicks,
    impressions,
    ctr: impressions > 0 ? clicks / impressions : 0,
    position: weightedAveragePosition(rows),
  };
}

export function aggregateRows(rows, keyIndex, label) {
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

export function resolveLatestFinalDate(responseData) {
  const firstIncompleteDate = responseData.metadata?.firstIncompleteDate;
  if (firstIncompleteDate) {
    return addDays(firstIncompleteDate, -1);
  }

  const returnedDates = (responseData.rows || [])
    .map((row) => row.keys?.[0])
    .filter((value) => typeof value === 'string' && DATE_PATTERN.test(value))
    .sort();

  if (returnedDates.length === 0) {
    throw new Error('Search Console returned no dated rows while resolving finalized data');
  }

  return returnedDates[returnedDates.length - 1];
}

export async function fetchAllRows({
  query,
  siteUrl,
  requestBody,
  dimensions,
  pageSize = SEARCH_ANALYTICS_PAGE_SIZE,
}) {
  const rows = [];
  let startRow = 0;

  while (true) {
    const response = await query({
      siteUrl,
      requestBody: {
        ...requestBody,
        dimensions,
        rowLimit: pageSize,
        startRow,
      },
    });
    const page = response.data.rows || [];
    rows.push(...page);

    if (page.length < pageSize) {
      return rows;
    }

    startRow += page.length;
  }
}

export function buildRollingHistory({
  dailyRows,
  latestFinalDate,
  windowDays = SEARCH_WINDOW_DAYS,
  retentionDays = HISTORY_RETENTION_DAYS,
}) {
  assertDateString(latestFinalDate, 'latestFinalDate');
  if (!Number.isInteger(retentionDays) || retentionDays < 1) {
    throw new Error('retentionDays must be a positive integer');
  }

  const dailyByDate = new Map();
  for (const row of dailyRows) {
    const date = row.keys?.[0];
    if (typeof date === 'string' && DATE_PATTERN.test(date)) {
      dailyByDate.set(date, row);
    }
  }

  const firstEndDate = addDays(latestFinalDate, -(retentionDays - 1));
  const history = [];

  for (let offset = 0; offset < retentionDays; offset += 1) {
    const endDate = addDays(firstEndDate, offset);
    const period = buildDateRange(endDate, windowDays);
    const windowRows = [];

    for (let day = 0; day < windowDays; day += 1) {
      const date = addDays(period.start, day);
      windowRows.push(dailyByDate.get(date) ?? {
        clicks: 0,
        impressions: 0,
        position: 0,
      });
    }

    const summary = summarizeRows(windowRows);
    history.push({
      timestamp: `${endDate}T00:00:00.000Z`,
      date: endDate,
      dataState: 'final',
      windowDays,
      period,
      summary: {
        totalClicks: summary.clicks,
        totalImpressions: summary.impressions,
        averageCTR: asPercent(summary.ctr),
        averagePosition: summary.position,
      },
    });
  }

  return history;
}

export function buildDetailCoverage(rows, totalImpressions) {
  const summary = summarizeRows(rows);
  return {
    rowCount: rows.length,
    clicks: summary.clicks,
    impressions: summary.impressions,
    impressionShare: totalImpressions > 0
      ? round((summary.impressions / totalImpressions) * 100, 1)
      : 0,
  };
}
