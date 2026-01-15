import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { WebVitalsData } from './types';

interface RumWebVitalsCardProps {
  data: WebVitalsData | null | undefined;
}

interface VitalConfig {
  key: 'LCP' | 'FCP' | 'CLS' | 'INP' | 'TTFB';
  label: string;
  thresholds: { good: number; poor: number };
  format: (value: number) => string;
}

const vitals: VitalConfig[] = [
  {
    key: 'LCP',
    label: 'Largest Contentful Paint',
    thresholds: { good: 2500, poor: 4000 },
    format: (v) => `${(v / 1000).toFixed(2)}s`,
  },
  {
    key: 'FCP',
    label: 'First Contentful Paint',
    thresholds: { good: 1800, poor: 3000 },
    format: (v) => `${(v / 1000).toFixed(2)}s`,
  },
  {
    key: 'CLS',
    label: 'Cumulative Layout Shift',
    thresholds: { good: 0.1, poor: 0.25 },
    format: (v) => v.toFixed(4),
  },
  {
    key: 'INP',
    label: 'Interaction to Next Paint',
    thresholds: { good: 200, poor: 500 },
    format: (v) => `${Math.round(v)}ms`,
  },
  {
    key: 'TTFB',
    label: 'Time to First Byte',
    thresholds: { good: 800, poor: 1800 },
    format: (v) => `${Math.round(v)}ms`,
  },
];

function getStatus(value: number, thresholds: { good: number; poor: number }): 'good' | 'warning' | 'critical' {
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.poor) return 'warning';
  return 'critical';
}

export function RumWebVitalsCard({ data }: RumWebVitalsCardProps) {
  if (!data || !data.metrics || Object.keys(data.metrics).length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Real User Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No RUM data available yet. Data will appear after users visit the site.</p>
        </CardContent>
      </Card>
    );
  }

  const statusText = {
    good: 'Good',
    warning: 'Needs Improvement',
    critical: 'Poor',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Real User Metrics</CardTitle>
        <p className="text-sm text-muted-foreground">
          Field data from {data.metrics.LCP?.count || data.metrics.FCP?.count || 0}+ sessions
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {vitals.map((vital) => {
          const metric = data.metrics[vital.key];
          if (!metric) return null;

          const value = metric.average;
          const status = getStatus(value, vital.thresholds);
          const progressValue = Math.min((value / vital.thresholds.poor) * 100, 100);

          return (
            <div key={vital.key} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{vital.key}</span>
                <span className={cn('font-mono', {
                  'text-emerald-500': status === 'good',
                  'text-amber-500': status === 'warning',
                  'text-red-500': status === 'critical',
                })}>
                  {vital.format(value)}
                  <span className="text-muted-foreground text-xs ml-2">
                    ({statusText[status]})
                  </span>
                </span>
              </div>
              <Progress
                value={progressValue}
                className="h-2"
                aria-label={`${vital.key}: ${vital.format(value)}`}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Good: ≤{vital.key === 'CLS' ? vital.thresholds.good : `${vital.thresholds.good}ms`}</span>
                <span>Poor: &gt;{vital.key === 'CLS' ? vital.thresholds.poor : `${vital.thresholds.poor}ms`}</span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
