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

    // Old routes that redirect to new ones — must be prerendered so GitHub Pages
    // serves the SPA shell which performs the client-side redirect
    const redirectRoutes = [
      '/projects/andre',
      '/projects/andre/',
      '/blog/2026-02-04-andre-collaborative-music-queue',
      '/blog/2026-02-04-andre-collaborative-music-queue/',
    ];

    const routes = [
      '/projects',
      ...projectSlugs.map(slug => `/projects/${slug}`),
      '/runbook',
      '/analytics',
      '/blog',
      ...blogSlugs.map(slug => `/blog/${slug}`),
      ...redirectRoutes,
    ];

    // Routes with persistent network activity (auth, polling) that prevent networkidle
    const routesWithPolling = ['/projects/kanban'];

    console.log(`📄 Pre-rendering ${routes.length} routes...`);

    for (const route of routes) {
      console.log(`  ➜ ${route}`);

      // Use domcontentloaded for routes with polling, networkidle for others
      const waitUntil = routesWithPolling.includes(route) ? 'domcontentloaded' : 'networkidle';

      // Navigate to the route
      await page.goto(`${baseUrl}${route}`, { waitUntil });

      // Wait for React to render (longer wait for polling routes since we don't wait for network)
      await page.waitForTimeout(routesWithPolling.includes(route) ? 2000 : 500);

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

    // Create redirect files for legacy URLs (Google Search Console 404s)
    // These are .html files that existed on the old site
    console.log('🔄 Creating legacy URL redirects...');
    const legacyRedirects = [
      { from: 'contactme.html', to: '/' },
      { from: 'bretton-woods.html', to: '/' },
      { from: 'eurotrip.html', to: '/' },
      { from: 'photography.html', to: '/' },
      { from: 'golden-gloves.html', to: '/' },
    ];

    for (const redirect of legacyRedirects) {
      const redirectHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Redirecting...</title>
  <link rel="canonical" href="https://dylanbochman.com${redirect.to}">
  <meta http-equiv="refresh" content="0; url=${redirect.to}">
  <script>window.location.href = "${redirect.to}";</script>
</head>
<body>
  <p>Redirecting to <a href="${redirect.to}">dylanbochman.com${redirect.to}</a>...</p>
</body>
</html>`;
      const outputPath = join(distDir, redirect.from);
      writeFileSync(outputPath, redirectHtml);
      console.log(`    ✓ Created redirect: ${redirect.from} → ${redirect.to}`);
    }

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
