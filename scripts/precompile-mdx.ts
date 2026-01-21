/**
 * Precompile MDX blog posts at build time
 * This eliminates the need for runtime MDX compilation, improving page load performance
 *
 * Uses zod schema validation to catch invalid frontmatter early
 * Uses content hashing to skip recompilation of unchanged files
 */

import { readdir, readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, basename } from 'path';
import { createHash } from 'crypto';
import { compile } from '@mdx-js/mdx';
import remarkGfm from 'remark-gfm';
import remarkFrontmatter from 'remark-frontmatter';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypePrism from 'rehype-prism-plus';
import matter from 'gray-matter';
import { blogFrontmatterSchema, type BlogFrontmatter } from '../src/content/blog/schema.js';

const CONTENT_DIR = './content/blog';
const OUTPUT_DIR = './src/generated/blog';
const CACHE_DIR = './.cache/mdx';

// Cache schema version - bump this to invalidate all caches
const CACHE_VERSION = 1;

interface ManifestEntry {
  file: string;
  frontmatter: BlogFrontmatter;
  readingTime: string;
}

interface Manifest {
  [slug: string]: ManifestEntry;
}

interface CacheEntry {
  hash: string;
  version: number;
  compiledContent: string;
  frontmatter: BlogFrontmatter;
  readingTime: string;
}

interface CacheManifest {
  version: number;
  entries: Record<string, CacheEntry>;
}

function hashContent(content: string): string {
  return createHash('sha256').update(content).digest('hex').slice(0, 16);
}

async function loadCacheManifest(): Promise<CacheManifest> {
  const manifestPath = join(CACHE_DIR, 'manifest.json');
  if (existsSync(manifestPath)) {
    try {
      const data = await readFile(manifestPath, 'utf-8');
      const manifest = JSON.parse(data) as CacheManifest;
      // Invalidate if version changed
      if (manifest.version === CACHE_VERSION) {
        return manifest;
      }
      console.log('📦 Cache version changed, rebuilding all...');
    } catch {
      console.log('📦 Cache manifest corrupted, rebuilding all...');
    }
  }
  return { version: CACHE_VERSION, entries: {} };
}

