---
id: slo-burndown-integration
title: SLO Calculator Burndown Integration
column: changelog
labels:
  - "PR #142"
  - Enhancement
  - SRE
checklist:
  - id: sbi-1
    text: Export BurndownChart and calculations from error-budget-burndown
    completed: true
  - id: sbi-2
    text: Create SloBurndownPanel component
    completed: true
  - id: sbi-3
    text: Add generateSimulatedIncidents helper
    completed: true
  - id: sbi-4
    text: "Add 'SLO Burndown' tab to UptimeCalculator"
    completed: true
  - id: sbi-5
    text: Wire up inputs and add burn rate summary
    completed: true
  - id: sbi-6
    text: Mobile responsive check
    completed: true
planFile: docs/plans/27-slo-calculator-burndown-integration.md
createdAt: "2026-01-17"
updatedAt: "2026-01-16T20:15:00.000Z"
history:
  - type: column
    timestamp: "2026-01-17T14:10:00.000Z"
    columnId: todo
    columnTitle: To Do
  - type: column
    timestamp: "2026-01-16T18:48:53.156Z"
    columnId: in-progress
    columnTitle: In Progress
  - type: column
    timestamp: "2026-01-16T18:48:53.165Z"
    columnId: todo
    columnTitle: To Do
  - type: column
    timestamp: "2026-01-16T18:48:53.187Z"
    columnId: in-progress
    columnTitle: In Progress
  - type: column
    timestamp: "2026-01-16T19:30:00.000Z"
    columnId: in-review
    columnTitle: In Review
  - type: column
    timestamp: "2026-01-16T20:15:00.000Z"
    columnId: changelog
    columnTitle: Change Log
description: |
  Add 'SLO Burndown' tab to SLO Uptime Calculator. Reuse BurndownChart from Error Budget Burndown, generate simulated incidents from 'incidents per month' input.
---
