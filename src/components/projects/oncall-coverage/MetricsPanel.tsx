import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ModelMetrics } from './types';

interface MetricsPanelProps {
  metrics: ModelMetrics;
}

export function MetricsPanel({ metrics }: MetricsPanelProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle as="h2" className="text-sm font-medium">Key Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <MetricBox
            label="Coverage"
            value={`${metrics.coveragePercent}%`}
            highlight={metrics.coveragePercent === 100}
          />
          <MetricBox
            label="Team Size"
            value={`${metrics.teamSize}`}
          />
          <MetricBox
            label="Shift Length"
            value={metrics.shiftLength}
          />
          <MetricBox
            label="Handoffs/Week"
            value={`${metrics.handoffsPerWeek}`}
            warning={metrics.handoffsPerWeek > 14}
          />
          <MetricBox
            label="Night Hours"
            value={`${metrics.nightHoursPerPerson}h`}
            highlight={metrics.nightHoursPerPerson === 0}
            warning={metrics.nightHoursPerPerson > 10}
          />
          <MetricBox
            label="Weekend Hours"
            value={`${metrics.weekendHoursPerPerson}h`}
          />
          <MetricBox
            label="Hours/Week"
            value={`${metrics.hoursPerWeekPerPerson}h`}
          />
          <MetricBox
            label="Frequency"
            value={metrics.onCallFrequency}
            small
          />
        </div>
        <div className="mt-4 pt-3 border-t text-sm text-muted-foreground">
          <span className="font-medium">Rotation:</span> {metrics.rotation}
        </div>
      </CardContent>
    </Card>
  );
}

interface MetricBoxProps {
  label: string;
  value: string;
  highlight?: boolean;
  warning?: boolean;
  small?: boolean;
}

function MetricBox({ label, value, highlight, warning, small }: MetricBoxProps) {
  return (
    <div className="space-y-1">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div
        className={`font-semibold ${small ? 'text-sm' : 'text-lg'} ${
          highlight
            ? 'text-green-600 dark:text-green-400'
            : warning
              ? 'text-amber-600 dark:text-amber-400'
              : ''
        }`}
      >
        {value}
      </div>
    </div>
  );
}
