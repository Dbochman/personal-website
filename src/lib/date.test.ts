import { describe, expect, it } from 'vitest';
import { formatDate } from './date';

describe('formatDate', () => {
  it('preserves date-only frontmatter in the local timezone', () => {
    expect(formatDate('2026-01-07')).toBe('January 7, 2026');
  });

  it('formats a timestamp with the default format', () => {
    expect(formatDate('2026-01-07T12:00:00Z')).toContain('2026');
  });

  it('supports a custom format', () => {
    expect(formatDate('2026-01-07T12:00:00Z', 'yyyy')).toBe('2026');
  });
});
