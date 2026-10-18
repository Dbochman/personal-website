/**
 * Retry storm model
 *
 * A deterministic, discrete-time fluid simulation of one dependency (think: a
 * database or shared backend) behind clients that retry. Requests are treated
 * as continuous "mass" rather than individual random events, so the same
 * configuration always produces the same result and jitter is modeled as an
 * even spread over the backoff window instead of random draws.
 *
 * The dependency serves a fixed number of requests per second from a FIFO
 * queue. A trigger (outage or brownout) temporarily cuts that capacity. Each
 * attempt has a client-side timeout; when it expires the client gives up on
 * that attempt and may retry, but the server still holds the abandoned
 * request unless it sheds work whose caller has already left.
 *
 * This is the feedback loop described as a metastable failure by Bronson et
 * al. (HotOS '21): once enough abandoned work piles up, the server spends its
 * capacity on requests nobody is waiting for, every caller times out, and the
 * resulting retries keep the queue full after the trigger is gone.
 *
 * It is a teaching model, not a capacity planner. See MODEL_LIMITS.
 */

// Every selectable timeout and backoff is an exact multiple of this step.
export const TICK_S = 0.05;
export const HORIZON_S = 120;
export const INCIDENT_START_S = 10;
export const HEALTHY_CAPACITY_RPS = 1000;
/** Rolling window for the retry budget (Finagle's RetryBudget default TTL is 10s). */
export const BUDGET_WINDOW_S = 10;

const TICKS = Math.round(HORIZON_S / TICK_S);
const TICKS_PER_SECOND = Math.round(1 / TICK_S);
const INCIDENT_START_TICK = Math.round(INCIDENT_START_S / TICK_S);
const EPSILON = 1e-9;

export type BackoffMode = 'none' | 'exponential';

export interface SimConfig {
  /** Fresh user demand as a percentage of the dependency's healthy capacity. */
  loadPct: number;
  /** How long the trigger lasts. */
  outageS: number;
  /** Dependency capacity during the trigger, as a percentage of healthy capacity. */
  degradedCapacityPct: number;
  /** Per-attempt client timeout. */
  timeoutMs: number;
  /** Attempts each retrying layer makes (1 = no retries). */
  attemptsPerLayer: number;
  /** How many stacked layers retry independently. */
  layers: number;
  /** Delay between a timed-out attempt and its retry. */
  backoff: BackoffMode;
  baseDelayMs: number;
  maxDelayMs: number;
  /** Nominal per-layer ratio, compounded into one aggregate dependency gate (0 = no budget). */
  retryBudgetPct: number;
  /** Server drops queued requests whose caller has already timed out. */
  shedAbandoned: boolean;
}

export const LIMITS = {
  loadPct: { min: 5, max: 95, step: 5 },
  outageS: { min: 0.5, max: 45, step: 0.5 },
  degradedCapacityPct: { min: 0, max: 90, step: 5 },
  attemptsPerLayer: { min: 1, max: 4, step: 1 },
  layers: { min: 1, max: 3, step: 1 },
} as const;

export const TIMEOUT_OPTIONS_MS = [250, 500, 1000, 2000, 5000] as const;
export const BASE_DELAY_OPTIONS_MS = [50, 100, 250, 500] as const;
export const MAX_DELAY_OPTIONS_MS = [1000, 2000, 5000, 10000] as const;
export const BUDGET_OPTIONS_PCT = [0, 5, 10, 20] as const;

export type Outcome = 'unaffected' | 'recovered' | 'draining' | 'metastable';

export interface SimSeries {
  /** Bucket start times in seconds. */
  timeS: number[];
  /** All rates are requests per second, averaged over each bucket. */
  firstAttempts: number[];
  retries: number[];
  capacity: number[];
  goodput: number[];
  wasted: number[];
  failed: number[];
}

