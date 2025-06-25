
import React, { useState } from "react";
import PageLayout from "@/components/layout/PageLayout";
import HeroSection from "@/components/sections/HeroSection";
import ExperienceSection from "@/components/sections/ExperienceSection";
import GoalsSection from "@/components/sections/GoalsSection";
import ContactSection from "@/components/sections/ContactSection";
import Sidebar from "@/components/Sidebar";
import { NavigationContext } from "@/context/NavigationContext";

const Index = () => {
  const [openAccordion, setOpenAccordion] = useState("");

  const openExperienceAccordion = () => {
    setOpenAccordion("experience");
  };

  return (
    <NavigationContext.Provider value={{ openExperienceAccordion }}>
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
              <div className="lg:sticky lg:top-24">
                <Sidebar />
              </div>
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
