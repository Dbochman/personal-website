---
id: visual-regression
title: Visual Regression Testing
column: todo
labels:
  - Medium
  - Testing
checklist:
  - id: vr-1
    text: Create visual.spec.ts with full-page screenshots
    completed: false
  - id: vr-2
    text: Update playwright.config.ts with snapshot settings
    completed: false
  - id: vr-3
    text: Add CI integration with artifact upload on failure
    completed: false
  - id: vr-4
    text: Set up baseline management (Git LFS or separate branch)
    completed: false
  - id: vr-5
    text: Add flakiness handling (mask dynamic content, disable animations)
    completed: false
planFile: docs/plans/08-visual-regression-testing.md
createdAt: "2026-01-13"
---

Playwright screenshot tests comparing against baselines. Catches unintended UI changes in CI.
