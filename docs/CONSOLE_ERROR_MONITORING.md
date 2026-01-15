# Console Error Monitoring

Two complementary approaches for catching JavaScript errors: automated CI checks and interactive MCP-based debugging.

---

## Chrome DevTools MCP (Interactive)

The Chrome DevTools MCP server enables real-time console monitoring during development and debugging sessions.

### Quick Console Check

```
1. list_console_messages              → View all console output
2. list_console_messages (types: ["error", "warn"])  → Filter to errors/warnings only
3. get_console_message (msgid: N)     → Get full details of specific message
```

### When to Use MCP

| Scenario | Use MCP |
|----------|---------|
| Debugging a specific issue | ✅ |
| Testing new feature locally | ✅ |
| Investigating user-reported bug | ✅ |
| Quick smoke test before PR | ✅ |
| Exploratory testing | ✅ |

### MCP Console Workflow

**Quick smoke test:**
```
1. Navigate to page
2. list_console_messages → check for errors
3. Click around / interact with UI
4. list_console_messages → check for new errors
```

**Full page audit:**
```
1. Navigate to each page (/, /blog, /projects, /analytics, /kanban)
2. list_console_messages (types: ["error", "warn"])
3. Document any issues found
4. take_snapshot → verify accessibility tree
```

**After UI changes:**
```
1. Navigate to affected page
2. Interact with changed components
3. list_console_messages → verify no new errors
4. resize_page (320px) → test mobile
5. list_console_messages → check for responsive errors
```

### Preserving Console History

Use `includePreservedMessages: true` to see console output from the last 3 navigations:

```
list_console_messages (includePreservedMessages: true)
```

Useful when an error occurred on a previous page during navigation testing.

### Console Message Types

| Type | Severity | Action |
|------|----------|--------|
| `error` | Critical | Fix immediately |
| `warn` | Medium | Investigate |
| `log`, `info` | Low | Usually safe to ignore |
| `issue` | Medium | Browser-detected problems |

---

## Playwright Automation (CI)

Automated console error checks run after every deployment to production.

### How It Works

After every successful deployment:
1. GitHub Actions waits 30 seconds for deployment to propagate
2. Playwright loads production (`https://dylanbochman.com`)
3. Captures all console errors and warnings
4. Filters out known/acceptable messages
5. Fails the build if critical errors are found
6. Creates a GitHub issue with details if errors are detected

### Monitored Pages

- **Home Page**: `/`
- **Runbook Page**: `/runbook.html`

### Running Locally

```bash
npm run test:e2e           # Run console error checks
npm run test:e2e:ui        # Interactive mode
npm run test:e2e:headed    # Browser visible
```

### Workflow Details

**File**: `.github/workflows/console-check.yml`

**Triggered by**:
- Successful completion of "Build, Test, and Deploy" workflow
- Manual trigger via GitHub Actions UI

**Duration**: ~2-3 minutes

### Ignored Patterns

These console messages are intentionally ignored:

- **Cookie warnings**: Google Analytics third-party cookie notices
- **React DevTools**: Extension installation prompts
- **RefreshRuntime errors**: Development-only React Fast Refresh
- **Dynamic import failures**: Development-only module loading

### Alert Behavior

**Critical Errors** (fail the build):
- Uncaught exceptions
- JavaScript runtime errors
- Network errors preventing page load

**Warnings** (logged but don't fail):
- CSS parsing warnings
- Deprecation notices
- Performance suggestions

---

## When to Use Each Approach

| Scenario | MCP | Playwright |
|----------|-----|------------|
| Local development | ✅ | |
| Debugging specific issue | ✅ | |
| Pre-PR smoke test | ✅ | |
| Post-deployment verification | | ✅ |
| Regression testing | | ✅ |
| CI/CD integration | | ✅ |
| Exploratory testing | ✅ | |
| Cross-browser testing | | ✅ |

**Best practice**: Use MCP during development, let Playwright catch regressions in CI.

---

## Customization

### Adding Pages to Playwright

Edit `tests/e2e/console-errors.spec.ts`:

```typescript
const pagesToTest = [
  { name: 'Home Page', url: '/' },
  { name: 'Blog', url: '/blog' },
  { name: 'New Page', url: '/new-page' },
];
```

### Adjusting Ignored Patterns

Edit `tests/e2e/console-errors.spec.ts`:

```typescript
const IGNORED_PATTERNS = [
  /cookie/i,
  /your-custom-pattern/i,
];
```

---

## Troubleshooting

### MCP: No Console Messages Showing

- Ensure you're on the correct page (`list_pages` to verify)
- Messages are cleared on navigation; use `includePreservedMessages: true` for history
- Some errors may fire before MCP connects; reload the page

### Playwright: Tests Pass Locally but Fail on CI

1. Run tests against production build:
   ```bash
   npm run build
   npm run preview
   BASE_URL=http://localhost:4173 npm run test:e2e
   ```
2. Check workflow artifacts for detailed error logs

### Playwright: Browsers Not Installed

```bash
npx playwright install chromium
```

---

## Integration with Other Tools

| Tool | Purpose |
|------|---------|
| **Sentry** | Production error tracking with stack traces |
| **Lighthouse CI** | Performance, accessibility, SEO scores |
| **RUM (web-vitals)** | Real user metrics reported to GA4 |
| **MCP Performance** | `performance_start_trace` for Core Web Vitals |

---

## Cost

- **GitHub Actions**: Free for public repositories
- **Playwright**: Free and open-source
- **Chrome DevTools MCP**: Free (local Chrome)

**Total Cost**: $0/month

---

## Resources

- [Chrome DevTools MCP](https://github.com/anthropics/anthropic-tools) - MCP server for Chrome automation
- [Playwright Documentation](https://playwright.dev/)
- [Console API Reference](https://developer.mozilla.org/en-US/docs/Web/API/Console)
- [MCP Interactive Testing Plan](plans/16-mcp-interactive-testing.md) - Detailed MCP workflows
