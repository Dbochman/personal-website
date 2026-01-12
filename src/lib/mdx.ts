import matter from 'gray-matter';
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
 * Browser-compatible implementation without Node.js dependencies
 */
export function calculateReadingTime(content: string): ReadingTimeResult {
  // Remove code blocks, links, and other non-readable content
  const cleanContent = content
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/`[^`]*`/g, '') // Remove inline code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert links to just text
    .replace(/[#*_~]/g, ''); // Remove markdown formatting

  // Count words (split by whitespace and filter empty strings)
  const words = cleanContent
    .split(/\s+/)
    .filter(word => word.length > 0).length;

  // Calculate reading time (average 200 words per minute)
  const wordsPerMinute = 200;
  const minutes = Math.ceil(words / wordsPerMinute);

  // Format the text output
  const text = `${minutes} min read`;

  return {
    text,
    minutes,
    time: minutes * 60 * 1000, // in milliseconds
    words,
  };
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
  fallbackSlug?: string
): BlogPost {
  const { frontmatter, content: mdxContent } = parseMDX(content);
  const readingTimeResult = calculateReadingTime(mdxContent);

  return {
    ...frontmatter,
    // Frontmatter slug is authoritative; fallback to filename-derived slug
    slug: frontmatter.slug || fallbackSlug,
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
 * Sort blog posts by reading time
 */
export function sortPostsByReadingTime(
  posts: BlogPost[],
  order: 'asc' | 'desc' = 'desc'
): BlogPost[] {
  return [...posts].sort((a, b) => {
    // Parse "X min read" to get minutes
    const minutesA = parseInt(a.readingTime) || 0;
    const minutesB = parseInt(b.readingTime) || 0;
    return order === 'desc' ? minutesB - minutesA : minutesA - minutesB;
  });
}

/**
 * Filter posts by tag
 */
export function filterPostsByTag(posts: BlogPost[], tag: string): BlogPost[] {
  return posts.filter(post => post.tags.includes(tag));
}

/**
 * Filter posts by multiple tags (OR logic - posts with ANY of the selected tags)
 */
export function filterPostsByTags(posts: BlogPost[], tags: string[]): BlogPost[] {
  if (tags.length === 0) return posts;
  return posts.filter(post => tags.some(tag => post.tags.includes(tag)));
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
