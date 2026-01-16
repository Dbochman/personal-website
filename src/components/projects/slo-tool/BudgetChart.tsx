import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  TooltipProps,
} from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type ChartDataPoint, formatDuration } from './calculations';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

function CustomTooltip({ active, payload, label }: TooltipProps<ValueType, NameType>) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-popover text-popover-foreground border border-border rounded-lg px-3 py-2 text-sm shadow-md">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((entry, i) => {
        if (entry.value === undefined) return null;
        const value = Number(entry.value);
        const name =
          entry.dataKey === 'ideal' ? 'Ideal' : entry.dataKey === 'actual' ? 'Actual' : 'Projected';
        const color =
          entry.dataKey === 'ideal'
            ? 'text-muted-foreground'
            : entry.dataKey === 'actual'
              ? 'text-primary'
              : 'text-yellow-500';
        return (
          <p key={i} className={color}>
            {name}: {formatDuration(value)}
          </p>
        );
      })}
    </div>
  );
}

interface BudgetChartProps {
  data: ChartDataPoint[];
  daysElapsed: number;
  isOnTrack: boolean;
  compact?: boolean;
  title?: string;
}

export function BudgetChart({
  data,
  daysElapsed,
  isOnTrack,
  compact = false,
  title = 'Budget Burndown',
}: BudgetChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="h-32 flex items-center justify-center text-muted-foreground">
          No data to display
        </CardContent>
      </Card>
    );
  }

  // Find where projection hits zero (if it does)
  const exhaustionDay = data.find((d) => d.projected !== undefined && d.projected <= 0)?.day;

  const chartHeight = compact ? 'h-40' : 'h-64';

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle as="h2" className={compact ? 'text-base' : 'text-lg'}>
            {title}
          </CardTitle>
          <div
            className={`flex items-center gap-1.5 text-xs font-medium ${isOnTrack ? 'text-green-600' : 'text-destructive'}`}
          >
            {isOnTrack ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                On Track
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4" />
                At Risk
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className={`${chartHeight} w-full`}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              {/* Danger zone - if projected to exhaust */}
              {!isOnTrack && exhaustionDay && (
                <ReferenceArea
                  x1={exhaustionDay}
                  x2={data.length - 1}
                  fill="hsl(var(--destructive))"
                  fillOpacity={0.1}
                />
              )}

              <XAxis
                dataKey="date"
                tick={{ fontSize: compact ? 10 : 11 }}
                tickLine={false}
                axisLine={false}
                interval={Math.max(0, Math.floor(data.length / (compact ? 4 : 6)) - 1)}
                className="text-muted-foreground"
              />
              {!compact && (
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => formatDuration(v)}
                  className="text-muted-foreground"
                  width={50}
                />
              )}
              <Tooltip content={<CustomTooltip />} />

              {/* Current day marker */}
              <ReferenceLine
                x={data[daysElapsed]?.date}
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="4 4"
                strokeOpacity={0.5}
              />

              {/* Ideal burndown line */}
              <Line
                type="monotone"
                dataKey="ideal"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={1}
                strokeDasharray="4 4"
                dot={false}
                activeDot={false}
              />

              {/* Actual burndown line - only up to current day */}
              <Line
                type="stepAfter"
                dataKey="actual"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
                activeDot={compact ? false : { r: 4 }}
              />

              {/* Projected line */}
              <Line
                type="monotone"
                dataKey="projected"
                stroke={isOnTrack ? 'hsl(var(--chart-2))' : 'hsl(var(--destructive))'}
                strokeWidth={2}
                strokeDasharray="6 4"
                dot={false}
                activeDot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Legend - only show on full version */}
        {!compact && (
          <div className="flex flex-wrap gap-4 justify-center mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 border-t-2 border-dashed border-muted-foreground" />
              <span className="text-muted-foreground">Ideal</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-primary" />
              <span className="text-muted-foreground">Actual</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`w-4 h-0.5 border-t-2 border-dashed ${isOnTrack ? 'border-green-500' : 'border-destructive'}`}
              />
              <span className="text-muted-foreground">Projected</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
