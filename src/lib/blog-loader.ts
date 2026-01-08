import type { BlogPost } from '@/types/blog';
import { createBlogPost, filterDraftPosts } from './mdx';

// Import all blog post files as raw text
// Using .txt extension to avoid any plugin processing
// Non-eager loading for better code splitting
const blogModules = import.meta.glob('/content/blog/*.txt', {
  eager: false,
  query: '?raw'
}) as Record<string, () => Promise<{ default: string }>>;

/**
 * Load all blog posts from the content/blog directory
 * @param includeDrafts - Whether to include draft posts (default: false)
 * @returns Promise resolving to array of BlogPost objects
 */
export async function loadBlogPosts(includeDrafts = false): Promise<BlogPost[]> {
  const entries = Object.entries(blogModules);
  const posts = await Promise.all(
    entries.map(async ([path, moduleLoader]) => {
      try {
        // Extract slug from path
        const slug = path.split('/').pop()?.replace('.txt', '') || '';
        const module = await moduleLoader();
        const content = module.default;
        return createBlogPost(content, slug);
      } catch (error) {
        console.error(`Error loading blog post from ${path}:`, error);
        return null;
      }
    })
  );

  // Filter out drafts unless explicitly requested
  const loadedPosts = posts.filter(Boolean) as BlogPost[];
  return includeDrafts ? loadedPosts : filterDraftPosts(loadedPosts);
}

/**
 * Load a single blog post by slug
 * @param slug - The post slug (from frontmatter or URL)
 * @returns Promise resolving to BlogPost or null if not found
 */
export async function loadBlogPost(slug: string): Promise<BlogPost | null> {
  // First, try direct path match (legacy support)
  const directPath = `/content/blog/${slug}.txt`;
  if (blogModules[directPath]) {
    try {
      const module = await blogModules[directPath]();
      const content = module.default;
      return createBlogPost(content, slug);
    } catch (error) {
      console.error(`Error loading blog post from ${directPath}:`, error);
    }
  }

  // If not found, search through all posts by slug in frontmatter
  for (const [path, moduleLoader] of Object.entries(blogModules)) {
    try {
      const module = await moduleLoader();
      const content = module.default;
      // Don't pass slug parameter - let it use frontmatter slug
      const post = createBlogPost(content);

      // Match by slug from frontmatter
      if (post.slug === slug) {
        return post;
      }
    } catch (error) {
      console.error(`Error loading blog post from ${path}:`, error);
    }
  }

  return null;
}
