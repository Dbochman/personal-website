import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MEMBER_COLORS } from './types';
import type { TeamMember } from './types';

interface MonthlyHeatmapProps {
  team: TeamMember[];
  rotationWeeks?: number;
  rotationType?: 'weekly' | 'daily' | 'shift';
}

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAYS_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Helper to build rich tooltips
function buildTooltip(lines: (string | null | undefined | false)[]): string {
  return lines.filter(Boolean).join('\n');
}

// Get timezone label for a team member
function getTimezoneShort(member: TeamMember): string {
  if (member.timezone.includes('New_York')) return 'ET';
  if (member.timezone.includes('Los_Angeles')) return 'PT';
  if (member.timezone.includes('Chicago')) return 'CT';
  if (member.timezone.includes('London')) return 'GMT';
  if (member.timezone.includes('Tokyo')) return 'JST';
  if (member.timezone.includes('Singapore') || member.timezone.includes('Shanghai')) return 'SGT';
  return member.region;
}

export function MonthlyHeatmap({ team, rotationWeeks, rotationType = 'weekly' }: MonthlyHeatmapProps) {
  // Filter to active rotation members (not backup/off)
  const activeMembers = team.filter(
    (m) =>
      !m.workingHours.toLowerCase().includes('backup') &&
      m.hoursPerWeek > 0
  );

  // Use rotation weeks or team size for cycle length
  const cycleLength = rotationWeeks || activeMembers.length || 8;
  const rotationMembers = activeMembers.length > 0 ? activeMembers : team.slice(0, cycleLength);

  // Map members to colors by index
  const getMemberColor = (memberIndex: number) => {
    return MEMBER_COLORS[memberIndex % MEMBER_COLORS.length];
  };

  const getDisplayName = (name: string) => name.replace(/\s*\(.*\)/, '');

  // Check if shift model is regional (EU/US split) vs rotating
  const uniqueTimezones = [...new Set(rotationMembers.map((m) => m.timezone))];
  const isRegionalShift = rotationType === 'shift' && uniqueTimezones.length > 1;

  // For regional shifts, split by region (supports EU/US or APAC/US)
  const euMembers = rotationMembers.filter((m) => m.region === 'EU');
  const apacMembers = rotationMembers.filter((m) => m.region === 'APAC');
  const usMembers = rotationMembers.filter((m) => m.region === 'US');
  const dayShiftMembers = euMembers.length > 0 ? euMembers : apacMembers;

  // Generate 30 days of coverage based on rotation type
  const days = Array.from({ length: 30 }, (_, dayIndex) => {
    const dayOfWeek = dayIndex % 7; // 0=Mon, 1=Tue, ..., 5=Sat, 6=Sun
    const isWeekend = dayOfWeek >= 5;

    if (rotationType === 'shift') {
      if (isRegionalShift && dayShiftMembers.length > 0 && usMembers.length > 0) {
        // Regional shift: APAC/EU covers first 12h, US covers second 12h
        const dayPrimaryIdx = dayIndex % dayShiftMembers.length;
        const dayBackupIdx = (dayIndex + Math.floor(dayShiftMembers.length / 2)) % dayShiftMembers.length;
        const usPrimaryIndex = dayIndex % usMembers.length;
        const usBackupIndex = (dayIndex + Math.floor(usMembers.length / 2)) % usMembers.length;

        // Find color indices in full rotation members list
        const dayPrimaryColorIndex = rotationMembers.indexOf(dayShiftMembers[dayPrimaryIdx]);
        const usPrimaryColorIndex = rotationMembers.indexOf(usMembers[usPrimaryIndex]);

        return {
          dayNumber: dayIndex + 1,
          dayOfWeek,
          // Day shift = APAC or EU team
          dayPrimary: dayShiftMembers[dayPrimaryIdx],
          dayPrimaryColorIndex: dayPrimaryColorIndex,
          dayBackup: dayShiftMembers[dayBackupIdx],
          dayBackupColorIndex: rotationMembers.indexOf(dayShiftMembers[dayBackupIdx]),
          // Evening/Night shift = US team
          nightPrimary: usMembers[usPrimaryIndex],
          nightPrimaryColorIndex: usPrimaryColorIndex,
          nightBackup: usMembers[usBackupIndex],
          nightBackupColorIndex: rotationMembers.indexOf(usMembers[usBackupIndex]),
          isWeekend,
          isShift: true as const,
          isDaily: false as const,
          isRegional: true as const,
        };
      }

      // Rotating shift: everyone cycles through both day and night
      const dayPrimaryIndex = dayIndex % rotationMembers.length;
      const dayBackupIndex = (dayIndex + 3) % rotationMembers.length;
      const nightPrimaryIndex = (dayIndex + 6) % rotationMembers.length;
      const nightBackupIndex = (dayIndex + 9) % rotationMembers.length;

      return {
        dayNumber: dayIndex + 1,
        dayOfWeek,
        // Day shift
        dayPrimary: rotationMembers[dayPrimaryIndex],
        dayPrimaryColorIndex: dayPrimaryIndex,
        dayBackup: rotationMembers[dayBackupIndex],
        dayBackupColorIndex: dayBackupIndex,
        // Night shift
        nightPrimary: rotationMembers[nightPrimaryIndex],
        nightPrimaryColorIndex: nightPrimaryIndex,
        nightBackup: rotationMembers[nightBackupIndex],
        nightBackupColorIndex: nightBackupIndex,
        isWeekend,
        isShift: true as const,
        isDaily: false as const,
        isRegional: false as const,
      };
    }

    if (rotationType === 'daily') {
      // Daily rotation - rotates through all team members
      const primaryIndex = dayIndex % rotationMembers.length;
      // Secondary is offset (different person)
      const secondaryIndex = (dayIndex + Math.floor(rotationMembers.length / 2)) % rotationMembers.length;
      // Weekends: primary only (no secondary)
      const hasSecondary = !isWeekend;

      return {
        dayNumber: dayIndex + 1,
        dayOfWeek,
        primary: rotationMembers[primaryIndex],
        primaryColorIndex: primaryIndex,
        secondary: hasSecondary ? rotationMembers[secondaryIndex] : null,
        secondaryColorIndex: hasSecondary ? secondaryIndex : -1,
        isWeekend,
        isShift: false as const,
        isDaily: true as const,
        hasCoverage: true, // 24/7 coverage
      };
    }

    // Weekly rotation (default)
    const weekNumber = Math.floor(dayIndex / 7);
    const primaryIndex = weekNumber % rotationMembers.length;
    const secondaryIndex = (primaryIndex + 1) % rotationMembers.length;

    return {
      dayNumber: dayIndex + 1,
      dayOfWeek,
      primary: rotationMembers[primaryIndex],
      primaryColorIndex: primaryIndex,
      secondary: rotationMembers[secondaryIndex],
      secondaryColorIndex: secondaryIndex,
      isWeekend,
      isShift: false as const,
      isDaily: false as const,
    };
  });

  // Split into weeks for calendar grid (5 rows of 7 days, with some empty at end)
  const weeks: (typeof days[0] | null)[][] = [];
  for (let i = 0; i < 5; i++) {
    const week: (typeof days[0] | null)[] = [];
    for (let j = 0; j < 7; j++) {
      const dayIndex = i * 7 + j;
      week.push(dayIndex < 30 ? days[dayIndex] : null);
    }
    weeks.push(week);
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle as="h2" className="text-base">Monthly Coverage (30 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {/* Day of week headers */}
          <div className="grid grid-cols-7 gap-1">
            {DAYS_OF_WEEK.map((day) => (
              <div
                key={day}
                className="text-xs font-medium text-muted-foreground text-center py-1"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="space-y-1">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="grid grid-cols-7 gap-1">
                {week.map((day, dayIndex) => {
                  if (!day) {
                    return (
                      <div
                        key={dayIndex}
                        className="aspect-square rounded bg-zinc-100 dark:bg-zinc-800/30"
                      />
                    );
                  }

                  // Shift-based rendering (day/night)
                  if (day.isShift) {
                    const dayColors = getMemberColor(day.dayPrimaryColorIndex);
                    const nightColors = getMemberColor(day.nightPrimaryColorIndex);
                    const dayName = getDisplayName(day.dayPrimary.name);
                    const nightName = getDisplayName(day.nightPrimary.name);
                    const dayTz = getTimezoneShort(day.dayPrimary);
                    const nightTz = getTimezoneShort(day.nightPrimary);

                    const shiftTooltip = buildTooltip([
                      `📅 ${DAYS_FULL[day.dayOfWeek]} (Day ${day.dayNumber})`,
                      day.isWeekend && '🗓️ Weekend',
                      '',
                      `☀️ Day Shift (12h)`,
                      `   Primary: ${dayName} (${dayTz})`,
                      day.dayBackup && `   Backup: ${getDisplayName(day.dayBackup.name)}`,
                      '',
                      `🌙 Night Shift (12h)`,
                      `   Primary: ${nightName} (${nightTz})`,
                      day.nightBackup && `   Backup: ${getDisplayName(day.nightBackup.name)}`,
                    ]);

                    return (
                      <div
                        key={dayIndex}
                        className={`aspect-square rounded overflow-hidden flex flex-col ${
                          day.isWeekend ? 'opacity-80' : ''
                        }`}
                        title={shiftTooltip}
                      >
                        {/* Day number */}
                        <div className="text-[10px] text-muted-foreground text-center bg-zinc-100 dark:bg-zinc-800/50 py-0.5">
                          {day.dayNumber}
                        </div>
                        {/* Day shift - top half */}
                        <div
                          className={`flex-1 ${dayColors.bg} flex items-center justify-center`}
                          title={`☀️ Day Shift: ${dayName} (${dayTz})`}
                        >
                          <span className={`text-[10px] font-semibold ${dayColors.text} truncate px-0.5`}>
                            {dayName}
                          </span>
                        </div>
                        {/* Night shift - bottom half */}
                        <div
                          className={`flex-1 ${nightColors.strip} flex items-center justify-center`}
                          title={`🌙 Night Shift: ${nightName} (${nightTz})`}
                        >
                          <span className="text-[10px] font-semibold text-white dark:text-zinc-900 truncate px-0.5">
                            {nightName}
                          </span>
                        </div>
                      </div>
                    );
                  }

                  // Daily rotation with weekend gaps
                  if (day.isDaily && !day.hasCoverage) {
                    return (
                      <div
                        key={dayIndex}
                        className="aspect-square rounded overflow-hidden flex flex-col opacity-50"
                        title={`Day ${day.dayNumber}\nNo coverage (weekend)`}
                      >
                        <div className="flex-1 bg-zinc-200 dark:bg-zinc-700 flex flex-col items-center justify-center p-1">
                          <span className="text-xs text-muted-foreground leading-tight">
                            {day.dayNumber}
                          </span>
                          <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                            Off
                          </span>
                        </div>
                      </div>
                    );
                  }

                  // Weekly/Daily rotation rendering (primary/secondary)
                  const primaryColors = day.primary ? getMemberColor(day.primaryColorIndex) : null;
                  const secondaryColors = day.secondary ? getMemberColor(day.secondaryColorIndex) : null;
                  const primaryName = day.primary ? getDisplayName(day.primary.name) : 'None';
                  const secondaryName = day.secondary ? getDisplayName(day.secondary.name) : null;
                  const primaryTz = day.primary ? getTimezoneShort(day.primary) : '';
                  const secondaryTz = day.secondary ? getTimezoneShort(day.secondary) : '';
                  const weekNum = Math.floor((day.dayNumber - 1) / 7) + 1;

                  const rotationTooltip = buildTooltip([
                    `📅 ${DAYS_FULL[day.dayOfWeek]} (Day ${day.dayNumber})`,
                    rotationType === 'weekly' && `📆 Week ${weekNum} of ${cycleLength}`,
                    day.isWeekend && '🗓️ Weekend',
                    '',
                    `👤 Primary: ${primaryName}${primaryTz ? ` (${primaryTz})` : ''}`,
                    day.primary?.workingHours && `   ${day.primary.workingHours}`,
                    secondaryName && '',
                    secondaryName && `👥 Secondary: ${secondaryName}${secondaryTz ? ` (${secondaryTz})` : ''}`,
                    day.secondary?.workingHours && `   ${day.secondary.workingHours}`,
                    '',
                    rotationType === 'weekly' ? '⏱️ 24/7 coverage for the week' : '⏱️ 24h shift',
                  ]);

                  return (
                    <div
                      key={dayIndex}
                      className={`aspect-square rounded overflow-hidden flex flex-col ${
                        day.isWeekend ? 'opacity-80' : ''
                      }`}
                      title={rotationTooltip}
                    >
                      {/* Primary section - main cell */}
                      <div
                        className={`flex-1 ${primaryColors?.bg || 'bg-zinc-200 dark:bg-zinc-700'} flex flex-col items-center justify-center p-1`}
                      >
                        <span className="text-xs text-muted-foreground leading-tight">
                          {day.dayNumber}
                        </span>
                        <span
                          className={`text-xs font-semibold truncate w-full text-center leading-tight ${primaryColors?.text || 'text-zinc-600'}`}
                        >
                          {primaryName}
                        </span>
                      </div>

                      {/* Secondary section - bottom strip */}
                      {secondaryColors && secondaryName && (
                        <div
                          className={`h-6 ${secondaryColors.strip} flex items-center justify-center px-1`}
                          title={`👥 Secondary: ${secondaryName}${secondaryTz ? ` (${secondaryTz})` : ''}`}
                        >
                          <span className="text-[11px] font-medium text-white dark:text-zinc-900 truncate">
                            {secondaryName}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-3 border-t text-xs">
            {rotationType === 'shift' ? (
              <div className="flex items-center gap-2">
                <div className="flex flex-col w-4 h-4 rounded overflow-hidden">
                  <div className="flex-1 bg-zinc-300 dark:bg-zinc-600" />
                  <div className="flex-1 bg-zinc-500 dark:bg-zinc-400" />
                </div>
                <span className="text-muted-foreground">
                  {isRegionalShift
                    ? apacMembers.length > 0
                      ? 'APAC / US'
                      : 'EU / US'
                    : 'Day / Night'}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex flex-col w-4 h-4 rounded overflow-hidden">
                  <div className="flex-1 bg-zinc-300 dark:bg-zinc-600" />
                  <div className="h-1 bg-zinc-500 dark:bg-zinc-400" />
                </div>
                <span className="text-muted-foreground">Primary / Secondary</span>
              </div>
            )}
            <div className="h-4 border-l border-zinc-300 dark:border-zinc-600" />
            {rotationMembers.map((member, index) => {
              const colors = getMemberColor(index);
              const displayName = getDisplayName(member.name);
              return (
                <div key={member.name} className="flex items-center gap-1">
                  <div className={`w-3 h-3 rounded ${colors.bg}`} />
                  <span>{displayName}</span>
                </div>
              );
            })}
          </div>

          {/* Cycle info */}
          <p className="text-xs text-muted-foreground pt-1">
            {rotationType === 'shift'
              ? isRegionalShift
                ? apacMembers.length > 0
                  ? `${apacMembers.length} APAC + ${usMembers.length} US. APAC covers 02-14 UTC (daytime Tokyo), US covers 14-02 UTC (daytime LA). Each region rotates within their shift.`
                  : `${euMembers.length} EU + ${usMembers.length} US. EU covers daytime, US covers evening/night. Each region rotates within their shift.`
                : `${rotationMembers.length}-person rotation. Each person cycles through both day and night shifts over ${rotationMembers.length} days.`
              : rotationType === 'daily'
                ? `${rotationMembers.length}-person daily rotation. Primary 24/7, Secondary during business hours only (weekdays).`
                : `${cycleLength}-week rotation. Secondary shadows primary before taking over the next week.`}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
