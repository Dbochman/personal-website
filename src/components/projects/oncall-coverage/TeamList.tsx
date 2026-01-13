import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { TeamMember } from './types';
import { MEMBER_COLORS, REGION_COLORS, TIMEZONE_LABELS } from './types';

interface TeamListProps {
  team: TeamMember[];
}

// Timezone-based colors (matches DailyHeatmap)
const TIMEZONE_COLORS: Record<string, { bg: string }> = {
  'America/New_York': { bg: 'bg-emerald-500 dark:bg-emerald-600' },
  'America/Los_Angeles': { bg: 'bg-sky-500 dark:bg-sky-600' },
  'America/Chicago': { bg: 'bg-emerald-500 dark:bg-emerald-600' },
  'Europe/London': { bg: 'bg-rose-400 dark:bg-rose-600' },
  'Asia/Tokyo': { bg: 'bg-violet-400 dark:bg-violet-600' },
};

export function TeamList({ team }: TeamListProps) {
  // Determine coloring mode based on team composition
  const isSingleRegion = team.every((m) => m.region === 'Single');
  const uniqueTimezones = [...new Set(team.map((m) => m.timezone))];
  const isUSOnly = team.every((m) => m.region === 'US') && uniqueTimezones.length > 1;

  // Get color for a team member based on mode
  const getMemberColor = (member: TeamMember, index: number): string => {
    if (isSingleRegion) {
      return MEMBER_COLORS[index % MEMBER_COLORS.length].strip;
    }
    if (isUSOnly) {
      return TIMEZONE_COLORS[member.timezone]?.bg || REGION_COLORS[member.region].bg;
    }
    return REGION_COLORS[member.region].bg;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Sample Team</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {team.map((member, index) => {
            const colorClass = getMemberColor(member, index);
            const tzLabel = TIMEZONE_LABELS[member.timezone] || member.region;
            return (
              <div
                key={index}
                className="flex items-center gap-3 p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900/50"
              >
                {/* Color indicator */}
                <div
                  className={`w-2 h-8 rounded-full ${colorClass}`}
                  title={tzLabel}
                />

                {/* Name and schedule */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{member.name}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {member.workingHours}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex gap-4 text-xs text-muted-foreground shrink-0">
                  <span title="Hours per week">{member.hoursPerWeek}h/wk</span>
                  {member.nightHours > 0 && (
                    <span
                      className="text-amber-600 dark:text-amber-400"
                      title="Night hours"
                    >
                      {member.nightHours}h nights
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t text-xs text-muted-foreground">
          {isSingleRegion ? (
            <span>Time Zone Agnostic</span>
          ) : isUSOnly ? (
            // Show US East / Central / West based on what timezones are present
            <>
              {uniqueTimezones.includes('America/New_York') && (
                <div className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 rounded ${TIMEZONE_COLORS['America/New_York'].bg}`} />
                  <span>US East</span>
                </div>
              )}
              {uniqueTimezones.includes('America/Chicago') && (
                <div className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 rounded ${TIMEZONE_COLORS['America/Chicago'].bg}`} />
                  <span>US Central</span>
                </div>
              )}
              {uniqueTimezones.includes('America/Los_Angeles') && (
                <div className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 rounded ${TIMEZONE_COLORS['America/Los_Angeles'].bg}`} />
                  <span>US West</span>
                </div>
              )}
            </>
          ) : (
            // Show regions with their colors
            uniqueTimezones.map((tz) => {
              const member = team.find((m) => m.timezone === tz);
              if (!member) return null;
              const color = REGION_COLORS[member.region];
              const label = TIMEZONE_LABELS[tz] || member.region;
              return (
                <div key={tz} className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 rounded ${color.bg}`} />
                  <span>{label}</span>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
