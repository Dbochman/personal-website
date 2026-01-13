export type Region = 'US' | 'EU' | 'APAC' | 'Single';

export interface TeamMember {
  name: string;
  timezone: string;
  region: Region;
  workingHours: string; // e.g., "9am-5pm ET"
  hoursPerWeek: number;
  nightHours: number;
  weekendHours: number;
}

export interface CoverageSlot {
  hourUtc: number; // 0-23
  dayOfWeek: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  covered: boolean;
  coveringMembers: string[]; // member names
}

export interface ModelMetrics {
  coveragePercent: number;
  nightHoursPerPerson: number;
  weekendHoursPerPerson: number;
  hoursPerWeekPerPerson: number;
  teamSize: number;
  shiftLength: string; // e.g., "8h", "12h", "24h"
  rotation: string; // e.g., "Weekly", "Daily handoff"
  onCallFrequency: string; // e.g., "1 week every 8 weeks"
  handoffsPerWeek: number; // number of shift transitions per week
}

export interface ModelTradeoffs {
  pros: string[];
  cons: string[];
}

export type RotationType = 'weekly' | 'daily' | 'shift';

export interface CoverageModel {
  id: string;
  name: string;
  description: string;
  rotationType: RotationType; // Determines which heatmap view to show
  rotationWeeks?: number; // For weekly rotations, how many weeks in the cycle
  team: TeamMember[];
  coverage: CoverageSlot[][]; // 7 days x 24 hours
  metrics: ModelMetrics;
  tradeoffs: ModelTradeoffs;
}

export const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

// Region colors for team list - matches DailyHeatmap
export const REGION_COLORS: Record<Region, { bg: string; text: string }> = {
  US: { bg: 'bg-emerald-500', text: 'text-emerald-500' },
  EU: { bg: 'bg-rose-400', text: 'text-rose-400' },
  APAC: { bg: 'bg-violet-400', text: 'text-violet-400' },
  Single: { bg: 'bg-purple-500', text: 'text-purple-500' },
};

// Timezone to label mapping
export const TIMEZONE_LABELS: Record<string, string> = {
  'Asia/Tokyo': 'APAC (Tokyo)',
  'Asia/Singapore': 'APAC (Singapore)',
  'Asia/Shanghai': 'APAC (Shanghai)',
  'Europe/London': 'EU (London)',
  'Europe/Paris': 'EU (Paris)',
  'Europe/Berlin': 'EU (Berlin)',
  'America/New_York': 'US (New York)',
  'America/Los_Angeles': 'US (Los Angeles)',
  'America/Chicago': 'US (Chicago)',
};
