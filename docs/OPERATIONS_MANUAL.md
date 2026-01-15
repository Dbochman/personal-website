# Operations Manual

**Purpose:** Everything needed to operate and maintain dylanbochman.com
**Audience:** Anyone taking over this project

---

## Quick Reference

| What | Where |
|------|-------|
| Live site | https://dylanbochman.com |
| Source repo | https://github.com/Dbochman/personal-website |
| Deployment repo | https://github.com/Dbochman/dbochman.github.io |
| Status page | https://stats.uptimerobot.com/zquZllQfNJ |
| CMS editor | https://dylanbochman.netlify.app/editor/ |
| Kanban board | https://dylanbochman.com/projects/kanban |
| Cloudflare Worker | https://kanban-save-worker.dbochman.workers.dev |
| Analytics | https://analytics.google.com (GA4) |
| Search Console | https://search.google.com/search-console |

---

## Architecture

```
GitHub (personal-website repo)
    ↓ push to main
GitHub Actions (build + test)
    ↓ deploy
GitHub Pages (dbochman.github.io repo)
    ↓ CNAME
Cloudflare (DNS + CDN)
    ↓
dylanbochman.com
```

**Stack:** React 18, TypeScript, Vite, Tailwind CSS
**Hosting:** GitHub Pages (free, static)
**CDN/DNS:** Cloudflare
**CMS:** Decap CMS via Netlify Identity

---

## Day-to-Day Operations

### Deploying Changes

Automatic. Push to `main` triggers GitHub Actions:
1. Runs tests
2. Builds production bundle
3. Deploys to GitHub Pages

