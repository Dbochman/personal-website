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
}

export interface ModelTradeoffs {
  pros: string[];
  cons: string[];
}

export interface CoverageModel {
  id: string;
  name: string;
  description: string;
  team: TeamMember[];
  coverage: CoverageSlot[][]; // 7 days x 24 hours
  metrics: ModelMetrics;
  tradeoffs: ModelTradeoffs;
}

export const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

// Region colors for team list
export const REGION_COLORS: Record<Region, { bg: string; text: string }> = {
  US: { bg: 'bg-blue-500', text: 'text-blue-500' },
  EU: { bg: 'bg-emerald-500', text: 'text-emerald-500' },
  APAC: { bg: 'bg-amber-500', text: 'text-amber-500' },
  Single: { bg: 'bg-purple-500', text: 'text-purple-500' },
};
