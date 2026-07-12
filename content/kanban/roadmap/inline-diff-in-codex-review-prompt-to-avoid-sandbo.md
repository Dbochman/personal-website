---
id: inline-diff-in-codex-review-prompt-to-avoid-sandbo
title: inline diff in codex review prompt to avoid sandbox errors
column: changelog
labels:
  - Bugfix
  - 'PR #271'
createdAt: '2026-03-28T16:26:04.000Z'
updatedAt: '2026-03-28T16:26:04.000Z'
history:
  - type: column
    timestamp: '2026-03-28T16:26:04.000Z'
    columnId: changelog
    columnTitle: Change Log
---
The Codex CLI read-only sandbox (bwrap) blocks file reads with
"RTM_NEWADDR: Operation not permitted". Fix by passing the diff
directly in the prompt instead of writing to pr_diff.txt and
asking Codex to read it.

Co-authored-by: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
