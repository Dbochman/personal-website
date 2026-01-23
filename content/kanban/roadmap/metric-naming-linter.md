---
id: metric-naming-linter
title: Metric Naming Linter
column: ideas
labels:
  - Small
  - SRE
  - Tool
checklist:
  - id: mnl-1
    text: Create metric name input (one per line, optional type hints)
    completed: false
  - id: mnl-2
    text: Build standard selector (Prometheus, OTel, custom)
    completed: false
  - id: mnl-3
    text: Implement lint rules with severity levels
    completed: false
  - id: mnl-4
    text: Show before/after diff for auto-fix suggestions
    completed: false
  - id: mnl-5
    text: Add bulk apply for auto-fixable rules
    completed: false
  - id: mnl-6
    text: Export results as text/JSON report
    completed: false
planFile: docs/plans/46-metric-naming-linter.md
createdAt: "2026-01-17T00:00:00.000Z"
description: |
  Lint metric names against Prometheus/OTel conventions. Severity-coded issues, auto-fix suggestions, bulk apply and export.
---
