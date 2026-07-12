import { Area } from '@/components/dither-kit/area';
import { AreaChart } from '@/components/dither-kit/area-chart';
import type { AreaVariant, ChartConfig } from '@/components/dither-kit/chart-context';
import { Grid } from '@/components/dither-kit/grid';
import { Legend } from '@/components/dither-kit/legend';
import { ditherPatternStyle } from '@/components/dither-kit/dither-pattern';
import type { DitherColor } from '@/components/dither-kit/palette';
import { Tooltip } from '@/components/dither-kit/tooltip';
import { XAxis } from '@/components/dither-kit/x-axis';
import { YAxis } from '@/components/dither-kit/y-axis';
import type { GA4HistoryEntry } from '../types';
import { formatHistoryDate, getRecentHistory } from './recentHistory';

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

type BlogTrafficRow = Record<string, unknown> & { date: string };

interface SeriesStyle {
  color: DitherColor;
  variant: AreaVariant;
}

interface BlogSeries extends SeriesStyle {
  key: string;
  slug: string | null;
  label: string;
  rank: number | null;
}

interface SeriesSummary extends BlogSeries {
  latest: number;
  peak: number;
  peakDate: string;
}

const SERIES_STYLES: readonly SeriesStyle[] = [
  { color: 'blue', variant: 'gradient' },
  { color: 'purple', variant: 'dotted' },
  { color: 'green', variant: 'hatched' },
  { color: 'orange', variant: 'gradient' },
  { color: 'pink', variant: 'dotted' },
];

const OTHER_STYLE: SeriesStyle = { color: 'grey', variant: 'hatched' };

