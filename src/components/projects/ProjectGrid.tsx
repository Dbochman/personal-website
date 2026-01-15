import { motion } from 'framer-motion';
import { ProjectCard } from './ProjectCard';
import type { ProjectMeta } from '@/types/project';
import { staggerContainer, staggerItem } from '@/lib/motion';

interface ProjectGridProps {
  projects: ProjectMeta[];
}

export function ProjectGrid({ projects }: ProjectGridProps) {
  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No projects available yet.</p>
      </div>
    );
  }

  return (
    <motion.div
      className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {projects.map((project) => (
        <motion.div key={project.slug} variants={staggerItem}>
          <ProjectCard project={project} />
        </motion.div>
      ))}
    </motion.div>
  );
}
