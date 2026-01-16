export interface Link {
  text: string;
  url: string;
}

export interface QuickReference {
  label: string;
  links: Link[];
}

export interface InfrastructureItem {
  component: string;
  description: string;
}

export interface MonitoringTool {
  name: string;
  details: {
    label: string;
    value: string | Link;
  }[];
}

export interface TroubleshootingScenario {
  title: string;
  actions?: string;
  investigate?: string;
  fixes?: string;
  check?: string;
  causes?: string;
}

export interface RecoveryProcedure {
  title: string;
  code: string;
}

export interface EscalationContact {
  role: string;
  name: string;
  details: string[];
}

export interface ResourceCategory {
  title: string;
  links: Link[];
}

export const quickReferences: QuickReference[] = [
  {
    label: "Status",
    links: [
      { text: "stats.uptimerobot.com/zquZllQfNJ", url: "https://stats.uptimerobot.com/zquZllQfNJ" },
    ],
  },
  {
    label: "Repo",
    links: [
      { text: "Dbochman/personal-website", url: "https://github.com/Dbochman/personal-website" },
    ],
  },
  {
    label: "Deploy",
    links: [
      { text: "Production (GitHub Pages)", url: "https://github.com/Dbochman/dbochman.github.io" },
      { text: "Preview (Cloudflare Pages)", url: "https://personal-website-adg.pages.dev" },
      { text: "Cloudflare Pages Settings", url: "https://dash.cloudflare.com/324caf800a82364b608b3e82d9a1debd/pages/view/personal-website/settings/production" },
    ],
  },
  {
    label: "CMS",
    links: [
      { text: "dylanbochman.netlify.app/editor", url: "https://dylanbochman.netlify.app/editor/index.html" },
    ],
  },
  {
    label: "Dependencies",
    links: [
      { text: "GitHub", url: "https://githubstatus.com" },
      { text: "Cloudflare", url: "https://cloudflarestatus.com" },
      { text: "Fastly", url: "https://status.fastly.com" },
      { text: "NPM", url: "https://status.npmjs.org" },
      { text: "Google", url: "https://status.cloud.google.com" },
      { text: "Sentry", url: "https://status.sentry.io" },
    ],
  },
];

export const architectureOverview = {
  stack: [
    { item: "Production Hosting", value: "GitHub Pages with CDN (Fastly)" },
    { item: "Preview Hosting", value: "Cloudflare Pages (auto-deploys PR branches)" },
    { item: "Domain", value: "dylanbochman.com (custom domain via CNAME)" },
    { item: "Tech Stack", value: "React 18 + TypeScript + Vite 7 + Tailwind CSS 3" },
    { item: "Runtime", value: "Node.js 24 LTS (npm 11.x)" },
    { item: "Deployment", value: "GitHub Actions CI/CD pipeline" },
    { item: "Content Management", value: "Decap CMS (GitHub OAuth, /editor route)" },
    { item: "API Layer", value: "Cloudflare Workers (kanban-save-worker at api.dylanbochman.com)" },
    { item: "Error Tracking", value: "Sentry with source maps and release tracking" },
    { item: "Monitoring", value: "UptimeRobot + Lighthouse CI + Core Web Vitals + Google Analytics" },
  ],
};

export const infrastructureComponents: InfrastructureItem[] = [
  { component: "Origin", description: "GitHub Pages (static hosting for production)" },
  { component: "Preview", description: "Cloudflare Pages (personal-website-adg.pages.dev)" },
  { component: "CDN", description: "Fastly (via GitHub Pages) + Cloudflare (for previews)" },
  { component: "DNS", description: "Cloudflare DNS (dylanbochman.com)" },
  { component: "API", description: "Cloudflare Workers (api.dylanbochman.com/save-board)" },
  { component: "CI/CD", description: "GitHub Actions (.github/workflows/deploy.yml)" },
  { component: "Dependencies", description: "NPM packages (managed by Dependabot)" },
];

export const monitoringTools: MonitoringTool[] = [
  {
    name: "UptimeRobot (External Monitoring)",
    details: [
      { label: "Check Frequency", value: "Every 5 minutes" },
      { label: "Monitored URL", value: { text: "https://dylanbochman.com", url: "https://dylanbochman.com" } },
      { label: "Alert Method", value: "Email notification" },
      { label: "Status Page", value: { text: "stats.uptimerobot.com/zquZllQfNJ", url: "https://stats.uptimerobot.com/zquZllQfNJ" } },
    ],
  },
  {
    name: "Automated SEO Monitoring",
    details: [
      { label: "Workflow", value: "Weekly SEO Check (GitHub Actions)" },
      { label: "Schedule", value: "Every Monday at 9 AM UTC" },
      { label: "Metrics", value: "Performance, SEO scores, Core Web Vitals" },
      { label: "Alerting", value: "GitHub issues created if scores drop below thresholds" },
      { label: "Documentation", value: { text: "AUTOMATED_SEO_CHECKS.md", url: "https://github.com/Dbochman/personal-website/blob/main/docs/AUTOMATED_SEO_CHECKS.md" } },
    ],
  },
  {
    name: "Console Error Monitoring",
    details: [
      { label: "Workflow", value: "Automated Playwright tests after each deployment" },
      { label: "Coverage", value: "Home page + Runbook page" },
      { label: "Detection", value: "JavaScript errors, runtime exceptions, console warnings" },
      { label: "Alerting", value: "GitHub issues with screenshots and error logs" },
      { label: "Documentation", value: { text: "CONSOLE_ERROR_MONITORING.md", url: "https://github.com/Dbochman/personal-website/blob/main/docs/CONSOLE_ERROR_MONITORING.md" } },
    ],
  },
  {
    name: "Core Web Vitals Tracking",
    details: [
      { label: "Integration", value: "Google Analytics 4 custom events" },
      { label: "Metrics", value: "LCP, FID, CLS, INP, FCP, TTFB" },
      { label: "Mode", value: "Production only (real user monitoring)" },
      { label: "Dashboard", value: "Google Analytics → Events → Web Vitals" },
    ],
  },
  {
    name: "GitHub Actions (CI/CD Monitoring)",
    details: [
      { label: "Build status", value: "Check workflow runs" },
      { label: "Test results", value: "Automated test suite (Vitest + Playwright)" },
      { label: "Security", value: "npm audit + Dependabot alerts" },
      { label: "Performance", value: "Lighthouse CI budgets" },
    ],
  },
];

