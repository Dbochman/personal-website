import type { SearchConsoleHistoryEntry } from '../src/components/analytics/types';

export interface SearchConsoleRow {
  keys?: string[] | null;
  clicks?: number | null;
  impressions?: number | null;
  ctr?: number | null;
  position?: number | null;
}

interface SearchSummary {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface SearchResponse {
  rows?: SearchConsoleRow[] | null;
  metadata?: { firstIncompleteDate?: string | null } | null;
}

interface SearchRequest {
  startDate: string;
  endDate: string;
  dataState?: string;
}

export type SearchAnalyticsQuery = (params: {
  siteUrl: string;
  requestBody: SearchRequest & { dimensions: string[]; rowLimit: number; startRow: number };
}) => Promise<{ data: SearchResponse }>;

export const SEARCH_WINDOW_DAYS: number;
export const HISTORY_RETENTION_DAYS: number;
export const FRESHNESS_LOOKBACK_DAYS: number;
export const SEARCH_ANALYTICS_PAGE_SIZE: number;
export function addDays(dateString: string, days: number): string;
export function formatDateInTimeZone(date: Date, timeZone?: string): string;
export function buildDateRange(endDate: string, days: number): { start: string; end: string };
export function round(value: number, decimals: number): number;
export function asPercent(ctrRatio: number | null | undefined): number;
export function weightedAveragePosition(entries: SearchConsoleRow[]): number;
export function summarizeRows(rows: SearchConsoleRow[]): SearchSummary;
export function aggregateRows<Label extends string>(
  rows: SearchConsoleRow[], keyIndex: number, label: Label,
): Array<SearchSummary & Record<Label, string>>;
export function resolveLatestFinalDate(responseData: SearchResponse): string;
export function fetchAllRows(options: {
  query: SearchAnalyticsQuery;
  siteUrl: string;
  requestBody: SearchRequest;
  dimensions: string[];
  pageSize?: number;
}): Promise<SearchConsoleRow[]>;
export function buildRollingHistory(options: {
  dailyRows: SearchConsoleRow[];
  latestFinalDate: string;
  windowDays?: number;
  retentionDays?: number;
}): SearchConsoleHistoryEntry[];
export function buildDetailCoverage(rows: SearchConsoleRow[], totalImpressions: number): {
  rowCount: number;
  clicks: number;
  impressions: number;
  impressionShare: number;
};
