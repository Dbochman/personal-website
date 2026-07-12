import { Area } from '@/components/dither-kit/area';
import { AreaChart } from '@/components/dither-kit/area-chart';
import type { ChartConfig } from '@/components/dither-kit/chart-context';
import { Grid } from '@/components/dither-kit/grid';
import { Tooltip } from '@/components/dither-kit/tooltip';
import { XAxis } from '@/components/dither-kit/x-axis';
import { YAxis } from '@/components/dither-kit/y-axis';
import type { GitHubBillingEntry } from '../types';
import { formatHistoryDate } from './recentHistory';

interface BillingTrendChartProps {
  data: GitHubBillingEntry[];
}

type BillingRow = Record<string, unknown> & {
  date: string;
  minutes: number;
};

const CONFIG: ChartConfig = {
  minutes: { label: 'Cumulative minutes', color: 'purple' },
};

function safeMetric(value: number) {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function signedNumber(value: number) {
  return `${value > 0 ? '+' : ''}${value.toLocaleString()}`;
}

export function BillingTrendChart({ data }: BillingTrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-muted-foreground">
        No billing history available yet
      </div>
    );
  }

  const chartData: BillingRow[] = data.map((entry) => ({
    date: formatHistoryDate(entry.date),
    minutes: safeMetric(entry.summary.totalMinutes),
  }));
  const first = chartData[0];
  const latest = chartData[chartData.length - 1];
  const change = latest.minutes - first.minutes;
  const chartLabel = `${chartData.length} reported snapshots of cumulative GitHub Actions minutes from ${first.date} to ${latest.date}. First reported: ${first.minutes.toLocaleString()} minutes. Latest: ${latest.minutes.toLocaleString()} minutes. Change across the displayed snapshots: ${signedNumber(change)} minutes.`;

  return (
    <div className="h-48 w-full">
      <div className="h-36">
        <AreaChart
          data={chartData}
          config={CONFIG}
          margins={{ top: 8, right: 8, bottom: 24, left: 48 }}
          animationDuration={700}
          bloom="off"
          ariaLabel={chartLabel}
        >
          <Grid />
          <XAxis dataKey="date" maxTicks={5} minTickSpacing={58} />
          <YAxis tickCount={3} tickFormatter={(value) => value.toLocaleString()} />
          <Area dataKey="minutes" variant="gradient" />
          <Tooltip
            labelKey="date"
            valueFormatter={(value) => `${value.toLocaleString()} cumulative minutes`}
          />
        </AreaChart>
      </div>

      <dl
        aria-label="GitHub Actions billing-minute trend summary"
        className="grid h-12 grid-cols-3 items-center gap-2 border-t border-border/50 pt-2 text-xs"
      >
        <div>
          <dt className="text-muted-foreground">
            First<span className="hidden sm:inline"> · {first.date}</span>
          </dt>
          <dd className="font-medium tabular-nums">{first.minutes.toLocaleString()}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">
            Latest<span className="hidden sm:inline"> · {latest.date}</span>
          </dt>
          <dd className="font-medium tabular-nums">{latest.minutes.toLocaleString()}</dd>
        </div>
        <div className="text-right">
          <dt className="text-muted-foreground">Change</dt>
          <dd className="font-medium tabular-nums">{signedNumber(change)}</dd>
        </div>
      </dl>

      <table className="sr-only">
        <caption>Reported cumulative GitHub Actions minute snapshots</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Cumulative minutes</th>
          </tr>
        </thead>
        <tbody>
          {chartData.map((row, index) => (
            <tr key={`${row.date}-${index}`}>
              <td>{row.date}</td>
              <td>{row.minutes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
