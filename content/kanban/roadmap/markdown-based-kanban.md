---
id: markdown-based-kanban
title: Migrate Kanban to Markdown Files
column: in-review
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
    text: Create migration script (JSON â markdown files)
    completed: false
  - id: mbk-4
    text: Build aggregation utility (markdown files â typed data)
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
updatedAt: "2026-01-23T15:26:12.649Z"
history:
  - type: column
    timestamp: "2026-01-23T15:26:11.973Z"
    columnId: changelog
    columnTitle: Change Log
  - type: column
    timestamp: "2026-01-23T15:26:12.649Z"
    columnId: in-review
    columnTitle: In Review
---

Replace monolithic roadmap-board.json with individual markdown files per card. Adopt Backlog.md pattern or Astro Content Collections approach.

Problem: 1665-line JSON file is error-prone for manual editing (trailing commas, bracket mismatches).

Options evaluated:
- Backlog.md (ready-made, Claude Code compatible)
- Astro Content Collections pattern (gray-matter + Zod)
- YAML files
- TypeScript data files