export interface SimSummary {
  outcome: Outcome;
  incidentEndS: number;
  /** Seconds after the trigger ended until the system stayed healthy; null if it never did. */
  recoveryLagS: number | null;
  /** Peak (first attempts + retries) / fresh demand, over 1-second windows. */
  peakAmplification: number;
  freshRequests: number;
  succeededRequests: number;
  failedRequests: number;
  failedPct: number;
  /** Requests failed fast because the retry budget refused a retry (subset of failedRequests). */
  budgetDenied: number;
  /** Share of the dependency's work spent on requests whose caller had already given up. */
  wastedWorkPct: number;
  /** Queued requests (live + abandoned) at the end of the horizon. */
  endBacklog: number;
}

export interface SimResult {
  config: SimConfig;
  series: SimSeries;
  summary: SimSummary;
}

interface QueueEntry {
  arrivalTick: number;
  /** Mass that arrived this tick, indexed by attempt number (0 = first attempt). */
  byAttempt: Float64Array;
  total: number;
  remaining: number;
  expired: boolean;
}

export function maxAttempts(config: Pick<SimConfig, 'attemptsPerLayer' | 'layers'>): number {
  return config.attemptsPerLayer ** config.layers;
}

/**
 * Aggregate approximation of compounded per-layer retry budgets. The model
 * applies this ratio at one dependency admission gate, not at each layer.
 */
export function effectiveBudgetRatio(config: Pick<SimConfig, 'retryBudgetPct' | 'layers'>): number {
  if (config.retryBudgetPct <= 0) return Infinity;
  return (1 + config.retryBudgetPct / 100) ** config.layers - 1;
}

/**
 * Worst-case attempts the dependency can receive per user request once
 * everything is failing: the product of per-layer attempts, unless a retry
 * budget caps it first.
 */
export function amplificationCeiling(config: SimConfig): number {
  const product = maxAttempts(config);
  if (config.retryBudgetPct <= 0) return product;
  return Math.min(product, 1 + effectiveBudgetRatio(config));
}

/**
 * Highest demand (as % of capacity) at which the backlog always drains even
 * if every attempt is failing. Above this, the system is "vulnerable": stable
 * until a large enough trigger fills the queue with abandoned work.
 * Deadline-aware shedding removes the abandoned-work feedback loop, so the
 * limit becomes the dependency's capacity.
 */
export function drainableLoadLimitPct(config: SimConfig): number {
  if (config.shedAbandoned) return 100;
  return 100 / amplificationCeiling(config);
}

/**
 * Which layer retries after attempt `attemptIndex` (0-based) fails, and that
 * layer's own 1-based retry count. Attempts are numbered as a mixed-radix
 * counter: the innermost layer retries first; when it runs out, the next layer
 * up retries the whole subtree and the inner layer starts over.
 */
export function retryOrigin(
  attemptIndex: number,
  attemptsPerLayer: number,
  layers: number
): { layer: number; retryNumber: number } | null {
  if (attemptsPerLayer <= 1) return null;
  let n = attemptIndex;
  let layer = 0;
  while (layer < layers && n % attemptsPerLayer === attemptsPerLayer - 1) {
    n = Math.floor(n / attemptsPerLayer);
    layer += 1;
  }
  if (layer >= layers) return null;
  return { layer, retryNumber: (n % attemptsPerLayer) + 1 };
}

/**
 * Capped exponential backoff, AWS form: min(cap, base * 2^(retry - 1)).
 * The simulation applies "full jitter" by spreading retries evenly over
 * [0, delay] rather than drawing random sleeps.
 */
export function backoffDelayMs(config: SimConfig, retryNumber: number): number {
  if (config.backoff === 'none') return 0;
  return Math.min(config.maxDelayMs, config.baseDelayMs * 2 ** (retryNumber - 1));
}

function incidentEndTick(config: SimConfig): number {
  return INCIDENT_START_TICK + Math.round(config.outageS / TICK_S);
}

