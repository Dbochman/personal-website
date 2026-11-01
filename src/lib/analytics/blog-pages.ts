import type { GA4HistoryEntry } from '@/components/analytics/types';

/** Legacy exports only retained the site's top ten URLs. Empty new reports
 * are authoritative and must not fall back to those legacy rows. */
export function getBlogPages(entry: Pick<GA4HistoryEntry, 'topPages' | 'blogPages'>) {
  return (entry.blogPages ?? entry.topPages ?? []).filter(
    ({ page }) => page.startsWith('/blog/') && page !== '/blog/',
  );
}
