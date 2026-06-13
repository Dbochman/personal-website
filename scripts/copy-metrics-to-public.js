#!/usr/bin/env node

/**
 * Copy metrics files to public directory for client-side access
 * Run as part of prebuild to ensure fresh data
 *
 * SECURITY: Search console data is sanitized to remove raw query strings
 * which could expose user searches and competitive intelligence.
 */

import { copyFileSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

const LIGHTHOUSE_SUMMARY_URL =
  'https://raw.githubusercontent.com/Dbochman/personal-website/lighthouse-metrics/lighthouse-reports/summary.json';

/**
 * Fetch the latest Lighthouse summary from the lighthouse-metrics branch.
 * Lighthouse CI commits fresh results there (never to main), so the tracked
 * copy on main goes stale. Returns the JSON string, or null if the branch
 * is unreachable (offline local dev) — callers fall back to the tracked copy.
 */
async function fetchFreshLighthouseSummary() {
  try {
    const response = await fetch(LIGHTHOUSE_SUMMARY_URL, {
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) return null;
    const fresh = await response.text();
    JSON.parse(fresh); // validate before trusting it
    return fresh;
  } catch {
    return null;
  }
}

/**
 * Sanitize search console history by removing raw query strings
 * Keeps: summary stats, topPages (URLs are public anyway)
 * Removes: topQueries (contains actual user searches)
 */
function sanitizeSearchConsoleHistory(srcPath, destPath) {
  const raw = JSON.parse(readFileSync(srcPath, 'utf8'));

  // If it's an array (history entries), sanitize each entry
  const sanitized = Array.isArray(raw)
    ? raw.map(entry => {
        const { topQueries, ...rest } = entry;
        return rest;
      })
    : (() => {
        const { topQueries, ...rest } = raw;
        return rest;
      })();

  writeFileSync(destPath, JSON.stringify(sanitized, null, 2));
}

const filesToCopy = [
  { src: 'docs/metrics/latest.json', dest: 'public/metrics/latest.json' },
  { src: 'docs/metrics/ga4-history.json', dest: 'public/metrics/ga4-history.json' },
  { src: 'docs/metrics/github-billing-history.json', dest: 'public/metrics/github-billing-history.json' },
];

// Files that need sanitization before copying
const filesToSanitize = [
  {
    src: 'docs/metrics/search-console-history.json',
    dest: 'public/metrics/search-console-history.json',
    sanitizer: sanitizeSearchConsoleHistory
  },
];

console.log('📊 Copying metrics files to public directory...');

for (const { src, dest } of filesToCopy) {
  const srcPath = join(rootDir, src);
  const destPath = join(rootDir, dest);

  if (!existsSync(srcPath)) {
    console.log(`  ⚠️  Skipping ${src} (not found)`);
    continue;
  }

  // Ensure destination directory exists
  mkdirSync(dirname(destPath), { recursive: true });

  copyFileSync(srcPath, destPath);
  console.log(`  ✓ Copied ${src}`);
}

for (const { src, dest, sanitizer } of filesToSanitize) {
  const srcPath = join(rootDir, src);
  const destPath = join(rootDir, dest);

  if (!existsSync(srcPath)) {
    console.log(`  ⚠️  Skipping ${src} (not found)`);
    continue;
  }

  // Ensure destination directory exists
  mkdirSync(dirname(destPath), { recursive: true });

  sanitizer(srcPath, destPath);
  console.log(`  ✓ Sanitized and copied ${src}`);
}

// Lighthouse summary: prefer the latest data from the lighthouse-metrics
// branch over the (stale) tracked copy on main.
{
  const dest = join(rootDir, 'public/lighthouse-reports/summary.json');
  mkdirSync(dirname(dest), { recursive: true });

  const fresh = await fetchFreshLighthouseSummary();
  if (fresh) {
    writeFileSync(dest, fresh);
    console.log('  ✓ Copied lighthouse-reports/summary.json (fresh from lighthouse-metrics branch)');
  } else {
    const fallback = join(rootDir, 'lighthouse-reports/summary.json');
    if (existsSync(fallback)) {
      copyFileSync(fallback, dest);
      console.log('  ⚠️  lighthouse-metrics branch unreachable; copied tracked lighthouse-reports/summary.json (may be stale)');
    } else {
      console.log('  ⚠️  Skipping lighthouse-reports/summary.json (not found)');
    }
  }
}

console.log('✅ Metrics copy complete!\n');
