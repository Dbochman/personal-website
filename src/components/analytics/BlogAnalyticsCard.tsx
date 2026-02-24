import { lazy, Suspense, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MetricCard } from './MetricCard';
import { BookOpen, Users, FileText, Eye, TrendingUp, Minus } from 'lucide-react';
import { getAllPosts } from '@/content/blog/index';
import type { GA4HistoryEntry } from './types';

const BlogTrafficChart = lazy(() => import('./charts/BlogTrafficChart').then(m => ({ default: m.BlogTrafficChart })));
const BlogTagBreakdownChart = lazy(() => import('./charts/BlogTagBreakdownChart').then(m => ({ default: m.BlogTagBreakdownChart })));

interface BlogAnalyticsCardProps {
  ga4History: GA4HistoryEntry[];
  latestGA4: GA4HistoryEntry | undefined;
}

type SortKey = 'sessions' | 'users' | 'pageViews' | 'date' | 'title';
type LeaderboardSortKey = 'totalSessions' | 'totalViews' | 'title';

/** Normalize a GA4 page path to a slug for matching */
function extractSlug(path: string): string {
  return path.replace('/blog/', '').replace(/\/$/, '');
}

/**
 * Known slug renames: old GA4 slug → current canonical slug.
 * GA4 keeps reporting old URLs long after posts are renamed/moved.
 */
const SLUG_ALIASES: Record<string, string> = {
  'adventures-in-ai-assisted-web-development': '2026-01-05-notes-on-building-this-site-together',
  '2025-01-07-adventures-in-ai-assisted-web-development': '2026-01-05-notes-on-building-this-site-together',
  '2026-01-getting-started-with-sre': 'hello-world',
  '2026-02-04-andre-collaborative-music-queue': '2026-02-04-echonest-collaborative-music-queue',
  '2026-01-24-postmortems-that-actually-change-things': '2026-01-24-retrospectives-that-actually-change-things',
  '2026-01-23-slo-math-most-teams-get-wrong': '2026-01-21-the-slo-math-most-teams-get-wrong',
};

/** Normalize 2025 date prefixes to 2026 (blog was re-dated) */
function normalizeYearPrefix(slug: string): string {
  return slug.replace(/^2025-/, '2026-');
}

/**
 * Build lookup maps for matching GA4 slugs to posts.
 * Handles renamed posts by alias map, year normalization, fuzzy-matching on title words, and stripped date prefixes.
 */
function buildPostLookups(posts: ReturnType<typeof getAllPosts>) {
  const bySlug = new Map(posts.map(p => [p.slug, p]));

  // Also index by slug without date prefix (e.g. "notes-on-building-this-site-together")
  const byStrippedSlug = new Map<string, typeof posts[0]>();
  for (const p of posts) {
    const stripped = p.slug.replace(/^\d{4}-\d{2}-\d{2}-/, '');
    byStrippedSlug.set(stripped, p);
  }

  // Index by normalized title words for fuzzy matching
  const byTitleKey = new Map<string, typeof posts[0]>();
  for (const p of posts) {
    const key = p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    byTitleKey.set(key, p);
  }

  return { bySlug, byStrippedSlug, byTitleKey };
}

function matchPost(
  slug: string,
  lookups: ReturnType<typeof buildPostLookups>,
): ReturnType<typeof getAllPosts>[0] | undefined {
  // Check alias map first
  const aliased = SLUG_ALIASES[slug];
  if (aliased) {
    const post = lookups.bySlug.get(aliased);
    if (post) return post;
  }

  // Exact match
  const exact = lookups.bySlug.get(slug);
  if (exact) return exact;

  // Try with year normalization (2025→2026)
  const yearNormalized = normalizeYearPrefix(slug);
  if (yearNormalized !== slug) {
    const post = lookups.bySlug.get(yearNormalized);
    if (post) return post;
  }

  // Strip date prefix and try again
  const stripped = slug.replace(/^\d{4}-\d{2}-\d{2}-/, '');
  const byStripped = lookups.byStrippedSlug.get(stripped);
  if (byStripped) return byStripped;

  // Fuzzy: normalize slug to title key (only if key is long enough to avoid false matches)
  const key = stripped.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (key.length >= 10) {
    const byTitle = lookups.byTitleKey.get(key);
    if (byTitle) return byTitle;
  }

  return undefined;
}

/** Aggregate blog page data from a single GA4 entry */
function extractBlogPages(entry: GA4HistoryEntry) {
  const map = new Map<string, { sessions: number; users: number; pageViews: number }>();
  for (const page of entry.topPages ?? []) {
    if (!page.page.startsWith('/blog/') || page.page === '/blog/' || page.page === '/blog') continue;
    const normalized = page.page.replace(/\/$/, '');
    const existing = map.get(normalized);
    if (existing) {
      existing.sessions += page.sessions;
      existing.users += page.users;
      existing.pageViews += page.pageViews;
    } else {
      map.set(normalized, { sessions: page.sessions, users: page.users, pageViews: page.pageViews });
    }
  }
  return map;
}

