/**
 * GA4 event tracking for interactive tools (SLO Calculator, CLI Playground, On-Call Coverage)
 *
 * Event schema:
 * - event_category: 'tools'
 * - tool_name: identifies which tool
 * - action: what the user did
 * - event_label: additional context (e.g., tab name, tool name, model ID)
 */

export type ToolName = 'slo_calculator' | 'cli_playground' | 'oncall_coverage' | 'k8s_rightsizer';

interface ToolEventParams {
  tool_name: ToolName;
  action: string;
  event_label: string;
}

/**
 * Track a tool interaction event in GA4
 *
 * Only fires in production and when gtag is available.
 */
export function trackToolEvent(params: ToolEventParams): void {
  // Only track in production
  if (import.meta.env.MODE !== 'production') {
    return;
  }

  // Check if gtag is available
  if (typeof window === 'undefined' || !window.gtag) {
    return;
  }

  window.gtag('event', 'tool_interaction', {
    event_category: 'tools',
    ...params,
  });
}