export function simulate(config: SimConfig, bucketS = 0.5): SimResult {
  const attempts = maxAttempts(config);
  const freshPerTick = (config.loadPct / 100) * HEALTHY_CAPACITY_RPS * TICK_S;
  const healthyCapacityPerTick = HEALTHY_CAPACITY_RPS * TICK_S;
  const degradedCapacityPerTick = (config.degradedCapacityPct / 100) * healthyCapacityPerTick;
  const endTick = incidentEndTick(config);
  const timeoutTicks = Math.max(1, Math.round(config.timeoutMs / 1000 / TICK_S));
  const budgetRatio = effectiveBudgetRatio(config);
  const budgetWindow = Math.round(BUDGET_WINDOW_S / TICK_S);

  // Retries are scheduled into a difference array per attempt class so that
  // spreading a cohort across a jitter window costs O(1).
  const maxDelayTicks = Math.ceil(config.maxDelayMs / 1000 / TICK_S) + 2;
  const scheduleLength = TICKS + maxDelayTicks + 2;
  const retryDiff = new Float64Array(scheduleLength * attempts);
  const retryRate = new Float64Array(attempts);

  const delayTicksByAttempt = new Int32Array(attempts);
  const retryAllowed = new Uint8Array(attempts);
  for (let k = 0; k < attempts; k++) {
    const origin = retryOrigin(k, config.attemptsPerLayer, config.layers);
    if (origin) {
      retryAllowed[k] = 1;
      delayTicksByAttempt[k] = Math.max(
        1,
        Math.round(backoffDelayMs(config, origin.retryNumber) / 1000 / TICK_S)
      );
    }
  }

  const firstsRing = new Float64Array(budgetWindow);
  const retriesRing = new Float64Array(budgetWindow);
  let firstsInWindow = 0;
  let retriesInWindow = 0;

  const queue: QueueEntry[] = [];
  let head = 0;
  let expiryCursor = 0;
  let backlog = 0;

  const firstAttempts = new Float64Array(TICKS);
  const retriesSent = new Float64Array(TICKS);
  const capacity = new Float64Array(TICKS);
  const goodput = new Float64Array(TICKS);
  const wasted = new Float64Array(TICKS);
  const failed = new Float64Array(TICKS);
  const backlogByTick = new Float64Array(TICKS);
  let budgetDenied = 0;

  for (let t = 0; t < TICKS; t++) {
    const inIncident = t >= INCIDENT_START_TICK && t < endTick;
    const capacityThisTick = inIncident ? degradedCapacityPerTick : healthyCapacityPerTick;
    capacity[t] = capacityThisTick;

    // 1. Arrivals: fresh demand plus retries that come due this tick.
    const byAttempt = new Float64Array(attempts);
    byAttempt[0] = freshPerTick;
    let retriesDue = 0;
    for (let k = 1; k < attempts; k++) {
      retryRate[k] += retryDiff[t * attempts + k];
      if (retryRate[k] < EPSILON) retryRate[k] = 0;
      retriesDue += retryRate[k];
    }

    const ringSlot = t % budgetWindow;
    firstsInWindow += freshPerTick - firstsRing[ringSlot];
    retriesInWindow -= retriesRing[ringSlot];
    firstsRing[ringSlot] = freshPerTick;

    let admitFraction = 1;
    if (Number.isFinite(budgetRatio) && retriesDue > 0) {
      const allowance = Math.max(0, budgetRatio * firstsInWindow - retriesInWindow);
      admitFraction = Math.min(1, allowance / retriesDue);
    }

    let retriesAdmitted = 0;
    for (let k = 1; k < attempts; k++) {
      const admitted = retryRate[k] * admitFraction;
      byAttempt[k] = admitted;
      retriesAdmitted += admitted;
    }
    const denied = retriesDue - retriesAdmitted;
    if (denied > 0) {
      failed[t] += denied;
      budgetDenied += denied;
    }
    retriesRing[ringSlot] = retriesAdmitted;
    retriesInWindow += retriesAdmitted;

    const arrivals = freshPerTick + retriesAdmitted;
    firstAttempts[t] = freshPerTick;
    retriesSent[t] = retriesAdmitted;
    queue.push({ arrivalTick: t, byAttempt, total: arrivals, remaining: arrivals, expired: false });
    backlog += arrivals;

    // 2. Service: FIFO. Abandoned requests at the head still cost capacity.
    let serviceLeft = capacityThisTick;
    while (serviceLeft > EPSILON && head < queue.length) {
      const entry = queue[head];
      const take = Math.min(entry.remaining, serviceLeft);
      if (entry.expired) wasted[t] += take;
      else goodput[t] += take;
      entry.remaining -= take;
      serviceLeft -= take;
      backlog -= take;
      if (entry.remaining <= EPSILON) {
        backlog -= entry.remaining;
        entry.remaining = 0;
        head += 1;
      }
    }

    // 3. Client timeouts: anything that has waited `timeoutTicks` ticks is
    //    abandoned. The caller retries (or gives up); the server may keep it.
    if (expiryCursor < head) expiryCursor = head;
    while (expiryCursor < queue.length && queue[expiryCursor].arrivalTick <= t - timeoutTicks + 1) {
      const entry = queue[expiryCursor];
      if (entry.remaining > EPSILON && entry.total > 0) {
        const fraction = entry.remaining / entry.total;
        for (let k = 0; k < attempts; k++) {
          const mass = entry.byAttempt[k] * fraction;
          if (mass <= 0) continue;
          if (!retryAllowed[k]) {
            failed[t] += mass;
            continue;
          }
          const span = delayTicksByAttempt[k];
          const startTick = t + 1;
          const perTick = mass / span;
          retryDiff[startTick * attempts + k + 1] += perTick;
          retryDiff[(startTick + span) * attempts + k + 1] -= perTick;
        }
        if (config.shedAbandoned) {
          backlog -= entry.remaining;
          entry.remaining = 0;
        }
      }
      entry.expired = true;
      expiryCursor += 1;
    }
    if (config.shedAbandoned) {
      while (head < queue.length && queue[head].remaining <= EPSILON) head += 1;
    }

    backlogByTick[t] = Math.max(0, backlog);
  }

  const summary = summarize({
    freshPerTick,
    firstAttempts,
    retriesSent,
    goodput,
    wasted,
    failed,
    backlogByTick,
    budgetDenied,
    endTick,
  });

  return {
    config,
    series: bucketSeries(bucketS, { firstAttempts, retriesSent, capacity, goodput, wasted, failed }),
    summary,
  };
}

