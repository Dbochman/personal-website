// Re-export schema types as the source of truth
export type { BlogFrontmatter, ValidatedBlogPost, RssItem, OgMeta } from '@/content/blog/schema';

/**
 * Blog post author
 */
export type BlogAuthor = 'Claude' | 'Dylan' | 'Dylan & Claude';

/**
 * Complete blog post with content (alias for ValidatedBlogPost for compatibility)
 */
export type { ValidatedBlogPost as BlogPost } from '@/content/blog/schema';

/**
 * Blog metadata and statistics
 */
export interface BlogMeta {
  totalPosts: number;
  tags: string[];
  categories: string[];
  latestPost?: BlogPost;
}

/**
 * Blog search and filter options
 */
export interface BlogFilter {
  searchTerm?: string;
  tags?: string[];
  category?: string;
  author?: BlogAuthor;
  sortBy?: 'date-asc' | 'date-desc' | 'title';
}

/**
 * Reading time result from reading-time library
 */
export interface ReadingTimeResult {
  text: string;
  minutes: number;
  time: number;
  words: number;
}
