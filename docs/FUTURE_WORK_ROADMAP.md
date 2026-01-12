# Future Work Roadmap

**Last Updated:** January 11, 2026
**Status:** Draft for Review

This document outlines potential future work for the personal website, organized by priority and timeline.

---

## 🎯 Recently Completed (January 2026)

- ✅ **MDX Precompilation** (January 11) - PR #84 merged
  - Blog LCP improved 5.6s → 3.1s (45% faster)
  - Moved MDX compilation from runtime to build-time
  - Synchronous loaders for SSR/pre-rendering compatibility
- ✅ **Bundle Size Optimization** (January 11)
  - Removed unused blog-loader.ts (55KB savings)
  - Created lightweight blog-utils.ts for tree-shaking
- ✅ **Sentry Loading Optimization** (January 11)
  - Changed from setTimeout to requestIdleCallback
  - Defers ~128KB until browser is truly idle
- ✅ Node.js v24 upgrade (v22 → v24.12.0)
- ✅ Performance optimization (55 → 98 Lighthouse score)
- ✅ System font stack implementation (eliminated 1.6MB web fonts)
- ✅ Lazy-loaded web-vitals library
- ✅ Lighthouse CI threshold calibration
- ✅ Planning documentation refresh

---

## 🔥 High Priority (Next 1-2 Months)

### 1. ~~Image Optimization & Modern Formats~~ ✅ Already Optimized
**Status:** Complete - Site uses SVGs for logos, WebP for social preview, small PNGs for favicons. No heavy images requiring optimization.

---

### 2. ~~Progressive Web App (PWA) Features~~ - Low Value for Personal Site
**Status:** Deprioritized - PWA benefits (offline, installability) provide minimal value for a personal portfolio. Most visitors are one-time (recruiters, colleagues). The site already loads fast (2.7s LCP).

---

### 3. ~~Bundle Size Analysis & Code Splitting~~ ✅ Largely Complete
**Status:** (Updated January 11, 2026)
- ✅ Removed unused blog-loader.ts (55KB savings)
- ✅ Created lightweight blog-utils.ts for tree-shaking
- ✅ Sentry deferred via requestIdleCallback (~128KB deferred)
- ✅ MDX chunk splitting implemented
- ✅ Manual chunks configured in vite.config.ts

Further optimization (React.lazy, route splitting) would provide diminishing returns given current performance.

---

## 📅 Medium Priority (Next 3-6 Months)

### 4. ~~SEO Content Expansion~~ ✅ Complete
**Status:** Blog fully implemented with:
- ✅ Multiple technical blog posts
- ✅ RSS feed
- ✅ Structured data (JSON-LD)
- ✅ Social previews (Open Graph, Twitter Cards)
- ✅ Sitemap with priorities
- ✅ Tag filtering and search

---

### 5. Analytics Dashboard & Insights
**Priority:** MEDIUM
**Effort:** Medium (6-8 hours)
**Impact:** Better data visibility and decision-making
**Detailed Plan:** `~/.claude/plans/validated-cuddling-cloud.md` (Analytics Dashboard section)

**Current State:**
- GA4 and Search Console integrated (52 weeks of data)
- Lighthouse scores tracked (100 entries)
- Weekly automated exports via GitHub Actions
- Recharts already installed

**Planned Implementation:**
- Public page at `/analytics` with 3 tabs (Traffic, Search, Performance)
- Historical trend charts (12-week / 52-week views)
- Summary cards with key metrics
- Static JSON imports (no backend needed)

**Action Items:**
- [ ] Create `src/pages/Analytics.tsx` with tab layout
- [ ] Create chart components using Recharts
- [ ] Add route and navigation
- [ ] Handle empty states for sparse data

**Expected Impact:**
- Better insights into user behavior
- Data-driven optimization decisions
- Easier trend identification

---

### 6. Accessibility Enhancements
**Priority:** MEDIUM
**Effort:** Low-Medium (4-6 hours)
**Impact:** Better UX for all users, maintain 100 score

**Current State:**
- Accessibility: 100/100 ✅
- Already well-implemented

**Action Items:**
- [ ] Add skip navigation links
- [ ] Implement focus visible indicators
- [ ] Test with screen readers (NVDA, JAWS)
- [ ] Add ARIA live regions for dynamic content
- [ ] Keyboard navigation audit
- [ ] Color contrast verification for all themes

