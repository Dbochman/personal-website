import { useState, useEffect } from 'react';
import type {
  LatestMetrics,
  GA4HistoryEntry,
  SearchConsoleHistoryEntry,
  LighthousePageScore,
  AnalyticsData,
} from '@/components/analytics/types';

type FetchResult<T> =
  | { status: 'success'; data: T }
  | { status: 'missing' }  // 404 - file not found
  | { status: 'error'; message: string };  // network/server errors

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
    isLoading: true,
    error: null,
    warning: null,
  });

  useEffect(() => {
    async function loadData() {
      const [latestResult, ga4Result, searchResult, lighthouseResult] = await Promise.all([
        fetchJson<LatestMetrics>('/metrics/latest.json'),
        fetchJson<GA4HistoryEntry[]>('/metrics/ga4-history.json'),
        fetchJson<SearchConsoleHistoryEntry[]>('/metrics/search-console-history.json'),
        fetchJson<LighthousePageScore[]>('/lighthouse-reports/summary.json'),
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
        ga4History: ga4Result.status === 'success' ? ga4Result.data : [],
        searchHistory: searchResult.status === 'success' ? searchResult.data : [],
        lighthouseSummary: lighthouseResult.status === 'success' ? lighthouseResult.data : [],
        isLoading: false,
        error: null,
        warning,
      });
    }

    loadData();
  }, []);

  return data;
}
