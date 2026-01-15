import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, TooltipProps } from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import type { SearchConsoleHistoryEntry } from '../types';

function CustomTooltip({ active, payload, label }: TooltipProps<ValueType, NameType>) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-popover text-popover-foreground border border-border rounded-lg px-3 py-2 text-sm shadow-md">
      <p className="font-medium">{label}</p>
      {payload.map((entry, i) => (
        <p key={i}>
          {String(entry.name).charAt(0).toUpperCase() + String(entry.name).slice(1)}: {Number(entry.value).toLocaleString()}
        </p>
      ))}
    </div>
  );
}

interface SearchPerformanceChartProps {
  data: SearchConsoleHistoryEntry[];
}

export function SearchPerformanceChart({ data }: SearchPerformanceChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        No data available
      </div>
    );
  }

  const chartData = data.map((entry) => ({
    date: new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    clicks: entry.summary.totalClicks,
    impressions: entry.summary.totalImpressions,
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height={256}>
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="impressionsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="clicksGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => value.toLocaleString()}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="top"
            height={36}
            formatter={(value) => (
              <span className="text-sm">
                {value.charAt(0).toUpperCase() + value.slice(1)}
              </span>
            )}
          />
          <Area
            type="monotone"
            dataKey="impressions"
            stroke="hsl(var(--chart-1))"
            fill="url(#impressionsGradient)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="clicks"
            stroke="hsl(var(--chart-2))"
            fill="url(#clicksGradient)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
