/**
 * Unified SLO Tool Calculations
 * Merges logic from uptime-calculator and error-budget-burndown
 */

// ============================================================================
// Types
// ============================================================================

export type BudgetPeriod = 'monthly' | 'quarterly' | 'yearly';

export interface ResponseProfile {
  alertLatencyMin: number;
  acknowledgeMin: number;
  travelMin: number;
  authMin: number;
  diagnoseMin: number;
  fixMin: number;
}

export interface Incident {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD format
  durationMinutes: number;
}

export interface SloConfig {
  target: number; // e.g., 99.9
  period: BudgetPeriod;
  startDate: string; // YYYY-MM-DD format
}

export interface PhaseBreakdown {
  phase: string;
  label: string;
  totalMinutes: number;
  percentOfBudget: number;
}

export interface AchievableSloResult {
  mttrMinutes: number;
  periodDowntimeMinutes: number;
  maxAchievableSlo: number;
  breakdown: PhaseBreakdown[];
  responseOverheadPercent: number;
}

export interface CanMeetSloResult {
  targetSlo: number;
  periodBudgetMinutes: number;
  mttrMinutes: number;
  allowedIncidents: number;
  expectedIncidents: number;
  canMeet: boolean;
  surplusOrDeficitMinutes: number;
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
  actual?: number; // Only present for past/current days
  projected?: number; // Only present for current/future days
}

// ============================================================================
// Constants
// ============================================================================

export const PERIOD_DAYS: Record<BudgetPeriod, number> = {
  monthly: 30,
  quarterly: 90,
  yearly: 365,
};

export const PERIOD_LABELS: Record<BudgetPeriod, string> = {
  monthly: 'Month',
  quarterly: 'Quarter',
  yearly: 'Year',
};

export const PHASE_LABELS: Record<keyof ResponseProfile, string> = {
  alertLatencyMin: 'Alert latency',
  acknowledgeMin: 'Acknowledge',
  travelMin: 'Get to computer',
  authMin: 'Authenticate',
  diagnoseMin: 'Diagnose',
  fixMin: 'Fix',
};

export const DEFAULT_PROFILE: ResponseProfile = {
  alertLatencyMin: 5,
  acknowledgeMin: 5,
  travelMin: 2,
  authMin: 3,
  diagnoseMin: 15,
  fixMin: 20,
};

export const RESPONSE_PRESETS: Record<string, { label: string; profile: ResponseProfile }> = {
  'incident-commander': {
    label: 'Incident Commander',
    profile: {
      alertLatencyMin: 2,
      acknowledgeMin: 2,
      travelMin: 0,
      authMin: 1,
      diagnoseMin: 10,
      fixMin: 15,
    },
  },
  'on-call-engineer': {
    label: 'On-Call Working Hours',
    profile: {
      alertLatencyMin: 5,
      acknowledgeMin: 5,
      travelMin: 2,
      authMin: 3,
      diagnoseMin: 15,
      fixMin: 20,
    },
  },
  'after-hours': {
    label: 'On-Call After Hours / Weekend',
    profile: {
      alertLatencyMin: 5,
      acknowledgeMin: 10,
      travelMin: 30,
      authMin: 5,
      diagnoseMin: 15,
      fixMin: 20,
    },
  },
};

const INCIDENT_NAMES = [
  'Database connection timeout',
  'API gateway latency spike',
  'Memory exhaustion',
  'Certificate expiration',
  'Network partition',
  'Disk I/O saturation',
  'Cache invalidation failure',
  'Load balancer misconfiguration',
  'DNS resolution failure',
  'Third-party service outage',
  'Deployment rollback',
  'Resource quota exceeded',
];

// ============================================================================
// Date Utilities
// ============================================================================

export function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// ============================================================================
// Response Profile Calculations
// ============================================================================

export function getMttrMinutes(profile: ResponseProfile): number {
  return (
    profile.alertLatencyMin +
    profile.acknowledgeMin +
    profile.travelMin +
    profile.authMin +
    profile.diagnoseMin +
    profile.fixMin
  );
}

export function getEffectiveProfile(
  profile: ResponseProfile,
  enabledPhases: Record<keyof ResponseProfile, boolean>
): ResponseProfile {
  return {
    alertLatencyMin: enabledPhases.alertLatencyMin ? profile.alertLatencyMin : 0,
    acknowledgeMin: enabledPhases.acknowledgeMin ? profile.acknowledgeMin : 0,
    travelMin: enabledPhases.travelMin ? profile.travelMin : 0,
    authMin: enabledPhases.authMin ? profile.authMin : 0,
    diagnoseMin: enabledPhases.diagnoseMin ? profile.diagnoseMin : 0,
    fixMin: enabledPhases.fixMin ? profile.fixMin : 0,
  };
}

