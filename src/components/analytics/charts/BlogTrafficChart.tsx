import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, TooltipContentProps, CartesianGrid } from 'recharts';
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import type { BlogDailyReport } from '../types';
import type { ValidatedBlogPost } from '@/types/blog';
import { buildBlogTraffic, formatBlogTrafficDate } from '@/lib/analytics/blog-traffic';

const COLORS = [
  'hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))',
  'hsl(var(--chart-4))', 'hsl(var(--chart-5, var(--primary)))', 'hsl(var(--muted-foreground))',
];

function CustomTooltip({ active, payload, label }: TooltipContentProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((sum, entry) => sum + Number(entry.value ?? 0), 0);
  return (
    <div className="bg-popover text-popover-foreground border border-border rounded-lg px-3 py-2 text-sm shadow-md max-w-xs">
      <p className="font-medium mb-1">{formatBlogTrafficDate(Number(label))}</p>
      <p className="mb-2">{total.toLocaleString()} total page views</p>
      {payload.filter(e => Number(e.value) > 0).map((entry, i) => (
        <p key={i}>
          <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: entry.color }} />
          {entry.name}: {Number(entry.value).toLocaleString()} ({Math.round(Number(entry.value) / total * 100)}%)
        </p>
      ))}
    </div>
  );
}

export interface PostLookups {
  bySlug: ReadonlyMap<string, ValidatedBlogPost>;
  byStrippedSlug: ReadonlyMap<string, ValidatedBlogPost>;
  byTitleKey: ReadonlyMap<string, ValidatedBlogPost>;
}

interface BlogTrafficChartProps {
  data: BlogDailyReport | null;
  postLookups: PostLookups;
  matchPost: (slug: string, lookups: PostLookups) => { title: string; slug: string } | undefined;
}

export function BlogTrafficChart({ data, postLookups, matchPost }: BlogTrafficChartProps) {
  if (!data?.days.length) {
    return <div className="h-64 flex items-center justify-center text-muted-foreground">Daily blog traffic unavailable</div>;
  }
  const { rows, series } = buildBlogTraffic(data, slug => matchPost(slug, postLookups));
  const ticks = rows.filter((_, i) => i === rows.length - 1 || i % Math.max(1, Math.ceil((rows.length - 1) / 5)) === 0)
    .map(row => row.timestamp as number);

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-3">
        Daily page views · {formatBlogTrafficDate(rows[0].timestamp as number)}–{formatBlogTrafficDate(rows[rows.length - 1].timestamp as number)} · {data.timeZone}
        <br />Top 5 posts in this period, plus all remaining posts in Other.
      </p>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height={288}>
          <AreaChart data={rows} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
            <XAxis dataKey="timestamp" type="number" scale="time" domain={['dataMin', 'dataMax']}
              ticks={ticks} tickFormatter={formatBlogTrafficDate} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} allowDecimals={false}
              tickFormatter={value => value.toLocaleString()} />
            <Tooltip content={CustomTooltip} />
            {series.map(({ key, title }, i) => (
              <Area key={key} type="linear" dataKey={key} name={title} stackId="1" connectNulls={false}
                stroke={key === 'other' ? COLORS[5] : COLORS[i]} fill={key === 'other' ? COLORS[5] : COLORS[i]}
                fillOpacity={0.18} strokeWidth={1.5} isAnimationActive={false} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-3 grid grid-cols-1 gap-x-4 gap-y-2 text-xs sm:grid-cols-2 xl:grid-cols-3" aria-label="Post colors">
        {series.map(({ key, title }, i) => (
          <li key={key} className="flex items-start gap-2">
            <span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: key === 'other' ? COLORS[5] : COLORS[i] }} />
            <span>{title}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
