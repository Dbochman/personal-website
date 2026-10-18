import { describe, it, expect } from 'vitest';
import { evaluate } from './evaluate';
import { DEFAULT_STATE, type FormState, type RightsizerState } from './url-state';

const withForm = (form: Partial<FormState>, rest: Partial<RightsizerState> = {}): RightsizerState => ({
  ...DEFAULT_STATE,
  ...rest,
  form: { ...DEFAULT_STATE.form, ...form },
});

describe('evaluate', () => {
  it('produces a recommendation for the example', () => {
    const result = evaluate(DEFAULT_STATE);
    expect(result.errors).toEqual({});
    expect(result.recommendation?.requests).toEqual({ cpu: '220m', memory: '448Mi' });
    expect(result.replicas).toBe(3);
    expect(result.pricingValid).toBe(true);
  });

  it('reports field errors and blocks the recommendation', () => {
    const result = evaluate(withForm({ memP95: '400m', replicas: '0' }));
    expect(result.errors.memP95).toMatch(/Did you mean 400Mi/);
    expect(result.errors.replicas).toMatch(/at least 1/);
    expect(result.recommendation).toBeNull();
  });

  it('requires P95 and Max but not P50 or P99', () => {
    const missingRequired = evaluate(withForm({ cpuMax: '' }));
    expect(missingRequired.errors.cpuMax).toMatch(/Enter a CPU value/);
    expect(missingRequired.recommendation).toBeNull();

    const missingOptional = evaluate(withForm({ cpuP50: '', cpuP99: ' ', memP50: '', memP99: '' }));
    expect(missingOptional.errors).toEqual({});
    expect(missingOptional.recommendation).not.toBeNull();
  });

  it('reports percentile ordering per resource', () => {
    const result = evaluate(withForm({ cpuP95: '500m', memP50: '1Gi' }));
    expect(result.errors.cpuUsage).toMatch(/P95 is greater than P99/);
    expect(result.errors.memUsage).toMatch(/P50 is greater than P95/);
    expect(result.recommendation).toBeNull();
  });

  it('rejects a current request above its limit', () => {
    const result = evaluate(withForm({ cpuRequest: '2', cpuLimit: '1' }));
    expect(result.errors.cpuRequest).toMatch(/cannot exceed/);
    expect(result.recommendation).toBeNull();
  });

  it('rejects current CPU request/limit precision finer than 1m', () => {
    const result = evaluate(withForm({ cpuRequest: '0.5m', cpuLimit: '0.0005' }));
    expect(result.errors.cpuRequest).toMatch(/finer than 1m/);
    expect(result.errors.cpuLimit).toMatch(/finer than 1m/);
    expect(result.recommendation).toBeNull();
  });

  it('accepts decimal CPU specs that only look imprecise in floating point', () => {
    const result = evaluate(withForm({ cpuRequest: '0.29', cpuLimit: '0.57' }));
    expect(result.errors).toEqual({});
    expect(result.recommendation?.currentEffectiveRequests.cpu).toBe(290);
  });

  it('still accepts sub-millicore measured usage', () => {
    const result = evaluate(withForm({ cpuP50: '0.5m', cpuP95: '0.0008', cpuP99: '1m', cpuMax: '2m' }));
    expect(result.errors).toEqual({});
    expect(result.recommendation?.requests.cpu).toBe('10m');
  });

  it('treats empty current fields as unset', () => {
    const result = evaluate(withForm({ cpuRequest: '', cpuLimit: '', memRequest: '', memLimit: '' }));
    expect(result.errors).toEqual({});
    expect(result.recommendation?.currentQosClass).toBe('BestEffort');
  });

  it('keeps the recommendation when only prices are invalid', () => {
    const result = evaluate(withForm({ cpuPrice: 'free' }));
    expect(result.errors.cpuPrice).toBeDefined();
    expect(result.pricingValid).toBe(false);
    expect(result.recommendation).not.toBeNull();
  });

  it('passes posture and CPU limit policy through', () => {
    const result = evaluate(withForm({}, { posture: 'safe', includeCpuLimit: false }));
    expect(result.recommendation?.posture).toBe('safe');
    expect(result.recommendation?.limits.cpu).toBeUndefined();
  });
});
