# Async UX Guidelines

## Purpose
Provide consistent patterns for building fully async UI in this codebase.

## Core Principles
- Keep input responsive; move heavy work off the main thread.
- Treat async results as optional; show best-effort output while processing.
- Prefer incremental updates over blocking UI.

## Debounce and Throttle
- Debounce parsing/validation on input (150-300ms typical).
- Throttle expensive redraws during drag/scroll.
- Always cancel stale tasks to avoid out-of-order updates.

## Web Workers
- Use workers for parsing, linting, analysis, and bulk computations.
- Use message IDs or AbortController to cancel stale requests.
- Report structured errors for inline display.

## React Concurrency
- Wrap async-driven UI updates in `startTransition`.
- Keep form inputs uncontrolled or minimally controlled where possible.

## Loading States
- Prefer non-blocking spinners or inline "Processing..." badges.
- Show partial results when safe (e.g., last valid parse).
- Avoid full-screen loaders for local-only tasks.

## Error Handling
- Show inline errors near the source input.
- Keep last valid result visible on parse errors.
- Provide quick actions (retry, reset to example).

## Accessibility
- Announce async status changes via polite `aria-live` regions.
- Ensure loading and error states are keyboard navigable.

## Performance Targets
- Typical input-to-preview update under 250ms.
- Worker tasks under 500ms for common inputs.
- Maintain 50fps during scroll and drag interactions.

## Telemetry (Optional)
- Log parse times and error rates for tuning (client-side only).
- Avoid sending user content externally.

## Testing
- Unit tests for async pipelines and cancellation logic.
- UI tests for loading, error, and stale-result handling.

