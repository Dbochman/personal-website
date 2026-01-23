---
id: unified-slo-tool
title: Unified SLO Calculator
column: changelog
summary: Merged SLO Calculator + Error Budget into 3-tab interface
labels:
  - "PR #145"
  - "PR #146"
  - Feature
  - SRE
checklist:
  - id: ust-1
    text: Create unified calculations.ts
    completed: true
  - id: ust-2
    text: Create SloConfiguration with period selector
    completed: true
  - id: ust-3
    text: Create ResponseTimeInputs with toggles
    completed: true
  - id: ust-4
    text: Create BudgetChart (compact/full modes)
    completed: true
  - id: ust-5
    text: Create AchievableTab
    completed: true
  - id: ust-6
    text: Create TargetTab
    completed: true
  - id: ust-7
    text: Create BurndownTab
    completed: true
  - id: ust-8
    text: Add to project registry
    completed: true
  - id: ust-9
    text: Remove old SLO Calculator and Error Budget Burndown
    completed: true
planFile: docs/plans/32-unified-slo-tool.md
createdAt: "2026-01-16T00:00:00.000Z"
updatedAt: "2026-01-16T23:00:00.000Z"
history:
  - type: column
    timestamp: "2026-01-16T20:45:00.000Z"
    columnId: ideas
    columnTitle: Ideas
  - type: column
    timestamp: "2026-01-16T21:00:00.000Z"
    columnId: in-progress
    columnTitle: In Progress
  - type: column
    timestamp: "2026-01-16T23:45:00.000Z"
    columnId: in-review
    columnTitle: In Review
  - type: column
    timestamp: "2026-01-16T23:00:00.000Z"
    columnId: changelog
    columnTitle: Change Log
---

Consolidated SLO Calculator and Error Budget Burndown into one project with three tabs:

- What can I achieve? (response time inputs directly visible)
- Can I meet this SLO? (collapsible config)
- Budget Burndown (full chart view)

Removed 2,700+ lines of redundant code. Collapsible configuration for target/burndown tabs, direct inputs for achievable tab.
