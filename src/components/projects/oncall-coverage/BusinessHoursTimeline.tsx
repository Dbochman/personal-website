import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BusinessHoursTimelineProps {
  etPrimaryHours: { start: number; end: number }; // UTC hours when ET is primary
  ptPrimaryHours: { start: number; end: number }; // UTC hours when PT is primary
  overlapHours: { start: number; end: number }; // UTC hours when both coasts overlap
}

// Colors matching DailyHeatmap
const COLORS = {
  et: { bg: 'bg-emerald-500 dark:bg-emerald-600', text: 'text-white' },
  pt: { bg: 'bg-sky-500 dark:bg-sky-600', text: 'text-white' },
  rotating: { bg: 'bg-zinc-400 dark:bg-zinc-600', text: 'text-white' },
};

// Helper to build rich tooltips
function buildTooltip(lines: (string | null | undefined | false)[]): string {
  return lines.filter(Boolean).join('\n');
}

// Convert UTC hour to local time using Intl (handles DST)
function utcToLocal(utcHour: number, timezone: string): string {
  try {
    const date = new Date();
    date.setUTCHours(utcHour % 24, 0, 0, 0);

    const formatter = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: timezone,
    });
    return formatter.format(date);
  } catch {
    return `${(utcHour % 24).toString().padStart(2, '0')}:00`;
  }
}

function utcToET(utcHour: number): string {
  return utcToLocal(utcHour, 'America/New_York');
}

function utcToPT(utcHour: number): string {
  return utcToLocal(utcHour, 'America/Los_Angeles');
}

