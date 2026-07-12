import type { ReactNode } from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { SearchConsoleHistoryEntry } from '../types';
import { SearchPerformanceChart } from './SearchPerformanceChart';

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

function historyEntry(
  date: string,
  clicks: number,
  impressions: number,
): SearchConsoleHistoryEntry {
  return {
    timestamp: `${date}T12:00:00Z`,
    date,
    period: { start: date, end: date },
    summary: {
      totalClicks: clicks,
      totalImpressions: impressions,
      averageCTR: 0,
      averagePosition: 0,
    },
  };
}

describe('SearchPerformanceChart', () => {
  it('renders the existing empty state', () => {
    render(<SearchPerformanceChart data={[]} />);

    expect(screen.getByText('No data available').textContent).toBe('No data available');
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('uses independent dithered small multiples with visible trend summaries', () => {
    render(
      <SearchPerformanceChart
        data={[
          historyEntry('2026-07-10', 20, 1_000),
          historyEntry('2026-07-11', 15, 1_500),
          historyEntry('2026-07-12', 30, 1_200),
        ]}
      />,
    );

    const impressionsChart = screen.getByRole('img', {
      name: /Impressions across 3 rolling seven-day Search Console snapshots/i,
    });
    const clicksChart = screen.getByRole('img', {
      name: /Clicks across 3 rolling seven-day Search Console snapshots/i,
    });
    const expectedPoints = [
      { date: 'Jul 10', clicks: 20, impressions: 1_000 },
      { date: 'Jul 11', clicks: 15, impressions: 1_500 },
      { date: 'Jul 12', clicks: 30, impressions: 1_200 },
    ];

    expect(JSON.parse(impressionsChart.dataset.points ?? '[]')).toEqual(expectedPoints);
    expect(JSON.parse(clicksChart.dataset.points ?? '[]')).toEqual(expectedPoints);
    expect(JSON.parse(impressionsChart.dataset.config ?? '{}')).toEqual({
      impressions: { label: 'Impressions', color: 'blue' },
    });
    expect(JSON.parse(clicksChart.dataset.config ?? '{}')).toEqual({
      clicks: { label: 'Clicks', color: 'purple' },
    });
    expect(impressionsChart.getAttribute('aria-label')).toContain(
      'Latest: 1,200 impressions',
    );
    expect(impressionsChart.getAttribute('aria-label')).toContain(
      'High: 1,500 impressions on Jul 11',
    );
    expect(clicksChart.getAttribute('aria-label')).toContain('Change across the displayed snapshots: +10 clicks');

    const areas = screen.getAllByTestId('area-series');
    expect(areas.map((area) => [area.dataset.key, area.dataset.variant])).toEqual([
      ['impressions', 'gradient'],
      ['clicks', 'dotted'],
    ]);

    expect(screen.getByLabelText('Impressions search trend summary').textContent).toContain(
      'Latest1,200',
    );
    expect(screen.getByLabelText('Impressions search trend summary').textContent).toContain(
      'High · Jul 111,500',
    );
    expect(screen.getByLabelText('Clicks search trend summary').textContent).toContain(
      'Change+10',
    );

    const table = screen.getByRole('table', {
      name: 'Rolling seven-day Search Console snapshots',
    });
    expect(within(table).getAllByRole('row')).toHaveLength(4);
    expect(table.textContent).toContain('Jul 12120030');
  });

  it('normalizes non-finite and negative search metrics to zero', () => {
    render(
      <SearchPerformanceChart
        data={[
          historyEntry('2026-07-10', Number.NaN, Number.POSITIVE_INFINITY),
          historyEntry('2026-07-11', -4, Number.NEGATIVE_INFINITY),
        ]}
      />,
    );

    const chart = screen.getByRole('img', {
      name: /Impressions across 2 rolling seven-day Search Console snapshots/i,
    });
    expect(JSON.parse(chart.dataset.points ?? '[]')).toEqual([
      { date: 'Jul 10', clicks: 0, impressions: 0 },
      { date: 'Jul 11', clicks: 0, impressions: 0 },
    ]);
  });
});