export function BlogAnalyticsCard({ ga4History, latestGA4 }: BlogAnalyticsCardProps) {
  const [sortKey, setSortKey] = useState<SortKey>('sessions');
  const [sortAsc, setSortAsc] = useState(false);
  const [leaderboardSortKey, setLeaderboardSortKey] = useState<LeaderboardSortKey>('totalSessions');
  const [leaderboardSortAsc, setLeaderboardSortAsc] = useState(false);

  const posts = useMemo(() => getAllPosts(), []);
  const lookups = useMemo(() => buildPostLookups(posts), [posts]);

  // --- 7d data (latest entry) ---
  const enrichedData = useMemo(() => {
    const blogPageMap = extractBlogPages(latestGA4 ?? { topPages: [] } as GA4HistoryEntry);

    const rows = Array.from(blogPageMap.entries()).map(([path, stats]) => {
      const slug = extractSlug(path);
      const post = matchPost(slug, lookups);
      return {
        path,
        slug,
        title: post?.title ?? slug,
        author: post?.author ?? '—',
        date: post?.date ?? '',
        tags: post?.tags ?? [],
        category: post?.category ?? 'Uncategorized',
        readingTime: post?.readingTime ?? '—',
        matched: !!post,
        ...stats,
      };
    });

    const totalSessions = rows.reduce((s, r) => s + r.sessions, 0);
    const topPost = rows.length > 0
      ? rows.reduce((top, r) => r.sessions > top.sessions ? r : top, rows[0])
      : null;

    return { rows, totalSessions, topPost };
  }, [latestGA4, lookups]);

  // --- WoW trend for blog sessions ---
  const sessionsTrend = useMemo(() => {
    if (ga4History.length < 2) return undefined;
    const sorted = [...ga4History].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const current = sorted[0];
    const previous = sorted[1];
    if (!current || !previous) return undefined;

    const currentBlog = Array.from(extractBlogPages(current).values()).reduce((s, r) => s + r.sessions, 0);
    const previousBlog = Array.from(extractBlogPages(previous).values()).reduce((s, r) => s + r.sessions, 0);
    if (previousBlog === 0) return undefined;
    return Math.round(((currentBlog - previousBlog) / previousBlog) * 100);
  }, [ga4History]);

  // --- All-time leaderboard ---
  const allTimeData = useMemo(() => {
    const cumulative = new Map<string, { totalSessions: number; totalViews: number; firstSeen: string; lastSeen: string }>();

    for (const entry of ga4History) {
      const blogPages = extractBlogPages(entry);
      for (const [path, stats] of blogPages) {
        const slug = extractSlug(path);
        // Resolve to canonical slug via post match
        const post = matchPost(slug, lookups);
        const key = post?.slug ?? slug;

        const existing = cumulative.get(key);
        if (existing) {
          existing.totalSessions += stats.sessions;
          existing.totalViews += stats.pageViews;
          const entryTime = new Date(entry.date).getTime();
          if (entryTime < new Date(existing.firstSeen).getTime()) existing.firstSeen = entry.date;
          if (entryTime > new Date(existing.lastSeen).getTime()) existing.lastSeen = entry.date;
        } else {
          cumulative.set(key, {
            totalSessions: stats.sessions,
            totalViews: stats.pageViews,
            firstSeen: entry.date,
            lastSeen: entry.date,
          });
        }
      }
    }

    const latestDate = ga4History.length > 0
      ? [...ga4History].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date
      : '';

    const rows = Array.from(cumulative.entries()).map(([slug, stats]) => {
      const post = matchPost(slug, lookups);
      return {
        slug,
        title: post?.title ?? slug,
        matched: !!post,
        recentlyActive: stats.lastSeen === latestDate,
        ...stats,
      };
    });

    const totalAllTimeViews = rows.reduce((s, r) => s + r.totalViews, 0);

    return { rows, totalAllTimeViews };
  }, [ga4History, lookups]);

  // --- All-time tag breakdown ---
  const allTimeTagData = useMemo(() => {
    const tagMap = new Map<string, number>();
    for (const entry of ga4History) {
      const blogPages = extractBlogPages(entry);
      for (const [path, stats] of blogPages) {
        const slug = extractSlug(path);
        const post = matchPost(slug, lookups);
        if (post) {
          for (const tag of post.tags) {
            tagMap.set(tag, (tagMap.get(tag) ?? 0) + stats.sessions);
          }
        }
      }
    }
    return Array.from(tagMap.entries())
      .map(([tag, sessions]) => ({ tag, sessions }))
      .sort((a, b) => b.sessions - a.sessions);
  }, [ga4History, lookups]);

  // --- Sorted 7d rows ---
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
    return sorted.slice(0, 5);
  }, [enrichedData.rows, sortKey, sortAsc]);

  // --- Sorted leaderboard rows ---
  const sortedLeaderboard = useMemo(() => {
    const sorted = [...allTimeData.rows].sort((a, b) => {
      let cmp = 0;
      switch (leaderboardSortKey) {
        case 'title': cmp = a.title.localeCompare(b.title); break;
        case 'totalSessions': cmp = a.totalSessions - b.totalSessions; break;
        case 'totalViews': cmp = a.totalViews - b.totalViews; break;
      }
      return leaderboardSortAsc ? cmp : -cmp;
    });
    return sorted;
  }, [allTimeData.rows, leaderboardSortKey, leaderboardSortAsc]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  const handleLeaderboardSort = (key: LeaderboardSortKey) => {
    if (leaderboardSortKey === key) setLeaderboardSortAsc(!leaderboardSortAsc);
    else { setLeaderboardSortKey(key); setLeaderboardSortAsc(false); }
  };

  const sortIndicator = (key: SortKey) => sortKey === key ? (sortAsc ? ' ↑' : ' ↓') : null;
  const leaderboardSortIndicator = (key: LeaderboardSortKey) => leaderboardSortKey === key ? (leaderboardSortAsc ? ' ↑' : ' ↓') : null;

  const TrendIcon = ({ active }: { active: boolean }) => {
    if (active) return <TrendingUp className="w-3 h-3 text-green-500 inline ml-1" />;
    return <Minus className="w-3 h-3 text-muted-foreground inline ml-1" />;
  };

  return (
    <div className="space-y-4">
      {/* Overview metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Blog Sessions (7d)"
          value={enrichedData.totalSessions.toLocaleString()}
          icon={Users}
          trend={sessionsTrend}
        />
        <MetricCard
          title="Total Blog Posts"
          value={posts.length.toLocaleString()}
          icon={FileText}
        />
        <MetricCard
          title="Top Post (7d)"
          value={enrichedData.topPost?.title ?? '—'}
          icon={BookOpen}
          subtitle={enrichedData.topPost ? `${enrichedData.topPost.sessions} sessions` : undefined}
        />
        <MetricCard
          title="All-Time Views"
          value={allTimeData.totalAllTimeViews.toLocaleString()}
          icon={Eye}
          subtitle="cumulative blog page views"
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
              <BlogTrafficChart data={ga4History} postLookups={lookups} matchPost={matchPost} />
            </Suspense>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tag Breakdown (All-Time)</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="h-64 bg-muted rounded animate-pulse" />}>
            <BlogTagBreakdownChart tagData={allTimeTagData} />
          </Suspense>
        </CardContent>
      </Card>

      {/* Post performance table (7d, top 5) */}
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
                    <th className="text-left py-2 font-medium cursor-pointer select-none" onClick={() => handleSort('title')}>
                      Title{sortIndicator('title')}
                    </th>
                    <th className="text-left py-2 pl-4 font-medium hidden md:table-cell cursor-pointer select-none" onClick={() => handleSort('date')}>
                      Date{sortIndicator('date')}
                    </th>
                    <th className="text-right py-2 pl-4 font-medium cursor-pointer select-none" onClick={() => handleSort('sessions')}>
                      Sessions{sortIndicator('sessions')}
                    </th>
                    <th className="text-right py-2 pl-4 font-medium hidden sm:table-cell cursor-pointer select-none" onClick={() => handleSort('pageViews')}>
                      Views{sortIndicator('pageViews')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRows.map((row) => (
                    <tr key={row.path} className="border-b border-border/50">
                      <td className="py-2 truncate max-w-[250px]" title={row.title}>{row.title}</td>
                      <td className="py-2 pl-4 font-mono text-xs text-muted-foreground hidden md:table-cell">{row.date}</td>
                      <td className="text-right py-2 pl-4 tabular-nums">{row.sessions.toLocaleString()}</td>
                      <td className="text-right py-2 pl-4 tabular-nums hidden sm:table-cell">{row.pageViews.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All-time leaderboard */}
      {sortedLeaderboard.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>All-Time Leaderboard</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium cursor-pointer select-none" onClick={() => handleLeaderboardSort('title')}>
                      Title{leaderboardSortIndicator('title')}
                    </th>
                    <th className="text-right py-2 pl-4 font-medium cursor-pointer select-none" onClick={() => handleLeaderboardSort('totalSessions')}>
                      Sessions{leaderboardSortIndicator('totalSessions')}
                    </th>
                    <th className="text-right py-2 pl-4 font-medium hidden sm:table-cell cursor-pointer select-none" onClick={() => handleLeaderboardSort('totalViews')}>
                      Views{leaderboardSortIndicator('totalViews')}
                    </th>
                    <th className="text-left py-2 pl-4 font-medium hidden md:table-cell">First Seen</th>
                    <th className="text-center py-2 pl-4 font-medium hidden lg:table-cell">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedLeaderboard.map((row) => (
                    <tr key={row.slug} className="border-b border-border/50">
                      <td className="py-2 truncate max-w-[250px]" title={row.title}>
                        {row.title}
                      </td>
                      <td className="text-right py-2 pl-4 tabular-nums">{row.totalSessions.toLocaleString()}</td>
                      <td className="text-right py-2 pl-4 tabular-nums hidden sm:table-cell">{row.totalViews.toLocaleString()}</td>
                      <td className="py-2 pl-4 font-mono text-xs text-muted-foreground hidden md:table-cell">{row.firstSeen}</td>
                      <td className="text-center py-2 pl-4 hidden lg:table-cell">
                        <TrendIcon active={row.recentlyActive} />
                      </td>
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
