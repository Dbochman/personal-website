export type BudgetPeriod = 'monthly' | 'quarterly' | 'yearly';

export interface Incident {
  id: string;
  name: string;
  date: string; // ISO date string
  durationMinutes: number;
  impactPercent: number; // 0-100, defaults to 100
}

export interface SloConfig {
  target: number; // e.g., 99.9
  period: BudgetPeriod;
  startDate: string; // ISO date string
}

export interface BudgetCalculation {
  totalBudgetMinutes: number;
  consumedMinutes: number;
  remainingMinutes: number;
  consumedPercent: number;
  remainingPercent: number;
  burnRate: number; // minutes per day
  sustainableRate: number; // minutes per day to stay on track
  burnMultiplier: number; // how much faster than sustainable
  projectedExhaustionDate: Date | null; // null if on track
  isOnTrack: boolean;
  daysElapsed: number;
  daysRemaining: number;
  periodDays: number;
}

export interface ChartDataPoint {
  day: number;
  date: string;
  ideal: number;
  actual: number;
  projected?: number;
}

export const PERIOD_DAYS: Record<BudgetPeriod, number> = {
  monthly: 30,
  quarterly: 90,
  yearly: 365,
};

export const SLO_PRESETS = [
  { value: 99, label: '99% (Two nines)', budgetDesc: '7.2h/mo' },
  { value: 99.9, label: '99.9% (Three nines)', budgetDesc: '43.2min/mo' },
  { value: 99.95, label: '99.95%', budgetDesc: '21.6min/mo' },
  { value: 99.99, label: '99.99% (Four nines)', budgetDesc: '4.3min/mo' },
  { value: 99.999, label: '99.999% (Five nines)', budgetDesc: '26s/mo' },
];

/**
 * Calculate total error budget in minutes for the period
 */
export function calculateTotalBudget(target: number, period: BudgetPeriod): number {
  const periodMinutes = PERIOD_DAYS[period] * 24 * 60;
  const errorRate = 1 - target / 100;
  return periodMinutes * errorRate;
}

/**
 * Calculate consumed budget from an incident
 */
export function calculateIncidentCost(incident: Incident): number {
  return incident.durationMinutes * (incident.impactPercent / 100);
}

/**
 * Calculate total consumed budget from all incidents
 */
export function calculateTotalConsumed(incidents: Incident[]): number {
  return incidents.reduce((sum, inc) => sum + calculateIncidentCost(inc), 0);
}

/**
 * Main calculation function
 */
export function calculateBudget(
  config: SloConfig,
  incidents: Incident[],
  currentDate: Date = new Date()
): BudgetCalculation {
  const periodDays = PERIOD_DAYS[config.period];
  const totalBudgetMinutes = calculateTotalBudget(config.target, config.period);

  const startDate = new Date(config.startDate);
  const daysElapsed = Math.max(1, Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
  const daysRemaining = Math.max(0, periodDays - daysElapsed);

  const consumedMinutes = calculateTotalConsumed(incidents);
  const remainingMinutes = Math.max(0, totalBudgetMinutes - consumedMinutes);

  const consumedPercent = (consumedMinutes / totalBudgetMinutes) * 100;
  const remainingPercent = 100 - consumedPercent;

  // Burn rate calculations
  const burnRate = consumedMinutes / daysElapsed;
  const sustainableRate = totalBudgetMinutes / periodDays;
  const burnMultiplier = burnRate / sustainableRate;

  // Projection
  const projectedTotal = burnRate * periodDays;
  const isOnTrack = projectedTotal <= totalBudgetMinutes;

  let projectedExhaustionDate: Date | null = null;
  if (!isOnTrack && burnRate > 0) {
    const daysUntilExhaustion = remainingMinutes / burnRate;
    projectedExhaustionDate = new Date(currentDate.getTime() + daysUntilExhaustion * 24 * 60 * 60 * 1000);
  }

  return {
    totalBudgetMinutes,
    consumedMinutes,
    remainingMinutes,
    consumedPercent,
    remainingPercent,
    burnRate,
    sustainableRate,
    burnMultiplier,
    projectedExhaustionDate,
    isOnTrack,
    daysElapsed,
    daysRemaining,
    periodDays,
  };
}

/**
 * Generate chart data for the burndown visualization
 */
export function generateChartData(
  config: SloConfig,
  incidents: Incident[],
  calculation: BudgetCalculation
): ChartDataPoint[] {
  const { periodDays, totalBudgetMinutes, burnRate } = calculation;
  const startDate = new Date(config.startDate);
  const data: ChartDataPoint[] = [];

  // Sort incidents by date
  const sortedIncidents = [...incidents].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  let cumulativeConsumed = 0;
  let incidentIndex = 0;

  for (let day = 0; day <= periodDays; day++) {
    const currentDate = new Date(startDate.getTime() + day * 24 * 60 * 60 * 1000);
    const dateStr = currentDate.toISOString().split('T')[0];

    // Add any incidents on this day
    while (
      incidentIndex < sortedIncidents.length &&
      sortedIncidents[incidentIndex].date <= dateStr
    ) {
      cumulativeConsumed += calculateIncidentCost(sortedIncidents[incidentIndex]);
      incidentIndex++;
    }

    // Ideal is linear consumption
    const idealConsumed = (day / periodDays) * totalBudgetMinutes;
    const idealRemaining = totalBudgetMinutes - idealConsumed;

    // Actual remaining budget
    const actualRemaining = Math.max(0, totalBudgetMinutes - cumulativeConsumed);

    const point: ChartDataPoint = {
      day,
      date: currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      ideal: Math.round(idealRemaining * 100) / 100,
      actual: Math.round(actualRemaining * 100) / 100,
    };

    // Add projection line only for future days
    if (day >= calculation.daysElapsed) {
      const projectedConsumed = calculation.consumedMinutes + burnRate * (day - calculation.daysElapsed);
      point.projected = Math.max(0, Math.round((totalBudgetMinutes - projectedConsumed) * 100) / 100);
    }

    data.push(point);
  }

  return data;
}

/**
 * Format minutes into a human-readable string
 */
export function formatDuration(minutes: number): string {
  if (minutes < 1) {
    return `${Math.round(minutes * 60)}s`;
  }
  if (minutes < 60) {
    return `${minutes.toFixed(1)}min`;
  }
  const hours = minutes / 60;
  if (hours < 24) {
    return `${hours.toFixed(1)}h`;
  }
  const days = hours / 24;
  return `${days.toFixed(1)}d`;
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}
