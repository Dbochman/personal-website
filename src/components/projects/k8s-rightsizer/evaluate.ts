/**
 * Turn raw form strings into per-field errors and, when every sizing input is
 * valid, a recommendation. Price errors only block the cost estimate, never
 * the recommendation or YAML.
 */
import {
  calculateRecommendation,
  normalizePercentiles,
  parseCpu,
  parseCpuSpec,
  parseMemory,
  parsePrice,
  parseReplicas,
  validateSpec,
  DEFAULT_PRICING,
  type ContainerSpec,
  type PercentileInput,
  type Recommendation,
} from './calculations';
import type { FormState, RightsizerState } from './url-state';

/** `general` holds unexpected calculation errors that no single field owns. */
export type ErrorKey = keyof FormState | 'cpuUsage' | 'memUsage' | 'general';
export type FormErrors = Partial<Record<ErrorKey, string>>;

export interface Evaluation {
  errors: FormErrors;
  /** Present only when all sizing inputs are valid */
  recommendation: Recommendation | null;
  replicas: number | null;
  pricingValid: boolean;
}

export const REQUIRED_FIELDS: Array<keyof FormState> = [
  'replicas', 'cpuP95', 'cpuMax', 'memP95', 'memMax', 'cpuPrice', 'memPrice',
];

function attempt<T>(errors: FormErrors, key: ErrorKey, fn: () => T): T | undefined {
  try {
    return fn();
  } catch (e) {
    errors[key] = e instanceof Error ? e.message : 'Invalid value';
    return undefined;
  }
}

/** Parse an optional field: blank means "not set". */
function optional<T>(errors: FormErrors, key: keyof FormState, raw: string, parse: (v: string) => T): T | undefined {
  return raw.trim() ? attempt(errors, key, () => parse(raw)) : undefined;
}

function usage(
  errors: FormErrors,
  form: FormState,
  prefix: 'cpu' | 'mem',
  parse: (v: string) => number
): PercentileInput | undefined {
  const p50 = optional(errors, `${prefix}P50`, form[`${prefix}P50`], parse);
  const p95 = attempt(errors, `${prefix}P95`, () => parse(form[`${prefix}P95`]));
  const p99 = optional(errors, `${prefix}P99`, form[`${prefix}P99`], parse);
  const max = attempt(errors, `${prefix}Max`, () => parse(form[`${prefix}Max`]));
  const fieldError = (['P50', 'P95', 'P99', 'Max'] as const).some((s) => errors[`${prefix}${s}`]);
  if (fieldError || p95 === undefined || max === undefined) return undefined;
  return { p50, p95, p99, max };
}

export function evaluate(state: RightsizerState): Evaluation {
  const { form } = state;
  const errors: FormErrors = {};

  const replicas = attempt(errors, 'replicas', () => parseReplicas(form.replicas)) ?? null;
  const current: ContainerSpec = {
    // Spec values use 1m precision; measured usage below may be finer.
    requests: {
      cpu: optional(errors, 'cpuRequest', form.cpuRequest, parseCpuSpec),
      memory: optional(errors, 'memRequest', form.memRequest, parseMemory),
    },
    limits: {
      cpu: optional(errors, 'cpuLimit', form.cpuLimit, parseCpuSpec),
      memory: optional(errors, 'memLimit', form.memLimit, parseMemory),
    },
  };
  const specErrors = validateSpec(current);
  if (specErrors.cpu && !errors.cpuRequest) errors.cpuRequest = specErrors.cpu;
  if (specErrors.memory && !errors.memRequest) errors.memRequest = specErrors.memory;

  const cpuUsage = usage(errors, form, 'cpu', parseCpu);
  const memUsage = usage(errors, form, 'mem', parseMemory);

  const cpuPrice = attempt(errors, 'cpuPrice', () => parsePrice(form.cpuPrice));
  const memPrice = attempt(errors, 'memPrice', () => parsePrice(form.memPrice));
  const pricingValid = cpuPrice !== undefined && memPrice !== undefined;

  // Ordering problems (e.g. P95 > Max) are reported per resource group.
  if (cpuUsage) attempt(errors, 'cpuUsage', () => normalizePercentiles(cpuUsage));
  if (memUsage) attempt(errors, 'memUsage', () => normalizePercentiles(memUsage));

  const blocking = Object.keys(errors).some((key) => key !== 'cpuPrice' && key !== 'memPrice');
  if (blocking || !cpuUsage || !memUsage || replicas === null) {
    return { errors, recommendation: null, replicas, pricingValid };
  }

  // The parsers above should make this unreachable, but a calculation error
  // must surface as a validation message rather than crash the page.
  const recommendation = attempt(errors, 'general', () => calculateRecommendation({
    usage: { cpu: cpuUsage, memory: memUsage },
    current,
    replicas,
    posture: state.posture,
    includeCpuLimit: state.includeCpuLimit,
    pricing: pricingValid ? { cpuPerCoreHour: cpuPrice, memoryPerGiBHour: memPrice } : DEFAULT_PRICING,
  })) ?? null;
  return { errors, recommendation, replicas, pricingValid };
}
