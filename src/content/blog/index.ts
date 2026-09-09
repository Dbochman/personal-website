/**
 * Centralized blog content module
 * Single source of truth for all blog post data
 */
import type { MDXProps } from 'mdx/types';
import * as runtime from 'react/jsx-runtime';
import { lazy } from 'react';
import blogManifest from '@/generated/blog/manifest.json';
import type { BlogPostMetadata, RssItem, OgMeta, BlogFrontmatter } from './schema';

const BASE_URL = 'https://dylanbochman.com';

// Metadata stays synchronous for listings and prerendered SEO. Article bodies
// load only when a reader opens that article, never on the home or blog index.
const manifest = blogManifest as Record<string, { frontmatter: BlogFrontmatter; readingTime: string }>;
const compiledModules = import.meta.glob<{ compiledMDX: string }>([
  '/src/generated/blog/*.js', '!/src/generated/blog/manifest.js',
]);
const componentCache = new Map<string, React.ComponentType<MDXProps>>();
const slugToFilename = new Map<string, string>();
const allPosts: BlogPostMetadata[] = Object.entries(manifest).map(([filename, entry]) => {
  const slug = entry.frontmatter.slug || filename;
  slugToFilename.set(slug, filename);
  return { ...entry.frontmatter, slug, readingTime: entry.readingTime };
}).sort((a, b) => b.date.localeCompare(a.date));

export function getAllPosts({ includeDrafts = false } = {}): BlogPostMetadata[] {
  return includeDrafts ? allPosts : allPosts.filter(post => !post.draft);
}

export function getPostBySlug(slug: string): BlogPostMetadata | null {
  return allPosts.find(post => post.slug === slug) || null;
}

export function getPostComponent(slug: string): React.ComponentType<MDXProps> | null {
  const cached = componentCache.get(slug);
  if (cached) return cached;
  const filename = slugToFilename.get(slug);
  const load = filename && compiledModules[`/src/generated/blog/${filename}.js`];
  if (!load) return null;
  const Component = lazy(async () => {
    const { compiledMDX } = await load();
    // Only trusted, build-validated repository MDX reaches this boundary.
    const execute = new Function(compiledMDX) as (jsxRuntime: typeof runtime) => { default: React.ComponentType<MDXProps> };
    return execute(runtime);
  });
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
export function toRssItem(post: BlogPostMetadata): RssItem {
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
export function toOgMeta(post: BlogPostMetadata): OgMeta {
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
export function toRssXmlItem(post: BlogPostMetadata): string {
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
