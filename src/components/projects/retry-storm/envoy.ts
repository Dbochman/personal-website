import { formatMs, type SimConfig } from './simulation';

/** Envoy's documented defaults when retry_back_off is omitted. */
export const ENVOY_DEFAULT_BASE_INTERVAL_MS = 25;
export const ENVOY_DEFAULT_ROUTE_TIMEOUT_MS = 15000;

function seconds(ms: number): string {
  return `${ms / 1000}s`;
}

function envoyBackoff(config: SimConfig): { baseMs: number; maxMs: number } {
  if (config.backoff === 'exponential') {
    return { baseMs: config.baseDelayMs, maxMs: config.maxDelayMs };
  }
  // Without retry_back_off Envoy still backs off: 25ms base, max 10x base.
  return { baseMs: ENVOY_DEFAULT_BASE_INTERVAL_MS, maxMs: 10 * ENVOY_DEFAULT_BASE_INTERVAL_MS };
}

/**
 * Route timeout that leaves room for every attempt at this hop: each
 * per-try timeout plus the worst-case backoff before each retry. Envoy's
 * fully jittered backoff for retry N falls in [0, (2^N - 1) * base], capped at
 * max_interval. Rounded up to the next 100ms.
 */
export function envoyRouteTimeoutMs(config: SimConfig): number {
  const retries = config.attemptsPerLayer - 1;
  const { baseMs, maxMs } = envoyBackoff(config);
  let backoff = 0;
  for (let n = 1; n <= retries; n++) {
    backoff += Math.min(maxMs, (2 ** n - 1) * baseMs);
  }
  const total = config.attemptsPerLayer * config.timeoutMs + backoff;
  return Math.ceil(total / 100) * 100;
}

/**
 * Translate the simulated client policy into Envoy v3 config fragments.
 * Field names follow config.route.v3.RouteAction / RetryPolicy and
 * config.cluster.v3.CircuitBreakers.Thresholds.RetryBudget. The output is two
 * fragments for different config contexts, not a standalone file, and the
 * comments say where Envoy differs from the model.
 */
export function envoyRetryConfig(config: SimConfig): string {
  const retries = config.attemptsPerLayer - 1;
  const withBudget = retries > 0 && config.retryBudgetPct > 0;
  const routeTimeoutMs = envoyRouteTimeoutMs(config);
  const backoffBudgetMs = routeTimeoutMs - config.attemptsPerLayer * config.timeoutMs;

  const lines: string[] = [
    '# Starting point generated from the Retry Storm Simulator.',
    `# NOT a standalone config: ${withBudget ? 'two fragments' : 'a fragment'} for specific places in an`,
    '# Envoy v3 config. Merge into your own config and review against real traffic.',
  ];

  if (retries > 0) {
    lines.push(
      '#',
      '# Only retry requests that are safe to replay: idempotent operations, or',
      '# writes carrying an idempotency key the server deduplicates. "5xx" and',
      '# "reset" can retry a request the upstream already received. For anything',
      '# else, use retry_on: "reset-before-request,connect-failure" or no retries.'
    );
  }

  if (config.layers > 1) {
    lines.push(
      '#',
      `# The simulation retried at ${config.layers} layers (up to ${config.attemptsPerLayer ** config.layers} attempts per request).`,
      '# Configure retries on ONE hop and set num_retries: 0 everywhere else.'
    );
  }

  lines.push(
    '',
    `# Fragment 1${withBudget ? ' of 2' : ''}: fields of a route's RouteAction (route.v3.RouteAction),`,
    '# i.e. under `route:` in a route entry of your RouteConfiguration.',
    `# The route timeout includes every retry and defaults to ${seconds(ENVOY_DEFAULT_ROUTE_TIMEOUT_MS)}.`
  );
  if (retries > 0) {
    lines.push(
      `# ${seconds(routeTimeoutMs)} covers ${config.attemptsPerLayer} attempts x ${seconds(config.timeoutMs)} per try plus up to`,
      `# ${seconds(backoffBudgetMs)} of backoff; a shorter timeout cuts later retries off. If the`,
      "# caller's own deadline is shorter still, retries after it are wasted."
    );
  }
  lines.push(
    `timeout: ${seconds(routeTimeoutMs)}`,
    'retry_policy:',
    '  retry_on: "5xx,reset,connect-failure"',
    `  num_retries: ${retries}`,
    `  per_try_timeout: ${seconds(config.timeoutMs)}`
  );

  if (retries > 0 && config.backoff === 'exponential') {
    lines.push(
      '  retry_back_off:',
      '    # Envoy uses fully jittered exponential backoff.',
      `    base_interval: ${seconds(config.baseDelayMs)}`,
      `    max_interval: ${seconds(config.maxDelayMs)}`
    );
  } else if (retries > 0) {
    lines.push(
      '  # Envoy has no zero-delay option: without retry_back_off it uses',
      '  # jittered backoff with a 25ms base. Prefer an explicit base_interval.'
    );
  }

  if (withBudget) {
    lines.push(
      '',
      '# Fragment 2 of 2: a field of the upstream Cluster (cluster.v3.Cluster), not the route.',
      '# Envoy caps concurrent retries as a share of active requests; the',
      `# simulation caps retries at ${config.retryBudgetPct}% of first attempts. Similar intent, not identical.`,
      'circuit_breakers:',
      '  thresholds:',
      '    - priority: DEFAULT',
      '      retry_budget:',
      `        budget_percent: { value: ${config.retryBudgetPct}.0 }`,
      '        min_retry_concurrency: 3'
    );
  } else if (retries > 0) {
    lines.push(
      '',
      '# No retry budget configured. Envoy still limits parallel retries per',
      '# cluster (circuit_breakers.thresholds.max_retries, default 3), but that',
      '# is an absolute cap rather than a share of traffic.'
    );
  }

  if (config.shedAbandoned) {
    lines.push(
      '',
      '# Shedding abandoned work happens in the server, not the proxy: propagate',
      `# the caller's deadline (gRPC deadlines or x-envoy-expected-rq-timeout-ms)`,
      `# and drop queued work once it has passed. Here that is ~${formatMs(config.timeoutMs)}.`
    );
  }

  return `${lines.join('\n')}\n`;
}
