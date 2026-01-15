import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { HelmetProvider } from 'react-helmet-async';
import { MotionConfig } from 'framer-motion';
import { lazy, Suspense } from "react";
import { ThemeProvider } from "@/context/ThemeContext";
import { ScrollToTop } from "@/components/ScrollToTop";
import { PageSkeleton } from "@/components/ui/skeletons";
import Index from "./pages/Index";

// Lazy load pages that aren't on the critical path
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const Projects = lazy(() => import("./pages/Projects"));
const Project = lazy(() => import("./pages/Project"));
const Runbook = lazy(() => import("./pages/Runbook"));
const Analytics = lazy(() => import("./pages/Analytics"));
const NotFound = lazy(() => import("./pages/NotFound"));
const HouseKanban = lazy(() => import("./components/projects/house"));

const queryClient = new QueryClient();

const App = () => (
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
              <Suspense fallback={<PageSkeleton />}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/blog" element={<Blog />} />
                  <Route path="/blog/:slug" element={<BlogPost />} />
                  <Route path="/projects" element={<Projects />} />
                  <Route path="/projects/:slug" element={<Project />} />
                  <Route path="/runbook" element={<Runbook />} />
                  <Route path="/analytics" element={<Analytics />} />
                  {/* Redirect old runbook.html URL to new clean URL */}
                  <Route path="/runbook.html" element={<Navigate to="/runbook" replace />} />
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
);

export default App;
