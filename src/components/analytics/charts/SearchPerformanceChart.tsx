import { Area } from '@/components/dither-kit/area';
import { AreaChart } from '@/components/dither-kit/area-chart';
import type { AreaVariant, ChartConfig } from '@/components/dither-kit/chart-context';
import { Grid } from '@/components/dither-kit/grid';
import { Tooltip } from '@/components/dither-kit/tooltip';
import { XAxis } from '@/components/dither-kit/x-axis';
import { YAxis } from '@/components/dither-kit/y-axis';
import type { SearchConsoleHistoryEntry } from '../types';
import { formatHistoryDate, getRecentHistory } from './recentHistory';

interface SearchPerformanceChartProps {
  data: SearchConsoleHistoryEntry[];
}

type SearchRow = Record<string, unknown> & {
  date: string;
  clicks: number;
  impressions: number;
};

type SearchMetric = 'clicks' | 'impressions';

interface SearchMetricPanelProps {
  chartData: SearchRow[];
  metric: SearchMetric;
  label: string;
  color: 'blue' | 'purple';
  variant: AreaVariant;
}

function safeMetric(value: number) {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function signedNumber(value: number) {
  return `${value > 0 ? '+' : ''}${value.toLocaleString()}`;
}

function SearchMetricPanel({
  chartData,
  metric,
  label,
  color,
  variant,
}: SearchMetricPanelProps) {
  const first = chartData[0];
  const latest = chartData[chartData.length - 1];
  const peak = chartData.reduce((highest, row) =>
    row[metric] > highest[metric] ? row : highest,
  );
  const change = latest[metric] - first[metric];
  const unit = metric === 'clicks' ? 'clicks' : 'impressions';
  const config: ChartConfig = {
    [metric]: { label, color },
  };
  const chartLabel = `${label} across ${chartData.length} rolling seven-day Search Console snapshots from ${first.date} to ${latest.date}. Latest: ${latest[metric].toLocaleString()} ${unit}. High: ${peak[metric].toLocaleString()} ${unit} on ${peak.date}. Change across the displayed snapshots: ${signedNumber(change)} ${unit}.`;

  return (
    <section className="min-w-0 rounded-lg border border-border/60 bg-muted/10 p-2">
      <h4 className="px-1 font-mono text-xs font-medium text-muted-foreground">
        {label}
      </h4>
      <div className="h-36 sm:h-40">
        <AreaChart
          data={chartData}
          config={config}
          margins={{ top: 8, right: 8, bottom: 24, left: 42 }}
          animationDuration={700}
          bloom="off"
          ariaLabel={chartLabel}
        >
          <Grid />
          <XAxis dataKey="date" maxTicks={4} minTickSpacing={56} />
          <YAxis tickCount={3} tickFormatter={(value) => value.toLocaleString()} />
          <Area dataKey={metric} variant={variant} />
          <Tooltip
            labelKey="date"
            valueFormatter={(value) => `${value.toLocaleString()} ${unit}`}
          />
        </AreaChart>
      </div>

      <dl
        aria-label={`${label} search trend summary`}
        className="grid grid-cols-3 gap-2 border-t border-border/50 px-1 pt-2 text-[11px]"
      >
        <div>
          <dt className="text-muted-foreground">Latest</dt>
          <dd className="font-medium tabular-nums">{latest[metric].toLocaleString()}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">
            High<span className="hidden lg:inline"> · {peak.date}</span>
          </dt>
          <dd className="font-medium tabular-nums">{peak[metric].toLocaleString()}</dd>
        </div>
        <div className="text-right">
          <dt className="text-muted-foreground">Change</dt>
          <dd className="font-medium tabular-nums">{signedNumber(change)}</dd>
        </div>
      </dl>
    </section>
  );
}

export function SearchPerformanceChart({ data }: SearchPerformanceChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        No data available
      </div>
    );
  }

  const recentHistory = getRecentHistory(data, 60);
  const displayHistory = recentHistory.length >= 6
    ? recentHistory
    : data.slice(-Math.min(data.length, 8));

  const chartData: SearchRow[] = displayHistory.map((entry) => ({
    date: formatHistoryDate(entry.date),
    clicks: safeMetric(entry.summary.totalClicks),
    impressions: safeMetric(entry.summary.totalImpressions),
  }));

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        No chart data available
      </div>
    );
  }

  return (
    <div className="w-full space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <SearchMetricPanel
          chartData={chartData}
          metric="impressions"
          label="Impressions"
          color="blue"
          variant="gradient"
        />
        <SearchMetricPanel
          chartData={chartData}
          metric="clicks"
          label="Clicks"
          color="purple"
          variant="dotted"
        />
      </div>

      <table className="sr-only">
        <caption>Rolling seven-day Search Console snapshots</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Impressions</th>
            <th scope="col">Clicks</th>
          </tr>
        </thead>
        <tbody>
          {chartData.map((row, index) => (
            <tr key={`${row.date}-${index}`}>
              <td>{row.date}</td>
              <td>{row.impressions}</td>
              <td>{row.clicks}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
