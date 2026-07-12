import { DitherBarList, type DitherBarDatum } from '@/components/dither-kit/bar-list';
import type { AreaVariant } from '@/components/dither-kit/chart-context';
import type { DitherColor } from '@/components/dither-kit/palette';

interface TagData {
  tag: string;
  sessions: number;
}

interface BlogTagBreakdownChartProps {
  tagData: TagData[];
}

interface TagStyle {
  color: DitherColor;
  variant: AreaVariant;
}

const TAG_STYLES: readonly TagStyle[] = [
  { color: 'blue', variant: 'gradient' },
  { color: 'purple', variant: 'dotted' },
  { color: 'orange', variant: 'hatched' },
  { color: 'pink', variant: 'dotted' },
  { color: 'red', variant: 'hatched' },
  { color: 'grey', variant: 'dotted' },
  { color: 'blue', variant: 'dotted' },
  { color: 'purple', variant: 'hatched' },
  { color: 'orange', variant: 'dotted' },
  { color: 'grey', variant: 'hatched' },
];

function safeSessions(value: number) {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

export function BlogTagBreakdownChart({ tagData }: BlogTagBreakdownChartProps) {
  const sessionsByTag = new Map<string, number>();
  for (const row of tagData) {
    const tag = row.tag.trim();
    if (!tag) continue;
    sessionsByTag.set(tag, (sessionsByTag.get(tag) ?? 0) + safeSessions(row.sessions));
  }

  const rankedTags = [...sessionsByTag.entries()]
    .map(([tag, sessions]) => ({ tag, sessions }))
    .filter((row) => row.sessions > 0)
    .sort((left, right) => right.sessions - left.sessions || left.tag.localeCompare(right.tag))
    .slice(0, 10);

  if (rankedTags.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        No tag data available
      </div>
    );
  }

  const bars: DitherBarDatum[] = rankedTags.map((row, index) => ({
    key: row.tag,
    label: `#${index + 1} ${row.tag}`,
    value: row.sessions,
    ...TAG_STYLES[index],
  }));

  return (
    <div className="w-full space-y-3">
      <DitherBarList
        data={bars}
        ariaLabel="Latest seven-day blog sessions by tag"
        valueFormatter={(value) => `${value.toLocaleString()} sessions`}
      />
      <p className="text-xs text-muted-foreground">
        A post can contribute its sessions to more than one tag.
      </p>
    </div>
  );
}
