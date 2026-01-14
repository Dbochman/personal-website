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

/**
 * Project registry - single source of truth for all projects
 * Add new projects here with their metadata and lazy-loaded component
 */
export const projectRegistry: ProjectDefinition[] = [
  {
    slug: 'uptime-calculator',
    title: 'SLO Uptime Calculator',
    description:
      'Calculate realistic SLOs based on your incident response times. See how much of your error budget goes to response overhead before you even start fixing things.',
    tags: ['SRE', 'Calculator', 'SLA'],
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
    component: Kanban,
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
