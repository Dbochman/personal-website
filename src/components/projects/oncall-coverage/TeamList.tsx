import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { TeamMember } from './types';
import { REGION_COLORS, TIMEZONE_LABELS } from './types';

interface TeamListProps {
  team: TeamMember[];
}

export function TeamList({ team }: TeamListProps) {
  // Get unique timezones from team
  const uniqueTimezones = [...new Set(team.map((m) => m.timezone))];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Sample Team</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {team.map((member, index) => {
            const color = REGION_COLORS[member.region];
            const tzLabel = TIMEZONE_LABELS[member.timezone] || member.region;
            return (
              <div
                key={index}
                className="flex items-center gap-3 p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900/50"
              >
                {/* Region indicator */}
                <div
                  className={`w-2 h-8 rounded-full ${color.bg}`}
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

        {/* Region legend with specific cities */}
        <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t text-xs text-muted-foreground">
          {uniqueTimezones.map((tz) => {
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
          })}
        </div>
      </CardContent>
    </Card>
  );
}
