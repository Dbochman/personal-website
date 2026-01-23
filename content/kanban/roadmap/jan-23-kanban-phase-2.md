---
id: jan-23-kanban-phase-2
title: "Jan 23: Kanban Phase 2 Complete"
column: changelog
summary: Markdown is now the single source of truth for kanban boards
labels:
  - Infrastructure
  - Kanban
createdAt: "2026-01-23T16:00:00.000Z"
updatedAt: "2026-01-23T16:00:00.000Z"
history:
  - type: column
    timestamp: "2026-01-23T16:00:00.000Z"
    columnId: changelog
    columnTitle: Change Log
description: |
  ## Phase 2: Markdown-Only Saves
  
  Completed the migration to make markdown the single source of truth for kanban boards.
  
  ### Key Changes
  
  - **Eliminated JSON files**: Removed `roadmap-board.json`, `house-board.json`, and `roadmap-archive.json`
  - **Worker writes directly to markdown**: Save flow now commits `.md` files via GitHub Trees API
  - **Commit SHA conflict detection**: Replaced timestamp-based detection with atomic commit SHA comparison
  - **Precompiled JS fallback**: Board loads from worker API (primary) or generated JS (offline fallback)
  
  ### Bug Fixes
  
  - Fixed UTF-8 encoding corruption for non-ASCII characters (arrows, emojis)
  - Fixed duplicate history entries during drag operations (moved tracking from `handleDragOver` to `handleDragEnd`)
  - Fixed Cloudflare Workers 50 subrequest limit by using inline content in tree items
  - Fixed open redirect vulnerability in OAuth return_to validation
  
  ### Architecture
  
  ```
  Save: UI → Worker → GitHub Trees API → content/kanban/*.md
                  ↓
        repository_dispatch → precompile-content.yml
                  ↓
        src/generated/kanban/*.js
  
  Load: UI → Worker API (primary) → precompiled JS (fallback)
  ```
  
  Related PRs: #195, #198
---