export const troubleshootingScenarios: TroubleshootingScenario[] = [
  {
    title: "Site Completely Down",
    actions: "Check UptimeRobot → Try dbochman.github.io → Check GitHub status → Run nslookup dylanbochman.com",
    causes: "GitHub Pages outage | CDN issues (Fastly) | DNS misconfiguration | Repo access | Build failure | NPM registry down",
  },
  {
    title: "Slow Performance",
    investigate: "Run Lighthouse audit → Check dist/bundle-analysis.html → Verify CDN status → Review Core Web Vitals",
    fixes: "Code splitting | Image optimization | Audit third-party scripts | CDN cache refresh",
  },
  {
    title: "JavaScript Errors",
    investigate: "Review Sentry dashboard → Test in multiple browsers → Check recent deployments",
  },
  {
    title: "Build/Deployment Failures",
    check: "GitHub Actions logs → npm test output → npm audit results → package-lock.json integrity",
  },
  {
    title: "Preview Deployment Issues",
    investigate: "Check Cloudflare Pages dashboard → Verify build:preview script works locally → Check branch name sanitization",
    causes: "Cloudflare build timeout | Missing environment variables | Playwright prerender (use build:preview) | Branch name with special characters",
    fixes: "Retry deployment in CF dashboard → Check build logs → Verify npm run build:preview works locally",
  },
  {
    title: "Kanban Save Not Working",
    investigate: "Check api.dylanbochman.com/save-board → Verify GitHub OAuth token → Check Cloudflare Workers logs",
    causes: "Worker deployment failed | GitHub token expired | CORS misconfiguration | Rate limiting",
    fixes: "Redeploy worker via wrangler → Re-authenticate GitHub OAuth → Check worker secrets in CF dashboard",
  },
  {
    title: "CMS Editor Issues",
    investigate: "Check /editor/index.html loads → Verify GitHub OAuth is working → Check browser console for errors",
    causes: "GitHub API rate limits | OAuth app misconfiguration | CORS issues | Decap CMS CDN down",
    fixes: "Verify config.yml settings → Check GitHub permissions → Clear browser cache → Try different browser",
  },
];

export const recoveryProcedures: RecoveryProcedure[] = [
  {
    title: "Emergency Rollback",
    code: `# Identify last known good commit
git log --oneline -10

# Create rollback branch
git checkout -b emergency-rollback

# Reset to stable commit
git reset --hard <stable-commit-hash>

# Force push (bypasses branch protection)
git push origin main --force`,
  },
  {
    title: "DNS Recovery",
    code: `# Verify current DNS settings
nslookup dylanbochman.com

# Expected CNAME record
dylanbochman.com CNAME dbochman.github.io`,
  },
];

export const escalationContacts: EscalationContact[] = [
  {
    role: "Primary Response",
    name: "Dylan Bochman - Site Owner/Technical Incident Manager",
    details: [
      "Email: dylanbochman@gmail.com",
      "LinkedIn: linkedin.com/in/dbochman",
    ],
  },
];

export const externalDependencies: Link[] = [
  { text: "GitHub Support", url: "https://githubstatus.com" },
  { text: "Cloudflare Support", url: "https://cloudflarestatus.com" },
  { text: "Google Support", url: "https://status.cloud.google.com" },
  { text: "Fastly CDN", url: "https://status.fastly.com" },
  { text: "Sentry Support", url: "https://status.sentry.io" },
];

export const additionalResources: ResourceCategory[] = [
  {
    title: "Documentation",
    links: [
      { text: "GitHub Pages Docs", url: "https://docs.github.com/en/pages" },
      { text: "Vite Documentation", url: "https://vitejs.dev/guide/" },
      { text: "React Documentation", url: "https://react.dev/" },
      { text: "Lighthouse Performance", url: "https://developers.google.com/web/tools/lighthouse" },
    ],
  },
  {
    title: "Tools",
    links: [
      { text: "PageSpeed Insights", url: "https://pagespeed.web.dev/" },
      { text: "GTmetrix", url: "https://gtmetrix.com/" },
      { text: "WebPageTest", url: "https://webpagetest.org/" },
      { text: "Chrome DevTools", url: "https://developer.chrome.com/docs/devtools/" },
    ],
  },
];

export const runbookMetadata = {
  maintainer: "Dylan Bochman",
  email: "dylanbochman@gmail.com",
  lastUpdated: "2026-01-16",
};
