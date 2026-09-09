

import PageLayout from "@/components/layout/PageLayout";
import HeroSection from "@/components/sections/HeroSection";
import ExperienceSection from "@/components/sections/ExperienceSection";

import ContactSection from "@/components/sections/ContactSection";
import Sidebar from "@/components/Sidebar";
import { Link } from "react-router-dom";
import { getAllProjects } from "@/data/projects";
import { ProjectGrid } from "@/components/projects/ProjectGrid";
import { getAllPosts } from "@/content/blog";
import { formatBlogDate } from "@/lib/blog-utils";
import Seo from "@/components/Seo";
import { coreExpertise } from "@/data/expertise";
import { Helmet } from "react-helmet-async";

const profilePageStructuredData = {
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  dateCreated: "2026-01-04T00:00:00-05:00",
  dateModified: "2026-09-08T00:00:00-04:00",
  mainEntity: {
    "@type": "Person",
    name: "Dylan Bochman",
    givenName: "Dylan",
    familyName: "Bochman",
    alternateName: ["Dbochman"],
    identifier: "dylanbochman",
    url: "https://dylanbochman.com",
    image: "https://dylanbochman.com/social-preview.webp",
    description: "Site Reliability Engineer and Technical Incident Manager specializing in reliability, incident management, and SLO monitoring. Currently at NVIDIA, previously at Groq, HashiCorp and Spotify.",
    jobTitle: "Site Reliability Engineer & Technical Incident Manager",
    worksFor: {
      "@type": "Organization",
      name: "NVIDIA",
      url: "https://www.nvidia.com",
    },
    alumniOf: [
      { "@type": "Organization", name: "Groq", url: "https://groq.com" },
      {
        "@type": "Organization",
        name: "HashiCorp",
        url: "https://hashicorp.com",
      },
      {
        "@type": "Organization",
        name: "Spotify",
        url: "https://spotify.com",
      },
    ],
    knowsAbout: [
      "Site Reliability Engineering",
      "Incident Management",
      "DevOps",
      "System Reliability",
      "Post-Incident Analysis",
      "SLO Monitoring",
      "Infrastructure Reliability",
      "Operational Readiness",
      "Service Level Objectives",
      "On-Call Management",
    ],
    hasOccupation: {
      "@type": "Occupation",
      name: "Site Reliability Engineer",
      occupationLocation: {
        "@type": "Country",
        name: "United States",
      },
      skills: "SRE, Incident Management, SLO Monitoring, Infrastructure Reliability, DevOps",
    },
    sameAs: [
      "https://www.linkedin.com/in/dbochman",
      "https://github.com/Dbochman",
    ],
  },
};

const Index = () => {
  const selected = getAllProjects().filter(project =>
    ['slo-tool', 'statuspage-update', 'oncall-coverage'].includes(project.slug)
  );
  const recentPosts = getAllPosts().slice(0, 3);
  return (
    <>
      <Seo
        title="Sr. Site Reliability Engineer - Technical Incident Manager"
        description="Specializing in Reliability, Resilience, and Incident Management, with experience spanning SRE and Product Management at NVIDIA, Groq, HashiCorp, and Spotify."
        keywords={coreExpertise.map(item => item.title)}
        url="/"
      />
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(profilePageStructuredData)}
        </script>
      </Helmet>
      <PageLayout>
        {/* Hero Section */}
        <HeroSection />

        <section id="selected-work" className="portfolio-shell pb-16 sm:pb-24">
          <div className="section-heading">
            <div>
              <p className="eyebrow mb-3">Tools for the work</p>
              <h2 className="text-3xl font-semibold tracking-tight">Selected projects</h2>
            </div>
            <Link className="portfolio-link" to="/projects">All projects ↗</Link>
          </div>
          <ProjectGrid projects={selected} />
        </section>
        <div className="portfolio-shell grid lg:grid-cols-[2fr_1fr] gap-12 pb-16">
          <ExperienceSection />
          <Sidebar />
        </div>
        <section className="portfolio-shell pb-16">
          <div className="section-heading">
            <div>
              <p className="eyebrow mb-3">Notes from practice</p>
              <h2 className="text-3xl font-semibold tracking-tight">Writing</h2>
            </div>
            <Link className="portfolio-link" to="/blog">Browse the blog ↗</Link>
          </div>
          <p className="max-w-2xl text-lg text-muted-foreground">Incident response, reliability tooling, and the details that matter when software meets real use. Posts include work written with Claude; each article identifies its author.</p>
          <div className="mt-8 divide-y divide-border">
            {recentPosts.map(post => (
              <article key={post.slug} className="py-6 grid sm:grid-cols-[10rem_1fr] gap-3">
                <p className="text-sm font-mono text-muted-foreground"><time dateTime={post.date}>{formatBlogDate(post.date)}</time></p>
                <div>
                  <h3 className="text-xl font-semibold">
                    <Link className="hover:underline underline-offset-4" to={`/blog/${post.slug}`}>
                      {post.title}
                    </Link>
                  </h3>
                  <p className="mt-2 text-muted-foreground leading-relaxed">{post.description}</p>
                  <p className="mt-3 text-sm text-muted-foreground">{post.author} · {post.readingTime}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Contact Section */}
        <ContactSection />
      </PageLayout>
    </>
  );
};

export default Index;
