// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { BUDGETS, budgetFailures, measureBundle } from '../../scripts/check-bundle-budget';

describe('shared PR and deployment bundle budget', () => {
  it('counts all JS/CSS chunks but excludes maps and unrelated assets', () => {
    expect(measureBundle([
      { name: 'entry.js', size: 100 },
      { name: 'lazy.js', size: 200 },
      { name: 'style.css', size: 50 },
      { name: 'lazy.js.map', size: 900 },
      { name: 'image.png', size: 1000 },
    ])).toEqual({ totalJS: 300, totalCSS: 50, largestChunk: 200 });
  });

  it('retains the existing hard limits and allows exact-budget totals', () => {
    expect(BUDGETS.totalJS).toBe(5700 * 1024);
    expect(BUDGETS.totalCSS).toBe(150 * 1024);
    expect(budgetFailures(BUDGETS)).toEqual([]);
    expect(budgetFailures({ ...BUDGETS, totalJS: BUDGETS.totalJS + 1 })).toHaveLength(1);
    expect(budgetFailures({ ...BUDGETS, totalCSS: BUDGETS.totalCSS + 1 })).toHaveLength(1);
  });

  it('keeps the largest-chunk limit advisory rather than a hard failure', () => {
    expect(budgetFailures({ totalJS: 1000, totalCSS: 100, largestChunk: BUDGETS.largestChunk + 1 })).toEqual([]);
  });
});
