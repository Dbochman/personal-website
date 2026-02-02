import { useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CoverageSlot, TeamMember } from './types';

interface DailyHeatmapProps {
  coverage: CoverageSlot[][];
  team: TeamMember[];
  dayIndex?: number; // 0=Sun, 1=Mon, etc. Default to Monday
}

// Colors for regions/timezones (using darker shades for WCAG AA contrast with white text)
const REGION_COLORS: Record<string, { bg: string; text: string }> = {
  'Asia/Tokyo': { bg: 'bg-violet-600 dark:bg-violet-600', text: 'text-white' },
  'Asia/Singapore': { bg: 'bg-violet-600 dark:bg-violet-600', text: 'text-white' },
  'Asia/Shanghai': { bg: 'bg-violet-600 dark:bg-violet-600', text: 'text-white' },
  'Europe/London': { bg: 'bg-rose-600 dark:bg-rose-600', text: 'text-white' },
  'Europe/Paris': { bg: 'bg-rose-600 dark:bg-rose-600', text: 'text-white' },
  'Europe/Berlin': { bg: 'bg-rose-600 dark:bg-rose-600', text: 'text-white' },
  'America/New_York': { bg: 'bg-emerald-700 dark:bg-emerald-600', text: 'text-white' },
  'America/Los_Angeles': { bg: 'bg-sky-600 dark:bg-sky-600', text: 'text-white' },
  'America/Chicago': { bg: 'bg-emerald-700 dark:bg-emerald-600', text: 'text-white' },
};

const TIMEZONE_LABELS: Record<string, string> = {
  'Asia/Tokyo': 'APAC (Tokyo)',
  'Asia/Singapore': 'APAC (Singapore)',
  'Asia/Shanghai': 'APAC (Shanghai)',
  'Europe/London': 'EU (London)',
  'Europe/Paris': 'EU (Paris)',
  'Europe/Berlin': 'EU (Berlin)',
  'America/New_York': 'US East (ET)',
  'America/Los_Angeles': 'US West (PT)',
  'America/Chicago': 'US Central (CT)',
};

// Colors for shift types (single-site models) - using darker shades for WCAG AA contrast
const SHIFT_COLORS: Record<string, { bg: string; text: string }> = {
  'day': { bg: 'bg-amber-600 dark:bg-amber-600', text: 'text-white' },
  'night': { bg: 'bg-indigo-600 dark:bg-indigo-600', text: 'text-white' },
};

// Helper to format hour with padding
function formatHour(h: number): string {
  return `${h.toString().padStart(2, '0')}:00`;
}

// Module-level cache for DateTimeFormat instances (expensive to create)
const dateTimeFormatCache = new Map<string, Intl.DateTimeFormat>();

function getDateTimeFormatter(timezone: string): Intl.DateTimeFormat {
  if (!dateTimeFormatCache.has(timezone)) {
    dateTimeFormatCache.set(
      timezone,
      new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: timezone,
      })
    );
  }
  return dateTimeFormatCache.get(timezone)!;
}

// Helper to convert UTC hour to local time string using Intl (handles DST)
function utcToLocal(utcHour: number, timezone: string): string {
  try {
    // Create a date at the given UTC hour (use a recent date for accurate DST)
    const date = new Date();
    date.setUTCHours(utcHour, 0, 0, 0);

    const formatter = getDateTimeFormatter(timezone);
    return formatter.format(date);
  } catch {
    // Fallback if timezone is invalid
    return formatHour(utcHour);
  }
}

// Get short timezone label
function getTimezoneLabel(timezone: string): string {
  const labels: Record<string, string> = {
    'America/New_York': 'ET',
    'America/Los_Angeles': 'PT',
    'America/Chicago': 'CT',
    'Europe/London': 'GMT',
    'Europe/Paris': 'CET',
    'Europe/Berlin': 'CET',
    'Asia/Tokyo': 'JST',
    'Asia/Singapore': 'SGT',
    'Asia/Shanghai': 'CST',
  };
  return labels[timezone] || timezone.split('/').pop() || '';
}

