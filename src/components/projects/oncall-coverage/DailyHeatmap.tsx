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

// Colors for shift types (single-site models)
const SHIFT_COLORS: Record<string, { bg: string; text: string }> = {
  'day': { bg: 'bg-amber-400 dark:bg-amber-500', text: 'text-white' },
  'night': { bg: 'bg-indigo-500 dark:bg-indigo-600', text: 'text-white' },
};

interface CoverageBlock {
  startHour: number;
  endHour: number;
  key: string | null; // timezone or shift type
  label: string | null;
}

// Determine if a member is day or night shift based on workingHours
function getShiftType(member: TeamMember): 'day' | 'night' | 'rotating' | null {
  const hours = member.workingHours.toLowerCase();
  if (hours.includes('rotating')) return 'rotating'; // Everyone rotates through both
  if (hours.includes('night')) return 'night';
  if (hours.includes('day')) return 'day';
  return null;
}

// For rotating shifts, determine shift by hour (0-12 = night, 12-24 = day)
function getShiftByHour(hour: number): 'day' | 'night' {
  return hour < 12 ? 'night' : 'day';
}

// Group contiguous hours by grouping key (timezone or shift)
function getCoverageBlocks(
  daySlots: CoverageSlot[],
  memberMap: Map<string, { key: string; label: string }>,
  memberIndex: number,
  useRotatingShifts = false
): CoverageBlock[] {
  const blocks: CoverageBlock[] = [];
  let current: CoverageBlock | null = null;

  for (let hour = 0; hour < 24; hour++) {
    const slot = daySlots[hour];
    const memberName = slot?.coveringMembers[memberIndex] || null;

    // For rotating shifts, determine key by hour not by member
    let key: string | null;
    let label: string | null;
    if (useRotatingShifts && memberName) {
      const shift = getShiftByHour(hour);
      key = shift;
      label = shift === 'day' ? 'Day Shift' : 'Night Shift';
    } else {
      const info = memberName ? memberMap.get(memberName) : null;
      key = info?.key || null;
      label = info?.label || null;
    }

    if (current && current.key === key) {
      current.endHour = hour + 1;
    } else {
      if (current) blocks.push(current);
      current = { startHour: hour, endHour: hour + 1, key, label };
    }
  }
  if (current) blocks.push(current);

  return blocks;
}

export function DailyHeatmap({ coverage, team, dayIndex = 1 }: DailyHeatmapProps) {
  // Check if single-site (all same timezone) with shift-based scheduling
  const uniqueTimezones = [...new Set(team.map((m) => m.timezone))];
  const isSingleSite = uniqueTimezones.length === 1;
  const shiftTypes = team.map((m) => getShiftType(m));
  const hasShifts = shiftTypes.some((s) => s !== null);
  const hasRotatingShifts = shiftTypes.some((s) => s === 'rotating');
  const useShiftMode = isSingleSite && hasShifts;

  // Build member map based on mode
  const memberMap = new Map<string, { key: string; label: string }>();
  const legendItems: { key: string; label: string; colors: { bg: string } }[] = [];

  if (useShiftMode) {
    // Shift-based mode (fixed or rotating)
    team.forEach((member) => {
      const shift = getShiftType(member);
      if (shift === 'rotating') {
        // For rotating, member doesn't have fixed shift - will be determined by hour
        memberMap.set(member.name, { key: 'rotating', label: 'Rotating' });
      } else if (shift) {
        const label = shift === 'day' ? 'Day Shift' : 'Night Shift';
        memberMap.set(member.name, { key: shift, label });
      }
    });
    legendItems.push(
      { key: 'day', label: 'Day Shift', colors: SHIFT_COLORS['day'] },
      { key: 'night', label: 'Night Shift', colors: SHIFT_COLORS['night'] }
    );
  } else {
    // Timezone-based mode
    team.forEach((member) => {
      const tz = member.timezone;
      const label = TIMEZONE_LABELS[tz] || tz;
      memberMap.set(member.name, { key: tz, label });
    });
    uniqueTimezones.forEach((tz) => {
      legendItems.push({
        key: tz,
        label: TIMEZONE_LABELS[tz] || tz,
        colors: REGION_COLORS[tz] || { bg: 'bg-zinc-400' },
      });
    });
  }

  const daySlots = coverage[dayIndex] || [];
  const primaryBlocks = getCoverageBlocks(daySlots, memberMap, 0, hasRotatingShifts);
  const secondaryBlocks = getCoverageBlocks(daySlots, memberMap, 1, hasRotatingShifts);

  const getColors = (key: string | null) => {
    if (!key) return null;
    if (useShiftMode) return SHIFT_COLORS[key];
    return REGION_COLORS[key];
  };

  const renderTimeline = (blocks: CoverageBlock[], title: string) => (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
      <div className="relative h-12 bg-zinc-200 dark:bg-zinc-700 rounded-lg overflow-hidden">
        {blocks.map((block, index) => {
          const widthPercent = ((block.endHour - block.startHour) / 24) * 100;
          const leftPercent = (block.startHour / 24) * 100;
          const colors = getColors(block.key);

          return (
            <div
              key={index}
              className={`absolute top-0 bottom-0 flex items-center justify-center ${colors?.bg || 'bg-zinc-300 dark:bg-zinc-600'}`}
              style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
              title={`${block.startHour}:00 - ${block.endHour}:00 UTC\n${block.label || 'No coverage'}`}
            >
              {block.label && (
                <span className={`text-sm font-semibold ${colors?.text || 'text-zinc-500'}`}>
                  {block.label}
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
            {legendItems.map((item) => (
              <div key={item.key} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded ${item.colors.bg}`} />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
