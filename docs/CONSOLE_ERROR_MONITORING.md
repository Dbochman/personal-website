# Console Error Monitoring

This document describes the automated console error monitoring system that runs after each deployment.

## Overview

The site has Playwright-based end-to-end tests that automatically check for console errors and warnings on production after each deployment. This helps catch JavaScript errors, runtime issues, and console warnings before they impact users.

## How It Works

After every successful deployment:
1. GitHub Actions waits 30 seconds for deployment to propagate
2. Playwright loads the production site (`https://dylanbochman.com`)
3. Captures all console errors and warnings
4. Filters out known/acceptable messages (cookies, dev tools, etc.)
5. Fails the build if critical errors are found
6. Creates a GitHub issue with details if errors are detected

## Monitored Pages

- **Home Page**: `/`
- **Runbook Page**: `/runbook.html`

## Running Tests Locally

```bash
# Run console error checks (requires dev server to be running)
npm run test:e2e

# Run tests with UI (interactive mode)
npm run test:e2e:ui

# Run tests with browser visible (headed mode)
npm run test:e2e:headed
```

## Ignored Patterns

The following console messages are intentionally ignored as they're expected or non-critical:

- **Cookie warnings**: Google Analytics third-party cookie notices
- **React DevTools**: Extension installation prompts
- **RefreshRuntime errors**: Development-only React Fast Refresh (HMR) errors
- **Dynamic import failures**: Development-only module loading issues

## Workflow Details

**Workflow file**: `.github/workflows/console-check.yml`

**Triggered by**:
- Successful completion of the "Build, Test, and Deploy" workflow
- Manual trigger via GitHub Actions UI

**Duration**: ~2-3 minutes

**Retention**: Test results and screenshots saved for 30 days

## Viewing Results

### GitHub Actions UI

1. Go to **Actions** tab
2. Select **Console Error Check** workflow
3. Click on the latest run
4. View the **Summary** tab

### Artifacts

If tests fail, artifacts include:
- Console error logs (`test-results/console-errors.json`)
- Screenshots of failures
- Full Playwright HTML report

### GitHub Issues

When console errors are detected, an automated issue is created with:
- **Title**: `🚨 Console Errors Detected (YYYY-MM-DD)`
- **Labels**: `bug`, `console-error`, `automated`
- **Content**:
  - Error details
  - Link to workflow run
  - Instructions for reproducing locally
  - Links to artifacts

## Alert Behavior

**Critical Errors** (fail the build):
- Uncaught exceptions
- JavaScript runtime errors
- Network errors preventing page load

**Warnings** (logged but don't fail):
- CSS parsing warnings
- Deprecation notices
- Performance suggestions

## Local Development

The Playwright config automatically starts the dev server when running tests locally:

```bash
# Start dev server manually (optional)
npm run dev

# Run tests (will use existing server if already running)
npm run test:e2e
```

## Customization

### Adding Pages to Monitor

Edit `tests/e2e/console-errors.spec.ts`:

```typescript
const pagesToTest = [
  { name: 'Home Page', url: '/' },
  { name: 'Runbook Page', url: '/runbook.html' },
  { name: 'New Page', url: '/new-page.html' }, // Add new page here
];
```

### Adjusting Ignored Patterns

Edit `tests/e2e/console-errors.spec.ts`:

```typescript
const IGNORED_PATTERNS = [
  /cookie/i,
  /your-custom-pattern/i, // Add your pattern here
];
```

### Changing Test Timeout

Edit `playwright.config.ts`:

```typescript
export default defineConfig({
  timeout: 60 * 1000, // Change from 30s to 60s
});
```

## Troubleshooting

### Tests Fail Locally

**Issue**: Tests timeout or fail to connect

**Solution**:
```bash
# Ensure dev server is running on port 8080
npm run dev

# Check the port in vite.config.ts matches playwright.config.ts
```

### Tests Pass Locally but Fail on CI

**Issue**: Production has errors that local dev doesn't

**Solution**:
1. Run tests against production build locally:
   ```bash
   npm run build
   npm run preview
   BASE_URL=http://localhost:4173 npm run test:e2e
   ```
2. Check the workflow artifacts for detailed error logs

### Playwright Browsers Not Installed

**Issue**: `Executable doesn't exist` error

**Solution**:
```bash
npx playwright install chromium
```

## Integration with Other Tools

### Sentry

For production error tracking beyond console monitoring, consider integrating Sentry:
- Captures uncaught exceptions
- Provides stack traces and user context
- Alerts in real-time

### Lighthouse CI

This monitoring complements the existing Lighthouse CI checks:
- Lighthouse: Performance, accessibility, SEO scores
- Console monitoring: Runtime errors and warnings

## Cost

- **GitHub Actions**: Free for public repositories
- **Playwright**: Free and open-source
- **Storage**: Artifacts retained for 30 days (included in free tier)

**Total Cost**: $0/month

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [GitHub Actions Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [Console API Reference](https://developer.mozilla.org/en-US/docs/Web/API/Console)
