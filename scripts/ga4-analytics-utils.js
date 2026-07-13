const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const GA4_DATE_PATTERN = /^\d{8}$/;

export const GA4_DAILY_LOOKBACK_DAYS = 30;
export const GA4_REPORTING_WINDOW_DAYS = 7;

function assertIsoDate(value, name = 'date') {
  if (typeof value !== 'string' || !ISO_DATE_PATTERN.test(value)) {
    throw new Error(`${name} must use YYYY-MM-DD format`);
  }
}

export function addDays(dateString, days) {
  assertIsoDate(dateString);
  if (!Number.isInteger(days)) {
    throw new Error('days must be an integer');
  }

  const date = new Date(`${dateString}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function formatDateInTimeZone(date, timeZone = 'UTC') {
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

export function normalizeGA4Date(value) {
  if (typeof value === 'string' && ISO_DATE_PATTERN.test(value)) {
    return value;
  }
  if (typeof value !== 'string' || !GA4_DATE_PATTERN.test(value)) {
    throw new Error('GA4 date must use YYYYMMDD format');
  }
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
}

export function buildCompletedPeriod(endDate, windowDays = GA4_REPORTING_WINDOW_DAYS) {
  assertIsoDate(endDate, 'endDate');
  if (!Number.isInteger(windowDays) || windowDays < 1) {
    throw new Error('windowDays must be a positive integer');
  }

  return {
    description: `Last ${windowDays} completed days`,
    startDate: addDays(endDate, -(windowDays - 1)),
    endDate,
    windowDays,
    dataState: 'finalized',
  };
}

/**
 * Convert GA4 date/session rows into a complete, ascending series. Missing dates
 * are explicit zeroes so detector baselines cannot silently skip quiet days.
 */
export function buildDailySessionSeries(rows, { startDate, endDate }) {
  assertIsoDate(startDate, 'startDate');
  assertIsoDate(endDate, 'endDate');
  if (startDate > endDate) {
    throw new Error('startDate cannot be after endDate');
  }

  const sessionsByDate = new Map();
  for (const row of rows ?? []) {
    const rawDate = row?.dimensionValues?.[0]?.value;
    const rawSessions = row?.metricValues?.[0]?.value;
    let date;
    try {
      date = normalizeGA4Date(rawDate);
    } catch {
      continue;
    }

    const sessions = Number(rawSessions);
    if (!Number.isFinite(sessions) || sessions < 0 || date < startDate || date > endDate) {
      continue;
    }
    sessionsByDate.set(date, (sessionsByDate.get(date) ?? 0) + sessions);
  }

  const series = [];
  for (let date = startDate; date <= endDate; date = addDays(date, 1)) {
    series.push({ date, sessions: sessionsByDate.get(date) ?? 0 });
  }
  return series;
}

export function hasMatureClassificationCoverage(
  classifiedSessions,
  totalSessions,
  endDate,
  { historyDays = 28, edgeWindowDays = 7, minimumCoverageRatio = 0.8 } = {}
) {
  assertIsoDate(endDate, 'endDate');
  const coverageStart = addDays(endDate, -historyDays);
  const oldestWindowEnd = addDays(coverageStart, edgeWindowDays - 1);
  const recentWindowStart = addDays(endDate, -(edgeWindowDays - 1));
  const classifiedDates = new Set((classifiedSessions ?? [])
    .filter(entry =>
      entry &&
      ISO_DATE_PATTERN.test(entry.date) &&
      entry.date >= coverageStart &&
      entry.date <= endDate &&
      Number(entry.sessions) > 0
    )
    .map(entry => entry.date));
  const trafficDates = (totalSessions ?? [])
    .filter(entry =>
      entry &&
      ISO_DATE_PATTERN.test(entry.date) &&
      entry.date >= coverageStart &&
      entry.date <= endDate &&
      Number(entry.sessions) > 0
    )
    .map(entry => entry.date);

  if (trafficDates.length === 0) return false;

  const coveredTrafficDates = trafficDates.filter(date => classifiedDates.has(date));
  const coverageRatio = coveredTrafficDates.length / trafficDates.length;
  const hasOldestWindowEvidence = coveredTrafficDates.some(date => date <= oldestWindowEnd);
  const hasRecentWindowEvidence = coveredTrafficDates.some(date => date >= recentWindowStart);

  return coverageRatio >= minimumCoverageRatio &&
    hasOldestWindowEvidence &&
    hasRecentWindowEvidence;
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function assessDate(sessionsByDate, date, options) {
  const sessions = sessionsByDate.get(date);
  const baselineDates = [7, 14, 21, 28].map(days => addDays(date, -days));
  const baselineValues = baselineDates.map(baselineDate => sessionsByDate.get(baselineDate));

  if (sessions === undefined || baselineValues.some(value => value === undefined)) {
    return { sufficient: false, date, sessions: sessions ?? null, baselineDates };
  }

  const baselineSessions = median(baselineValues);
  const absoluteDrop = baselineSessions - sessions;
  const nearZeroThreshold = Math.max(
    options.nearZeroMaximum,
    baselineSessions * options.nearZeroRatio
  );
  const hasVolume = baselineSessions >= options.minimumBaseline;

  return {
    sufficient: true,
    date,
    sessions,
    baselineDates,
    baselineSessions,
    absoluteDrop,
    percentageDrop: baselineSessions > 0
      ? Math.round((absoluteDrop / baselineSessions) * 1000) / 10
      : 0,
    nearZero: hasVolume && sessions <= nearZeroThreshold,
    depressed: hasVolume &&
      absoluteDrop >= options.minimumAbsoluteDrop &&
      sessions <= baselineSessions * options.dropRatio,
  };
}

/**
 * Detect a traffic loss against four same-weekday observations. Near-zero
 * traffic alerts immediately; ordinary drops must persist for two completed
 * days to avoid paging on one-day noise.
 */
export function detectSameWeekdayAnomaly(dailySessions, overrides = {}) {
  const options = {
    minimumBaseline: 10,
    minimumAbsoluteDrop: 10,
    dropRatio: 0.5,
    nearZeroRatio: 0.1,
    nearZeroMaximum: 2,
    ...overrides,
  };

  const sessionsByDate = new Map();
  for (const entry of dailySessions ?? []) {
    if (!entry || !ISO_DATE_PATTERN.test(entry.date)) continue;
    const sessions = Number(entry.sessions);
    if (!Number.isFinite(sessions) || sessions < 0) continue;
    sessionsByDate.set(entry.date, sessions);
  }

  const dates = [...sessionsByDate.keys()].sort();
  const observedDate = dates.at(-1);
  if (!observedDate) {
    return {
      status: 'insufficient-data',
      isAnomaly: false,
      severity: null,
      reason: 'No valid daily session data',
      message: 'Daily session anomaly check unavailable: no valid data',
    };
  }

  const latest = assessDate(sessionsByDate, observedDate, options);
  if (!latest.sufficient) {
    return {
      status: 'insufficient-data',
      isAnomaly: false,
      severity: null,
      observedDate,
      observedSessions: latest.sessions,
      reason: 'Four same-weekday baselines are required',
      message: `Daily session anomaly check unavailable for ${observedDate}: insufficient same-weekday history`,
    };
  }

  const commonResult = {
    observedDate,
    observedSessions: latest.sessions,
    baselineSessions: latest.baselineSessions,
    baselineDates: latest.baselineDates,
    absoluteDrop: latest.absoluteDrop,
    percentageDrop: latest.percentageDrop,
  };

  if (latest.nearZero) {
    return {
      status: 'anomaly',
      isAnomaly: true,
      severity: 'critical',
      reason: 'Sessions are near zero against the same-weekday baseline',
      message: `Sessions near zero on ${observedDate}: ${latest.sessions} vs same-weekday median ${latest.baselineSessions} (${latest.percentageDrop}% drop)`,
      ...commonResult,
    };
  }

  if (!latest.depressed) {
    return {
      status: 'normal',
      isAnomaly: false,
      severity: null,
      reason: latest.baselineSessions < options.minimumBaseline
        ? 'Baseline volume is below the alerting floor'
        : 'Latest sessions are within guarded thresholds',
      message: latest.baselineSessions < options.minimumBaseline
        ? `No alert for ${observedDate}: same-weekday median ${latest.baselineSessions} is below the volume floor`
        : `Sessions normal on ${observedDate}: ${latest.sessions} vs same-weekday median ${latest.baselineSessions}`,
      ...commonResult,
    };
  }

  const previousDate = addDays(observedDate, -1);
  const previous = assessDate(sessionsByDate, previousDate, options);
  if (!previous.sufficient) {
    return {
      status: 'insufficient-data',
      isAnomaly: false,
      severity: null,
      reason: 'Previous-day baselines are required to confirm a sustained drop',
      message: `Daily session anomaly check unavailable for ${observedDate}: insufficient previous-day history`,
      ...commonResult,
    };
  }

  if (previous.depressed || previous.nearZero) {
    return {
      status: 'anomaly',
      isAnomaly: true,
      severity: 'warning',
      reason: 'Sessions are below the same-weekday baseline for two completed days',
      message: `Sessions down for 2 completed days; ${observedDate}: ${latest.sessions} vs ${latest.baselineSessions} (${latest.percentageDrop}% drop), ${previousDate}: ${previous.sessions} vs ${previous.baselineSessions} (${previous.percentageDrop}% drop)`,
      previousDate,
      previousSessions: previous.sessions,
      previousBaselineSessions: previous.baselineSessions,
      ...commonResult,
    };
  }

  return {
    status: 'normal',
    isAnomaly: false,
    severity: null,
    reason: 'The guarded drop has not persisted for two completed days',
    message: `No alert for ${observedDate}: ${latest.sessions} vs same-weekday median ${latest.baselineSessions}; drop not sustained`,
    ...commonResult,
  };
}
