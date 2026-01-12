import { useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import PageLayout from '@/components/layout/PageLayout';
import { FeaturedHero } from '@/components/blog/FeaturedHero';
import { getPostSync } from '@/lib/blog-loader-precompiled';
import {
  quickReferences,
  architectureOverview,
  infrastructureComponents,
  monitoringTools,
  troubleshootingScenarios,
  recoveryProcedures,
  escalationContacts,
  externalDependencies,
  additionalResources,
  runbookMetadata,
  type Link,
  type MonitoringTool,
} from '@/data/runbook';

// Helper component for rendering links
const LinkComponent = ({ link }: { link: Link }) => (
  <a
    href={link.url}
    target="_blank"
    rel="noopener noreferrer"
    className="text-foreground underline hover:opacity-70 transition-opacity"
  >
    {link.text}
  </a>
);

// Quick References Section
const QuickReferencesSection = () => (
  <section className="mb-8">
    <h2 className="text-2xl font-bold border-b-2 border-foreground/20 pb-2 mb-4">
      Quick References
    </h2>
    <div className="space-y-2">
      {quickReferences.map((ref, idx) => (
        <p key={idx} className="text-foreground">
          <strong>{ref.label}:</strong>{' '}
          {ref.links.map((link, linkIdx) => (
            <span key={linkIdx}>
              {linkIdx > 0 && ' | '}
              <LinkComponent link={link} />
            </span>
          ))}
        </p>
      ))}
    </div>
  </section>
);

// Architecture Overview Section
const ArchitectureSection = () => (
  <section className="mb-8">
    <h2 className="text-2xl font-bold border-b-2 border-foreground/20 pb-2 mb-4">
      Architecture Overview
    </h2>
    <ul className="list-disc pl-6 space-y-2">
      {architectureOverview.stack.map((item, idx) => (
        <li key={idx}>
          <strong>{item.item}:</strong> {item.value}
        </li>
      ))}
    </ul>

    <h3 className="text-xl font-bold mt-6 mb-3">Infrastructure Components</h3>
    <ul className="list-disc pl-6 space-y-2">
      {infrastructureComponents.map((component, idx) => (
        <li key={idx}>
          <strong>{component.component}:</strong> {component.description}
        </li>
      ))}
    </ul>
  </section>
);

// Monitoring Section
const MonitoringSection = () => (
  <section id="monitoring" className="mb-8">
    <h2 className="text-2xl font-bold border-b-2 border-foreground/20 pb-2 mb-4">
      Monitoring & Alerting
    </h2>
    {monitoringTools.map((tool, idx) => (
      <div key={idx} className="mb-6">
        <h3 className="text-xl font-bold mb-3">{tool.name}</h3>
        <ul className="list-disc pl-6 space-y-1">
          {tool.details.map((detail, detailIdx) => (
            <li key={detailIdx}>
              <strong>{detail.label}:</strong>{' '}
              {typeof detail.value === 'string' ? (
                detail.value
              ) : (
                <LinkComponent link={detail.value as Link} />
              )}
            </li>
          ))}
        </ul>
      </div>
    ))}
  </section>
);

// Troubleshooting Section
const TroubleshootingSection = () => (
  <section className="mb-8">
    <h2 className="text-2xl font-bold border-b-2 border-foreground/20 pb-2 mb-4">
      Troubleshooting Guide
    </h2>
    {troubleshootingScenarios.map((scenario, idx) => (
      <div key={idx} className="mb-6">
        <h3 className="text-xl font-bold mb-2">{scenario.title}</h3>
        {scenario.actions && (
          <p className="mb-2">
            <strong>Actions:</strong> {scenario.actions}
          </p>
        )}
        {scenario.investigate && (
          <p className="mb-2">
            <strong>Investigate:</strong> {scenario.investigate}
          </p>
        )}
        {scenario.fixes && (
          <p className="mb-2">
            <strong>Fixes:</strong> {scenario.fixes}
          </p>
        )}
        {scenario.check && (
          <p className="mb-2">
            <strong>Check:</strong> {scenario.check}
          </p>
        )}
        {scenario.causes && (
          <p className="mb-2">
            <strong>Causes:</strong> {scenario.causes}
          </p>
        )}
      </div>
    ))}
  </section>
);

// Recovery Section
const RecoverySection = () => (
  <section id="recovery" className="mb-8">
    <h2 className="text-2xl font-bold border-b-2 border-foreground/20 pb-2 mb-4">
      Recovery Procedures
    </h2>
    {recoveryProcedures.map((procedure, idx) => (
      <div key={idx} className="mb-6">
        <h3 className="text-xl font-bold mb-3">{procedure.title}</h3>
        <pre className="bg-muted p-4 rounded-md overflow-x-auto border border-border">
          <code className="text-sm font-mono">{procedure.code}</code>
        </pre>
      </div>
    ))}
  </section>
);

// Escalation Section
const EscalationSection = () => (
  <section className="mb-8">
    <h2 className="text-2xl font-bold border-b-2 border-foreground/20 pb-2 mb-4">
      Escalation Paths
    </h2>
    {escalationContacts.map((contact, idx) => (
      <div key={idx} className="mb-6">
        <h3 className="text-xl font-bold mb-2">{contact.role}</h3>
        <p className="mb-2">
          <strong>{contact.name}</strong>
        </p>
        {contact.details.map((detail, detailIdx) => (
          <p key={detailIdx} className="ml-4">
            {detail}
          </p>
        ))}
      </div>
    ))}

    <h3 className="text-xl font-bold mt-6 mb-3">External Dependencies</h3>
    <ul className="list-disc pl-6 space-y-1">
      {externalDependencies.map((dep, idx) => (
        <li key={idx}>
          <strong>{dep.text}:</strong>{' '}
          {dep.url !== '#' ? (
            <>
              For platform-level issues (<LinkComponent link={dep} />)
            </>
          ) : (
            'For DNS-related problems'
          )}
        </li>
      ))}
    </ul>
  </section>
);

// Resources Section
const ResourcesSection = () => (
  <section className="mb-8">
    <h2 className="text-2xl font-bold border-b-2 border-foreground/20 pb-2 mb-4">
      Additional Resources
    </h2>
    {additionalResources.map((category, idx) => (
      <div key={idx} className="mb-6">
        <h3 className="text-xl font-bold mb-3">{category.title}</h3>
        <ul className="list-disc pl-6 space-y-1">
          {category.links.map((link, linkIdx) => (
            <li key={linkIdx}>
              <LinkComponent link={link} />
            </li>
          ))}
        </ul>
      </div>
    ))}
  </section>
);

// Footer Section
const RunbookFooter = () => (
  <footer className="border-t border-border mt-16 pt-8">
    <div className="flex justify-between items-center flex-wrap gap-4 opacity-70">
      <div>
        <p className="text-sm mb-1">
          <strong>Runbook Maintainer:</strong> {runbookMetadata.maintainer} |{' '}
          <a
            href={`mailto:${runbookMetadata.email}`}
            className="underline hover:opacity-70"
          >
            {runbookMetadata.email}
          </a>
        </p>
        <p className="text-sm">Last Updated: {runbookMetadata.lastUpdated}</p>
      </div>
      <div className="flex gap-6 text-sm">
        <a
          href="https://stats.uptimerobot.com/zquZllQfNJ"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:opacity-70"
        >
          Status
        </a>
        <a
          href="https://github.com/Dbochman/personal-website"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:opacity-70"
        >
          GitHub
        </a>
        <a href="/" className="hover:opacity-70">
          Home
        </a>
      </div>
    </div>
  </footer>
);

const RUNBOOK_BLOG_SLUG = 'writing-a-runbook-for-my-personal-website';

export default function Runbook() {
  const location = useLocation();

  // Check if user navigated from a blog post (via React Router state)
  const cameFromBlog = (location.state as { fromBlog?: boolean })?.fromBlog === true;

  // Load synchronously for SSR/pre-rendering
  const relatedPost = !cameFromBlog ? getPostSync(RUNBOOK_BLOG_SLUG) : null;

  return (
    <>
      <Helmet>
        <title>Operational Runbook - Dylan Bochman</title>
        <meta
          name="description"
          content="Operational runbook for dylanbochman.com - incident response procedures, troubleshooting guides, performance standards, and escalation paths for site reliability."
        />
        <meta
          name="keywords"
          content="Runbook, Incident Response, SRE, Site Reliability, Operations, Troubleshooting, Monitoring"
        />
        <meta property="og:title" content="Operational Runbook - Dylan Bochman" />
        <meta
          property="og:description"
          content="Operational runbook for dylanbochman.com - incident response procedures, troubleshooting guides, and escalation paths."
        />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://dylanbochman.com/runbook" />
      </Helmet>

      <PageLayout>
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <header className="mb-12 text-center">
            <h1 className="text-6xl font-bold mb-4 font-mono tracking-tight">
              Operational Runbook
            </h1>
          </header>

          {/* Related Blog Post - hidden if user came from a blog post */}
          {relatedPost && !cameFromBlog && (
            <div className="mb-12">
              <FeaturedHero post={relatedPost} badgeText="Related Post" />
            </div>
          )}

          <div className="space-y-8">
            <QuickReferencesSection />
            <ArchitectureSection />
            <MonitoringSection />
            <TroubleshootingSection />
            <RecoverySection />
            <EscalationSection />
            <ResourcesSection />
          </div>

          <RunbookFooter />
        </div>
      </PageLayout>
    </>
  );
}