function safeMetric(value: number) {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function blogSlug(page: string) {
  if (!page.startsWith('/blog/') || page === '/blog/' || page === '/blog') return null;
  return page.replace(/\/$/, '').replace('/blog/', '');
}

export function BlogTrafficChart({ data, postLookups, matchPost }: BlogTrafficChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        No data available
      </div>
    );
  }

  const recentData = getRecentHistory(data, 60);

  if (recentData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        No chart data available
      </div>
    );
  }

  // These are overlapping rolling snapshots, so this score is used only to
  // choose stable leading series. It is not displayed as a traffic total.
  const rankingScoreBySlug = new Map<string, number>();
  for (const entry of recentData) {
    for (const page of entry.topPages ?? []) {
      const slug = blogSlug(page.page);
      const sessions = safeMetric(page.sessions);
      if (!slug || sessions === 0) continue;
      const post = matchPost(slug, postLookups);
      const canonicalSlug = post?.slug ?? slug;
      rankingScoreBySlug.set(
        canonicalSlug,
        (rankingScoreBySlug.get(canonicalSlug) ?? 0) + sessions,
      );
    }
  }

  const topSlugs = [...rankingScoreBySlug.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 5)
    .map(([slug]) => slug);

  if (topSlugs.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        No blog traffic available
      </div>
    );
  }

  const topSlugSet = new Set(topSlugs);
  const series: BlogSeries[] = topSlugs.map((slug, index) => {
    const post = matchPost(slug, postLookups);
    return {
      key: `post-${index + 1}`,
      slug,
      label: post?.title ?? slug,
      rank: index + 1,
      ...SERIES_STYLES[index],
    };
  });

  if ([...rankingScoreBySlug.keys()].some((slug) => !topSlugSet.has(slug))) {
    series.push({
      key: 'other',
      slug: null,
      label: 'Other tracked posts',
      rank: null,
      ...OTHER_STYLE,
    });
  }

  const keyBySlug = new Map(
    series.filter((item) => item.slug).map((item) => [item.slug as string, item.key]),
  );
  const hasOther = series.some((item) => item.key === 'other');

  const chartData: BlogTrafficRow[] = recentData.map((entry) => {
    const row: BlogTrafficRow = { date: formatHistoryDate(entry.date) };
    for (const item of series) row[item.key] = 0;

    for (const page of entry.topPages ?? []) {
      const slug = blogSlug(page.page);
      const sessions = safeMetric(page.sessions);
      if (!slug || sessions === 0) continue;
      const post = matchPost(slug, postLookups);
      const canonicalSlug = post?.slug ?? slug;
      const key = keyBySlug.get(canonicalSlug) ?? (hasOther ? 'other' : null);
      if (key) row[key] = Number(row[key] ?? 0) + sessions;
    }
    return row;
  });

  const latestRow = chartData[chartData.length - 1];
  const summaries: SeriesSummary[] = series.map((item) => {
    let peak = 0;
    let peakDate = chartData[0].date;
    for (const row of chartData) {
      const value = Number(row[item.key] ?? 0);
      if (value > peak) {
        peak = value;
        peakDate = row.date;
      }
    }
    return {
      ...item,
      latest: Number(latestRow[item.key] ?? 0),
      peak,
      peakDate,
    };
  });

  const config: ChartConfig = Object.fromEntries(
    series.map((item) => [item.key, { label: item.label, color: item.color }]),
  );
  const seriesByKey = new Map(series.map((item) => [item.key, item]));
  const chartLabel = `Blog traffic across ${chartData.length} rolling seven-day snapshots from ${chartData[0].date} to ${latestRow.date}. ${summaries
    .map(
      (item) =>
        `${item.label}: latest ${item.latest.toLocaleString()} sessions, high ${item.peak.toLocaleString()} on ${item.peakDate}`,
    )
    .join('; ')}.`;

  return (
    <div className="w-full space-y-3">
      <div className="h-80">
        <AreaChart
          data={chartData}
          config={config}
          stackType="stacked"
          margins={{ top: 48, right: 8, bottom: 24, left: 42 }}
          animationDuration={750}
          bloom="off"
          ariaLabel={chartLabel}
        >
          <Grid />
          <XAxis dataKey="date" maxTicks={6} minTickSpacing={64} />
          <YAxis tickFormatter={(value) => value.toLocaleString()} />
          {series.map((item) => (
            <Area
              key={item.key}
              dataKey={item.key}
              variant={item.variant}
              isClickable
            />
          ))}
          <Legend
            isClickable
            align="center"
            labelFormatter={(name) => {
              const item = seriesByKey.get(name);
              return item?.rank ? `#${item.rank}` : 'Other';
            }}
            ariaLabelFormatter={(_, label) => `Toggle ${label}`}
          />
          <Tooltip
            labelKey="date"
            hideZero
            itemLabelFormatter={(name) => {
              const item = seriesByKey.get(name);
              return item?.rank ? `#${item.rank}` : 'Other';
            }}
            valueFormatter={(value) => `${value.toLocaleString()} sessions`}
          />
        </AreaChart>
      </div>

      <ul
        role="list"
        aria-label="Blog traffic latest and high values"
        className="grid gap-x-5 gap-y-2 text-xs sm:grid-cols-2 xl:grid-cols-3"
      >
        {summaries.map((item) => (
          <li
            key={item.key}
            className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-t border-border/50 pt-2"
          >
            <span className="flex min-w-0 items-center gap-2">
              <span
                aria-hidden="true"
                className="size-2.5 shrink-0 rounded-sm"
                style={ditherPatternStyle(item.color, item.variant)}
              />
              <span className="break-words leading-tight" title={item.label}>
                {item.rank ? `#${item.rank} ` : ''}
                {item.label}
              </span>
            </span>
            <span className="text-right tabular-nums">
              <span className="block font-medium">{item.latest.toLocaleString()} latest</span>
              <span className="block text-muted-foreground">
                {item.peak.toLocaleString()} high
              </span>
            </span>
          </li>
        ))}
      </ul>

      <table className="sr-only">
        <caption>Rolling seven-day blog traffic snapshots</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            {series.map((item) => (
              <th key={item.key} scope="col">
                {item.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {chartData.map((row, index) => (
            <tr key={`${row.date}-${index}`}>
              <td>{row.date}</td>
              {series.map((item) => (
                <td key={item.key}>{Number(row[item.key] ?? 0)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
