import { describe, expect, it } from 'vitest';
import { buildPageLists } from '../../../scripts/ga4-analytics-utils.js';
import { getBlogPages } from './blog-pages';

const metrics = { sessions: 1, users: 1, pageViews: 1 };

describe('blog report coverage', () => {
  it('retains recent posts outside the site-wide top ten from export to dashboard', () => {
    const pages = Object.fromEntries(Array.from({ length: 10 }, (_, i) => [
      `/projects/${i}`, { sessions: 50, users: 40, pageViews: 100 - i },
    ]));
    pages['/blog/new-post'] = metrics;
    pages['/blog/'] = metrics;
    const report = buildPageLists(pages);

    expect(report.topPages).toHaveLength(10);
    expect(report.topPages.some(p => p.page === '/blog/new-post')).toBe(false);
    expect(getBlogPages(report)).toEqual([{ page: '/blog/new-post', ...metrics }]);
  });

  it('reads old snapshots without including the blog index or other pages', () => {
    const topPages = ['/blog/old-post/', '/blog', '/blog/', '/projects/one']
      .map(page => ({ page, ...metrics }));
    expect(getBlogPages({ topPages })).toEqual([{ page: '/blog/old-post/', ...metrics }]);
  });

  it('does not fall back to top pages when the complete blog report is empty', () => {
    expect(getBlogPages({
      topPages: [{ page: '/blog/old-post', ...metrics }], blogPages: [],
    })).toEqual([]);
  });
});
