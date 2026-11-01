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
    blogPages: Array.from({ length: 6 }, (_, i) => ({
      page: `/blog/recent-post-${i}`, sessions: 6 - i, users: 1, pageViews: 6 - i,
    })),
  };
}

describe('blog performance table', () => {
  it('shows posts beyond the fifth row and outside the site-wide leaderboard', async () => {
    const entry = report();
    render(<BlogAnalyticsCard latestGA4={entry} ga4History={[entry]} />);
    const table = (await screen.findAllByRole('table'))[0];
    expect(within(table).getAllByRole('row')).toHaveLength(7);
    expect(within(table).getByText('recent-post-5')).toBeInTheDocument();
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
