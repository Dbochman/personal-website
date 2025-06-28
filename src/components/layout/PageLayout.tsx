
import React from 'react';
import { useParallax } from "@/hooks/useParallax";
import Header from "@/components/layout/Header";
import ParallaxBackground from "@/components/layout/ParallaxBackground";
import BackToTop from "@/components/BackToTop";

interface PageLayoutProps {
  children: React.ReactNode;
}

const PageLayout = ({ children }: PageLayoutProps) => {
  useParallax();

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* SRE Dashboard Grid Background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 animate-grid-pulse" style={{
          backgroundImage: `
            linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '60px 40px'
        }}></div>
      </div>

      {/* Parallax Décor Layer - Hidden on mobile */}
      <div className="hidden md:block">
        <ParallaxBackground />
      </div>

      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="relative z-10">
        {children}
      </main>

      {/* Back to Top Button */}
      <BackToTop />
    </div>
  );
};

export default PageLayout;
