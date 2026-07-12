import type { ReactNode } from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { GitHubBillingEntry } from '../types';
import { BillingTrendChart } from './BillingTrendChart';

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

function billingEntry(date: string, totalMinutes: number): GitHubBillingEntry {
  return {
    timestamp: `${date}T12:00:00Z`,
    date,
    period: {
      start: '2026-01-01',
      end: date,
      description: 'Billing period to date',
    },
    summary: {
      totalMinutes,
      totalGrossAmount: 0,
      totalDiscountAmount: 0,
      totalNetAmount: 0,
    },
    byRunner: {
      linux: { minutes: 0, grossAmount: 0 },
      macos: { minutes: 0, grossAmount: 0 },
      windows: { minutes: 0, grossAmount: 0 },
    },
    byRepository: [],
    storage: { gbHours: 0, grossAmount: 0 },
    status: 'valid',
  };
}

describe('BillingTrendChart', () => {
  it('renders the existing empty state', () => {
    render(<BillingTrendChart data={[]} />);

    expect(screen.getByText('No billing history available yet').textContent).toBe(
      'No billing history available yet',
    );
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('renders reported cumulative minutes without the unused savings series', () => {
    render(
      <BillingTrendChart
        data={[
          billingEntry('2026-06-28', 9_444),
          billingEntry('2026-07-05', 9_672),
          billingEntry('2026-07-12', 9_814),
        ]}
      />,
    );

    const chart = screen.getByRole('img', {
      name: /reported snapshots of cumulative GitHub Actions minutes/i,
    });
    expect(JSON.parse(chart.dataset.points ?? '[]')).toEqual([
      { date: 'Jun 28', minutes: 9_444 },
      { date: 'Jul 5', minutes: 9_672 },
      { date: 'Jul 12', minutes: 9_814 },
    ]);
    expect(JSON.parse(chart.dataset.config ?? '{}')).toEqual({
      minutes: { label: 'Cumulative minutes', color: 'purple' },
    });
    expect(chart.getAttribute('aria-label')).toContain('First reported: 9,444 minutes');
    expect(chart.getAttribute('aria-label')).toContain('Latest: 9,814 minutes');
    expect(chart.getAttribute('aria-label')).toContain(
      'Change across the displayed snapshots: +370 minutes',
    );

    const area = screen.getByTestId('area-series');
    expect(area.dataset.key).toBe('minutes');
    expect(area.dataset.variant).toBe('gradient');
    expect(screen.queryByText(/Savings/)).toBeNull();

    const summary = screen.getByLabelText('GitHub Actions billing-minute trend summary');
    expect(summary.textContent).toContain('First · Jun 289,444');
    expect(summary.textContent).toContain('Latest · Jul 129,814');
    expect(summary.textContent).toContain('Change+370');

    const table = screen.getByRole('table', {
      name: 'Reported cumulative GitHub Actions minute snapshots',
    });
    expect(within(table).getAllByRole('row')).toHaveLength(4);
    expect(table.textContent).toContain('Jul 129814');
  });

  it('normalizes non-finite and negative cumulative minutes to zero', () => {
    render(
      <BillingTrendChart
        data={[
          billingEntry('2026-07-10', Number.NaN),
          billingEntry('2026-07-11', Number.POSITIVE_INFINITY),
          billingEntry('2026-07-12', -5),
        ]}
      />,
    );

    const chart = screen.getByRole('img', {
      name: /reported snapshots of cumulative GitHub Actions minutes/i,
    });
    expect(JSON.parse(chart.dataset.points ?? '[]')).toEqual([
      { date: 'Jul 10', minutes: 0 },
      { date: 'Jul 11', minutes: 0 },
      { date: 'Jul 12', minutes: 0 },
    ]);
  });
});
