#!/usr/bin/env node
import { existsSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

const SITE_URL = 'https://dylanbochman.com';
const distDir = join(process.cwd(), 'dist');
const sitemapPath = join(distDir, 'sitemap.xml');
const blogManifestPath = join(process.cwd(), 'src', 'generated', 'blog', 'manifest.json');

// Must stay in sync with LEGACY_REDIRECTS in scripts/prerender.mjs.
const HARDCODED_LEGACY_REDIRECTS = [
  { from: '/projects/andre', to: '/projects/echonest' },
  { from: '/blog/2026-02-04-andre-collaborative-music-queue', to: '/blog/2026-02-04-echonest-collaborative-music-queue' },
];

const MIN_CANONICAL_SIZE = 10_000;

function fail(message) {
  console.error(`❌ ${message}`);
  process.exitCode = 1;
}

function canonicalArtifactPath(pathname) {
  if (pathname === '/') {
    return join(distDir, 'index.html');
  }
  return join(distDir, `${pathname.replace(/^\/+|\/+$/g, '')}.html`);
}

function trailingSlashArtifactPath(pathname) {
  return join(distDir, pathname.replace(/^\/+|\/+$/g, ''), 'index.html');
}

function assertRedirectArtifact(artifactPath, expectedTarget, label) {
  if (!existsSync(artifactPath)) {
    fail(`${label} missing: ${artifactPath}`);
    return;
  }

  const contents = readFileSync(artifactPath, 'utf8');
  const expectedCanonical = `https://dylanbochman.com${expectedTarget}`;

  if (!contents.includes(`<link rel="canonical" href="${expectedCanonical}">`)) {
    fail(`${label} (${artifactPath}) is missing canonical link to ${expectedCanonical}`);
  }
  if (!contents.includes(`url=${expectedTarget}`)) {
    fail(`${label} (${artifactPath}) is missing meta-refresh to ${expectedTarget}`);
  }
}

function assertCanonicalArtifact(artifactPath, label) {
  if (!existsSync(artifactPath)) {
    fail(`${label} missing: ${artifactPath}`);
    return;
  }
  if (statSync(artifactPath).size < MIN_CANONICAL_SIZE) {
    fail(`${label} looks too small (likely a redirect, not the real page): ${artifactPath}`);
  }
}

function manifestLegacyRedirects() {
  if (!existsSync(blogManifestPath)) return [];

  const manifest = JSON.parse(readFileSync(blogManifestPath, 'utf8'));
  const redirects = [];
  for (const [filenameSlug, entry] of Object.entries(manifest)) {
    const canonicalSlug = entry.frontmatter.slug;
    if (!entry.frontmatter.draft && canonicalSlug && canonicalSlug !== filenameSlug) {
      redirects.push({ from: `/blog/${filenameSlug}`, to: `/blog/${canonicalSlug}` });
    }
  }
  return redirects;
}

if (!existsSync(sitemapPath)) {
  fail('dist/sitemap.xml is missing. Run npm run build first.');
} else {
  const sitemap = readFileSync(sitemapPath, 'utf8');
  const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]);

  if (urls.length === 0) {
    fail('dist/sitemap.xml does not contain any <loc> entries.');
  }

  let trailingSlashChecks = 0;
  for (const url of urls) {
    if (!url.startsWith(SITE_URL)) {
      fail(`Unexpected sitemap host: ${url}`);
      continue;
    }

    const { pathname } = new URL(url);

    if (pathname !== '/' && pathname.endsWith('/')) {
      fail(`Sitemap URL should be slashless to avoid GitHub Pages directory redirects: ${url}`);
    }

    assertCanonicalArtifact(canonicalArtifactPath(pathname), `Sitemap canonical artifact for ${url}`);

    // Every non-root sitemap route also needs a trailing-slash redirect artifact.
    // Without it, GitHub Pages returns 404 for inbound /foo/ URLs (it serves
    // foo.html for /foo but does not fall back to foo.html for /foo/).
    if (pathname !== '/') {
      assertRedirectArtifact(
        trailingSlashArtifactPath(pathname),
        pathname,
        `Trailing-slash redirect for ${url}`
      );
      trailingSlashChecks += 1;
    }
  }

  const legacyRedirects = [...manifestLegacyRedirects(), ...HARDCODED_LEGACY_REDIRECTS];
  for (const { from, to } of legacyRedirects) {
    assertRedirectArtifact(
      canonicalArtifactPath(from),
      to,
      `Legacy slashless redirect ${from} → ${to}`
    );
    assertRedirectArtifact(
      trailingSlashArtifactPath(from),
      to,
      `Legacy trailing-slash redirect ${from}/ → ${to}`
    );
  }

  if (!process.exitCode) {
    console.log(
      `✅ Verified ${urls.length} sitemap canonicals, ${trailingSlashChecks} trailing-slash redirects, and ${legacyRedirects.length} legacy slug redirects`
    );
  }
}