**Expected Impact:**
- Maintain perfect accessibility score
- Better experience for assistive technology users
- WCAG AAA compliance where possible

---

### 7. Performance Budget & CI Checks
**Priority:** MEDIUM
**Effort:** Low-Medium (4-6 hours)
**Impact:** Prevent future regressions

**Current State:**
- Lighthouse CI monitors performance
- No hard limits on bundle size or metrics

**Action Items:**
- [ ] Define performance budget
  - Bundle size: <200KB (current: 156KB)
  - LCP: <2.0s
  - FID: <50ms
  - CLS: <0.05
- [ ] Add Bundlesize or similar to CI
- [ ] Fail builds that exceed budgets
- [ ] Add performance metrics to PR comments
- [ ] Create performance regression alerts

**Expected Impact:**
- Proactive regression prevention
- Team/contributor awareness of performance impact
- Maintain high performance standards

---

## 🔮 Long-term (6-12 Months)

### 8. CDN & Edge Optimization
**Priority:** LOW-MEDIUM
**Effort:** Medium (6-8 hours)
**Impact:** Global latency reduction

**Action Items:**
- [ ] Evaluate Cloudflare Pages or Vercel
- [ ] Implement edge caching strategy
- [ ] Add Edge Functions for dynamic content (if needed)
- [ ] Set up geographic performance monitoring
- [ ] Optimize for international audiences

**Expected Impact:**
- Reduced latency for global visitors
- Better caching control
- Potential for dynamic features at the edge

---

### 9. Advanced Monitoring & Error Tracking
**Priority:** LOW-MEDIUM
**Effort:** Medium (4-6 hours)
**Impact:** Better visibility into production issues

**Current State:** (Updated January 11, 2026)
- Console error monitoring via E2E tests
- ✅ Sentry integrated with lazy loading (requestIdleCallback)
- ✅ Browser tracing enabled

**Remaining Items:**
- [ ] Set up Real User Monitoring (RUM)
- [ ] Monitor performance in real users' browsers
- [ ] Set up alerts for error spikes
- [ ] Create error dashboards

**Expected Impact:**
- Catch production errors before users report them
- Real performance data from actual users
- Better debugging capabilities

---

### 10. Content Features & Enhancements
**Priority:** LOW
**Effort:** Variable
**Impact:** Better user engagement

**Ideas:**
- [ ] Dark/light mode improvements (custom themes?)
- [ ] Add project filtering/search
- [ ] Implement contact form with validation
- [ ] Add testimonials/recommendations section
- [ ] Create downloadable resume (PDF)
- [ ] Add skills visualization
- [ ] Timeline of career/education
- [ ] Newsletter signup (if applicable)

---

### 11. Testing & Quality Improvements
**Priority:** LOW-MEDIUM
**Effort:** Medium (6-8 hours)
**Impact:** Better code quality and confidence
**Detailed Plan:** `~/.claude/plans/validated-cuddling-cloud.md` (Visual Regression Testing section)

**Current State:**
- 21 unit test files (Vitest)
- 4 E2E test suites (Playwright)
- Console error monitoring on deploy
- No visual regression testing yet

**Visual Regression Testing Plan:**
- Use Playwright's built-in `toHaveScreenshot()` API
- 16 baseline screenshots (4 pages × 2 viewports × 2 themes)
- Pages: Home, Blog listing, Blog post, Runbook
- Run on every PR via new GitHub workflow

**Action Items:**
- [ ] Create `tests/e2e/visual-regression.spec.ts`
- [ ] Update `playwright.config.ts` with screenshot settings
- [ ] Create `.github/workflows/pr-tests.yml`
- [ ] Generate and commit baseline screenshots
- [ ] Add npm scripts for snapshot updates

---

### 12. Infrastructure & DevOps
**Priority:** LOW
**Effort:** Variable
**Impact:** Better deployment and monitoring

**Ideas:**
- [ ] Set up preview deployments for PRs
- [ ] Add deployment notifications (Slack, Discord)
- [ ] Implement blue-green deployments
- [ ] Add deployment rollback capability
- [ ] Set up uptime monitoring alerts
- ~~[ ] Create deployment runbook~~ ✅ Complete - /runbook page exists with full operations guide
- [ ] Add dependency update automation (Renovate)

