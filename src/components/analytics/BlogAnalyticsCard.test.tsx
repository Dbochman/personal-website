import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BlogAnalyticsCard } from './BlogAnalyticsCard';
import type { GA4HistoryEntry } from './types';

vi.mock('@/content/blog/index', () => ({ getAllPosts: () => [] }));
vi.mock('./charts/BlogTrafficChart', () => ({ BlogTrafficChart: () => null }));
vi.mock('./charts/BlogTagBreakdownChart', () => ({ BlogTagBreakdownChart: () => null }));

function report(): GA4HistoryEntry {
  return {
    timestamp: '2026-10-31T10:00:00Z', date: '2026-10-31',
    period: { description: 'Last 7 completed days', startDate: '2026-10-23', endDate: '2026-10-29' },
    summary: { sessions: 6, users: 6, pageViews: 6, averageSessionDuration: 0, bounceRate: 0 },
    topPages: [], deviceBreakdown: [],
    blogPages: Array.from({ length: 12 }, (_, i) => ({
      page: `/blog/recent-post-${i}`, sessions: 12 - i, users: 1, pageViews: 12 - i,
    })),
  };
}

describe('blog performance table', () => {
  it('caps both tables at ten posts independently of the site-wide leaderboard', async () => {
    const entry = report();
    render(<BlogAnalyticsCard latestGA4={entry} ga4History={[entry]} />);
    const tables = await screen.findAllByRole('table');
    expect(tables).toHaveLength(2);
    for (const table of tables) {
      expect(within(table).getAllByRole('row')).toHaveLength(11);
      expect(within(table).getByText('recent-post-9')).toBeInTheDocument();
      expect(within(table).queryByText('recent-post-10')).not.toBeInTheDocument();
    }
    expect(screen.getByText(/Reporting period: 2026-10-23 to 2026-10-29/)).toBeInTheDocument();
    expect(screen.queryByText(/Missing posts do not imply zero visits/)).not.toBeInTheDocument();
  });

  it('explains incomplete historical reports instead of implying zero traffic', () => {
    const entry = report();
    delete entry.blogPages;
    render(<BlogAnalyticsCard latestGA4={entry} ga4History={[entry]} />);
    expect(screen.getByText(/Missing posts do not imply zero visits/)).toBeInTheDocument();
  });
});
