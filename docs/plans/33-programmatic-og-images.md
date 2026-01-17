# Programmatic OG Image Generation

## Goal
Generate Open Graph images at build time for all project pages, ensuring consistent branding and eliminating manual design work.

## Approach
Build-time generation using satori (SVG rendering) + @resvg/resvg-js (PNG conversion). This works well with GitHub Pages' static-only hosting.

### Why satori over @vercel/og?
- @vercel/og is designed for edge runtime (Vercel Edge Functions)
- satori is the underlying library that @vercel/og uses
- For build-time generation, satori gives us direct control without edge runtime dependencies

## Implementation

### 1. Project Metadata Extraction
Created `src/data/projects-meta.json` with fields needed for OG images:
- slug, title, description, tags, icon, status

Simplified `src/data/projects.ts` by removing inline metadata that's now in the JSON file.

### 2. OG Image Script
`scripts/generate-og-images.mjs`:
- Loads Inter font (regular + bold) from `scripts/fonts/`
- Reads project metadata from JSON
- Generates 1200x630 PNG images with:
  - Dark background (#030712)
  - Lucide icon (SVG paths embedded)
  - Title in bold white
  - Description in muted gray
  - Tags as pill badges
  - Site URL in footer

### 3. Build Pipeline Integration
Added to all build scripts in `package.json`:
```bash
node scripts/generate-og-images.mjs
```

Runs before `vite build` so images are available for the build.

### 4. Project.tsx Updates
Updated to use generated images from `/og-images/{slug}.png`.

## Output
Images generated to `public/og-images/`:
- slo-tool.png
- statuspage-update.png
- oncall-coverage.png
- kanban.png
- analytics.png
- changelog.png

## Dependencies Added
- `satori` - SVG generation from React-like elements
- `@resvg/resvg-js` - High-quality SVG to PNG conversion
