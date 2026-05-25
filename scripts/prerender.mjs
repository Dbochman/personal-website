#!/usr/bin/env node
import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const distDir = join(__dirname, '..', 'dist');
const blogManifestPath = join(__dirname, '..', 'src', 'generated', 'blog', 'manifest.json');
const projectsMetaPath = join(__dirname, '..', 'src', 'data', 'projects-meta.json');
const seoRedirectsPath = join(__dirname, '..', 'src', 'data', 'seo-redirects.json');

// Hardcoded legacy redirects that aren't derivable from the blog manifest.
// Single source of truth: src/data/seo-redirects.json (also read by
// scripts/verify-seo-routes.mjs and scripts/smoke-live-routes.mjs).
const { legacyRedirects: LEGACY_REDIRECTS } = JSON.parse(readFileSync(seoRedirectsPath, 'utf-8'));

function routeToOutputPath(route) {
  if (route === '/') {
    return join(distDir, 'index.html');
  }

  const cleanRoute = route.replace(/^\/+|\/+$/g, '');
  return join(distDir, `${cleanRoute}.html`);
}

function trailingSlashOutputPath(route) {
  const cleanRoute = route.replace(/^\/+|\/+$/g, '');
  return join(distDir, cleanRoute, 'index.html');
}

function writeRedirectArtifact(outputPath, destination) {
  // Meta-refresh redirect with canonical link so search engines consolidate
  // signals on the destination URL. window.location.replace() avoids adding
  // a history entry so the back button doesn't bounce.
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Redirecting…</title>
  <link rel="canonical" href="https://dylanbochman.com${destination}">
  <meta http-equiv="refresh" content="0; url=${destination}">
  <script>window.location.replace(${JSON.stringify(destination)});</script>
</head>
<body>
  <p>Redirecting to <a href="${destination}">dylanbochman.com${destination}</a>…</p>
</body>
</html>
`;
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, html);
}

function loadBlogRoutes() {
  const manifest = JSON.parse(readFileSync(blogManifestPath, 'utf-8'));

  return Object.entries(manifest)
    .filter(([, entry]) => !entry.frontmatter.draft)
    .map(([filenameSlug, entry]) => ({
      route: `/blog/${entry.frontmatter.slug ?? filenameSlug}`,
      legacyRoute: entry.frontmatter.slug && entry.frontmatter.slug !== filenameSlug
        ? `/blog/${filenameSlug}`
        : null,
    }));
}

function loadPublicProjects() {
  const projectsMeta = JSON.parse(readFileSync(projectsMetaPath, 'utf-8'));
  return projectsMeta.filter(project => project.status !== 'draft');
}

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

    // Get indexable content from the same generated data used by the sitemap.
    const blogRoutes = loadBlogRoutes();
    const projectSlugs = loadPublicProjects().map(p => p.slug);

    const routes = [
      '/',
      '/projects',
      ...projectSlugs.map(slug => `/projects/${slug}`),
      '/runbook',
      '/analytics',
      '/blog',
      ...blogRoutes.map(blogRoute => blogRoute.route),
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

      // Determine output path. GitHub Pages serves /foo from foo.html without
      // redirecting to /foo/, which keeps sitemap and canonical URLs aligned.
      const outputPath = routeToOutputPath(route);

      // Create directory if it doesn't exist
      mkdirSync(dirname(outputPath), { recursive: true });

      // Write HTML file
      writeFileSync(outputPath, html);

      console.log(`    ✓ Generated ${outputPath.replace(distDir, 'dist')}`);
    }

    await browser.close();

    // Trailing-slash redirects for every prerendered route. GitHub Pages
    // serves /foo from foo.html but /foo/ requires foo/index.html — without
    // these stubs, old indexed or externally-linked trailing-slash URLs 404.
    console.log('↩  Creating trailing-slash redirects to canonical URLs...');
    for (const route of routes) {
      if (route === '/') continue;
      const outputPath = trailingSlashOutputPath(route);
      writeRedirectArtifact(outputPath, route);
      console.log(`    ✓ ${route}/ → ${route}`);
    }

    // Legacy slug redirects derived from the blog manifest plus a small
    // hardcoded list for cases the manifest doesn't cover (e.g. project renames).
    // Both slashless and trailing-slash variants are written so any inbound
    // shape resolves without a GitHub Pages redirect.
    console.log('🔄 Creating legacy slug redirects...');
    const manifestRedirects = blogRoutes
      .filter(b => b.legacyRoute)
      .map(b => ({ from: b.legacyRoute, to: b.route }));

    for (const redirect of [...manifestRedirects, ...LEGACY_REDIRECTS]) {
      writeRedirectArtifact(routeToOutputPath(redirect.from), redirect.to);
      writeRedirectArtifact(trailingSlashOutputPath(redirect.from), redirect.to);
      console.log(`    ✓ ${redirect.from} → ${redirect.to}`);
    }

    // Legacy .html files from the pre-SPA site (Google Search Console 404s).
    console.log('🔄 Creating legacy .html redirects...');
    const legacyHtmlRedirects = [
      { from: 'contactme.html', to: '/' },
      { from: 'bretton-woods.html', to: '/' },
      { from: 'eurotrip.html', to: '/' },
      { from: 'photography.html', to: '/' },
      { from: 'golden-gloves.html', to: '/' },
    ];

    for (const redirect of legacyHtmlRedirects) {
      writeRedirectArtifact(join(distDir, redirect.from), redirect.to);
      console.log(`    ✓ ${redirect.from} → ${redirect.to}`);
    }

    // Build marker the post-deploy smoke check uses to confirm the live site
    // is actually serving THIS build (and not an older artifact that happens
    // to satisfy the route shape). The smoke check polls /build-info.json
    // until the live `sha` matches the local one.
    const buildInfo = {
      sha: process.env.GITHUB_SHA ?? 'local',
      builtAt: new Date().toISOString(),
    };
    writeFileSync(join(distDir, 'build-info.json'), `${JSON.stringify(buildInfo, null, 2)}\n`);
    console.log(`📌 Wrote dist/build-info.json (sha=${buildInfo.sha})`);

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
