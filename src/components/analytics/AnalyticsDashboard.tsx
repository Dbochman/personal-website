import { lazy, Suspense, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Search, Gauge, Users, Wrench } from 'lucide-react';
import { MetricCard } from './MetricCard';
import { CoreWebVitalsCard } from './CoreWebVitalsCard';
import { RumWebVitalsCard } from './RumWebVitalsCard';
import { LighthouseScoresTable } from './LighthouseScoresTable';
import { TrafficQualityCard } from './TrafficQualityCard';
import { GitHubBillingCard } from './GitHubBillingCard';
import { staggerContainer, staggerItem, tabContent } from '@/lib/motion';

// Lazy load Recharts-dependent components (heaviest)
const SessionsTrendChart = lazy(() => import('./charts/SessionsTrendChart').then(m => ({ default: m.SessionsTrendChart })));
const DeviceBreakdownChart = lazy(() => import('./charts/DeviceBreakdownChart').then(m => ({ default: m.DeviceBreakdownChart })));
const TrafficSourcesChart = lazy(() => import('./charts/TrafficSourcesChart').then(m => ({ default: m.TrafficSourcesChart })));
const LighthouseHistoryChart = lazy(() => import('./charts/LighthouseHistoryChart').then(m => ({ default: m.LighthouseHistoryChart })));
const SearchPerformanceChart = lazy(() => import('./charts/SearchPerformanceChart').then(m => ({ default: m.SearchPerformanceChart })));

