---
id: react-hook-form-update
title: react-hook-form & @hookform/resolvers Update
column: changelog
summary: Dependency updates to unblock form validation library
labels:
  - "PR #165"
  - Infrastructure
checklist:
  - id: rhf-1
    text: Update react-hook-form to latest 7.x
    completed: true
  - id: rhf-2
    text: Run tests to verify form functionality
    completed: true
  - id: rhf-3
    text: "Merge @hookform/resolvers PR #165"
    completed: true
createdAt: "2026-01-19T00:00:00.000Z"
updatedAt: "2026-01-19T20:40:00.000Z"
history:
  - type: column
    timestamp: "2026-01-19T20:00:00.000Z"
    columnId: in-progress
    columnTitle: In Progress
  - type: column
    timestamp: "2026-01-19T20:40:00.000Z"
    columnId: changelog
    columnTitle: Change Log
---

Updated react-hook-form from 7.53.0 to 7.71.1 and @hookform/resolvers from 3.10.0 to 5.2.2. The resolvers package had a peer dependency requiring react-hook-form >=7.55.0.
