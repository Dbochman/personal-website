/**
 * Shared SLO presets used across SLO tools (SLO Calculator, Error Budget Burndown)
 */

export interface SloPreset {
  /** SLO target percentage (e.g., 99.9) */
  value: number;
  /** Full label (e.g., "99.9% (Three nines)") */
  label: string;
  /** Short descriptive name (e.g., "Three nines") */
  shortLabel: string;
  /** Monthly error budget in human-readable format */
  monthlyBudget: string;
  /** Yearly error budget in human-readable format */
  yearlyBudget: string;
}

/**
 * Common SLO targets with pre-calculated error budgets
 *
 * Budget calculations based on:
 * - Monthly: 30 days × 24 hours × 60 minutes = 43,200 minutes
 * - Yearly: 365 days × 24 hours × 60 minutes = 525,600 minutes
 */
export const SLO_PRESETS: SloPreset[] = [
  {
    value: 99,
    label: '99% (Two nines)',
    shortLabel: 'Two nines',
    monthlyBudget: '7.2 hours',
    yearlyBudget: '3.65 days',
  },
  {
    value: 99.5,
    label: '99.5%',
    shortLabel: '99.5%',
    monthlyBudget: '3.6 hours',
    yearlyBudget: '1.83 days',
  },
  {
    value: 99.9,
    label: '99.9% (Three nines)',
    shortLabel: 'Three nines',
    monthlyBudget: '43.2 min',
    yearlyBudget: '8.76 hours',
  },
  {
    value: 99.95,
    label: '99.95%',
    shortLabel: '99.95%',
    monthlyBudget: '21.6 min',
    yearlyBudget: '4.38 hours',
  },
  {
    value: 99.99,
    label: '99.99% (Four nines)',
    shortLabel: 'Four nines',
    monthlyBudget: '4.32 min',
    yearlyBudget: '52.6 min',
  },
  {
    value: 99.999,
    label: '99.999% (Five nines)',
    shortLabel: 'Five nines',
    monthlyBudget: '26 sec',
    yearlyBudget: '5.26 min',
  },
];

/**
 * Find a preset by its value
 */
export function findPresetByValue(value: number): SloPreset | undefined {
  return SLO_PRESETS.find((p) => p.value === value);
}

/**
 * Get budget description for a given SLO value
 * Returns the monthly budget string, or calculates it if not a standard preset
 */
export function getBudgetDescription(sloPercent: number): string {
  const preset = findPresetByValue(sloPercent);
  if (preset) {
    return preset.monthlyBudget;
  }

  // Calculate for non-standard values
  const monthlyMinutes = 43200; // 30 days
  const errorRate = 1 - sloPercent / 100;
  const budgetMinutes = monthlyMinutes * errorRate;

  if (budgetMinutes < 1) {
    return `${Math.round(budgetMinutes * 60)} sec`;
  }
  if (budgetMinutes < 60) {
    return `${budgetMinutes.toFixed(1)} min`;
  }
  const hours = budgetMinutes / 60;
  if (hours < 24) {
    return `${hours.toFixed(1)} hours`;
  }
  return `${(hours / 24).toFixed(2)} days`;
}
