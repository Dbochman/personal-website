/**
 * Traffic classification utilities for identifying CI/bot traffic patterns.
 * Based on the ci-analytics-pollution skill.
 *
 * Since we don't have user agent data in stored GA4 history, we use heuristics:
 * - Known test/probe paths
 * - Session-to-user ratios (CI traffic tends to be 1:1)
 * - Path patterns commonly hit by bots
 */

// Patterns that indicate CI/test traffic
const CI_TEST_PATTERNS = [
  /this-page-does-not-exist/i,
  /test-route/i,
  /404-test/i,
  /non-existent/i,
  /__test__/i,
  /\/e2e\//i,
];

// Patterns that indicate bot/scanner traffic
const BOT_PROBE_PATTERNS = [
  /wp-admin/i,
  /wp-login/i,
  /wp-content/i,
  /xmlrpc\.php/i,
  /\.env/i,
  /\.git/i,
  /\.php$/i,
  /admin/i,
  /phpmyadmin/i,
  /\.sql/i,
  /\.bak/i,
  /\.zip/i,
  /\.tar/i,
  /cgi-bin/i,
  /\.asp/i,
  /\.aspx/i,
];

export type TrafficType = 'human' | 'ci' | 'bot' | 'synthetic';

export interface PageTrafficClassification {
  page: string;
  sessions: number;
  users: number;
  pageViews: number;
  trafficType: TrafficType;
  reason: string;
}

export interface TrafficSummary {
  totalSessions: number;
  humanSessions: number;
  ciSessions: number;
  botSessions: number;
  syntheticSessions: number;
  humanPercentage: number;
  syntheticPercentage: number;
  flaggedPages: PageTrafficClassification[];
}

/**
 * Classify a single page's traffic based on URL patterns and session/user ratio
 */
export function classifyPageTraffic(page: {
  page: string;
  sessions: number;
  users: number;
  pageViews: number;
}): PageTrafficClassification {
  const path = page.page;

  // Check for CI/test patterns
  for (const pattern of CI_TEST_PATTERNS) {
    if (pattern.test(path)) {
      return {
        ...page,
        trafficType: 'ci',
        reason: `Matches test pattern: ${pattern.source}`,
      };
    }
  }

  // Check for bot probe patterns
  for (const pattern of BOT_PROBE_PATTERNS) {
    if (pattern.test(path)) {
      return {
        ...page,
        trafficType: 'bot',
        reason: `Matches bot probe pattern: ${pattern.source}`,
      };
    }
  }

  // Check session-to-user ratio for synthetic automated traffic
  // A ratio very close to 1:1 with significant volume suggests automation
  const ratio = page.users > 0 ? page.sessions / page.users : 1;
  if (ratio >= 0.95 && ratio <= 1.05 && page.sessions >= 50) {
    return {
      ...page,
      trafficType: 'synthetic',
      reason: `Near 1:1 session/user ratio (${ratio.toFixed(2)}) suggests automated traffic`,
    };
  }

  return {
    ...page,
    trafficType: 'human',
    reason: 'Normal traffic pattern',
  };
}

/**
 * Analyze all pages and generate a traffic quality summary
 */
export function analyzeTrafficQuality(
  topPages: Array<{
    page: string;
    sessions: number;
    users: number;
    pageViews: number;
  }>
): TrafficSummary {
  const classifications = topPages.map(classifyPageTraffic);

  let humanSessions = 0;
  let ciSessions = 0;
  let botSessions = 0;
  let syntheticSessions = 0;

  const flaggedPages: PageTrafficClassification[] = [];

  for (const classification of classifications) {
    switch (classification.trafficType) {
      case 'human':
        humanSessions += classification.sessions;
        break;
      case 'ci':
        ciSessions += classification.sessions;
        flaggedPages.push(classification);
        break;
      case 'bot':
        botSessions += classification.sessions;
        flaggedPages.push(classification);
        break;
      case 'synthetic':
        syntheticSessions += classification.sessions;
        flaggedPages.push(classification);
        break;
    }
  }

  const totalSessions = humanSessions + ciSessions + botSessions + syntheticSessions;
  const allNonHumanSessions = ciSessions + botSessions + syntheticSessions;

  return {
    totalSessions,
    humanSessions,
    ciSessions,
    botSessions,
    syntheticSessions,
    humanPercentage: totalSessions > 0 ? (humanSessions / totalSessions) * 100 : 100,
    syntheticPercentage: totalSessions > 0 ? (allNonHumanSessions / totalSessions) * 100 : 0,
    flaggedPages: flaggedPages.sort((a, b) => b.sessions - a.sessions),
  };
}

/**
 * Get a color class for a traffic type
 */
export function getTrafficTypeColor(type: TrafficType): string {
  switch (type) {
    case 'human':
      return 'text-green-600 dark:text-green-400';
    case 'ci':
      return 'text-blue-600 dark:text-blue-400';
    case 'bot':
      return 'text-orange-600 dark:text-orange-400';
    case 'synthetic':
      return 'text-yellow-600 dark:text-yellow-400';
  }
}

/**
 * Get a badge style for a traffic type
 */
export function getTrafficTypeBadge(type: TrafficType): string {
  switch (type) {
    case 'human':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    case 'ci':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    case 'bot':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
    case 'synthetic':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
  }
}
