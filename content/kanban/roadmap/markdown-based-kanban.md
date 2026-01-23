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
    text: "Create migration script (JSON â markdown files)"
    completed: false
  - id: mbk-4
    text: "Build aggregation utility (markdown files â typed data)"
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
updatedAt: "2026-01-23T15:34:46.043Z"
history:
  - type: column
    timestamp: "2026-01-23T15:34:45.403Z"
    columnId: todo
    columnTitle: To Do
  - type: column
    timestamp: "2026-01-23T15:34:45.420Z"
    columnId: ideas
    columnTitle: Ideas
  - type: column
    timestamp: "2026-01-23T15:34:45.427Z"
    columnId: todo
    columnTitle: To Do
  - type: column
    timestamp: "2026-01-23T15:34:45.448Z"
    columnId: ideas
    columnTitle: Ideas
  - type: column
    timestamp: "2026-01-23T15:34:45.455Z"
    columnId: todo
    columnTitle: To Do
  - type: column
    timestamp: "2026-01-23T15:34:45.475Z"
    columnId: ideas
    columnTitle: Ideas
  - type: column
    timestamp: "2026-01-23T15:34:45.483Z"
    columnId: todo
    columnTitle: To Do
  - type: column
    timestamp: "2026-01-23T15:34:45.499Z"
    columnId: ideas
    columnTitle: Ideas
  - type: column
    timestamp: "2026-01-23T15:34:45.513Z"
    columnId: todo
    columnTitle: To Do
  - type: column
    timestamp: "2026-01-23T15:34:45.537Z"
    columnId: ideas
    columnTitle: Ideas
  - type: column
    timestamp: "2026-01-23T15:34:45.546Z"
    columnId: todo
    columnTitle: To Do
  - type: column
    timestamp: "2026-01-23T15:34:45.567Z"
    columnId: ideas
    columnTitle: Ideas
  - type: column
    timestamp: "2026-01-23T15:34:45.574Z"
    columnId: todo
    columnTitle: To Do
  - type: column
    timestamp: "2026-01-23T15:34:45.595Z"
    columnId: ideas
    columnTitle: Ideas
  - type: column
    timestamp: "2026-01-23T15:34:45.604Z"
    columnId: todo
    columnTitle: To Do
  - type: column
    timestamp: "2026-01-23T15:34:45.615Z"
    columnId: ideas
    columnTitle: Ideas
  - type: column
    timestamp: "2026-01-23T15:34:45.627Z"
    columnId: todo
    columnTitle: To Do
  - type: column
    timestamp: "2026-01-23T15:34:45.650Z"
    columnId: ideas
    columnTitle: Ideas
  - type: column
    timestamp: "2026-01-23T15:34:45.659Z"
    columnId: todo
    columnTitle: To Do
  - type: column
    timestamp: "2026-01-23T15:34:45.671Z"
    columnId: ideas
    columnTitle: Ideas
  - type: column
    timestamp: "2026-01-23T15:34:45.683Z"
    columnId: todo
    columnTitle: To Do
  - type: column
    timestamp: "2026-01-23T15:34:45.697Z"
    columnId: ideas
    columnTitle: Ideas
  - type: column
    timestamp: "2026-01-23T15:34:45.707Z"
    columnId: todo
    columnTitle: To Do
  - type: column
    timestamp: "2026-01-23T15:34:45.717Z"
    columnId: ideas
    columnTitle: Ideas
  - type: column
    timestamp: "2026-01-23T15:34:45.727Z"
    columnId: todo
    columnTitle: To Do
  - type: column
    timestamp: "2026-01-23T15:34:45.757Z"
    columnId: in-progress
    columnTitle: In Progress
  - type: column
    timestamp: "2026-01-23T15:34:45.766Z"
    columnId: todo
    columnTitle: To Do
  - type: column
    timestamp: "2026-01-23T15:34:45.783Z"
    columnId: in-progress
    columnTitle: In Progress
  - type: column
    timestamp: "2026-01-23T15:34:45.790Z"
    columnId: todo
    columnTitle: To Do
  - type: column
    timestamp: "2026-01-23T15:34:45.805Z"
    columnId: in-progress
    columnTitle: In Progress
  - type: column
    timestamp: "2026-01-23T15:34:45.810Z"
    columnId: todo
    columnTitle: To Do
  - type: column
    timestamp: "2026-01-23T15:34:45.822Z"
    columnId: in-progress
    columnTitle: In Progress
  - type: column
    timestamp: "2026-01-23T15:34:46.043Z"
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
