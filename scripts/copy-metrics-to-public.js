#!/usr/bin/env node

/**
 * Copy metrics files to public directory for client-side access
 * Run as part of prebuild to ensure fresh data
 */

import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

const filesToCopy = [
  { src: 'docs/metrics/latest.json', dest: 'public/metrics/latest.json' },
  { src: 'docs/metrics/ga4-history.json', dest: 'public/metrics/ga4-history.json' },
  { src: 'docs/metrics/search-console-history.json', dest: 'public/metrics/search-console-history.json' },
  { src: 'lighthouse-reports/summary.json', dest: 'public/lighthouse-reports/summary.json' },
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

console.log('✅ Metrics copy complete!\n');
