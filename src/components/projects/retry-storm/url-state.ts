import {
  BASE_DELAY_OPTIONS_MS,
  BUDGET_OPTIONS_PCT,
  LIMITS,
  MAX_DELAY_OPTIONS_MS,
  TIMEOUT_OPTIONS_MS,
  type BackoffMode,
  type SimConfig,
} from './simulation';
import { DEFAULT_CONFIG } from './presets';

/**
 * URL parameter names. Only values that differ from the default scenario are
 * written, so the bare project URL stays clean and shared links stay short.
 */
export const PARAM_KEYS = {
  loadPct: 'load',
  outageS: 'outage',
  degradedCapacityPct: 'capacity',
  timeoutMs: 'timeout',
  attemptsPerLayer: 'attempts',
  layers: 'layers',
  backoff: 'backoff',
  baseDelayMs: 'base',
  maxDelayMs: 'max',
  retryBudgetPct: 'budget',
  shedAbandoned: 'shed',
} as const satisfies Record<keyof SimConfig, string>;

type RangedKey = keyof typeof LIMITS;
type OptionKey = 'timeoutMs' | 'baseDelayMs' | 'maxDelayMs' | 'retryBudgetPct';

const OPTIONS: Record<OptionKey, readonly number[]> = {
  timeoutMs: TIMEOUT_OPTIONS_MS,
  baseDelayMs: BASE_DELAY_OPTIONS_MS,
  maxDelayMs: MAX_DELAY_OPTIONS_MS,
  retryBudgetPct: BUDGET_OPTIONS_PCT,
};

const BACKOFF_VALUES: readonly BackoffMode[] = ['none', 'exponential'];

export function configsEqual(a: SimConfig, b: SimConfig): boolean {
  return (Object.keys(PARAM_KEYS) as (keyof SimConfig)[]).every((key) => a[key] === b[key]);
}

export function clampToStep(key: RangedKey, value: number): number {
  const { min, max, step } = LIMITS[key];
  const snapped = Math.round(value / step) * step;
  // Avoid float noise like 2.5000000000000004 for half-second steps.
  return Math.min(max, Math.max(min, Number(snapped.toFixed(2))));
}

function parseNumber(raw: string | null): number | null {
  if (raw === null || raw.trim() === '') return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

export function parseConfig(params: URLSearchParams): SimConfig {
  const config: SimConfig = { ...DEFAULT_CONFIG };

  for (const key of Object.keys(LIMITS) as RangedKey[]) {
    const value = parseNumber(params.get(PARAM_KEYS[key]));
    if (value !== null) config[key] = clampToStep(key, value);
  }

  for (const key of Object.keys(OPTIONS) as OptionKey[]) {
    const value = parseNumber(params.get(PARAM_KEYS[key]));
    if (value !== null && OPTIONS[key].includes(value)) config[key] = value;
  }

  const backoff = params.get(PARAM_KEYS.backoff);
  if (backoff && (BACKOFF_VALUES as readonly string[]).includes(backoff)) {
    config.backoff = backoff as BackoffMode;
  }

  const shed = params.get(PARAM_KEYS.shedAbandoned);
  if (shed === '1' || shed === 'true') config.shedAbandoned = true;
  if (shed === '0' || shed === 'false') config.shedAbandoned = false;

  return config;
}

/**
 * A stable fingerprint of only this tool's parameters, so changes to
 * unrelated parameters (e.g. theme) can be told apart from navigations that
 * change the scenario.
 */
export function toolParamsKey(search: string): string {
  const params = new URLSearchParams(search);
  const names: string[] = Object.values(PARAM_KEYS);
  return names
    .filter((name) => params.has(name))
    .map((name) => `${name}=${params.getAll(name).join(',')}`)
    .join('&');
}

/**
 * Returns a copy of `current` with this tool's parameters replaced by the
 * non-default values of `config`. Unrelated parameters (e.g. theme) are kept.
 */
export function writeConfig(current: URLSearchParams, config: SimConfig): URLSearchParams {
  const next = new URLSearchParams(current);
  for (const key of Object.keys(PARAM_KEYS) as (keyof SimConfig)[]) {
    const name = PARAM_KEYS[key];
    const value = config[key];
    if (value === DEFAULT_CONFIG[key]) {
      next.delete(name);
    } else if (typeof value === 'boolean') {
      next.set(name, value ? '1' : '0');
    } else {
      next.set(name, String(value));
    }
  }
  return next;
}
