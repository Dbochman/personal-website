import { PieChart } from '@/components/dither-kit/pie-chart';
import { Pie } from '@/components/dither-kit/pie';
import { Tooltip } from '@/components/dither-kit/tooltip';
import { ditherPatternStyle } from '@/components/dither-kit/dither-pattern';
import type { AreaVariant, ChartConfig } from '@/components/dither-kit/chart-context';
import type { DitherColor } from '@/components/dither-kit/palette';

interface DeviceData {
  device: string;
  sessions: number;
  users: number;
}

interface DeviceBreakdownChartProps {
  data: DeviceData[];
}

interface DeviceStyle {
  color: DitherColor;
  variant: AreaVariant;
}

interface ChartDevice extends Record<string, unknown> {
  key: string;
  label: string;
  value: number;
  style: DeviceStyle;
}

const DEVICE_STYLES: Record<string, DeviceStyle> = {
  desktop: { color: 'blue', variant: 'gradient' },
  mobile: { color: 'purple', variant: 'dotted' },
  tablet: { color: 'orange', variant: 'hatched' },
};

const FALLBACK_COLORS: readonly DitherColor[] = [
  'green',
  'pink',
  'red',
  'blue',
  'purple',
  'orange',
];

const FALLBACK_VARIANTS: readonly AreaVariant[] = [
  'hatched',
  'dotted',
  'gradient',
  'solid',
];

function deviceHash(device: string) {
  let hash = 0;
  for (const character of device) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }
  return hash;
}

function styleForDevice(device: string): DeviceStyle {
  const normalizedDevice = device.trim().toLowerCase();
  const knownStyle = DEVICE_STYLES[normalizedDevice];
  if (knownStyle) return knownStyle;

  const hash = deviceHash(normalizedDevice || 'unknown');
  return {
    color: FALLBACK_COLORS[hash % FALLBACK_COLORS.length],
    variant: FALLBACK_VARIANTS[Math.floor(hash / FALLBACK_COLORS.length) % FALLBACK_VARIANTS.length],
  };
}

function deviceLabel(device: string) {
  const normalizedDevice = device.trim().replace(/[_-]+/g, ' ');
  if (!normalizedDevice) return 'Unknown';

  return normalizedDevice.replace(/(^|\s)\S/g, (character) => character.toUpperCase());
}

function percentage(value: number, total: number) {
  return `${(total > 0 ? (value / total) * 100 : 0).toFixed(1)}%`;
}

function safeSessions(value: number) {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

export function DeviceBreakdownChart({ data }: DeviceBreakdownChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        No data available
      </div>
    );
  }

  const devicesByLabel = new Map<string, ChartDevice>();
  for (const device of data) {
    const label = deviceLabel(device.device);
    const existingDevice = devicesByLabel.get(label);
    if (existingDevice) {
      existingDevice.value += safeSessions(device.sessions);
      continue;
    }

    devicesByLabel.set(label, {
      key: label,
      label,
      value: safeSessions(device.sessions),
      style: styleForDevice(label),
    });
  }
  const chartData = Array.from(devicesByLabel.values());

  const total = chartData.reduce((sum, device) => sum + device.value, 0);
  const config: ChartConfig = Object.fromEntries(
    chartData.map((device) => [
      device.key,
      { label: device.label, color: device.style.color },
    ]),
  );
  const variants = Object.fromEntries(
    chartData.map((device) => [device.key, device.style.variant]),
  ) as Record<string, AreaVariant>;
  const chartLabel = `Device session distribution: ${chartData
    .map((device) => `${device.label}, ${device.value.toLocaleString()} sessions, ${percentage(device.value, total)}`)
    .join('; ')}.`;

  return (
    <div className="grid h-64 w-full grid-rows-[10rem_minmax(0,1fr)] items-center gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(7.5rem,auto)] sm:grid-rows-1 sm:gap-4">
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
            valueFormatter={(value) => `${value.toLocaleString()} sessions (${percentage(value, total)})`}
          />
        </PieChart>
      </div>

      <ul
        role="list"
        aria-label="Device session totals"
        className="grid max-h-20 min-w-0 grid-cols-1 gap-1 overflow-y-auto text-sm sm:block sm:max-h-56 sm:space-y-3"
      >
        {chartData.map((device) => (
          <li key={device.key} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
            <span className="flex min-w-0 items-center gap-2 text-muted-foreground">
              <span
                aria-hidden="true"
                className="size-2.5 shrink-0 rounded-sm"
                style={ditherPatternStyle(device.style.color, device.style.variant)}
              />
              <span className="truncate">{device.label}</span>
            </span>
            <span className="text-right tabular-nums">
              <span className="font-medium text-foreground sm:block">
                {device.value.toLocaleString()}
              </span>
              <span className="ml-1 text-xs text-muted-foreground sm:ml-0 sm:block">
                {percentage(device.value, total)}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
