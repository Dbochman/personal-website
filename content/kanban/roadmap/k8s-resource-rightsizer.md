---
id: k8s-resource-rightsizer
title: K8s Resource Right-Sizer
column: ideas
labels:
  - Medium
  - SRE
  - Calculator
checklist:
  - id: krr-1
    text: Build inputs for current requests/limits and replicas
    completed: false
  - id: krr-2
    text: Build utilization percentile inputs (P50/P95/P99/Max)
    completed: false
  - id: krr-3
    text: "Create goal slider (efficiency ↔ safety)"
    completed: false
  - id: krr-4
    text: Implement recommendation engine with reasoning
    completed: false
  - id: krr-5
    text: Add savings/impact calculation and risk indicators
    completed: false
  - id: krr-6
    text: Create YAML snippet output with copy
    completed: false
  - id: krr-7
    text: Add preset profiles (web server, worker, db)
    completed: false
planFile: docs/plans/44-k8s-resource-rightsizer.md
createdAt: "2026-01-17T00:00:00.000Z"
---

Recommend CPU/memory requests/limits from utilization percentiles. Goal slider for efficiency vs safety, YAML snippet output.
