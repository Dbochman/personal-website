# Architecture Decision Records

Lightweight records of significant technical decisions. Helps future-us understand "why this way."

## Format

Each ADR follows this structure:

```markdown
# ADR-NNN: Title

**Date:** YYYY-MM-DD
**Status:** Accepted | Superseded | Deprecated

## Context
What situation prompted this decision?

## Decision
What did we decide?

## Consequences
What are the tradeoffs? What does this enable or prevent?
```

## Index

| ADR | Title | Date | Status |
|-----|-------|------|--------|
| [001](./001-mdx-precompilation.md) | MDX Precompilation | 2026-01-11 | Accepted |
| [002](./002-projects-registry-pattern.md) | Projects Registry Pattern | 2026-01-12 | Accepted |
| [003](./003-planning-docs-consolidation.md) | Planning Docs Consolidation | 2026-01-12 | Accepted |

## When to Write an ADR

- Choosing between multiple valid approaches
- Architectural patterns that affect multiple files
- Technology choices (libraries, frameworks)
- Decisions that future-you might question

Keep them brief. The goal is capturing "why" not documenting "how."
