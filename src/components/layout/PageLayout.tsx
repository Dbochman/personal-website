
import React from 'react';

import { useViewTransitionHints } from '@/hooks/useViewTransition';
import Header from "@/components/layout/Header";

import BackToTop from "@/components/BackToTop";

interface PageLayoutProps {
  children: React.ReactNode;
}

const PageLayout = ({ children }: PageLayoutProps) => {

  useViewTransitionHints();

  return (
    <div className="min-h-screen bg-background text-foreground relative">
      {/* Skip Navigation Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:border focus:border-border focus:rounded-md focus:outline-hidden focus:ring-2 focus:ring-ring"
      >
        Skip to main content
      </a>

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
