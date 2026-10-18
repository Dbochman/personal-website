/**
 * Shareable form state for the right-sizer, stored in URL parameters.
 *
 * Raw input strings are kept (even invalid ones) so a shared link reproduces
 * exactly what the sender saw, including validation messages. Only values that
 * differ from the defaults are written, and unrelated parameters such as
 * `theme` are left untouched.
 */
import { POSTURES, type Posture } from './calculations';

export interface FormState {
  replicas: string;
  cpuRequest: string;
  cpuLimit: string;
  memRequest: string;
  memLimit: string;
  cpuP50: string;
  cpuP95: string;
  cpuP99: string;
  cpuMax: string;
  memP50: string;
  memP95: string;
  memP99: string;
  memMax: string;
  cpuPrice: string;
  memPrice: string;
}

export interface RightsizerState {
  form: FormState;
  posture: Posture;
  includeCpuLimit: boolean;
}

export const DEFAULT_FORM: FormState = {
  replicas: '3',
  cpuRequest: '500m',
  cpuLimit: '1',
  memRequest: '512Mi',
  memLimit: '1Gi',
  cpuP50: '100m',
  cpuP95: '200m',
  cpuP99: '300m',
  cpuMax: '400m',
  memP50: '256Mi',
  memP95: '400Mi',
  memP99: '450Mi',
  memMax: '512Mi',
  cpuPrice: '0.03',
  memPrice: '0.004',
};

export const DEFAULT_STATE: RightsizerState = {
  form: DEFAULT_FORM,
  posture: 'balanced',
  includeCpuLimit: true,
};

export const MAX_FIELD_LENGTH = 32;

const FORM_KEYS = Object.keys(DEFAULT_FORM) as Array<keyof FormState>;
const POSTURE_PARAM = 'posture';
const CPU_LIMIT_PARAM = 'cpuLimitPolicy';
export const STATE_PARAMS = [...FORM_KEYS, POSTURE_PARAM, CPU_LIMIT_PARAM];

export function readState(params: URLSearchParams): RightsizerState {
  const form = { ...DEFAULT_FORM };
  for (const key of FORM_KEYS) {
    const value = params.get(key);
    if (value !== null) form[key] = value.slice(0, MAX_FIELD_LENGTH);
  }
  const posture = POSTURES.find((p) => p === params.get(POSTURE_PARAM)) ?? DEFAULT_STATE.posture;
  return { form, posture, includeCpuLimit: params.get(CPU_LIMIT_PARAM) !== 'omit' };
}

/** Canonical form of this tool's slice of a URL (unrelated params and defaults ignored). */
export function toolParams(params: URLSearchParams): string {
  return writeState(readState(params), new URLSearchParams()).toString();
}

/** Return `base` with this tool's parameters replaced by the non-default values in `state`. */
export function writeState(state: RightsizerState, base: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams(base);
  STATE_PARAMS.forEach((key) => next.delete(key));
  for (const key of FORM_KEYS) {
    if (state.form[key] !== DEFAULT_FORM[key]) next.set(key, state.form[key]);
  }
  if (state.posture !== DEFAULT_STATE.posture) next.set(POSTURE_PARAM, state.posture);
  if (!state.includeCpuLimit) next.set(CPU_LIMIT_PARAM, 'omit');
  return next;
}
