/**
 * PageSpeed Insights API Utility
 *
 * Uses Google's free PageSpeed Insights API to fetch performance metrics,
 * Core Web Vitals, and SEO scores for the website.
 *
 * No API key required for basic usage (rate limited to ~25 requests/100 seconds)
 *
 * @see https://developers.google.com/speed/docs/insights/v5/get-started
 */

export interface PageSpeedMetrics {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
  coreWebVitals: {
    lcp: number;  // Largest Contentful Paint (ms)
    fid: number;  // First Input Delay (ms) - legacy
    cls: number;  // Cumulative Layout Shift (score)
    inp?: number; // Interaction to Next Paint (ms) - replaces FID
    fcp: number;  // First Contentful Paint (ms)
    ttfb: number; // Time to First Byte (ms)
  };
  timestamp: string;
  fetchTime: string;
}

export interface PageSpeedError {
  error: string;
  message: string;
}

/**
 * Fetch PageSpeed Insights metrics for a given URL
 *
 * @param url - The URL to analyze (e.g., 'https://dylanbochman.com')
 * @param strategy - 'mobile' or 'desktop' (default: 'mobile')
 * @returns PageSpeed metrics including Core Web Vitals
 */
export async function getPageSpeedMetrics(
  url: string,
  strategy: 'mobile' | 'desktop' = 'mobile'
): Promise<PageSpeedMetrics | PageSpeedError> {
  const apiUrl = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
  apiUrl.searchParams.set('url', url);
  apiUrl.searchParams.set('strategy', strategy);
  apiUrl.searchParams.set('category', 'PERFORMANCE');
  apiUrl.searchParams.set('category', 'ACCESSIBILITY');
  apiUrl.searchParams.set('category', 'BEST_PRACTICES');
  apiUrl.searchParams.set('category', 'SEO');

  try {
    const response = await fetch(apiUrl.toString());

    if (!response.ok) {
      throw new Error(`PageSpeed API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Extract Lighthouse categories
    const categories = data.lighthouseResult?.categories;
    if (!categories) {
      throw new Error('Invalid PageSpeed API response: missing categories');
    }

    // Extract Core Web Vitals from audits
    const audits = data.lighthouseResult?.audits;
    if (!audits) {
      throw new Error('Invalid PageSpeed API response: missing audits');
    }

    return {
      performance: Math.round((categories.performance?.score ?? 0) * 100),
      accessibility: Math.round((categories.accessibility?.score ?? 0) * 100),
      bestPractices: Math.round((categories['best-practices']?.score ?? 0) * 100),
      seo: Math.round((categories.seo?.score ?? 0) * 100),
      coreWebVitals: {
        lcp: audits['largest-contentful-paint']?.numericValue ?? 0,
        fid: audits['max-potential-fid']?.numericValue ?? 0, // Legacy metric
        cls: audits['cumulative-layout-shift']?.numericValue ?? 0,
        inp: audits['interaction-to-next-paint']?.numericValue, // May not be available
        fcp: audits['first-contentful-paint']?.numericValue ?? 0,
        ttfb: audits['server-response-time']?.numericValue ?? 0,
      },
      timestamp: data.lighthouseResult?.fetchTime ?? new Date().toISOString(),
      fetchTime: new Date().toISOString(),
    };
  } catch (error) {
    return {
      error: 'PageSpeed API Error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Check if the result is an error
 */
export function isPageSpeedError(
  result: PageSpeedMetrics | PageSpeedError
): result is PageSpeedError {
  return 'error' in result;
}

/**
 * Format Core Web Vitals for display
 *
 * Provides human-readable assessment of each metric based on Google's thresholds
 */
export function assessCoreWebVitals(metrics: PageSpeedMetrics['coreWebVitals']): {
  lcp: 'good' | 'needs-improvement' | 'poor';
  fid: 'good' | 'needs-improvement' | 'poor';
  cls: 'good' | 'needs-improvement' | 'poor';
  inp?: 'good' | 'needs-improvement' | 'poor';
} {
  return {
    lcp: metrics.lcp <= 2500 ? 'good' : metrics.lcp <= 4000 ? 'needs-improvement' : 'poor',
    fid: metrics.fid <= 100 ? 'good' : metrics.fid <= 300 ? 'needs-improvement' : 'poor',
    cls: metrics.cls <= 0.1 ? 'good' : metrics.cls <= 0.25 ? 'needs-improvement' : 'poor',
    inp: metrics.inp
      ? metrics.inp <= 200 ? 'good' : metrics.inp <= 500 ? 'needs-improvement' : 'poor'
      : undefined,
  };
}
