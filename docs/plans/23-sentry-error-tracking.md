# Plan: Sentry Error Tracking Enhancement

## Overview

Enhance the existing Sentry integration with source maps, error boundaries, release tracking, and improved context for better production debugging.

**Current State:** Basic Sentry integration with lazy loading and browser tracing
**Target State:** Full-featured error tracking with readable stack traces and React error boundaries

## What We Have

The site already has Sentry installed (`@sentry/react` v10.32.1) with:
- Lazy initialization via `requestIdleCallback`
- Browser tracing integration
- Environment detection (dev/prod)
- 100% trace sample rate

**Location:** `src/main.tsx:22-43`

## What's Missing

| Feature | Benefit | Effort |
|---------|---------|--------|
| Source maps upload | Readable stack traces in Sentry dashboard | Small |
| React Error Boundary | Catch and report component crashes | Small |
| Release tracking | Associate errors with deployments | Small |
| Route context | Know which page errors occur on | Small |
| Session Replay | Video-like playback for debugging (optional) | Medium |

## Implementation Plan

### Phase 1: Source Maps in CI

Upload source maps during build so Sentry can display readable stack traces.

**Install Sentry CLI:**
```bash
npm install -D @sentry/cli
```

**Add to `.github/workflows/deploy.yml`:**
```yaml
- name: Upload source maps to Sentry
  env:
    SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
    SENTRY_ORG: your-org
    SENTRY_PROJECT: personal-website
  run: |
    npx sentry-cli releases new ${{ github.sha }}
    npx sentry-cli releases files ${{ github.sha }} upload-sourcemaps ./dist --url-prefix '~/'
    npx sentry-cli releases finalize ${{ github.sha }}
```

**Required secrets:**
- `SENTRY_AUTH_TOKEN` - Generate at sentry.io/settings/auth-tokens/

### Phase 2: React Error Boundary

Wrap the app in Sentry's error boundary to catch React component crashes.

**Update `src/App.tsx`:**
```tsx
import * as Sentry from '@sentry/react';

function App() {
  return (
    <Sentry.ErrorBoundary
      fallback={<ErrorFallback />}
      showDialog
    >
      {/* existing app content */}
    </Sentry.ErrorBoundary>
  );
}

function ErrorFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
        <button onClick={() => window.location.reload()}>
          Reload page
        </button>
      </div>
    </div>
  );
}
```

### Phase 3: Release Tracking

Tag errors with the git commit SHA for correlation with deployments.

**Update `src/main.tsx`:**
```tsx
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  release: import.meta.env.VITE_COMMIT_SHA, // Add this
  tracesSampleRate: 1.0,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({ // Optional
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  replaysSessionSampleRate: 0, // Optional: enable for 10% of sessions
  replaysOnErrorSampleRate: 1.0, // Capture replay on errors
});
```

**Update `vite.config.ts`:**
```typescript
define: {
  'import.meta.env.VITE_COMMIT_SHA': JSON.stringify(process.env.GITHUB_SHA || 'local'),
},
```

### Phase 4: Route Context (Optional)

Add current route to Sentry context for easier debugging.

**Update router setup:**
```tsx
import { useLocation } from 'react-router-dom';
import * as Sentry from '@sentry/react';

function RouteTracker() {
  const location = useLocation();

  useEffect(() => {
    Sentry.setTag('route', location.pathname);
  }, [location]);

  return null;
}
```

## Checklist

- [ ] Install `@sentry/cli` as dev dependency
- [ ] Add `SENTRY_AUTH_TOKEN` to GitHub secrets
- [ ] Add source map upload step to deploy workflow
- [ ] Wrap App in `Sentry.ErrorBoundary`
- [ ] Create ErrorFallback component
- [ ] Add release tracking with commit SHA
- [ ] Update vite.config.ts with VITE_COMMIT_SHA
- [ ] Test error boundary locally
- [ ] Verify source maps appear in Sentry dashboard
- [ ] (Optional) Enable Session Replay for error sessions

## Environment Variables

| Variable | Location | Purpose |
|----------|----------|---------|
| `VITE_SENTRY_DSN` | `.env` | Sentry project DSN |
| `SENTRY_AUTH_TOKEN` | GitHub Secrets | CI source map upload |
| `VITE_COMMIT_SHA` | Build-time | Release tracking |

## Testing

1. **Error Boundary:** Temporarily throw an error in a component
2. **Source Maps:** Trigger an error in production, verify stack trace is readable
3. **Release:** Check Sentry dashboard shows release association

## Cost

- **Sentry Free Tier:** 5K errors/month, 1 user, 50 transactions/hour
- **Session Replay:** 50 replays/month on free tier

Current usage is well within free tier limits.

## Risks

| Risk | Mitigation |
|------|------------|
| Source map exposure | Sentry handles securely, not publicly accessible |
| Replay privacy | Only capture on errors, mask sensitive data |
| Build time increase | Source map upload adds ~10s to deploy |

## Resources

- [Sentry React SDK](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Source Maps Upload](https://docs.sentry.io/platforms/javascript/sourcemaps/)
- [Session Replay](https://docs.sentry.io/platforms/javascript/session-replay/)
- [Releases & Commits](https://docs.sentry.io/product/releases/)
