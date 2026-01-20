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
  { src: 'lighthouse-reports/summary.json', dest: 'public/lighthouse-reports/summary.json' },
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

console.log('✅ Metrics copy complete!\n');
