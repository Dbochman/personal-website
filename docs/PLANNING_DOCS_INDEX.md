# Planning Documents Index

**Last Updated:** January 6, 2026

This document provides an overview of all planning, monitoring, and documentation files in the repository.

---

## 📋 Active Planning Documents

### Blog Feature Development
**Status:** 🚧 PLANNED (January 7, 2026)

- **`docs/BLOG_FEATURE_PLAN.md`** - Comprehensive plan for MDX-based blog implementation
  - Status: Planning complete, ready for Phase 1
  - Approach: MDX with file-system routing
  - Timeline: 5 phases (5 weeks estimated)
  - Features: Search, tags, comments, RSS, SEO optimization
  - Branch strategy: Feature branches for each phase with individual commits per feature
  - See document for detailed implementation roadmap

### Node.js v24 Upgrade
**Status:** ✅ COMPLETED (January 6, 2026)

- **`docs/completed-projects/NODE_V24_UPGRADE_PLAN.md`** - Comprehensive upgrade plan with phases, timeline, and lessons learned
  - Status: Completed successfully
  - Duration: ~45 minutes (Phases 3-7)
  - Version achieved: Node v24.12.0, npm v11.6.2

- **`docs/completed-projects/NODE_V24_UPGRADE_CHECKLIST.md`** - Execution checklist with all tasks marked complete
  - Status: All items checked off
  - Issues documented and resolved
  - Rollback plan available (not needed)

---

## 📊 Performance & Monitoring Guides

### Performance Evaluation
- **`docs/PERFORMANCE_EVALUATION_GUIDE.md`** - Systematic approach for ongoing performance optimization
  - Status: ✅ Active - Use for monthly reviews
  - Purpose: Step-by-step evaluation process
  - Frequency: Weekly quick checks, monthly deep dives

### Performance Reports
- **`docs/performance-reports/2026-01-baseline.md`** - Initial baseline assessment (January 6, 2026)
  - Status: ✅ Historical record
  - Baseline scores: Performance 55, LCP 5120ms
  - Identified critical optimization opportunities

- **`docs/performance-reports/2026-01-post-optimization.md`** - Success report documenting improvements
  - Status: ✅ Completed
  - Final scores: Performance 98 (local), LCP 1839ms
  - Documents 3 optimization phases:
    1. Lazy-load web-vitals library
    2. Async font loading (attempted)
    3. System font stack (major win)

