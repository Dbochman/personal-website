import { useState, useMemo, useEffect } from 'react';
import { Clock, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { BudgetChart } from './BudgetChart';
import {
  type BudgetCalculation,
  type SloConfig,
  type Incident,
  formatDuration,
  generateChartData,
  calculateBurnRateProjection,
} from './calculations';

interface BurndownTabProps {
  calculation: BudgetCalculation;
  config: SloConfig;
  incidents: Incident[];
}

const SLIDER_MIN = 0.1;
const SLIDER_MAX = 5;

function clampToSliderRange(value: number): number {
  return Math.min(SLIDER_MAX, Math.max(SLIDER_MIN, value));
}

export function BurndownTab({ calculation, config, incidents }: BurndownTabProps) {
  const [simulatedMultiplier, setSimulatedMultiplier] = useState(() =>
    clampToSliderRange(calculation.burnMultiplier)
  );

  // Resync slider when the actual burn rate changes (e.g., user changes inputs)
  useEffect(() => {
    setSimulatedMultiplier(clampToSliderRange(calculation.burnMultiplier));
  }, [calculation.burnMultiplier]);

  const {
    totalBudgetMinutes,
    consumedMinutes,
    remainingMinutes,
    consumedPercent,
    burnMultiplier,
    projectedExhaustionDate,
    isOnTrack,
    daysElapsed,
    daysRemaining,
  } = calculation;

  // Calculate projection for simulated burn rate
  const simulatedProjection = useMemo(
    () => calculateBurnRateProjection(calculation, simulatedMultiplier),
    [calculation, simulatedMultiplier]
  );

  // Generate chart data with simulated burn rate
  const simulatedChartData = useMemo(
    () => generateChartData(config, incidents, calculation, simulatedMultiplier),
    [config, incidents, calculation, simulatedMultiplier]
  );

  const getBurnRateText = (multiplier: number) =>
    multiplier < 0.5
      ? 'Very Low'
      : multiplier < 0.9
        ? 'Low'
        : multiplier < 1.1
          ? 'On Track'
          : multiplier < 2
            ? 'High'
            : 'Critical';

  const getBurnRateColor = (multiplier: number) =>
    multiplier < 0.9
      ? 'text-green-600 dark:text-green-400'
      : multiplier < 1.1
        ? 'text-primary'
        : multiplier < 2
          ? 'text-yellow-600 dark:text-yellow-400'
          : 'text-destructive';

  const burnRateText = getBurnRateText(burnMultiplier);
  const burnRateColor = getBurnRateColor(burnMultiplier);

  const simulatedBurnRateText = getBurnRateText(simulatedMultiplier);
  const simulatedBurnRateColor = getBurnRateColor(simulatedMultiplier);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Budget Consumed */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Budget Consumed</p>
                <p className="text-2xl font-bold">{formatDuration(consumedMinutes)}</p>
                <p className="text-sm text-muted-foreground">
                  of {formatDuration(totalBudgetMinutes)} ({consumedPercent.toFixed(1)}%)
                </p>
              </div>
              <div className="rounded-full p-2 bg-destructive/10">
                <Clock className="h-5 w-5 text-destructive" />
              </div>
            </div>
            <Progress
              value={Math.min(100, consumedPercent)}
              className="mt-4 h-2"
              aria-label="Budget consumed percentage"
            />
          </CardContent>
        </Card>

        {/* Budget Remaining */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Budget Remaining</p>
                <p className={cn('text-2xl font-bold', remainingMinutes <= 0 && 'text-destructive')}>
                  {formatDuration(remainingMinutes)}
                </p>
                <p className="text-sm text-muted-foreground">{daysRemaining} days left in period</p>
              </div>
              <div className="rounded-full p-2 bg-primary/10">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-muted-foreground">
              <span>
                Day {daysElapsed} of {calculation.periodDays}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Burn Rate */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current Burn Rate</p>
                <p className={cn('text-2xl font-bold', burnRateColor)}>{burnMultiplier.toFixed(1)}x</p>
                <p className="text-sm text-muted-foreground">
                  {burnRateText}
                  {burnMultiplier > 1 ? ' (faster than sustainable)' : ' burn rate'}
                </p>
              </div>
              <div
                className={cn(
                  'rounded-full p-2',
                  burnMultiplier < 1.1 ? 'bg-green-500/10' : 'bg-yellow-500/10'
                )}
              >
                {burnMultiplier > 1 ? (
                  <TrendingUp className={cn('h-5 w-5', burnRateColor)} />
                ) : (
                  <TrendingDown className="h-5 w-5 text-green-600 dark:text-green-400" />
                )}
              </div>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Consuming {formatDuration(calculation.burnRate)}/day (sustainable:{' '}
              {formatDuration(calculation.sustainableRate)}/day)
            </p>
          </CardContent>
        </Card>

        {/* Projection */}
        <Card
          className={cn(
            'sm:col-span-2 lg:col-span-3',
            isOnTrack ? 'border-green-500/50' : 'border-destructive/50'
          )}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div
                className={cn('rounded-full p-3', isOnTrack ? 'bg-green-500/10' : 'bg-destructive/10')}
              >
                {isOnTrack ? (
                  <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                )}
              </div>
              <div>
                <p
                  className={cn(
                    'text-lg font-semibold',
                    isOnTrack ? 'text-green-600 dark:text-green-400' : 'text-destructive'
                  )}
                >
                  {isOnTrack ? 'On Track' : 'At Risk'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isOnTrack ? (
                    "At current burn rate, you'll have budget remaining at end of period"
                  ) : projectedExhaustionDate ? (
                    <>
                      Projected to exhaust budget on{' '}
                      <span className="font-medium text-foreground">
                        {projectedExhaustionDate.toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </>
                  ) : (
                    'Budget already exhausted'
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Full Burndown Chart */}
      <BudgetChart
        data={simulatedChartData}
        daysElapsed={daysElapsed}
        isOnTrack={simulatedProjection.isOnTrack}
        compact={false}
        title="Budget Burndown"
      />

      {/* Burn Rate Simulator */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle as="h2" className="text-base">Burn Rate Simulator</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Drag to explore different burn rates. 1x tracks the ideal line (budget reaches 0 at period end).
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="burn-rate-slider" className="text-sm font-medium">
                Multiplier
              </Label>
            </div>
            <div className="text-right">
              <p className={cn('text-2xl font-bold tabular-nums', simulatedBurnRateColor)}>
                {simulatedMultiplier.toFixed(1)}x
              </p>
              <p className={cn('text-xs', simulatedBurnRateColor)}>{simulatedBurnRateText}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Slider
              id="burn-rate-slider"
              value={[simulatedMultiplier]}
              onValueChange={([v]) => setSimulatedMultiplier(v)}
              min={SLIDER_MIN}
              max={SLIDER_MAX}
              step={0.1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{SLIDER_MIN}x</span>
              <span>{(SLIDER_MIN + SLIDER_MAX) / 2}x</span>
              <span>{SLIDER_MAX}x</span>
            </div>
          </div>

          {/* Simulated Projection Result */}
          <div
            className={cn(
              'rounded-lg p-4 mt-4',
              simulatedProjection.isOnTrack ? 'bg-green-500/10' : 'bg-destructive/10'
            )}
          >
            <div className="flex items-center gap-3">
              {simulatedProjection.isOnTrack ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
              )}
              <div>
                <p
                  className={cn(
                    'font-medium',
                    simulatedProjection.isOnTrack
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-destructive'
                  )}
                >
                  {simulatedProjection.isOnTrack ? 'On Track' : 'Budget Exhausted'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {simulatedProjection.isOnTrack ? (
                    <>
                      At {simulatedMultiplier.toFixed(1)}x, you'll use{' '}
                      <span className="font-medium text-foreground">
                        {simulatedProjection.percentConsumedAtEnd.toFixed(0)}%
                      </span>{' '}
                      of budget by end of period
                    </>
                  ) : simulatedProjection.exhaustionDate ? (
                    <>
                      At {simulatedMultiplier.toFixed(1)}x, budget exhausted in{' '}
                      <span className="font-medium text-foreground">
                        {Math.ceil(simulatedProjection.daysUntilExhaustion!)} days
                      </span>{' '}
                      ({simulatedProjection.exhaustionDate.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })})
                    </>
                  ) : (
                    'Budget already exhausted'
                  )}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
