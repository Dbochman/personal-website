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

interface BlogTrafficChartProps {
  data: GA4HistoryEntry[];
}

export function BlogTrafficChart({ data }: BlogTrafficChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        No data available
      </div>
    );
  }

  const chartData = data.map((entry) => {
    // Merge trailing-slash duplicates to match BlogAnalyticsCard logic
    const merged = new Map<string, number>();
    for (const p of entry.topPages ?? []) {
      if (!p.page.startsWith('/blog/') || p.page === '/blog/' || p.page === '/blog') continue;
      const normalized = p.page.replace(/\/$/, '');
      merged.set(normalized, (merged.get(normalized) ?? 0) + p.sessions);
    }
    const blogSessions = Array.from(merged.values()).reduce((sum, s) => sum + s, 0);

    return {
      date: new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      sessions: blogSessions,
    };
  });

  const tickInterval = Math.max(0, Math.ceil(chartData.length / 6) - 1);

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height={256}>
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="blogSessionGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            interval={tickInterval}
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
            stroke="hsl(var(--chart-2))"
            fill="url(#blogSessionGradient)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
