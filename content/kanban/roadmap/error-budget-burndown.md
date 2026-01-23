---
id: error-budget-burndown
title: Error Budget Burndown
column: changelog
labels:
  - "PR #136"
  - SRE
  - Calculator
checklist:
  - id: ebb-1
    text: Create ErrorBudgetBurndown component
    completed: true
  - id: ebb-2
    text: Add to project registry with route
    completed: true
  - id: ebb-3
    text: Build SLO configuration inputs
    completed: true
  - id: ebb-4
    text: Build incident input form
    completed: true
  - id: ebb-5
    text: Implement budget calculations
    completed: true
  - id: ebb-6
    text: Create burndown chart with Recharts
    completed: true
  - id: ebb-7
    text: Add summary cards with key metrics
    completed: true
  - id: ebb-8
    text: Mobile responsive layout
    completed: true
planFile: docs/plans/26-error-budget-burndown.md
createdAt: "2026-01-16"
updatedAt: "2026-01-17T14:00:00.000Z"
history:
  - type: column
    timestamp: "2026-01-16T04:30:00.000Z"
    columnId: todo
    columnTitle: To Do
  - type: column
    timestamp: "2026-01-16T05:00:00.000Z"
    columnId: in-progress
    columnTitle: In Progress
  - type: column
    timestamp: "2026-01-17T14:00:00.000Z"
    columnId: changelog
    columnTitle: Change Log
description: |
  Visualize how quickly you're consuming error budget. Input SLO target + incident history to see burn rate and projected exhaustion date.
---