No manual steps needed. Check [Actions tab](https://github.com/Dbochman/personal-website/actions) for status.

### Adding a Blog Post

**Option A: CMS (recommended)**
1. Go to https://dylanbochman.netlify.app/editor/
2. Log in with Netlify Identity
3. Create/edit post
4. Publish → auto-commits to repo → auto-deploys

**Option B: Manual**
1. Create file: `content/blog/YYYY-MM-DD-slug.txt`
2. Add frontmatter (see existing posts for format)
3. Write content in MDX
4. Commit and push

### Checking Site Health

1. **Uptime:** https://stats.uptimerobot.com/zquZllQfNJ
2. **Build status:** GitHub Actions badge in README
3. **Errors:** Check GitHub Issues for `console-error` label
4. **Performance:** Lighthouse CI runs on every deploy

---

## Services & Accounts

### GitHub
- **Source repo:** Dbochman/personal-website
- **Deploy repo:** Dbochman/dbochman.github.io
- **Secret needed:** `DEPLOY_TOKEN` (PAT with repo access)

### Cloudflare
- **Purpose:** DNS, CDN, SSL, Kanban Save Worker
- **Domain:** dylanbochman.com
- **DNS records:** CNAME to dbochman.github.io
- **Worker:** kanban-save-worker.dbochman.workers.dev (OAuth proxy for kanban saves)
- **KV Namespace:** SESSIONS (stores OAuth sessions, 7-day TTL)

### Netlify
- **Purpose:** CMS authentication only (not hosting)
- **Site:** dylanbochman.netlify.app
- **Identity:** Email/password login for CMS

### Google
- **GA4:** Property for dylanbochman.com
- **Search Console:** Verified via DNS

### UptimeRobot
- **Monitor:** HTTPS check every 5 minutes
- **Alerts:** Email on downtime

---

## Common Tasks

### Update Dependencies
```bash
npm update
npm audit fix
npm run build
npm test
# If all passes, commit and push
```

### Run Locally
```bash
npm install
npm run dev
# Opens http://localhost:8080
```

### Run Tests
```bash
npm test              # Unit tests
npm run test:e2e      # E2E tests (requires build first)
```

### Check Bundle Size
```bash
npm run build
# Check dist/ folder size
```

### Saving Kanban Board Changes

The roadmap board at `/projects/kanban` can save changes directly to GitHub:

1. **Login:** Click "Login to Save" → Authenticate with GitHub
2. **Edit:** Make changes to cards/columns
3. **Save:** Click "Save" button → Triggers GitHub Action → Commits to repo

**Requirements:**
- Must be a collaborator on the repo
- Uses GitHub OAuth (no secrets in browser)

**Architecture:**
```
Browser → Cloudflare Worker (OAuth) → GitHub Actions → Commit
```

**Troubleshooting:**
- "Not a collaborator" → Check GitHub repo collaborator settings
- Save fails → Check GitHub Actions tab for errors
- Session expired → Logout and login again

See `docs/completed-projects/25-kanban-save-feature.md` for implementation details.

### MCP Interactive Testing (Pre-PR)

When working with Claude Code and Chrome DevTools MCP, run these checks before opening a PR:

**Quick Check (all PRs with UI changes):**
1. Navigate to changed pages in Chrome
2. `list_console_messages` → no new errors
3. `take_snapshot` → accessibility tree looks correct

**Full Check (new pages, major features):**
1. Quick check above, plus:
2. `performance_start_trace` with reload → LCP < 2.5s, CLS < 0.1
3. `resize_page` to 320px → no layout breaks
4. `list_network_requests` → no failed resources

**Post-Deploy Verification:**
1. Navigate to production (dylanbochman.com)
2. `list_console_messages` → no errors
3. `list_network_requests` → no 404s
4. Spot check responsive at 320px, 768px

See `docs/plans/16-mcp-interactive-testing.md` for detailed workflows.

---

## Troubleshooting

### Site is down
1. Check [UptimeRobot status](https://stats.uptimerobot.com/zquZllQfNJ)
2. Check [GitHub Actions](https://github.com/Dbochman/personal-website/actions) for failed deploys
3. Check [GitHub Status](https://githubstatus.com) for Pages outages
4. Check Cloudflare dashboard for DNS issues

### Build is failing
1. Check Actions log for error message
2. Common issues:
   - TypeScript errors → fix type issues
   - Test failures → fix failing tests
   - npm audit → run `npm audit fix`

### CMS not working
1. Must use `dylanbochman.netlify.app/editor/` (not main domain)
2. Check Netlify Identity settings
3. Clear browser cache and retry

### Blog post not appearing
1. Check frontmatter has `draft: false`
2. Check date is not in future
3. Wait 2-3 minutes for deploy to complete

---

## Automated Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| Deploy | Push to main | Build and deploy site |
| Lighthouse CI | Post-deploy | Performance audit |
| Console Errors | Post-deploy | Check for JS errors |
| SEO Checks | Weekly (Mon) | Validate SEO health |
| Analytics Export | Weekly (Mon) | Backup GA4 data |
| Save Kanban | repository_dispatch | Commit kanban board changes |

All workflows are in `.github/workflows/`.

---

## File Locations

| Content | Location |
|---------|----------|
| Blog posts | `content/blog/*.txt` |
| Pages | `src/pages/` |
| Components | `src/components/` |
| Static assets | `public/` |
| CI/CD | `.github/workflows/` |
| Docs | `docs/` |

---

## Emergency Procedures

### Rollback a Bad Deploy
```bash
git revert HEAD
git push
# Or reset to specific commit:
git reset --hard <commit-hash>
git push --force
```

### Site Completely Broken
1. Go to https://github.com/Dbochman/dbochman.github.io
2. Check recent commits
3. Revert problematic commit directly in deploy repo if needed

### Lost Access to Accounts
- **GitHub:** Recovery email on file
- **Cloudflare:** Recovery email on file
- **Netlify:** Can recreate, CMS config is in repo
- **Google:** Standard account recovery

---

## Contacts

**Owner:** Dylan Bochman
**Email:** dylanbochman@gmail.com

---

**Last Updated:** January 2026
