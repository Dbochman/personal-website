---
id: kanban-giscus
title: Kanban Card Comments
column: changelog
labels:
  - 'PR #131'
  - Feature
checklist:
  - completed: true
    id: gc-1
    text: Create reusable CardComments component
  - completed: true
    id: gc-2
    text: Add theme matching (sync with site dark/light mode)
  - completed: true
    id: gc-3
    text: Add to CardEditorModal with lazy loading
  - completed: true
    id: gc-4
    text: Use card.id as discussion term
  - completed: true
    id: gc-5
    text: Test theme switching and comment persistence
planFile: docs/plans/25-kanban-card-comments.md
createdAt: '2026-01-16'
updatedAt: '2026-01-16T02:30:00.000Z'
history:
  - columnId: in-progress
    columnTitle: In Progress
    timestamp: '2026-01-16T02:20:00.000Z'
    type: column
  - columnId: in-review
    columnTitle: In Review
    timestamp: '2026-01-16T02:25:00.000Z'
    type: column
  - columnId: changelog
    columnTitle: Change Log
    timestamp: '2026-01-16T02:30:00.000Z'
    type: column
---
Add giscus discussion threads to kanban cards. Reuse existing blog Comments pattern with theme matching. Also fixed blog Comments to use ThemeContext.
