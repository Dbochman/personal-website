/**
 * Client-side traffic classification for GA4 custom dimension.
 *
 * Classifies sessions as 'human', 'bot', or 'ci' based on user agent patterns
 * and page path. Sets a session-scoped GA4 custom dimension on first pageview.
 *
 * NOTE: This runs at page load BEFORE React hydrates, so it's vanilla JS.
 */

export type ClientTrafficType = 'human' | 'bot' | 'ci';

// Known bot user agent patterns
const BOT_USER_AGENT_PATTERNS = [
  // Search engine crawlers
  /googlebot/i,
  /bingbot/i,
  /slurp/i, // Yahoo
  /duckduckbot/i,
  /baiduspider/i,
  /yandexbot/i,
  /facebot/i,
  /facebookexternalhit/i,
  /twitterbot/i,
  /linkedinbot/i,
  /pinterest/i,
  /slackbot/i,
  /telegrambot/i,
  /whatsapp/i,
  /discordbot/i,
  // Generic bot patterns
  /bot\b/i,
  /crawler/i,
  /spider/i,
  /scraper/i,
  /fetcher/i,
  // Monitoring/uptime checkers
  /uptimerobot/i,
  /pingdom/i,
  /newrelic/i,
  /datadog/i,
  /statuscake/i,
  // SEO tools
  /ahrefsbot/i,
  /semrushbot/i,
  /mj12bot/i,
  /dotbot/i,
  /petalbot/i,
  // AI/LLM crawlers
  /gptbot/i,
  /chatgpt/i,
  /claudebot/i,
  /anthropic/i,
  /ccbot/i,
  /perplexitybot/i,
];

// CI/automation user agent patterns
const CI_USER_AGENT_PATTERNS = [
  /headlesschrome/i,
  /playwright/i,
  /puppeteer/i,
  /selenium/i,
  /webdriver/i,
  /phantomjs/i,
  /cypress/i,
  /nightwatch/i,
  /chromium/i, // Headless chromium often used in CI
  /github-actions/i,
];

// Known probe paths (security scanners, WordPress exploits, etc.)
const PROBE_PATH_PATTERNS = [
  /wp-admin/i,
  /wp-login/i,
  /wp-content/i,
  /wp-includes/i,
  /xmlrpc\.php/i,
  /\.env/i,
  /\.git/i,
  /\.php$/i,
  /phpmyadmin/i,
  /admin/i,
  /\.sql/i,
  /\.bak/i,
  /\.zip/i,
  /\.tar/i,
  /cgi-bin/i,
  /\.asp/i,
  /\.aspx/i,
  /shell/i,
  /config\./i,
  /backup/i,
];

// CI/test paths
const CI_PATH_PATTERNS = [
  /this-page-does-not-exist/i,
  /test-route/i,
  /404-test/i,
  /non-existent/i,
  /__test__/i,
  /\/e2e\//i,
];

export interface TrafficClassificationResult {
  type: ClientTrafficType;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
  matchedPattern?: string;
}

/**
 * Classify the current session based on user agent and path.
 */
export function classifyClientTraffic(): TrafficClassificationResult {
  const userAgent = navigator.userAgent || '';
  const path = window.location.pathname || '/';

  // Check CI user agent patterns (high confidence)
  for (const pattern of CI_USER_AGENT_PATTERNS) {
    if (pattern.test(userAgent)) {
      return {
        type: 'ci',
        confidence: 'high',
        reason: 'CI/automation user agent detected',
        matchedPattern: pattern.source,
      };
    }
  }

  // Check bot user agent patterns (high confidence)
  for (const pattern of BOT_USER_AGENT_PATTERNS) {
    if (pattern.test(userAgent)) {
      return {
        type: 'bot',
        confidence: 'high',
        reason: 'Bot user agent detected',
        matchedPattern: pattern.source,
      };
    }
  }

  // Check CI/test paths (medium confidence - could be human testing)
  for (const pattern of CI_PATH_PATTERNS) {
    if (pattern.test(path)) {
      return {
        type: 'ci',
        confidence: 'medium',
        reason: 'Test path accessed',
        matchedPattern: pattern.source,
      };
    }
  }

  // Check probe paths (high confidence - definitely not human)
  for (const pattern of PROBE_PATH_PATTERNS) {
    if (pattern.test(path)) {
      return {
        type: 'bot',
        confidence: 'high',
        reason: 'Probe/exploit path accessed',
        matchedPattern: pattern.source,
      };
    }
  }

  // Default to human
  return {
    type: 'human',
    confidence: 'medium',
    reason: 'No bot/CI patterns detected',
  };
}

// Session storage key for caching classification
const STORAGE_KEY = 'traffic_classification';

/**
 * Get or compute traffic classification for the current session.
 * Caches the result in sessionStorage to maintain consistency across SPA navigation.
 */
export function getSessionTrafficType(): ClientTrafficType {
  // Try to get cached classification
  try {
    const cached = sessionStorage.getItem(STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached) as TrafficClassificationResult;
      return parsed.type;
    }
  } catch {
    // sessionStorage not available (private mode, etc.)
  }

  // Compute and cache
  const result = classifyClientTraffic();

  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(result));
  } catch {
    // Ignore storage errors
  }

  return result.type;
}

/**
 * Set the traffic_type custom dimension in GA4.
 * Call this BEFORE the first pageview event.
 */
export function setGA4TrafficType(): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gtag = (window as any).gtag;

  if (typeof window === 'undefined' || !gtag) {
    return;
  }

  const trafficType = getSessionTrafficType();

  // Set as a user property (persists for the session)
  gtag('set', 'user_properties', {
    traffic_type: trafficType,
  });

  // Also send as event parameter for immediate visibility
  gtag('event', 'traffic_classified', {
    traffic_type: trafficType,
    event_category: 'analytics',
  });

  // Log in development for debugging
  if (import.meta.env.MODE !== 'production') {
    console.log('[Traffic Classification]', classifyClientTraffic());
  }
}
