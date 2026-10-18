import { describe, expect, it } from 'vitest';
import {
  HEALTHY_CAPACITY_RPS,
  HORIZON_S,
  INCIDENT_START_S,
  LIMITS,
  amplificationCeiling,
  backoffDelayMs,
  buildLadder,
  drainableLoadLimitPct,
  effectiveBudgetRatio,
  findTippingPointS,
  maxAttempts,
  retryOrigin,
  simulate,
  type SimConfig,
} from './simulation';
import { DEFAULT_CONFIG, PRESETS } from './presets';

const preset = (id: string): SimConfig => {
  const found = PRESETS.find((p) => p.id === id);
  if (!found) throw new Error(`missing preset ${id}`);
  return found.config;
};

// Failover at 60% load, hard down for 15s, 3 attempts, no defenses.
const NAIVE: SimConfig = { ...DEFAULT_CONFIG, backoff: 'none' };

describe('retry arithmetic', () => {
  it('multiplies attempts across stacked layers (SRE book: 4 attempts x 3 layers = 64)', () => {
    expect(maxAttempts({ attemptsPerLayer: 4, layers: 3 })).toBe(64);
    expect(maxAttempts({ attemptsPerLayer: 3, layers: 1 })).toBe(3);
    expect(maxAttempts({ attemptsPerLayer: 1, layers: 3 })).toBe(1);
  });

  it('compounds per-layer retry budgets', () => {
    expect(effectiveBudgetRatio({ retryBudgetPct: 0, layers: 1 })).toBe(Infinity);
    expect(effectiveBudgetRatio({ retryBudgetPct: 10, layers: 1 })).toBeCloseTo(0.1);
    expect(effectiveBudgetRatio({ retryBudgetPct: 10, layers: 2 })).toBeCloseTo(0.21);
  });

  it('caps the amplification ceiling at the smaller of attempts and budget', () => {
    expect(amplificationCeiling({ ...NAIVE, attemptsPerLayer: 3 })).toBe(3);
    expect(amplificationCeiling({ ...NAIVE, retryBudgetPct: 10 })).toBeCloseTo(1.1);
    expect(amplificationCeiling({ ...NAIVE, attemptsPerLayer: 1, retryBudgetPct: 20 })).toBe(1);
  });

  it('derives the drainable load limit from the ceiling, or capacity when shedding', () => {
    expect(drainableLoadLimitPct(NAIVE)).toBeCloseTo(100 / 3);
    expect(drainableLoadLimitPct({ ...NAIVE, retryBudgetPct: 10 })).toBeCloseTo(100 / 1.1);
    expect(drainableLoadLimitPct({ ...NAIVE, shedAbandoned: true })).toBe(100);
  });

  it('numbers attempts as a mixed-radix counter, innermost layer first', () => {
    expect(retryOrigin(0, 4, 3)).toEqual({ layer: 0, retryNumber: 1 });
    expect(retryOrigin(2, 4, 3)).toEqual({ layer: 0, retryNumber: 3 });
    // Inner layer exhausted after attempt index 3: the next layer up retries.
    expect(retryOrigin(3, 4, 3)).toEqual({ layer: 1, retryNumber: 1 });
    expect(retryOrigin(15, 4, 3)).toEqual({ layer: 2, retryNumber: 1 });
    expect(retryOrigin(63, 4, 3)).toBeNull();
    expect(retryOrigin(0, 1, 3)).toBeNull();
    expect(retryOrigin(2, 3, 1)).toBeNull();
  });

  it('uses capped exponential backoff', () => {
    const config: SimConfig = { ...NAIVE, backoff: 'exponential', baseDelayMs: 100, maxDelayMs: 2000 };
    expect(backoffDelayMs(config, 1)).toBe(100);
    expect(backoffDelayMs(config, 2)).toBe(200);
    expect(backoffDelayMs(config, 5)).toBe(1600);
    expect(backoffDelayMs(config, 6)).toBe(2000);
    expect(backoffDelayMs(NAIVE, 3)).toBe(0);
  });
});