---

## 📊 Quick Wins (Can Do Anytime)

### Small Improvements - Status

1. ~~**Add `engines` field to package.json**~~ ✅ Completed January 11, 2026

2. ~~**Delete backup branch**~~ ✅ Already deleted

3. ~~**Add meta tags for social media**~~ ✅ Complete - Seo.tsx provides Open Graph and Twitter Card meta tags

4. ~~**Implement 404 page improvements**~~ ✅ Complete - 404.html handles SPA routing for GitHub Pages

5. ~~**Add sitemap.xml priority and changefreq**~~ ✅ Complete - sitemap.xml has priority, changefreq, and lastmod

6. ~~**Favicon optimization**~~ ✅ Complete - Multiple sizes (16x16, 32x32, 180x180), dark/light variants, theme-color meta tag

7. ~~**Security headers**~~ - Not applicable (GitHub Pages doesn't allow custom HTTP headers)

---

## 🎓 Learning & Experimentation

### Optional Exploration (Low priority, educational value)

- [ ] Explore Astro for static pages
- [ ] Try Server Components (when stable)
- [ ] Experiment with View Transitions API
- [ ] Test new CSS features (container queries, :has())
- [ ] Explore AI integration (chatbot, content generation)
- [ ] Try Web Components
- [ ] Experiment with animation libraries (Framer Motion)

---

## 📈 Success Metrics

Track these metrics to measure impact of future work:

**Performance:** (Updated January 11, 2026)
- Lighthouse scores: Homepage 92%, Blog 89% (local)
- Core Web Vitals: LCP 2.7s (homepage), 3.1s (blog)
- Blog performance improved 45% via MDX precompilation

**SEO & Traffic:**
- Organic search impressions (target: +50% over 6 months)
- Average position (target: top 10 for key terms)
- Organic clicks (track monthly growth)

**User Engagement:**
- Bounce rate (target: <60%)
- Average session duration (target: maintain 6+ minutes)
- Pages per session (target: 4+)

**Quality:**
- Test coverage (target: 90%+)
- Zero production errors
- Accessibility score (maintain 100)

---

## 🗓️ Suggested Prioritization

### ✅ January 2026 - COMPLETED
1. ~~Add `engines` field to package.json~~ ✅
2. ~~Image optimization audit~~ ✅ Already optimized
3. ~~Bundle analysis~~ ✅ Optimizations implemented
4. ~~MDX precompilation~~ ✅ 45% LCP improvement
5. ~~Blog Phase 5 (SEO)~~ ✅ RSS, structured data, social previews

### Remaining Optional Work
**Maintenance:**
- Tailwind CSS v4 upgrade (plan exists in `docs/`)
- Test & CI/CD improvements (plan exists in `docs/`)

**Nice-to-Have (detailed plans created January 11):**
- Analytics Dashboard (plan in `~/.claude/plans/validated-cuddling-cloud.md`)
- Visual Regression Testing (plan in `~/.claude/plans/validated-cuddling-cloud.md`)
- Dependency automation (Renovate)

---

## 💡 Notes & Considerations

**Before Starting New Work:**
1. Check this roadmap is current
2. Review performance baselines
3. Ensure existing monitoring is healthy
4. Back up current state
5. Create plan document if complex

**Decision Framework:**
- **High Impact + Low Effort** = Do first
- **High Impact + High Effort** = Plan and prioritize
- **Low Impact + Low Effort** = Quick wins between projects
- **Low Impact + High Effort** = Reconsider or defer

**Keep in Mind:**
- Site is already performing exceptionally (98/100 local)
- Don't over-optimize at the expense of features
- User value should drive priorities
- Maintain current quality while adding features

---

## 📝 How to Use This Roadmap

1. **Review quarterly** - Update priorities based on goals
2. **Before starting work** - Create specific plan document
3. **Track progress** - Mark items complete, add learnings
4. **Update metrics** - Document impact of completed work
5. **Adjust priorities** - Based on data and user feedback

---

**Maintained By:** Repository Owner
**Next Review:** April 2026
**Created:** January 6, 2026
