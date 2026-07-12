import type { ReactNode } from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DeviceBreakdownChart } from './DeviceBreakdownChart';

interface MockPieChartProps {
  ariaLabel?: string;
  bloom?: string;
  children: ReactNode;
  config: Record<string, unknown>;
}

vi.mock('@/components/dither-kit/pie-chart', () => ({
  PieChart: ({ ariaLabel, bloom, children, config }: MockPieChartProps) => (
    <div
      role="img"
      aria-label={ariaLabel}
      data-bloom={bloom}
      data-config={JSON.stringify(config)}
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

const STANDARD_DEVICES = [
  { device: 'desktop', sessions: 1_200, users: 900 },
  { device: 'mobile', sessions: 600, users: 500 },
  { device: 'tablet', sessions: 200, users: 150 },
];

describe('DeviceBreakdownChart', () => {
  it('keeps exact device totals and percentages visible beside the chart', () => {
    render(<DeviceBreakdownChart data={STANDARD_DEVICES} />);

    const chart = screen.getByRole('img', { name: /device session distribution/i });
    expect(chart.getAttribute('aria-label')).toBe(
      'Device session distribution: Desktop, 1,200 sessions, 60.0%; Mobile, 600 sessions, 30.0%; Tablet, 200 sessions, 10.0%.',
    );
    expect(chart.dataset.bloom).toBe('off');

    const totals = screen.getByRole('list', { name: 'Device session totals' });
    expect(within(totals).getByText('Desktop').textContent).toBe('Desktop');
    expect(within(totals).getByText('1,200').textContent).toBe('1,200');
    expect(within(totals).getByText('60.0%').textContent).toBe('60.0%');
    expect(within(totals).getByText('Mobile').textContent).toBe('Mobile');
    expect(within(totals).getByText('600').textContent).toBe('600');
    expect(within(totals).getByText('30.0%').textContent).toBe('30.0%');
    expect(within(totals).getByText('Tablet').textContent).toBe('Tablet');
    expect(within(totals).getByText('200').textContent).toBe('200');
    expect(within(totals).getByText('10.0%').textContent).toBe('10.0%');
  });

  it('assigns distinct textures to the standard device categories', () => {
    render(<DeviceBreakdownChart data={STANDARD_DEVICES} />);

    const textureLayer = screen.getByTestId('pie-textures');
    expect(JSON.parse(textureLayer.dataset.variants ?? '{}')).toEqual({
      Desktop: 'gradient',
      Mobile: 'dotted',
      Tablet: 'hatched',
    });

    const chart = screen.getByRole('img', { name: /device session distribution/i });
    expect(JSON.parse(chart.dataset.config ?? '{}')).toEqual({
      Desktop: { label: 'Desktop', color: 'blue' },
      Mobile: { label: 'Mobile', color: 'purple' },
      Tablet: { label: 'Tablet', color: 'orange' },
    });
  });

  it('uses a deterministic supported style for an unfamiliar device category', () => {
    const data = [{ device: 'smart_tv', sessions: 25, users: 20 }];
    const { rerender } = render(<DeviceBreakdownChart data={data} />);

    const textureLayer = screen.getByTestId('pie-textures');
    const firstVariants = textureLayer.dataset.variants;
    const chart = screen.getByRole('img', { name: /smart tv/i });
    const firstConfig = chart.dataset.config;

    expect(
      within(screen.getByRole('list', { name: 'Device session totals' })).getByText('Smart Tv').textContent,
    ).toBe('Smart Tv');
    expect(['gradient', 'dotted', 'hatched', 'solid']).toContain(
      Object.values(JSON.parse(firstVariants ?? '{}'))[0],
    );
    expect(Object.values(JSON.parse(firstConfig ?? '{}'))[0]).toMatchObject({
      label: 'Smart Tv',
    });

    rerender(<DeviceBreakdownChart data={[...data]} />);
    expect(screen.getByTestId('pie-textures').dataset.variants).toBe(firstVariants);
    expect(screen.getByRole('img', { name: /smart tv/i }).dataset.config).toBe(firstConfig);
  });

  it('assigns equivalent aliases the same style regardless of input order', () => {
    const aliases = [
      { device: 'smart_tv', sessions: 15, users: 10 },
      { device: 'smart-tv', sessions: 10, users: 8 },
    ];
    const { rerender } = render(<DeviceBreakdownChart data={aliases} />);

    const firstConfig = screen.getByRole('img', { name: /smart tv/i }).dataset.config;
    const firstVariants = screen.getByTestId('pie-textures').dataset.variants;

    rerender(<DeviceBreakdownChart data={[...aliases].reverse()} />);

    expect(screen.getByRole('img', { name: /smart tv/i }).dataset.config).toBe(firstConfig);
    expect(screen.getByTestId('pie-textures').dataset.variants).toBe(firstVariants);
  });

  it('treats non-finite session values as zero', () => {
    render(
      <DeviceBreakdownChart
        data={[
          { device: 'desktop', sessions: Number.NaN, users: 1 },
          { device: 'desktop', sessions: Number.POSITIVE_INFINITY, users: 1 },
          { device: 'desktop', sessions: Number.NEGATIVE_INFINITY, users: 1 },
        ]}
      />,
    );

    expect(
      screen.getByRole('img', { name: /device session distribution/i }).getAttribute('aria-label'),
    ).toBe('Device session distribution: Desktop, 0 sessions, 0.0%.');
    expect(screen.getByRole('list', { name: 'Device session totals' }).textContent).toContain('0.0%');
  });

  it('shows the existing empty state without mounting a chart', () => {
    render(<DeviceBreakdownChart data={[]} />);

    expect(screen.getByText('No data available').textContent).toBe('No data available');
    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.queryByRole('list')).toBeNull();
  });
});
