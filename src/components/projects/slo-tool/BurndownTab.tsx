import { Clock, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { BudgetChart } from './BudgetChart';
import {
  type BudgetCalculation,
  type ChartDataPoint,
  formatDuration,
} from './calculations';

interface BurndownTabProps {
  calculation: BudgetCalculation;
  chartData: ChartDataPoint[];
}

export function BurndownTab({ calculation, chartData }: BurndownTabProps) {
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

  const burnRateText =
    burnMultiplier < 0.5
      ? 'Very Low'
      : burnMultiplier < 0.9
        ? 'Low'
        : burnMultiplier < 1.1
          ? 'On Track'
          : burnMultiplier < 2
            ? 'High'
            : 'Critical';

  const burnRateColor =
    burnMultiplier < 0.9
      ? 'text-green-600 dark:text-green-400'
      : burnMultiplier < 1.1
        ? 'text-primary'
        : burnMultiplier < 2
          ? 'text-yellow-600 dark:text-yellow-400'
          : 'text-destructive';

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
                <p className="text-sm text-muted-foreground">Burn Rate</p>
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
        data={chartData}
        daysElapsed={daysElapsed}
        isOnTrack={isOnTrack}
        compact={false}
        title="Budget Burndown"
      />
    </div>
  );
}
