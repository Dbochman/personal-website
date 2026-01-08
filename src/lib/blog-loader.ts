import type { BlogPost } from '@/types/blog';
import { createBlogPost, filterDraftPosts } from './mdx';

// Import all blog post files as raw text
// Using .txt extension to avoid any plugin processing
const blogModules = import.meta.glob('/content/blog/*.txt', {
  eager: true,
  query: '?raw'
}) as Record<string, { default: string }>;

/**
 * Load all blog posts from the content/blog directory
 * @param includeDrafts - Whether to include draft posts (default: false)
 * @returns Promise resolving to array of BlogPost objects
 */
export async function loadBlogPosts(includeDrafts = false): Promise<BlogPost[]> {
  const posts: BlogPost[] = [];

  for (const [path, module] of Object.entries(blogModules)) {
    try {
      // Extract slug from path
      const slug = path.split('/').pop()?.replace('.txt', '') || '';
      const content = module.default;
      const post = createBlogPost(content, slug);
      posts.push(post);
    } catch (error) {
      console.error(`Error loading blog post from ${path}:`, error);
    }
  }

  // Filter out drafts unless explicitly requested
  return includeDrafts ? posts : filterDraftPosts(posts);
}

/**
 * Load a single blog post by slug
 * @param slug - The post slug (filename without extension)
 * @returns Promise resolving to BlogPost or null if not found
 */
export async function loadBlogPost(slug: string): Promise<BlogPost | null> {
  const path = `/content/blog/${slug}.txt`;
  const module = blogModules[path];

  if (!module) {
    return null;
  }

  try {
    const content = module.default;
    return createBlogPost(content, slug);
  } catch (error) {
    console.error(`Error loading blog post ${slug}:`, error);
    return null;
  }
}
