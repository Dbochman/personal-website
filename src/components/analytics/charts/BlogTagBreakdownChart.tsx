import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  TooltipProps,
} from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

function BarTooltip({ active, payload, label }: TooltipProps<ValueType, NameType>) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-popover text-popover-foreground border border-border rounded-lg px-3 py-2 text-sm shadow-md">
      <p className="font-medium">{label}</p>
      <p>Sessions: {Number(payload[0].value).toLocaleString()}</p>
    </div>
  );
}

interface TagData {
  tag: string;
  sessions: number;
}

interface BlogTagBreakdownChartProps {
  tagData: TagData[];
}

export function BlogTagBreakdownChart({ tagData }: BlogTagBreakdownChartProps) {
  if (tagData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        No tag data available
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height={256}>
        <BarChart
          data={tagData.slice(0, 10)}
          layout="vertical"
          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
        >
          <XAxis type="number" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
          <YAxis
            type="category"
            dataKey="tag"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={100}
          />
          <Tooltip content={<BarTooltip />} />
          <Bar dataKey="sessions" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
