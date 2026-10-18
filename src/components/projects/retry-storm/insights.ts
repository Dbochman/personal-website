import {
  HORIZON_S,
  INCIDENT_START_S,
  LIMITS,
  amplificationCeiling,
  drainableLoadLimitPct,
  formatMultiplier,
  maxAttempts,
  type SimConfig,
  type SimSummary,
} from './simulation';

export type Tone = 'good' | 'warn' | 'bad';

export interface Verdict {
  tone: Tone;
  title: string;
  detail: string;
}

const count = new Intl.NumberFormat('en-US');

export function describeOutcome(config: SimConfig, summary: SimSummary): Verdict {
  const end = summary.incidentEndS;
  switch (summary.outcome) {
    case 'unaffected':
      return {
        tone: 'good',
        title: 'No impact',
        detail: `Capacity fell to ${config.degradedCapacityPct}% but never dropped far enough behind ${config.loadPct}% demand for callers to time out.`,
      };
    case 'recovered': {
      const lag = summary.recoveryLagS ?? 0;
      const quick = lag <= config.timeoutMs / 1000 + 0.5;
      const denied =
        summary.budgetDenied > 0
          ? ` The retry budget failed ${count.format(summary.budgetDenied)} requests fast instead of piling them onto the queue.`
          : '';
      if (quick) {
        return {
          tone: 'good',
          title: lag === 0 ? 'Recovered as soon as capacity returned' : `Recovered ${lag}s after capacity returned`,
          detail:
            summary.failedRequests === 0
              ? 'Requests queued during the trigger, but every caller got an answer before timing out.'
              : `Errors were confined to the trigger window.${denied}`,
        };
      }
      return {
        tone: 'warn',
        title: `Recovered, but ${lag}s after capacity returned`,
        detail:
          summary.wastedWorkPct > 0
            ? `The queue was full of requests nobody was waiting for. Draining them took ${lag}s, and ${summary.wastedWorkPct}% of the dependency's work went to callers who had already given up.${denied}`
            : `Callers kept timing out while the backlog drained.${denied}`,
      };
    }
    case 'draining':
      return {
        tone: 'warn',
        title: `Still draining at ${HORIZON_S}s`,
        detail: `The trigger ended at ${end}s. Demand is now below capacity, so the backlog is shrinking, but callers are still timing out while it clears.`,
      };
    case 'metastable': {
      const ceiling = amplificationCeiling(config);
      const bound =
        !config.shedAbandoned && config.loadPct * ceiling > 100
          ? ` Model bound: once every response arrives late, retries can hold demand at ${formatMultiplier(ceiling)} normal (${Math.round(config.loadPct * ceiling)}% of capacity), so this model has no way to drain on its own.`
          : '';
      return {
        tone: 'bad',
        title: `Not recovered by ${HORIZON_S}s: the trigger ended at ${end}s`,
        detail: `Observed: the backlog was still growing when the run ended, and ${summary.wastedWorkPct}% of the dependency's work went to requests whose caller had already given up. Each of those timeouts produced another retry, the self-sustaining loop called a metastable failure.${bound}`,
      };
    }
  }
}

export interface Takeaway {
  id: string;
  title: string;
  body: string;
}

export function buildTakeaways(
  config: SimConfig,
  summary: SimSummary,
  tippingPointS: number | null
): Takeaway[] {
  const takeaways: Takeaway[] = [];
  const retries = config.attemptsPerLayer > 1;
  const attempts = maxAttempts(config);
  const limit = drainableLoadLimitPct(config);

  if (retries && config.layers > 1) {
    takeaways.push({
      id: 'one-layer',
      title: 'Retry at one layer',
      body: `${config.attemptsPerLayer} attempts at ${config.layers} layers multiplies to ${attempts} attempts per user request. Let only the caller closest to the dependency retry and have the others fail fast.`,
    });
  }
  if (retries && config.retryBudgetPct === 0) {
    takeaways.push({
      id: 'budget',
      title: 'Cap retries as a share of traffic',
      body:
        config.layers === 1
          ? 'With a single retrying layer, a per-client budget (the SRE book uses 10% of requests) keeps sustained amplification near 1.1× however many attempts each request is allowed. Requests over the budget fail fast instead of joining the queue.'
          : `A per-client budget (the SRE book uses 10% of requests) caps each layer near 1.1×, but budgets at ${config.layers} stacked layers compound in this model to about ${(1.1 ** config.layers).toFixed(2)}×. Combine it with retrying at one layer. Requests over the budget fail fast instead of joining the queue.`,
    });
  }
  if (!config.shedAbandoned && summary.wastedWorkPct > 0) {
    takeaways.push({
      id: 'shed',
      title: 'Stop serving callers who already left',
      body: 'Propagate deadlines and drop queued work once its caller has timed out. Otherwise recovery capacity goes to responses nobody will read.',
    });
  }
  if (retries && config.backoff === 'exponential' && summary.outcome === 'metastable') {
    takeaways.push({
      id: 'backoff-limits',
      title: 'Backoff alone did not save it',
      body: 'New requests keep arriving whatever the clients do, so backoff only delays retries. They still land on a saturated queue. Backoff helps with short blips and synchronized clients, but it does not cap load.',
    });
  }
  if (retries && config.backoff === 'none') {
    takeaways.push({
      id: 'backoff',
      title: 'Add jittered exponential backoff anyway',
      body: 'It will not stop a sustained storm, but it lets short blips clear before retries land and spreads out clients that fail at the same moment.',
    });
  }
  if (!config.shedAbandoned && config.loadPct >= limit) {
    takeaways.push({
      id: 'headroom',
      title: 'Or buy headroom',
      body: `In this model, the backlog always drains below ${Math.floor(limit * 10) / 10}% load with this policy. Above that it is fine until a trigger ${
        tippingPointS === null ? 'long enough' : `of about ${tippingPointS}s or longer`
      } leaves it unrecovered at ${HORIZON_S}s. Treat both numbers as a direction for real capacity planning, not as thresholds.`,
    });
  }
  if (takeaways.length === 0) {
    takeaways.push({
      id: 'robust',
      title: tippingPointS === null ? 'No growing-backlog threshold found' : 'Close',
      body:
        tippingPointS === null
          ? `The search found no growing-backlog threshold up to ${LIMITS.outageS.max}s at this capacity drop. That does not mean every run recovered by ${HORIZON_S}s: a backlog may still be draining. This is not a guarantee for a real system; test the assumptions with load tests or game days.`
          : `In this model it is still unrecovered at ${HORIZON_S}s after a trigger of about ${tippingPointS}s. Lower the load or tighten the retry budget.`,
    });
  }
  return takeaways;
}

export function chartSummary(config: SimConfig, summary: SimSummary, verdict: Verdict): string {
  return [
    `Load at the dependency over ${HORIZON_S} seconds.`,
    `Capacity drops to ${config.degradedCapacityPct}% from ${INCIDENT_START_S}s to ${summary.incidentEndS}s.`,
    `Peak offered load is ${summary.peakAmplification} times normal demand.`,
    `${summary.failedPct}% of user requests failed.`,
    `${verdict.title}.`,
  ].join(' ');
}
