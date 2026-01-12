import { lazy } from 'react';
import type { ProjectDefinition, ProjectMeta } from '@/types/project';

// Lazy load project components for code splitting
const PlaceholderProject = lazy(
  () => import('@/components/projects/PlaceholderProject')
);

/**
 * Project registry - single source of truth for all projects
 * Add new projects here with their metadata and lazy-loaded component
 */
export const projectRegistry: ProjectDefinition[] = [
  {
    slug: 'placeholder',
    title: 'Placeholder Project',
    description:
      'A placeholder project for testing the projects infrastructure. This will be replaced with real projects.',
    tags: ['Testing', 'Infrastructure'],
    icon: 'Box',
    status: 'experimental',
    createdAt: '2025-01-12',
    component: PlaceholderProject,
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
