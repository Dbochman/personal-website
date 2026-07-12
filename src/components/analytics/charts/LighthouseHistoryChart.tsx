import { DitherBarList, type DitherBarDatum } from '@/components/dither-kit/bar-list';
import type { AreaVariant } from '@/components/dither-kit/chart-context';
import type { DitherColor } from '@/components/dither-kit/palette';
import type { LighthousePageScore } from '../types';

interface LighthouseHistoryChartProps {
  data: LighthousePageScore[];
}

interface ScorePresentation {
  status: 'Good' | 'Needs improvement' | 'Poor';
  color: DitherColor;
  variant: AreaVariant;
}

const SCORE_TARGET = 90;

function safeScore(score: number) {
  return Number.isFinite(score) ? Math.min(100, Math.max(0, score)) : 0;
}

function scorePresentation(score: number): ScorePresentation {
  if (score >= 90) {
    return { status: 'Good', color: 'green', variant: 'gradient' };
  }
  if (score >= 70) {
    return { status: 'Needs improvement', color: 'orange', variant: 'dotted' };
  }
  return { status: 'Poor', color: 'red', variant: 'hatched' };
}

function pageLabel(page: string) {
  const cleaned = page.trim().replace(/[-_]+/g, ' ').replace(/\s+/g, ' ');
  if (!cleaned) return 'Unknown page';

  return cleaned
    .split(' ')
    .map((word) => {
      const normalized = word.toLocaleLowerCase('en-US');
      if (['slo', 'seo', 'a11y', 'api'].includes(normalized)) {
        return normalized.toLocaleUpperCase('en-US');
      }
      return `${word.charAt(0).toLocaleUpperCase('en-US')}${word.slice(1)}`;
    })
    .join(' ');
}

export function LighthouseHistoryChart({ data }: LighthouseHistoryChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        No data available
      </div>
    );
  }

  const chartData: DitherBarDatum[] = data.map((page, index) => {
    const value = safeScore(page.performance);
    const presentation = scorePresentation(value);
    return {
      key: `${page.page || 'page'}-${index}`,
      label: pageLabel(page.page),
      value,
      color: presentation.color,
      variant: presentation.variant,
      detail: presentation.status,
    };
  });
  const chartLabel = `Lighthouse performance scores by page. Target: ${SCORE_TARGET} or higher. ${chartData
    .map(
      (page) =>
        `${page.label}: ${page.value.toLocaleString()} out of 100, ${page.detail}`,
    )
    .join('; ')}.`;

  return (
    <div className="min-h-64 w-full space-y-2">
      <p className="text-right text-xs text-muted-foreground">
        Target: <span className="font-medium text-foreground">90 or higher</span>
      </p>
      <DitherBarList
        data={chartData}
        max={100}
        marker={SCORE_TARGET}
        ariaLabel={chartLabel}
        valueFormatter={(value) => `${value.toLocaleString()}/100`}
      />
    </div>
  );
}
