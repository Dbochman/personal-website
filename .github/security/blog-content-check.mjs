// Runs with patched Node, before building or evaluating any post.
import { createProcessor } from '@mdx-js/mdx';
import remarkFrontmatter from 'remark-frontmatter';
import { readFileSync, lstatSync, realpathSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

export function requirePlainMarkdown(source) {
  const tree = createProcessor({ remarkPlugins: [remarkFrontmatter] }).parse(source);
  function walk(node) {
    if (node.type.startsWith('mdx') || node.type === 'html') {
      throw new Error('Executable MDX, JSX and raw HTML require the normal reviewed path');
    }
    for (const child of node.children ?? []) walk(child);
  }
  walk(tree);
}

export function main(env = process.env) {
  if (env.BLOG_CONTENT_GATE !== 'required') return;
  const files = JSON.parse(readFileSync(env.BLOG_CONTENT_FILES, 'utf8'));
  if (!Array.isArray(files) || !files.length || files.length > 100) throw new Error('Invalid blog manifest');
  for (const file of files) {
    if (typeof file !== 'string' || !/^content\/blog\/[a-z0-9][a-z0-9-]*\.txt$/.test(file)) {
      throw new Error('Invalid blog path');
    }
    const stat = lstatSync(file);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 1024 * 1024 ||
        !realpathSync(file).startsWith(resolve('content/blog') + sep)) throw new Error('Invalid blog file');
    requirePlainMarkdown(new TextDecoder('utf-8', { fatal: true }).decode(readFileSync(file)));
  }
  console.log(`Plain Markdown verified for ${files.length} approved blog file(s)`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
