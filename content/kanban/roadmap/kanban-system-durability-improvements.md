---
id: kanban-system-durability-improvements
title: Kanban System Durability Improvements
column: in-review
summary: Address validation gaps and edge cases from architecture review (7.5/10 durability score)
labels:
  - Medium
  - Kanban
  - Technical Debt
checklist:
  - id: ksd-p0-1
    text: "P0: Move description into YAML frontmatter (avoid --- boundary issue)"
    completed: true
  - id: ksd-p0-2
    text: "P0: Add schema versioning with explicit detection (no default)"
    completed: true
  - id: ksd-p1-3
    text: "P1: Validate ALLOWED_ORIGINS parsing (reject empty/invalid)"
    completed: true
  - id: ksd-p1-4
    text: "P1: Extract hardcoded values to env vars (wrangler.toml)"
    completed: true
  - id: ksd-p1-5
    text: "P1: Make history schema forward-compatible (.passthrough)"
    completed: true
  - id: ksd-p2-6
    text: "P2: Add field validation limits (labels, summary, archiveReason)"
    completed: true
  - id: ksd-p2-7
    text: "P2: Add history compaction (max 100 entries)"
    completed: true
  - id: ksd-p2-8
    text: "P2: Track title changes in history"
    completed: true
  - id: ksd-p3-9
    text: "P3: Persist deletedCardIds with multi-tab sync"
    completed: true
  - id: ksd-p3-10
    text: "P3: Return warning (not failure) on dispatch error"
    completed: true
planFile: docs/plans/59-kanban-durability-improvements.md
createdAt: '2026-01-23T19:08:16.405Z'
history:
  - type: column
    timestamp: '2026-01-23T19:08:16.405Z'
    columnId: ideas
    columnTitle: Ideas
  - type: column
    timestamp: '2026-01-23T19:31:00.000Z'
    columnId: in-review
    columnTitle: In Review
description: |
  Address gaps identified in the Kanban System Health Report (2026-01-23).
  
  **Current Durability Score: 7.5/10**
  
  ### Critical Issues
  - YAML boundary vulnerability: if description starts with `---`, parsing breaks
  - No schema versioning: format changes would break all boards
  
  ### High Priority
  - Hardcoded repo/domain values break if repo moves
  - No validation on labels, summary, archiveReason fields
  - Title changes and checklist modifications not tracked in history
  
  See architecture review for full details.
---
