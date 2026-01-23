---
id: tailwind-v4
title: Tailwind CSS v4 Upgrade
column: todo
labels:
  - Medium-Large
  - Infrastructure
checklist:
  - completed: false
    id: tw-1
    text: Run npx @tailwindcss/upgrade on feature branch
  - completed: false
    id: tw-2
    text: Update PostCSS config (remove autoprefixer)
  - completed: false
    id: tw-3
    text: Consider Vite plugin migration
  - completed: false
    id: tw-4
    text: Fix shadow/blur/rounded utility renames
  - completed: false
    id: tw-5
    text: Update outline-none → outline-hidden
  - completed: false
    id: tw-6
    text: Migrate tailwindcss-animate plugin
  - completed: false
    id: tw-7
    text: Remove @tailwindcss/container-queries (now built-in)
  - completed: false
    id: tw-8
    text: Test dark mode and animations
  - completed: false
    id: tw-9
    text: Run Lighthouse audit before/after
planFile: docs/plans/22-tailwind-v4-upgrade.md
createdAt: '2026-01-08'
---
Migrate to v4: CSS-based config, Vite plugin, updated utilities. ~116 class renames across 59 files.
