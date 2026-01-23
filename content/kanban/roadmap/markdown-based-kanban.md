---
id: markdown-based-kanban
title: Migrate Kanban to Markdown Files
column: ideas
labels:
  - Medium
  - DX
  - Infrastructure
checklist:
  - id: mbk-1
    text: Evaluate Backlog.md vs custom Content Collections approach
    completed: false
  - id: mbk-2
    text: Design folder structure and frontmatter schema
    completed: false
  - id: mbk-3
    text: Create migration script (JSON → markdown files)
    completed: false
  - id: mbk-4
    text: Build aggregation utility (markdown files → typed data)
    completed: false
  - id: mbk-5
    text: Update useChangelogData hook to use new source
    completed: false
  - id: mbk-6
    text: Migrate roadmap-board.json
    completed: false
  - id: mbk-7
    text: Migrate house-board.json
    completed: false
createdAt: "2026-01-22T00:00:00.000Z"
---

Replace monolithic roadmap-board.json with individual markdown files per card. Adopt Backlog.md pattern or Astro Content Collections approach.

Problem: 1665-line JSON file is error-prone for manual editing (trailing commas, bracket mismatches).

Options evaluated:
- Backlog.md (ready-made, Claude Code compatible)
- Astro Content Collections pattern (gray-matter + Zod)
- YAML files
- TypeScript data files
