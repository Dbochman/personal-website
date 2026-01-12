import type { BlogPost } from '@/types/blog';
import { calculateReadingTime } from './mdx';
import * as runtime from 'react/jsx-runtime';

// Import precompiled blog posts - use eager to debug
const compiledModules = import.meta.glob('/src/generated/blog/*.js', {
  eager: true,
}) as Record<string, { compiledMDX: string; frontmatter: Record<string, unknown> }>;


// Cache for loaded posts
const postCache = new Map<string, { post: BlogPost; Component: React.ComponentType }>();

/**
 * Execute precompiled MDX and return the component
 */
function executeCompiledMDX(compiledCode: string): React.ComponentType {
  // Create a function from the compiled code
  const fn = new Function(compiledCode);
  // Execute with jsx runtime
  const result = fn(runtime);
  return result.default;
}

/**
 * Extract slug from module path
 */
function extractSlugFromPath(path: string): string {
  // Path format: /src/generated/blog/2025-01-04-hello-world.js
  const match = path.match(/\/([^/]+)\.js$/);
  return match ? match[1] : '';
}

/**
 * Create a BlogPost object from frontmatter
 */
function createPostFromFrontmatter(
  frontmatter: Record<string, unknown>,
  content: string,
  slug: string
): BlogPost {
  return {
    slug,
    title: String(frontmatter.title || 'Untitled'),
    description: String(frontmatter.description || ''),
    date: String(frontmatter.date || ''),
    author: String(frontmatter.author || 'Unknown'),
    tags: Array.isArray(frontmatter.tags) ? frontmatter.tags.map(String) : [],
    category: String(frontmatter.category || 'General'),
    featured: Boolean(frontmatter.featured),
    draft: Boolean(frontmatter.draft),
    image: frontmatter.image ? String(frontmatter.image) : undefined,
    updated: frontmatter.updated ? String(frontmatter.updated) : undefined,
    readingTime: calculateReadingTime(content).text,
    content, // Store the compiled code, not raw MDX
  };
}

/**
 * Load all precompiled blog posts (synchronous since modules are eager)
 */
function loadPostsSync(includeDrafts = false): BlogPost[] {
  const entries = Object.entries(compiledModules);
  const posts = entries
    .filter(([path]) => !path.includes('manifest.js'))
    .map(([path, module]) => {
      try {
        const slug = extractSlugFromPath(path);
        const post = createPostFromFrontmatter(module.frontmatter, module.compiledMDX, slug);

        // Cache the component
        if (!postCache.has(post.slug)) {
          const Component = executeCompiledMDX(module.compiledMDX);
          postCache.set(post.slug, { post, Component });
        }

        return post;
      } catch (error) {
        console.error(`Error loading precompiled post from ${path}:`, error);
        return null;
      }
    });

  const loadedPosts = posts.filter(Boolean) as BlogPost[];
  return includeDrafts ? loadedPosts : loadedPosts.filter(p => !p.draft);
}

// Initialize posts on module load
const allPosts = loadPostsSync(true);

/**
 * Load all precompiled blog posts (async wrapper for compatibility)
 */
export async function loadBlogPostsPrecompiled(includeDrafts = false): Promise<BlogPost[]> {
  return includeDrafts ? allPosts : allPosts.filter(p => !p.draft);
}

/**
 * Get all precompiled blog posts synchronously
 */
export function getPostsSync(includeDrafts = false): BlogPost[] {
  return includeDrafts ? allPosts : allPosts.filter(p => !p.draft);
}

/**
 * Get a single precompiled blog post by slug synchronously
 */
export function getPostSync(slug: string): BlogPost | null {
  // Check cache first (populated during module load)
  if (postCache.has(slug)) {
    return postCache.get(slug)!.post;
  }
  return null;
}

/**
 * Load a single precompiled blog post by slug (async wrapper)
 */
export async function loadBlogPostPrecompiled(slug: string): Promise<BlogPost | null> {
  // Check cache first
  if (postCache.has(slug)) {
    return postCache.get(slug)!.post;
  }

  // Try direct path match
  const modulePath = `/src/generated/blog/${slug}.js`;
  const module = compiledModules[modulePath];

  if (module) {
    try {
      const post = createPostFromFrontmatter(module.frontmatter, module.compiledMDX, slug);
      const Component = executeCompiledMDX(module.compiledMDX);
      postCache.set(slug, { post, Component });
      return post;
    } catch (error) {
      console.error(`Error loading precompiled post ${slug}:`, error);
    }
  }

  return null;
}

/**
 * Get the precompiled MDX component for a post
 */
export function getPostComponent(slug: string): React.ComponentType | null {
  return postCache.get(slug)?.Component || null;
}