interface RawSeries {
  freshPerTick: number;
  firstAttempts: Float64Array;
  retriesSent: Float64Array;
  goodput: Float64Array;
  wasted: Float64Array;
  failed: Float64Array;
  backlogByTick: Float64Array;
  budgetDenied: number;
  endTick: number;
}

/** A tick is healthy when callers get (nearly) everything they asked for. */
function isHealthyTick(raw: RawSeries, t: number): boolean {
  return raw.goodput[t] >= 0.98 * raw.freshPerTick && raw.failed[t] <= 0.01 * raw.freshPerTick;
}

function summarize(raw: RawSeries): SimSummary {
  let impacted = false;
  for (let t = 0; t < TICKS; t++) {
    if (!isHealthyTick(raw, t)) {
      impacted = true;
      break;
    }
  }

  let recoveredTick: number | null = null;
  if (isHealthyTick(raw, TICKS - 1)) {
    let t = TICKS - 1;
    while (t > raw.endTick && isHealthyTick(raw, t - 1)) t -= 1;
    recoveredTick = t;
  }

  let outcome: Outcome;
  if (!impacted) outcome = 'unaffected';
  else if (recoveredTick !== null) outcome = 'recovered';
  else {
    const lookback = TICKS - 1 - 10 * TICKS_PER_SECOND;
    // Any meaningful decrease is draining. A percentage threshold incorrectly
    // labels large, slowly clearing queues as self-sustaining failures.
    const shrinking = raw.backlogByTick[lookback] - raw.backlogByTick[TICKS - 1] > EPSILON;
    outcome = shrinking ? 'draining' : 'metastable';
  }

  let peakAmplification = 1;
  for (let start = 0; start + TICKS_PER_SECOND <= TICKS; start += 1) {
    let sent = 0;
    for (let t = start; t < start + TICKS_PER_SECOND; t++) {
      sent += raw.firstAttempts[t] + raw.retriesSent[t];
    }
    peakAmplification = Math.max(peakAmplification, sent / (raw.freshPerTick * TICKS_PER_SECOND));
  }

  let totalFailed = 0;
  let totalWasted = 0;
  let totalGood = 0;
  for (let t = 0; t < TICKS; t++) {
    totalFailed += raw.failed[t];
    totalWasted += raw.wasted[t];
    totalGood += raw.goodput[t];
  }
  const freshRequests = raw.freshPerTick * TICKS;
  const served = totalWasted + totalGood;

  return {
    outcome,
    incidentEndS: raw.endTick * TICK_S,
    recoveryLagS:
      outcome === 'unaffected'
        ? 0
        : recoveredTick === null
          ? null
          : roundTo(Math.max(0, recoveredTick - raw.endTick) * TICK_S, 2),
    peakAmplification: roundTo(peakAmplification, 2),
    freshRequests: Math.round(freshRequests),
    succeededRequests: Math.round(totalGood),
    failedRequests: Math.round(totalFailed),
    failedPct: roundTo((totalFailed / freshRequests) * 100, 1),
    budgetDenied: Math.round(raw.budgetDenied),
    wastedWorkPct: served > 0 ? roundTo((totalWasted / served) * 100, 1) : 0,
    endBacklog: Math.round(raw.backlogByTick[TICKS - 1]),
  };
}

