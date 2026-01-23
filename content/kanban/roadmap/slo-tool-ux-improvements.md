---
id: slo-tool-ux-improvements
title: SLO Tool UX Improvements
column: changelog
summary: Better defaults, collapsible sections, burn rate simulator
labels:
  - "PR #151"
  - Enhancement
  - SRE
createdAt: "2026-01-17T00:00:00.000Z"
updatedAt: "2026-01-17T01:37:34.000Z"
history:
  - type: column
    timestamp: "2026-01-17T01:37:34.000Z"
    columnId: changelog
    columnTitle: Change Log
description: |
  Polished the SLO Calculator with better defaults and new burn rate simulator.
  
  Changes:
  - Realistic default response times (26m MTTR)
  - Collapsible Response Times section (shows Alert latency by default)
  - Removed redundant burndown charts from Achievable/Target tabs
  - Added interactive Burn Rate Simulator slider (0.1x-5x)
  - Explanatory text for the 'ideal' line concept
  - Fixed slider resync when inputs change (Codex finding)
  - Fixed edge case when zero incidents (Codex finding)
---
