import { useAnalyticsData } from '@/hooks/useAnalyticsData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Search, Gauge, Users } from 'lucide-react';
import { MetricCard } from './MetricCard';
import { CoreWebVitalsCard } from './CoreWebVitalsCard';
import { LighthouseScoresTable } from './LighthouseScoresTable';
import { SessionsTrendChart } from './charts/SessionsTrendChart';
import { DeviceBreakdownChart } from './charts/DeviceBreakdownChart';
import { LighthouseHistoryChart } from './charts/LighthouseHistoryChart';
import { SearchPerformanceChart } from './charts/SearchPerformanceChart';

export function AnalyticsDashboard() {
  const { latest, ga4History, searchHistory, lighthouseSummary, isLoading, error, warning } = useAnalyticsData();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-24" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="animate-pulse h-64" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <p className="text-destructive">Failed to load analytics data: {error}</p>
        </CardContent>
      </Card>
    );
  }

  // Get latest GA4 data for overview
  const latestGA4 = ga4History[ga4History.length - 1];
  const previousGA4 = ga4History[ga4History.length - 2];

  // Calculate session trend (guard against divide-by-zero)
  const sessionTrend = latestGA4 && previousGA4 && previousGA4.summary.sessions > 0
    ? ((latestGA4.summary.sessions - previousGA4.summary.sessions) / previousGA4.summary.sessions) * 100
    : undefined;

  // Get average Lighthouse performance score
  const avgPerformance = lighthouseSummary.length > 0
    ? Math.round(lighthouseSummary.reduce((sum, p) => sum + p.performance, 0) / lighthouseSummary.length)
    : null;

  // Get latest search data
  const latestSearch = searchHistory[searchHistory.length - 1];

  return (
    <div className="space-y-6">
      {/* Warning for missing data */}
      {warning && (
        <Card className="border-yellow-500/50 bg-yellow-500/10">
          <CardContent className="pt-6">
            <p className="text-sm text-yellow-700 dark:text-yellow-400">{warning}</p>
          </CardContent>
        </Card>
      )}

      {/* Last updated */}
      {latest?.generated && (
        <p className="text-sm text-muted-foreground">
          Last updated: {new Date(latest.generated).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Sessions (7d)"
          value={latestGA4?.summary.sessions.toLocaleString() ?? '—'}
          icon={Users}
          trend={sessionTrend}
        />
        <MetricCard
          title="Lighthouse Perf"
          value={avgPerformance !== null ? `${avgPerformance}` : '—'}
          icon={Gauge}
          subtitle="avg across pages"
          status={avgPerformance !== null ? (avgPerformance >= 90 ? 'good' : avgPerformance >= 70 ? 'warning' : 'critical') : undefined}
        />
        <MetricCard
          title="Impressions (7d)"
          value={latestSearch?.summary?.totalImpressions?.toLocaleString() ?? '—'}
          icon={Search}
        />
        <MetricCard
          title="Bounce Rate"
          value={latestGA4 ? `${(latestGA4.summary.bounceRate * 100).toFixed(0)}%` : '—'}
          icon={Activity}
          status={latestGA4 ? (latestGA4.summary.bounceRate <= 0.5 ? 'good' : latestGA4.summary.bounceRate <= 0.7 ? 'warning' : 'critical') : undefined}
        />
      </div>

      {/* Tabbed Sections */}
      <Tabs defaultValue="traffic" className="space-y-4">
        <TabsList>
          <TabsTrigger value="traffic">Traffic</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
        </TabsList>

        {/* Traffic Tab */}
        <TabsContent value="traffic" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Sessions Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <SessionsTrendChart data={ga4History} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Device Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <DeviceBreakdownChart data={latestGA4?.deviceBreakdown ?? []} />
              </CardContent>
            </Card>
          </div>

          {/* Top Pages Table */}
          {latestGA4?.topPages && latestGA4.topPages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Top Pages (7d)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 font-medium">Page</th>
                        <th className="text-right py-2 font-medium">Sessions</th>
                        <th className="text-right py-2 font-medium">Users</th>
                        <th className="text-right py-2 font-medium">Page Views</th>
                      </tr>
                    </thead>
                    <tbody>
                      {latestGA4.topPages.slice(0, 10).map((page) => (
                        <tr key={page.page} className="border-b border-border/50">
                          <td className="py-2 font-mono text-xs truncate max-w-[200px]">{page.page}</td>
                          <td className="text-right py-2 tabular-nums">{page.sessions.toLocaleString()}</td>
                          <td className="text-right py-2 tabular-nums">{page.users.toLocaleString()}</td>
                          <td className="text-right py-2 tabular-nums">{page.pageViews.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Lighthouse Scores</CardTitle>
              </CardHeader>
              <CardContent>
                <LighthouseHistoryChart data={lighthouseSummary} />
              </CardContent>
            </Card>
            <CoreWebVitalsCard data={lighthouseSummary} />
          </div>

          <LighthouseScoresTable data={lighthouseSummary} />
        </TabsContent>

        {/* Search Tab */}
        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Search Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <SearchPerformanceChart data={searchHistory} />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Clicks"
              value={latestSearch?.summary?.totalClicks?.toLocaleString() ?? '—'}
              icon={Activity}
            />
            <MetricCard
              title="Impressions"
              value={latestSearch?.summary?.totalImpressions?.toLocaleString() ?? '—'}
              icon={Search}
            />
            <MetricCard
              title="CTR"
              value={latestSearch?.summary?.averageCTR != null ? `${(latestSearch.summary.averageCTR * 100).toFixed(1)}%` : '—'}
              icon={Activity}
            />
            <MetricCard
              title="Avg Position"
              value={latestSearch?.summary?.averagePosition?.toFixed(1) ?? '—'}
              icon={Gauge}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