function bucketSeries(
  bucketS: number,
  raw: {
    firstAttempts: Float64Array;
    retriesSent: Float64Array;
    capacity: Float64Array;
    goodput: Float64Array;
    wasted: Float64Array;
    failed: Float64Array;
  }
): SimSeries {
  const ticksPerBucket = Math.max(1, Math.round(bucketS / TICK_S));
  const toRate = 1 / (ticksPerBucket * TICK_S);
  const series: SimSeries = {
    timeS: [],
    firstAttempts: [],
    retries: [],
    capacity: [],
    goodput: [],
    wasted: [],
    failed: [],
  };
  for (let start = 0; start < TICKS; start += ticksPerBucket) {
    const end = Math.min(TICKS, start + ticksPerBucket);
    const sum = (values: Float64Array) => {
      let total = 0;
      for (let t = start; t < end; t++) total += values[t];
      return Math.round(total * toRate);
    };
    series.timeS.push(roundTo(start * TICK_S, 2));
    series.firstAttempts.push(sum(raw.firstAttempts));
    series.retries.push(sum(raw.retriesSent));
    series.capacity.push(sum(raw.capacity));
    series.goodput.push(sum(raw.goodput));
    series.wasted.push(sum(raw.wasted));
    series.failed.push(sum(raw.failed));
  }
  return series;
}

function roundTo(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

/**
 * Shortest trigger (at the configured capacity drop) that leaves the system
 * in a self-sustaining failure. Returns null if even the longest supported
 * trigger has no growing backlog at the horizon; it may still be draining.
 * Assumes longer triggers are never safer, which
 * holds for this model because they only add backlog.
 */
export function findTippingPointS(config: SimConfig): number | null {
  const isStuck = (outageS: number) => simulate({ ...config, outageS }).summary.outcome === 'metastable';
  const step = LIMITS.outageS.step;
  if (!isStuck(LIMITS.outageS.max)) return null;
  if (isStuck(step)) return step;
  let lo = 1; // in steps; known not stuck
  let hi = Math.round(LIMITS.outageS.max / step); // known stuck
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2);
    if (isStuck(mid * step)) hi = mid;
    else lo = mid;
  }
  return hi * step;
}

