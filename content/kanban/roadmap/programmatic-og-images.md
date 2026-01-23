---
id: programmatic-og-images
title: Programmatic OG Image Generation
column: changelog
summary: Build-time OG images via satori + resvg for project pages
labels:
  - "PR #150"
  - Enhancement
  - Infrastructure
checklist:
  - id: og-1
    text: Research @vercel/og vs satori for static generation
    completed: true
  - id: og-2
    text: Design OG image template (layout, colors, typography)
    completed: true
  - id: og-3
    text: Create generateOgImages.mjs script
    completed: true
  - id: og-4
    text: Add to build pipeline
    completed: true
  - id: og-5
    text: Update Project.tsx to use generated images
    completed: true
  - id: og-6
    text: Generate images for all active projects
    completed: true
planFile: docs/plans/33-programmatic-og-images.md
createdAt: "2026-01-17T00:00:00.000Z"
updatedAt: "2026-01-17T03:15:00.000Z"
history:
  - type: column
    timestamp: "2026-01-17T02:45:00.000Z"
    columnId: ideas
    columnTitle: Ideas
  - type: column
    timestamp: "2026-01-17T02:49:00.000Z"
    columnId: in-progress
    columnTitle: In Progress
  - type: column
    timestamp: "2026-01-17T03:15:00.000Z"
    columnId: changelog
    columnTitle: Change Log
---

Generate Open Graph images at build time for project pages using satori + @resvg/resvg-js.

Implemented:
- Build-time generation via scripts/generate-og-images.mjs
- Build-time validation via scripts/validate-projects.mjs
- Dark theme template with icon, title, description, tags
- Inter font (regular + bold) for typography
- Added to build pipeline in package.json
- Extracted project metadata to projects-meta.json
- Simplified projects.ts by removing inline metadata
- Fail-fast guards for CI (exits 1 on generation or validation failures)
