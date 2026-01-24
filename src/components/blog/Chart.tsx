import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// Theme-aware colors
const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2, 220 70% 50%))',
  'hsl(var(--chart-3, 280 65% 60%))',
  'hsl(var(--chart-4, 340 75% 55%))',
  'hsl(var(--chart-5, 30 80% 55%))',
];

interface DataPoint {
  name: string;
  value?: number;
  [key: string]: string | number | undefined;
}

interface ChartProps {
  type: 'bar' | 'line' | 'pie';
  data: DataPoint[];
  dataKey?: string;
  height?: number;
  title?: string;
  showLegend?: boolean;
  showGrid?: boolean;
}

/**
 * Reusable chart component for MDX blog posts
 *
 * Usage in MDX:
 * ```mdx
 * <Chart
 *   type="bar"
 *   data={[
 *     { name: 'Jan', value: 100 },
 *     { name: 'Feb', value: 200 },
 *   ]}
 * />
 * ```
 */
export function Chart({
  type,
  data,
  dataKey = 'value',
  height = 300,
  title,
  showLegend = true,
  showGrid = true,
}: ChartProps) {
  const commonProps = {
    data,
    margin: { top: 20, right: 30, left: 20, bottom: 5 },
  };

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <BarChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />}
            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
            />
            {showLegend && <Legend />}
            <Bar dataKey={dataKey} fill={COLORS[0]} radius={[4, 4, 0, 0]} />
          </BarChart>
        );

      case 'line':
        return (
          <LineChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />}
            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
            />
            {showLegend && <Legend />}
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={COLORS[0]}
              strokeWidth={2}
              dot={{ fill: COLORS[0], strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        );

      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey={dataKey}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
              }}
            />
            {showLegend && <Legend />}
          </PieChart>
        );

      default:
        return null;
    }
  };

  return (
    <figure className="my-8">
      {title && (
        <figcaption className="text-center text-sm font-medium text-muted-foreground mb-4">
          {title}
        </figcaption>
      )}
      <div className="bg-card rounded-lg border border-border p-4">
        <ResponsiveContainer width="100%" height={height}>
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </figure>
  );
}

/**
 * Multi-series chart for comparing multiple data series
 */
interface MultiSeriesChartProps {
  type: 'bar' | 'line';
  data: DataPoint[];
  series: { key: string; name: string; color?: string }[];
  height?: number;
  title?: string;
  showLegend?: boolean;
  showGrid?: boolean;
  stacked?: boolean;
}

export function MultiSeriesChart({
  type,
  data,
  series,
  height = 300,
  title,
  showLegend = true,
  showGrid = true,
  stacked = false,
}: MultiSeriesChartProps) {
  const commonProps = {
    data,
    margin: { top: 20, right: 30, left: 20, bottom: 5 },
  };

  const renderChart = () => {
    if (type === 'bar') {
      return (
        <BarChart {...commonProps}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />}
          <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px',
            }}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
          />
          {showLegend && <Legend />}
          {series.map((s, i) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.name}
              fill={s.color || COLORS[i % COLORS.length]}
              radius={[4, 4, 0, 0]}
              stackId={stacked ? 'stack' : undefined}
            />
          ))}
        </BarChart>
      );
    }

    return (
      <LineChart {...commonProps}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />}
        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '6px',
          }}
          labelStyle={{ color: 'hsl(var(--foreground))' }}
        />
        {showLegend && <Legend />}
        {series.map((s, i) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.name}
            stroke={s.color || COLORS[i % COLORS.length]}
            strokeWidth={2}
            dot={{ fill: s.color || COLORS[i % COLORS.length], strokeWidth: 2 }}
          />
        ))}
      </LineChart>
    );
  };

  return (
    <figure className="my-8">
      {title && (
        <figcaption className="text-center text-sm font-medium text-muted-foreground mb-4">
          {title}
        </figcaption>
      )}
      <div className="bg-card rounded-lg border border-border p-4">
        <ResponsiveContainer width="100%" height={height}>
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </figure>
  );
}
