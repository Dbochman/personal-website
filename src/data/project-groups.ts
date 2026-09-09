import type { ProjectMeta } from '@/types/project';

const groups = [
  {
    title: 'Reliability tools',
    description: 'Calculators and templates to use in your next planning or incident review.',
    slugs: ['slo-tool', 'statuspage-update', 'oncall-coverage', 'incident-command-diagrams', 'k8s-rightsizer'],
  },
  {
    title: 'Experiments',
    description: 'Small applications for organizing work, learning tools, and sharing music.',
    slugs: ['kanban', 'echonest', 'cli-playground'],
  },
  {
    title: 'How this site runs',
    description: 'Public metrics and a history of changes to this website.',
    slugs: ['analytics', 'changelog'],
  },
];

/** Group the already-filtered public registry without dropping new projects. */
export function groupProjects(projects: ProjectMeta[]) {
  const knownSlugs = new Set(groups.flatMap(group => group.slugs));
  return [
    ...groups.map(({ title, description, slugs }) => ({
      title,
      description,
      projects: projects.filter(project => slugs.includes(project.slug)),
    })),
    {
      title: 'More projects',
      description: 'More tools and experiments from my work.',
      projects: projects.filter(project => !knownSlugs.has(project.slug)),
    },
  ].filter(group => group.projects.length > 0);
}
