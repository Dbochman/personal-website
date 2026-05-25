#!/usr/bin/env node
import { existsSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

const SITE_URL = 'https://dylanbochman.com';
const distDir = join(process.cwd(), 'dist');
const sitemapPath = join(distDir, 'sitemap.xml');
const blogManifestPath = join(process.cwd(), 'src', 'generated', 'blog', 'manifest.json');

function fail(message) {
  console.error(`❌ ${message}`);
  process.exitCode = 1;
}

function artifactForPath(pathname) {
  if (pathname === '/') {
    return join(distDir, 'index.html');
  }

  return join(distDir, `${pathname.replace(/^\/+|\/+$/g, '')}.html`);
}

function trailingSlashArtifactForPath(pathname) {
  return join(distDir, pathname.replace(/^\/+|\/+$/g, ''), 'index.html');
}

function legacyTrailingSlashPaths() {
  const paths = [
    '/projects/andre/',
    '/blog/2026-02-04-andre-collaborative-music-queue/',
  ];

  if (!existsSync(blogManifestPath)) {
    return paths;
  }

  const manifest = JSON.parse(readFileSync(blogManifestPath, 'utf8'));
  for (const [filenameSlug, entry] of Object.entries(manifest)) {
    const canonicalSlug = entry.frontmatter.slug;
    if (!entry.frontmatter.draft && canonicalSlug && canonicalSlug !== filenameSlug) {
      paths.push(`/blog/${filenameSlug}/`);
    }
  }

  return paths;
}

if (!existsSync(sitemapPath)) {
  fail('dist/sitemap.xml is missing. Run npm run build first.');
} else {
  const sitemap = readFileSync(sitemapPath, 'utf8');
  const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]);

  if (urls.length === 0) {
    fail('dist/sitemap.xml does not contain any <loc> entries.');
  }

  for (const url of urls) {
    if (!url.startsWith(SITE_URL)) {
      fail(`Unexpected sitemap host: ${url}`);
      continue;
    }

    const { pathname } = new URL(url);

    if (pathname !== '/' && pathname.endsWith('/')) {
      fail(`Sitemap URL should be slashless to avoid GitHub Pages directory redirects: ${url}`);
    }

    const artifactPath = artifactForPath(pathname);

    if (!existsSync(artifactPath)) {
      fail(`Sitemap URL has no matching prerendered artifact: ${url} -> ${artifactPath}`);
      continue;
    }

    if (statSync(artifactPath).size < 10_000) {
      fail(`Prerendered artifact looks too small: ${artifactPath}`);
    }
  }

  const legacyPaths = legacyTrailingSlashPaths();
  for (const pathname of legacyPaths) {
    const artifactPath = trailingSlashArtifactForPath(pathname);

    if (!existsSync(artifactPath)) {
      fail(`Legacy trailing-slash redirect route has no matching artifact: ${pathname} -> ${artifactPath}`);
      continue;
    }

    if (statSync(artifactPath).size < 10_000) {
      fail(`Legacy redirect artifact looks too small: ${artifactPath}`);
    }
  }

  if (!process.exitCode) {
    console.log(`✅ Verified ${urls.length} sitemap URLs and ${legacyPaths.length} legacy trailing-slash routes have matching prerendered artifacts`);
  }
}
