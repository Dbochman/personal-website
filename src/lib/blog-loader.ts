import type { BlogPost } from '@/types/blog';
import { createBlogPost, filterDraftPosts } from './mdx';

// Import all MDX files from content/blog directory
const blogModules = import.meta.glob('/content/blog/*.mdx', {
  query: '?raw',
  import: 'default'
});

/**
 * Load all blog posts from the content/blog directory
 * @param includeDrafts - Whether to include draft posts (default: false)
 * @returns Promise resolving to array of BlogPost objects
 */
export async function loadBlogPosts(includeDrafts = false): Promise<BlogPost[]> {
  const posts: BlogPost[] = [];

  for (const [path, resolver] of Object.entries(blogModules)) {
    try {
      const content = await resolver() as string;
      const slug = path.split('/').pop()?.replace('.mdx', '') || '';
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
  const path = `/content/blog/${slug}.mdx`;
  const resolver = blogModules[path];

  if (!resolver) {
    return null;
  }

  try {
    const content = await resolver() as string;
    return createBlogPost(content, slug);
  } catch (error) {
    console.error(`Error loading blog post ${slug}:`, error);
    return null;
  }
}
