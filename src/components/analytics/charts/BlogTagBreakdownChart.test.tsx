import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BlogTagBreakdownChart } from './BlogTagBreakdownChart';

describe('BlogTagBreakdownChart', () => {
  it('preserves the existing empty state when no usable tags are available', () => {
    render(
      <BlogTagBreakdownChart
        tagData={[
          { tag: '  ', sessions: 10 },
          { tag: 'Zero', sessions: 0 },
          { tag: 'Invalid', sessions: Number.NaN },
          { tag: 'Negative', sessions: -10 },
        ]}
      />,
    );

    expect(screen.getByText('No tag data available').textContent).toBe('No tag data available');
    expect(screen.queryByRole('list')).toBeNull();
  });

  it('renders the top ten safe ranked tag meters with exact values and context', () => {
    render(
      <BlogTagBreakdownChart
        tagData={[
          { tag: 'Reliability', sessions: 120 },
          { tag: 'AI', sessions: 90 },
          { tag: 'Observability', sessions: 80 },
          { tag: 'SRE', sessions: 70 },
          { tag: 'React', sessions: 60 },
          { tag: 'Automation', sessions: 50 },
          { tag: 'Design', sessions: 40 },
          { tag: 'Accessibility', sessions: 30 },
          { tag: 'Performance', sessions: 20 },
          { tag: 'Home Automation', sessions: 10 },
          { tag: 'Eleventh', sessions: 5 },
          { tag: 'AI', sessions: 15 },
          { tag: 'Invalid', sessions: Number.NaN },
          { tag: 'Negative', sessions: -20 },
        ]}
      />,
    );

    const list = screen.getByRole('list', { name: 'Latest seven-day blog sessions by tag' });
    const rows = within(list).getAllByRole('listitem');

    expect(rows).toHaveLength(10);
    expect(rows[0]).toHaveTextContent('#1 Reliability');
    expect(rows[0]).toHaveTextContent('120 sessions');
    expect(rows[1]).toHaveTextContent('#2 AI');
    expect(rows[1]).toHaveTextContent('105 sessions');
    expect(list).not.toHaveTextContent('Eleventh');
    expect(list).not.toHaveTextContent('Invalid');
    expect(list).not.toHaveTextContent('Negative');

    expect(
      within(rows[0]).getByRole('progressbar', { name: '#1 Reliability' }),
    ).toHaveAttribute('aria-valuetext', '#1 Reliability: 120 sessions');
    expect(screen.getByText('A post can contribute its sessions to more than one tag.')).toBeTruthy();
  });
});
