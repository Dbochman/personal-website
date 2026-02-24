import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, TooltipProps, Legend } from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import type { GA4HistoryEntry } from '../types';

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5, var(--primary)))',
  'hsl(var(--muted-foreground))',
];

function CustomTooltip({ active, payload, label }: TooltipProps<ValueType, NameType>) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-popover text-popover-foreground border border-border rounded-lg px-3 py-2 text-sm shadow-md max-w-xs">
      <p className="font-medium mb-1">{label}</p>
      {payload.filter(e => Number(e.value) > 0).map((entry, i) => (
        <p key={i} className="truncate">
          <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: entry.color }} />
          {entry.name}: {Number(entry.value).toLocaleString()}
        </p>
      ))}
    </div>
  );
}

interface PostLookups {
  bySlug: Map<string, { title: string; slug: string }>;
  byStrippedSlug: Map<string, { title: string; slug: string }>;
  byTitleKey: Map<string, { title: string; slug: string }>;
}

interface BlogTrafficChartProps {
  data: GA4HistoryEntry[];
  postLookups: PostLookups;
  matchPost: (slug: string, lookups: PostLookups) => { title: string; slug: string } | undefined;
}

export function BlogTrafficChart({ data, postLookups, matchPost }: BlogTrafficChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        No data available
      </div>
    );
  }

  // First pass: accumulate total sessions per canonical slug across all entries
  const cumulativeBySlug = new Map<string, number>();
  for (const entry of data) {
    for (const p of entry.topPages ?? []) {
      if (!p.page.startsWith('/blog/') || p.page === '/blog/' || p.page === '/blog') continue;
      const normalized = p.page.replace(/\/$/, '');
      const slug = normalized.replace('/blog/', '');
      const post = matchPost(slug, postLookups);
      const key = post?.slug ?? slug;
      cumulativeBySlug.set(key, (cumulativeBySlug.get(key) ?? 0) + p.sessions);
    }
  }

  // Pick top 5 by cumulative sessions
  const top5 = [...cumulativeBySlug.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([slug]) => slug);

  const top5Set = new Set(top5);

  // Resolve display names
  const displayNames = new Map<string, string>();
  for (const slug of top5) {
    const post = matchPost(slug, postLookups);
    const title = post?.title ?? slug;
    // Truncate long titles for legend
    displayNames.set(slug, title.length > 30 ? title.slice(0, 28) + '…' : title);
  }

  // Build chart data: one row per history entry
  const chartData = data.map((entry) => {
    const merged = new Map<string, number>();
    for (const p of entry.topPages ?? []) {
      if (!p.page.startsWith('/blog/') || p.page === '/blog/' || p.page === '/blog') continue;
      const normalized = p.page.replace(/\/$/, '');
      const slug = normalized.replace('/blog/', '');
      const post = matchPost(slug, postLookups);
      const key = post?.slug ?? slug;
      merged.set(key, (merged.get(key) ?? 0) + p.sessions);
    }

    const row: Record<string, string | number> = {
      date: new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    };

    let otherSessions = 0;
    for (const [slug, sessions] of merged) {
      if (top5Set.has(slug)) {
        row[slug] = sessions;
      } else {
        otherSessions += sessions;
      }
    }
    // Ensure all top5 keys exist
    for (const slug of top5) {
      if (!(slug in row)) row[slug] = 0;
    }
    row['Other'] = otherSessions;

    return row;
  });

  const tickInterval = Math.max(0, Math.ceil(chartData.length / 6) - 1);

  const allKeys = [...top5, 'Other'];

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height={288}>
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            {allKeys.map((key, i) => (
              <linearGradient key={key} id={`blogGrad-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.3} />
                <stop offset="95%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0} />
              </linearGradient>
            ))}
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
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value: string) => {
              if (value === 'Other') return 'Other';
              return displayNames.get(value) ?? value;
            }}
            wrapperStyle={{ fontSize: '11px' }}
          />
          {allKeys.map((key, i) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              name={key}
              stackId="1"
              stroke={COLORS[i % COLORS.length]}
              fill={`url(#blogGrad-${i})`}
              strokeWidth={1.5}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