// Helper to build rich tooltips
function buildTooltip(lines: (string | null | undefined | false)[]): string {
  return lines.filter(Boolean).join('\n');
}

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
  if (hours.includes('night shift')) return 'night';
  if (hours.includes('day shift')) return 'day';
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
  // Memoize shift detection to avoid recalculating on every render
  const { uniqueTimezones, hasRotatingShifts, useShiftMode } = useMemo(() => {
    const timezones = [...new Set(team.map((m) => m.timezone))];
    const singleSite = timezones.length === 1;
    const shiftTypes = team.map((m) => getShiftType(m));
    const shifts = shiftTypes.some((s) => s !== null);
    const rotating = shiftTypes.some((s) => s === 'rotating');
    return {
      uniqueTimezones: timezones,
      hasRotatingShifts: rotating,
      useShiftMode: singleSite && shifts,
    };
  }, [team]);

  // Memoize memberMap and legendItems computation
  const { memberMap, legendItems } = useMemo(() => {
    const map = new Map<string, { key: string; label: string }>();
    const items: { key: string; label: string; colors: { bg: string } }[] = [];

    if (useShiftMode) {
      // Shift-based mode (fixed or rotating)
      team.forEach((member) => {
        const shift = getShiftType(member);
        if (shift === 'rotating') {
          // For rotating, member doesn't have fixed shift - will be determined by hour
          map.set(member.name, { key: 'rotating', label: 'Rotating' });
        } else if (shift) {
          const label = shift === 'day' ? 'Day Shift' : 'Night Shift';
          map.set(member.name, { key: shift, label });
        }
      });
      items.push(
        { key: 'day', label: 'Day Shift', colors: SHIFT_COLORS['day'] },
        { key: 'night', label: 'Night Shift', colors: SHIFT_COLORS['night'] }
      );
    } else {
      // Timezone-based mode
      team.forEach((member) => {
        const tz = member.timezone;
        const label = TIMEZONE_LABELS[tz] || tz;
        map.set(member.name, { key: tz, label });
      });
      uniqueTimezones.forEach((tz) => {
        items.push({
          key: tz,
          label: TIMEZONE_LABELS[tz] || tz,
          colors: REGION_COLORS[tz] || { bg: 'bg-zinc-400' },
        });
      });
    }

    return { memberMap: map, legendItems: items };
  }, [team, useShiftMode, uniqueTimezones]);

  // Memoize coverage blocks computation
  const { primaryBlocks, secondaryBlocks } = useMemo(() => {
    const slots = coverage[dayIndex] || [];
    return {
      primaryBlocks: getCoverageBlocks(slots, memberMap, 0, useShiftMode && hasRotatingShifts),
      secondaryBlocks: getCoverageBlocks(slots, memberMap, 1, useShiftMode && hasRotatingShifts),
    };
  }, [coverage, dayIndex, memberMap, useShiftMode, hasRotatingShifts]);

  // Memoize getColors callback
  const getColors = useCallback(
    (key: string | null) => {
      if (!key) return null;
      if (useShiftMode) return SHIFT_COLORS[key];
      return REGION_COLORS[key];
    },
    [useShiftMode]
  );

  // Memoize renderTimeline to prevent unnecessary re-renders
  const renderTimeline = useCallback(
    (blocks: CoverageBlock[], title: string) => (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      <div className="relative h-12 bg-zinc-200 dark:bg-zinc-700 rounded-lg overflow-hidden">
        {blocks.map((block, index) => {
          const widthPercent = ((block.endHour - block.startHour) / 24) * 100;
          const leftPercent = (block.startHour / 24) * 100;
          const colors = getColors(block.key);
          // Only show label for blocks wider than 20% (~5 hours)
          const showLabel = block.label && widthPercent >= 20;
          const duration = block.endHour - block.startHour;

          // Build local time conversions if we have a timezone key
          const hasTimezone = block.key && !['day', 'night', 'rotating'].includes(block.key);
          const localStart = hasTimezone && block.key ? utcToLocal(block.startHour, block.key) : null;
          const localEnd = hasTimezone && block.key ? utcToLocal(block.endHour % 24, block.key) : null;
          const tzLabel = hasTimezone && block.key ? getTimezoneLabel(block.key) : null;

          const tooltip = buildTooltip([
            `⏰ ${formatHour(block.startHour)} - ${formatHour(block.endHour)} UTC`,
            localStart && localEnd && tzLabel && `🏠 ${localStart} - ${localEnd} ${tzLabel}`,
            `⏱️ Duration: ${duration}h`,
            '',
            block.label ? `👤 ${block.label}` : '⚠️ No coverage',
            title === 'Primary' && '   Handles all incoming incidents',
            title === 'Secondary' && '   Escalation backup for primary',
          ]);

          return (
            <div
              key={index}
              className={`absolute top-0 bottom-0 flex items-center justify-center ${colors?.bg || 'bg-zinc-300 dark:bg-zinc-600'}`}
              style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
              title={tooltip}
            >
              {showLabel && (
                <span className={`text-sm font-semibold ${colors?.text || 'text-zinc-500'} truncate px-1`}>
                  {block.label}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
    ),
    [getColors]
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle as="h2" className="text-base">Daily Coverage (24 Hours UTC)</CardTitle>
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
