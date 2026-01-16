import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle } from 'lucide-react';
import {
  type AchievableSloResult,
  type CanMeetSloResult,
  type BudgetPeriod,
  PERIOD_LABELS,
  formatDuration,
  formatSlo,
} from './calculations';

interface TargetTabProps {
  result: CanMeetSloResult;
  achievableResult: AchievableSloResult;
  period: BudgetPeriod;
}

export function TargetTab({ result, achievableResult, period }: TargetTabProps) {
  const canMeet = result.canMeet;
  const periodLabel = PERIOD_LABELS[period].toLowerCase();

  return (
    <div className="space-y-4">
      {/* Verdict */}
      <Card
        className={
          canMeet ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'
        }
      >
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            {canMeet ? (
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            ) : (
              <XCircle className="h-8 w-8 text-red-500" />
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold">
                  {canMeet ? 'LIKELY TO MEET' : 'UNLIKELY TO MEET'}
                </span>
                <Badge variant={canMeet ? 'default' : 'destructive'}>{formatSlo(result.targetSlo)}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {canMeet
                  ? `You have ${formatDuration(result.surplusOrDeficitMinutes)} of buffer in your error budget.`
                  : `You're ${formatDuration(Math.abs(result.surplusOrDeficitMinutes))} over your error budget.`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Budget visualization */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle as="h2" className="text-base">Error Budget Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Expected usage</span>
              <span className="font-mono tabular-nums">
                {Math.min(
                  100,
                  (achievableResult.periodDowntimeMinutes / result.periodBudgetMinutes) * 100
                ).toFixed(0)}
                %
              </span>
            </div>
            <div className="relative h-4 w-full rounded-full bg-secondary overflow-hidden">
              <div
                className={`h-full transition-all ${canMeet ? 'bg-primary' : 'bg-red-500'}`}
                style={{
                  width: `${Math.min(100, (achievableResult.periodDowntimeMinutes / result.periodBudgetMinutes) * 100)}%`,
                }}
              />
              {!canMeet && (
                <div
                  className="absolute top-0 right-0 h-full bg-red-500/30 border-l-2 border-red-500 border-dashed"
                  style={{
                    width: `${Math.max(0, 100 - (result.periodBudgetMinutes / achievableResult.periodDowntimeMinutes) * 100)}%`,
                  }}
                />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {PERIOD_LABELS[period]} budget: {formatDuration(result.periodBudgetMinutes)} | Expected:{' '}
              {formatDuration(achievableResult.periodDowntimeMinutes)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stats comparison */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle as="h2" className="text-sm font-medium text-muted-foreground">
              {PERIOD_LABELS[period]} budget
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatDuration(result.periodBudgetMinutes)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle as="h2" className="text-sm font-medium text-muted-foreground">
              Your MTTR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatDuration(result.mttrMinutes)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle as="h2" className="text-sm font-medium text-muted-foreground">
              Budget allows
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {!isFinite(result.allowedIncidents)
                ? '∞'
                : result.allowedIncidents < 1
                  ? result.allowedIncidents.toFixed(2)
                  : result.allowedIncidents.toFixed(1)}{' '}
              <span className="text-sm font-normal text-muted-foreground">
                incidents/{periodLabel.substring(0, 2)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle as="h2" className="text-sm font-medium text-muted-foreground">
              Yearly budget
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {formatDuration(
                period === 'yearly'
                  ? result.periodBudgetMinutes
                  : period === 'quarterly'
                    ? result.periodBudgetMinutes * 4
                    : result.periodBudgetMinutes * 12
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations if not meeting */}
      {!canMeet && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle as="h2" className="text-base">
              To meet {formatSlo(result.targetSlo)}, you could:
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>
                  Reduce expected incidents to{' '}
                  <strong className="text-foreground">
                    {result.allowedIncidents < 1
                      ? '< 1'
                      : `≤ ${Math.floor(result.allowedIncidents)}`}
                  </strong>{' '}
                  per {periodLabel}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>
                  Reduce MTTR to{' '}
                  <strong className="text-foreground">
                    {formatDuration(result.periodBudgetMinutes / result.expectedIncidents)}
                  </strong>{' '}
                  per incident
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>
                  Target{' '}
                  <strong className="text-foreground">
                    {formatSlo(achievableResult.maxAchievableSlo)}
                  </strong>{' '}
                  SLO instead (achievable with current profile)
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