export interface LadderRung {
  id: 'none' | 'naive' | 'backoff' | 'one-layer' | 'budget' | 'shed';
  label: string;
  detail: string;
  config: SimConfig;
}

/**
 * Cumulative defenses applied to the current scenario, in the order they are
 * usually adopted. Each rung keeps the previous rung's changes.
 */
export function buildLadder(config: SimConfig): LadderRung[] {
  const attemptsPerLayer = Math.max(2, config.attemptsPerLayer);
  const naive: SimConfig = {
    ...config,
    attemptsPerLayer,
    backoff: 'none',
    retryBudgetPct: 0,
    shedAbandoned: false,
  };
  const rungs: LadderRung[] = [
    {
      id: 'none',
      label: 'No retries',
      detail: 'One attempt; failures go straight to the user.',
      config: { ...naive, attemptsPerLayer: 1 },
    },
    {
      id: 'naive',
      label: 'Immediate retries',
      detail: `${attemptsPerLayer} attempts at each of ${config.layers} layer${config.layers === 1 ? '' : 's'}, no delay.`,
      config: naive,
    },
  ];
  const backoff: SimConfig = { ...naive, backoff: 'exponential' };
  rungs.push({
    id: 'backoff',
    label: '+ Backoff with jitter',
    detail: `Exponential from ${formatMs(config.baseDelayMs)}, capped at ${formatMs(config.maxDelayMs)}.`,
    config: backoff,
  });
  let previous = backoff;
  if (config.layers > 1) {
    previous = { ...backoff, layers: 1 };
    rungs.push({
      id: 'one-layer',
      label: '+ Retry at one layer',
      detail: 'Only the caller closest to the dependency retries.',
      config: previous,
    });
  }
  const budgetPct = config.retryBudgetPct > 0 ? config.retryBudgetPct : 10;
  const budget: SimConfig = { ...previous, retryBudgetPct: budgetPct };
  rungs.push({
    id: 'budget',
    label: `+ ${budgetPct}% retry budget`,
    detail: `Retries capped at ${budgetPct}% of first attempts.`,
    config: budget,
  });
  rungs.push({
    id: 'shed',
    label: '+ Shed abandoned work',
    detail: 'Server drops queued requests whose caller already timed out.',
    config: { ...budget, shedAbandoned: true },
  });
  return rungs;
}

export function formatMs(ms: number): string {
  return ms >= 1000 ? `${ms / 1000}s` : `${ms}ms`;
}

export function formatMultiplier(value: number): string {
  return `${value >= 10 ? Math.round(value) : Math.round(value * 10) / 10}×`;
}

export const MODEL_LIMITS = [
  'Open-loop traffic: new requests keep arriving at a constant rate no matter how the dependency behaves. Closed-loop callers (workers that wait before sending more) self-throttle, so backoff helps them more than it does here.',
  'Requests are a continuous fluid, not random events. There is no queueing noise below capacity, and jitter is an even spread instead of random draws, so de-synchronization effects (thundering herds after a reconnect, for example) are not shown.',
  'The dependency has fixed capacity and a single unbounded FIFO queue. Rejections, LIFO/CoDel queues, autoscaling, cache warm-up and per-request cost differences are not modeled.',
  'Stacked layers share one timeout. Real outer layers usually have longer deadlines that cut inner retries short, so the worst-case product is an upper bound.',
  'Retry budgets are an aggregate approximation: the nominal ratio is compounded as (1 + ratio)^layers - 1, then enforced by one rolling 10-second admission gate at the dependency. There is no separate accounting at each layer, so transient behavior differs from independently enforced per-layer budgets. Envoy limits concurrent retries instead, and gRPC throttles on recent failures.',
];
