---
id: phase-2-markdown-only-saves
title: "Phase 2: Markdown-Only Saves"
column: in-review
labels:
  - Medium
  - Kanban
  - Infrastructure
checklist:
  - id: p2-1
    text: Update save workflow to write .md files instead of JSON
    completed: false
  - id: p2-2
    text: Generate card IDs from title slug (like CLI does)
    completed: false
  - id: p2-3
    text: Handle card renames (rename .md file)
    completed: false
  - id: p2-4
    text: Handle card deletion (delete .md file)
    completed: false
  - id: p2-5
    text: Trigger precompile after save (GitHub Action or webhook)
    completed: false
  - id: p2-6
    text: Remove JSON files after validation
    completed: false
createdAt: "2026-01-23T00:00:00.000Z"
updatedAt: "2026-01-23T15:26:08.058Z"
history:
  - type: column
    timestamp: "2026-01-23T15:26:06.422Z"
    columnId: changelog
    columnTitle: Change Log
  - type: column
    timestamp: "2026-01-23T15:26:08.058Z"
    columnId: in-review
    columnTitle: In Review
---

Eliminate dual maintenance by making markdown the single source of truth.

Current state: JSON files are edited by save workflow, markdown files power ChangelogExplorer.

Target state: Save workflow writes .md files directly via GitHub API, precompile runs on every push.

Benefits:
- Single source of truth (no sync issues)
- Better git diffs for card changes
- Easier manual editing when needed
- CLI tools work with same format
