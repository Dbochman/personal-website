import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, TooltipProps } from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

function CustomTooltip({ active, payload }: TooltipProps<ValueType, NameType>) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0];
  return (
    <div className="bg-popover text-popover-foreground border border-border rounded-lg px-3 py-2 text-sm shadow-md">
      <p className="font-medium">{data.payload.name}</p>
      <p>Sessions: {Number(data.value).toLocaleString()}</p>
    </div>
  );
}

interface TrafficSourcesChartProps {
  data: {
    channels: Array<{
      channel: string;
      sessions: number;
      users: number;
    }>;
    sources: Array<{
      source: string;
      medium: string;
      sessions: number;
      users: number;
    }>;
  } | undefined;
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export function TrafficSourcesChart({ data }: TrafficSourcesChartProps) {
  if (!data || data.channels.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        No traffic source data available
      </div>
    );
  }

  const chartData = data.channels.slice(0, 6).map((item) => ({
    name: item.channel,
    sessions: item.sessions,
    users: item.users,
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height={256}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 10, left: 80, bottom: 0 }}>
          <XAxis type="number" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={75}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="sessions" radius={[0, 4, 4, 0]}>
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
