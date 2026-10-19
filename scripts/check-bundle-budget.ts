import { readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// Keep the existing deployment limits. These count every emitted JS/CSS asset,
// including lazy chunks; moving code to another chunk does not evade the budget.
export const BUDGETS = {
  totalJS: 5700 * 1024,
  totalCSS: 150 * 1024,
  largestChunk: 600 * 1024, // Warning only, as in the original deploy check.
};

export function measureBundle(files: { name: string; size: number }[]) {
  let totalJS = 0;
  let totalCSS = 0;
  let largestChunk = 0;
  for (const { name, size } of files) {
    if (name.endsWith('.js')) {
      totalJS += size;
      largestChunk = Math.max(largestChunk, size);
    }
    if (name.endsWith('.css')) totalCSS += size;
  }
  return { totalJS, totalCSS, largestChunk };
}

export function budgetFailures(sizes: ReturnType<typeof measureBundle>): string[] {
  return (['totalJS', 'totalCSS'] as const)
    .filter(key => sizes[key] > BUDGETS[key])
    .map(key => `${key}: ${(sizes[key] / 1024).toFixed(1)} KiB > ${BUDGETS[key] / 1024} KiB`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const directory = 'dist/assets';
  const files = readdirSync(directory).map(name => ({
    name,
    size: statSync(join(directory, name)).size,
  }));
  const sizes = measureBundle(files);
  if (!sizes.totalJS || !sizes.totalCSS) throw new Error('Build assets are missing JS or CSS');
  for (const key of ['totalJS', 'totalCSS', 'largestChunk'] as const) {
    console.log(`${key}: ${(sizes[key] / 1024).toFixed(1)} KiB / ${BUDGETS[key] / 1024} KiB`);
  }
  const failures = budgetFailures(sizes);
  if (failures.length) {
    console.error(`Bundle budget exceeded:\n${failures.join('\n')}`);
    process.exitCode = 1;
  } else {
    console.log('All hard bundle budgets pass.');
  }
  if (sizes.largestChunk > BUDGETS.largestChunk) {
    console.warn('Largest chunk exceeds the existing soft limit.');
  }
}
