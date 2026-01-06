# Website Performance Evaluation Guide

This guide provides a systematic approach to evaluating your website's performance and making data-driven improvements. Use this as a repeatable process for ongoing optimization.

## Table of Contents

- [Overview](#overview)
- [Evaluation Frequency](#evaluation-frequency)
- [Performance Metrics Dashboard](#performance-metrics-dashboard)
- [Step-by-Step Evaluation Process](#step-by-step-evaluation-process)
- [Making Results Actionable](#making-results-actionable)
- [Performance Improvement Playbook](#performance-improvement-playbook)
- [Tracking Progress](#tracking-progress)

---

## Overview

Your website has automated performance monitoring across four key areas:

1. **Lighthouse CI** - Technical performance and web vitals
2. **Search Console** - Organic search visibility and rankings
3. **GA4 Analytics** - User behavior and engagement
4. **Console Error Monitoring** - JavaScript errors and warnings

This guide helps you interpret these metrics and take action to improve them.

---

## Evaluation Frequency

### Weekly Review (Mondays after automation runs)
- Review automated metrics from weekly workflows
- Check for any GitHub issues created by degradation alerts
- Quick scan of GA4 analytics trends

### Monthly Deep Dive (First Monday of each month)
- Complete performance audit using this guide
- Analyze month-over-month trends
- Plan and prioritize improvements
- Review SEO rankings and content performance

### Ad-Hoc Reviews
- After major code changes or deployments
- When performance alerts are triggered
- Before important events or launches

---

## Performance Metrics Dashboard

### Quick Access URLs

**Metrics Dashboard:**
- View latest consolidated metrics: https://github.com/Dbochman/personal-website/blob/main/docs/metrics/latest.json
- Lighthouse history: https://github.com/Dbochman/personal-website/blob/main/docs/metrics/lighthouse-history.json
- Search Console history: https://github.com/Dbochman/personal-website/blob/main/docs/metrics/search-console-history.json
- GA4 analytics history: https://github.com/Dbochman/personal-website/blob/main/docs/metrics/ga4-history.json

**GitHub Actions:**
- Workflow runs: https://github.com/Dbochman/personal-website/actions
- Performance issues: https://github.com/Dbochman/personal-website/issues?q=is%3Aissue+label%3Aperformance

**External Tools:**
- Google Analytics 4: https://analytics.google.com
- Google Search Console: https://search.google.com/search-console
- UptimeRobot Status: https://stats.uptimerobot.com/zquZllQfNJ

---

## Step-by-Step Evaluation Process

### Phase 1: Gather Current Metrics (15 minutes)

#### 1.1 Pull Latest Metrics Data

```bash
# From your local repository
cd ~/repos/personal-website
git pull

# View latest metrics
cat docs/metrics/latest.json | jq '.'
```

#### 1.2 Record Current Scores

Create a performance snapshot. Copy these values from `latest.json`:

| Metric Category | Current Score | Target | Status |
|----------------|---------------|--------|--------|
| **Lighthouse Performance** | ___ | ≥90 | 🔴 🟡 🟢 |
| **Lighthouse Accessibility** | ___ | ≥95 | 🔴 🟡 🟢 |
| **Lighthouse Best Practices** | ___ | ≥90 | 🔴 🟡 🟢 |
| **Lighthouse SEO** | ___ | ≥95 | 🔴 🟡 🟢 |
| **LCP (ms)** | ___ | <2500 | 🔴 🟡 🟢 |
| **FID (ms)** | ___ | <100 | 🔴 🟡 🟢 |
| **CLS** | ___ | <0.1 | 🔴 🟡 🟢 |
| **Total Page Views (7d)** | ___ | Trend ↗️ | 🔴 🟡 🟢 |
| **Avg Session Duration (s)** | ___ | >180 | 🔴 🟡 🟢 |
| **Bounce Rate (%)** | ___ | <60 | 🔴 🟡 🟢 |

**Status Legend:**
- 🟢 Meets target
- 🟡 Close to target (within 10%)
- 🔴 Below target (needs attention)

#### 1.3 Check for Automated Alerts

```bash
# Check recent GitHub issues created by workflows
gh issue list --label automated --limit 10
```

Look for issues tagged with:
- `performance` - Lighthouse degradation
- `seo` - Search ranking drops
- `analytics` - Traffic anomalies
- `console-error` - JavaScript errors

---

### Phase 2: Analyze Performance (20 minutes)

#### 2.1 Lighthouse Analysis

**Access the full report:**
```bash
# Run Lighthouse locally for detailed analysis
npm run lighthouse:production

# Or download from GitHub Actions artifacts
gh run list --workflow=lighthouse.yml --limit 1
gh run view <run-id> --log
```

**Key Questions:**
1. **Performance Score < 90?**
   - What are the slowest metrics? (LCP, FID, CLS, TTI)
   - Which audits are failing?
   - Are there render-blocking resources?

2. **Accessibility Score < 95?**
   - Are there color contrast issues?
   - Missing ARIA labels or alt text?
   - Keyboard navigation problems?

3. **Best Practices Score < 90?**
   - Security issues (HTTPS, CSP)?
   - Browser console errors?
   - Deprecated APIs?

4. **SEO Score < 95?**
   - Missing meta tags?
   - Mobile-friendliness issues?
   - Crawlability problems?

#### 2.2 Core Web Vitals Deep Dive

From `latest.json`, analyze:

**Largest Contentful Paint (LCP):**
- **Target:** <2.5s (Good), 2.5-4s (Needs Improvement), >4s (Poor)
- **What it measures:** Loading performance
- **If slow, check:**
  - Large images without optimization
  - Slow server response times
  - Render-blocking JavaScript/CSS
  - Client-side rendering delays

**First Input Delay (FID):**
- **Target:** <100ms (Good), 100-300ms (Needs Improvement), >300ms (Poor)
- **What it measures:** Interactivity
- **If slow, check:**
  - Long-running JavaScript tasks
  - Heavy third-party scripts
  - Excessive main thread blocking

**Cumulative Layout Shift (CLS):**
- **Target:** <0.1 (Good), 0.1-0.25 (Needs Improvement), >0.25 (Poor)
- **What it measures:** Visual stability
- **If high, check:**
  - Images without dimensions
  - Dynamically injected content
  - Web fonts causing FOIT/FOUT

#### 2.3 Search Console Analysis

**Access Search Console:**
1. Go to https://search.google.com/search-console
2. Select your property (dylanbochman.com)

**Or use local metrics:**
```bash
cat docs/metrics/search-console-history.json | jq '.[-1]'
```

**Analyze Trends:**
- **Clicks:** Are organic clicks increasing?
- **Impressions:** Is visibility growing?
- **CTR:** Are people clicking when they see your site?
- **Position:** Are rankings improving?

**Top Queries Analysis:**
- Which queries drive the most traffic?
- Are you ranking for relevant professional terms?
- Any unexpected queries (positive or negative)?

**Top Pages Analysis:**
- Which pages get the most organic traffic?
- Are important pages (resume, portfolio) visible?

#### 2.4 GA4 Analytics Analysis

**Access GA4:**
```bash
cat docs/metrics/ga4-history.json | jq '.[-1]'
```

**Compare week-over-week:**
```bash
# View last 4 weeks of data
cat docs/metrics/ga4-history.json | jq '.[-4:]'
```

**Key Metrics:**
1. **Sessions & Users:**
   - Is traffic growing?
   - What's the new vs. returning ratio?

2. **Page Views:**
   - Which pages are most viewed?
   - Are visitors exploring multiple pages?

3. **Average Session Duration:**
   - Target: >3 minutes (180s)
   - Are visitors engaging with content?

4. **Bounce Rate:**
   - Target: <60%
   - Are visitors finding what they need?

5. **Device Breakdown:**
   - What's the mobile vs. desktop split?
   - Does mobile need optimization?

---

### Phase 3: Identify Issues (15 minutes)

#### 3.1 Prioritization Matrix

Score each issue on Impact (1-5) and Effort (1-5):

| Issue | Impact | Effort | Priority Score (Impact/Effort) |
|-------|--------|--------|-------------------------------|
| Example: LCP is 5s | 5 | 3 | 1.67 |
| Example: Bounce rate 75% | 4 | 4 | 1.00 |

**Priority Ranking:**
- **High Priority (>1.5):** Fix immediately
- **Medium Priority (1.0-1.5):** Schedule for next sprint
- **Low Priority (<1.0):** Backlog

#### 3.2 Common Issue Patterns

**Pattern: High LCP + Low Performance Score**
- Root cause: Large images, slow backend, render-blocking resources
- Action: Image optimization, code splitting, CDN

**Pattern: High Bounce Rate + Low Session Duration**
- Root cause: Content mismatch, poor UX, slow loading
- Action: Review content relevance, improve navigation

**Pattern: Low Impressions + Good CTR**
- Root cause: Limited search visibility
- Action: SEO content expansion, backlink building

**Pattern: Good Traffic + Low Session Duration**
- Root cause: Landing page issues, unclear CTA
- Action: Improve content quality, clearer navigation

---

## Making Results Actionable

### Creating an Action Plan

For each identified issue, create a specific action item:

**Template:**
```markdown
## Issue: [Specific metric problem]

**Current State:** [Metric value]
**Target State:** [Goal metric value]
**Business Impact:** [Why this matters]

**Root Cause Analysis:**
- [ ] Hypothesis 1
- [ ] Hypothesis 2
- [ ] Hypothesis 3

**Action Items:**
1. [ ] [Specific task] - Est: [time] - Owner: [you]
2. [ ] [Specific task] - Est: [time] - Owner: [you]

**Success Criteria:**
- [Specific measurable outcome]
- [Timeline for re-evaluation]

**Tracking:**
- Created: [date]
- Started: [date]
- Completed: [date]
- Result: [outcome]
```

**Example:**

```markdown
## Issue: LCP is 5.1 seconds (Target: <2.5s)

**Current State:** LCP = 5120ms
**Target State:** LCP < 2500ms
**Business Impact:** Slow loading = higher bounce rate, worse search rankings

**Root Cause Analysis:**
- [x] Large hero image (2.5MB)
- [x] No image optimization
- [ ] Render-blocking CSS

**Action Items:**
1. [x] Optimize hero image with WebP format - Est: 1h
2. [x] Implement lazy loading for below-fold images - Est: 2h
3. [ ] Add image CDN - Est: 4h

**Success Criteria:**
- LCP < 2.5s on production Lighthouse tests
- Re-test within 1 week of deployment

**Tracking:**
- Created: 2026-01-06
- Started: 2026-01-07
- Completed: [pending]
- Result: [pending]
```

---

## Performance Improvement Playbook

### Common Issues & Solutions

#### 🔴 Issue: Low Lighthouse Performance Score (<90)

**Quick Wins (High Impact, Low Effort):**

1. **Optimize Images**
   ```bash
   # Install image optimization tools
   npm install -D @squoosh/lib

   # Or use manual tools:
   # - TinyPNG: https://tinypng.com
   # - Squoosh: https://squoosh.app
   ```
   - Convert to WebP/AVIF formats
   - Resize to actual display dimensions
   - Add `loading="lazy"` to below-fold images
   - Use responsive images with `srcset`

2. **Reduce Bundle Size**
   ```bash
   # Analyze current bundle
   npm run build:analyze

   # Check for large dependencies
   npm install -D source-map-explorer
   npm run build && source-map-explorer 'dist/*.js'
   ```
   - Remove unused dependencies
   - Use dynamic imports for large components
   - Tree-shake unused code

3. **Minimize Render-Blocking Resources**
   - Move non-critical CSS to separate files
   - Inline critical CSS
   - Defer non-essential JavaScript
   - Use `async` or `defer` on script tags

**Medium Effort:**

4. **Implement Code Splitting**
   ```javascript
   // Use React lazy loading
   const HeavyComponent = React.lazy(() => import('./HeavyComponent'));
   ```

5. **Add Resource Hints**
   ```html
   <link rel="preconnect" href="https://analytics.google.com">
   <link rel="dns-prefetch" href="https://fonts.googleapis.com">
   ```

6. **Enable Compression**
   - Ensure Brotli/Gzip compression is enabled on hosting
   - GitHub Pages automatically compresses files

**Long-term Improvements:**

7. **Implement Service Worker**
   - Cache assets for offline access
   - Improve repeat visit performance

8. **Use a CDN**
   - Serve static assets from edge locations
   - Reduce latency for global visitors

---

#### 🔴 Issue: Poor Core Web Vitals

**High LCP (>2.5s):**
- Optimize hero/banner images
- Reduce server response time
- Preload critical resources
- Remove render-blocking resources
- Use CDN for static assets

**High FID (>100ms):**
- Break up long JavaScript tasks
- Use web workers for heavy computation
- Defer non-essential JavaScript
- Reduce third-party script impact
- Optimize event handlers

**High CLS (>0.1):**
- Set explicit width/height on images
- Reserve space for dynamic content
- Avoid inserting content above existing content
- Use CSS transforms instead of layout properties
- Preload fonts to avoid FOIT/FOUT

---

#### 🟡 Issue: High Bounce Rate (>60%)

**Possible Causes & Solutions:**

1. **Slow Loading Times**
   - Action: Address Lighthouse performance issues first

2. **Poor Mobile Experience**
   - Check mobile usability in Search Console
   - Test on real mobile devices
   - Ensure touch targets are large enough (48px minimum)

3. **Content Mismatch**
   - Review top landing pages in GA4
   - Ensure meta descriptions match page content
   - Add clear value proposition above the fold

4. **Unclear Navigation**
   - Simplify menu structure
   - Add clear calls-to-action
   - Improve internal linking

5. **Technical Issues**
   - Check console errors in production
   - Verify all links work
   - Test forms and interactive elements

**Testing Approach:**
```bash
# Run console error tests
npm run test:e2e

# Check for broken links
npm install -g broken-link-checker
blc https://dylanbochman.com -ro
```

---

#### 🟡 Issue: Low Organic Traffic / Poor Search Rankings

**SEO Improvement Checklist:**

1. **On-Page SEO:**
   - [ ] Optimize page titles (50-60 characters)
   - [ ] Write compelling meta descriptions (150-160 characters)
   - [ ] Use header tags (H1, H2, H3) hierarchically
   - [ ] Add alt text to all images
   - [ ] Implement structured data (JSON-LD)
   - [ ] Ensure mobile-friendliness
   - [ ] Improve page speed

2. **Content Strategy:**
   - [ ] Create valuable, unique content
   - [ ] Target relevant keywords naturally
   - [ ] Update old content regularly
   - [ ] Add blog posts or case studies
   - [ ] Include industry keywords

3. **Technical SEO:**
   - [ ] Generate and submit XML sitemap
   - [ ] Create robots.txt
   - [ ] Fix broken links
   - [ ] Implement canonical URLs
   - [ ] Ensure HTTPS everywhere
   - [ ] Add social media meta tags

4. **Off-Page SEO:**
   - [ ] Build quality backlinks
   - [ ] Share content on social media
   - [ ] Engage in relevant communities
   - [ ] Get listed in directories
   - [ ] Contribute to industry publications

**Monitoring:**
```bash
# Check current SEO scores
npm run check-seo

# Review Search Console data
cat docs/metrics/search-console-history.json | jq '.[-3:]'
```

---

#### 🟢 Issue: Console Errors in Production

**Quick Fix Process:**

1. **Identify Errors**
   ```bash
   # Run E2E tests locally
   npm run test:e2e:headed

   # Or check recent workflow runs
   gh run list --workflow=console-check.yml --limit 5
   ```

2. **Reproduce Locally**
   - Open browser DevTools
   - Navigate to affected pages
   - Check Console tab

3. **Common Error Types:**
   - **404 Errors:** Missing resources
     - Fix: Ensure all assets are deployed
     - Check file paths are correct

   - **CORS Errors:** Cross-origin requests blocked
     - Fix: Configure CORS headers
     - Use proxy for development

   - **Script Errors:** JavaScript exceptions
     - Fix: Add error boundaries
     - Implement proper null checks

   - **Network Errors:** Failed API calls
     - Fix: Add retry logic
     - Implement graceful degradation

4. **Prevent Future Errors**
   - Write tests for new features
   - Use TypeScript for type safety
   - Implement error boundaries in React
   - Add comprehensive error handling

---

## Tracking Progress

### Monthly Performance Report Template

Create a markdown file each month: `docs/performance-reports/YYYY-MM.md`

```markdown
# Performance Report - [Month Year]

## Executive Summary
- Overall site health: [Excellent / Good / Needs Improvement / Poor]
- Key wins this month: [Bullet points]
- Areas of concern: [Bullet points]

## Metrics Comparison

### Lighthouse Scores
| Metric | Last Month | This Month | Change | Target | Status |
|--------|-----------|------------|--------|--------|--------|
| Performance | X | Y | +/-Z | ≥90 | 🟢/🟡/🔴 |
| Accessibility | X | Y | +/-Z | ≥95 | 🟢/🟡/🔴 |
| Best Practices | X | Y | +/-Z | ≥90 | 🟢/🟡/🔴 |
| SEO | X | Y | +/-Z | ≥95 | 🟢/🟡/🔴 |

### Core Web Vitals
| Metric | Last Month | This Month | Change | Target | Status |
|--------|-----------|------------|--------|--------|--------|
| LCP (ms) | X | Y | +/-Z | <2500 | 🟢/🟡/🔴 |
| FID (ms) | X | Y | +/-Z | <100 | 🟢/🟡/🔴 |
| CLS | X | Y | +/-Z | <0.1 | 🟢/🟡/🔴 |

### Traffic & Engagement
| Metric | Last Month | This Month | Change |
|--------|-----------|------------|--------|
| Total Page Views | X | Y | +/-Z% |
| Unique Users | X | Y | +/-Z% |
| Avg Session Duration | X | Y | +/-Z% |
| Bounce Rate | X% | Y% | +/-Z% |

### Search Visibility
| Metric | Last Month | This Month | Change |
|--------|-----------|------------|--------|
| Total Clicks | X | Y | +/-Z% |
| Total Impressions | X | Y | +/-Z% |
| Avg CTR | X% | Y% | +/-Z% |
| Avg Position | X | Y | +/-Z |

## Actions Completed This Month
1. [Action item 1] - [Result/Impact]
2. [Action item 2] - [Result/Impact]

## Issues Identified
1. [Issue 1] - [Priority: High/Medium/Low]
2. [Issue 2] - [Priority: High/Medium/Low]

## Action Plan for Next Month
1. [ ] [Action 1] - Target: [metric improvement]
2. [ ] [Action 2] - Target: [metric improvement]

## Notes
- [Any relevant context, external factors, etc.]
```

### Automated Metrics Comparison Script

Create a script to compare metrics month-over-month:

```bash
#!/bin/bash
# scripts/compare-metrics.sh

echo "=== Performance Metrics Comparison ==="
echo ""

# Get current metrics
CURRENT=$(cat docs/metrics/latest.json)

# Get last month's metrics (if exists)
LAST_MONTH="docs/performance-reports/$(date -v-1m '+%Y-%m').json"

if [ -f "$LAST_MONTH" ]; then
    echo "Comparing with: $LAST_MONTH"
    # Add comparison logic here
else
    echo "No previous month data found"
    echo "Current metrics:"
    echo "$CURRENT" | jq '.'
fi
```

---

## Quick Reference Cheat Sheet

### Weekly Checklist (5 minutes)
```bash
# Pull latest metrics
git pull

# Quick view of all metrics
cat docs/metrics/latest.json | jq '{
  lighthouse: .lighthouse.scores,
  analytics: {
    sessions: .analytics.sessions_7d,
    bounce: .analytics.bounceRate
  }
}'

# Check for alerts
gh issue list --label automated
```

### Monthly Checklist (30 minutes)
- [ ] Pull and review all metrics files
- [ ] Complete Phase 1: Gather Current Metrics
- [ ] Complete Phase 2: Analyze Performance
- [ ] Complete Phase 3: Identify Issues
- [ ] Create action plan with specific tasks
- [ ] Generate monthly performance report
- [ ] Schedule improvement tasks

### Emergency Checklist (Performance Alert Triggered)
1. Check GitHub issue created by automation
2. Pull latest metrics: `git pull`
3. Identify which metric degraded
4. Run manual test: `npm run lighthouse:production`
5. Check recent deployments for culprit
6. Rollback if necessary
7. Fix root cause
8. Re-deploy and verify

---

## Useful Commands

```bash
# Fetch all latest data
git pull

# View latest metrics summary
cat docs/metrics/latest.json | jq '.'

# View Lighthouse history (last 5 entries)
cat docs/metrics/lighthouse-history.json | jq '.[-5:]'

# Compare last two Lighthouse scores
cat docs/metrics/lighthouse-history.json | jq '[.[-2], .[-1]] | map({date, performance, lcp: .coreWebVitals.lcp})'

# View GA4 trends (last 4 weeks)
cat docs/metrics/ga4-history.json | jq '.[-4:] | map({date, sessions: .summary.sessions, users: .summary.users})'

# Check Search Console clicks trend
cat docs/metrics/search-console-history.json | jq '.[] | {date, clicks: .summary.totalClicks}'

# Run all performance tests locally
npm run lighthouse:production
npm run test:e2e
npm run check-seo

# View recent workflow runs
gh run list --limit 10

# Check for performance issues
gh issue list --label performance

# Trigger workflows manually
gh workflow run lighthouse.yml
gh workflow run ga4-export.yml
gh workflow run search-console.yml
```

---

## Resources

### Documentation
- [Lighthouse Documentation](https://developer.chrome.com/docs/lighthouse/)
- [Core Web Vitals Guide](https://web.dev/vitals/)
- [Google Analytics 4 Help](https://support.google.com/analytics/answer/9304153)
- [Search Console Help](https://support.google.com/webmasters/)

### Tools
- [PageSpeed Insights](https://pagespeed.web.dev/)
- [WebPageTest](https://www.webpagetest.org/)
- [GTmetrix](https://gtmetrix.com/)
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)

### Learning
- [Web.dev Performance](https://web.dev/learn-performance/)
- [MDN Web Performance](https://developer.mozilla.org/en-US/docs/Web/Performance)
- [Google Search Central](https://developers.google.com/search/docs)

---

## Next Steps

1. **This Week:**
   - [ ] Complete your first full evaluation using this guide
   - [ ] Document current baseline metrics
   - [ ] Identify top 3 priority improvements

2. **This Month:**
   - [ ] Implement top priority fixes
   - [ ] Create first monthly performance report
   - [ ] Set up monitoring routine

3. **Ongoing:**
   - [ ] Review metrics weekly
   - [ ] Deep dive monthly
   - [ ] Iterate and improve continuously

---

**Remember:** Performance optimization is a continuous journey, not a destination. Small, consistent improvements compound over time!
