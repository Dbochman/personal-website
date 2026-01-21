// Types for analytics data from docs/metrics/*.json

export interface WebVitalMetric {
  count: number;
  average: number;
  unit: string;
}

export interface WebVitalsData {
  lastCheck: string;
  source: 'rum';
  metrics: {
    LCP?: WebVitalMetric;
    FCP?: WebVitalMetric;
    CLS?: WebVitalMetric;
    INP?: WebVitalMetric;
    TTFB?: WebVitalMetric;
  };
}

export interface LatestMetrics {
  generated: string;
  searchConsole: {
    lastCheck: string;
    clicks: number;
    impressions: number;
    averageCTR: number;
    averagePosition: number;
  };
  analytics: {
    lastCheck: string;
    sessions_7d: number;
    users_7d: number;
    pageviews_7d: number;
    avgSessionDuration: number;
    bounceRate: number;
    topPages: Array<{ page: string; pageViews: number }>;
  };
  webVitals?: WebVitalsData;
}

export interface GA4HistoryEntry {
  timestamp: string;
  date: string;
  period: {
    description: string;
  };
  summary: {
    sessions: number;
    users: number;
    pageViews: number;
    averageSessionDuration: number;
    bounceRate: number;
  };
  topPages: Array<{
    page: string;
    sessions: number;
    users: number;
    pageViews: number;
  }>;
  deviceBreakdown: Array<{
    device: string;
    sessions: number;
    users: number;
  }>;
  trafficSources?: {
    channels: Array<{
      channel: string;
      sessions: number;
      users: number;
    }>;
    sources: Array<{
      source: string;
      medium: string;
      sessions: number;
      users: number;
    }>;
  };
  toolInteractions?: {
    total: number;
    byTool: Array<{
      name: string;
      total: number;
      actions: Array<{
        action: string;
        count: number;
      }>;
    }>;
  } | null;
}

export interface SearchConsoleHistoryEntry {
  timestamp: string;
  date: string;
  period: {
    start: string;
    end: string;
  };
  summary: {
    totalClicks: number;
    totalImpressions: number;
    averageCTR: number;
    averagePosition: number;
  };
  topQueries?: Array<{
    query: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
  topPages?: Array<{
    page: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
}

export interface LighthousePageScore {
  page: string;
  url: string;
  performance: number;
  accessibility: number;
  seo: number;
  bestPractices: number;
  lcp: string;
  fcp: string;
  cls: string;
  tbt: string;
}

export interface AnalyticsData {
  latest: LatestMetrics | null;
  ga4History: GA4HistoryEntry[];
  searchHistory: SearchConsoleHistoryEntry[];
  lighthouseSummary: LighthousePageScore[];
  isLoading: boolean;
  error: string | null;
  warning: string | null;
}
