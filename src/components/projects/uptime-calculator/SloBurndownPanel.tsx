import { useMemo } from 'react';
import { BurndownChart } from '@/components/projects/error-budget-burndown/BurndownChart';
import {
  calculateBudget,
  generateChartData,
  toLocalDateString,
  formatDuration,
  type SloConfig,
  type Incident,
} from '@/components/projects/error-budget-burndown/calculations';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Clock, AlertTriangle } from 'lucide-react';

interface SloBurndownPanelProps {
  targetSla: number;
  incidentsPerMonth: number;
  avgDurationMinutes: number;
}

/**
 * Get the first day of the current month as a date string
 */
function getFirstOfMonth(): string {
  const now = new Date();
  return toLocalDateString(new Date(now.getFullYear(), now.getMonth(), 1));
}

/**
 * Generate simulated incidents distributed across the month
 * Places incidents starting from day 2 so drops are visible on the chart
 */
function generateSimulatedIncidents(
  incidentsPerMonth: number,
  avgDurationMinutes: number
): Incident[] {
  const incidents: Incident[] = [];
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  // Calculate days elapsed (minimum 1 to avoid division issues)
  const daysElapsed = Math.max(
    1,
    Math.floor((today.getTime() - startOfMonth.getTime()) / (1000 * 60 * 60 * 24))
  );

  if (incidentsPerMonth === 0) {
    return incidents;
  }

  // Calculate how many incidents should have occurred by now (proportional to time)
  // Use at least 1 incident if we're past day 3 and have any expected incidents
  const proportionalIncidents = (daysElapsed / 30) * incidentsPerMonth;
  const expectedIncidentsSoFar = Math.min(
    incidentsPerMonth,
    daysElapsed > 3 ? Math.max(1, Math.round(proportionalIncidents)) : Math.floor(proportionalIncidents)
  );

  if (expectedIncidentsSoFar === 0) {
    return incidents;
  }

  // Distribute incidents evenly across days 2 to daysElapsed
  // Start from day 2 so the chart shows the initial budget, then drops
  const availableDays = Math.max(1, daysElapsed - 2);

  for (let i = 0; i < expectedIncidentsSoFar; i++) {
    // Spread incidents evenly, starting from day 2
    const dayOffset = expectedIncidentsSoFar === 1
      ? Math.floor(availableDays / 2) // Single incident in the middle
      : Math.floor((i / (expectedIncidentsSoFar - 1)) * availableDays);
    const day = 2 + dayOffset;

    const incidentDate = new Date(
      startOfMonth.getTime() + day * 24 * 60 * 60 * 1000
    );

    incidents.push({
      id: `sim-${i}`,
      name: `Incident ${i + 1}`,
      date: toLocalDateString(incidentDate),
      durationMinutes: avgDurationMinutes,
      impactPercent: 100,
    });
  }

  return incidents;
}

export function SloBurndownPanel({
  targetSla,
  incidentsPerMonth,
  avgDurationMinutes,
}: SloBurndownPanelProps) {
  const { incidents, calculation, chartData } = useMemo(() => {
    const cfg: SloConfig = {
      target: targetSla,
      period: 'monthly',
      startDate: getFirstOfMonth(),
    };

    const inc = generateSimulatedIncidents(incidentsPerMonth, avgDurationMinutes);
    const calc = calculateBudget(cfg, inc);
    const data = generateChartData(cfg, inc, calc);

    return { config: cfg, incidents: inc, calculation: calc, chartData: data };
  }, [targetSla, incidentsPerMonth, avgDurationMinutes]);

  const burnRateStatus = calculation.isOnTrack ? 'on-track' : 'at-risk';

  return (
    <div className="space-y-4">
      {/* Burndown Chart */}
      <BurndownChart
        data={chartData}
        daysElapsed={calculation.daysElapsed}
        isOnTrack={calculation.isOnTrack}
      />

      {/* Summary Row */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Clock className="w-4 h-4" />
              <span>Budget</span>
            </div>
            <div className="text-lg font-semibold">
              {formatDuration(calculation.totalBudgetMinutes)}
            </div>
            <div className="text-xs text-muted-foreground">
              {formatDuration(calculation.remainingMinutes)} remaining
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <AlertTriangle className="w-4 h-4" />
              <span>Consumed</span>
            </div>
            <div className="text-lg font-semibold">
              {calculation.consumedPercent.toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground">
              {formatDuration(calculation.consumedMinutes)} used
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              {calculation.isOnTrack ? (
                <TrendingDown className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingUp className="w-4 h-4 text-destructive" />
              )}
              <span>Burn Rate</span>
            </div>
            <div className="text-lg font-semibold">
              {calculation.burnMultiplier.toFixed(1)}x
            </div>
            <div className="text-xs text-muted-foreground">
              {formatDuration(calculation.burnRate)}/day
            </div>
          </CardContent>
        </Card>

        <Card className={burnRateStatus === 'at-risk' ? 'border-destructive/50' : 'border-green-500/50'}>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <span>Status</span>
            </div>
            <div className={`text-lg font-semibold ${burnRateStatus === 'at-risk' ? 'text-destructive' : 'text-green-500'}`}>
              {burnRateStatus === 'at-risk' ? 'At Risk' : 'On Track'}
            </div>
            <div className="text-xs text-muted-foreground">
              {incidents.length} incidents simulated
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Note about simulation */}
      <p className="text-xs text-muted-foreground text-center">
        Simulates {incidentsPerMonth} incidents/month with {avgDurationMinutes} min avg duration based on your response profile
      </p>
    </div>
  );
}
