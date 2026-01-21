/**
 * Precompile MDX blog posts at build time
 * This eliminates the need for runtime MDX compilation, improving page load performance
 *
 * Uses zod schema validation to catch invalid frontmatter early
 */

import { readdir, readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, basename } from 'path';
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

interface ManifestEntry {
  file: string;
  frontmatter: BlogFrontmatter;
  readingTime: string;
}

interface Manifest {
  [slug: string]: ManifestEntry;
}

async function precompileMDX() {
  console.log('🔄 Precompiling MDX blog posts...');

  // Ensure output directory exists
  if (!existsSync(OUTPUT_DIR)) {
    await mkdir(OUTPUT_DIR, { recursive: true });
  }

  // Read all .txt files from content directory
  const files = await readdir(CONTENT_DIR);
  const txtFiles = files.filter(f => f.endsWith('.txt'));

  console.log(`📝 Found ${txtFiles.length} blog posts to compile`);

  const manifest: Manifest = {};
  let errors = 0;

  for (const file of txtFiles) {
    const filePath = join(CONTENT_DIR, file);
    const content = await readFile(filePath, 'utf-8');

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

      // Compile MDX to JS
      const compiled = await compile(mdxContent, {
        outputFormat: 'function-body',
        remarkPlugins: [remarkGfm, remarkFrontmatter],
        rehypePlugins: [
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: 'wrap' }],
          rehypePrism,
        ],
      });

      // Calculate reading time from raw MDX content (not compiled JS)
      const wordCount = mdxContent.trim().split(/\s+/).length;
      const readingTime = Math.max(1, Math.ceil(wordCount / 200));
      const readingTimeText = `${readingTime} min read`;

      // Write compiled output
      const outputFile = join(OUTPUT_DIR, `${slugFromFilename}.js`);
      const outputContent = `// Auto-generated - do not edit
// Source: ${file}
export const compiledMDX = ${JSON.stringify(String(compiled))};
export const frontmatter = ${JSON.stringify(validated)};
export const readingTime = ${JSON.stringify(readingTimeText)};
`;

      await writeFile(outputFile, outputContent);

      manifest[slugFromFilename] = {
        file: `${slugFromFilename}.js`,
        frontmatter: validated,
        readingTime: readingTimeText,
      };

      console.log(`  ✓ Compiled: ${slugFromFilename}`);
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

  // Write manifest file
  const manifestContent = `// Auto-generated manifest of precompiled blog posts
// Generated at: ${new Date().toISOString()}
export const blogManifest = ${JSON.stringify(manifest, null, 2)};
`;
  await writeFile(join(OUTPUT_DIR, 'manifest.js'), manifestContent);

  console.log(`\n✅ Precompilation complete!`);
  console.log(`   ${Object.keys(manifest).length} posts compiled to ${OUTPUT_DIR}`);

  if (errors > 0) {
    console.error(`\n⚠️  ${errors} post(s) failed validation or compilation`);
    process.exit(1);
  }
}

precompileMDX().catch((error) => {
  console.error('Precompilation failed:', error);
  process.exit(1);
});
