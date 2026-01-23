---
id: analytics-event-tracking
title: Analytics Event Tracking
column: changelog
labels:
  - Small
  - Analytics
checklist:
  - id: aet-1
    text: Define event schema (tool_interaction, action, tool_name)
    completed: true
  - id: aet-2
    text: Add events to SLO Calculator (tab switch, calculate, copy)
    completed: true
  - id: aet-3
    text: Add events to CLI Playground (run command, preset select)
    completed: true
  - id: aet-4
    text: Add events to On-Call Coverage (timezone add, model switch)
    completed: true
  - id: aet-5
    text: Update analytics dashboard to show tool engagement
    completed: true
createdAt: "2026-01-19T00:00:00.000Z"
updatedAt: "2026-01-23T00:00:00.000Z"
history:
  - type: column
    timestamp: "2026-01-19T00:00:00.000Z"
    columnId: ideas
    columnTitle: Ideas
  - type: column
    timestamp: "2026-01-21T00:00:00.000Z"
    columnId: in-progress
    columnTitle: In Progress
  - type: column
    timestamp: "2026-01-23T00:00:00.000Z"
    columnId: changelog
    columnTitle: Change Log
---

Add GA4 events for interactive tool usage. Track calculator submissions, tab switches, copy-to-clipboard actions.

Implemented in `src/lib/trackToolEvent.ts` with events firing in:
- SLO Calculator: tab_switch, calculate, period_change
- CLI Playground: command_run, tool_select, mode_switch, preset_select, share_copy
- On-Call Coverage: model_select
