import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle } from 'lucide-react';
import {
  type AchievableSlaResult,
  type CanMeetSlaResult,
  formatDuration,
  formatSla,
} from './calculations';

interface ResultsPanelProps {
  mode: 'achievable' | 'target';
  result: AchievableSlaResult | CanMeetSlaResult;
  achievableResult?: AchievableSlaResult;
}

export function ResultsPanel({
  mode,
  result,
  achievableResult,
}: ResultsPanelProps) {
  if (mode === 'achievable') {
    return <AchievableResults result={result as AchievableSlaResult} />;
  }
  return (
    <TargetResults
      result={result as CanMeetSlaResult}
      achievableResult={achievableResult!}
    />
  );
}

function AchievableResults({ result }: { result: AchievableSlaResult }) {
  const overheadBeforeFix = result.responseOverheadPercent;

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Per-incident MTTR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {formatDuration(result.mttrMinutes)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Monthly downtime
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {formatDuration(result.monthlyDowntimeMinutes)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Yearly downtime
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {formatDuration(result.monthlyDowntimeMinutes * 12)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Maximum achievable SLA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-primary">
              {formatSla(result.maxAchievableSla)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle as="h2" className="text-base">Downtime Budget Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {result.breakdown.map((phase) => (
            <div key={phase.phase} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>{phase.label}</span>
                <span className="font-mono tabular-nums">
                  {formatDuration(phase.totalMinutes)}{' '}
                  <span className="text-muted-foreground">
                    ({phase.percentOfBudget.toFixed(1)}%)
                  </span>
                </span>
              </div>
              <Progress
                value={phase.percentOfBudget}
                className="h-2"
                aria-label={`${phase.label}: ${phase.percentOfBudget.toFixed(1)}% of budget`}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Insight */}
      <Card className="bg-amber-500/10 border-amber-500/20">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Response overhead insight</p>
              <p className="text-sm text-muted-foreground mt-1">
                {overheadBeforeFix.toFixed(0)}% of your error budget goes to response
                overhead (alert latency, acknowledge, travel, authenticate) before you even
                start diagnosing.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TargetResults({
  result,
  achievableResult,
}: {
  result: CanMeetSlaResult;
  achievableResult: AchievableSlaResult;
}) {
  const canMeet = result.canMeet;

  return (
    <div className="space-y-4">
      {/* Stats comparison */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Monthly budget
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {formatDuration(result.monthlyBudgetMinutes)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Your MTTR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {formatDuration(result.mttrMinutes)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
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
                incidents/mo
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Yearly budget
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {formatDuration(result.monthlyBudgetMinutes * 12)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations if not meeting */}
      {!canMeet && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle as="h2" className="text-base">To meet {formatSla(result.targetSla)}, you could:</CardTitle>
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
                  per month
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>
                  Reduce MTTR to{' '}
                  <strong className="text-foreground">
                    {formatDuration(result.monthlyBudgetMinutes / result.expectedIncidents)}
                  </strong>{' '}
                  per incident
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>
                  Target{' '}
                  <strong className="text-foreground">
                    {formatSla(achievableResult.maxAchievableSla)}
                  </strong>{' '}
                  SLA instead (achievable with current profile)
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
