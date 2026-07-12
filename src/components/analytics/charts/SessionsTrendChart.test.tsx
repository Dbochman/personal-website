import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { GA4HistoryEntry } from '../types';
import { SessionsTrendChart } from './SessionsTrendChart';

interface MockAreaChartProps {
  ariaLabel?: string;
  children: ReactNode;
  config: Record<string, unknown>;
  data: Array<Record<string, unknown>>;
}

vi.mock('@/components/dither-kit/area-chart', () => ({
  AreaChart: ({ ariaLabel, children, config, data }: MockAreaChartProps) => (
    <div
      role="img"
      aria-label={ariaLabel}
      data-config={JSON.stringify(config)}
      data-points={JSON.stringify(data)}
    >
      {children}
    </div>
  ),
}));

vi.mock('@/components/dither-kit/area', () => ({
  Area: ({ dataKey, variant }: { dataKey: string; variant: string }) => (
    <span data-testid="area-series" data-key={dataKey} data-variant={variant} />
  ),
}));

vi.mock('@/components/dither-kit/grid', () => ({ Grid: () => null }));
vi.mock('@/components/dither-kit/x-axis', () => ({ XAxis: () => null }));
vi.mock('@/components/dither-kit/y-axis', () => ({ YAxis: () => null }));
vi.mock('@/components/dither-kit/tooltip', () => ({ Tooltip: () => null }));

function historyEntry(date: string, sessions: number): GA4HistoryEntry {
  return {
    timestamp: `${date}T12:00:00Z`,
    date,
    period: { description: 'Last 7 days' },
    summary: {
      sessions,
      users: sessions,
      pageViews: sessions,
      averageSessionDuration: 0,
      bounceRate: 0,
    },
    topPages: [],
    deviceBreakdown: [],
  };
}

describe('SessionsTrendChart', () => {
  it('renders the existing empty state', () => {
    render(<SessionsTrendChart data={[]} />);

    expect(screen.getByText('No data available').textContent).toBe('No data available');
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('maps rolling snapshots into an accessible dithered area with a visible summary', () => {
    render(
      <SessionsTrendChart
        data={[
          historyEntry('2026-07-10', 100),
          historyEntry('2026-07-11', 200),
          historyEntry('2026-07-12', 150),
        ]}
      />,
    );

    const chart = screen.getByRole('img', { name: /rolling seven-day session snapshots/i });
    expect(JSON.parse(chart.dataset.points ?? '[]')).toEqual([
      { date: 'Jul 10', sessions: 100 },
      { date: 'Jul 11', sessions: 200 },
      { date: 'Jul 12', sessions: 150 },
    ]);
    expect(JSON.parse(chart.dataset.config ?? '{}')).toEqual({
      sessions: { label: 'Sessions', color: 'blue' },
    });
    expect(chart.getAttribute('aria-label')).toContain('Latest: 150 sessions');
    expect(chart.getAttribute('aria-label')).toContain('High: 200 sessions on Jul 11');

    expect(screen.getByLabelText('Session trend summary').textContent).toContain('Latest 7d150');
    expect(screen.getByLabelText('Session trend summary').textContent).toContain('High · Jul 11200');
    expect(screen.getByLabelText('Session trend summary').textContent).toContain('Change+50');

    const area = screen.getByTestId('area-series');
    expect(area.dataset.key).toBe('sessions');
    expect(area.dataset.variant).toBe('gradient');
  });

  it('normalizes non-finite and negative metrics to zero', () => {
    render(
      <SessionsTrendChart
        data={[
          historyEntry('2026-07-10', Number.NaN),
          historyEntry('2026-07-11', Number.POSITIVE_INFINITY),
          historyEntry('2026-07-12', -5),
        ]}
      />,
    );

    const chart = screen.getByRole('img', { name: /rolling seven-day session snapshots/i });
    expect(JSON.parse(chart.dataset.points ?? '[]')).toEqual([
      { date: 'Jul 10', sessions: 0 },
      { date: 'Jul 11', sessions: 0 },
      { date: 'Jul 12', sessions: 0 },
    ]);
  });
});
