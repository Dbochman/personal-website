#!/usr/bin/env node
import { chromium } from '@playwright/test';
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const distDir = join(__dirname, '..', 'dist');
const blogContentDir = join(__dirname, '..', 'content', 'blog');
const projectsMetaPath = join(__dirname, '..', 'src', 'data', 'projects-meta.json');

/**
 * Pre-render routes to static HTML files for GitHub Pages
 * This eliminates 404 errors by creating actual HTML files for each route
 */
async function prerender() {
  console.log('🚀 Starting pre-rendering process...');

  const baseUrl = 'http://localhost:4173';
  let previewProcess;

  try {
    // Start preview server in background
    console.log('🌐 Starting preview server...');
    previewProcess = exec('npm run preview', {
      cwd: join(__dirname, '..')
    });

    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Launch browser
    const browser = await chromium.launch();
    const page = await browser.newPage();

    // Get list of blog posts
    const blogFiles = readdirSync(blogContentDir).filter(f => f.endsWith('.txt'));
    const blogSlugs = blogFiles.map(f => f.replace('.txt', ''));

    // Get list of projects
    const projectsMeta = JSON.parse(readFileSync(projectsMetaPath, 'utf-8'));
    const projectSlugs = projectsMeta.map(p => p.slug);

    const routes = [
      '/projects',
      ...projectSlugs.map(slug => `/projects/${slug}`),
      '/runbook',
      '/analytics',
      '/blog',
      ...blogSlugs.map(slug => `/blog/${slug}`)
    ];

    console.log(`📄 Pre-rendering ${routes.length} routes...`);

    for (const route of routes) {
      console.log(`  ➜ ${route}`);

      // Navigate to the route
      await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle' });

      // Wait for React to render
      await page.waitForTimeout(500);

      // Get the rendered HTML
      const html = await page.content();

      // Determine output path
      const outputPath = route === '/blog'
        ? join(distDir, 'blog', 'index.html')
        : join(distDir, route.slice(1), 'index.html');

      // Create directory if it doesn't exist
      mkdirSync(dirname(outputPath), { recursive: true });

      // Write HTML file
      writeFileSync(outputPath, html);

      console.log(`    ✓ Generated ${outputPath.replace(distDir, 'dist')}`);
    }

    await browser.close();
    console.log('✅ Pre-rendering complete!');
  } catch (error) {
    console.error('❌ Pre-rendering failed:', error);
    throw error;
  } finally {
    // Kill the preview server
    if (previewProcess) {
      previewProcess.kill();
    }
    // Also kill any remaining vite preview processes
    try {
      await execAsync('pkill -f "vite preview"');
    } catch (e) {
      // Ignore errors from pkill
    }
  }
}

prerender().catch((error) => {
  console.error(error);
  process.exit(1);
});
