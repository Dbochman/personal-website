import { useState, memo } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Box,
  Calculator,
  Clock,
  Columns,
  FileText,
  Gauge,
  ListMusic,
  MessageSquare,
  ScrollText,
  Target,
  Terminal,
  TrendingDown,
  type LucideIcon,
} from 'lucide-react';
import { TransitionLink } from '@/hooks/useViewTransition';
import type { ProjectMeta } from '@/types/project';
import { preloadProject } from '@/App';

// Icon registry - add icons here as new projects are added
const iconRegistry: Record<string, LucideIcon> = {
  AlertTriangle,
  BarChart3,
  Box,
  Calculator,
  Clock,
  Columns,
  FileText,
  Gauge,
  ListMusic,
  MessageSquare,
  ScrollText,
  Target,
  Terminal,
  TrendingDown,
};

interface ProjectCardProps {
  project: ProjectMeta;
}

export const ProjectCard = memo(function ProjectCard({ project }: ProjectCardProps) {
  const [hasBeenHovered, setHasBeenHovered] = useState(false);

  const handleFirstInteraction = () => {
    if (!hasBeenHovered) {
      // Preload the Project page chunk for smooth view transitions
      preloadProject();
      if (typeof gtag !== 'undefined') {
        gtag('event', 'project_card_expand', {
          event_category: 'engagement',
          event_label: project.slug,
        });
      }
      setHasBeenHovered(true);
    }
  };

  // Icon lookup from registry
  const IconComponent = project.icon ? iconRegistry[project.icon] : null;

  return (
    <TransitionLink
      to={`/projects/${project.slug}`}
      className="block group rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4"
      onMouseEnter={handleFirstInteraction}
      onFocus={handleFirstInteraction}
    >
      <div className="h-full rounded-xl overflow-hidden border border-border bg-card hover:border-foreground/30 focus-within:border-foreground/30 transition-colors">
        {['slo-tool', 'statuspage-update', 'oncall-coverage'].includes(project.slug) ? (
          <div className="border-b border-border bg-muted/40 p-4">
            <img src={`/project-previews/${project.slug}.jpg`} alt={`${project.title}: example output`} width={846} height={430} loading="lazy" decoding="async" className="w-full h-40 object-contain" />
            <p className="mt-3 text-xs font-mono text-muted-foreground">Example output</p>
          </div>
        ) : IconComponent ? (
          <div className="px-5 pt-5"><IconComponent className="h-6 w-6 text-muted-foreground" aria-hidden="true" /></div>
        ) : null}

        {/* Content */}
        <div className="p-5">
          <h3
            className="font-semibold text-foreground mb-2"
            style={{ viewTransitionName: `project-title-${project.slug}` }}
          >
            {project.title}
          </h3>

          <p className="text-sm text-muted-foreground mb-3">
            {project.description}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {project.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded bg-foreground/5 text-muted-foreground"
              >
                {tag}
              </span>
            ))}
            {project.tags.length > 3 && (
              <span className="text-xs text-foreground/40">+{project.tags.length - 3}</span>
            )}
          </div>
        </div>
      </div>
    </TransitionLink>
  );
});
