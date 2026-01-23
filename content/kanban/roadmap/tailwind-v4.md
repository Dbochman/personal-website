---
id: tailwind-v4
title: Tailwind CSS v4 Upgrade
column: changelog
labels:
  - Medium-Large
  - Infrastructure
checklist:
  - id: tw-1
    text: Run npx @tailwindcss/upgrade on feature branch
    completed: true
  - id: tw-2
    text: Update PostCSS config (remove autoprefixer)
    completed: true
  - id: tw-3
    text: Consider Vite plugin migration
    completed: true
  - id: tw-4
    text: Fix shadow/blur/rounded utility renames
    completed: true
  - id: tw-5
    text: "Update outline-none → outline-hidden"
    completed: true
  - id: tw-6
    text: Migrate tailwindcss-animate plugin
    completed: true
  - id: tw-7
    text: Remove @tailwindcss/container-queries (now built-in)
    completed: true
  - id: tw-8
    text: Test dark mode and animations
    completed: true
  - id: tw-9
    text: Run Lighthouse audit before/after
    completed: true
planFile: docs/plans/22-tailwind-v4-upgrade.md
createdAt: "2026-01-08T00:00:00.000Z"
updatedAt: "2026-01-21T00:00:00.000Z"
history:
  - type: column
    timestamp: "2026-01-08T00:00:00.000Z"
    columnId: ideas
    columnTitle: Ideas
  - type: column
    timestamp: "2026-01-20T00:00:00.000Z"
    columnId: in-progress
    columnTitle: In Progress
  - type: column
    timestamp: "2026-01-21T00:00:00.000Z"
    columnId: changelog
    columnTitle: Change Log
description: |
  Migrate to v4: CSS-based config, Vite plugin, updated utilities. ~116 class renames across 59 files.
  
  Completed Jan 21. See blog post: "Tailwind v4 Upgrade: The Performance Tradeoff"
---
