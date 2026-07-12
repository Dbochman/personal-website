import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { GA4HistoryEntry } from '../types';
import { BlogTrafficChart } from './BlogTrafficChart';

interface MockAreaChartProps {
  ariaLabel?: string;
  children: ReactNode;
  config: Record<string, unknown>;
  data: Array<Record<string, unknown>>;
  stackType?: string;
}

vi.mock('@/components/dither-kit/area-chart', () => ({
  AreaChart: ({ ariaLabel, children, config, data, stackType }: MockAreaChartProps) => (
    <div
      role="img"
      aria-label={ariaLabel}
      data-config={JSON.stringify(config)}
      data-points={JSON.stringify(data)}
      data-stack-type={stackType}
    >
      {children}
    </div>
  ),
}));

vi.mock('@/components/dither-kit/area', () => ({
  Area: ({
    dataKey,
    isClickable,
    variant,
  }: {
    dataKey: string;
    isClickable?: boolean;
    variant: string;
  }) => (
    <span
      data-testid="area-series"
      data-clickable={String(Boolean(isClickable))}
      data-key={dataKey}
      data-variant={variant}
    />
  ),
}));

vi.mock('@/components/dither-kit/grid', () => ({ Grid: () => null }));
vi.mock('@/components/dither-kit/x-axis', () => ({ XAxis: () => null }));
vi.mock('@/components/dither-kit/y-axis', () => ({ YAxis: () => null }));
vi.mock('@/components/dither-kit/legend', () => ({ Legend: () => null }));
vi.mock('@/components/dither-kit/tooltip', () => ({
  Tooltip: ({
    hideZero,
    itemLabelFormatter,
  }: {
    hideZero?: boolean;
    itemLabelFormatter?: (name: string, label: string) => string;
  }) => (
    <span
      data-testid="chart-tooltip"
      data-hide-zero={String(Boolean(hideZero))}
      data-first-label={itemLabelFormatter?.('post-1', 'Alpha Canonical Post')}
      data-other-label={itemLabelFormatter?.('other', 'Other tracked posts')}
    />
  ),
}));

interface Post {
  title: string;
  slug: string;
}

interface PostLookups {
  bySlug: Map<string, Post>;
  byStrippedSlug: Map<string, Post>;
  byTitleKey: Map<string, Post>;
}

const POSTS = [
  { title: 'Alpha Canonical Post', slug: 'alpha' },
  { title: 'Beta Deployment Notes', slug: 'beta' },
  { title: 'Gamma Reliability Guide', slug: 'gamma' },
  { title: 'Delta Incident Review', slug: 'delta' },
  { title: 'Epsilon Systems Essay', slug: 'epsilon' },
  { title: 'Zeta Operations Log', slug: 'zeta' },
] as const;

function createPostLookups(): PostLookups {
  const bySlug = new Map<string, Post>(POSTS.map((post) => [post.slug, post]));
  bySlug.set('alpha-legacy', POSTS[0]);

  return {
    bySlug,
    byStrippedSlug: new Map(),
    byTitleKey: new Map(),
  };
}

function matchPost(slug: string, lookups: PostLookups) {
  return lookups.bySlug.get(slug);
}

function page(page: string, sessions: number) {
  return { page, sessions, users: sessions, pageViews: sessions };
}

function historyEntry(
  date: string,
  topPages: GA4HistoryEntry['topPages'],
): GA4HistoryEntry {
  return {
    timestamp: `${date}T12:00:00Z`,
    date,
    period: { description: 'Last 7 days' },
    summary: {
      sessions: 0,
      users: 0,
      pageViews: 0,
      averageSessionDuration: 0,
      bounceRate: 0,
    },
    topPages,
    deviceBreakdown: [],
  };
}