export function AnalyticsDashboard() {
  const { latest, ga4History, searchHistory, lighthouseSummary, billingHistory, isLoading, error, warning } = useAnalyticsData();
  const [activeTab, setActiveTab] = useState('traffic');

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Dedicated live region for concise status announcement */}
        <div role="status" aria-live="polite" className="sr-only">
          Loading analytics data...
        </div>
        {/* Metric cards skeleton */}
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
        {/* Tabs skeleton - matches Traffic tab layout */}
        <div className="space-y-4">
          <div className="h-10 bg-muted rounded w-64 animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2 animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-40" />
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-muted rounded" />
              </CardContent>
            </Card>
            <Card className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-36" />
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-muted rounded" />
              </CardContent>
            </Card>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-32" />
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-muted rounded" />
              </CardContent>
            </Card>
            <Card className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-28" />
              </CardHeader>
              <CardContent>
                <div className="h-48 bg-muted rounded" />
              </CardContent>
            </Card>
          </div>
          <Card className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-32" />
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-muted rounded" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive" role="alert">
        <CardContent className="pt-6">
          <p className="text-destructive">Failed to load analytics data: {error}</p>
        </CardContent>
      </Card>
    );
  }

  // Get latest GA4 data for overview
  const latestGA4 = ga4History[ga4History.length - 1];
  const previousGA4 = ga4History[ga4History.length - 2];

  // Calculate session trend (guard against missing data and divide-by-zero)
  const sessionTrend = latestGA4?.summary?.sessions != null && previousGA4?.summary?.sessions != null && previousGA4.summary.sessions > 0
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
        <Card className="border-yellow-500/50 bg-yellow-500/10" role="status">
          <CardContent className="pt-6">
            <p className="text-sm text-yellow-700 dark:text-yellow-400">{warning}</p>
          </CardContent>
        </Card>
      )}

      {/* Overview Cards */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={staggerItem}>
          <MetricCard
            title="Sessions (7d)"
            value={latestGA4?.summary?.sessions?.toLocaleString() ?? '—'}
            icon={Users}
            trend={sessionTrend}
          />
        </motion.div>
        <motion.div variants={staggerItem}>
          <MetricCard
            title="Lighthouse Perf"
            value={avgPerformance !== null ? `${avgPerformance}` : '—'}
            icon={Gauge}
            subtitle="avg across pages"
            status={avgPerformance !== null ? (avgPerformance >= 90 ? 'good' : avgPerformance >= 70 ? 'warning' : 'critical') : undefined}
          />
        </motion.div>
        <motion.div variants={staggerItem}>
          <MetricCard
            title="Impressions (7d)"
            value={latestSearch?.summary?.totalImpressions?.toLocaleString() ?? '—'}
            icon={Search}
          />
        </motion.div>
        <motion.div variants={staggerItem}>
          <MetricCard
            title="Bounce Rate"
            value={latestGA4?.summary?.bounceRate != null ? `${(latestGA4.summary.bounceRate * 100).toFixed(0)}%` : '—'}
            icon={Activity}
            status={latestGA4?.summary?.bounceRate != null ? (latestGA4.summary.bounceRate <= 0.5 ? 'good' : latestGA4.summary.bounceRate <= 0.7 ? 'warning' : 'critical') : undefined}
          />
        </motion.div>
      </motion.div>

      {/* Tabbed Sections */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="traffic">Traffic</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="tools">Tools</TabsTrigger>
          <TabsTrigger value="cicd">CI/CD</TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          {/* Traffic Tab */}
          {activeTab === 'traffic' && (
            <motion.div
              key="traffic"
              variants={tabContent}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <TabsContent value="traffic" className="space-y-4" forceMount>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Sessions Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<div className="h-64 bg-muted rounded animate-pulse" />}>
                  <SessionsTrendChart data={ga4History} />
                </Suspense>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Device Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<div className="h-64 bg-muted rounded animate-pulse" />}>
                  <DeviceBreakdownChart data={latestGA4?.deviceBreakdown ?? []} />
                </Suspense>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Traffic Sources</CardTitle>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<div className="h-64 bg-muted rounded animate-pulse" />}>
                  <TrafficSourcesChart data={latestGA4?.trafficSources} />
                </Suspense>
              </CardContent>
            </Card>
            {latestGA4?.trafficSources?.sources && latestGA4.trafficSources.sources.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Top Referrers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {latestGA4.trafficSources.sources.slice(0, 6).map((source, i) => (
                      <div key={i} className="flex justify-between items-center py-1 border-b border-border/50 last:border-0">
                        <span className="text-sm font-mono truncate max-w-[200px]">
                          {source.source} / {source.medium}
                        </span>
                        <span className="text-sm tabular-nums text-muted-foreground">
                          {source.sessions.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            {latestGA4?.topPages && latestGA4.topPages.length > 0 && (
              <TrafficQualityCard topPages={latestGA4.topPages} />
            )}
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
                        <th className="text-right py-2 pl-4 font-medium">Sessions</th>
                        <th className="text-right py-2 pl-4 font-medium">Users</th>
                        <th className="text-right py-2 pl-4 font-medium hidden sm:table-cell">Views</th>
                      </tr>
                    </thead>
                    <tbody>
                      {latestGA4.topPages.slice(0, 10).map((page) => (
                        <tr key={page.page} className="border-b border-border/50">
                          <td className="py-2 font-mono text-xs truncate max-w-[150px] sm:max-w-[200px]">{page.page}</td>
                          <td className="text-right py-2 pl-4 tabular-nums">{page.sessions.toLocaleString()}</td>
                          <td className="text-right py-2 pl-4 tabular-nums">{page.users.toLocaleString()}</td>
                          <td className="text-right py-2 pl-4 tabular-nums hidden sm:table-cell">{page.pageViews.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
              </TabsContent>
            </motion.div>
          )}

          {/* Performance Tab */}
          {activeTab === 'performance' && (
            <motion.div
              key="performance"
              variants={tabContent}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <TabsContent value="performance" className="space-y-4" forceMount>
          {/* Web Vitals Comparison: Lab vs Field */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Lab Data (Lighthouse)</h3>
              <CoreWebVitalsCard data={lighthouseSummary} />
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Field Data (Real Users)</h3>
              <RumWebVitalsCard data={latest?.webVitals} />
            </div>
          </div>

          {/* Lighthouse Scores Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Lighthouse Scores by Page</CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div className="h-64 bg-muted rounded animate-pulse" />}>
                <LighthouseHistoryChart data={lighthouseSummary} />
              </Suspense>
            </CardContent>
          </Card>

          <LighthouseScoresTable data={lighthouseSummary} />
              </TabsContent>
            </motion.div>
          )}

          {/* Search Tab */}
          {activeTab === 'search' && (
            <motion.div
              key="search"
              variants={tabContent}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <TabsContent value="search" className="space-y-4" forceMount>
          <Card>
            <CardHeader>
              <CardTitle>Search Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div className="h-64 bg-muted rounded animate-pulse" />}>
                <SearchPerformanceChart data={searchHistory} />
              </Suspense>
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
            </motion.div>
          )}

          {/* Tools Tab */}
          {activeTab === 'tools' && (
            <motion.div
              key="tools"
              variants={tabContent}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <TabsContent value="tools" className="space-y-4" forceMount>
          {latestGA4?.toolInteractions ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                  title="Tool Interactions (7d)"
                  value={latestGA4.toolInteractions.total.toLocaleString()}
                  icon={Wrench}
                />
                {latestGA4.toolInteractions.byTool.slice(0, 3).map((tool) => (
                  <MetricCard
                    key={tool.name}
                    title={tool.name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    value={tool.total.toLocaleString()}
                    icon={Activity}
                    subtitle="interactions"
                  />
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {latestGA4.toolInteractions.byTool.map((tool) => (
                  <Card key={tool.name}>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {tool.name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {tool.actions.map((action) => (
                          <div key={action.action} className="flex justify-between items-center py-1 border-b border-border/50 last:border-0">
                            <span className="text-sm font-mono">
                              {action.action.replace(/_/g, ' ')}
                            </span>
                            <span className="text-sm tabular-nums text-muted-foreground">
                              {action.count.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground text-center py-8">
                  No tool interaction data available yet. Tool events will appear here once users interact with the SRE tools.
                </p>
              </CardContent>
            </Card>
          )}
              </TabsContent>
            </motion.div>
          )}

          {/* CI/CD Tab */}
          {activeTab === 'cicd' && (
            <motion.div
              key="cicd"
              variants={tabContent}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <TabsContent value="cicd" className="space-y-4" forceMount>
                <GitHubBillingCard data={billingHistory} />
              </TabsContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Tabs>

      {/* Footer */}
      {latest?.generated && (
        <footer className="pt-8 border-t border-border/50">
          <p className="text-sm text-muted-foreground">
            Last updated: {new Date(latest.generated).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </footer>
      )}
    </div>
  );
}
