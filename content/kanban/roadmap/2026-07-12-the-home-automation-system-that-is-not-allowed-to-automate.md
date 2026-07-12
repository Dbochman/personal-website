---
id: 2026-07-12-the-home-automation-system-that-is-not-allowed-to-automate
title: 'Blog: The Home Event System That Is Not Allowed to Automate'
column: changelog
labels:
  - Blog
createdAt: '2026-07-12T16:31:31.000Z'
updatedAt: '2026-07-12T16:31:31.000Z'
history:
  - type: column
    timestamp: '2026-07-12T16:31:31.000Z'
    columnId: changelog
    columnTitle: Change Log
---
We built a durable local event bus for doorbell activity and presence, with read-only lock observations alongside a separate camera path. Its correlator can record and explain decisions, but it cannot notify or operate a device.
