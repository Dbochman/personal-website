import { useState, useEffect } from 'react';
import type {
  LatestMetrics,
  GA4HistoryEntry,
  SearchConsoleHistoryEntry,
  LighthousePageScore,
  AnalyticsData,
} from '@/components/analytics/types';

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
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
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [latest, ga4History, searchHistory, lighthouseSummary] = await Promise.all([
          fetchJson<LatestMetrics>('/metrics/latest.json'),
          fetchJson<GA4HistoryEntry[]>('/metrics/ga4-history.json'),
          fetchJson<SearchConsoleHistoryEntry[]>('/metrics/search-console-history.json'),
          fetchJson<LighthousePageScore[]>('/lighthouse-reports/summary.json'),
        ]);

        setData({
          latest,
          ga4History: ga4History ?? [],
          searchHistory: searchHistory ?? [],
          lighthouseSummary: lighthouseSummary ?? [],
          isLoading: false,
          error: null,
        });
      } catch (err) {
        setData((prev) => ({
          ...prev,
          isLoading: false,
          error: err instanceof Error ? err.message : 'Failed to load analytics data',
        }));
      }
    }

    loadData();
  }, []);

  return data;
}
