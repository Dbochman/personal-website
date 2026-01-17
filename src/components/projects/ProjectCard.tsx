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
  MessageSquare,
  ScrollText,
  Target,
  TrendingDown,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { TransitionLink } from '@/hooks/useViewTransition';
import type { ProjectMeta } from '@/types/project';
import { cn } from '@/lib/utils';

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
  MessageSquare,
  ScrollText,
  Target,
  TrendingDown,
};

interface ProjectCardProps {
  project: ProjectMeta;
}

export const ProjectCard = memo(function ProjectCard({ project }: ProjectCardProps) {
  const [hasBeenHovered, setHasBeenHovered] = useState(false);

  const handleFirstInteraction = () => {
    if (!hasBeenHovered) {
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
      className="block group focus:outline-none"
      onMouseEnter={handleFirstInteraction}
      onFocus={handleFirstInteraction}
    >
      <div className="h-full rounded-xl overflow-hidden border border-border bg-card hover:border-foreground/30 focus-within:border-foreground/30 transition-all duration-300 hover:shadow-lg focus-within:shadow-lg">
        {/* Preview area - monochrome icon display */}
        <div className={cn(
          "relative h-32 flex items-center justify-center",
          "bg-gradient-to-br from-foreground/5 via-foreground/[0.02] to-transparent"
        )}>
          {/* Tool visualization */}
          {IconComponent && (
            <div className="relative">
              <div className="absolute inset-0 blur-xl opacity-50 bg-foreground/20" />
              <div className="relative p-4 rounded-xl border shadow-sm bg-foreground/10 border-foreground/20">
                <IconComponent className="w-8 h-8 text-foreground/80" />
              </div>
            </div>
          )}

          {/* Grid pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }}
          />
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3
              className="font-semibold text-foreground"
              style={{ viewTransitionName: `project-title-${project.slug}` }}
            >
              {project.title}
            </h3>
            <Zap className="w-4 h-4 text-foreground/30 group-hover:text-foreground group-focus-within:text-foreground transition-colors" />
          </div>

          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {project.description}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {project.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded bg-foreground/5 text-foreground/60"
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
}, (prevProps, nextProps) => prevProps.project.slug === nextProps.project.slug);
