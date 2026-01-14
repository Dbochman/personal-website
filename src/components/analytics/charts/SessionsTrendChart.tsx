import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, TooltipProps } from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import type { GA4HistoryEntry } from '../types';

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

interface SessionsTrendChartProps {
  data: GA4HistoryEntry[];
}

export function SessionsTrendChart({ data }: SessionsTrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        No data available
      </div>
    );
  }

  const chartData = data.map((entry) => ({
    date: new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    sessions: entry.summary.sessions,
    users: entry.summary.users,
    pageViews: entry.summary.pageViews,
  }));

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="sessionGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            className="text-muted-foreground"
          />
          <YAxis
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => value.toLocaleString()}
            className="text-muted-foreground"
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="sessions"
            stroke="hsl(var(--primary))"
            fill="url(#sessionGradient)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
