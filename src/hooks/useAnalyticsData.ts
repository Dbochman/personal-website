import { useState, useEffect } from 'react';
import type {
  LatestMetrics,
  GA4HistoryEntry,
  SearchConsoleHistoryEntry,
  LighthousePageScore,
  AnalyticsData,
} from '@/components/analytics/types';

interface FetchResult<T> {
  data: T | null;
  missing: boolean;
}

async function fetchJson<T>(url: string): Promise<FetchResult<T>> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return { data: null, missing: true };
    }
    return { data: await response.json(), missing: false };
  } catch {
    return { data: null, missing: true };
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
      try {
        const [latestResult, ga4Result, searchResult, lighthouseResult] = await Promise.all([
          fetchJson<LatestMetrics>('/metrics/latest.json'),
          fetchJson<GA4HistoryEntry[]>('/metrics/ga4-history.json'),
          fetchJson<SearchConsoleHistoryEntry[]>('/metrics/search-console-history.json'),
          fetchJson<LighthousePageScore[]>('/lighthouse-reports/summary.json'),
        ]);

        // Track missing files for warning
        const missingFiles: string[] = [];
        if (latestResult.missing) missingFiles.push('latest.json');
        if (ga4Result.missing) missingFiles.push('ga4-history.json');
        if (searchResult.missing) missingFiles.push('search-console-history.json');
        if (lighthouseResult.missing) missingFiles.push('lighthouse summary');

        const warning = missingFiles.length > 0
          ? `Some metrics data unavailable: ${missingFiles.join(', ')}`
          : null;

        setData({
          latest: latestResult.data,
          ga4History: ga4Result.data ?? [],
          searchHistory: searchResult.data ?? [],
          lighthouseSummary: lighthouseResult.data ?? [],
          isLoading: false,
          error: null,
          warning,
        });
      } catch (err) {
        setData((prev) => ({
          ...prev,
          isLoading: false,
          error: err instanceof Error ? err.message : 'Failed to load analytics data',
          warning: null,
        }));
      }
    }

    loadData();
  }, []);

  return data;
}
