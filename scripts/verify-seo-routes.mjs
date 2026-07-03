#!/usr/bin/env node
import { existsSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

const SITE_URL = 'https://dylanbochman.com';
const distDir = join(process.cwd(), 'dist');
const sitemapPath = join(distDir, 'sitemap.xml');
const blogManifestPath = join(process.cwd(), 'src', 'generated', 'blog', 'manifest.json');
const projectsMetaPath = join(process.cwd(), 'src', 'data', 'projects-meta.json');
const seoRedirectsPath = join(process.cwd(), 'src', 'data', 'seo-redirects.json');

const { legacyRedirects: HARDCODED_LEGACY_REDIRECTS } = JSON.parse(
  readFileSync(seoRedirectsPath, 'utf8')
);

const MIN_CANONICAL_SIZE = 10_000;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_DATETIME_WITH_TIMEZONE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;
const STATIC_SITEMAP_PATHS = new Set(['/', '/blog', '/projects', '/runbook']);

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

function extractJsonLd(contents, label) {
  const items = [];
  const scripts = contents.matchAll(
    /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>\s*([\s\S]*?)\s*<\/script>/gi
  );

  for (const match of scripts) {
    try {
      const parsed = JSON.parse(match[1]);
      if (Array.isArray(parsed)) {
        items.push(...parsed);
      } else if (Array.isArray(parsed?.['@graph'])) {
        items.push(...parsed['@graph']);
      } else {
        items.push(parsed);
      }
    } catch (error) {
      fail(`${label} contains invalid JSON-LD: ${error.message}`);
    }
  }

  return items;
}

function assertProfilePageScope(artifactPath, pathname) {
  const contents = readFileSync(artifactPath, 'utf8');
  const profilePages = extractJsonLd(contents, artifactPath)
    .filter(item => item?.['@type'] === 'ProfilePage');

  if (pathname !== '/') {
    if (profilePages.length > 0) {
      fail(`ProfilePage JSON-LD must only appear on the homepage, found on ${pathname}`);
    }
    return;
  }

  if (profilePages.length !== 1) {
    fail(`Homepage must contain exactly one ProfilePage JSON-LD block, found ${profilePages.length}`);
    return;
  }

  for (const property of ['dateCreated', 'dateModified']) {
    const value = profilePages[0][property];
    if (!ISO_DATETIME_WITH_TIMEZONE.test(value) || Number.isNaN(Date.parse(value))) {
      fail(`Homepage ProfilePage ${property} must be an ISO 8601 DateTime with timezone: ${value}`);
    }
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

function expectedSitemapLastmods() {
  const expected = new Map();

  if (existsSync(blogManifestPath)) {
    const manifest = JSON.parse(readFileSync(blogManifestPath, 'utf8'));
    for (const [filenameSlug, entry] of Object.entries(manifest)) {
      if (entry.frontmatter.draft) continue;
      const slug = entry.frontmatter.slug ?? filenameSlug;
      expected.set(`/blog/${slug}`, entry.frontmatter.updated ?? entry.frontmatter.date);
    }
  }

  const projects = JSON.parse(readFileSync(projectsMetaPath, 'utf8'));
  for (const project of projects) {
    if (project.status === 'draft') continue;
    expected.set(`/projects/${project.slug}`, project.updatedAt ?? null);
  }

  return expected;
}

function parseSitemapEntries(sitemap) {
  return [...sitemap.matchAll(/<url>\s*([\s\S]*?)\s*<\/url>/g)].map(([, block]) => ({
    loc: block.match(/<loc>(.*?)<\/loc>/)?.[1],
    lastmod: block.match(/<lastmod>(.*?)<\/lastmod>/)?.[1],
  }));
}

function assertSitemapMetadata(entries) {
  const expectedLastmods = expectedSitemapLastmods();
  const seen = new Set();
  const seenPaths = new Set();
  const today = new Date().toISOString().slice(0, 10);

  for (const { loc, lastmod } of entries) {
    if (!loc) {
      fail('Sitemap contains a URL entry without <loc>.');
      continue;
    }
    if (seen.has(loc)) {
      fail(`Sitemap contains duplicate URL: ${loc}`);
    }
    seen.add(loc);

    const { pathname } = new URL(loc);
    seenPaths.add(pathname);
    if (STATIC_SITEMAP_PATHS.has(pathname)) {
      if (lastmod) {
        fail(`Static route ${pathname} must omit untracked lastmod instead of using the build date.`);
      }
      continue;
    }

    if (!expectedLastmods.has(pathname)) {
      fail(`Sitemap route ${pathname} has no source-backed lastmod.`);
      continue;
    }
    const expected = expectedLastmods.get(pathname);
    if (expected === null) {
      if (lastmod) {
        fail(`Sitemap route ${pathname} must omit lastmod until updatedAt is tracked.`);
      }
      continue;
    }
    if (lastmod !== expected) {
      fail(`Sitemap route ${pathname} has lastmod ${lastmod ?? 'missing'}; expected ${expected}.`);
    }
    if (!ISO_DATE.test(lastmod) || Number.isNaN(Date.parse(`${lastmod}T00:00:00Z`))) {
      fail(`Sitemap route ${pathname} has invalid lastmod: ${lastmod}`);
    } else if (lastmod > today) {
      fail(`Sitemap route ${pathname} has future lastmod: ${lastmod}`);
    }
  }

  for (const pathname of [...STATIC_SITEMAP_PATHS, ...expectedLastmods.keys()]) {
    if (!seenPaths.has(pathname)) {
      fail(`Source-backed canonical route is missing from sitemap: ${pathname}`);
    }
  }
}

function assertDraftProjectsExcluded(entries) {
  const sitemapPaths = new Set(entries.map(({ loc }) => loc && new URL(loc).pathname));
  const projects = JSON.parse(readFileSync(projectsMetaPath, 'utf8'));
  const drafts = projects.filter(project => project.status === 'draft');

  for (const project of drafts) {
    const pathname = `/projects/${project.slug}`;
    if (sitemapPaths.has(pathname)) {
      fail(`Draft project must not appear in sitemap: ${pathname}`);
    }
    if (existsSync(canonicalArtifactPath(pathname))) {
      fail(`Draft project must not have a canonical prerender artifact: ${pathname}`);
    }
    if (existsSync(trailingSlashArtifactPath(pathname))) {
      fail(`Draft project must not have a trailing-slash artifact: ${pathname}/`);
    }
  }

  return drafts.length;
}

if (!existsSync(sitemapPath)) {
  fail('dist/sitemap.xml is missing. Run npm run build first.');
} else {
  const sitemap = readFileSync(sitemapPath, 'utf8');
  const sitemapEntries = parseSitemapEntries(sitemap);
  const urls = sitemapEntries.map(entry => entry.loc).filter(Boolean);

  if (urls.length === 0) {
    fail('dist/sitemap.xml does not contain any <loc> entries.');
  }

  assertSitemapMetadata(sitemapEntries);
  const draftExclusionChecks = assertDraftProjectsExcluded(sitemapEntries);

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

    const artifactPath = canonicalArtifactPath(pathname);
    assertCanonicalArtifact(artifactPath, `Sitemap canonical artifact for ${url}`);
    assertProfilePageScope(artifactPath, pathname);

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
      `✅ Verified ${urls.length} sitemap canonicals, homepage-only ProfilePage JSON-LD, ${trailingSlashChecks} trailing-slash redirects, ${legacyRedirects.length} legacy slug redirects, and ${draftExclusionChecks} intentional draft exclusion${draftExclusionChecks === 1 ? '' : 's'}`
    );
  }
}
