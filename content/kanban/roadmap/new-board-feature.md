---
id: new-board-feature
title: New Board Creation
column: in-progress
labels:
  - Medium
  - Kanban
  - Feature
planFile: "~/.claude/plans/new-board-creation.md"
checklist:
  - id: nbf-1
    text: "Worker: Add GET /boards endpoint with dynamic discovery"
    completed: true
  - id: nbf-2
    text: "Worker: Add markdown fallback to GET /board/:id (before precompile)"
    completed: true
  - id: nbf-3
    text: "Worker: Add POST /boards endpoint with retry logic for 409"
    completed: true
  - id: nbf-4
    text: "Worker: Add column/size validation (SAFE_ID, max limits)"
    completed: true
  - id: nbf-5
    text: "Frontend: BoardSelector component with dropdown"
    completed: true
  - id: nbf-6
    text: "Frontend: CreateBoardModal with title/ID inputs"
    completed: true
  - id: nbf-7
    text: "Frontend: Remove static VALID_BOARDS allowlist"
    completed: true
  - id: nbf-8
    text: "Frontend: Handle precompiled:false response (optimistic UI)"
    completed: true
createdAt: "2026-01-22T00:00:00.000Z"
updatedAt: "2026-01-23T00:00:00.000Z"
history:
  - type: column
    timestamp: "2026-01-22T00:00:00.000Z"
    columnId: ideas
    columnTitle: Ideas
  - type: column
    timestamp: "2026-01-23T00:00:00.000Z"
    columnId: in-progress
    columnTitle: In Progress
---

Add ability to create new kanban boards from the UI. Board selector dropdown to switch between boards, plus 'New Board' button to create fresh boards.

**Architecture Decision**: Dynamic board discovery (Option A from plan). Worker scans `content/kanban/` to discover boards, no hardcoded allowlist.

**Codex Review Complete** (2026-01-23):
- Race condition handling with retry logic on 409
- Markdown fallback for new boards before precompile
- Column ID validation with `SAFE_ID`
- Optimistic UI with `precompiled: false` indicator

See `~/.claude/plans/new-board-creation.md` for full implementation plan.
