import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { HelmetProvider } from 'react-helmet-async';
import { MotionConfig } from 'framer-motion';
import { lazy, Suspense } from "react";
import * as Sentry from "@sentry/react";
import { ThemeProvider } from "@/context/ThemeContext";
import { ScrollToTop } from "@/components/ScrollToTop";
import { PageSkeleton } from "@/components/ui/skeletons";
import { ErrorFallback } from "@/components/ErrorFallback";
import { PreviewBanner } from "@/components/PreviewBanner";
import Index from "./pages/Index";

// Lazy load pages that aren't on the critical path
// Project uses a preload pattern for smooth view transitions (see ProjectCard)
const projectImport = () => import("./pages/Project");
const Project = lazy(projectImport);
export const preloadProject = () => { projectImport(); };

// Other lazy-loaded pages
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const Projects = lazy(() => import("./pages/Projects"));
const Runbook = lazy(() => import("./pages/Runbook"));
const Analytics = lazy(() => import("./pages/Analytics"));
const NotFound = lazy(() => import("./pages/NotFound"));
const HouseKanban = lazy(() => import("./components/projects/house"));

const queryClient = new QueryClient();

const App = () => (
  <Sentry.ErrorBoundary fallback={<ErrorFallback />} showDialog>
    <HelmetProvider>
      <MotionConfig reducedMotion="user">
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
              }}
            >
              <ScrollToTop />
              <ThemeProvider>
                <PreviewBanner />
                <Suspense fallback={<PageSkeleton />}>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/blog" element={<Blog />} />
                    <Route path="/blog/:slug" element={<BlogPost />} />
                    <Route path="/projects" element={<Projects />} />
                    <Route path="/projects/:slug" element={<Project />} />
                    <Route path="/runbook" element={<Runbook />} />
                    <Route path="/analytics" element={<Analytics />} />
                    {/* Redirects for old/legacy URLs to fix Google Search Console 404s */}
                    <Route path="/runbook.html" element={<Navigate to="/runbook" replace />} />
                    <Route path="/contactme.html" element={<Navigate to="/" replace />} />
                    <Route path="/bretton-woods.html" element={<Navigate to="/" replace />} />
                    <Route path="/eurotrip.html" element={<Navigate to="/" replace />} />
                    <Route path="/photography.html" element={<Navigate to="/" replace />} />
                    <Route path="/golden-gloves.html" element={<Navigate to="/" replace />} />
                    <Route path="/uploads/*" element={<Navigate to="/" replace />} />
                    {/* Unlisted routes - accessible via URL but not in nav */}
                    <Route path="/projects/house" element={<HouseKanban />} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </ThemeProvider>
            </BrowserRouter>
          </TooltipProvider>
        </QueryClientProvider>
      </MotionConfig>
    </HelmetProvider>
  </Sentry.ErrorBoundary>
);

export default App;
