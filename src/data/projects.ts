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
  'cli-playground': lazy(() => import('@/components/projects/cli-playground')),
  'incident-command-diagrams': lazy(() => import('@/components/projects/incident-command-diagrams')),
  'k8s-rightsizer': lazy(() => import('@/components/projects/k8s-rightsizer')),
  'echonest': lazy(() => import('@/components/projects/echonest')),
};

/**
 * Project registry - single source of truth for all projects
 * Metadata is imported from projects-meta.json (shared with build scripts)
 * Components are lazy-loaded for code splitting
 */
export const projectRegistry: ProjectDefinition[] = (projectsMeta as ProjectMeta[]).map(
  (meta) => {
    const component = componentMap[meta.slug];
    if (!component) {
      throw new Error(
        `Project "${meta.slug}" in projects-meta.json has no matching component in componentMap. ` +
          `Add it to componentMap or remove from projects-meta.json.`
      );
    }
    return {
      ...meta,
      component,
    };
  }
);

/**
 * Get all project metadata (excludes component for list views)
 * Filters out draft projects by default
 */
export function getAllProjects(includeDrafts = false): ProjectMeta[] {
  return projectRegistry
    .filter((p) => includeDrafts || p.status !== 'draft')
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .map(({ component, ...meta }) => meta);
}

/**
 * Get a single project by slug (includes component)
 */
export function getProject(slug: string): ProjectDefinition | undefined {
  return projectRegistry.find((p) => p.slug === slug);
}
