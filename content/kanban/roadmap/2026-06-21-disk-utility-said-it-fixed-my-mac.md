---
id: 2026-06-21-disk-utility-said-it-fixed-my-mac
title: 'Blog: Disk Utility said it fixed my Mac. fsck_apfs disagreed.'
column: changelog
labels:
  - Blog
createdAt: '2026-06-22T00:04:31.000Z'
updatedAt: '2026-06-22T00:04:31.000Z'
history:
  - type: column
    timestamp: '2026-06-22T00:04:31.000Z'
    columnId: changelog
    columnTitle: Change Log
---
macOS Tahoe's Disk Utility reported a successful APFS repair, but the same four inode warnings survived Recovery. The difference was hiding in fsck_apfs flags and one misleading exit code.
