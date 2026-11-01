import type { BlogDailyReport } from '@/components/analytics/types';

const DAY = 86_400_000;
type Post = { slug: string; title: string };
export function buildBlogTraffic(report: BlogDailyReport, resolvePost: (slug: string) => Post | undefined) {
  const end = Date.parse(`${report.coverage.endDate}T00:00:00Z`);
  const start = Math.max(Date.parse(`${report.coverage.startDate}T00:00:00Z`), end - 59 * DAY);
  const totals = new Map<string, { title: string; views: number }>();
  const byDate = new Map<string, Map<string, number>>();
  for (const day of report.days) {
    const time = Date.parse(`${day.date}T00:00:00Z`);
    if (time < start || time > end) continue;
    const counts = new Map<string, number>();
    for (const page of day.pages) {
      if (!page.page.startsWith('/blog/') || page.page === '/blog/') continue;
      const slug = page.page.slice('/blog/'.length).replace(/\/$/, '');
      const post = resolvePost(slug);
      const key = `post:${post?.slug ?? slug}`;
      counts.set(key, (counts.get(key) ?? 0) + page.pageViews);
      const previous = totals.get(key);
      totals.set(key, { title: post?.title ?? slug, views: (previous?.views ?? 0) + page.pageViews });
    }
    byDate.set(day.date, counts);
  }
  const top = [...totals].filter(([, p]) => p.views > 0)
    .sort((a, b) => b[1].views - a[1].views || a[0].localeCompare(b[0])).slice(0, 5);
  const series = [...top.map(([key, p]) => ({ key, title: p.title })), { key: 'other', title: 'Other' }];
  const topKeys = new Set(top.map(([key]) => key));
  const rows: Array<Record<string, number | null>> = [];
  for (let timestamp = start; timestamp <= end; timestamp += DAY) {
    const counts = byDate.get(new Date(timestamp).toISOString().slice(0, 10));
    const row: Record<string, number | null> = { timestamp, total: counts ? 0 : null };
    for (const { key } of series) row[key] = counts ? 0 : null;
    if (counts) {
      for (const [key, views] of counts) {
        const bucket = topKeys.has(key) ? key : 'other';
        row[bucket] = (row[bucket] ?? 0) + views;
        row.total = (row.total ?? 0) + views;
      }
    }
    rows.push(row);
  }
  return { rows, series };
}

export function formatBlogTrafficDate(timestamp: number) {
  // Position GA4 calendar dates on the axis without shifting to browser timezone.
  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}
