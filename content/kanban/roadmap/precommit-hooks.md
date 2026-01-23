---
id: precommit-hooks
title: Pre-commit Hooks (Husky + lint-staged)
column: changelog
labels:
  - "PR #137"
  - Infrastructure
  - DX
checklist:
  - id: pch-1
    text: Install husky and lint-staged
    completed: true
  - id: pch-2
    text: Initialize husky and create pre-commit hook
    completed: true
  - id: pch-3
    text: Add lint-staged config to package.json
    completed: true
  - id: pch-4
    text: Test with intentional lint error
    completed: true
  - id: pch-5
    text: Verify normal commits work
    completed: true
createdAt: "2026-01-16T19:30:00.000Z"
updatedAt: "2026-01-16T20:00:00.000Z"
history:
  - type: column
    timestamp: "2026-01-16T19:30:00.000Z"
    columnId: ideas
    columnTitle: Ideas
  - type: column
    timestamp: "2026-01-16T19:45:00.000Z"
    columnId: in-progress
    columnTitle: In Progress
  - type: column
    timestamp: "2026-01-16T19:55:00.000Z"
    columnId: in-review
    columnTitle: In Review
  - type: column
    timestamp: "2026-01-16T20:00:00.000Z"
    columnId: changelog
    columnTitle: Change Log
description: |
  Add Husky + lint-staged for pre-commit hooks. Runs ESLint with auto-fix on staged TS/JS files before every commit.
---
