import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Box,
  Calculator,
  Clock,
  FileText,
  AlertTriangle,
  Gauge,
  MessageSquare,
  type LucideIcon,
} from 'lucide-react';
import type { ProjectMeta, ProjectStatus } from '@/types/project';

// Icon registry - add icons here as new projects are added
const iconRegistry: Record<string, LucideIcon> = {
  Box,
  Calculator,
  Clock,
  FileText,
  AlertTriangle,
  Gauge,
  MessageSquare,
};

interface ProjectCardProps {
  project: ProjectMeta;
}

const statusVariants: Record<ProjectStatus, 'default' | 'secondary' | 'outline'> = {
  active: 'default',
  experimental: 'secondary',
  archived: 'outline',
};

const statusLabels: Record<ProjectStatus, string> = {
  active: 'Active',
  experimental: 'Experimental',
  archived: 'Archived',
};

export function ProjectCard({ project }: ProjectCardProps) {
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
    <Link
      to={`/projects/${project.slug}`}
      className="block group focus:outline-none"
      onMouseEnter={handleFirstInteraction}
      onFocus={handleFirstInteraction}
    >
      <Card className="transition-all duration-300 bg-zinc-50 dark:bg-zinc-800/40 group-hover:shadow-lg group-hover:border-primary/50 group-focus:shadow-lg group-focus:border-primary/50 h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3 mb-2">
            {IconComponent && (
              <IconComponent className="w-6 h-6 text-primary" />
            )}
            <Badge variant={statusVariants[project.status]} className="text-xs">
              {statusLabels[project.status]}
            </Badge>
          </div>
          <CardTitle className="text-xl group-hover:text-primary group-focus:text-primary transition-colors">
            {project.title}
          </CardTitle>
          <CardDescription className="text-sm">
            Created{' '}
            {new Date(project.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
            })}
          </CardDescription>
          {/* Tags - always visible */}
          <div className="flex flex-wrap gap-1.5 pt-2">
            {project.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Description - expands on first hover/focus and stays expanded */}
          <div
            className={`overflow-hidden transition-all duration-300 ease-out motion-reduce:transition-none
                        ${hasBeenHovered ? 'max-h-24 opacity-100' : 'max-h-24 opacity-100 [@media(hover:hover)]:max-h-0 [@media(hover:hover)]:opacity-0'}`}
          >
            <p className="text-muted-foreground text-sm leading-relaxed">
              {project.description}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
