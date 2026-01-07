import type { BlogPost } from '@/types/blog';
import { createBlogPost, filterDraftPosts } from './mdx';

// Import all MDX files from content/blog directory as raw strings
// Using the ?raw suffix to bypass the MDX plugin and get raw file content
const blogModules = import.meta.glob('/content/blog/*.mdx?raw', {
  eager: true
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
      const content = module.default;
      // Extract slug from path, removing the ?raw suffix
      const slug = path.split('/').pop()?.replace('.mdx?raw', '') || '';
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
  const path = `/content/blog/${slug}.mdx?raw`;
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
