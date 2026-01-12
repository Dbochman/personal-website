import { lazy } from 'react';
import type { ProjectDefinition, ProjectMeta } from '@/types/project';

// Lazy load project components for code splitting
const UptimeCalculator = lazy(
  () => import('@/components/projects/uptime-calculator')
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
