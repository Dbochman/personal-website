import { lazy } from 'react';
import type { ProjectDefinition, ProjectMeta } from '@/types/project';
import projectsMeta from './projects-meta.json';

// Lazy load project components for code splitting
const componentMap: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  'slo-tool': lazy(() => import('@/components/projects/slo-tool')),
  'statuspage-update': lazy(() => import('@/components/projects/statuspage-update')),
  'oncall-coverage': lazy(() => import('@/components/projects/oncall-coverage')),
  'kanban': lazy(() => import('@/components/projects/kanban')),
  'analytics': lazy(() => import('@/components/projects/analytics')),
  'changelog': lazy(() => import('@/components/projects/changelog-explorer')),
};

/**
 * Project registry - single source of truth for all projects
 * Metadata is imported from projects-meta.json (shared with build scripts)
 * Components are lazy-loaded for code splitting
 */
export const projectRegistry: ProjectDefinition[] = (projectsMeta as ProjectMeta[]).map(
  (meta) => ({
    ...meta,
    component: componentMap[meta.slug],
  })
);

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
