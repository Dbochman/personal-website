---
id: eliminate-ai-slop-patterns-across-24-posts
title: eliminate AI slop patterns across 24 posts
column: changelog
labels:
  - 'PR #272'
createdAt: '2026-03-28T18:25:48.000Z'
updatedAt: '2026-03-28T18:25:48.000Z'
history:
  - type: column
    timestamp: '2026-03-28T18:25:48.000Z'
    columnId: changelog
    columnTitle: Change Log
---
* blog: eliminate AI slop patterns across 24 posts

Run slop-guard (https://github.com/eric-tramel/slop-guard) across all
blog posts and rewrite flagged patterns. All 30 posts now score >= 81/100
(up from a low of 8/100).

Changes across all posts:
- Replaced slop words (reflecting, narrative, leverage, significantly,
  surprisingly, navigate, collaborative, comprehensive, notable)
- Rewrote "X, not Y" contrast pairs as direct claims
- Removed "This is not X. It is Y" setup-resolution patterns
- Expanded or cut pithy one-liner fragments
- Converted bold-bullet listicle blocks to prose paragraphs
- Reduced excessive bullet runs and triadic list cadences
- Varied repeated phrases
- Cut slop phrases ("the key insight", "deliberate choice", "feel free to")

All frontmatter, code blocks, React components, internal links, and
ASCII diagrams preserved unchanged.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>

* blog: fix writing quality violations from proposed slop-guard rules

Address violations from proposed writing quality rules (eric-tramel/slop-guard#9):
- "tip of the iceberg" cliche → "symptoms of deeper structural issues"
- "deep dive" cliche → "full technical breakdown"
- "best practices" cliche → "web standards"
- "very" qualifier → cut
- "wonderful" ecstatic adjective → "disarming"
- "naturally tried to optimize" (over-explanation + pretentious) → "tried to shrink"

Intentionally kept:
- "obviously" in echonest-sync (intentional humor about airhorns)
- "## The Journey" headings (inside code blocks, referencing template name)
- "subsequent" in theme-persistence (technical term: "subsequent navigation")
- "rather" in "rather than" comparisons (conjunction, not hedging qualifier)

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>

---------

Co-authored-by: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
