
import React from 'react';
import { useParallax } from "@/hooks/useParallax";
import { useViewTransitionHints } from '@/hooks/useViewTransition';
import Header from "@/components/layout/Header";
import ParallaxBackground from "@/components/layout/ParallaxBackground";
import BackToTop from "@/components/BackToTop";

interface PageLayoutProps {
  children: React.ReactNode;
}

const PageLayout = ({ children }: PageLayoutProps) => {
  useParallax();
  useViewTransitionHints();

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-x-hidden">
      {/* Skip Navigation Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:border focus:border-border focus:rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
      >
        Skip to main content
      </a>

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
      <main id="main-content" className="relative z-10">
        {children}
      </main>

      {/* Back to Top Button */}
      <BackToTop />
    </div>
  );
};

export default PageLayout;
