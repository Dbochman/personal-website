import { Helmet } from 'react-helmet-async';
import PageLayout from '@/components/layout/PageLayout';
import { Footer } from '@/components/layout/Footer';
import { ProjectGrid } from '@/components/projects/ProjectGrid';
import { getAllProjects } from '@/data/projects';

export default function Projects() {
  const projects = getAllProjects();

  return (
    <>
      <Helmet>
        <title>Projects - Dylan Bochman</title>
        <meta
          name="description"
          content="Interactive SRE tools and utilities. Uptime calculators, incident timeline builders, status page helpers, and more."
        />
        <meta
          name="keywords"
          content="SRE Tools, Uptime Calculator, Incident Management, DevOps Utilities, Status Page, Postmortem Templates"
        />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://dylanbochman.com/projects" />
        <meta property="og:title" content="Projects - Dylan Bochman" />
        <meta
          property="og:description"
          content="Interactive SRE tools and utilities. Uptime calculators, incident timeline builders, status page helpers, and more."
        />
        <meta property="og:image" content="https://dylanbochman.com/social-preview.webp" />
        <meta property="og:site_name" content="Dylan Bochman" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://dylanbochman.com/projects" />
        <meta name="twitter:title" content="Projects - Dylan Bochman" />
        <meta
          name="twitter:description"
          content="Interactive SRE tools and utilities. Uptime calculators, incident timeline builders, status page helpers, and more."
        />
        <meta name="twitter:image" content="https://dylanbochman.com/social-preview.webp" />

        <link rel="canonical" href="https://dylanbochman.com/projects" />
      </Helmet>

      <PageLayout>
        <div className="portfolio-shell py-12 sm:py-20">
          <header className="mb-12">
            <h1 className="text-4xl font-bold text-balance mb-4" style={{ viewTransitionName: 'page-title' }}>Projects</h1>
            <p className="text-xl text-muted-foreground text-pretty">
              Tools for planning reliability work, communicating during incidents, and testing ideas.
            </p>
          </header>

          {[
            { title: 'Reliability tools', description: 'Calculators and templates to use in your next planning or incident review.', slugs: ['slo-tool', 'statuspage-update', 'oncall-coverage', 'incident-command-diagrams', 'k8s-rightsizer'] },
            { title: 'Experiments', description: 'Small applications for organizing work and sharing music.', slugs: ['kanban', 'echonest'] },
            { title: 'How this site runs', description: 'Public metrics and a history of changes to this website.', slugs: ['analytics', 'changelog'] },
          ].map(group => (
            <section key={group.title} className="mb-16">
              <div className="section-heading"><div><h2 className="text-2xl font-semibold mb-3">{group.title}</h2><p className="text-muted-foreground">{group.description}</p></div></div>
              <ProjectGrid projects={projects.filter(project => group.slugs.includes(project.slug))} />
            </section>
          ))}

          <div className="mt-16">
            <Footer />
          </div>
        </div>
      </PageLayout>
    </>
  );
}
