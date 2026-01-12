import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle } from 'lucide-react';
import {
  type AchievableSlaResult,
  type CanMeetSlaResult,
  formatDuration,
  formatSla,
} from './calculations';

interface TargetSummaryProps {
  result: CanMeetSlaResult;
  achievableResult: AchievableSlaResult;
}

export function TargetSummary({ result, achievableResult }: TargetSummaryProps) {
  const canMeet = result.canMeet;

  return (
    <div className="space-y-4">
      {/* Verdict */}
      <Card
        className={
          canMeet
            ? 'bg-green-500/10 border-green-500/20'
            : 'bg-red-500/10 border-red-500/20'
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
                <Badge variant={canMeet ? 'default' : 'destructive'}>
                  {formatSla(result.targetSla)}
                </Badge>
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
          <CardTitle className="text-base">Error Budget Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Expected usage</span>
              <span className="font-mono tabular-nums">
                {Math.min(100, (achievableResult.monthlyDowntimeMinutes / result.monthlyBudgetMinutes) * 100).toFixed(0)}%
              </span>
            </div>
            <div className="relative h-4 w-full rounded-full bg-secondary overflow-hidden">
              <div
                className={`h-full transition-all ${canMeet ? 'bg-primary' : 'bg-red-500'}`}
                style={{
                  width: `${Math.min(100, (achievableResult.monthlyDowntimeMinutes / result.monthlyBudgetMinutes) * 100)}%`,
                }}
              />
              {!canMeet && (
                <div className="absolute top-0 right-0 h-full bg-red-500/30 border-l-2 border-red-500 border-dashed"
                  style={{
                    width: `${Math.max(0, 100 - (result.monthlyBudgetMinutes / achievableResult.monthlyDowntimeMinutes) * 100)}%`
                  }}
                />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Budget: {formatDuration(result.monthlyBudgetMinutes)} | Expected:{' '}
              {formatDuration(achievableResult.monthlyDowntimeMinutes)}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