describe('simulate', () => {
  it('is deterministic', () => {
    expect(simulate(DEFAULT_CONFIG)).toEqual(simulate(DEFAULT_CONFIG));
  });

  it('returns evenly bucketed series covering the horizon', () => {
    const { series } = simulate(NAIVE, 0.5);
    expect(series.timeS).toHaveLength(HORIZON_S / 0.5);
    expect(series.timeS[0]).toBe(0);
    expect(series.timeS[series.timeS.length - 1]).toBe(HORIZON_S - 0.5);
    const duringIncident = series.timeS.findIndex((t) => t === INCIDENT_START_S + 1);
    expect(series.capacity[0]).toBe(HEALTHY_CAPACITY_RPS);
    expect(series.capacity[duringIncident]).toBe(0);
    expect(series.firstAttempts[0]).toBe(600);
  });

  it('is unaffected when degraded capacity still covers demand', () => {
    const { summary } = simulate({ ...NAIVE, loadPct: 40, degradedCapacityPct: 50 });
    expect(summary.outcome).toBe('unaffected');
    expect(summary.failedRequests).toBe(0);
    expect(summary.peakAmplification).toBe(1);
    expect(summary.recoveryLagS).toBe(0);
  });

  it('conserves requests: successes + failures never exceed demand', () => {
    for (const config of [NAIVE, DEFAULT_CONFIG, preset('hardened'), preset('deep-stack')]) {
      const { summary } = simulate(config);
      expect(summary.succeededRequests + summary.failedRequests).toBeLessThanOrEqual(summary.freshRequests + 1);
    }
    // Once recovered, almost everything is accounted for; the rest is in flight.
    const recovered = simulate(preset('hardened')).summary;
    const inFlight = recovered.freshRequests - recovered.succeededRequests - recovered.failedRequests;
    expect(inFlight).toBeLessThan(0.6 * HEALTHY_CAPACITY_RPS * 1);
  });

  it('without retries, recovers once the abandoned backlog drains', () => {
    const { summary } = simulate({ ...NAIVE, attemptsPerLayer: 1 });
    // 15s x 600 req/s queued, draining at 400 req/s: ~22s minus the last timeout.
    expect(summary.outcome).toBe('recovered');
    expect(summary.recoveryLagS).toBeGreaterThan(15);
    expect(summary.recoveryLagS).toBeLessThan(25);
    expect(summary.peakAmplification).toBe(1);
    expect(summary.wastedWorkPct).toBeGreaterThan(0);
  });

  it('with immediate retries, never recovers after the trigger ends (metastable)', () => {
    const { summary } = simulate(NAIVE);
    expect(summary.outcome).toBe('metastable');
    expect(summary.recoveryLagS).toBeNull();
    expect(summary.peakAmplification).toBe(3);
    expect(summary.wastedWorkPct).toBeGreaterThan(80);
  });

  it('backoff alone delays retries but does not stop a sustained storm', () => {
    expect(simulate({ ...NAIVE, backoff: 'exponential' }).summary.outcome).toBe('metastable');
  });

  it('a retry budget lets the backlog drain', () => {
    const { summary } = simulate({ ...NAIVE, retryBudgetPct: 10 });
    expect(summary.outcome).toBe('recovered');
    expect(summary.budgetDenied).toBeGreaterThan(0);
  });

  it('shedding abandoned work recovers within a few timeouts and wastes nothing', () => {
    const { summary } = simulate({ ...NAIVE, shedAbandoned: true });
    expect(summary.outcome).toBe('recovered');
    // Faster than draining the backlog even with no retries at all.
    expect(summary.recoveryLagS).toBeLessThanOrEqual(3 * (NAIVE.timeoutMs / 1000));
    expect(summary.recoveryLagS!).toBeLessThan(simulate({ ...NAIVE, attemptsPerLayer: 1 }).summary.recoveryLagS!);
    expect(summary.wastedWorkPct).toBe(0);
  });

  it('agrees with the analytic drainable-load limit for long triggers', () => {
    const below = { ...NAIVE, loadPct: 30, outageS: LIMITS.outageS.max };
    const above = { ...NAIVE, loadPct: 35, outageS: LIMITS.outageS.max };
    expect(below.loadPct).toBeLessThan(drainableLoadLimitPct(below));
    expect(above.loadPct).toBeGreaterThan(drainableLoadLimitPct(above));
    expect(simulate(below).summary.outcome).not.toBe('metastable');
    expect(simulate(above).summary.outcome).toBe('metastable');
  });

  it.each([90, 95])('reports a shrinking backlog at %i%% load as draining', (loadPct) => {
    const { summary } = simulate({ ...NAIVE, attemptsPerLayer: 1, loadPct, outageS: 45 });
    expect(summary.outcome).toBe('draining');
    expect(summary.recoveryLagS).toBeNull();
  });
});

