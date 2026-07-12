
import React, { useState } from "react";
import PageLayout from "@/components/layout/PageLayout";
import HeroSection from "@/components/sections/HeroSection";
import ExperienceSection from "@/components/sections/ExperienceSection";
import GoalsSection from "@/components/sections/GoalsSection";
import ContactSection from "@/components/sections/ContactSection";
import Sidebar from "@/components/Sidebar";
import { NavigationContext } from "@/context/NavigationContext";
import Seo from "@/components/Seo";
import { coreExpertise } from "@/data/expertise";
import { Helmet } from "react-helmet-async";

const profilePageStructuredData = {
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  dateCreated: "2026-01-04T00:00:00-05:00",
  dateModified: "2026-01-28T20:28:24-05:00",
  mainEntity: {
    "@type": "Person",
    name: "Dylan Bochman",
    givenName: "Dylan",
    familyName: "Bochman",
    alternateName: ["Dbochman"],
    identifier: "dylanbochman",
    url: "https://dylanbochman.com",
    image: "https://dylanbochman.com/social-preview.webp",
    description: "Site Reliability Engineer and Technical Incident Manager specializing in reliability, incident management, and SLO monitoring. Currently at Groq, previously at HashiCorp and Spotify.",
    jobTitle: "Site Reliability Engineer & Technical Incident Manager",
    worksFor: {
      "@type": "Organization",
      name: "Groq",
      url: "https://groq.com",
    },
    alumniOf: [
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
  const [openAccordion, setOpenAccordion] = useState("");

  const openExperienceAccordion = () => {
    setOpenAccordion("experience");
  };

  return (
    <NavigationContext.Provider value={{ openExperienceAccordion }}>
      <Seo
        title="Sr. Site Reliability Engineer - Technical Incident Manager"
        description="Specializing in Reliability, Resilience, and Incident Management, with experience spanning SRE and Product Management at Nvidia, Groq, HashiCorp, and Spotify."
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

        {/* Main Content - Two Column Layout */}
        <div className="container mx-auto max-w-6xl px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content Column */}
            <div className="lg:col-span-2 space-y-8">
              <ExperienceSection value={openAccordion} onValueChange={setOpenAccordion} />
              <GoalsSection />
            </div>

            {/* Sidebar Column */}
            <div className="lg:col-span-1 order-first lg:order-last">
              <Sidebar />
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <ContactSection />
      </PageLayout>
    </NavigationContext.Provider>
  );
};

export default Index;
