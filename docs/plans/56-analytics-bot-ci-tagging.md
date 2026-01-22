# Analytics Bot & CI Traffic Tagging

## Goal
Tag suspicious and automation-driven sessions with a GA4 custom dimension so analytics remain intact while enabling bot trend analysis.

**Effort:** Short (1-4h)

## Non-Goals
- Blocking, filtering, or throttling traffic sources.
- Server-side or network lookups (e.g., IP geolocation, bot APIs).
- Building new external dashboards beyond existing GA4 Data Studio views.

## Users & Use Cases
- Site owner auditing traffic quality and campaign performance.
- Maintainers reviewing CI run coverage and automated checks hitting the site.
- Analysts comparing behavior between human visitors and automated probes.

## Functional Requirements
- Implement a client-side classifier that labels sessions as `human`, `bot`, or `ci` using indicators:
  - User agent patterns (Googlebot, Bingbot, HeadlessChrome, Playwright, GitHub Actions, etc.).
  - Zero-scroll / zero-interaction within configurable observation window.
  - Requests to known probe paths (`/wp-admin`, `/xmlrpc.php`, `/.env`, etc.).
- Store the classification decision once per session and reuse across page navigations (SPA routing).
- Surface the classification via a GA4 event parameter and session-scoped custom dimension named `traffic_type`.
- Apply tagging on the initial pageview before other GA4 events fire.
- Expose a lightweight toggle/filter in existing GA4 dashboard or Exploration to slice metrics by traffic type.
- Document newly detected patterns and update indicator lists in repo docs.

## UX Requirements
- Preserve existing page load experience; classification must be non-blocking and invisible to end users.
- Ensure GA4 dashboards include `traffic_type` dimension with a preset filter control for analysts.

## Data Model
```typescript
export type TrafficType = 'human' | 'bot' | 'ci';

export interface TrafficIndicators {
  userAgent: string;
  knownBotPattern?: string; // matched regex/substring for debugging
  ciPattern?: string;
  visitedProbePath: boolean;
  recordedScroll: boolean;
  recordedInteraction: boolean;
  observationMs: number;
}

export interface TrafficClassification {
  type: TrafficType;
  confidence: 'high' | 'medium' | 'low';
  indicators: TrafficIndicators;
  detectedAt: number; // epoch ms stored in session
}

export interface TrafficSessionCache {
  classification: TrafficClassification;
  gaDimensionSet: boolean;
}
```

## Error Handling & Empty States
- Default to `human` when indicators are inconclusive or classification utility throws.
- Guard GA4 calls; if analytics library is unavailable, degrade silently while logging to console in development.
- Reset session cache if storage access fails (e.g., private mode) without impacting user navigation.

## Test Plan
- Unit tests for classifier logic covering:
  - Distinct user agent patterns (bot, CI, human).
  - Interaction scenarios (scroll, clicks) toggling classification.
  - Probe path detection.
- Integration test (Jest + DOM mocks) validating GA4 tagging receives expected event parameter.
- Manual verification: open site locally with bot-like user agents and confirm GA4 DebugView shows `traffic_type`.
- Regression smoke: ensure human browsing still tags as `human`.

## Dependencies
- Existing GA4 configuration: add `traffic_type` event parameter in code and register a session-scoped custom dimension in GA4 Admin (scope: Session, event parameter: `traffic_type`, description noting possible values).
- Current React/TypeScript analytics wrapper (extend to inject classification before pageview).
- Maintained list of bot/CI user agent substrings stored in repo docs for ongoing updates.
