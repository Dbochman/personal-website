import type { BlogPost } from '@/types/blog';

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