async function saveCacheManifest(manifest: CacheManifest): Promise<void> {
  await writeFile(join(CACHE_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
}

async function precompileMDX() {
  console.log('🔄 Precompiling MDX blog posts...');

  // Ensure directories exist
  if (!existsSync(OUTPUT_DIR)) {
    await mkdir(OUTPUT_DIR, { recursive: true });
  }
  if (!existsSync(CACHE_DIR)) {
    await mkdir(CACHE_DIR, { recursive: true });
  }

  // Load cache
  const cache = await loadCacheManifest();

  // Read all .txt files from content directory
  const files = await readdir(CONTENT_DIR);
  const txtFiles = files.filter(f => f.endsWith('.txt'));

  console.log(`📝 Found ${txtFiles.length} blog posts`);

  const manifest: Manifest = {};
  const usedSlugs = new Map<string, string>(); // slug -> filename for error messages
  let errors = 0;
  let cacheHits = 0;
  let cacheMisses = 0;

  for (const file of txtFiles) {
    const filePath = join(CONTENT_DIR, file);
    const content = await readFile(filePath, 'utf-8');
    const contentHash = hashContent(content);

    // Parse frontmatter
    const { data: rawFrontmatter, content: mdxContent } = matter(content);
    // Use filename (not frontmatter slug) to match URL structure
    const slugFromFilename = basename(file, '.txt');

    try {
      // Validate frontmatter with zod schema
      const validated = blogFrontmatterSchema.parse({
        ...rawFrontmatter,
        slug: rawFrontmatter.slug || slugFromFilename,
      });

      // Check for duplicate slugs (custom frontmatter.slug could collide)
      const effectiveSlug = validated.slug || slugFromFilename;
      if (usedSlugs.has(effectiveSlug)) {
        throw new Error(
          `Duplicate slug "${effectiveSlug}" - already used by ${usedSlugs.get(effectiveSlug)}`
        );
      }
      usedSlugs.set(effectiveSlug, file);

      // Check cache
      const cached = cache.entries[slugFromFilename];
      let compiledContent: string;
      let readingTimeText: string;

      if (cached && cached.hash === contentHash && cached.version === CACHE_VERSION) {
        // Cache hit - use cached compilation
        compiledContent = cached.compiledContent;
        readingTimeText = cached.readingTime;
        cacheHits++;
        console.log(`  ⚡ Cached: ${slugFromFilename}`);
      } else {
        // Cache miss - compile MDX
        const compiled = await compile(mdxContent, {
          outputFormat: 'function-body',
          remarkPlugins: [remarkGfm, remarkFrontmatter],
          rehypePlugins: [
            rehypeSlug,
            [rehypeAutolinkHeadings, { behavior: 'wrap' }],
            rehypePrism,
          ],
        });

        compiledContent = String(compiled);

        // Calculate reading time from raw MDX content (not compiled JS)
        const wordCount = mdxContent.trim().split(/\s+/).length;
        const readingTime = Math.max(1, Math.ceil(wordCount / 200));
        readingTimeText = `${readingTime} min read`;

        // Update cache
        cache.entries[slugFromFilename] = {
          hash: contentHash,
          version: CACHE_VERSION,
          compiledContent,
          frontmatter: validated,
          readingTime: readingTimeText,
        };

        cacheMisses++;
        console.log(`  ✓ Compiled: ${slugFromFilename}`);
      }

      // Write compiled output
      const outputFile = join(OUTPUT_DIR, `${slugFromFilename}.js`);
      const outputContent = `// Auto-generated - do not edit
// Source: ${file}
export const compiledMDX = ${JSON.stringify(compiledContent)};
export const frontmatter = ${JSON.stringify(validated)};
export const readingTime = ${JSON.stringify(readingTimeText)};
`;

      await writeFile(outputFile, outputContent);

      manifest[slugFromFilename] = {
        file: `${slugFromFilename}.js`,
        frontmatter: validated,
        readingTime: readingTimeText,
      };
    } catch (error) {
      errors++;
      if (error instanceof Error && 'issues' in error) {
        // Zod validation error
        console.error(`  ✗ Validation failed for ${file}:`);
        const zodError = error as { issues: Array<{ path: (string | number)[]; message: string }> };
        for (const issue of zodError.issues) {
          console.error(`    - ${issue.path.join('.')}: ${issue.message}`);
        }
      } else {
        console.error(`  ✗ Failed to compile ${file}:`, error instanceof Error ? error.message : error);
      }
    }
  }

  // Clean stale cache entries (files that no longer exist)
  const currentSlugs = new Set(txtFiles.map(f => basename(f, '.txt')));
  for (const slug of Object.keys(cache.entries)) {
    if (!currentSlugs.has(slug)) {
      delete cache.entries[slug];
    }
  }

  // Save updated cache
  await saveCacheManifest(cache);

  // Write manifest as both JS (for imports) and JSON (for scripts)
  const manifestContent = `// Auto-generated manifest of precompiled blog posts
// Generated at: ${new Date().toISOString()}
export const blogManifest = ${JSON.stringify(manifest, null, 2)};
`;
  await writeFile(join(OUTPUT_DIR, 'manifest.js'), manifestContent);
  await writeFile(join(OUTPUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));

  console.log(`\n✅ Precompilation complete!`);
  console.log(`   ${Object.keys(manifest).length} posts in ${OUTPUT_DIR}`);
  console.log(`   ⚡ ${cacheHits} cached, ✓ ${cacheMisses} compiled`);

  if (errors > 0) {
    console.error(`\n⚠️  ${errors} post(s) failed validation or compilation`);
    process.exit(1);
  }
}

precompileMDX().catch((error) => {
  console.error('Precompilation failed:', error);
  process.exit(1);
});
