import matter from 'gray-matter';
import readingTime from 'reading-time';
import { format } from 'date-fns';
import type { BlogPost, BlogFrontmatter, ReadingTimeResult } from '@/types/blog';

/**
 * Parse MDX content and extract frontmatter
 */
export function parseMDX(content: string): {
  frontmatter: BlogFrontmatter;
  content: string;
} {
  const { data, content: mdxContent } = matter(content);

  return {
    frontmatter: data as BlogFrontmatter,
    content: mdxContent,
  };
}

/**
 * Calculate reading time for content
 */
export function calculateReadingTime(content: string): ReadingTimeResult {
  return readingTime(content) as ReadingTimeResult;
}

/**
 * Format date for display
 */
export function formatDate(dateString: string, formatString: string = 'MMMM d, yyyy'): string {
  return format(new Date(dateString), formatString);
}

/**
 * Parse MDX file and create BlogPost object
 */
export function createBlogPost(
  content: string,
  slug?: string
): BlogPost {
  const { frontmatter, content: mdxContent } = parseMDX(content);
  const readingTimeResult = calculateReadingTime(mdxContent);

  return {
    ...frontmatter,
    slug: slug || frontmatter.slug,
    content: mdxContent,
    readingTime: readingTimeResult.text,
  };
}

/**
 * Sort blog posts by date
 */
export function sortPostsByDate(
  posts: BlogPost[],
  order: 'asc' | 'desc' = 'desc'
): BlogPost[] {
  return [...posts].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return order === 'desc' ? dateB - dateA : dateA - dateB;
  });
}

/**
 * Filter posts by tag
 */
export function filterPostsByTag(posts: BlogPost[], tag: string): BlogPost[] {
  return posts.filter(post => post.tags.includes(tag));
}

/**
 * Filter posts by search term (title + description)
 */
export function filterPostsBySearch(posts: BlogPost[], searchTerm: string): BlogPost[] {
  const term = searchTerm.toLowerCase();
  return posts.filter(post =>
    post.title.toLowerCase().includes(term) ||
    post.description.toLowerCase().includes(term)
  );
}

/**
 * Get all unique tags from posts
 */
export function getAllTags(posts: BlogPost[]): string[] {
  const tags = new Set<string>();
  posts.forEach(post => post.tags.forEach(tag => tags.add(tag)));
  return Array.from(tags).sort();
}

/**
 * Get all unique categories from posts
 */
export function getAllCategories(posts: BlogPost[]): string[] {
  const categories = new Set<string>();
  posts.forEach(post => {
    if (post.category) categories.add(post.category);
  });
  return Array.from(categories).sort();
}

/**
 * Filter out draft posts in production
 */
export function filterDraftPosts(posts: BlogPost[]): BlogPost[] {
  if (import.meta.env.MODE === 'production') {
    return posts.filter(post => !post.draft);
  }
  return posts;
}
