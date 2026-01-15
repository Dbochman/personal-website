import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, TooltipProps } from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

interface DeviceData {
  device: string;
  sessions: number;
  users: number;
}

interface DeviceBreakdownChartProps {
  data: DeviceData[];
}

const COLORS = {
  desktop: 'hsl(var(--chart-1))',
  mobile: 'hsl(var(--chart-2))',
  tablet: 'hsl(var(--chart-3))',
};

function CustomTooltip({ active, payload, total }: TooltipProps<ValueType, NameType> & { total: number }) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0];
  const value = data.value as number;
  return (
    <div className="bg-popover text-popover-foreground border border-border rounded-lg px-3 py-2 text-sm shadow-md">
      <p className="font-medium">{data.name}</p>
      <p>Sessions: {value.toLocaleString()} ({((value / total) * 100).toFixed(1)}%)</p>
    </div>
  );
}

export function DeviceBreakdownChart({ data }: DeviceBreakdownChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        No data available
      </div>
    );
  }

  const chartData = data.map((d) => ({
    name: d.device.charAt(0).toUpperCase() + d.device.slice(1),
    value: d.sessions,
    device: d.device,
  }));

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height={256}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            labelLine={false}
          >
            {chartData.map((entry) => (
              <Cell
                key={entry.device}
                fill={COLORS[entry.device as keyof typeof COLORS] || 'hsl(var(--chart-4))'}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip total={total} />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => <span className="text-sm">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
