---
id: new-board-feature
title: New Board Creation
column: ideas
labels:
  - Small
  - Kanban
  - Feature
checklist:
  - id: nbf-1
    text: Add board selector dropdown showing all discovered boards
    completed: false
  - id: nbf-2
    text: Design 'New Board' modal (name, initial columns)
    completed: false
  - id: nbf-3
    text: Implement board creation via save workflow
    completed: false
  - id: nbf-4
    text: Add board to navigation after creation
    completed: false
createdAt: "2026-01-22T00:00:00.000Z"
---

Add ability to create new kanban boards from the UI. Board selector dropdown to switch between boards, plus 'New Board' button to create fresh boards.

Options:
- Dev-only: Create _board.md file, requires rebuild
- Runtime: Create via GitHub API (like current save workflow)
- Full Phase 2: Markdown-only saves with board creation