describe('BlogTrafficChart', () => {
  it('renders explicit empty states', () => {
    const postLookups = createPostLookups();
    const { rerender } = render(
      <BlogTrafficChart data={[]} postLookups={postLookups} matchPost={matchPost} />,
    );

    expect(screen.getByText('No data available').textContent).toBe('No data available');
    expect(screen.queryByRole('img')).toBeNull();

    rerender(
      <BlogTrafficChart
        data={[
          historyEntry('2026-07-12', [
            page('/about', 12),
            page('/blog/', 8),
            page('/blog/alpha', -4),
            page('/blog/beta', Number.POSITIVE_INFINITY),
          ]),
        ]}
        postLookups={postLookups}
        matchPost={matchPost}
      />,
    );

    expect(screen.getByText('No blog traffic available').textContent).toBe(
      'No blog traffic available',
    );
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('renders canonical top-five and Other rolling series with safe keys and full summaries', () => {
    const postLookups = createPostLookups();
    render(
      <BlogTrafficChart
        data={[
          historyEntry('2026-07-11', [
            page('/blog/alpha/', 10),
            page('/blog/alpha-legacy/', 5),
            page('/blog/alpha', 2),
            page('/blog/beta', 14),
            page('/blog/gamma/', 12),
            page('/blog/delta', 10),
            page('/blog/epsilon/', 8),
            page('/blog/zeta', 6),
          ]),
          historyEntry('2026-07-12', [
            page('/blog/alpha-legacy', 3),
            page('/blog/beta/', 4),
            page('/blog/gamma', 5),
            page('/blog/delta/', 6),
            page('/blog/epsilon', 7),
            page('/blog/zeta/', 8),
          ]),
        ]}
        postLookups={postLookups}
        matchPost={matchPost}
      />,
    );

    const chart = screen.getByRole('img', {
      name: /blog traffic across 2 rolling seven-day snapshots/i,
    });
    expect(chart.dataset.stackType).toBe('stacked');
    expect(JSON.parse(chart.dataset.points ?? '[]')).toEqual([
      {
        date: 'Jul 11',
        'post-1': 17,
        'post-2': 14,
        'post-3': 12,
        'post-4': 10,
        'post-5': 8,
        other: 6,
      },
      {
        date: 'Jul 12',
        'post-1': 3,
        'post-2': 4,
        'post-3': 5,
        'post-4': 6,
        'post-5': 7,
        other: 8,
      },
    ]);
    expect(JSON.parse(chart.dataset.config ?? '{}')).toEqual({
      'post-1': { label: 'Alpha Canonical Post', color: 'blue' },
      'post-2': { label: 'Beta Deployment Notes', color: 'purple' },
      'post-3': { label: 'Gamma Reliability Guide', color: 'green' },
      'post-4': { label: 'Delta Incident Review', color: 'orange' },
      'post-5': { label: 'Epsilon Systems Essay', color: 'pink' },
      other: { label: 'Other tracked posts', color: 'grey' },
    });

    expect(chart.getAttribute('aria-label')).toContain('from Jul 11 to Jul 12');
    expect(chart.getAttribute('aria-label')).toContain(
      'Alpha Canonical Post: latest 3 sessions, high 17 on Jul 11',
    );
    expect(chart.getAttribute('aria-label')).toContain(
      'Other tracked posts: latest 8 sessions, high 8 on Jul 12',
    );

    const areas = screen.getAllByTestId('area-series');
    expect(areas.map((area) => area.dataset.key)).toEqual([
      'post-1',
      'post-2',
      'post-3',
      'post-4',
      'post-5',
      'other',
    ]);
    expect(areas.map((area) => area.dataset.variant)).toEqual([
      'gradient',
      'dotted',
      'hatched',
      'gradient',
      'dotted',
      'solid',
    ]);
    expect(areas.every((area) => area.dataset.clickable === 'true')).toBe(true);
    expect(screen.getByTestId('chart-tooltip').dataset.hideZero).toBe('true');
    expect(screen.getByTestId('chart-tooltip').dataset.firstLabel).toBe('#1');
    expect(screen.getByTestId('chart-tooltip').dataset.otherLabel).toBe('Other');

    const summary = screen.getByRole('list', {
      name: 'Blog traffic latest and high values',
    });
    for (const post of POSTS.slice(0, 5)) {
      expect(summary.textContent).toContain(post.title);
    }
    expect(summary.textContent).toContain('Other tracked posts');
    expect(summary.textContent).toContain('3 latest');
    expect(summary.textContent).toContain('17 high');
  });

  it('normalizes non-finite and negative per-snapshot metrics to zero', () => {
    const postLookups = createPostLookups();
    render(
      <BlogTrafficChart
        data={[
          historyEntry(
            '2026-07-11',
            POSTS.slice(0, 5).map((post, index) =>
              page(`/blog/${post.slug}`, 50 - index * 10),
            ),
          ),
          historyEntry('2026-07-12', [
            page('/blog/alpha', Number.NaN),
            page('/blog/beta', Number.POSITIVE_INFINITY),
            page('/blog/gamma', Number.NEGATIVE_INFINITY),
            page('/blog/delta', -4),
            page('/blog/epsilon', 2),
          ]),
        ]}
        postLookups={postLookups}
        matchPost={matchPost}
      />,
    );

    const chart = screen.getByRole('img', {
      name: /blog traffic across 2 rolling seven-day snapshots/i,
    });
    expect(JSON.parse(chart.dataset.points ?? '[]')[1]).toEqual({
      date: 'Jul 12',
      'post-1': 0,
      'post-2': 0,
      'post-3': 0,
      'post-4': 0,
      'post-5': 2,
    });
  });
});
