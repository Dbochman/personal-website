---
id: cli-tool-playground
title: CLI Tool Playground
column: changelog
summary: In-browser kubectl/jq/grep/sed/awk with Learn and Play modes
labels:
  - "PR #156"
  - Feature
  - Learning
  - Tool
checklist:
  - id: ctp-1
    text: Create tool selector (kubectl, jq, grep, sed, awk)
    completed: true
  - id: ctp-2
    text: Build input editor with sample data presets
    completed: true
  - id: ctp-3
    text: Build command editor with syntax highlighting
    completed: true
  - id: ctp-4
    text: Implement pure JS execution engines
    completed: true
  - id: ctp-5
    text: Create output panel with copy and clear
    completed: true
  - id: ctp-6
    text: Add explanation panel for command breakdown
    completed: true
  - id: ctp-7
    text: Implement shareable URL state (input + command)
    completed: true
  - id: ctp-8
    text: Add kubectl simulator with 5 triage scenarios
    completed: true
  - id: ctp-9
    text: Add --help for all tools
    completed: true
  - id: ctp-10
    text: Security fixes (XSS, URL validation, race conditions)
    completed: true
planFile: docs/plans/47-cli-tool-playground.md
createdAt: "2026-01-17T00:00:00.000Z"
updatedAt: "2026-01-18T01:15:00.000Z"
history:
  - type: column
    timestamp: "2026-01-17T21:30:00.000Z"
    columnId: in-progress
    columnTitle: In Progress
  - type: column
    timestamp: "2026-01-18T01:15:00.000Z"
    columnId: changelog
    columnTitle: Change Log
description: |
  Interactive in-browser demos for CLI tools. Pure JS implementations (no WASM).
  
  Features:
  - Tool selector: kubectl, jq, grep, sed, awk
  - Learn mode with goals, hints, and command chips
  - Playground mode for freeform experimentation
  - Command explainer with flag breakdowns and 'Try next' suggestions
  - Shareable URL state (tool, mode, input, command)
  - 5 presets per tool covering common use cases
  
  kubectl simulator:
  - 5 triage scenarios (CrashLoopBackOff, ImagePullBackOff, Service Mismatch, Rollout Regression, Node Pressure)
  - Full K8s resource schema (pods, deployments, services, nodes, events)
  - Supports: get, describe, logs, rollout, top, events
  - Session state mutation for rollback commands
  
  Security fixes:
  - Replaced Function() with safe regex parser (XSS)
  - URL param validation with fallbacks
  - Race condition guards for async results
---
