import { describe, expect, it } from 'vitest';
import { getAllProjects } from './projects';
import { groupProjects } from './project-groups';
import type { ProjectMeta } from '@/types/project';

describe('project directory groups', () => {
  it('shows every public project exactly once and keeps drafts excluded', () => {
    const projects = getAllProjects();
    const grouped = groupProjects(projects).flatMap(group => group.projects);
    expect(grouped.map(project => project.slug).sort()).toEqual(projects.map(project => project.slug).sort());
    expect(grouped.every(project => project.status !== 'draft')).toBe(true);
  });

  it('includes the CLI playground after publication and future projects without category edits', () => {
    const published: ProjectMeta = {
      slug: 'cli-playground', title: 'CLI Playground', description: 'Learn CLI tools',
      tags: [], status: 'active', createdAt: '2026-09-08',
    };
    const future = { ...published, slug: 'new-tool', title: 'New tool' };
    const groups = groupProjects([published, future]);
    expect(groups.find(group => group.title === 'Experiments')?.projects).toEqual([published]);
    expect(groups.find(group => group.title === 'More projects')?.projects).toEqual([future]);
  });
});
