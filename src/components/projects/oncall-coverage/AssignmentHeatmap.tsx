import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CoverageSlot, TeamMember } from './types';

interface AssignmentHeatmapProps {
  coverage: CoverageSlot[][];
  team: TeamMember[];
}

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// PagerDuty-style colors: light pastel bg with matching darker text
const MEMBER_COLORS = [
  { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-400' },
  { bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-700 dark:text-rose-400', border: 'border-rose-400' },
  { bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-700 dark:text-violet-400', border: 'border-violet-400' },
  { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-400' },
  { bg: 'bg-sky-100 dark:bg-sky-900/30', text: 'text-sky-700 dark:text-sky-400', border: 'border-sky-400' },
  { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-700 dark:text-pink-400', border: 'border-pink-400' },
  { bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-700 dark:text-teal-400', border: 'border-teal-400' },
  { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', border: 'border-orange-400' },
];

interface TimeBlock {
  dayIndex: number;
  startHour: number;
  endHour: number;
  isPrimary: boolean;
}

// Get all time blocks for a person across the entire week
function getPersonWeekBlocks(
  coverage: CoverageSlot[][],
  personName: string
): TimeBlock[] {
  const blocks: TimeBlock[] = [];

  for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
    const daySlots = coverage[dayIndex] || [];
    let current: TimeBlock | null = null;

    for (let hour = 0; hour < 24; hour++) {
      const slot = daySlots[hour];
      const members = slot?.coveringMembers || [];
      const isPrimary = members[0] === personName;
      const isSecondary = members.slice(1).includes(personName);
      const isOnCall = isPrimary || isSecondary;

      if (isOnCall) {
        if (current && current.isPrimary === isPrimary) {
          current.endHour = hour + 1;
        } else {
          if (current) blocks.push(current);
          current = {
            dayIndex,
            startHour: hour,
            endHour: hour + 1,
            isPrimary,
          };
        }
      } else {
        if (current) {
          blocks.push(current);
          current = null;
        }
      }
    }
    if (current) blocks.push(current);
  }

  return blocks;
}

// Get people who have any on-call time during the week
function getActivePeople(coverage: CoverageSlot[][]): string[] {
  const people = new Set<string>();
  for (const day of coverage) {
    for (const slot of day) {
      for (const member of slot.coveringMembers) {
        people.add(member);
      }
    }
  }
  return Array.from(people);
}

export function AssignmentHeatmap({ coverage, team }: AssignmentHeatmapProps) {
  // Map member names to colors based on team order
  const memberColorMap = new Map<string, typeof MEMBER_COLORS[0]>();
  team.forEach((member, index) => {
    memberColorMap.set(member.name, MEMBER_COLORS[index % MEMBER_COLORS.length]);
  });

  const getDisplayName = (name: string) => name.replace(/\s*\(.*\)/, '');

  const activePeople = getActivePeople(coverage);

  // Reorder Monday first: [1,2,3,4,5,6,0]
  const dayOrder = [1, 2, 3, 4, 5, 6, 0];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle as="h2" className="text-base">Who's On-Call</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {/* Day labels header */}
          <div className="flex">
            <div className="w-28 shrink-0" />
            <div className="flex-1 flex">
              {dayOrder.map((dayIndex) => (
                <div
                  key={dayIndex}
                  className="flex-1 text-xs text-muted-foreground text-center font-medium"
                >
                  {DAYS_SHORT[dayIndex]}
                </div>
              ))}
            </div>
          </div>

          {/* Person swimlanes */}
          {activePeople.map((person) => {
            const blocks = getPersonWeekBlocks(coverage, person);
            const colors = memberColorMap.get(person);
            const displayName = getDisplayName(person);

            return (
              <div key={person} className="flex items-center gap-2">
                {/* Person name label */}
                <div className="w-28 shrink-0 text-sm font-medium truncate text-right pr-2">
                  {displayName}
                </div>

                {/* Week timeline */}
                <div className="flex-1 flex h-10 relative">
                  {/* Day grid lines */}
                  {dayOrder.map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 border-l border-zinc-200 dark:border-zinc-700 first:border-l-0"
                    />
                  ))}

                  {/* Time blocks */}
                  {blocks.map((block, blockIndex) => {
                    // Calculate position within the week
                    // Convert dayIndex to position (Mon=0, Tue=1, ... Sun=6)
                    const dayPosition = block.dayIndex === 0 ? 6 : block.dayIndex - 1;
                    const dayWidthPercent = 100 / 7;
                    const leftPercent =
                      dayPosition * dayWidthPercent +
                      (block.startHour / 24) * dayWidthPercent;
                    const widthPercent =
                      ((block.endHour - block.startHour) / 24) * dayWidthPercent;

                    return (
                      <div
                        key={blockIndex}
                        className={`absolute top-1 bottom-1 rounded flex items-center px-1 overflow-hidden ${
                          block.isPrimary
                            ? `${colors?.bg || 'bg-zinc-200'}`
                            : `border-2 ${colors?.border || 'border-zinc-400'} bg-transparent`
                        }`}
                        style={{
                          left: `${leftPercent}%`,
                          width: `${widthPercent}%`,
                          minWidth: '2px',
                        }}
                        title={`${displayName} - ${block.isPrimary ? 'Primary' : 'Secondary'}\n${DAYS_SHORT[block.dayIndex]} ${block.startHour}:00 - ${block.endHour}:00 UTC`}
                      >
                        {widthPercent > 8 && (
                          <span
                            className={`text-xs font-semibold truncate ${
                              block.isPrimary
                                ? colors?.text || 'text-zinc-700'
                                : colors?.text || 'text-zinc-600'
                            }`}
                          >
                            {displayName}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-4 text-xs border-t mt-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-4 bg-zinc-200 dark:bg-zinc-700 rounded" />
              <span className="text-muted-foreground">Primary</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-4 border-2 border-zinc-400 rounded bg-transparent" />
              <span className="text-muted-foreground">Secondary</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
