import { Area } from '@/components/dither-kit/area';
import { AreaChart } from '@/components/dither-kit/area-chart';
import type { ChartConfig } from '@/components/dither-kit/chart-context';
import { Grid } from '@/components/dither-kit/grid';
import { Tooltip } from '@/components/dither-kit/tooltip';
import { XAxis } from '@/components/dither-kit/x-axis';
import { YAxis } from '@/components/dither-kit/y-axis';
import type { GA4HistoryEntry } from '../types';
import { formatHistoryDate, getRecentHistory } from './recentHistory';

interface SessionsTrendChartProps {
  data: GA4HistoryEntry[];
}

type SessionsRow = Record<string, unknown> & {
  date: string;
  sessions: number;
};

const CONFIG: ChartConfig = {
  sessions: { label: 'Sessions', color: 'blue' },
};

function safeMetric(value: number) {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function signedNumber(value: number) {
  return `${value > 0 ? '+' : ''}${value.toLocaleString()}`;
}

export function SessionsTrendChart({ data }: SessionsTrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        No data available
      </div>
    );
  }

  const chartData: SessionsRow[] = getRecentHistory(data, 60).map((entry) => ({
    date: formatHistoryDate(entry.date),
    sessions: safeMetric(entry.summary.sessions),
  }));

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        No chart data available
      </div>
    );
  }

  const first = chartData[0];
  const latest = chartData[chartData.length - 1];
  const peak = chartData.reduce((highest, row) =>
    row.sessions > highest.sessions ? row : highest,
  );
  const change = latest.sessions - first.sessions;
  const chartLabel = `${chartData.length} rolling seven-day session snapshots from ${first.date} to ${latest.date}. Latest: ${latest.sessions.toLocaleString()} sessions. High: ${peak.sessions.toLocaleString()} sessions on ${peak.date}. Change across the displayed snapshots: ${signedNumber(change)} sessions.`;

  return (
    <div className="h-64 w-full">
      <div className="h-52">
        <AreaChart
          data={chartData}
          config={CONFIG}
          margins={{ top: 8, right: 8, bottom: 24, left: 42 }}
          animationDuration={700}
          bloom="off"
          ariaLabel={chartLabel}
        >
          <Grid />
          <XAxis dataKey="date" maxTicks={6} minTickSpacing={62} />
          <YAxis tickFormatter={(value) => value.toLocaleString()} />
          <Area dataKey="sessions" variant="gradient" />
          <Tooltip
            labelKey="date"
            valueFormatter={(value) => `${value.toLocaleString()} sessions`}
          />
        </AreaChart>
      </div>

      <dl
        aria-label="Session trend summary"
        className="grid h-12 grid-cols-3 items-center gap-2 border-t border-border/50 pt-2 text-xs"
      >
        <div>
          <dt className="text-muted-foreground">Latest 7d</dt>
          <dd className="font-medium tabular-nums">{latest.sessions.toLocaleString()}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">
            High<span className="hidden sm:inline"> · {peak.date}</span>
          </dt>
          <dd className="font-medium tabular-nums">{peak.sessions.toLocaleString()}</dd>
        </div>
        <div className="text-right">
          <dt className="text-muted-foreground">Change</dt>
          <dd className="font-medium tabular-nums">{signedNumber(change)}</dd>
        </div>
      </dl>

      <table className="sr-only">
        <caption>Rolling seven-day session snapshots</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Sessions</th>
          </tr>
        </thead>
        <tbody>
          {chartData.map((row, index) => (
            <tr key={`${row.date}-${index}`}>
              <td>{row.date}</td>
              <td>{row.sessions}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
