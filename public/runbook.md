# dylanbochman.com - Operational Runbook

## 🚨 Incident Response Guide

### Quick References
- **Status Page**: [stats.uptimerobot.com/zquZllQfNJ](https://stats.uptimerobot.com/zquZllQfNJ)
- **Error Tracking**: Sentry Dashboard (requires login)
- **Analytics**: Google Analytics G-VDM15EMJN2
- **Repository**: [github.com/Dbochman/personal-website](https://github.com/Dbochman/personal-website)
- **Deployment Target**: [github.com/Dbochman/dbochman.github.io](https://github.com/Dbochman/dbochman.github.io)

---

## 🏗️ Architecture Overview

**Hosting**: GitHub Pages with CDN (Fastly)  
**Domain**: dylanbochman.com (custom domain via CNAME)  
**Tech Stack**: React 18 + TypeScript + Vite + Tailwind CSS  
**Deployment**: GitHub Actions CI/CD pipeline  
**Monitoring**: UptimeRobot + Sentry + Google Analytics

### Infrastructure Components
- **Origin**: GitHub Pages (static hosting)
- **CDN**: Fastly (via GitHub Pages)
- **DNS**: Domain registrar DNS (points to GitHub Pages)
- **CI/CD**: GitHub Actions (.github/workflows/deploy.yml)
- **Dependencies**: NPM packages (managed by Dependabot)

---

## 🔥 Incident Classification

### P0 - Critical (Site Down)
- **Symptoms**: HTTP 5xx errors, complete site unavailability
- **Impact**: All users unable to access site
- **Response Time**: Immediate (< 5 minutes)

### P1 - High (Degraded Performance)
- **Symptoms**: Slow loading, broken functionality
- **Impact**: Poor user experience, potential reputation damage
- **Response Time**: < 30 minutes

### P2 - Medium (Minor Issues)
- **Symptoms**: Broken links, styling issues, analytics gaps
- **Impact**: Limited functionality loss
- **Response Time**: < 2 hours

### P3 - Low (Enhancement/Maintenance)
- **Symptoms**: Outdated content, dependency updates
- **Impact**: No immediate user impact
- **Response Time**: Next business day

---

## 📊 Monitoring & Alerting

### UptimeRobot (External Monitoring)
- **Check Frequency**: Every 5 minutes
- **Monitored URL**: https://dylanbochman.com
- **Alert Method**: Email notification
- **Status Page**: Public at stats.uptimerobot.com/zquZllQfNJ

### Sentry (Error Tracking)
- **Client-side JavaScript errors**
- **Performance monitoring**
- **Release tracking**
- **User session data**

### Google Analytics
- **Traffic patterns**
- **User engagement metrics**
- **Resume download tracking**
- **Geographic distribution**

### GitHub Actions (CI/CD Monitoring)
- **Build status**: Check workflow runs
- **Test results**: Automated test suite
- **Security**: npm audit + Dependabot alerts
- **Performance**: Lighthouse CI budgets

---

## 🛠️ Troubleshooting Guide

### Site Completely Down (P0)

**Immediate Actions:**
1. **Check Status Page**: Verify UptimeRobot confirms outage
2. **Test Direct Access**: Try dbochman.github.io (bypasses custom domain)
3. **GitHub Status**: Check [githubstatus.com](https://githubstatus.com)
4. **DNS Check**: Use `nslookup dylanbochman.com`

**Common Causes & Solutions:**
- **GitHub Pages Outage**: Monitor GitHub status, wait for resolution
- **DNS Issues**: Contact domain registrar, verify CNAME record
- **Repository Access**: Check if repo is public, verify deployment token
- **Build Failure**: Check GitHub Actions logs, fix build errors

### Slow Performance (P1)

**Investigation Steps:**
1. **Lighthouse Test**: Run performance audit
2. **Bundle Analysis**: Check dist/bundle-analysis.html
3. **CDN Status**: Verify Fastly CDN performance
4. **Analytics**: Check Core Web Vitals in Google Analytics

**Common Fixes:**
- **Large Bundle**: Review JavaScript imports, implement code splitting
- **Image Optimization**: Compress images, use modern formats
- **Third-party Scripts**: Audit external dependencies
- **CDN Cache**: May resolve automatically after cache refresh

### JavaScript Errors (P1/P2)

**Investigation:**
1. **Sentry Dashboard**: Review error frequency and stack traces
2. **Browser Console**: Test in multiple browsers
3. **Recent Deployments**: Check if error correlates with recent changes

**Common Fixes:**
- **Dependency Issues**: Update packages, check for breaking changes
- **Browser Compatibility**: Test in target browsers
- **API Changes**: Verify external service integrations

### Build/Deployment Failures (P1)

**Investigation:**
1. **GitHub Actions**: Check workflow logs in .github/workflows/deploy.yml
2. **Test Results**: Review npm test output
3. **Security Audit**: Check npm audit results
4. **Dependencies**: Verify package-lock.json integrity

**Common Fixes:**
- **Test Failures**: Fix failing tests before merge
- **Security Vulnerabilities**: Run `npm audit fix`
- **Node Version**: Ensure compatible Node.js version (20.19+)
- **Token Expiry**: Regenerate DEPLOY_TOKEN if needed

---

## 🚀 Recovery Procedures

### Emergency Rollback
```bash
# Identify last known good commit
git log --oneline -10

# Create rollback branch
git checkout -b emergency-rollback

# Reset to stable commit
git reset --hard <stable-commit-hash>

# Force push (bypasses branch protection)
git push origin main --force
```

### DNS Recovery
```bash
# Verify current DNS settings
nslookup dylanbochman.com

# Expected CNAME record
dylanbochman.com CNAME dbochman.github.io
```

### Repository Recovery
1. **Backup**: Ensure code is pushed to origin
2. **Reset**: Use GitHub's repository settings to reset
3. **Redeploy**: Trigger fresh deployment via push to main

---

## 📈 Performance Standards

### Core Web Vitals (SLIs)
- **First Contentful Paint**: < 2.0s
- **Largest Contentful Paint**: < 3.0s  
- **Cumulative Layout Shift**: < 0.1
- **Time to Interactive**: < 4.0s

### Quality Gates (SLOs)
- **Performance Score**: ≥ 90%
- **Accessibility Score**: ≥ 95%
- **SEO Score**: ≥ 95%
- **Uptime**: ≥ 99.9% (measured monthly)

### Resource Budgets
- **Total Bundle Size**: < 500KB
- **JavaScript**: < 300KB
- **CSS**: < 75KB
- **Images**: < 100KB

---

## 🔧 Maintenance Procedures

### Weekly Tasks
- [ ] Review UptimeRobot reports
- [ ] Check Sentry error trends
- [ ] Review Google Analytics traffic
- [ ] Monitor Dependabot PRs

### Monthly Tasks
- [ ] Update dependencies (security patches)
- [ ] Review performance metrics
- [ ] Analyze user engagement data
- [ ] Update resume PDF if needed

### Quarterly Tasks
- [ ] Full security audit
- [ ] Performance optimization review
- [ ] Content refresh
- [ ] Backup verification

---

## 📞 Escalation Paths

### Primary Response
**Dylan Bochman** - Site Owner/SRE
- Email: dylanbochman@gmail.com
- LinkedIn: [linkedin.com/in/dbochman](https://linkedin.com/in/dbochman)

### External Dependencies
- **GitHub Support**: For platform-level issues
- **Domain Registrar**: For DNS-related problems
- **Google Support**: For Analytics issues

---

## 📚 Additional Resources

### Documentation
- [GitHub Pages Docs](https://docs.github.com/en/pages)
- [Vite Documentation](https://vitejs.dev/guide/)
- [React Documentation](https://react.dev/)
- [Lighthouse Performance](https://developers.google.com/web/tools/lighthouse)

### Tools
- [PageSpeed Insights](https://pagespeed.web.dev/)
- [GTmetrix](https://gtmetrix.com/)
- [WebPageTest](https://webpagetest.org/)
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)

---

**Last Updated**: October 2025  
**Version**: 1.0  
**Owner**: Dylan Bochman, Technical Incident Manager