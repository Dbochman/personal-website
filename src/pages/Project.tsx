import { Suspense } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft } from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';
import { Footer } from '@/components/layout/Footer';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getProject } from '@/data/projects';
import type { ProjectStatus } from '@/types/project';

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
        <meta name="keywords" content={project.tags.join(', ')} />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://dylanbochman.com/projects/${project.slug}`} />
        <meta property="og:title" content={`${project.title} - Dylan Bochman`} />
        <meta property="og:description" content={project.description} />
        <meta
          property="og:image"
          content="https://dylanbochman.com/social-preview.webp"
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
          content="https://dylanbochman.com/social-preview.webp"
        />

        <link
          rel="canonical"
          href={`https://dylanbochman.com/projects/${project.slug}`}
        />
      </Helmet>

      <PageLayout>
        <div className={cn(
          'container mx-auto px-4',
          project.fullWidth ? 'flex flex-col min-h-[calc(100vh-64px)] py-6' : 'py-12'
        )}>
          <div className={cn(
            !project.fullWidth && 'max-w-4xl mx-auto',
            project.fullWidth && 'flex flex-col flex-1'
          )}>
            {/* Back link */}
            <Link
              to="/projects"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              All projects
            </Link>

            {/* Project header */}
            <header className="mb-4">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className={cn(
                  'font-bold',
                  project.fullWidth ? 'text-2xl md:text-3xl' : 'text-4xl md:text-5xl'
                )}>{project.title}</h1>
                <Badge variant={statusVariants[project.status]}>
                  {statusLabels[project.status]}
                </Badge>
              </div>
              <p className={cn(
                'text-muted-foreground mb-2',
                project.fullWidth ? 'text-base' : 'text-xl'
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

            {/* Project component */}
            <div className={cn(
              'bg-card rounded-lg border',
              project.fullWidth ? 'p-4 flex-1 flex flex-col' : 'p-6'
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

            <div className={cn(project.fullWidth ? 'mt-4' : 'mt-16')}>
              <Footer />
            </div>
          </div>
        </div>
      </PageLayout>
    </>
  );
}
