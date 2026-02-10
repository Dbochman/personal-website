---
id: rework-tablist-mobile-selector
title: Rework TabList Mobile Selector
column: ideas
summary: Replace horizontal-scroll/flex-wrap TabList with Select dropdown on mobile (<640px)
labels:
  - Enhancement
  - UX
planFile: docs/plans/62-rework-tablist-mobile-selector.md
createdAt: '2026-02-10T01:47:50.564Z'
history:
  - type: column
    timestamp: '2026-02-10T01:47:50.564Z'
    columnId: ideas
    columnTitle: Ideas
description: |
  Create a reusable ResponsiveTabsList component that renders a native Select dropdown
  on mobile and standard TabsList triggers on desktop. Migrate AnalyticsDashboard (6 tabs),
  IncidentCommandDiagrams (3 long-title tabs), and SloTool (3 tabs with dual labels).
  Skip K8sRightsizer (only 2 short tabs). Uses sr-only (not display:none) for the desktop
  TabsList on mobile to preserve aria-labelledby accessibility.
---

