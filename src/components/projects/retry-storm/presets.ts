import type { SimConfig } from './simulation';

export interface ScenarioPreset {
  id: string;
  name: string;
  blurb: string;
  config: SimConfig;
}

const FAILOVER: SimConfig = {
  loadPct: 60,
  outageS: 15,
  degradedCapacityPct: 0,
  timeoutMs: 1000,
  attemptsPerLayer: 3,
  layers: 1,
  backoff: 'exponential',
  baseDelayMs: 100,
  maxDelayMs: 2000,
  retryBudgetPct: 0,
  shedAbandoned: false,
};

export const PRESETS: ScenarioPreset[] = [
  {
    id: 'failover',
    name: 'Database failover',
    blurb:
      'The primary fails over and serves nothing for 15 s at 60% load. Clients already use jittered exponential backoff with 3 attempts.',
    config: FAILOVER,
  },
  {
    id: 'zone-loss',
    name: 'Lose a third of capacity',
    blurb:
      'One of three zones drops out for 30 s while the fleet runs at 75%, with no N+1 headroom. Excess load queues until 2 s timeouts fire.',
    config: {
      ...FAILOVER,
      loadPct: 75,
      outageS: 30,
      degradedCapacityPct: 65,
      timeoutMs: 2000,
    },
  },
  {
    id: 'gc-pause',
    name: 'Two-second pause',
    blurb:
      'A 2 s stop-the-world pause at 45% load. Callers use a tight 500 ms timeout and retry immediately.',
    config: {
      ...FAILOVER,
      loadPct: 45,
      outageS: 2,
      timeoutMs: 500,
      backoff: 'none',
    },
  },
  {
    id: 'deep-stack',
    name: 'Retries at every layer',
    blurb:
      'The SRE book example: browser, frontend and backend each make 4 attempts, so one user action can reach the database 64 times. Load is only 20%, and the outage lasts 10 s.',
    config: {
      ...FAILOVER,
      loadPct: 20,
      outageS: 10,
      attemptsPerLayer: 4,
      layers: 3,
    },
  },
  {
    id: 'hardened',
    name: 'Hardened failover',
    blurb:
      'The same 15 s failover with a 10% retry budget, and a server that drops work whose caller has already timed out.',
    config: {
      ...FAILOVER,
      retryBudgetPct: 10,
      shedAbandoned: true,
    },
  },
];

export const DEFAULT_CONFIG: SimConfig = PRESETS[0].config;

export function matchPreset(config: SimConfig): ScenarioPreset | undefined {
  return PRESETS.find((preset) =>
    (Object.keys(preset.config) as (keyof SimConfig)[]).every(
      (key) => preset.config[key] === config[key]
    )
  );
}
