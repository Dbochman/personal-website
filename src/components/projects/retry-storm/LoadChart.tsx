import { memo, useMemo } from 'react';
import {
  Area,
  ComposedChart,
  Line,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from 'recharts';
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { HORIZON_S, INCIDENT_START_S, type SimSeries } from './simulation';

const SERIES = {
  first: { label: 'First attempts', color: 'hsl(var(--chart-1))' },
  retries: { label: 'Retries', color: 'hsl(var(--chart-5))' },
  wasted: { label: 'Served after caller gave up', color: 'hsl(var(--chart-3))' },
  goodput: { label: 'Successful responses', color: 'hsl(var(--chart-2))' },
  capacity: { label: 'Dependency capacity', color: 'hsl(var(--foreground))' },
} as const;

type SeriesKey = keyof typeof SERIES;

const rps = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

function ChartTooltip({ active, payload, label }: TooltipContentProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
      <p className="mb-1 font-medium">t = {label}s</p>
      {payload.map((entry) => {
        const key = entry.dataKey as SeriesKey;
        return (
          <p key={key} className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: SERIES[key].color }}
            />
            {SERIES[key].label}: {rps.format(Number(entry.value))} req/s
          </p>
        );
      })}
    </div>
  );
}

interface LoadChartProps {
  series: SimSeries;
  incidentEndS: number;
  summaryText: string;
}

export const LoadChart = memo(function LoadChart({ series, incidentEndS, summaryText }: LoadChartProps) {
  const data = useMemo(
    () =>
      series.timeS.map((t, i) => ({
        t,
        first: series.firstAttempts[i],
        retries: series.retries[i],
        wasted: series.wasted[i],
        goodput: series.goodput[i],
        capacity: series.capacity[i],
      })),
    [series]
  );

  return (
    <figure className="space-y-3">
      <div role="img" aria-label={summaryText} className="h-64 w-full sm:h-72">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <ReferenceArea
              x1={INCIDENT_START_S}
              x2={incidentEndS}
              fill="hsl(var(--destructive))"
              fillOpacity={0.12}
              ifOverflow="hidden"
            />
            <XAxis
              dataKey="t"
              type="number"
              domain={[0, HORIZON_S]}
              ticks={[0, 20, 40, 60, 80, 100, 120]}
              tickFormatter={(v) => `${v}s`}
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 100) / 10}k` : String(v))}
              tickLine={false}
              axisLine={false}
              width={36}
            />
            <Tooltip content={ChartTooltip} />
            <Area
              type="stepAfter"
              dataKey="first"
              stackId="offered"
              stroke={SERIES.first.color}
              fill={SERIES.first.color}
              fillOpacity={0.35}
              strokeWidth={1}
              isAnimationActive={false}
            />
            <Area
              type="stepAfter"
              dataKey="retries"
              stackId="offered"
              stroke={SERIES.retries.color}
              fill={SERIES.retries.color}
              fillOpacity={0.45}
              strokeWidth={1}
              isAnimationActive={false}
            />
            <Area
              type="stepAfter"
              dataKey="wasted"
              stroke={SERIES.wasted.color}
              fill={SERIES.wasted.color}
              fillOpacity={0.25}
              strokeWidth={1.5}
              strokeDasharray="3 3"
              isAnimationActive={false}
            />
            <Line
              type="stepAfter"
              dataKey="goodput"
              stroke={SERIES.goodput.color}
              strokeWidth={2.5}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="stepAfter"
              dataKey="capacity"
              stroke={SERIES.capacity.color}
              strokeOpacity={0.7}
              strokeWidth={1.5}
              strokeDasharray="6 4"
              dot={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <figcaption>
        <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          {(Object.keys(SERIES) as SeriesKey[]).map((key) => (
            <li key={key} className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="inline-block h-2.5 w-4 rounded-xs"
                style={
                  key === 'capacity'
                    ? { borderTop: `2px dashed ${SERIES[key].color}`, height: 0 }
                    : { backgroundColor: SERIES[key].color, opacity: key === 'goodput' ? 1 : 0.6 }
                }
              />
              {SERIES[key].label}
            </li>
          ))}
          <li className="flex items-center gap-1.5">
            <span aria-hidden="true" className="inline-block h-2.5 w-4 rounded-xs bg-destructive/20" />
            Trigger window
          </li>
        </ul>
      </figcaption>
    </figure>
  );
});
