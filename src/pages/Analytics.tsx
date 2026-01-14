import { Helmet } from 'react-helmet-async';
import PageLayout from '@/components/layout/PageLayout';
import { AnalyticsDashboard } from '@/components/analytics';

export default function Analytics() {
  return (
    <>
      <Helmet>
        <title>Analytics - Dylan Bochman</title>
        <meta
          name="description"
          content="Site performance metrics, Core Web Vitals, and traffic analytics for dylanbochman.com."
        />
        {/* Unlisted page - no index */}
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <PageLayout>
        <div className="container mx-auto px-4 py-12">
          <header className="mb-8">
            <h1 className="text-4xl font-bold mb-4">Analytics</h1>
            <p className="text-xl text-muted-foreground">
              Site performance, traffic, and search visibility metrics.
            </p>
          </header>

          <AnalyticsDashboard />
        </div>
      </PageLayout>
    </>
  );
}
