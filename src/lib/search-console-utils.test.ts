import { describe, expect, it, vi } from 'vitest';
import {
  buildDateRange,
  buildDetailCoverage,
  buildRollingHistory,
  fetchAllRows,
  formatDateInTimeZone,
  resolveLatestFinalDate,
} from '../../scripts/search-console-utils.js';

describe('Search Console collection utilities', () => {
  it('uses Search Console Pacific dates across the UTC date boundary', () => {
    expect(formatDateInTimeZone(new Date('2026-06-23T06:30:00Z'))).toBe('2026-06-22');
    expect(formatDateInTimeZone(new Date('2026-06-23T07:30:00Z'))).toBe('2026-06-23');
  });

  it('builds an exact inclusive seven-day range', () => {
    expect(buildDateRange('2026-06-23', 7)).toEqual({
      start: '2026-06-17',
      end: '2026-06-23',
    });
  });

  it('stops immediately before Search Console incomplete data', () => {
    expect(resolveLatestFinalDate({
      metadata: { firstIncompleteDate: '2026-06-22' },
      rows: [{ keys: ['2026-06-23'] }],
    })).toBe('2026-06-21');
  });

  it('falls back to the newest returned date when all requested data is final', () => {
    expect(resolveLatestFinalDate({
      rows: [
        { keys: ['2026-06-20'] },
        { keys: ['2026-06-21'] },
      ],
    })).toBe('2026-06-21');
  });

  it('paginates a single dimension without combining query and page rows', async () => {
    const pages = new Map([
      [0, [{ keys: ['one'] }, { keys: ['two'] }]],
      [2, [{ keys: ['three'] }, { keys: ['four'] }]],
      [4, [{ keys: ['five'] }]],
    ]);
    const query = vi.fn(async ({ requestBody }) => ({
      data: { rows: pages.get(requestBody.startRow) ?? [] },
    }));

    const rows = await fetchAllRows({
      query,
      siteUrl: 'sc-domain:example.com',
      requestBody: {
        startDate: '2026-06-01',
        endDate: '2026-06-07',
        dataState: 'final',
      },
      dimensions: ['query'],
      pageSize: 2,
    });

    expect(rows.map((row) => row.keys?.[0])).toEqual(['one', 'two', 'three', 'four', 'five']);
    expect(query).toHaveBeenCalledTimes(3);
    expect(query.mock.calls.map(([params]) => params.requestBody.startRow)).toEqual([0, 2, 4]);
    expect(query.mock.calls.every(([params]) => (
      params.requestBody.dimensions.length === 1 && params.requestBody.dimensions[0] === 'query'
    ))).toBe(true);
  });

  it('rebuilds retained history from finalized daily rows', () => {
    const dailyRows = Array.from({ length: 10 }, (_, index) => ({
      keys: [`2026-01-${String(index + 1).padStart(2, '0')}`],
      clicks: 1,
      impressions: 10,
      ctr: 0.1,
      position: index + 1,
    }));

    const history = buildRollingHistory({
      dailyRows,
      latestFinalDate: '2026-01-10',
      windowDays: 3,
      retentionDays: 2,
    });

    expect(history).toHaveLength(2);
    expect(history[0]).toMatchObject({
      date: '2026-01-09',
      dataState: 'final',
      windowDays: 3,
      period: { start: '2026-01-07', end: '2026-01-09' },
      summary: {
        totalClicks: 3,
        totalImpressions: 30,
        averageCTR: 10,
        averagePosition: 8,
      },
    });
    expect(history[1].summary.averagePosition).toBe(9);
  });

  it('reports how much of the summary is represented by detail rows', () => {
    expect(buildDetailCoverage([
      { clicks: 1, impressions: 25, position: 2 },
      { clicks: 0, impressions: 25, position: 4 },
    ], 200)).toEqual({
      rowCount: 2,
      clicks: 1,
      impressions: 50,
      impressionShare: 25,
    });
  });
});
