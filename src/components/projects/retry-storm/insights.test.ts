import { describe, expect, it } from 'vitest';
import { envoyRetryConfig, envoyRouteTimeoutMs } from './envoy';
import { buildTakeaways, chartSummary, describeOutcome } from './insights';
import { DEFAULT_CONFIG, PRESETS } from './presets';
import { findTippingPointS, simulate, type SimConfig } from './simulation';

const hardened = PRESETS.find((p) => p.id === 'hardened')!.config;
const deepStack = PRESETS.find((p) => p.id === 'deep-stack')!.config;

function verdictFor(config: SimConfig) {
  return describeOutcome(config, simulate(config).summary);
}

describe('describeOutcome', () => {
  it('bounds an unrecovered run by the horizon and separates observation from model bound', () => {
    const verdict = verdictFor(DEFAULT_CONFIG);
    expect(verdict.tone).toBe('bad');
    expect(verdict.title).toBe('Not recovered by 120s: the trigger ended at 25s');
    expect(verdict.detail).toMatch(/^Observed: the backlog was still growing when the run ended/);
    expect(verdict.detail).toContain('Model bound: once every response arrives late, retries can hold demand at 3× normal (180% of capacity)');
    expect(verdict.title + verdict.detail).not.toMatch(/never/i);
  });

  it('calls a quick recovery good and mentions budget-denied requests', () => {
    const verdict = verdictFor(hardened);
    expect(verdict.tone).toBe('good');
    expect(verdict.detail).toMatch(/retry budget failed [\d,]+ requests fast/);
  });

  it('warns when recovery waits on a backlog drain', () => {
    const verdict = verdictFor({ ...DEFAULT_CONFIG, attemptsPerLayer: 1 });
    expect(verdict.tone).toBe('warn');
    expect(verdict.title).toMatch(/^Recovered, but [\d.]+s after capacity returned$/);
  });

  it('does not claim errors when a short trigger only delayed requests', () => {
    const config = { ...DEFAULT_CONFIG, outageS: 0.5 };
    expect(simulate(config).summary.failedRequests).toBe(0);
    expect(verdictFor(config)).toMatchObject({
      tone: 'good',
      detail: 'Requests queued during the trigger, but every caller got an answer before timing out.',
    });
  });

  it('reports draining and no-impact outcomes', () => {
    expect(verdictFor({ ...DEFAULT_CONFIG, attemptsPerLayer: 1, loadPct: 90, outageS: 45 }).title).toBe(
      'Still draining at 120s'
    );
    const unaffected = verdictFor({ ...DEFAULT_CONFIG, loadPct: 30, degradedCapacityPct: 50 });
    expect(unaffected).toMatchObject({ tone: 'good', title: 'No impact' });
  });
});

describe('buildTakeaways', () => {
  const ids = (config: SimConfig) => {
    const { summary } = simulate(config);
    return buildTakeaways(config, summary, findTippingPointS(config)).map((t) => t.id);
  };

  it('recommends budget, shedding and headroom for the default failover', () => {
    expect(ids(DEFAULT_CONFIG)).toEqual(['budget', 'shed', 'backoff-limits', 'headroom']);
  });

  it('recommends retrying at one layer for stacked retries', () => {
    expect(ids(deepStack)[0]).toBe('one-layer');
  });

  it('qualifies the 1.1x budget claim by the number of retrying layers', () => {
    const budgetBody = (config: SimConfig) =>
      buildTakeaways(config, simulate(config).summary, null).find((t) => t.id === 'budget')!.body;
    expect(budgetBody(DEFAULT_CONFIG)).toMatch(/^With a single retrying layer, .* near 1\.1×/);
    expect(budgetBody(deepStack)).toContain('budgets at 3 stacked layers compound in this model to about 1.33×');
  });

  it('frames load limits and tipping points as model results', () => {
    const { summary } = simulate(DEFAULT_CONFIG);
    const headroom = buildTakeaways(DEFAULT_CONFIG, summary, 1.5).find((t) => t.id === 'headroom')!;
    expect(headroom.body).toMatch(/^In this model, /);
    expect(headroom.body).toContain('unrecovered at 120s');
    expect(headroom.body).toContain('not as thresholds');
  });

  it('suggests backoff when retries are immediate', () => {
    expect(ids({ ...DEFAULT_CONFIG, backoff: 'none' })).toContain('backoff');
  });

  it('reports no growing-backlog threshold without promising recovery', () => {
    const { summary } = simulate(hardened);
    const takeaways = buildTakeaways(hardened, summary, null);
    expect(takeaways).toHaveLength(1);
    expect(takeaways[0]).toMatchObject({ id: 'robust', title: 'No growing-backlog threshold found' });
    expect(takeaways[0].body).toContain('a backlog may still be draining');
    expect(takeaways[0].body).toContain('not a guarantee for a real system');
  });
});

