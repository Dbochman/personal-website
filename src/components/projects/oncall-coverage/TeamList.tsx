import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { TeamMember } from './types';
import { REGION_COLORS } from './types';

interface TeamListProps {
  team: TeamMember[];
}

export function TeamList({ team }: TeamListProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Sample Team</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {team.map((member, index) => {
            const color = REGION_COLORS[member.region];
            return (
              <div
                key={index}
                className="flex items-center gap-3 p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900/50"
              >
                {/* Region indicator */}
                <div
                  className={`w-2 h-8 rounded-full ${color.bg}`}
                  title={member.region}
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

        {/* Region legend */}
        <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t text-xs text-muted-foreground">
          {Object.entries(REGION_COLORS).map(([region, color]) => {
            const hasRegion = team.some((m) => m.region === region);
            if (!hasRegion) return null;
            return (
              <div key={region} className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${color.bg}`} />
                <span>{region}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
