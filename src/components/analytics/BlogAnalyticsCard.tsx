import { lazy, Suspense, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MetricCard } from './MetricCard';
import { BookOpen, Users, FileText, Clock } from 'lucide-react';
import { getAllPosts } from '@/content/blog/index';
import type { GA4HistoryEntry } from './types';

const BlogTrafficChart = lazy(() => import('./charts/BlogTrafficChart').then(m => ({ default: m.BlogTrafficChart })));
const BlogTagBreakdownChart = lazy(() => import('./charts/BlogTagBreakdownChart').then(m => ({ default: m.BlogTagBreakdownChart })));

interface BlogAnalyticsCardProps {
  ga4History: GA4HistoryEntry[];
  latestGA4: GA4HistoryEntry | undefined;
}

type SortKey = 'sessions' | 'users' | 'pageViews' | 'date' | 'title';

export function BlogAnalyticsCard({ ga4History, latestGA4 }: BlogAnalyticsCardProps) {
  const [sortKey, setSortKey] = useState<SortKey>('sessions');
  const [sortAsc, setSortAsc] = useState(false);

  const posts = useMemo(() => getAllPosts(), []);

  const enrichedData = useMemo(() => {
    const topPages = latestGA4?.topPages ?? [];

    // Merge trailing-slash duplicates and filter to blog paths
    const blogPageMap = new Map<string, { sessions: number; users: number; pageViews: number }>();
    for (const page of topPages) {
      const path = page.page;
      if (!path.startsWith('/blog/') || path === '/blog/' || path === '/blog') continue;
      const normalized = path.replace(/\/$/, '');
      const existing = blogPageMap.get(normalized);
      if (existing) {
        existing.sessions += page.sessions;
        existing.users += page.users;
        existing.pageViews += page.pageViews;
      } else {
        blogPageMap.set(normalized, { sessions: page.sessions, users: page.users, pageViews: page.pageViews });
      }
    }

    // Build post lookup by slug
    const postBySlug = new Map(posts.map(p => [p.slug, p]));

    // Enrich each blog page with metadata
    const rows = Array.from(blogPageMap.entries()).map(([path, stats]) => {
      const slug = path.replace('/blog/', '');
      const post = postBySlug.get(slug);
      return {
        path,
        slug,
        title: post?.title ?? slug,
        author: post?.author ?? '—',
        date: post?.date ?? '',
        tags: post?.tags ?? [],
        category: post?.category ?? 'Uncategorized',
        readingTime: post?.readingTime ?? '—',
        ...stats,
      };
    });

    // Tag breakdown
    const tagMap = new Map<string, number>();
    for (const row of rows) {
      for (const tag of row.tags) {
        tagMap.set(tag, (tagMap.get(tag) ?? 0) + row.sessions);
      }
    }
    const tagData = Array.from(tagMap.entries())
      .map(([tag, sessions]) => ({ tag, sessions }))
      .sort((a, b) => b.sessions - a.sessions);

    // Category breakdown
    const catMap = new Map<string, number>();
    for (const row of rows) {
      catMap.set(row.category, (catMap.get(row.category) ?? 0) + row.sessions);
    }
    const categoryData = Array.from(catMap.entries())
      .map(([category, sessions]) => ({ category, sessions }))
      .sort((a, b) => b.sessions - a.sessions);

    // Metrics
    const totalSessions = rows.reduce((s, r) => s + r.sessions, 0);
    const topPost = rows.length > 0
      ? rows.reduce((top, r) => r.sessions > top.sessions ? r : top, rows[0])
      : null;
    const postsWithTraffic = rows.filter(r => r.readingTime !== '—');
    const avgReadingTime = postsWithTraffic.length > 0
      ? Math.round(postsWithTraffic.reduce((sum, r) => {
          const mins = parseInt(r.readingTime, 10);
          return sum + (isNaN(mins) ? 0 : mins);
        }, 0) / postsWithTraffic.length)
      : 0;

    return { rows, tagData, categoryData, totalSessions, topPost, avgReadingTime };
  }, [latestGA4, posts]);

  const sortedRows = useMemo(() => {
    const sorted = [...enrichedData.rows].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'title': cmp = a.title.localeCompare(b.title); break;
        case 'date': cmp = (new Date(a.date || 0).getTime()) - (new Date(b.date || 0).getTime()); break;
        case 'sessions': cmp = a.sessions - b.sessions; break;
        case 'users': cmp = a.users - b.users; break;
        case 'pageViews': cmp = a.pageViews - b.pageViews; break;
      }
      return sortAsc ? cmp : -cmp;
    });
    return sorted;
  }, [enrichedData.rows, sortKey, sortAsc]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const sortIndicator = (key: SortKey) => {
    if (sortKey !== key) return null;
    return sortAsc ? ' ↑' : ' ↓';
  };

  return (
    <div className="space-y-4">
      {/* Overview metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Blog Sessions (7d)"
          value={enrichedData.totalSessions.toLocaleString()}
          icon={Users}
        />
        <MetricCard
          title="Total Blog Posts"
          value={posts.length.toLocaleString()}
          icon={FileText}
        />
        <MetricCard
          title="Top Post"
          value={enrichedData.topPost?.title ?? '—'}
          icon={BookOpen}
          subtitle={enrichedData.topPost ? `${enrichedData.topPost.sessions} sessions` : undefined}
        />
        <MetricCard
          title="Avg Reading Time"
          value={enrichedData.avgReadingTime > 0 ? `${enrichedData.avgReadingTime} min` : '—'}
          icon={Clock}
          subtitle="across posts with traffic"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Blog Traffic Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div className="h-64 bg-muted rounded animate-pulse" />}>
              <BlogTrafficChart data={ga4History} />
            </Suspense>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tag & Category Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="h-64 bg-muted rounded animate-pulse" />}>
            <BlogTagBreakdownChart tagData={enrichedData.tagData} categoryData={enrichedData.categoryData} />
          </Suspense>
        </CardContent>
      </Card>

      {/* Post performance table */}
      {sortedRows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Post Performance (7d)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th
                      className="text-left py-2 font-medium cursor-pointer select-none"
                      onClick={() => handleSort('title')}
                    >
                      Title{sortIndicator('title')}
                    </th>
                    <th className="text-left py-2 pl-4 font-medium hidden lg:table-cell">Author</th>
                    <th
                      className="text-left py-2 pl-4 font-medium hidden md:table-cell cursor-pointer select-none"
                      onClick={() => handleSort('date')}
                    >
                      Date{sortIndicator('date')}
                    </th>
                    <th
                      className="text-right py-2 pl-4 font-medium cursor-pointer select-none"
                      onClick={() => handleSort('sessions')}
                    >
                      Sessions{sortIndicator('sessions')}
                    </th>
                    <th
                      className="text-right py-2 pl-4 font-medium hidden sm:table-cell cursor-pointer select-none"
                      onClick={() => handleSort('users')}
                    >
                      Users{sortIndicator('users')}
                    </th>
                    <th
                      className="text-right py-2 pl-4 font-medium hidden sm:table-cell cursor-pointer select-none"
                      onClick={() => handleSort('pageViews')}
                    >
                      Views{sortIndicator('pageViews')}
                    </th>
                    <th className="text-right py-2 pl-4 font-medium hidden lg:table-cell">Reading Time</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRows.map((row) => (
                    <tr key={row.path} className="border-b border-border/50">
                      <td className="py-2 truncate max-w-[200px]" title={row.title}>{row.title}</td>
                      <td className="py-2 pl-4 text-muted-foreground hidden lg:table-cell">{row.author}</td>
                      <td className="py-2 pl-4 font-mono text-xs text-muted-foreground hidden md:table-cell">{row.date}</td>
                      <td className="text-right py-2 pl-4 tabular-nums">{row.sessions.toLocaleString()}</td>
                      <td className="text-right py-2 pl-4 tabular-nums hidden sm:table-cell">{row.users.toLocaleString()}</td>
                      <td className="text-right py-2 pl-4 tabular-nums hidden sm:table-cell">{row.pageViews.toLocaleString()}</td>
                      <td className="text-right py-2 pl-4 text-muted-foreground hidden lg:table-cell">{row.readingTime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
