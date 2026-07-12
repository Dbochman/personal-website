import type { ReactNode } from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TrafficSourcesChart } from './TrafficSourcesChart';

interface MockPieChartProps {
  ariaLabel?: string;
  bloom?: string;
  children: ReactNode;
  config: Record<string, unknown>;
  data: Array<Record<string, unknown>>;
  innerRadius?: number;
}

vi.mock('@/components/dither-kit/pie-chart', () => ({
  PieChart: ({
    ariaLabel,
    bloom,
    children,
    config,
    data,
    innerRadius,
  }: MockPieChartProps) => (
    <div
      role="img"
      aria-label={ariaLabel}
      data-bloom={bloom}
      data-config={JSON.stringify(config)}
      data-inner-radius={innerRadius}
      data-points={JSON.stringify(data)}
    >
      {children}
    </div>
  ),
}));

vi.mock('@/components/dither-kit/pie', () => ({
  Pie: ({
    variant,
    variants,
  }: {
    variant?: string;
    variants?: Record<string, string>;
  }) => (
    <span
      data-testid="pie-textures"
      data-default-variant={variant}
      data-variants={JSON.stringify(variants)}
    />
  ),
}));

vi.mock('@/components/dither-kit/tooltip', () => ({
  Tooltip: () => null,
}));

function sourceData(
  channels: Array<{ channel: string; sessions: number; users?: number }>,
) {
  return {
    channels: channels.map((channel) => ({ users: channel.sessions, ...channel })),
    sources: [],
  };
}

describe('TrafficSourcesChart', () => {
  it('aggregates safely and renders the top five channels plus Other', () => {
    render(
      <TrafficSourcesChart
        data={sourceData([
          { channel: ' Direct ', sessions: 40 },
          { channel: 'direct', sessions: 20 },
          { channel: 'Organic Search', sessions: 30 },
          { channel: 'Referral', sessions: 20 },
          { channel: 'AI Assistant', sessions: 15 },
          { channel: 'Organic Social', sessions: 10 },
          { channel: 'Email', sessions: 5 },
          { channel: 'Paid Social', sessions: Number.NaN },
          { channel: 'Display', sessions: Number.POSITIVE_INFINITY },
          { channel: 'Affiliates', sessions: -30 },
        ])}
      />,
    );

    const chart = screen.getByRole('img', {
      name: /traffic source session distribution for the latest seven-day snapshot/i,
    });
    expect(chart.dataset.bloom).toBe('off');
    expect(chart.dataset.innerRadius).toBe('0.56');
    expect(JSON.parse(chart.dataset.points ?? '[]')).toEqual([
      {
        key: 'direct',
        label: 'Direct',
        value: 60,
        color: 'blue',
        variant: 'gradient',
      },
      {
        key: 'organic search',
        label: 'Organic Search',
        value: 30,
        color: 'green',
        variant: 'hatched',
      },
      {
        key: 'referral',
        label: 'Referral',
        value: 20,
        color: 'purple',
        variant: 'dotted',
      },
      {
        key: 'ai assistant',
        label: 'AI Assistant',
        value: 15,
        color: 'pink',
        variant: 'dotted',
      },
      {
        key: 'organic social',
        label: 'Organic Social',
        value: 10,
        color: 'orange',
        variant: 'hatched',
      },
      {
        key: '__other__',
        label: 'All other channels',
        value: 5,
        color: 'grey',
        variant: 'hatched',
      },
    ]);
    expect(JSON.parse(chart.dataset.config ?? '{}')).toEqual({
      direct: { label: 'Direct', color: 'blue' },
      'organic search': { label: 'Organic Search', color: 'green' },
      referral: { label: 'Referral', color: 'purple' },
      'ai assistant': { label: 'AI Assistant', color: 'pink' },
      'organic social': { label: 'Organic Social', color: 'orange' },
      __other__: { label: 'All other channels', color: 'grey' },
    });
    expect(JSON.parse(screen.getByTestId('pie-textures').dataset.variants ?? '{}')).toEqual({
      direct: 'gradient',
      'organic search': 'hatched',
      referral: 'dotted',
      'ai assistant': 'dotted',
      'organic social': 'hatched',
      __other__: 'hatched',
    });

    expect(chart.getAttribute('aria-label')).toBe(
      'Traffic source session distribution for the latest seven-day snapshot: Direct, 60 sessions, 42.9%; Organic Search, 30 sessions, 21.4%; Referral, 20 sessions, 14.3%; AI Assistant, 15 sessions, 10.7%; Organic Social, 10 sessions, 7.1%; All other channels, 5 sessions, 3.6%.',
    );

    const totals = screen.getByRole('list', { name: 'Traffic source session totals' });
    expect(within(totals).getByText('Direct').textContent).toBe('Direct');
    expect(within(totals).getByText('60').textContent).toBe('60');
    expect(within(totals).getByText('42.9%').textContent).toBe('42.9%');
    expect(within(totals).getByText('All other channels').textContent).toBe(
      'All other channels',
    );
    expect(within(totals).getByText('5').textContent).toBe('5');
    expect(within(totals).getByText('3.6%').textContent).toBe('3.6%');
  });

  it('shows an empty state for missing or non-positive channel data', () => {
    const { rerender } = render(<TrafficSourcesChart data={undefined} />);

    expect(screen.getByText('No traffic source data available').textContent).toBe(
      'No traffic source data available',
    );
    expect(screen.queryByRole('img')).toBeNull();

    rerender(
      <TrafficSourcesChart
        data={sourceData([
          { channel: 'Direct', sessions: 0 },
          { channel: 'Referral', sessions: -1 },
          { channel: 'Organic Search', sessions: Number.NEGATIVE_INFINITY },
        ])}
      />,
    );

    expect(screen.getByText('No traffic source data available').textContent).toBe(
      'No traffic source data available',
    );
    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.queryByRole('list')).toBeNull();
  });

  it('keeps a real Other channel distinct from the aggregate bucket', () => {
    render(
      <TrafficSourcesChart
        data={sourceData([
          { channel: 'Other', sessions: 70 },
          { channel: 'Direct', sessions: 60 },
          { channel: 'Referral', sessions: 50 },
          { channel: 'Email', sessions: 40 },
          { channel: 'Organic Search', sessions: 30 },
          { channel: 'Organic Social', sessions: 20 },
          { channel: 'Display', sessions: 10 },
        ])}
      />,
    );

    const points = JSON.parse(
      screen.getByRole('img', { name: /traffic source session distribution/i }).dataset.points ?? '[]',
    );
    expect(points.map((point: { key: string }) => point.key)).toEqual([
      'other',
      'direct',
      'referral',
      'email',
      'organic search',
      '__other__',
    ]);
    expect(points.map((point: { label: string }) => point.label)).toEqual([
      'Other',
      'Direct',
      'Referral',
      'Email',
      'Organic Search',
      'All other channels',
    ]);
  });
});
