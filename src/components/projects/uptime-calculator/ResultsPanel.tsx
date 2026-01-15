import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Info, CheckCircle2, Lightbulb } from 'lucide-react';
import {
  type AchievableSlaResult,
  type CanMeetSlaResult,
  formatDuration,
  formatSla,
} from './calculations';

type InsightType = 'info' | 'warning' | 'success' | 'tip';

interface Insight {
  type: InsightType;
  title: string;
  message: string;
}

function getInsight(result: AchievableSlaResult): Insight {
  const { responseOverheadPercent, maxAchievableSla, breakdown, mttrMinutes, monthlyDowntimeMinutes } = result;

  // Find the dominant phase (largest contributor)
  const sortedPhases = [...breakdown].sort((a, b) => b.percentOfBudget - a.percentOfBudget);
  const dominantPhase = sortedPhases[0];
  const travelPhase = breakdown.find(p => p.phase === 'travelMin');

  // Zero downtime case
  if (monthlyDowntimeMinutes === 0 || mttrMinutes === 0) {
    return {
      type: 'success',
      title: 'Perfect availability',
      message: 'With zero response time or incidents, you can achieve 100% uptime.',
    };
  }

  // Excellent SLA (99.9%+)
  if (maxAchievableSla >= 99.9) {
    return {
      type: 'success',
      title: 'Enterprise-grade reliability',
      message: `You can achieve ${formatSla(maxAchievableSla)} uptime. That's three nines or better—suitable for mission-critical systems.`,
    };
  }

  // Poor SLA (below 99%)
  if (maxAchievableSla < 99) {
    return {
      type: 'warning',
      title: 'Reliability at risk',
      message: `Current profile only achieves ${formatSla(maxAchievableSla)}. Consider reducing response times or incident frequency to improve.`,
    };
  }

  // High travel time (> 20 min)
  if (travelPhase && travelPhase.totalMinutes > 0 && travelPhase.percentOfBudget > 20) {
    return {
      type: 'warning',
      title: 'Travel time impact',
      message: `Getting to a computer accounts for ${travelPhase.percentOfBudget.toFixed(0)}% of your response time. Consider mobile incident tools or reducing after-hours response expectations.`,
    };
  }

  // High overhead (> 50%)
  if (responseOverheadPercent > 50) {
    return {
      type: 'warning',
      title: 'Response overhead',
      message: `${responseOverheadPercent.toFixed(0)}% of your time is spent on overhead (alerting, acknowledgment, travel, auth) before you even start diagnosing.`,
    };
  }

  // Diagnose dominates (> 40%)
  if (dominantPhase.phase === 'diagnoseMin' && dominantPhase.percentOfBudget > 40) {
    return {
      type: 'tip',
      title: 'Diagnosis bottleneck',
      message: `Diagnosis takes ${dominantPhase.percentOfBudget.toFixed(0)}% of your response time. Better runbooks, observability dashboards, or AI-assisted triage could help.`,
    };
  }

  // Fix dominates (> 40%)
  if (dominantPhase.phase === 'fixMin' && dominantPhase.percentOfBudget > 40) {
    return {
      type: 'tip',
      title: 'Remediation focus',
      message: `Fixing takes ${dominantPhase.percentOfBudget.toFixed(0)}% of your response time. Consider automated remediation, feature flags for quick rollbacks, or reducing deployment complexity.`,
    };
  }

  // Low overhead (< 30%) - efficient
  if (responseOverheadPercent < 30) {
    return {
      type: 'info',
      title: 'Efficient response chain',
      message: `Only ${responseOverheadPercent.toFixed(0)}% overhead before diagnosis begins. Your alerting and access workflows are well-optimized.`,
    };
  }

  // Default: moderate overhead
  return {
    type: 'info',
    title: 'Response overhead',
    message: `${responseOverheadPercent.toFixed(0)}% of your error budget goes to response overhead before you start diagnosing and fixing.`,
  };
}

const insightStyles: Record<InsightType, { card: string; icon: string }> = {
  info: {
    card: 'bg-blue-500/10 border-blue-500/20',
    icon: 'text-blue-500',
  },
  warning: {
    card: 'bg-amber-500/10 border-amber-500/20',
    icon: 'text-amber-500',
  },
  success: {
    card: 'bg-emerald-500/10 border-emerald-500/20',
    icon: 'text-emerald-500',
  },
  tip: {
    card: 'bg-violet-500/10 border-violet-500/20',
    icon: 'text-violet-500',
  },
};

const insightIcons: Record<InsightType, typeof Info> = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle2,
  tip: Lightbulb,
};

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
  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle as="h2" className="text-sm font-medium text-muted-foreground">
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
            <CardTitle as="h2" className="text-sm font-medium text-muted-foreground">
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
            <CardTitle as="h2" className="text-sm font-medium text-muted-foreground">
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
            <CardTitle as="h2" className="text-sm font-medium text-muted-foreground">
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
      {(() => {
        const insight = getInsight(result);
        const styles = insightStyles[insight.type];
        const Icon = insightIcons[insight.type];
        return (
          <Card className={styles.card}>
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <Icon className={`h-5 w-5 ${styles.icon} shrink-0 mt-0.5`} />
                <div>
                  <p className="font-medium text-sm">{insight.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {insight.message}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })()}
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
            <CardTitle as="h2" className="text-sm font-medium text-muted-foreground">
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
            <CardTitle as="h2" className="text-sm font-medium text-muted-foreground">
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
                incidents/mo
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
