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
    startDate?: string;
    endDate?: string;
    windowDays?: number;
    dataState?: 'finalized';
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
  dailySessions?: Array<{
    date: string;
    sessions: number;
  }>;
  sessionAnomaly?: {
    status: 'anomaly' | 'normal' | 'insufficient-data' | 'unavailable';
    isAnomaly: boolean;
    severity: 'critical' | 'warning' | null;
    confidence: 'high' | 'low' | 'none';
    basis: 'human-sessions' | 'total-sessions' | null;
    reason: string;
    message: string;
    observedDate?: string;
    observedSessions?: number | null;
    baselineSessions?: number;
    percentageDrop?: number;
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
  collectedAt?: string;
  date: string;
  dataState?: 'final';
  windowDays?: number;
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
  detailCoverage?: {
    queries: SearchConsoleDetailCoverage;
    pages: SearchConsoleDetailCoverage;
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

interface SearchConsoleDetailCoverage {
  rowCount: number;
  clicks: number;
  impressions: number;
  impressionShare: number;
}

export interface LighthousePageScore {
  collectedAt?: string;
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
  // Sampling metadata (added when the audit runs multiple times and keeps the
  // median). Optional so older summary.json files still parse.
  runs?: number;
  performanceRange?: [number, number];
  tbtRangeMs?: [number, number] | null;
}

// GitHub Actions billing data types
export interface GitHubBillingEntry {
  timestamp: string;
  date: string;
  period: {
    start: string;
    end: string;
    description: string;
  };
  summary: {
    totalMinutes: number;
    totalGrossAmount: number;
    totalDiscountAmount: number;
    totalNetAmount: number;
  };
  byRunner: {
    linux: { minutes: number; grossAmount: number };
    macos: { minutes: number; grossAmount: number };
    windows: { minutes: number; grossAmount: number };
  };
  byRepository: Array<{
    name: string;
    minutes: number;
    grossAmount: number;
  }>;
  storage: {
    gbHours: number;
    grossAmount: number;
  };
  status: 'valid' | 'empty';
}

export interface AnalyticsData {
  latest: LatestMetrics | null;
  ga4History: GA4HistoryEntry[];
  searchHistory: SearchConsoleHistoryEntry[];
  lighthouseSummary: LighthousePageScore[];
  billingHistory: GitHubBillingEntry[];
  isLoading: boolean;
  error: string | null;
  warning: string | null;
}
