import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Moon, Calendar, Users, Timer, RefreshCw } from 'lucide-react';
import type { ModelMetrics } from './types';

interface MetricsPanelProps {
  metrics: ModelMetrics;
}

export function MetricsPanel({ metrics }: MetricsPanelProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {/* Key Metrics */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Key Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <MetricRow
            icon={<Clock className="w-4 h-4" />}
            label="Coverage"
            value={`${metrics.coveragePercent}%`}
            highlight={metrics.coveragePercent === 100}
          />
          <MetricRow
            icon={<Moon className="w-4 h-4" />}
            label="Night Hours"
            value={`${metrics.nightHoursPerPerson}h/person`}
            warning={metrics.nightHoursPerPerson > 10}
          />
          <MetricRow
            icon={<Calendar className="w-4 h-4" />}
            label="Weekend Hours"
            value={`${metrics.weekendHoursPerPerson}h/person`}
          />
          <MetricRow
            icon={<Timer className="w-4 h-4" />}
            label="Hours/Week"
            value={`${metrics.hoursPerWeekPerPerson}h/person`}
          />
        </CardContent>
      </Card>

      {/* Model Details */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Model Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <MetricRow
            icon={<Users className="w-4 h-4" />}
            label="Team Size"
            value={`${metrics.teamSize} engineers`}
          />
          <MetricRow
            icon={<Clock className="w-4 h-4" />}
            label="Shift Length"
            value={metrics.shiftLength}
          />
          <MetricRow
            icon={<RefreshCw className="w-4 h-4" />}
            label="Rotation"
            value={metrics.rotation}
          />
        </CardContent>
      </Card>
    </div>
  );
}

interface MetricRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
  warning?: boolean;
}

function MetricRow({ icon, label, value, highlight, warning }: MetricRowProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <span
        className={`text-sm font-medium ${
          highlight
            ? 'text-green-600 dark:text-green-400'
            : warning
              ? 'text-amber-600 dark:text-amber-400'
              : ''
        }`}
      >
        {value}
      </span>
    </div>
  );
}
