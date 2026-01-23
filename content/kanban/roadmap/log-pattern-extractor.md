---
id: log-pattern-extractor
title: Log Pattern Extractor
column: changelog
labels:
  - Deferred
  - Medium
  - SRE
  - Tool
planFile: docs/plans/45-log-pattern-extractor.md
createdAt: "2026-01-17T00:00:00.000Z"
archivedAt: "2026-01-19T00:00:00.000Z"
archiveReason: Overlaps significantly with regex-log-parser. Build that first, then evaluate if this adds enough value.
description: |
  Detect recurring log patterns from raw lines. Auto-group by template, field type inference, export to regex/grok/logstash format.
---