export function getResponseOverheadPercent(profile: ResponseProfile): number {
  const mttr = getMttrMinutes(profile);
  if (mttr === 0) return 0;

  const overhead =
    profile.alertLatencyMin + profile.acknowledgeMin + profile.travelMin + profile.authMin;
  return (overhead / mttr) * 100;
}

// ============================================================================
// Budget Calculations
// ============================================================================

export function getPeriodMinutes(period: BudgetPeriod): number {
  return PERIOD_DAYS[period] * 24 * 60;
}

export function calculateTotalBudget(target: number, period: BudgetPeriod): number {
  const periodMinutes = getPeriodMinutes(period);
  const errorRate = 1 - target / 100;
  return periodMinutes * errorRate;
}

export function getDowntimeBudgetMinutes(sloPercent: number, period: BudgetPeriod): number {
  const periodMinutes = getPeriodMinutes(period);
  const downtimePercent = 100 - sloPercent;
  return (downtimePercent / 100) * periodMinutes;
}

export function getPeriodDowntimeMinutes(
  profile: ResponseProfile,
  incidentsPerPeriod: number
): number {
  return getMttrMinutes(profile) * incidentsPerPeriod;
}

// ============================================================================
// Achievable SLO Calculation
// ============================================================================

export function calculateMaxSlo(
  profile: ResponseProfile,
  incidentsPerPeriod: number,
  period: BudgetPeriod
): number {
  const periodMinutes = getPeriodMinutes(period);
  const downtimeMinutes = getPeriodDowntimeMinutes(profile, incidentsPerPeriod);
  const uptimeMinutes = periodMinutes - downtimeMinutes;
  const slo = (uptimeMinutes / periodMinutes) * 100;
  return Math.max(0, Math.min(100, slo));
}

export function getBudgetBreakdown(
  profile: ResponseProfile,
  incidentsPerPeriod: number
): PhaseBreakdown[] {
  const totalDowntime = getPeriodDowntimeMinutes(profile, incidentsPerPeriod);

  const phases: { key: keyof ResponseProfile; label: string }[] = [
    { key: 'alertLatencyMin', label: 'Alert latency' },
    { key: 'acknowledgeMin', label: 'Acknowledge' },
    { key: 'travelMin', label: 'Get to computer' },
    { key: 'authMin', label: 'Authenticate' },
    { key: 'diagnoseMin', label: 'Diagnose' },
    { key: 'fixMin', label: 'Fix' },
  ];

  return phases.map(({ key, label }) => {
    const phaseMinutes = profile[key] * incidentsPerPeriod;
    return {
      phase: key,
      label,
      totalMinutes: phaseMinutes,
      percentOfBudget: totalDowntime > 0 ? (phaseMinutes / totalDowntime) * 100 : 0,
    };
  });
}

export function calculateAchievableSlo(
  profile: ResponseProfile,
  incidentsPerPeriod: number,
  period: BudgetPeriod
): AchievableSloResult {
  return {
    mttrMinutes: getMttrMinutes(profile),
    periodDowntimeMinutes: getPeriodDowntimeMinutes(profile, incidentsPerPeriod),
    maxAchievableSlo: calculateMaxSlo(profile, incidentsPerPeriod, period),
    breakdown: getBudgetBreakdown(profile, incidentsPerPeriod),
    responseOverheadPercent: getResponseOverheadPercent(profile),
  };
}

// ============================================================================
// Target SLO Calculation
// ============================================================================

export function calculateAllowedIncidents(
  profile: ResponseProfile,
  targetSlo: number,
  period: BudgetPeriod
): number {
  const budgetMinutes = getDowntimeBudgetMinutes(targetSlo, period);
  const mttr = getMttrMinutes(profile);
  if (mttr === 0) return Infinity;
  return budgetMinutes / mttr;
}

export function calculateCanMeetSlo(
  profile: ResponseProfile,
  targetSlo: number,
  expectedIncidents: number,
  period: BudgetPeriod
): CanMeetSloResult {
  const mttr = getMttrMinutes(profile);
  const budgetMinutes = getDowntimeBudgetMinutes(targetSlo, period);
  const allowedIncidents = calculateAllowedIncidents(profile, targetSlo, period);
  const expectedDowntime = mttr * expectedIncidents;
  const canMeet = expectedDowntime <= budgetMinutes;

  return {
    targetSlo,
    periodBudgetMinutes: budgetMinutes,
    mttrMinutes: mttr,
    allowedIncidents,
    expectedIncidents,
    canMeet,
    surplusOrDeficitMinutes: budgetMinutes - expectedDowntime,
  };
}

