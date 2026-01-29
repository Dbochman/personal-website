import { useState, useEffect } from 'react';
import type {
  LatestMetrics,
  GA4HistoryEntry,
  SearchConsoleHistoryEntry,
  LighthousePageScore,
  GitHubBillingEntry,
  AnalyticsData,
} from '@/components/analytics/types';

type FetchResult<T> =
  | { status: 'success'; data: T }
  | { status: 'missing' }  // 404 - file not found
  | { status: 'error'; message: string };  // network/server errors

/**
 * Deduplicate time-series data by date, keeping the latest entry per date.
 * Handles data where automated collection may create multiple entries per day.
 */
function deduplicateByDate<T extends { date: string; timestamp?: string }>(
  entries: T[]
): T[] {
  const byDate = new Map<string, T>();

  for (const entry of entries) {
    const existing = byDate.get(entry.date);
    // Keep entry if no existing, or if this one is newer (by timestamp if available)
    if (!existing) {
      byDate.set(entry.date, entry);
    } else if (entry.timestamp && existing.timestamp && entry.timestamp > existing.timestamp) {
      byDate.set(entry.date, entry);
    }
  }

  // Return sorted by date ascending
  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}

async function fetchJson<T>(url: string): Promise<FetchResult<T>> {
  try {
    const response = await fetch(url);
    if (response.status === 404) {
      return { status: 'missing' };
    }
    if (!response.ok) {
      return { status: 'error', message: `HTTP ${response.status}: ${response.statusText}` };
    }
    return { status: 'success', data: await response.json() };
  } catch (err) {
    return { status: 'error', message: err instanceof Error ? err.message : 'Network error' };
  }
}

export function useAnalyticsData(): AnalyticsData {
  const [data, setData] = useState<AnalyticsData>({
    latest: null,
    ga4History: [],
    searchHistory: [],
    lighthouseSummary: [],
    billingHistory: [],
    isLoading: true,
    error: null,
    warning: null,
  });

  useEffect(() => {
    async function loadData() {
      const [latestResult, ga4Result, searchResult, lighthouseResult, billingResult] = await Promise.all([
        fetchJson<LatestMetrics>('/metrics/latest.json'),
        fetchJson<GA4HistoryEntry[]>('/metrics/ga4-history.json'),
        fetchJson<SearchConsoleHistoryEntry[]>('/metrics/search-console-history.json'),
        fetchJson<LighthousePageScore[]>('/lighthouse-reports/summary.json'),
        fetchJson<GitHubBillingEntry[]>('/metrics/github-billing-history.json'),
      ]);

      // Track missing files (404s) for warning
      const missingFiles: string[] = [];
      // Track actual errors (network, 500s) for error state
      const errors: string[] = [];

      const results = [
        { name: 'latest.json', result: latestResult },
        { name: 'ga4-history.json', result: ga4Result },
        { name: 'search-console-history.json', result: searchResult },
        { name: 'lighthouse summary', result: lighthouseResult },
        { name: 'github-billing-history.json', result: billingResult },
      ];

      for (const { name, result } of results) {
        if (result.status === 'missing') {
          missingFiles.push(name);
        } else if (result.status === 'error') {
          errors.push(`${name}: ${result.message}`);
        }
      }

      // If we have actual errors, show error state
      if (errors.length > 0) {
        setData((prev) => ({
          ...prev,
          isLoading: false,
          error: `Failed to load: ${errors.join('; ')}`,
          warning: null,
        }));
        return;
      }

      // Otherwise show data with optional missing files warning
      const warning = missingFiles.length > 0
        ? `Some metrics data unavailable: ${missingFiles.join(', ')}`
        : null;

      setData({
        latest: latestResult.status === 'success' ? latestResult.data : null,
        ga4History: ga4Result.status === 'success' ? deduplicateByDate(ga4Result.data) : [],
        searchHistory: searchResult.status === 'success' ? deduplicateByDate(searchResult.data) : [],
        lighthouseSummary: lighthouseResult.status === 'success' ? lighthouseResult.data : [],
        billingHistory: billingResult.status === 'success' ? deduplicateByDate(billingResult.data) : [],
        isLoading: false,
        error: null,
        warning,
      });
    }

    loadData();
  }, []);

  return data;
}