export function BusinessHoursTimeline({
  etPrimaryHours = { start: 14, end: 19 },
  ptPrimaryHours = { start: 19, end: 25 }, // 25 = 01:00 next day
  overlapHours = { start: 17, end: 22 }, // When both coasts are working
}: BusinessHoursTimelineProps) {
  // Business hours span from ET start to PT end (wrapping midnight)
  const businessStart = etPrimaryHours.start; // 14:00 UTC
  const businessEnd = ptPrimaryHours.end; // 01:00 UTC (25 in 24h+ notation)
  const businessDuration = businessEnd - businessStart; // 11 hours

  // Primary row segments
  const etPrimaryWidth = ((etPrimaryHours.end - etPrimaryHours.start) / businessDuration) * 100;
  const ptPrimaryWidth = ((ptPrimaryHours.end - ptPrimaryHours.start) / businessDuration) * 100;

  // Secondary row segments:
  // 14-17: Rotating (ET only in office)
  // 17-19: PT secondary (overlap, ET primary)
  // 19-22: ET secondary (overlap, PT primary)
  // 22-01: Rotating (PT only in office)
  const etOnlyWidth = ((overlapHours.start - businessStart) / businessDuration) * 100; // 14-17
  const ptSecondaryWidth = ((etPrimaryHours.end - overlapHours.start) / businessDuration) * 100; // 17-19
  const etSecondaryWidth = ((overlapHours.end - etPrimaryHours.end) / businessDuration) * 100; // 19-22
  const ptOnlyWidth = ((businessEnd - overlapHours.end) / businessDuration) * 100; // 22-01

  // Off-hours: 01:00-14:00 UTC = 13 hours
  const offHoursStart = 1;
  const offHoursEnd = 14;

  const formatHour = (h: number) => {
    if (h >= 24) return `0${h - 24}:00`;
    return `${h}:00`;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Daily Coverage Pattern</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Business Hours Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Business Hours</h4>
              <span className="text-xs text-muted-foreground">
                {formatHour(businessStart)} - {formatHour(businessEnd)} UTC
              </span>
            </div>

            {/* Primary Row */}
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Primary</span>
              <div className="relative h-10 rounded-lg overflow-hidden flex">
                <div
                  className={`${COLORS.et.bg} flex items-center justify-center`}
                  style={{ width: `${etPrimaryWidth}%` }}
                  title={buildTooltip([
                    '👤 US East (ET) - Primary',
                    '',
                    `⏰ ${formatHour(etPrimaryHours.start)} - ${formatHour(etPrimaryHours.end)} UTC`,
                    `🏠 ${utcToET(etPrimaryHours.start)} - ${utcToET(etPrimaryHours.end)} ET`,
                    `⏱️ Duration: ${etPrimaryHours.end - etPrimaryHours.start}h`,
                    '',
                    '📋 Handles all incoming incidents',
                  ])}
                >
                  <span className={`text-sm font-semibold ${COLORS.et.text}`}>US East</span>
                </div>
                <div
                  className={`${COLORS.pt.bg} flex items-center justify-center`}
                  style={{ width: `${ptPrimaryWidth}%` }}
                  title={buildTooltip([
                    '👤 US West (PT) - Primary',
                    '',
                    `⏰ ${formatHour(ptPrimaryHours.start)} - ${formatHour(ptPrimaryHours.end > 24 ? ptPrimaryHours.end - 24 : ptPrimaryHours.end)} UTC`,
                    `🏠 ${utcToPT(ptPrimaryHours.start)} - ${utcToPT(ptPrimaryHours.end > 24 ? ptPrimaryHours.end - 24 : ptPrimaryHours.end)} PT`,
                    `⏱️ Duration: ${ptPrimaryHours.end - ptPrimaryHours.start}h`,
                    '',
                    '📋 Handles all incoming incidents',
                  ])}
                >
                  <span className={`text-sm font-semibold ${COLORS.pt.text}`}>US West</span>
                </div>
              </div>
            </div>

            {/* Secondary Row */}
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Secondary</span>
              <div className="relative h-10 rounded-lg overflow-hidden flex">
                {/* 14-17: Rotating (only ET in office) */}
                <div
                  className={`${COLORS.rotating.bg} flex items-center justify-center`}
                  style={{ width: `${etOnlyWidth}%` }}
                  title={buildTooltip([
                    '🔄 Rotating Secondary',
                    '',
                    `⏰ ${formatHour(businessStart)} - ${formatHour(overlapHours.start)} UTC`,
                    `⏱️ Duration: ${overlapHours.start - businessStart}h`,
                    '',
                    '📋 Only ET in office - secondary from on-call rotation',
                  ])}
                >
                  <span className={`text-xs font-medium ${COLORS.rotating.text}`}>Rotating</span>
                </div>
                {/* 17-19: PT secondary */}
                <div
                  className={`${COLORS.pt.bg} flex items-center justify-center`}
                  style={{ width: `${ptSecondaryWidth}%` }}
                  title={buildTooltip([
                    '👥 US West (PT) - Secondary',
                    '',
                    `⏰ ${formatHour(overlapHours.start)} - ${formatHour(etPrimaryHours.end)} UTC`,
                    `🏠 ${utcToPT(overlapHours.start)} - ${utcToPT(etPrimaryHours.end)} PT`,
                    `⏱️ Duration: ${etPrimaryHours.end - overlapHours.start}h`,
                    '',
                    '📋 Escalation backup while ET is primary',
                  ])}
                >
                  <span className={`text-xs font-medium ${COLORS.pt.text}`}>US West</span>
                </div>
                {/* 19-22: ET secondary */}
                <div
                  className={`${COLORS.et.bg} flex items-center justify-center`}
                  style={{ width: `${etSecondaryWidth}%` }}
                  title={buildTooltip([
                    '👥 US East (ET) - Secondary',
                    '',
                    `⏰ ${formatHour(etPrimaryHours.end)} - ${formatHour(overlapHours.end)} UTC`,
                    `🏠 ${utcToET(etPrimaryHours.end)} - ${utcToET(overlapHours.end)} ET`,
                    `⏱️ Duration: ${overlapHours.end - etPrimaryHours.end}h`,
                    '',
                    '📋 Escalation backup while PT is primary',
                  ])}
                >
                  <span className={`text-xs font-medium ${COLORS.et.text}`}>US East</span>
                </div>
                {/* 22-01: Rotating (only PT in office) */}
                <div
                  className={`${COLORS.rotating.bg} flex items-center justify-center`}
                  style={{ width: `${ptOnlyWidth}%` }}
                  title={buildTooltip([
                    '🔄 Rotating Secondary',
                    '',
                    `⏰ ${formatHour(overlapHours.end)} - ${formatHour(businessEnd > 24 ? businessEnd - 24 : businessEnd)} UTC`,
                    `⏱️ Duration: ${businessEnd - overlapHours.end}h`,
                    '',
                    '📋 Only PT in office - secondary from on-call rotation',
                  ])}
                >
                  <span className={`text-xs font-medium ${COLORS.rotating.text}`}>Rotating</span>
                </div>
              </div>
            </div>

            {/* Time labels */}
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatHour(businessStart)}</span>
              <span>{formatHour(overlapHours.start)}</span>
              <span>{formatHour(etPrimaryHours.end)}</span>
              <span>{formatHour(overlapHours.end)}</span>
              <span>{formatHour(businessEnd)}</span>
            </div>
          </div>

          {/* Off-Hours Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Off-Hours</h4>
              <span className="text-xs text-muted-foreground">
                0{offHoursStart}:00 - {offHoursEnd}:00 UTC
              </span>
            </div>
            <div className="relative h-10 rounded-lg overflow-hidden flex">
              <div
                className={`w-full ${COLORS.rotating.bg} flex items-center justify-center`}
                title={buildTooltip([
                  '🔄 Rotating On-Call',
                  '',
                  `⏰ 0${offHoursStart}:00 - ${offHoursEnd}:00 UTC`,
                  `⏱️ Duration: ${offHoursEnd - offHoursStart}h`,
                  '',
                  '👤 Primary only (no secondary coverage)',
                  '🔁 Alternates between ET and PT daily:',
                  '   Mon: PT, Tue: ET, Wed: PT, Thu: ET...',
                  '',
                  '📋 Handles all incidents until business hours resume',
                ])}
              >
                <span className={`text-sm font-semibold ${COLORS.rotating.text}`}>
                  Rotating On-Call (Primary Only)
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Single on-call rotates daily between ET and PT team members
            </p>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 pt-2 border-t text-xs">
            <div className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded ${COLORS.et.bg}`} />
              <span>US East (ET)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded ${COLORS.pt.bg}`} />
              <span>US West (PT)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded ${COLORS.rotating.bg}`} />
              <span>Rotating</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
