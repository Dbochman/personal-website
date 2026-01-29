import { memo, lazy, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GitHubBillingEntry } from './types';
import { DollarSign, Clock, Database, Server } from 'lucide-react';

const BillingTrendChart = lazy(() => import('./charts/BillingTrendChart').then(m => ({ default: m.BillingTrendChart })));

interface GitHubBillingCardProps {
  data: GitHubBillingEntry[];
}

export const GitHubBillingCard = memo(function GitHubBillingCard({ data }: GitHubBillingCardProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center py-8">
            No GitHub Actions billing data available yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  const latest = data[data.length - 1];
  const { summary, byRunner, byRepository, storage, period } = latest;

  // Calculate savings percentage
  const savingsPercent = summary.totalGrossAmount > 0
    ? ((summary.totalDiscountAmount / summary.totalGrossAmount) * 100).toFixed(0)
    : '100';

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Minutes
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalMinutes.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">{period.description}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Savings
            </CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">
              ${summary.totalDiscountAmount.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{savingsPercent}% from free tier</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Net Cost
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summary.totalNetAmount === 0 ? 'text-emerald-500' : ''}`}>
              ${summary.totalNetAmount.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">actual spend</p>
          </CardContent>
        </Card>
      </div>

      {/* Minutes Trend Chart - only show if we have history */}
      {data.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Minutes Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div className="h-48 bg-muted rounded animate-pulse" />}>
              <BillingTrendChart data={data} />
            </Suspense>
          </CardContent>
        </Card>
      )}

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Resource Usage - runners + storage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              Resource Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(byRunner)
                .filter(([, stats]) => stats.minutes > 0)
                .map(([runner, stats]) => (
                <div key={runner} className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-sm font-medium capitalize">{runner} runners</span>
                  <div className="text-right">
                    <span className="text-sm tabular-nums">{stats.minutes.toLocaleString()} min</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      (${stats.grossAmount.toFixed(2)})
                    </span>
                  </div>
                </div>
              ))}
              {storage.gbHours > 0 && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-medium">Artifact storage</span>
                  <div className="text-right">
                    <span className="text-sm tabular-nums">{storage.gbHours.toFixed(2)} GB-hrs</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      (${storage.grossAmount.toFixed(2)})
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* By Repository */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Usage by Repository
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {byRepository.slice(0, 5).map((repo) => {
                const percentage = summary.totalMinutes > 0
                  ? ((repo.minutes / summary.totalMinutes) * 100).toFixed(0)
                  : 0;
                return (
                  <div key={repo.name} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-mono truncate max-w-[180px]">{repo.name}</span>
                      <span className="text-sm tabular-nums">{repo.minutes.toLocaleString()} min</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div
                        className="bg-primary rounded-full h-1.5 transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
});
