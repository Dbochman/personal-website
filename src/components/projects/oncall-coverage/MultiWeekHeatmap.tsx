import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { TeamMember } from './types';

interface MultiWeekHeatmapProps {
  team: TeamMember[];
  weeks: number;
}

// Distinct colors for team members
const MEMBER_COLORS = [
  { bg: 'bg-blue-700', name: 'blue' },
  { bg: 'bg-emerald-700', name: 'emerald' },
  { bg: 'bg-amber-600', name: 'amber' },
  { bg: 'bg-purple-700', name: 'purple' },
  { bg: 'bg-rose-700', name: 'rose' },
  { bg: 'bg-cyan-700', name: 'cyan' },
  { bg: 'bg-orange-700', name: 'orange' },
  { bg: 'bg-indigo-700', name: 'indigo' },
];

export function MultiWeekHeatmap({ team, weeks }: MultiWeekHeatmapProps) {
  const primaryMembers = team.filter((m) => /primary/i.test(m.workingHours));
  const secondaryMembers = team.filter((m) => /secondary/i.test(m.workingHours));
  const showRoles = primaryMembers.length > 0 && secondaryMembers.length > 0;
  const hasSecondaryCoverage = secondaryMembers.length > 0;
  const showSecondaryPlaceholder = !showRoles && !hasSecondaryCoverage;

  // Filter to only active team members (those in the rotation)
  const activeMembers = team.filter(
    (m) =>
      !m.workingHours.toLowerCase().includes('off') &&
      !m.workingHours.toLowerCase().includes('backup')
  );

  // If we have fewer active members than weeks, use team length
  const rotationMembers = activeMembers.length > 0 ? activeMembers : team.slice(0, weeks);

  const memberColorMap = new Map<string, string>();
  team.forEach((member, index) => {
    memberColorMap.set(member.name, MEMBER_COLORS[index % MEMBER_COLORS.length].bg);
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle as="h2" className="text-base">Rotation Cycle ({weeks} Weeks)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {/* Week rows */}
          {Array.from({ length: weeks }, (_, weekIndex) => {
            if (showRoles) {
              const primaryIndex = weekIndex % primaryMembers.length;
              const secondaryIndex = weekIndex % secondaryMembers.length;
              const primaryMember = primaryMembers[primaryIndex];
              const secondaryMember = secondaryMembers[secondaryIndex];
              const primaryColor = memberColorMap.get(primaryMember?.name || '') || 'bg-zinc-300';
              const secondaryColor = memberColorMap.get(secondaryMember?.name || '') || 'bg-zinc-300';
              const primaryName = primaryMember?.name.replace(/\s*\(.*\)/, '') || 'Primary';
              const secondaryName = secondaryMember?.name.replace(/\s*\(.*\)/, '') || 'Secondary';

              return (
                <div key={weekIndex} className="flex items-center gap-3">
                  <div className="w-16 text-xs text-muted-foreground shrink-0">
                    Week {weekIndex + 1}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-16 text-[10px] uppercase text-muted-foreground tracking-wide">
                        Primary
                      </div>
                      <div
                        className={`flex-1 h-7 ${primaryColor} rounded flex items-center px-3`}
                        title={`${primaryName} is primary`}
                      >
                        <span className="text-white text-xs font-medium truncate">
                          {primaryName}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 text-[10px] uppercase text-muted-foreground tracking-wide">
                        Secondary
                      </div>
                      <div
                        className={`flex-1 h-7 ${secondaryColor} rounded flex items-center px-3`}
                        title={`${secondaryName} is secondary`}
                      >
                        <span className="text-white text-xs font-medium truncate">
                          {secondaryName}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            const memberIndex = weekIndex % rotationMembers.length;
            const member = rotationMembers[memberIndex] || team[memberIndex];
            const color = memberColorMap.get(member?.name || '') || 'bg-zinc-300';
            const displayName = member?.name.replace(/\s*\(.*\)/, '') || `Week ${weekIndex + 1}`;

            if (showSecondaryPlaceholder) {
              return (
                <div key={weekIndex} className="flex items-center gap-3">
                  <div className="w-16 text-xs text-muted-foreground shrink-0">
                    Week {weekIndex + 1}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-16 text-[10px] uppercase text-muted-foreground tracking-wide">
                        Primary
                      </div>
                      <div
                        className={`flex-1 h-7 ${color} rounded flex items-center px-3`}
                        title={`${displayName} is on-call`}
                      >
                        <span className="text-white text-xs font-medium truncate">
                          {displayName}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 text-[10px] uppercase text-muted-foreground tracking-wide">
                        Secondary
                      </div>
                      <div
                        className="flex-1 h-7 bg-zinc-200 dark:bg-zinc-800 rounded flex items-center px-3"
                        title="No secondary coverage"
                      >
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                          None
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div key={weekIndex} className="flex items-center gap-3">
                <div className="w-16 text-xs text-muted-foreground shrink-0">
                  Week {weekIndex + 1}
                </div>
                <div
                  className={`flex-1 h-8 ${color} rounded flex items-center px-3`}
                  title={`${displayName} is on-call`}
                >
                  <span className="text-white text-sm font-medium truncate">
                    {displayName}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-3 border-t text-xs">
            {showRoles ? (
              <>
                <span className="text-muted-foreground">Primary rotation:</span>
                {primaryMembers.slice(0, weeks).map((member) => {
                  const color = memberColorMap.get(member.name) || 'bg-zinc-300';
                  const displayName = member.name.replace(/\s*\(.*\)/, '');
                  return (
                    <div key={member.name} className="flex items-center gap-1">
                      <div className={`w-3 h-3 rounded ${color}`} />
                      <span>{displayName}</span>
                    </div>
                  );
                })}
                <span className="text-muted-foreground">Secondary rotation:</span>
                {secondaryMembers.slice(0, weeks).map((member) => {
                  const color = memberColorMap.get(member.name) || 'bg-zinc-300';
                  const displayName = member.name.replace(/\s*\(.*\)/, '');
                  return (
                    <div key={member.name} className="flex items-center gap-1">
                      <div className={`w-3 h-3 rounded ${color}`} />
                      <span>{displayName}</span>
                    </div>
                  );
                })}
              </>
            ) : (
              <>
                <span className="text-muted-foreground">Rotation order:</span>
                {rotationMembers.slice(0, weeks).map((member) => {
                  const color = memberColorMap.get(member.name) || 'bg-zinc-300';
                  const displayName = member.name.replace(/\s*\(.*\)/, '');
                  return (
                    <div key={member.name} className="flex items-center gap-1">
                      <div className={`w-3 h-3 rounded ${color}`} />
                      <span>{displayName}</span>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {/* Info */}
          <p className="text-xs text-muted-foreground pt-2">
            {showRoles
              ? 'Primary and secondary rotations are shown separately for each week.'
              : `Each person is on-call for 1 full week, then off for ${weeks - 1} weeks.
            This creates a sustainable monthly cadence.`}
          </p>
          {showSecondaryPlaceholder && (
            <p className="text-xs text-muted-foreground">
              Secondary coverage: none.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