// ============================================================================
// Budget Burndown Calculation
// ============================================================================

export function calculateIncidentCost(incident: Incident): number {
  // Simplified: no impact %, assume 100% (full outage)
  return incident.durationMinutes;
}

export function calculateTotalConsumed(incidents: Incident[]): number {
  return incidents.reduce((sum, inc) => sum + calculateIncidentCost(inc), 0);
}

export function calculateBudget(
  config: SloConfig,
  incidents: Incident[],
  currentDate: Date = new Date()
): BudgetCalculation {
  const periodDays = PERIOD_DAYS[config.period];
  const totalBudgetMinutes = calculateTotalBudget(config.target, config.period);

  const startDate = parseLocalDate(config.startDate);
  const daysElapsed = Math.max(
    1,
    Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  );
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
    projectedExhaustionDate = new Date(
      currentDate.getTime() + daysUntilExhaustion * 24 * 60 * 60 * 1000
    );
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

// ============================================================================
// Chart Data Generation
// ============================================================================

export function generateChartData(
  config: SloConfig,
  incidents: Incident[],
  calculation: BudgetCalculation
): ChartDataPoint[] {
  const { periodDays, totalBudgetMinutes, burnRate } = calculation;
  const startDate = parseLocalDate(config.startDate);
  const data: ChartDataPoint[] = [];

  // Sort incidents by date
  const sortedIncidents = [...incidents].sort((a, b) => a.date.localeCompare(b.date));

  let cumulativeConsumed = 0;
  let incidentIndex = 0;

  for (let day = 0; day <= periodDays; day++) {
    const currentDate = new Date(startDate.getTime() + day * 24 * 60 * 60 * 1000);
    const dateStr = toLocalDateString(currentDate);

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

    const point: ChartDataPoint = {
      day,
      date: currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      ideal: Math.round(idealRemaining * 100) / 100,
    };

    // Actual line only for past and current day
    if (day <= calculation.daysElapsed) {
      const actualRemaining = Math.max(0, totalBudgetMinutes - cumulativeConsumed);
      point.actual = Math.round(actualRemaining * 100) / 100;
    }

    // Projection line for current day and beyond
    if (day >= calculation.daysElapsed) {
      const projectedConsumed =
        calculation.consumedMinutes + burnRate * (day - calculation.daysElapsed);
      point.projected = Math.max(
        0,
        Math.round((totalBudgetMinutes - projectedConsumed) * 100) / 100
      );
    }

    data.push(point);
  }

  return data;
}

// ============================================================================
// Simulated Incident Generation
// ============================================================================

export function generateSimulatedIncidents(
  mttrMinutes: number,
  incidentsPerPeriod: number,
  periodStartDate: string,
  periodDays: number
): Incident[] {
  const incidents: Incident[] = [];
  const startDate = parseLocalDate(periodStartDate);
  const today = new Date();

  // Calculate days elapsed (can't have incidents in the future)
  const maxDay = Math.min(
    periodDays,
    Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  );

  if (maxDay <= 0 || incidentsPerPeriod === 0) return incidents;

  // Distribute incidents across elapsed days
  const spacing = Math.max(1, Math.floor(maxDay / incidentsPerPeriod));

  for (let i = 0; i < incidentsPerPeriod && i * spacing <= maxDay; i++) {
    // Add some variance to the day (±20% of spacing)
    const variance = Math.floor(spacing * 0.2 * (Math.random() - 0.5));
    const day = Math.min(maxDay, Math.max(0, i * spacing + variance));

    const incidentDate = new Date(startDate.getTime() + day * 24 * 60 * 60 * 1000);

    // Add variance to duration (±30%)
    const durationVariance = 1 + (Math.random() - 0.5) * 0.6;
    const duration = Math.max(1, Math.round(mttrMinutes * durationVariance));

    incidents.push({
      id: generateId(),
      name: INCIDENT_NAMES[i % INCIDENT_NAMES.length],
      date: toLocalDateString(incidentDate),
      durationMinutes: duration,
    });
  }

  return incidents;
}

// ============================================================================
// Formatting Utilities
// ============================================================================

export function formatDuration(minutes: number): string {
  if (minutes < 1) {
    const seconds = Math.round(minutes * 60);
    return `${seconds}s`;
  }
  if (minutes < 60) {
    return `${Math.round(minutes)}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours < 24) {
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
}

export function formatSlo(slo: number): string {
  if (slo >= 99.99) {
    return slo.toFixed(3) + '%';
  }
  if (slo >= 99) {
    return slo.toFixed(2) + '%';
  }
  return slo.toFixed(1) + '%';
}
