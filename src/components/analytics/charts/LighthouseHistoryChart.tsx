import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import type { LighthousePageScore } from '../types';

interface LighthouseHistoryChartProps {
  data: LighthousePageScore[];
}

// Color based on score
function getScoreColor(score: number): string {
  if (score >= 90) return 'hsl(142, 76%, 36%)'; // emerald-600
  if (score >= 70) return 'hsl(45, 93%, 47%)';  // amber-500
  return 'hsl(0, 72%, 51%)';                     // red-500
}

export function LighthouseHistoryChart({ data }: LighthouseHistoryChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        No data available
      </div>
    );
  }

  // Show performance scores by page
  const chartData = data.map((page) => ({
    page: page.page,
    performance: page.performance,
    accessibility: page.accessibility,
    seo: page.seo,
    bestPractices: page.bestPractices,
  }));

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 10, left: 60, bottom: 0 }}>
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="page"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={60}
          />
          <ReferenceLine x={90} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            formatter={(value: number) => [`${value}`, 'Performance']}
          />
          <Bar dataKey="performance" radius={[0, 4, 4, 0]}>
            {chartData.map((entry) => (
              <Cell key={entry.page} fill={getScoreColor(entry.performance)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
