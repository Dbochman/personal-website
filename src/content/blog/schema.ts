import { z } from 'zod';

/**
 * Helper to coerce Date objects to YYYY-MM-DD strings
 * gray-matter automatically parses YAML dates, so we need to handle both
 */
const dateSchema = z.union([
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  z.date().transform((d) => d.toISOString().split('T')[0]),
]);

/**
 * Zod schema for blog post frontmatter validation
 * Used at build time to catch invalid frontmatter early
 */
export const blogFrontmatterSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().optional(),
  date: dateSchema,
  description: z.string().min(1, 'Description is required'),
  tags: z.array(z.string()).default([]),
  author: z.enum(['Dylan', 'Claude', 'Dylan & Claude']),
  draft: z.boolean().default(false),
  featured: z.boolean().optional().default(false),
  category: z.string().optional().default('General'),
  image: z.string().optional(),
  updated: dateSchema.optional(),
});

export type BlogFrontmatter = z.infer<typeof blogFrontmatterSchema>;

/**
 * Validated blog post with computed fields
 */
export interface ValidatedBlogPost extends BlogFrontmatter {
  slug: string; // Always present after validation (derived from filename if not in frontmatter)
  readingTime: string;
  content: string; // Compiled MDX code
}

/**
 * RSS item representation of a blog post
 */
export interface RssItem {
  title: string;
  link: string;
  guid: string;
  description: string;
  pubDate: string;
  author: string;
  categories: string[];
}

/**
 * OG metadata for a blog post
 */
export interface OgMeta {
  title: string;
  description: string;
  url: string;
  image?: string;
  type: 'article';
  publishedTime: string;
  modifiedTime?: string;
  author: string;
  tags: string[];
}
