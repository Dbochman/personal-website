/**
 * Response profile representing time spent in each incident phase
 */
export interface ResponseProfile {
  alertLatencyMin: number;
  acknowledgeMin: number;
  travelMin: number;
  authMin: number;
  diagnoseMin: number;
  fixMin: number;
}

/**
 * Breakdown of downtime budget by phase
 */
export interface PhaseBreakdown {
  phase: string;
  label: string;
  totalMinutes: number;
  percentOfBudget: number;
}

/**
 * Result of SLO calculation in "What can I achieve?" mode
 */
export interface AchievableSloResult {
  mttrMinutes: number;
  monthlyDowntimeMinutes: number;
  maxAchievableSlo: number;
  breakdown: PhaseBreakdown[];
  responseOverheadPercent: number;
}

/**
 * Result of SLO calculation in "Can I meet this?" mode
 */
export interface CanMeetSloResult {
  targetSlo: number;
  monthlyBudgetMinutes: number;
  mttrMinutes: number;
  allowedIncidents: number;
  expectedIncidents: number;
  canMeet: boolean;
  surplusOrDeficitMinutes: number;
}

// Constants
export const MINUTES_PER_MONTH = 43200; // 30 days × 24 hours × 60 minutes
export const MINUTES_PER_YEAR = 525600; // 365 days × 24 hours × 60 minutes

/**
 * Phase labels for display
 */
export const PHASE_LABELS: Record<keyof ResponseProfile, string> = {
  alertLatencyMin: 'Alert latency',
  acknowledgeMin: 'Acknowledge',
  travelMin: 'Get to computer',
  authMin: 'Authenticate',
  diagnoseMin: 'Diagnose',
  fixMin: 'Fix',
};

/**
 * Calculate total MTTR (Mean Time To Resolve) per incident
 */
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

/**
 * Calculate monthly downtime given profile and incident count
 */
export function getMonthlyDowntimeMinutes(
  profile: ResponseProfile,
  incidentsPerMonth: number
): number {
  return getMttrMinutes(profile) * incidentsPerMonth;
}

/**
 * Calculate max achievable SLO given profile and incident count
 */
export function calculateMaxSlo(
  profile: ResponseProfile,
  incidentsPerMonth: number
): number {
  const downtimeMinutes = getMonthlyDowntimeMinutes(profile, incidentsPerMonth);
  const uptimeMinutes = MINUTES_PER_MONTH - downtimeMinutes;
  const slo = (uptimeMinutes / MINUTES_PER_MONTH) * 100;
  return Math.max(0, Math.min(100, slo));
}

/**
 * Calculate downtime budget in minutes for a given SLO percentage
 */
export function getDowntimeBudgetMinutes(sloPercent: number): number {
  const downtimePercent = 100 - sloPercent;
  return (downtimePercent / 100) * MINUTES_PER_MONTH;
}

/**
 * Calculate how many incidents are allowed given target SLO and profile
 */
export function calculateAllowedIncidents(
  profile: ResponseProfile,
  targetSlo: number
): number {
  const budgetMinutes = getDowntimeBudgetMinutes(targetSlo);
  const mttr = getMttrMinutes(profile);
  if (mttr === 0) return Infinity;
  return budgetMinutes / mttr;
}

/**
 * Calculate budget breakdown by phase
 */
export function getBudgetBreakdown(
  profile: ResponseProfile,
  incidentsPerMonth: number
): PhaseBreakdown[] {
  const totalDowntime = getMonthlyDowntimeMinutes(profile, incidentsPerMonth);

  const phases: { key: keyof ResponseProfile; label: string }[] = [
    { key: 'alertLatencyMin', label: 'Alert latency' },
    { key: 'acknowledgeMin', label: 'Acknowledge' },
    { key: 'travelMin', label: 'Get to computer' },
    { key: 'authMin', label: 'Authenticate' },
    { key: 'diagnoseMin', label: 'Diagnose' },
    { key: 'fixMin', label: 'Fix' },
  ];

  return phases.map(({ key, label }) => {
    const phaseMinutes = profile[key] * incidentsPerMonth;
    return {
      phase: key,
      label,
      totalMinutes: phaseMinutes,
      percentOfBudget: totalDowntime > 0 ? (phaseMinutes / totalDowntime) * 100 : 0,
    };
  });
}

/**
 * Calculate response overhead percentage (time before fix begins)
 */
export function getResponseOverheadPercent(profile: ResponseProfile): number {
  const mttr = getMttrMinutes(profile);
  if (mttr === 0) return 0;

  const overhead =
    profile.alertLatencyMin + profile.acknowledgeMin + profile.travelMin + profile.authMin;
  return (overhead / mttr) * 100;
}

/**
 * Full calculation for "What SLO can I achieve?" mode
 */
export function calculateAchievableSlo(
  profile: ResponseProfile,
  incidentsPerMonth: number
): AchievableSloResult {
  return {
    mttrMinutes: getMttrMinutes(profile),
    monthlyDowntimeMinutes: getMonthlyDowntimeMinutes(profile, incidentsPerMonth),
    maxAchievableSlo: calculateMaxSlo(profile, incidentsPerMonth),
    breakdown: getBudgetBreakdown(profile, incidentsPerMonth),
    responseOverheadPercent: getResponseOverheadPercent(profile),
  };
}

/**
 * Full calculation for "Can I meet this SLO?" mode
 */
export function calculateCanMeetSlo(
  profile: ResponseProfile,
  targetSlo: number,
  expectedIncidents: number
): CanMeetSloResult {
  const mttr = getMttrMinutes(profile);
  const budgetMinutes = getDowntimeBudgetMinutes(targetSlo);
  const allowedIncidents = calculateAllowedIncidents(profile, targetSlo);
  const expectedDowntime = mttr * expectedIncidents;
  const canMeet = expectedDowntime <= budgetMinutes;

  return {
    targetSlo,
    monthlyBudgetMinutes: budgetMinutes,
    mttrMinutes: mttr,
    allowedIncidents,
    expectedIncidents,
    canMeet,
    surplusOrDeficitMinutes: budgetMinutes - expectedDowntime,
  };
}

/**
 * Format minutes into human-readable duration
 */
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

/**
 * Format SLO percentage with appropriate precision
 */
export function formatSlo(slo: number): string {
  if (slo >= 99.99) {
    return slo.toFixed(3) + '%';
  }
  if (slo >= 99) {
    return slo.toFixed(2) + '%';
  }
  return slo.toFixed(1) + '%';
}

/**
 * Default response profile values
 */
export const DEFAULT_PROFILE: ResponseProfile = {
  alertLatencyMin: 5,
  acknowledgeMin: 5,
  travelMin: 2,
  authMin: 3,
  diagnoseMin: 15,
  fixMin: 20,
};

/**
 * Preset response profiles
 */
export const PRESETS: Record<string, { label: string; profile: ResponseProfile }> = {
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

/**
 * Get effective profile with disabled phases zeroed out
 */
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
