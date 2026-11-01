import { describe, expect, it } from 'vitest';
import { buildBlogTraffic, formatBlogTrafficDate } from './blog-traffic';
import type { BlogDailyReport, GA4PageMetrics } from '@/components/analytics/types';

const page = (slug: string, views: number): GA4PageMetrics => ({ page: `/blog/${slug}`, pageViews: views, sessions: 999, users: 1 });
const report = (days: BlogDailyReport['days']): BlogDailyReport => ({
  schemaVersion: 1, collectedAt: '2026-11-01T00:00:00Z', timeZone: 'America/New_York',
  coverage: { startDate: '2026-10-27', endDate: '2026-10-29' }, days,
});

describe('daily blog contribution chart', () => {
  it('keeps every view in the stack, merges aliases, and distinguishes missing days from zero', () => {
    const data = report([
      { date: '2026-10-27', pageViews: 32, pages: [page('alias', 3), page('canonical/', 2),
        ...Array.from({ length: 6 }, (_, i) => page(`post-${i}`, i + 2))] },
      { date: '2026-10-29', pageViews: 0, pages: [] },
    ]);
    const chart = buildBlogTraffic(data, slug => ['alias', 'canonical'].includes(slug) ? { slug: 'canonical', title: 'Canonical post' } : undefined);
    expect(chart.series).toHaveLength(6);
    expect(chart.rows[0]['post:canonical']).toBe(5);
    expect(chart.rows[0].total).toBe(32);
    expect(chart.series.reduce((sum, s) => sum + (chart.rows[0][s.key] ?? 0), 0)).toBe(32);
    expect(chart.rows[0].other).toBe(5);
    expect(chart.rows[1].total).toBeNull();
    expect(chart.rows[1].other).toBeNull();
    expect(chart.rows[2].total).toBe(0);
    expect(Number(chart.rows[2].timestamp) - Number(chart.rows[0].timestamp)).toBe(2 * 86_400_000);
    expect(formatBlogTrafficDate(Number(chart.rows[0].timestamp))).toBe('Oct 27');
  });

  it('uses sixty calendar days ending at the report coverage, not collection timestamps', () => {
    const data = report([]);
    data.coverage.startDate = '2026-01-01';
    const chart = buildBlogTraffic(data, () => undefined);
    expect(chart.rows).toHaveLength(60);
    expect(chart.rows[59].timestamp).toBe(Date.parse('2026-10-29T00:00:00Z'));
  });
});
