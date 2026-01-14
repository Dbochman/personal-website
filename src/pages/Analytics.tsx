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
          <AnalyticsDashboard />
        </div>
      </PageLayout>
    </>
  );
}
