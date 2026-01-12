/**
 * Precompile MDX blog posts at build time
 * This eliminates the need for runtime MDX compilation, improving page load performance
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

const CONTENT_DIR = './content/blog';
const OUTPUT_DIR = './src/generated/blog';

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

  const manifest = {};

  for (const file of txtFiles) {
    const filePath = join(CONTENT_DIR, file);
    const content = await readFile(filePath, 'utf-8');

    // Parse frontmatter
    const { data: frontmatter, content: mdxContent } = matter(content);
    // Use filename (not frontmatter slug) to match URL structure
    const slug = basename(file, '.txt');

    try {
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

      // Write compiled output
      const outputFile = join(OUTPUT_DIR, `${slug}.js`);
      const outputContent = `// Auto-generated - do not edit
// Source: ${file}
export const compiledMDX = ${JSON.stringify(String(compiled))};
export const frontmatter = ${JSON.stringify(frontmatter)};
`;

      await writeFile(outputFile, outputContent);

      manifest[slug] = {
        file: `${slug}.js`,
        frontmatter,
      };

      console.log(`  ✓ Compiled: ${slug}`);
    } catch (error) {
      console.error(`  ✗ Failed to compile ${file}:`, error.message);
    }
  }

  // Write manifest file
  const manifestContent = `// Auto-generated manifest of precompiled blog posts
export const blogManifest = ${JSON.stringify(manifest, null, 2)};
`;
  await writeFile(join(OUTPUT_DIR, 'manifest.js'), manifestContent);

  console.log(`\n✅ Precompilation complete!`);
  console.log(`   ${Object.keys(manifest).length} posts compiled to ${OUTPUT_DIR}`);
}

precompileMDX().catch(console.error);
