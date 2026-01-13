import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CoverageSlot, TeamMember } from './types';

interface DailyHeatmapProps {
  coverage: CoverageSlot[][];
  team: TeamMember[];
  dayIndex?: number; // 0=Sun, 1=Mon, etc. Default to Monday
}

// Colors for regions/timezones
const REGION_COLORS: Record<string, { bg: string; text: string }> = {
  'Asia/Tokyo': { bg: 'bg-violet-400 dark:bg-violet-600', text: 'text-white' },
  'Asia/Singapore': { bg: 'bg-violet-400 dark:bg-violet-600', text: 'text-white' },
  'Asia/Shanghai': { bg: 'bg-violet-400 dark:bg-violet-600', text: 'text-white' },
  'Europe/London': { bg: 'bg-rose-400 dark:bg-rose-600', text: 'text-white' },
  'Europe/Paris': { bg: 'bg-rose-400 dark:bg-rose-600', text: 'text-white' },
  'Europe/Berlin': { bg: 'bg-rose-400 dark:bg-rose-600', text: 'text-white' },
  'America/New_York': { bg: 'bg-emerald-500 dark:bg-emerald-600', text: 'text-white' },
  'America/Los_Angeles': { bg: 'bg-emerald-500 dark:bg-emerald-600', text: 'text-white' },
  'America/Chicago': { bg: 'bg-emerald-500 dark:bg-emerald-600', text: 'text-white' },
};

const TIMEZONE_LABELS: Record<string, string> = {
  'Asia/Tokyo': 'APAC (Tokyo)',
  'Asia/Singapore': 'APAC (Singapore)',
  'Asia/Shanghai': 'APAC (Shanghai)',
  'Europe/London': 'EU (London)',
  'Europe/Paris': 'EU (Paris)',
  'Europe/Berlin': 'EU (Berlin)',
  'America/New_York': 'US (New York)',
  'America/Los_Angeles': 'US (Los Angeles)',
  'America/Chicago': 'US (Chicago)',
};

interface RegionBlock {
  startHour: number;
  endHour: number;
  timezone: string | null;
}

// Group contiguous hours by member's timezone (for primary or secondary)
function getRegionBlocks(
  daySlots: CoverageSlot[],
  memberTimezoneMap: Map<string, string>,
  memberIndex: number // 0 = primary, 1 = secondary
): RegionBlock[] {
  const blocks: RegionBlock[] = [];
  let current: RegionBlock | null = null;

  for (let hour = 0; hour < 24; hour++) {
    const slot = daySlots[hour];
    const member = slot?.coveringMembers[memberIndex] || null;
    const timezone = member ? memberTimezoneMap.get(member) || null : null;

    if (current && current.timezone === timezone) {
      current.endHour = hour + 1;
    } else {
      if (current) blocks.push(current);
      current = { startHour: hour, endHour: hour + 1, timezone };
    }
  }
  if (current) blocks.push(current);

  return blocks;
}

export function DailyHeatmap({ coverage, team, dayIndex = 1 }: DailyHeatmapProps) {
  // Map members to their timezones
  const memberTimezoneMap = new Map<string, string>();
  const uniqueTimezones: string[] = [];

  team.forEach((member) => {
    memberTimezoneMap.set(member.name, member.timezone);
    if (!uniqueTimezones.includes(member.timezone)) {
      uniqueTimezones.push(member.timezone);
    }
  });

  const daySlots = coverage[dayIndex] || [];
  const primaryBlocks = getRegionBlocks(daySlots, memberTimezoneMap, 0);
  const secondaryBlocks = getRegionBlocks(daySlots, memberTimezoneMap, 1);

  const renderTimeline = (blocks: RegionBlock[], title: string) => (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
      <div className="relative h-12 bg-zinc-200 dark:bg-zinc-700 rounded-lg overflow-hidden">
        {blocks.map((block, index) => {
          const widthPercent = ((block.endHour - block.startHour) / 24) * 100;
          const leftPercent = (block.startHour / 24) * 100;
          const colors = block.timezone ? REGION_COLORS[block.timezone] : null;
          const label = block.timezone ? TIMEZONE_LABELS[block.timezone] : null;

          return (
            <div
              key={index}
              className={`absolute top-0 bottom-0 flex items-center justify-center ${colors?.bg || 'bg-zinc-300 dark:bg-zinc-600'}`}
              style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
              title={`${block.startHour}:00 - ${block.endHour}:00 UTC\n${label || 'No coverage'}`}
            >
              {label && (
                <span className={`text-sm font-semibold ${colors?.text || 'text-zinc-500'}`}>
                  {label}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Daily Coverage (24 Hours UTC)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Primary Coverage */}
          {renderTimeline(primaryBlocks, 'Primary')}

          {/* Secondary Coverage */}
          {renderTimeline(secondaryBlocks, 'Secondary')}

          {/* Hour labels */}
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0:00</span>
            <span>6:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>24:00</span>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 pt-2 border-t text-xs">
            {uniqueTimezones.map((tz) => {
              const colors = REGION_COLORS[tz];
              const label = TIMEZONE_LABELS[tz];
              return (
                <div key={tz} className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 rounded ${colors?.bg}`} />
                  <span>{label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
