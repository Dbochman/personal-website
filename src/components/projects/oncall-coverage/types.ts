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
  US: { bg: 'bg-emerald-700', text: 'text-emerald-700' },
  EU: { bg: 'bg-rose-400', text: 'text-rose-400' },
  APAC: { bg: 'bg-violet-400', text: 'text-violet-400' },
  Single: { bg: 'bg-purple-500', text: 'text-purple-500' },
};

// Member colors for rotation views (index-based, pastel)
export const MEMBER_COLORS = [
  { bg: 'bg-emerald-200 dark:bg-emerald-800', strip: 'bg-emerald-400 dark:bg-emerald-600', text: 'text-emerald-800 dark:text-emerald-200' },
  { bg: 'bg-rose-200 dark:bg-rose-800', strip: 'bg-rose-400 dark:bg-rose-600', text: 'text-rose-800 dark:text-rose-200' },
  { bg: 'bg-violet-200 dark:bg-violet-800', strip: 'bg-violet-400 dark:bg-violet-600', text: 'text-violet-800 dark:text-violet-200' },
  { bg: 'bg-amber-200 dark:bg-amber-800', strip: 'bg-amber-400 dark:bg-amber-600', text: 'text-amber-800 dark:text-amber-200' },
  { bg: 'bg-sky-200 dark:bg-sky-800', strip: 'bg-sky-400 dark:bg-sky-600', text: 'text-sky-800 dark:text-sky-200' },
  { bg: 'bg-pink-200 dark:bg-pink-800', strip: 'bg-pink-400 dark:bg-pink-600', text: 'text-pink-800 dark:text-pink-200' },
  { bg: 'bg-teal-200 dark:bg-teal-800', strip: 'bg-teal-400 dark:bg-teal-600', text: 'text-teal-800 dark:text-teal-200' },
  { bg: 'bg-orange-200 dark:bg-orange-800', strip: 'bg-orange-400 dark:bg-orange-600', text: 'text-orange-800 dark:text-orange-200' },
];

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
