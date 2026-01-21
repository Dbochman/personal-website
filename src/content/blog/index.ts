/**
 * Centralized blog content module
 * Single source of truth for all blog post data
 */
import * as runtime from 'react/jsx-runtime';
import type { ValidatedBlogPost, RssItem, OgMeta, BlogFrontmatter } from './schema';

const BASE_URL = 'https://dylanbochman.com';

// Import precompiled blog posts eagerly
const compiledModules = import.meta.glob('/src/generated/blog/*.js', {
  eager: true,
}) as Record<string, { compiledMDX: string; frontmatter: BlogFrontmatter; readingTime: string }>;

// Warn if no modules found (likely forgot to run precompile)
if (Object.keys(compiledModules).length === 0) {
  console.warn(
    '[content/blog] No precompiled posts found in src/generated/blog/. ' +
    'Run "npm run precompile-mdx" or restart dev server.'
  );
}

// Cache for React components
const componentCache = new Map<string, React.ComponentType>();

/**
 * Execute precompiled MDX and return the React component
 */
function executeCompiledMDX(compiledCode: string): React.ComponentType {
  const fn = new Function(compiledCode);
  const result = fn(runtime);
  return result.default;
}

/**
 * Extract slug from module path
 */
function extractSlugFromPath(path: string): string {
  const match = path.match(/\/([^/]+)\.js$/);
  return match ? match[1] : '';
}

// Map from post slug to module filename (for component loading)
const slugToFilename = new Map<string, string>();

/**
 * Create a ValidatedBlogPost from module data
 */
function createPost(
  frontmatter: BlogFrontmatter,
  compiledMDX: string,
  filenameSlug: string,
  readingTime: string
): ValidatedBlogPost {
  // Use frontmatter slug if provided, otherwise use filename
  const slug = frontmatter.slug || filenameSlug;

  // Store mapping so getPostComponent can find the right module
  slugToFilename.set(slug, filenameSlug);

  return {
    ...frontmatter,
    slug,
    readingTime,
    content: compiledMDX,
  };
}

// Build the posts array once on module load
const allPosts: ValidatedBlogPost[] = Object.entries(compiledModules)
  .filter(([path]) => !path.includes('manifest.js'))
  .map(([path, module]) => {
    const slug = extractSlugFromPath(path);
    return createPost(module.frontmatter, module.compiledMDX, slug, module.readingTime);
  })
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

/**
 * Get all blog posts
 */
export function getAllPosts({ includeDrafts = false } = {}): ValidatedBlogPost[] {
  return includeDrafts ? allPosts : allPosts.filter(p => !p.draft);
}

/**
 * Get a single blog post by slug
 */
export function getPostBySlug(slug: string): ValidatedBlogPost | null {
  return allPosts.find(p => p.slug === slug) || null;
}

/**
 * Get the React component for a blog post
 */
export function getPostComponent(slug: string): React.ComponentType | null {
  // Check cache first
  if (componentCache.has(slug)) {
    return componentCache.get(slug)!;
  }

  // Get the filename for this slug (handles custom slugs in frontmatter)
  const filename = slugToFilename.get(slug) || slug;
  const modulePath = `/src/generated/blog/${filename}.js`;
  const module = compiledModules[modulePath];
  if (!module) return null;

  // Execute and cache the component
  const Component = executeCompiledMDX(module.compiledMDX);
  componentCache.set(slug, Component);
  return Component;
}

/**
 * Get blog statistics
 */
export function getBlogStats() {
  const posts = getAllPosts();
  const allTags = posts.flatMap(p => p.tags);
  const allCategories = posts.map(p => p.category).filter(Boolean);

  return {
    totalPosts: posts.length,
    tags: [...new Set(allTags)],
    categories: [...new Set(allCategories)],
    latestPost: posts[0],
  };
}

// ============================================
// RSS/Feed helpers - shared source of truth
// ============================================

/**
 * Escape XML special characters
 */
function escapeXml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Convert a blog post to RSS item format
 */
export function toRssItem(post: ValidatedBlogPost): RssItem {
  return {
    title: post.title,
    link: `${BASE_URL}/blog/${post.slug}`,
    guid: `${BASE_URL}/blog/${post.slug}`,
    description: post.description,
    pubDate: new Date(post.date).toUTCString(),
    author: `dylan@dylanbochman.com (${post.author})`,
    categories: post.tags,
  };
}

/**
 * Convert a blog post to OG metadata format
 */
export function toOgMeta(post: ValidatedBlogPost): OgMeta {
  return {
    title: post.title,
    description: post.description,
    url: `${BASE_URL}/blog/${post.slug}`,
    image: post.image,
    type: 'article',
    publishedTime: post.date,
    modifiedTime: post.updated,
    author: post.author,
    tags: post.tags,
  };
}

/**
 * Generate RSS XML item element
 */
export function toRssXmlItem(post: ValidatedBlogPost): string {
  const item = toRssItem(post);
  return `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${item.link}</link>
      <guid isPermaLink="true">${item.guid}</guid>
      <description>${escapeXml(item.description)}</description>
      <pubDate>${item.pubDate}</pubDate>
      <author>${escapeXml(item.author)}</author>
      ${item.categories.map(tag => `<category>${escapeXml(tag)}</category>`).join('\n      ')}
    </item>`;
}

// Re-export types for convenience
export type { ValidatedBlogPost, RssItem, OgMeta, BlogFrontmatter } from './schema';
