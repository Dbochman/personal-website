/**
 * Validate that all projects in projects-meta.json have matching components
 * Run during build to catch slug drift before deployment
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

// Load project metadata
const projectsMeta = JSON.parse(
  fs.readFileSync(path.join(projectRoot, 'src', 'data', 'projects-meta.json'), 'utf-8')
);

// Known component slugs (must match componentMap in projects.ts)
const validSlugs = [
  'slo-tool',
  'statuspage-update',
  'oncall-coverage',
  'kanban',
  'analytics',
  'changelog',
  'cli-playground',
];

console.log('Validating project configuration...');

const errors = [];

for (const project of projectsMeta) {
  if (!validSlugs.includes(project.slug)) {
    errors.push(
      `Project "${project.slug}" in projects-meta.json has no matching component. ` +
        `Add it to componentMap in projects.ts and validSlugs in validate-projects.mjs.`
    );
  }
}

if (errors.length > 0) {
  console.error('\n❌ Project validation failed:\n');
  errors.forEach((err) => console.error(`  - ${err}`));
  process.exit(1);
}

console.log(`✓ All ${projectsMeta.length} projects have valid component mappings`);
