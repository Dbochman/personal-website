import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { LighthousePageScore } from './types';

interface CoreWebVitalsCardProps {
  data: LighthousePageScore[];
}

interface VitalConfig {
  label: string;
  key: keyof LighthousePageScore;
  unit: string;
  thresholds: { good: number; poor: number };
  parse: (value: string) => number;
}

const vitals: VitalConfig[] = [
  {
    label: 'LCP',
    key: 'lcp',
    unit: 's',
    thresholds: { good: 2.5, poor: 4.0 },
    parse: (v) => parseFloat(v.replace(/[^\d.]/g, '')),
  },
  {
    label: 'FCP',
    key: 'fcp',
    unit: 's',
    thresholds: { good: 1.8, poor: 3.0 },
    parse: (v) => parseFloat(v.replace(/[^\d.]/g, '')),
  },
  {
    label: 'CLS',
    key: 'cls',
    unit: '',
    thresholds: { good: 0.1, poor: 0.25 },
    parse: (v) => parseFloat(v) || 0,
  },
  {
    label: 'TBT',
    key: 'tbt',
    unit: 'ms',
    thresholds: { good: 200, poor: 600 },
    parse: (v) => parseFloat(v.replace(/[^\d.]/g, '')),
  },
];

function getStatus(value: number, thresholds: { good: number; poor: number }): 'good' | 'warning' | 'critical' {
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.poor) return 'warning';
  return 'critical';
}

export function CoreWebVitalsCard({ data }: CoreWebVitalsCardProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Core Web Vitals</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No data available</p>
        </CardContent>
      </Card>
    );
  }

  // Use home page metrics as primary, or first available
  const homePage = data.find(p => p.page === 'home') ?? data[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Core Web Vitals</CardTitle>
        <p className="text-sm text-muted-foreground">
          Based on {homePage.page} page
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {vitals.map((vital) => {
          const rawValue = homePage[vital.key] as string;
          const value = vital.parse(rawValue);
          const status = getStatus(value, vital.thresholds);

          // Calculate progress percentage (0-100 based on poor threshold)
          const progressValue = Math.min((value / vital.thresholds.poor) * 100, 100);

          const statusText = {
            good: 'Good',
            warning: 'Needs Improvement',
            critical: 'Poor',
          };

          return (
            <div key={vital.key} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{vital.label}</span>
                <span className={cn('font-mono', {
                  'text-emerald-500': status === 'good',
                  'text-amber-500': status === 'warning',
                  'text-red-500': status === 'critical',
                })}>
                  {rawValue}
                  <span className="text-muted-foreground text-xs ml-2">
                    ({statusText[status]})
                  </span>
                </span>
              </div>
              <Progress
                value={progressValue}
                className="h-2"
                aria-label={`${vital.label}: ${rawValue}`}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Good: ≤{vital.thresholds.good}{vital.unit}</span>
                <span>Poor: &gt;{vital.thresholds.poor}{vital.unit}</span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
