import { AnalyticsDashboard } from '@/components/analytics';

export default function Analytics() {
  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        Site performance metrics combining Google Analytics, Search Console, Lighthouse audits,
        and Real User Monitoring (RUM) data. Updated daily via GitHub Actions.
      </p>
      <AnalyticsDashboard />
    </div>
  );
}
