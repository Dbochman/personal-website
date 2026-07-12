import { Pie } from '@/components/dither-kit/pie';
import { PieChart } from '@/components/dither-kit/pie-chart';
import { ditherPatternStyle } from '@/components/dither-kit/dither-pattern';
import type { AreaVariant, ChartConfig } from '@/components/dither-kit/chart-context';
import type { DitherColor } from '@/components/dither-kit/palette';
import { Tooltip } from '@/components/dither-kit/tooltip';

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

interface ChannelStyle {
  color: DitherColor;
  variant: AreaVariant;
}

interface ChannelDatum extends Record<string, unknown>, ChannelStyle {
  key: string;
  label: string;
  value: number;
}

const KNOWN_LABELS: Record<string, string> = {
  direct: 'Direct',
  'organic search': 'Organic Search',
  referral: 'Referral',
  'ai assistant': 'AI Assistant',
  'organic social': 'Organic Social',
  email: 'Email',
  unassigned: 'Unassigned',
};

const KNOWN_STYLES: Record<string, ChannelStyle> = {
  direct: { color: 'blue', variant: 'gradient' },
  'organic search': { color: 'green', variant: 'hatched' },
  referral: { color: 'purple', variant: 'dotted' },
  'ai assistant': { color: 'pink', variant: 'dotted' },
  'organic social': { color: 'orange', variant: 'hatched' },
  email: { color: 'red', variant: 'gradient' },
  unassigned: { color: 'grey', variant: 'dotted' },
};

const FALLBACK_COLORS: readonly DitherColor[] = [
  'purple',
  'green',
  'orange',
  'pink',
  'red',
  'blue',
];

const FALLBACK_VARIANTS: readonly AreaVariant[] = [
  'gradient',
  'dotted',
  'hatched',
  'solid',
];

function safeSessions(value: number) {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function normalizeChannel(channel: string) {
  const cleaned = channel.trim().replace(/\s+/g, ' ');
  const normalized = (cleaned || 'Unknown').toLocaleLowerCase('en-US');
  return {
    normalized,
    label: KNOWN_LABELS[normalized] ?? (cleaned || 'Unknown'),
  };
}

function channelHash(channel: string) {
  let hash = 0;
  for (const character of channel) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }
  return hash;
}

function styleForChannel(channel: string): ChannelStyle {
  const knownStyle = KNOWN_STYLES[channel];
  if (knownStyle) return knownStyle;

  const hash = channelHash(channel);
  return {
    color: FALLBACK_COLORS[hash % FALLBACK_COLORS.length],
    variant: FALLBACK_VARIANTS[
      Math.floor(hash / FALLBACK_COLORS.length) % FALLBACK_VARIANTS.length
    ],
  };
}

function percentage(value: number, total: number) {
  return `${(total > 0 ? (value / total) * 100 : 0).toFixed(1)}%`;
}

export function TrafficSourcesChart({ data }: TrafficSourcesChartProps) {
  if (!data || data.channels.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        No traffic source data available
      </div>
    );
  }

  const aggregatedChannels = new Map<
    string,
    { key: string; label: string; value: number; style: ChannelStyle }
  >();

  for (const channel of data.channels) {
    const { normalized, label } = normalizeChannel(channel.channel);
    const existing = aggregatedChannels.get(normalized);
    if (existing) {
      existing.value += safeSessions(channel.sessions);
    } else {
      aggregatedChannels.set(normalized, {
        key: normalized,
        label,
        value: safeSessions(channel.sessions),
        style: styleForChannel(normalized),
      });
    }
  }

  const rankedChannels = [...aggregatedChannels.values()]
    .filter((channel) => channel.value > 0)
    .sort((left, right) => right.value - left.value || left.label.localeCompare(right.label));

  if (rankedChannels.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        No traffic source data available
      </div>
    );
  }

  const chartData: ChannelDatum[] = rankedChannels.slice(0, 5).map((channel) => ({
    key: channel.key,
    label: channel.label,
    value: channel.value,
    ...channel.style,
  }));
  const otherValue = rankedChannels
    .slice(5)
    .reduce((sum, channel) => sum + channel.value, 0);
  if (otherValue > 0) {
    chartData.push({
      key: '__other__',
      label: 'All other channels',
      value: otherValue,
      color: 'grey',
      variant: 'hatched',
    });
  }

  const total = chartData.reduce((sum, channel) => sum + channel.value, 0);
  const config: ChartConfig = Object.fromEntries(
    chartData.map((channel) => [
      channel.key,
      { label: channel.label, color: channel.color },
    ]),
  );
  const variants = Object.fromEntries(
    chartData.map((channel) => [channel.key, channel.variant]),
  ) as Record<string, AreaVariant>;
  const chartLabel = `Traffic source session distribution for the latest seven-day snapshot: ${chartData
    .map(
      (channel) =>
        `${channel.label}, ${channel.value.toLocaleString()} sessions, ${percentage(channel.value, total)}`,
    )
    .join('; ')}.`;

  return (
    <div className="grid h-72 w-full grid-rows-[10rem_minmax(0,1fr)] items-center gap-2 sm:h-64 sm:grid-cols-[minmax(0,1fr)_minmax(7.5rem,auto)] sm:grid-rows-1 sm:gap-4">
      <div className="h-40 min-w-0 sm:h-52">
        <PieChart
          data={chartData}
          config={config}
          dataKey="value"
          nameKey="key"
          innerRadius={0.56}
          margins={{ top: 8, right: 8, bottom: 8, left: 8 }}
          animationDuration={700}
          bloom="off"
          ariaLabel={chartLabel}
        >
          <Pie variant="gradient" variants={variants} />
          <Tooltip
            valueFormatter={(value) =>
              `${value.toLocaleString()} sessions (${percentage(value, total)})`
            }
          />
        </PieChart>
      </div>

      <ul
        role="list"
        aria-label="Traffic source session totals"
        className="grid max-h-24 min-w-0 grid-cols-2 gap-x-3 gap-y-1 overflow-y-auto text-xs sm:block sm:max-h-56 sm:space-y-2"
      >
        {chartData.map((channel) => (
          <li
            key={channel.key}
            className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2"
          >
            <span className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
              <span
                aria-hidden="true"
                className="size-2.5 shrink-0 rounded-sm"
                style={ditherPatternStyle(channel.color, channel.variant)}
              />
              <span className="break-words leading-tight">{channel.label}</span>
            </span>
            <span className="text-right tabular-nums">
              <span className="block font-medium text-foreground">
                {channel.value.toLocaleString()}
              </span>
              <span className="block text-[10px] text-muted-foreground">
                {percentage(channel.value, total)}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