describe('chartSummary', () => {
  it('describes the chart for screen readers', () => {
    const { summary } = simulate(DEFAULT_CONFIG);
    const text = chartSummary(DEFAULT_CONFIG, summary, describeOutcome(DEFAULT_CONFIG, summary));
    expect(text).toContain('Capacity drops to 0% from 10s to 25s.');
    expect(text).toContain('Peak offered load is 3 times normal demand.');
    expect(text).toContain('Not recovered by 120s');
  });
});

describe('envoyRetryConfig', () => {
  it('labels the output as context-specific fragments, not a standalone config', () => {
    expect(envoyRetryConfig(DEFAULT_CONFIG)).toContain('NOT a standalone config: a fragment');
    const hardenedYaml = envoyRetryConfig(hardened);
    expect(hardenedYaml).toContain('NOT a standalone config: two fragments');
    expect(hardenedYaml).toContain("# Fragment 1 of 2: fields of a route's RouteAction (route.v3.RouteAction)");
    expect(hardenedYaml).toContain('# Fragment 2 of 2: a field of the upstream Cluster (cluster.v3.Cluster)');
  });

  it('warns to retry only replay-safe requests', () => {
    const yaml = envoyRetryConfig(DEFAULT_CONFIG);
    expect(yaml).toContain('Only retry requests that are safe to replay');
    expect(yaml).toContain('idempotency key');
    expect(yaml).toContain('reset-before-request,connect-failure');
    expect(envoyRetryConfig({ ...DEFAULT_CONFIG, attemptsPerLayer: 1 })).not.toContain('safe to replay');
  });

  it('budgets the route timeout for every attempt plus worst-case backoff', () => {
    // 3 x 1s per try + min(2s, 1 x 0.1s) + min(2s, 3 x 0.1s) = 3.4s
    expect(envoyRouteTimeoutMs(DEFAULT_CONFIG)).toBe(3400);
    // Immediate retries still get Envoy's default 25ms base (max 250ms): 3s + 25 + 75 -> 3.1s
    expect(envoyRouteTimeoutMs({ ...DEFAULT_CONFIG, backoff: 'none' })).toBe(3100);
    // Backoff capped by max_interval: 4 x 5s + min(1s, 0.5) + min(1s, 1.5) + min(1s, 3.5) = 22.5s
    expect(
      envoyRouteTimeoutMs({ ...DEFAULT_CONFIG, attemptsPerLayer: 4, timeoutMs: 5000, baseDelayMs: 500, maxDelayMs: 1000 })
    ).toBe(22500);
    expect(envoyRouteTimeoutMs({ ...DEFAULT_CONFIG, attemptsPerLayer: 1 })).toBe(1000);

    const yaml = envoyRetryConfig(DEFAULT_CONFIG);
    expect(yaml).toContain('timeout: 3.4s');
    expect(yaml).toContain('The route timeout includes every retry and defaults to 15s.');
    expect(yaml).toContain('3.4s covers 3 attempts x 1s per try plus up to');
  });

  it('maps attempts, timeout and backoff onto a route retry policy', () => {
    const yaml = envoyRetryConfig(DEFAULT_CONFIG);
    expect(yaml).toContain('num_retries: 2');
    expect(yaml).toContain('per_try_timeout: 1s');
    expect(yaml).toContain('base_interval: 0.1s');
    expect(yaml).toContain('max_interval: 2s');
    expect(yaml).not.toContain('retry_budget:');
    expect(yaml).toContain('max_retries, default 3');
  });

  it('adds a cluster retry budget and deadline guidance for the hardened policy', () => {
    const yaml = envoyRetryConfig(hardened);
    expect(yaml).toContain('budget_percent: { value: 10.0 }');
    expect(yaml).toContain('min_retry_concurrency: 3');
    expect(yaml).toContain('x-envoy-expected-rq-timeout-ms');
  });

  it('warns about Envoy default backoff when the model retries immediately', () => {
    const yaml = envoyRetryConfig({ ...DEFAULT_CONFIG, backoff: 'none' });
    expect(yaml).not.toContain('retry_back_off:');
    expect(yaml).toContain('25ms base');
  });

  it('tells stacked layers to retry at one hop only', () => {
    expect(envoyRetryConfig(deepStack)).toContain('up to 64 attempts per request');
  });

  it('disables retries cleanly', () => {
    const yaml = envoyRetryConfig({ ...DEFAULT_CONFIG, attemptsPerLayer: 1, retryBudgetPct: 10 });
    expect(yaml).toContain('num_retries: 0');
    expect(yaml).not.toContain('retry_back_off');
    expect(yaml).not.toContain('retry_budget');
  });
});
