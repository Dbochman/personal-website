---
id: kanban-external-change-detection
title: Kanban External Change Detection
column: changelog
summary: Toast notification when board is updated externally
labels:
  - "PR #141"
  - UX
  - Kanban
checklist:
  - id: ecd-1
    text: Add checkForExternalChanges callback
    completed: true
  - id: ecd-2
    text: Add visibility change listener and 15s polling
    completed: true
  - id: ecd-3
    text: Show Sonner toast with reload action
    completed: true
  - id: ecd-4
    text: Use toast ID to prevent duplicates
    completed: true
  - id: ecd-5
    text: Clean up interval and listener on unmount
    completed: true
  - id: ecd-6
    text: Test external change detection
    completed: true
planFile: docs/plans/30-kanban-external-change-detection.md
createdAt: "2026-01-16T20:15:00.000Z"
updatedAt: "2026-01-16T18:50:00.000Z"
history:
  - type: column
    timestamp: "2026-01-16T20:15:00.000Z"
    columnId: ideas
    columnTitle: Ideas
  - type: column
    timestamp: "2026-01-16T18:45:00.000Z"
    columnId: in-progress
    columnTitle: In Progress
  - type: column
    timestamp: "2026-01-16T18:50:00.000Z"
    columnId: changelog
    columnTitle: Change Log
description: |
  Detect when board is updated externally (e.g., by Claude commits). Check on tab focus + every 15s while visible. Show toast with reload button to prevent save conflicts.
---
