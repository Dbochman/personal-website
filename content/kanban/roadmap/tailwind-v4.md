---
id: tailwind-v4
title: Tailwind CSS v4 Upgrade
column: in-review
labels:
  - Medium-Large
  - Infrastructure
checklist:
  - id: tw-1
    text: Run npx @tailwindcss/upgrade on feature branch
    completed: false
  - id: tw-2
    text: Update PostCSS config (remove autoprefixer)
    completed: false
  - id: tw-3
    text: Consider Vite plugin migration
    completed: false
  - id: tw-4
    text: Fix shadow/blur/rounded utility renames
    completed: false
  - id: tw-5
    text: "Update outline-none Ã¢ÂÂ outline-hidden"
    completed: false
  - id: tw-6
    text: Migrate tailwindcss-animate plugin
    completed: false
  - id: tw-7
    text: Remove @tailwindcss/container-queries (now built-in)
    completed: false
  - id: tw-8
    text: Test dark mode and animations
    completed: false
  - id: tw-9
    text: Run Lighthouse audit before/after
    completed: false
planFile: docs/plans/22-tailwind-v4-upgrade.md
createdAt: "2026-01-08"
updatedAt: "2026-01-23T15:59:42.941Z"
history:
  - type: column
    timestamp: "2026-01-23T15:59:42.716Z"
    columnId: in-progress
    columnTitle: In Progress
  - type: column
    timestamp: "2026-01-23T15:59:42.866Z"
    columnId: in-review
    columnTitle: In Review
  - type: column
    timestamp: "2026-01-23T15:59:42.874Z"
    columnId: in-progress
    columnTitle: In Progress
  - type: column
    timestamp: "2026-01-23T15:59:42.889Z"
    columnId: in-review
    columnTitle: In Review
  - type: column
    timestamp: "2026-01-23T15:59:42.902Z"
    columnId: in-progress
    columnTitle: In Progress
  - type: column
    timestamp: "2026-01-23T15:59:42.917Z"
    columnId: in-review
    columnTitle: In Review
  - type: column
    timestamp: "2026-01-23T15:59:42.927Z"
    columnId: in-progress
    columnTitle: In Progress
  - type: column
    timestamp: "2026-01-23T15:59:42.941Z"
    columnId: in-review
    columnTitle: In Review
---

Migrate to v4: CSS-based config, Vite plugin, updated utilities. ~116 class renames across 59 files.
