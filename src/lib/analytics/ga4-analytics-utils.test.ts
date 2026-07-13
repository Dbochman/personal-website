import { describe, expect, it } from 'vitest';
import {
  addDays,
  buildCompletedPeriod,
  buildDailySessionSeries,
  detectSameWeekdayAnomaly,
  hasMatureSessionCoverage,
} from '../../../scripts/ga4-analytics-utils.js';

function makeSeries(endDate: string, values: Record<string, number>) {
  const dates = Object.keys(values).sort();
  return dates
    .filter(date => date <= endDate)
    .map(date => ({ date, sessions: values[date] }));
}

function weekdayFixture(latest: number, previous: number) {
  return makeSeries('2026-07-10', {
    '2026-06-11': 20,
    '2026-06-12': 20,
    '2026-06-18': 22,
    '2026-06-19': 21,
    '2026-06-25': 18,
    '2026-06-26': 19,
    '2026-07-02': 20,
    '2026-07-03': 20,
    '2026-07-09': previous,
    '2026-07-10': latest,
  });
}

describe('GA4 completed daily data', () => {
  it('builds truthful seven-day metadata ending on the finalized date', () => {
    expect(buildCompletedPeriod('2026-07-10')).toEqual({
      description: 'Last 7 completed days',
      startDate: '2026-07-04',
      endDate: '2026-07-10',
      windowDays: 7,
      dataState: 'finalized',
    });
  });

  it('normalizes GA4 dates, aggregates duplicates, and fills missing days', () => {
    const rows = [
      { dimensionValues: [{ value: '20260708' }], metricValues: [{ value: '4' }] },
      { dimensionValues: [{ value: '20260708' }], metricValues: [{ value: '3' }] },
      { dimensionValues: [{ value: '20260710' }], metricValues: [{ value: '9' }] },
      { dimensionValues: [{ value: 'bad' }], metricValues: [{ value: '99' }] },
    ];

    expect(buildDailySessionSeries(rows, {
      startDate: '2026-07-08',
      endDate: '2026-07-10',
    })).toEqual([
      { date: '2026-07-08', sessions: 7 },
      { date: '2026-07-09', sessions: 0 },
      { date: '2026-07-10', sessions: 9 },
    ]);
  });

  it('requires a mature classified history before trusting human-session data', () => {
    const mature = Array.from({ length: 14 }, (_, index) => ({
      date: addDays('2026-06-12', index),
      sessions: 1,
    }));
    const recentOnly = Array.from({ length: 14 }, (_, index) => ({
      date: addDays('2026-06-20', index),
      sessions: 1,
    }));

    expect(hasMatureSessionCoverage(mature, '2026-07-10')).toBe(true);

    expect(hasMatureSessionCoverage(recentOnly, '2026-07-10')).toBe(false);
    expect(hasMatureSessionCoverage([], '2026-07-10')).toBe(false);
  });
});

describe('same-weekday anomaly detector', () => {
  it('alerts immediately when finalized traffic is near zero', () => {
    const result = detectSameWeekdayAnomaly(weekdayFixture(1, 20));

    expect(result).toMatchObject({
      status: 'anomaly',
      isAnomaly: true,
      severity: 'critical',
      observedDate: '2026-07-10',
      observedSessions: 1,
      baselineSessions: 20,
      message: 'Sessions near zero on 2026-07-10: 1 vs same-weekday median 20 (95% drop)',
    });
  });

  it('alerts after two consecutive guarded drops', () => {
    const result = detectSameWeekdayAnomaly(weekdayFixture(8, 8));

    expect(result).toMatchObject({
      status: 'anomaly',
      isAnomaly: true,
      severity: 'warning',
      observedSessions: 8,
      baselineSessions: 20,
      previousSessions: 8,
      previousBaselineSessions: 20,
      message: 'Sessions down for 2 completed days; 2026-07-10: 8 vs 20 (60% drop), 2026-07-09: 8 vs 20 (60% drop)',
    });
  });

  it('does not alert on a one-day dip followed by recovery', () => {
    const result = detectSameWeekdayAnomaly(weekdayFixture(18, 2));

    expect(result).toMatchObject({ status: 'normal', isAnomaly: false });
  });

  it('does not alert on a single ordinary drop without confirmation', () => {
    const result = detectSameWeekdayAnomaly(weekdayFixture(8, 20));

    expect(result).toMatchObject({
      status: 'normal',
      isAnomaly: false,
      reason: 'The guarded drop has not persisted for two completed days',
    });
  });

  it('suppresses percentage swings at low volume', () => {
    const lowVolume = weekdayFixture(1, 1).map(entry => ({
      ...entry,
      sessions: entry.date === '2026-07-10' || entry.date === '2026-07-09'
        ? 1
        : 3,
    }));

    expect(detectSameWeekdayAnomaly(lowVolume)).toMatchObject({
      status: 'normal',
      isAnomaly: false,
      reason: 'Baseline volume is below the alerting floor',
    });
  });

  it('requires four matching weekdays and ignores invalid values', () => {
    expect(detectSameWeekdayAnomaly([
      { date: '2026-07-10', sessions: 0 },
      { date: '2026-07-03', sessions: Number.NaN },
    ])).toMatchObject({
      status: 'insufficient-data',
      isAnomaly: false,
    });
  });
});
