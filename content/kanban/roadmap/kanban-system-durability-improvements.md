---
id: kanban-system-durability-improvements
title: Kanban System Durability Improvements
column: ideas
summary: Address validation gaps and edge cases from architecture review (7.5/10 durability score)
labels:
  - Medium
  - Kanban
  - Technical Debt
checklist:
  - id: ksd-1
    text: "Fix YAML boundary vulnerability (descriptions containing ---)"
    completed: false
  - id: ksd-2
    text: "Add version: 1 field to _board.md schema for migration path"
    completed: false
  - id: ksd-3
    text: "Extract REPO_OWNER, REPO_NAME, ALLOWED_ORIGINS to env vars"
    completed: false
  - id: ksd-4
    text: "Add label validation (max 50 chars, max 20 labels, dedup)"
    completed: false
  - id: ksd-5
    text: "Add length limits for summary (200) and archiveReason (500)"
    completed: false
  - id: ksd-6
    text: "Track title changes in card history"
    completed: false
  - id: ksd-7
    text: "Persist deletedCardIds in localStorage for crash recovery"
    completed: false
  - id: ksd-8
    text: "Add checklist change tracking to history"
    completed: false
createdAt: '2026-01-23T19:08:16.405Z'
history:
  - type: column
    timestamp: '2026-01-23T19:08:16.405Z'
    columnId: ideas
    columnTitle: Ideas
---

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
