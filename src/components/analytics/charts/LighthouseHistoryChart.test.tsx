import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { LighthousePageScore } from '../types';
import { LighthouseHistoryChart } from './LighthouseHistoryChart';

function score(page: string, performance: number): LighthousePageScore {
  return {
    page,
    url: `https://example.com/${page}`,
    performance,
    accessibility: 100,
    seo: 100,
    bestPractices: 100,
    lcp: '1.2 s',
    fcp: '0.8 s',
    cls: '0',
    tbt: '20 ms',
  };
}

function fillOf(progressbar: HTMLElement) {
  const fill = progressbar.querySelector<HTMLElement>('span[aria-hidden="true"]');
  if (!fill) throw new Error('Expected a dither meter fill');
  return fill;
}

describe('LighthouseHistoryChart', () => {
  it('keeps the existing empty state', () => {
    render(<LighthouseHistoryChart data={[]} />);

    expect(screen.getByText('No data available').textContent).toBe('No data available');
    expect(screen.queryByRole('list')).toBeNull();
    expect(screen.queryByRole('progressbar')).toBeNull();
  });

  it('uses fixed-domain semantic dither meters with an accessible target', () => {
    render(
      <LighthouseHistoryChart
        data={[
          score('home', 90),
          score('blog', 70),
          score('project-slo', 69),
          score('too-high', 150),
          score('invalid-score', Number.NaN),
          score('negative-score', -12),
        ]}
      />,
    );

    const list = screen.getByRole('list', {
      name: /lighthouse performance scores by page\. target: 90 or higher/i,
    });
    expect(list.getAttribute('aria-label')).toContain(
      'Home: 90 out of 100, Good',
    );
    expect(list.getAttribute('aria-label')).toContain(
      'Blog: 70 out of 100, Needs improvement',
    );
    expect(list.getAttribute('aria-label')).toContain(
      'Project SLO: 69 out of 100, Poor',
    );
    expect(screen.getByText('90 or higher').textContent).toBe('90 or higher');

    const home = screen.getByRole('progressbar', { name: 'Home' });
    const blog = screen.getByRole('progressbar', { name: 'Blog' });
    const slo = screen.getByRole('progressbar', { name: 'Project SLO' });
    const tooHigh = screen.getByRole('progressbar', { name: 'Too High' });
    const invalid = screen.getByRole('progressbar', { name: 'Invalid Score' });
    const negative = screen.getByRole('progressbar', { name: 'Negative Score' });

    expect(home.getAttribute('aria-valuemax')).toBe('100');
    expect(home.getAttribute('aria-valuenow')).toBe('90');
    expect(home.getAttribute('aria-valuetext')).toBe('Home: 90/100, Good');
    expect(blog.getAttribute('aria-valuenow')).toBe('70');
    expect(blog.getAttribute('aria-valuetext')).toBe(
      'Blog: 70/100, Needs improvement',
    );
    expect(slo.getAttribute('aria-valuenow')).toBe('69');
    expect(slo.getAttribute('aria-valuetext')).toBe('Project SLO: 69/100, Poor');
    expect(tooHigh.getAttribute('aria-valuenow')).toBe('100');
    expect(invalid.getAttribute('aria-valuenow')).toBe('0');
    expect(negative.getAttribute('aria-valuenow')).toBe('0');

    expect(fillOf(home).style.backgroundColor).toBe('rgba(40, 210, 110, 0.24)');
    expect(fillOf(home).style.backgroundImage).toContain('linear-gradient(90deg');
    expect(fillOf(blog).style.backgroundColor).toBe('rgba(255, 150, 50, 0.24)');
    expect(fillOf(blog).style.backgroundImage).toContain('radial-gradient');
    expect(fillOf(slo).style.backgroundColor).toBe('rgba(240, 70, 70, 0.24)');
    expect(fillOf(slo).style.backgroundImage).toContain('repeating-linear-gradient');

    for (const progressbar of [home, blog, slo, tooHigh, invalid, negative]) {
      const marker = progressbar.querySelectorAll<HTMLElement>('span[aria-hidden="true"]')[1];
      expect(marker.style.left).toBe('90%');
    }

    expect(within(list).getByText('90/100').textContent).toBe('90/100');
    expect(within(list).getByText('70/100').textContent).toBe('70/100');
    expect(within(list).getAllByText('Poor')).toHaveLength(3);
  });
});