describe('findTippingPointS', () => {
  it('finds the shortest trigger that locks the system up', () => {
    const tip = findTippingPointS(NAIVE);
    expect(tip).not.toBeNull();
    expect(simulate({ ...NAIVE, outageS: tip! }).summary.outcome).toBe('metastable');
    expect(simulate({ ...NAIVE, outageS: tip! - LIMITS.outageS.step }).summary.outcome).not.toBe('metastable');
  });

  it('is null when the policy recovers from the longest supported trigger', () => {
    expect(findTippingPointS(preset('hardened'))).toBeNull();
    expect(findTippingPointS({ ...NAIVE, attemptsPerLayer: 1 })).toBeNull();
  });

  it('finds no self-sustaining failure when a no-retry queue drains slowly', () => {
    const config = { ...NAIVE, attemptsPerLayer: 1, loadPct: 95, outageS: 45 };
    expect(simulate(config).summary.endBacklog).toBe(39500);
    expect(findTippingPointS(config)).toBeNull();
  });

  it('grows with the client timeout (more queue fits inside one timeout)', () => {
    const tight = findTippingPointS({ ...NAIVE, timeoutMs: 500 })!;
    const loose = findTippingPointS({ ...NAIVE, timeoutMs: 5000 })!;
    expect(loose).toBeGreaterThan(tight);
  });
});

describe('buildLadder', () => {
  it('applies defenses cumulatively and keeps the scenario', () => {
    const ladder = buildLadder(DEFAULT_CONFIG);
    expect(ladder.map((r) => r.id)).toEqual(['none', 'naive', 'backoff', 'budget', 'shed']);
    const shed = ladder[ladder.length - 1].config;
    expect(shed).toMatchObject({ backoff: 'exponential', retryBudgetPct: 10, shedAbandoned: true });
    for (const rung of ladder) {
      expect(rung.config.loadPct).toBe(DEFAULT_CONFIG.loadPct);
      expect(rung.config.outageS).toBe(DEFAULT_CONFIG.outageS);
    }
  });

  it('adds a single-layer rung only when several layers retry, and keeps the user budget', () => {
    const ladder = buildLadder({ ...preset('deep-stack'), retryBudgetPct: 20 });
    expect(ladder.map((r) => r.id)).toContain('one-layer');
    expect(ladder.find((r) => r.id === 'budget')!.config).toMatchObject({ layers: 1, retryBudgetPct: 20 });
  });

  it('uses at least two attempts so retry rungs differ from no retries', () => {
    const ladder = buildLadder({ ...DEFAULT_CONFIG, attemptsPerLayer: 1 });
    expect(ladder.find((r) => r.id === 'naive')!.config.attemptsPerLayer).toBe(2);
  });

  it('tells the expected story for the default failover', () => {
    const outcomes = Object.fromEntries(
      buildLadder(DEFAULT_CONFIG).map((r) => [r.id, simulate(r.config).summary.outcome])
    );
    expect(outcomes).toEqual({
      none: 'recovered',
      naive: 'metastable',
      backoff: 'metastable',
      budget: 'recovered',
      shed: 'recovered',
    });
  });
});

describe('presets', () => {
  it.each([
    ['failover', 'metastable'],
    ['zone-loss', 'metastable'],
    ['gc-pause', 'metastable'],
    ['deep-stack', 'metastable'],
    ['hardened', 'recovered'],
  ])('%s ends %s', (id, outcome) => {
    expect(simulate(preset(id)).summary.outcome).toBe(outcome);
  });

  it('deep-stack is fixed by retrying at one layer', () => {
    const rung = buildLadder(preset('deep-stack')).find((r) => r.id === 'one-layer')!;
    expect(simulate(rung.config).summary.outcome).not.toBe('metastable');
  });

  it('stay within control limits', () => {
    for (const { config } of PRESETS) {
      for (const key of Object.keys(LIMITS) as (keyof typeof LIMITS)[]) {
        expect(config[key]).toBeGreaterThanOrEqual(LIMITS[key].min);
        expect(config[key]).toBeLessThanOrEqual(LIMITS[key].max);
      }
    }
  });
});
