export const GA4_DAILY_LOOKBACK_DAYS: number;
export const GA4_REPORTING_WINDOW_DAYS: number;

export interface DailySession {
  date: string;
  sessions: number;
}

export interface GA4Row {
  dimensionValues?: Array<{ value?: string | null }>;
  metricValues?: Array<{ value?: string | null }>;
}

export interface CompletedPeriod {
  description: string;
  startDate: string;
  endDate: string;
  windowDays: number;
  dataState: 'finalized';
}

export interface AnomalyResult {
  status: 'anomaly' | 'normal' | 'insufficient-data';
  isAnomaly: boolean;
  severity: 'critical' | 'warning' | null;
  reason: string;
  message: string;
  observedDate?: string;
  observedSessions?: number | null;
  baselineSessions?: number;
  baselineDates?: string[];
  absoluteDrop?: number;
  percentageDrop?: number;
  previousDate?: string;
  previousSessions?: number;
  previousBaselineSessions?: number;
}

export interface AnomalyOptions {
  minimumBaseline?: number;
  minimumAbsoluteDrop?: number;
  dropRatio?: number;
  nearZeroRatio?: number;
  nearZeroMaximum?: number;
}

export function addDays(dateString: string, days: number): string;
export function formatDateInTimeZone(date: Date, timeZone?: string): string;
export function normalizeGA4Date(value: string): string;
export function buildCompletedPeriod(endDate: string, windowDays?: number): CompletedPeriod;
export function buildDailySessionSeries(
  rows: GA4Row[] | null | undefined,
  range: { startDate: string; endDate: string }
): DailySession[];
export function hasMatureSessionCoverage(
  dailySessions: DailySession[] | null | undefined,
  endDate: string,
  options?: { minimumObservedDays?: number; historyDays?: number }
): boolean;
export function detectSameWeekdayAnomaly(
  dailySessions: DailySession[] | null | undefined,
  overrides?: AnomalyOptions
): AnomalyResult;
