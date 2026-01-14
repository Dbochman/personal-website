# Roadmap

**Last Updated:** January 13, 2026

Single source of truth for project status, priorities, and completed work.

---

## Current State

### Active Monitoring
- **Lighthouse CI**: Runs on every deployment
- **SEO checks**: Weekly (Mondays 9 AM UTC)
- **Analytics exports**: Weekly (Mondays 9:30 AM UTC)
- **Console error monitoring**: Every deployment

### Performance Baseline
- Homepage: 92% Lighthouse (local)
- Blog: 89% Lighthouse (local)
- Blog LCP: 3.1s (45% improvement from MDX precompilation)
- Accessibility: 100/100

---

## What's Next

### Planned (Have Detailed Plans)

1. **Tailwind CSS v4 Upgrade** - `docs/TAILWIND_V4_UPGRADE_PLAN.md`
   - Priority: Medium | Effort: Medium
   - Benefits: 3.5-5x faster builds, modern CSS features
   - Risk: Medium - requires CSS restructuring

2. **Test & CI/CD Improvements** - `docs/TEST_AND_CICD_IMPROVEMENT_PLAN.md`
   - Priority: Medium | Effort: Medium
   - Fix fragile tests, add missing coverage, optimize CI
   - Expected: ~40% faster CI, fewer false failures

### Nice-to-Have (Ideas)

**Analytics & Monitoring:**
- [x] Analytics dashboard at `/analytics` (GA4, Search Console, Lighthouse charts) ✅ PR #96
- [ ] Visual regression testing (Playwright screenshots)
- [ ] Real User Monitoring (RUM)
- [ ] Performance budget enforcement in CI

**Accessibility:**
- [ ] Skip navigation links
- [ ] ARIA live regions for dynamic content

**Content Features:**
- [ ] Contact form with validation
- [ ] Skills visualization
- [ ] Career timeline

**Infrastructure:**
- [ ] Preview deployments for PRs
- [ ] Deployment notifications
- [ ] Renovate for dependency automation

**Learning/Experimentation:**
- [ ] View Transitions API
- [ ] Container queries, :has()
- [ ] Framer Motion animations

---

## Recently Completed

### January 2026

**January 13:**
- ✅ Analytics Dashboard at `/analytics` (PR #96) - GA4, Search Console, Lighthouse visualizations
- ✅ Traffic sources tracking added to GA4 data collection
- ✅ Nav cleanup - removed Experience, Goals, Contact links
- ✅ Footer standardization - reusable Footer component across main pages
- ✅ On-Call Coverage Model Explorer (PR #94)

**January 12:**
- ✅ Projects page with registry pattern (PR #88)
- ✅ SLO Uptime Calculator - interactive SLA planning tool (PR #89)
- ✅ Status Page Update Generator - incident communication templates (PR #91)
- ✅ Blog author field with filter support (PR #92)
- ✅ Projects card layout simplification
- ✅ Incident input mobile layout fix (PR #90)

**January 11:**
- ✅ MDX Precompilation (PR #84) - Blog LCP 5.6s → 3.1s (45% faster)
- ✅ Bundle optimization - removed unused blog-loader.ts (55KB)
- ✅ Sentry loading via requestIdleCallback
- ✅ GA4 event tracking for card interactions (PR #82)

**January 8:**
- ✅ Blog Phase 4 & 5 complete - comments, syntax highlighting, RSS, structured data
- ✅ Tailwind v4 upgrade plan created

**January 6-7:**
- ✅ Node.js v24 upgrade (v22 → v24.12.0)
- ✅ Performance optimization (55 → 98 Lighthouse)
- ✅ System font stack (eliminated 1.6MB web fonts)
- ✅ Bundle analysis and Radix cleanup (22 unused packages removed)

---

## Documentation Map

```
docs/
├── ROADMAP.md                    [📋 This file - project status]
├── OPERATIONS_MANUAL.md          [🚨 How to run everything]
├── TAILWIND_V4_UPGRADE_PLAN.md   [📋 Planned]
├── TEST_AND_CICD_IMPROVEMENT_PLAN.md [📋 Planned]
├── BLOG_STYLE_GUIDE.md           [📝 Writing conventions]
├── CMS_SETUP.md                  [📝 Decap CMS guide]
├── BUNDLE_ANALYSIS_2026-01.md    [📊 Bundle size reference]
├── PERFORMANCE_EVALUATION_GUIDE.md [📊 How to evaluate performance]
├── SEO_MEASUREMENT.md            [🔍 SEO tracking strategy]
├── AUTOMATED_SEO_CHECKS.md       [🔍 Automated validation]
├── ANALYTICS_INTEGRATIONS.md     [📈 GA4 & Search Console]
├── CONSOLE_ERROR_MONITORING.md   [🐛 Error detection]
├── decisions/                    [🏛️ Architecture Decision Records]
│   ├── README.md                 [Index and template]
│   ├── 001-mdx-precompilation.md
│   ├── 002-projects-registry-pattern.md
│   └── 003-planning-docs-consolidation.md
├── completed-projects/           [✅ Archived plans]
│   ├── BLOG_FEATURE_PLAN.md
│   ├── NODE_V24_UPGRADE_PLAN.md
│   └── NODE_V24_UPGRADE_CHECKLIST.md
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
1. Check if a plan document exists
2. Create one for complex work (3+ days or architectural decisions)
3. Use feature branches, PRs for all changes
4. Update this roadmap when complete

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
