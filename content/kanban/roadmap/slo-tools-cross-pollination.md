---
id: slo-tools-cross-pollination
title: SLO Tools Cross-Pollination
column: changelog
labels:
  - "PR #143"
  - "PR #144"
  - Enhancement
  - SRE
checklist:
  - id: slo-xp-1
    text: Create shared sloPresets.ts with target, label, budget description
    completed: true
  - id: slo-xp-2
    text: Update Error Budget Burndown to use shared presets
    completed: true
  - id: slo-xp-3
    text: Update Uptime Calculator to use shared presets
    completed: true
  - id: slo-xp-4
    text: "Add 'See impact on Error Budget' link from Uptime Calculator insights"
    completed: true
  - id: slo-xp-5
    text: "Add 'Improve response times' link from Error Budget Burndown"
    completed: true
  - id: slo-xp-6
    text: Pass context via URL params for pre-populated views
    completed: true
planFile: docs/plans/31-slo-tools-cross-pollination.md
createdAt: "2026-01-16"
updatedAt: "2026-01-16T23:30:00.000Z"
history:
  - type: column
    timestamp: "2026-01-16T19:45:00.000Z"
    columnId: ideas
    columnTitle: Ideas
  - type: column
    timestamp: "2026-01-16T22:45:00.000Z"
    columnId: in-progress
    columnTitle: In Progress
  - type: column
    timestamp: "2026-01-16T22:55:00.000Z"
    columnId: in-review
    columnTitle: In Review
  - type: column
    timestamp: "2026-01-16T23:30:00.000Z"
    columnId: changelog
    columnTitle: Change Log
description: |
  Connected SLO tools with shared presets and cross-linking. Unified sloPresets.ts, slider magnetism, flexible input ranges (0-99.999%), and URL param sync for SLO + incidents.
---
