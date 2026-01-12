/**
 * Blog post author
 */
export type BlogAuthor = 'Claude' | 'Dylan';

/**
 * Blog post frontmatter metadata
 */
export interface BlogFrontmatter {
  title: string;
  slug: string;
  date: string;
  updated?: string;
  author: BlogAuthor;
  description: string;
  tags: string[];
  category?: string;
  featured?: boolean;
  draft: boolean;
  image?: string;
  readingTime?: string;
}

/**
 * Complete blog post with content
 */
export interface BlogPost extends BlogFrontmatter {
  content: string;
  readingTime: string; // Auto-calculated, always present
}

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
