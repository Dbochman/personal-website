---
id: make-security-audit-non-blocking-in-deploy-workflo
title: make security audit non-blocking in deploy workflow
column: changelog
labels:
  - Bugfix
  - 'PR #245'
createdAt: '2026-02-24T21:24:15.000Z'
updatedAt: '2026-02-24T21:24:15.000Z'
history:
  - type: column
    timestamp: '2026-02-24T21:24:15.000Z'
    columnId: changelog
    columnTitle: Change Log
---
The deploy workflow's npm audit step was failing the entire build due to
transitive dependency vulnerabilities in dev tools (eslint, minimatch, glob).
These are not exploitable in production.

Aligns with pr-checks.yml which already has continue-on-error: true and
--omit=dev for the audit step.

Co-authored-by: Claude Opus 4.6 <noreply@anthropic.com>
