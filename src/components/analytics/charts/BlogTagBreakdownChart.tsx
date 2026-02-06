import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  TooltipProps,
} from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5, var(--primary)))',
];

function BarTooltip({ active, payload, label }: TooltipProps<ValueType, NameType>) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-popover text-popover-foreground border border-border rounded-lg px-3 py-2 text-sm shadow-md">
      <p className="font-medium">{label}</p>
      <p>Sessions: {Number(payload[0].value).toLocaleString()}</p>
    </div>
  );
}

function PieTooltip({ active, payload }: TooltipProps<ValueType, NameType>) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0];
  return (
    <div className="bg-popover text-popover-foreground border border-border rounded-lg px-3 py-2 text-sm shadow-md">
      <p className="font-medium">{data.name}</p>
      <p>Sessions: {Number(data.value).toLocaleString()}</p>
    </div>
  );
}

interface TagData {
  tag: string;
  sessions: number;
}

interface CategoryData {
  category: string;
  sessions: number;
}

interface BlogTagBreakdownChartProps {
  tagData: TagData[];
  categoryData: CategoryData[];
}

export function BlogTagBreakdownChart({ tagData, categoryData }: BlogTagBreakdownChartProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Tag bar chart */}
      <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-2">Sessions by Tag</h4>
        {tagData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            No tag data available
          </div>
        ) : (
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
        )}
      </div>

      {/* Category pie chart */}
      <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-2">Sessions by Category</h4>
        {categoryData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            No category data available
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height={256}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="sessions"
                  nameKey="category"
                  label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => <span className="text-sm">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
