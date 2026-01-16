import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Info, CheckCircle2, Lightbulb } from 'lucide-react';
import {
  type AchievableSloResult,
  type BudgetPeriod,
  PERIOD_LABELS,
  formatDuration,
  formatSlo,
} from './calculations';

type InsightType = 'info' | 'warning' | 'success' | 'tip';

interface Insight {
  type: InsightType;
  title: string;
  message: string;
}

function getInsight(result: AchievableSloResult): Insight {
  const { responseOverheadPercent, maxAchievableSlo, breakdown, mttrMinutes, periodDowntimeMinutes } =
    result;

  // Find the dominant phase (largest contributor)
  const sortedPhases = [...breakdown].sort((a, b) => b.percentOfBudget - a.percentOfBudget);
  const dominantPhase = sortedPhases[0];
  const travelPhase = breakdown.find((p) => p.phase === 'travelMin');

  // Zero downtime case
  if (periodDowntimeMinutes === 0 || mttrMinutes === 0) {
    return {
      type: 'success',
      title: 'Perfect availability',
      message: 'With zero response time or incidents, you can achieve 100% uptime.',
    };
  }

  // Excellent SLO (99.9%+)
  if (maxAchievableSlo >= 99.9) {
    return {
      type: 'success',
      title: 'Enterprise-grade reliability',
      message: `You can achieve ${formatSlo(maxAchievableSlo)} uptime. That's three nines or better—suitable for mission-critical systems.`,
    };
  }

  // Poor SLO (below 99%)
  if (maxAchievableSlo < 99) {
    return {
      type: 'warning',
      title: 'Reliability at risk',
      message: `Current profile only achieves ${formatSlo(maxAchievableSlo)}. Consider reducing response times or incident frequency to improve.`,
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

interface AchievableTabProps {
  result: AchievableSloResult;
  period: BudgetPeriod;
}

export function AchievableTab({ result, period }: AchievableTabProps) {
  const periodLabel = PERIOD_LABELS[period].toLowerCase();

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
            <div className="text-xl font-bold">{formatDuration(result.mttrMinutes)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle as="h2" className="text-sm font-medium text-muted-foreground">
              {PERIOD_LABELS[period]} downtime
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatDuration(result.periodDowntimeMinutes)}</div>
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
              {formatDuration(
                period === 'yearly'
                  ? result.periodDowntimeMinutes
                  : period === 'quarterly'
                    ? result.periodDowntimeMinutes * 4
                    : result.periodDowntimeMinutes * 12
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle as="h2" className="text-sm font-medium text-muted-foreground">
              Maximum achievable SLO
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-primary">{formatSlo(result.maxAchievableSlo)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Budget breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle as="h2" className="text-base">
            Downtime Budget Breakdown (per {periodLabel})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {result.breakdown.map((phase) => (
            <div key={phase.phase} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>{phase.label}</span>
                <span className="font-mono tabular-nums">
                  {formatDuration(phase.totalMinutes)}{' '}
                  <span className="text-muted-foreground">({phase.percentOfBudget.toFixed(1)}%)</span>
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
                  <p className="text-sm text-muted-foreground mt-1">{insight.message}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })()}
    </div>
  );
}
