import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type {
  GitHubBillingEntry,
  LighthousePageScore,
  WebVitalsData,
} from './types';
import { CoreWebVitalsCard } from './CoreWebVitalsCard';
import { GitHubBillingCard } from './GitHubBillingCard';
import { RumWebVitalsCard } from './RumWebVitalsCard';
import { TrafficQualityCard } from './TrafficQualityCard';

const LIGHTHOUSE_PAGE: LighthousePageScore = {
  page: 'home',
  url: 'https://example.com',
  performance: 95,
  accessibility: 100,
  seo: 100,
  bestPractices: 100,
  lcp: '1.2 s',
  fcp: '2.4 s',
  cls: '0.30',
  tbt: '700 ms',
};

describe('dithered analytics graphics', () => {
  it('shows Lighthouse vital thresholds as accessible patterned meters', () => {
    render(<CoreWebVitalsCard data={[LIGHTHOUSE_PAGE]} />);

    const good = screen.getByRole('progressbar', { name: 'LCP: 1.2 s' });
    expect(good).toHaveAttribute('aria-valuemax', '4');
    expect(good).toHaveAttribute('aria-valuenow', '1.2');
    expect(good).toHaveAttribute('aria-valuetext', '1.2 s, Good');

    const critical = screen.getByRole('progressbar', { name: 'TBT: 700 ms' });
    expect(critical).toHaveAttribute('aria-valuenow', '600');
    expect(critical).toHaveAttribute('aria-valuetext', '700 ms, Poor');
  });

  it('uses the same meter semantics for real-user vitals', () => {
    const data: WebVitalsData = {
      lastCheck: '2026-07-12T12:00:00Z',
      source: 'rum',
      metrics: {
        LCP: { count: 12, average: 3000, unit: 'ms' },
        INP: { count: 12, average: 700, unit: 'ms' },
      },
    };

    render(<RumWebVitalsCard data={data} />);

    expect(screen.getByRole('progressbar', { name: 'LCP: 3.00s' })).toHaveAttribute(
      'aria-valuetext',
      '3.00s, Needs Improvement',
    );
    expect(screen.getByRole('progressbar', { name: 'INP: 700ms' })).toHaveAttribute(
      'aria-valuetext',
      '700ms, Poor',
    );
  });

  it('describes the full traffic-quality composition', () => {
    render(
      <TrafficQualityCard
        topPages={[
          { page: '/blog/post', sessions: 20, users: 10, pageViews: 25 },
          { page: '/test-route', sessions: 7, users: 7, pageViews: 7 },
          { page: '/wp-login.php', sessions: 5, users: 5, pageViews: 5 },
          { page: '/pricing', sessions: 50, users: 50, pageViews: 50 },
        ]}
      />,
    );

    expect(
      screen.getByRole('img', {
        name: 'Tracked traffic composition: 20 human, 7 CI, 5 bot, 50 synthetic sessions',
      }),
    ).toBeTruthy();
  });

  it('renders repository usage as an exact-share dither meter', () => {
    const entry: GitHubBillingEntry = {
      timestamp: '2026-07-12T12:00:00Z',
      date: '2026-07-12',
      period: {
        start: '2026-07-01',
        end: '2026-07-12',
        description: 'Current month',
      },
      summary: {
        totalMinutes: 100,
        totalGrossAmount: 1,
        totalDiscountAmount: 1,
        totalNetAmount: 0,
      },
      byRunner: {
        linux: { minutes: 100, grossAmount: 1 },
        macos: { minutes: 0, grossAmount: 0 },
        windows: { minutes: 0, grossAmount: 0 },
      },
      byRepository: [
        { name: 'personal-website', minutes: 60, grossAmount: 0.6 },
      ],
      storage: { gbHours: 0, grossAmount: 0 },
      status: 'valid',
    };

    render(<GitHubBillingCard data={[entry]} />);

    const meter = screen.getByRole('progressbar', {
      name: 'personal-website Actions usage',
    });
    expect(meter).toHaveAttribute('aria-valuenow', '60');
    expect(meter).toHaveAttribute('aria-valuetext', '60 minutes, 60% of total');
  });
});
