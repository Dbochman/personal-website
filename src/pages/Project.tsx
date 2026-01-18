import { Suspense } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  AlertTriangle,
  ArrowLeft,
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
  Terminal,
  TrendingDown,
  type LucideIcon,
} from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';
import { Footer } from '@/components/layout/Footer';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getProject } from '@/data/projects';
import { TransitionLink } from '@/hooks/useViewTransition';
import type { ProjectStatus } from '@/types/project';

// Icon registry - matches ProjectCard.tsx
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
  Terminal,
  TrendingDown,
};

const SITE_URL = 'https://dylanbochman.com';

/**
 * Resolve OG image URL for a project
 * - Custom ogImage provided: use it (resolve relative paths)
 * - No custom image: use generated OG image at /og-images/{slug}.png
 */
function resolveOgImage(slug: string, ogImage: string | undefined): string {
  if (ogImage) {
    // Custom image provided
    if (ogImage.startsWith('http://') || ogImage.startsWith('https://')) {
      return ogImage;
    }
    // Relative path - prefix with site URL
    return `${SITE_URL}${ogImage.startsWith('/') ? '' : '/'}${ogImage}`;
  }
  // Default to generated OG image
  return `${SITE_URL}/og-images/${slug}.png`;
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

export default function Project() {
  const { slug } = useParams<{ slug: string }>();
  const project = slug ? getProject(slug) : undefined;

  if (!project) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto">
            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md mb-4">
              Project not found
            </div>
            <Link
              to="/projects"
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              <ArrowLeft className="w-4 h-4" />
              View all projects
            </Link>
          </div>
        </div>
      </PageLayout>
    );
  }

  const ProjectComponent = project.component;

  return (
    <>
      <Helmet>
        <title>{project.title} - Dylan Bochman</title>
        <meta name="description" content={project.description} />
        <meta name="keywords" content={(project.keywords || project.tags).join(', ')} />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://dylanbochman.com/projects/${project.slug}`} />
        <meta property="og:title" content={`${project.title} - Dylan Bochman`} />
        <meta property="og:description" content={project.description} />
        <meta
          property="og:image"
          content={resolveOgImage(project.slug, project.ogImage)}
        />
        <meta property="og:site_name" content="Dylan Bochman" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:url"
          content={`https://dylanbochman.com/projects/${project.slug}`}
        />
        <meta name="twitter:title" content={`${project.title} - Dylan Bochman`} />
        <meta name="twitter:description" content={project.description} />
        <meta
          name="twitter:image"
          content={resolveOgImage(project.slug, project.ogImage)}
        />

        <link
          rel="canonical"
          href={`https://dylanbochman.com/projects/${project.slug}`}
        />

        {/* JSON-LD Structured Data - WebApplication for active projects */}
        {project.status === 'active' && (
          <script type="application/ld+json">
            {JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: project.title,
              description: project.description,
              url: `https://dylanbochman.com/projects/${project.slug}`,
              applicationCategory: 'UtilityApplication',
              operatingSystem: 'Any',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
              },
              author: {
                '@type': 'Person',
                name: 'Dylan Bochman',
                url: 'https://dylanbochman.com',
              },
              ...(project.keywords && { keywords: project.keywords.join(', ') }),
            })}
          </script>
        )}

        {/* JSON-LD Breadcrumb for navigation */}
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: 'https://dylanbochman.com',
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'Projects',
                item: 'https://dylanbochman.com/projects',
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: project.title,
                item: `https://dylanbochman.com/projects/${project.slug}`,
              },
            ],
          })}
        </script>
      </Helmet>

      <PageLayout>
        {/* Hero section with background - all projects get this */}
        <div className="relative bg-gradient-to-b from-foreground/5 via-foreground/[0.02] to-transparent pb-8">
          {/* Grid pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }}
          />

          <div className="relative container mx-auto px-4 pt-6">
            <div className={cn(!project.fullWidth && 'max-w-4xl mx-auto')}>
              {/* Back link */}
              <TransitionLink
                to="/projects"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
              >
                <ArrowLeft className="w-4 h-4" />
                All projects
              </TransitionLink>

              {/* Project header */}
              <header className="mb-6">
                <div className="flex items-start gap-4 mb-3">
                  {/* Icon - inline with title for view transition */}
                  {project.icon && iconRegistry[project.icon] && (
                    <div
                      className="shrink-0 p-3 rounded-xl border shadow-sm bg-foreground/10 border-foreground/20"
                      style={{ viewTransitionName: `project-icon-${slug}` }}
                    >
                      {(() => {
                        const IconComponent = iconRegistry[project.icon!];
                        return <IconComponent className="w-8 h-8 text-foreground/80" />;
                      })()}
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <h1
                      className={cn(
                        'font-bold',
                        project.fullWidth ? 'text-2xl md:text-3xl' : 'text-3xl md:text-4xl'
                      )}
                      style={{ viewTransitionName: `project-title-${slug}` }}
                    >
                      {project.title}
                    </h1>
                    <Badge variant={statusVariants[project.status]}>
                      {statusLabels[project.status]}
                    </Badge>
                  </div>
                </div>
                <p className={cn(
                  'text-muted-foreground mb-3',
                  project.fullWidth ? 'text-base' : 'text-lg'
                )}>
                  {project.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </header>
            </div>
          </div>
        </div>

        <div className={cn(
          'container mx-auto px-4',
          project.fullWidth ? 'pb-6' : 'pb-12'
        )}>
          <div className={cn(!project.fullWidth && 'max-w-4xl mx-auto')}>

            {/* Project component */}
            <div className={cn(
              'bg-card rounded-lg border',
              project.fullWidth ? 'p-4' : 'p-6'
            )}>
              <Suspense
                fallback={
                  <div className="text-center py-12 text-muted-foreground">
                    Loading project...
                  </div>
                }
              >
                <ProjectComponent />
              </Suspense>
            </div>

            <div className={cn(project.fullWidth ? 'mt-6' : 'mt-16')}>
              <Footer />
            </div>
          </div>
        </div>
      </PageLayout>
    </>
  );
}
