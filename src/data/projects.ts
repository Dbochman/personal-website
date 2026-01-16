import { lazy } from 'react';
import type { ProjectDefinition, ProjectMeta } from '@/types/project';

// Lazy load project components for code splitting
const UptimeCalculator = lazy(
  () => import('@/components/projects/uptime-calculator')
);
const StatusPageUpdate = lazy(
  () => import('@/components/projects/statuspage-update')
);
const OncallCoverage = lazy(
  () => import('@/components/projects/oncall-coverage')
);
const Kanban = lazy(
  () => import('@/components/projects/kanban')
);
const Analytics = lazy(
  () => import('@/components/projects/analytics')
);
const ErrorBudgetBurndown = lazy(
  () => import('@/components/projects/error-budget-burndown')
);
const ChangelogExplorer = lazy(
  () => import('@/components/projects/changelog-explorer')
);

/**
 * Project registry - single source of truth for all projects
 * Add new projects here with their metadata and lazy-loaded component
 */
export const projectRegistry: ProjectDefinition[] = [
  {
    slug: 'uptime-calculator',
    title: 'SLO Calculator',
    description:
      'Calculate realistic SLOs based on your incident response times. See how much of your error budget goes to response overhead before you even start fixing things.',
    tags: ['SRE', 'Calculator', 'SLO'],
    icon: 'Calculator',
    status: 'active',
    createdAt: '2025-01-12',
    component: UptimeCalculator,
  },
  {
    slug: 'statuspage-update',
    title: 'Status Page Update Generator',
    description:
      'Generate professional, consistent status page updates for incidents. Templates for investigating, identified, monitoring, and resolved phases.',
    tags: ['SRE', 'Incidents', 'Communication'],
    icon: 'MessageSquare',
    status: 'active',
    createdAt: '2025-01-12',
    component: StatusPageUpdate,
  },
  {
    slug: 'oncall-coverage',
    title: 'On-Call Coverage Models',
    description:
      'Compare on-call rotation models: follow-the-sun, weekly rotation, 12-hour shifts, and more. See coverage gaps, burden distribution, and tradeoffs.',
    tags: ['SRE', 'On-Call', 'Planning'],
    icon: 'Clock',
    status: 'active',
    createdAt: '2026-01-12',
    component: OncallCoverage,
  },
  {
    slug: 'kanban',
    title: 'Kanban Board',
    description:
      'Interactive task board with drag-and-drop. Create, organize, and share your boards via URL.',
    tags: ['Productivity', 'React', 'dnd-kit'],
    icon: 'Columns',
    status: 'active',
    createdAt: '2026-01-13',
    fullWidth: true,
    component: Kanban,
  },
  {
    slug: 'analytics',
    title: 'Site Analytics Dashboard',
    description:
      'Unified view of site performance: GA4 traffic, Search Console rankings, Lighthouse audits, and Real User Monitoring. Data pipelines via GitHub Actions.',
    tags: ['Analytics', 'Performance', 'Observability'],
    icon: 'BarChart3',
    status: 'active',
    createdAt: '2026-01-14',
    fullWidth: true,
    component: Analytics,
  },
  {
    slug: 'error-budget',
    title: 'Error Budget Burndown',
    description:
      "Visualize how quickly you're consuming your error budget. Input SLO target and incident history to see burn rate, projected exhaustion, and whether you're on track.",
    tags: ['SRE', 'Calculator', 'SLO'],
    icon: 'TrendingDown',
    status: 'active',
    createdAt: '2026-01-16',
    component: ErrorBudgetBurndown,
  },
  {
    slug: 'changelog',
    title: 'Change Log Explorer',
    description:
      'Browse the history of completed work on this site. Expandable cards with PR links, plan files, checklists, and timeline of each item\'s journey.',
    tags: ['Meta', 'History', 'Documentation'],
    icon: 'ScrollText',
    status: 'active',
    createdAt: '2026-01-16',
    fullWidth: true,
    component: ChangelogExplorer,
  },
];

/**
 * Get all project metadata (excludes component for list views)
 */
export function getAllProjects(): ProjectMeta[] {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return projectRegistry.map(({ component, ...meta }) => meta);
}

/**
 * Get a single project by slug (includes component)
 */
export function getProject(slug: string): ProjectDefinition | undefined {
  return projectRegistry.find((p) => p.slug === slug);
}
