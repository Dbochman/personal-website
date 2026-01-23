---
id: recording-rules-generator
title: Prometheus Recording Rules Generator
column: ideas
labels:
  - Medium
  - SRE
  - Tool
checklist:
  - id: rrg-1
    text: Create PromQL input with syntax highlighting
    completed: false
  - id: rrg-2
    text: Implement query analysis (rate, aggregation, grouping hints)
    completed: false
  - id: rrg-3
    text: "Build naming config (level:metric:operations format)"
    completed: false
  - id: rrg-4
    text: Add evaluation interval and extra labels config
    completed: false
  - id: rrg-5
    text: Export YAML for rule groups
    completed: false
  - id: rrg-6
    text: Add presets for HTTP and Kubernetes rules
    completed: false
  - id: rrg-7
    text: Add bulk entry mode for multiple queries
    completed: false
planFile: docs/plans/42-recording-rules-generator.md
createdAt: "2026-01-17T00:00:00.000Z"
---

Generate recording rules from PromQL queries. Naming conventions, analysis hints, YAML export with presets for HTTP/K8s rules.
