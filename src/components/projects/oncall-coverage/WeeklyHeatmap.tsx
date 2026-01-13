import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CoverageSlot, TeamMember } from './types';

interface WeeklyHeatmapProps {
  coverage: CoverageSlot[][];
  team: TeamMember[];
}

// Pastel colors for team members
const MEMBER_COLORS = [
  { bg: 'bg-emerald-200 dark:bg-emerald-800', strip: 'bg-emerald-400 dark:bg-emerald-600', text: 'text-emerald-800 dark:text-emerald-200' },
  { bg: 'bg-rose-200 dark:bg-rose-800', strip: 'bg-rose-400 dark:bg-rose-600', text: 'text-rose-800 dark:text-rose-200' },
  { bg: 'bg-violet-200 dark:bg-violet-800', strip: 'bg-violet-400 dark:bg-violet-600', text: 'text-violet-800 dark:text-violet-200' },
  { bg: 'bg-amber-200 dark:bg-amber-800', strip: 'bg-amber-400 dark:bg-amber-600', text: 'text-amber-800 dark:text-amber-200' },
  { bg: 'bg-sky-200 dark:bg-sky-800', strip: 'bg-sky-400 dark:bg-sky-600', text: 'text-sky-800 dark:text-sky-200' },
  { bg: 'bg-pink-200 dark:bg-pink-800', strip: 'bg-pink-400 dark:bg-pink-600', text: 'text-pink-800 dark:text-pink-200' },
  { bg: 'bg-teal-200 dark:bg-teal-800', strip: 'bg-teal-400 dark:bg-teal-600', text: 'text-teal-800 dark:text-teal-200' },
  { bg: 'bg-orange-200 dark:bg-orange-800', strip: 'bg-orange-400 dark:bg-orange-600', text: 'text-orange-800 dark:text-orange-200' },
];

const DAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function WeeklyHeatmap({ coverage, team }: WeeklyHeatmapProps) {
  // Map members to colors
  const memberColorMap = new Map<string, typeof MEMBER_COLORS[0]>();
  team.forEach((member, index) => {
    memberColorMap.set(member.name, MEMBER_COLORS[index % MEMBER_COLORS.length]);
  });

  const getDisplayName = (name: string) => name.replace(/\s*\(.*\)/, '');

  // Get primary and secondary for each day (find first covered slot)
  const getDayAssignment = (dayIndex: number) => {
    const daySlots = coverage[dayIndex] || [];
    // Find first covered slot in the day
    const coveredSlot = daySlots.find((slot) => slot.covered && slot.coveringMembers.length > 0);
    const primary = coveredSlot?.coveringMembers[0] || null;
    const secondary = coveredSlot?.coveringMembers[1] || null;
    const hasCoverage = !!coveredSlot;
    return { primary, secondary, hasCoverage };
  };

  // Monday first order
  const dayOrder = [1, 2, 3, 4, 5, 6, 0];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Weekly Coverage</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {dayOrder.map((dayIndex) => {
            const { primary, secondary, hasCoverage } = getDayAssignment(dayIndex);
            const primaryColors = primary ? memberColorMap.get(primary) : null;
            const secondaryColors = secondary ? memberColorMap.get(secondary) : null;
            const primaryName = primary ? getDisplayName(primary) : null;
            const secondaryName = secondary ? getDisplayName(secondary) : null;
            const isWeekend = dayIndex === 0 || dayIndex === 6;
            const isPrimaryOnly = hasCoverage && !secondary;

            return (
              <div
                key={dayIndex}
                className={`rounded overflow-hidden flex flex-col ${
                  !hasCoverage ? 'opacity-50' : isPrimaryOnly ? 'opacity-80' : ''
                }`}
                title={`${DAYS_FULL[dayIndex]}${hasCoverage ? `\nPrimary: ${primaryName}${secondaryName ? `\nSecondary: ${secondaryName}` : ' (on-call)'}` : '\nNo coverage'}`}
              >
                {/* Day label */}
                <div className={`text-xs font-medium text-muted-foreground text-center py-1 ${
                  isPrimaryOnly ? 'bg-zinc-200 dark:bg-zinc-700' : 'bg-zinc-100 dark:bg-zinc-800'
                }`}>
                  {DAYS_FULL[dayIndex].slice(0, 3)}
                </div>

                {/* Primary section */}
                <div
                  className={`flex-1 min-h-[60px] ${primaryColors?.bg || 'bg-zinc-200 dark:bg-zinc-700'} flex flex-col items-center justify-center p-2`}
                >
                  <span
                    className={`text-sm font-semibold truncate w-full text-center ${primaryColors?.text || 'text-zinc-500 dark:text-zinc-400'}`}
                  >
                    {hasCoverage ? primaryName : 'No coverage'}
                  </span>
                  {isPrimaryOnly && (
                    <span className="text-xs opacity-75 mt-0.5">on-call</span>
                  )}
                </div>

                {/* Secondary section */}
                {secondaryColors && secondaryName && (
                  <div
                    className={`h-7 ${secondaryColors.strip} flex items-center justify-center px-1`}
                  >
                    <span className="text-xs font-medium text-white dark:text-zinc-900 truncate">
                      {secondaryName}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-4 border-t mt-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="flex flex-col w-4 h-5 rounded overflow-hidden">
              <div className="flex-1 bg-zinc-300 dark:bg-zinc-600" />
              <div className="h-1.5 bg-zinc-500 dark:bg-zinc-400" />
            </div>
            <span className="text-muted-foreground">Primary / Secondary</span>
          </div>
          <div className="h-4 border-l border-zinc-300 dark:border-zinc-600" />
          {team.slice(0, 8).map((member, index) => {
            const colors = MEMBER_COLORS[index % MEMBER_COLORS.length];
            const displayName = getDisplayName(member.name);
            return (
              <div key={member.name} className="flex items-center gap-1">
                <div className={`w-3 h-3 rounded ${colors.bg}`} />
                <span>{displayName}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
