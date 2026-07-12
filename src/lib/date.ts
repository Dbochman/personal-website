import { format } from 'date-fns';

/**
 * Format a date for display without shifting date-only frontmatter across
 * timezone boundaries.
 */
export function formatDate(dateString: string, formatString: string = 'MMMM d, yyyy'): string {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(dateString)
    ? new Date(`${dateString}T00:00:00`)
    : new Date(dateString);

  return format(date, formatString);
}
