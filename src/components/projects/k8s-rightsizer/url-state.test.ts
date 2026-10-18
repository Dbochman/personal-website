import { describe, it, expect } from 'vitest';
import { readState, writeState, DEFAULT_STATE, DEFAULT_FORM, MAX_FIELD_LENGTH, type RightsizerState } from './url-state';

describe('readState', () => {
  it('returns the example defaults for an empty URL', () => {
    expect(readState(new URLSearchParams())).toEqual(DEFAULT_STATE);
  });

  it('reads raw field values, posture, and CPU limit policy', () => {
    const state = readState(new URLSearchParams('cpuP95=250m&memMax=2Gi&posture=safe&cpuLimitPolicy=omit'));
    expect(state.form.cpuP95).toBe('250m');
    expect(state.form.memMax).toBe('2Gi');
    expect(state.form.cpuP50).toBe(DEFAULT_FORM.cpuP50);
    expect(state.posture).toBe('safe');
    expect(state.includeCpuLimit).toBe(false);
  });

  it('keeps intentionally empty values (a cleared optional field)', () => {
    expect(readState(new URLSearchParams('cpuP50=&memLimit=')).form).toMatchObject({ cpuP50: '', memLimit: '' });
  });

  it('ignores unknown posture and policy values', () => {
    const state = readState(new URLSearchParams('posture=yolo&cpuLimitPolicy=sometimes'));
    expect(state.posture).toBe(DEFAULT_STATE.posture);
    expect(state.includeCpuLimit).toBe(true);
  });

  it('caps field length', () => {
    const state = readState(new URLSearchParams(`cpuP95=${'9'.repeat(500)}`));
    expect(state.form.cpuP95).toHaveLength(MAX_FIELD_LENGTH);
  });
});

describe('writeState', () => {
  it('writes only non-default values and preserves unrelated parameters', () => {
    const state: RightsizerState = {
      form: { ...DEFAULT_FORM, cpuP95: '250m', cpuP50: '' },
      posture: 'conservative',
      includeCpuLimit: false,
    };
    const next = writeState(state, new URLSearchParams('theme=dark'));
    expect(Object.fromEntries(next)).toEqual({
      theme: 'dark',
      cpuP50: '',
      cpuP95: '250m',
      posture: 'conservative',
      cpuLimitPolicy: 'omit',
    });
    expect(readState(next)).toEqual(state);
  });

  it('removes stale tool parameters when state returns to defaults', () => {
    const next = writeState(DEFAULT_STATE, new URLSearchParams('theme=light&cpuP95=1&posture=safe'));
    expect(next.toString()).toBe('theme=light');
  });
});
