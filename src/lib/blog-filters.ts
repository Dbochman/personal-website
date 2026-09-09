import { BLOG_AUTHORS, type BlogAuthor } from '@/types/blog';

export const BLOG_SORT_OPTIONS = ['newest', 'oldest', 'longest', 'shortest'] as const;
export type BlogSortOption = (typeof BLOG_SORT_OPTIONS)[number];

export function readBlogFilters(params: URLSearchParams) {
  const author = params.get('author');
  const sort = params.get('sort');
  const search = params.get('q') || '';
  const tags = params.getAll('tag').filter(Boolean);
  const selectedAuthor: BlogAuthor | 'all' = BLOG_AUTHORS.find(value => value === author) || 'all';
  const sortOption: BlogSortOption = BLOG_SORT_OPTIONS.find(value => value === sort) || 'newest';

  return {
    search,
    tags,
    author: selectedAuthor,
    sort: sortOption,
    active: Boolean(search || tags.length || selectedAuthor !== 'all' || sortOption !== 'newest'),
  };
}
