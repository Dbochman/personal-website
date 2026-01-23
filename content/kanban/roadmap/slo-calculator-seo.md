---
id: slo-calculator-seo
title: SLO Calculator SEO
column: changelog
labels:
  - "PR #149"
  - SEO
  - Enhancement
checklist:
  - id: seo-1
    text: Add WebApplication JSON-LD schema to Project.tsx
    completed: true
  - id: seo-2
    text: Add BreadcrumbList JSON-LD schema
    completed: true
  - id: seo-3
    text: Add keywords field to ProjectMeta type
    completed: true
  - id: seo-4
    text: Update SLO Calculator with keywords
    completed: true
  - id: seo-5
    text: Fix ogImage to use absolute URLs
    completed: true
createdAt: "2026-01-16T00:00:00.000Z"
updatedAt: "2026-01-17T03:00:00.000Z"
history:
  - type: column
    timestamp: "2026-01-16T23:30:00.000Z"
    columnId: ideas
    columnTitle: Ideas
  - type: column
    timestamp: "2026-01-17T02:30:00.000Z"
    columnId: in-review
    columnTitle: In Review
  - type: column
    timestamp: "2026-01-17T03:00:00.000Z"
    columnId: changelog
    columnTitle: Change Log
---

Added JSON-LD structured data and keyword optimization for SLO Calculator project page.

Implemented:
- WebApplication JSON-LD schema for active projects
- BreadcrumbList JSON-LD schema for navigation
- Keywords and ogImage fields in ProjectMeta type
- SEO-optimized keywords for SLO Calculator
- resolveOgImage helper for absolute URL handling

OG image generation moved to separate task (Programmatic OG Image Generation).