### Lighthouse Metrics Storage
- **`lighthouse-metrics` branch** - Dedicated branch for automated Lighthouse metrics
  - **Location:** `docs/metrics/lighthouse-history.json` and `docs/metrics/latest.json`
  - **Access:** `git checkout lighthouse-metrics` or view on [GitHub](https://github.com/Dbochman/personal-website/tree/lighthouse-metrics/docs/metrics)
  - **Why separate:** Eliminates git conflicts when automated workflow commits updates
  - **Updated:** After every deployment via Lighthouse CI workflow

---

## 🔍 SEO & Analytics

### SEO Monitoring
- **`docs/SEO_MEASUREMENT.md`** - SEO tracking strategy and measurement framework
  - Status: ✅ Active
  - Tracks: Rankings, organic traffic, keyword performance

- **`docs/AUTOMATED_SEO_CHECKS.md`** - Automated SEO validation workflow
  - Status: ✅ Active
  - Runs: Weekly on Mondays
  - Checks: Meta tags, structured data, sitemap

### Analytics Integration
- **`docs/ANALYTICS_INTEGRATIONS.md`** - Google Analytics 4 and Search Console setup
  - Status: ✅ Active
  - Integrations: GA4, Google Search Console
  - Export workflows: Weekly automated exports

---

## 🐛 Error Monitoring

- **`docs/CONSOLE_ERROR_MONITORING.md`** - JavaScript error detection system
  - Status: ✅ Active
  - Runs: On every deployment
  - Alerts: Creates GitHub issues for console errors

---

## 📁 Directory Structure

```
/
├── README.md                          [📖 Project overview]
├── CLAUDE.md                          [🤖 Claude Code config]
└── docs/
    ├── PLANNING_DOCS_INDEX.md         [📋 This file]
    ├── BLOG_FEATURE_PLAN.md           [🚧 Active - Blog implementation plan]
    ├── BUNDLE_ANALYSIS_2026-01.md     [📊 Active - Bundle size analysis]
    ├── FUTURE_WORK_ROADMAP.md         [🔮 Active]
    ├── PERFORMANCE_EVALUATION_GUIDE.md [📊 Active]
    ├── SEO_MEASUREMENT.md             [🔍 Active]
    ├── AUTOMATED_SEO_CHECKS.md        [🔍 Active]
    ├── ANALYTICS_INTEGRATIONS.md      [📈 Active]
    ├── CONSOLE_ERROR_MONITORING.md    [🐛 Active]
    ├── completed-projects/
    │   ├── NODE_V24_UPGRADE_PLAN.md   [✅ Completed]
    │   └── NODE_V24_UPGRADE_CHECKLIST.md [✅ Completed]
    ├── performance-reports/
    │   ├── 2026-01-baseline.md        [📊 Historical]
    │   └── 2026-01-post-optimization.md [📊 Completed]
    └── metrics/                       [⚠️  Lighthouse files moved to lighthouse-metrics branch]
        ├── ga4-history.json           [📈 GA4 data]
        └── search-console-history.json [🔍 Search Console data]

lighthouse-metrics branch (separate):
└── docs/
    └── metrics/
        ├── lighthouse-history.json    [🔄 Auto-updated]
        └── latest.json                [🔄 Auto-updated]
```

---

## 🎯 Quick Reference Guide

### When to Use Each Document

**Planning a Major Feature:**
- Start with plan document (e.g., `BLOG_FEATURE_PLAN.md`)
- Follow branch strategy and commit guidelines
- Use quality gates before merging each phase

**Planning a Major Upgrade:**
- Start with plan document (e.g., `NODE_V24_UPGRADE_PLAN.md`)
- Use checklist for execution (e.g., `NODE_V24_UPGRADE_CHECKLIST.md`)

**Monthly Performance Review:**
1. Use `PERFORMANCE_EVALUATION_GUIDE.md`
2. Create new report in `performance-reports/YYYY-MM.md`
3. Compare against baseline and previous months

**Bundle Size Analysis:**
- Reference `BUNDLE_ANALYSIS_2026-01.md` for current state
- Run `npm run build:analyze` to regenerate
- Compare against previous analysis

**SEO Optimization:**
- Reference `SEO_MEASUREMENT.md` for strategy
- Check `AUTOMATED_SEO_CHECKS.md` for validation details
- Review Search Console data via `ANALYTICS_INTEGRATIONS.md`

**Troubleshooting Errors:**
- Check `CONSOLE_ERROR_MONITORING.md` for error detection setup
- Review GitHub issues with `console-error` label

---

## 📈 Current Status Summary

### ✅ Completed Projects
1. **Node.js v24 Upgrade** (January 6, 2026)
   - All phases completed successfully
   - Zero vulnerabilities, zero errors
   - Performance: 98/100 local Lighthouse score

2. **Performance Optimization** (January 6, 2026)
   - Improved from 55 → 98 performance score
   - LCP: 5120ms → 1839ms (-55%)
   - System fonts, lazy-loading implemented

### 🔄 Active Monitoring
- Weekly SEO checks (Mondays 9 AM UTC)
- Weekly analytics exports (Mondays 9:30 AM UTC)
- Lighthouse CI on every deployment
- Console error monitoring on every deployment

### 📝 Pending/Optional Tasks
- [ ] Add `engines` field to package.json (Node >=24)
- [ ] Consider additional performance optimizations (see `FUTURE_WORK_ROADMAP.md`)

### ✅ Recent Updates
**January 7, 2026:**
- ✅ Created comprehensive blog feature plan (`BLOG_FEATURE_PLAN.md`)
- ✅ Removed 22 unused Radix UI dependencies (37 packages total)
- ✅ Updated vite.config.ts manual chunks
- ✅ Created bundle analysis documentation (`BUNDLE_ANALYSIS_2026-01.md`)

**January 6, 2026:**
- ✅ Created comprehensive future work roadmap (`FUTURE_WORK_ROADMAP.md`)
- ✅ Moved Lighthouse metrics to separate `lighthouse-metrics` branch
- ✅ Fixed Lighthouse workflow git conflict issues
- ✅ Cleaned up old merged branches (backup, test, dependabot branches)
- ✅ Rebased `feat/nvidia-role-update` branch onto latest main

---

## 🔄 Maintenance Schedule

### Weekly (Mondays)
- **9:00 AM UTC:** Automated SEO checks run
- **9:30 AM UTC:** GA4 data export
- **10:00 AM UTC:** Lighthouse CI (scheduled)
- **Review:** Check GitHub issues for automated alerts

### Monthly (First Monday)
- **Performance Deep Dive:** Use `PERFORMANCE_EVALUATION_GUIDE.md`
- **Create Report:** Add to `performance-reports/`
- **Review Trends:** Compare month-over-month metrics
- **Plan Improvements:** Prioritize optimizations

### On-Demand
- **After Deployments:** Lighthouse CI runs automatically
- **Error Detection:** Console monitoring on every deploy
- **Manual Testing:** Use guide checklists as needed

---

## 🆕 Creating New Planning Documents

### For New Projects/Upgrades:
1. Create plan document: `PROJECT_NAME_PLAN.md`
2. Create checklist: `PROJECT_NAME_CHECKLIST.md`
3. Execute with checklist, document progress
4. Upon completion, add completion summary to plan
5. Update this index with status

### For Performance Reviews:
1. Use `PERFORMANCE_EVALUATION_GUIDE.md` process
2. Create: `docs/performance-reports/YYYY-MM-description.md`
3. Follow template in evaluation guide
4. Update this index if significant changes

---

## 📚 Related Documentation

- **`README.md`** - Project overview, now includes Performance section
- **`CLAUDE.md`** - Development guidelines and instructions
- **`.github/workflows/`** - CI/CD automation configurations

---

## 🔗 External Resources

### Performance
- [Lighthouse Documentation](https://developer.chrome.com/docs/lighthouse/)
- [Core Web Vitals Guide](https://web.dev/vitals/)
- Local Lighthouse: `npx lighthouse https://dylanbochman.com/`

### Analytics
- [GA4 Dashboard](https://analytics.google.com)
- [Search Console](https://search.google.com/search-console)
- [UptimeRobot Status](https://stats.uptimerobot.com/zquZllQfNJ)

### Repository
- [GitHub Actions](https://github.com/Dbochman/personal-website/actions)
- [Performance Issues](https://github.com/Dbochman/personal-website/issues?q=label%3Aperformance)
- [Live Site](https://dylanbochman.com/)

---

## 📝 Notes

**CI Environment Considerations:**
- Lighthouse CI scores are 30-50 points lower than local due to shared runner resources
- Performance threshold set to 50 (vs typical 90) to account for CI variability
- Local Mac tests consistently achieve 95-98 scores
- See `performance-reports/2026-01-post-optimization.md` for details

**Best Practices:**
- Always read the full plan before executing
- Use checklists during execution to avoid missing steps
- Document issues and resolutions for future reference
- Update this index when adding new planning documents

---

**Maintained By:** Repository Owner
**Review Frequency:** Update when planning docs are added/completed
**Last Reviewed:** January 7, 2026
