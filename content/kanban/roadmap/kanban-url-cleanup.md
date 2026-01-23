---
id: kanban-url-cleanup
title: Kanban URL Simplification
column: changelog
labels:
  - "PR #139"
  - Cleanup
  - UX
checklist:
  - id: kus-1
    text: Delete useKanbanPersistence.ts
    completed: true
  - id: kus-2
    text: Remove URL persistence from KanbanBoard.tsx
    completed: true
  - id: kus-3
    text: Add initialCardId prop and auto-open logic
    completed: true
  - id: kus-4
    text: Update index.tsx to read card param
    completed: true
  - id: kus-5
    text: Update Share button to copy clean URL
    completed: true
  - id: kus-6
    text: Add Copy Card Link to card menu
    completed: true
  - id: kus-7
    text: Remove lz-string dependency
    completed: true
planFile: docs/plans/29-kanban-url-simplification.md
createdAt: "2026-01-16T17:55:00.000Z"
updatedAt: "2026-01-16T18:14:27.000Z"
history:
  - type: column
    timestamp: "2026-01-16T17:55:00.000Z"
    columnId: ideas
    columnTitle: Ideas
  - type: column
    timestamp: "2026-01-16T18:05:00.000Z"
    columnId: todo
    columnTitle: To Do
  - type: column
    timestamp: "2026-01-16T21:00:00.000Z"
    columnId: in-progress
    columnTitle: In Progress
  - type: column
    timestamp: "2026-01-16T18:14:27.000Z"
    columnId: changelog
    columnTitle: Change Log
description: |
  Remove URL state persistence, keep just `?board=roadmap`. Add deep linking with `?card=id` to open specific cards on load.
---
