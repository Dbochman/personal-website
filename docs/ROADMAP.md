# Roadmap

**Last Updated:** January 15, 2026

---

## Task Management

**The [Kanban Board](/kanban)** is now the single source of truth for project status, priorities, and completed work.

- **Ideas** - Concepts without detailed plans yet
- **To Do** - Planned tasks with implementation plans in `docs/plans/`
- **In Progress** - Currently being worked on
- **In Review** - PRs awaiting merge (with live CI status)
- **Change Log** - Recently completed work

---

## Current State

### Active Monitoring
- **Lighthouse CI**: Runs on every deployment
- **RUM (Real User Monitoring)**: web-vitals reporting to GA4
- **SEO checks**: Weekly (Mondays 9 AM UTC)
- **Analytics exports**: Weekly (Mondays 9:30 AM UTC)
- **Console error monitoring**: Every deployment

### Performance Baseline (January 2026)
| Page | LCP | CLS | Lighthouse |
|------|-----|-----|------------|
| Homepage | ~244ms | 0.00 | 92% |
| Blog | ~309ms | 0.00 | 89% |
| Projects | ~235ms | 0.00 | - |
| Analytics | ~454ms | 0.10 | - |

- Accessibility: 100/100
- Blog LCP improved 45% via MDX precompilation (5.6s → 3.1s)

---

## Implementation Plans

Detailed plans live in `docs/plans/`. Each plan includes scope, approach, and checklist.

| # | Plan | Status |
|---|------|--------|
| 08 | Visual regression testing | To Do |
| 10 | Preview deployments | To Do |
| 14 | Career timeline | To Do |
| 22 | Tailwind CSS v4 upgrade | To Do |

See the Kanban board for current priorities and progress.

---

## Documentation Map

```
docs/
├── ROADMAP.md                    [📋 This file - overview]
├── OPERATIONS_MANUAL.md          [🚨 How to run everything]
├── BLOG_STYLE_GUIDE.md           [📝 Writing conventions]
├── CMS_SETUP.md                  [📝 Decap CMS guide]
├── BUNDLE_ANALYSIS_2026-01.md    [📊 Bundle size reference]
├── PERFORMANCE_EVALUATION_GUIDE.md [📊 How to evaluate performance]
├── SEO_MEASUREMENT.md            [🔍 SEO tracking strategy]
├── AUTOMATED_SEO_CHECKS.md       [🔍 Automated validation]
├── ANALYTICS_INTEGRATIONS.md     [📈 GA4 & Search Console]
├── CONSOLE_ERROR_MONITORING.md   [🐛 Error detection]
├── plans/                        [📋 Implementation plans]
│   ├── 08-visual-regression-testing.md
│   ├── 10-preview-deployments.md
│   ├── 14-career-timeline.md
│   ├── 16-mcp-interactive-testing.md
│   ├── 22-tailwind-v4-upgrade.md
│   └── ...
├── decisions/                    [🏛️ Architecture Decision Records]
│   ├── README.md                 [Index and template]
│   ├── 001-mdx-precompilation.md
│   ├── 002-projects-registry-pattern.md
│   └── 003-planning-docs-consolidation.md
├── completed-projects/           [✅ Archived plans]
├── performance-reports/          [📊 Historical reports]
└── metrics/                      [📈 GA4 & Search Console data]
```

**Note:** Lighthouse metrics are on the `lighthouse-metrics` branch to avoid git conflicts.

---

## Maintenance

### Weekly (Mondays)
- 9:00 AM UTC: Automated SEO checks
- 9:30 AM UTC: GA4 data export
- Review GitHub issues for automated alerts

### Monthly (First Monday)
- Performance deep dive using `PERFORMANCE_EVALUATION_GUIDE.md`
- Create report in `performance-reports/`
- Review trends, plan improvements

### When Starting New Work
1. Check if a plan document exists in `docs/plans/`
2. Create one for complex work (architectural decisions or multi-file changes)
3. Use feature branches, PRs for all changes
4. Move Kanban card through columns as work progresses

---

## Decision Framework

| Impact | Effort | Action |
|--------|--------|--------|
| High | Low | Do first |
| High | High | Plan carefully, prioritize |
| Low | Low | Quick wins between projects |
| Low | High | Reconsider or defer |

---

**Maintained By:** Repository Owner
**Next Review:** February 2026
