import type { CoverageModel, CoverageSlot } from './types';

// Helper to create a full week of coverage slots
function createWeekCoverage(
  pattern: (day: number, hour: number) => { covered: boolean; members: string[] }
): CoverageSlot[][] {
  const week: CoverageSlot[][] = [];
  for (let day = 0; day < 7; day++) {
    const daySlots: CoverageSlot[] = [];
    for (let hour = 0; hour < 24; hour++) {
      const { covered, members } = pattern(day, hour);
      daySlots.push({
        hourUtc: hour,
        dayOfWeek: day,
        covered,
        coveringMembers: members,
      });
    }
    week.push(daySlots);
  }
  return week;
}

function pickByDay(members: string[], day: number, offset = 0): string {
  return members[(day + offset) % members.length];
}

// Model 1: Follow-the-Sun (3 Regions) - The healthiest option
const followTheSun: CoverageModel = {
  id: 'follow-the-sun',
  name: 'Follow-the-Sun (3 Regions)',
  description: 'Three regional teams hand off coverage during business hours. Zero night shifts - the healthiest model for distributed teams.',
  rotationType: 'daily',
  team: [
    // US Region - 2 people in New York timezone
    { name: 'Alex (US)', timezone: 'America/New_York', region: 'US', workingHours: '9am-5pm ET (14-22 UTC)', hoursPerWeek: 20, nightHours: 0, weekendHours: 4 },
    { name: 'Jordan (US)', timezone: 'America/New_York', region: 'US', workingHours: '9am-5pm ET (14-22 UTC)', hoursPerWeek: 20, nightHours: 0, weekendHours: 4 },
    // EU Region - 2 people in London timezone
    { name: 'Emma (EU)', timezone: 'Europe/London', region: 'EU', workingHours: '9am-5pm GMT (9-17 UTC)', hoursPerWeek: 20, nightHours: 0, weekendHours: 4 },
    { name: 'Liam (EU)', timezone: 'Europe/London', region: 'EU', workingHours: '9am-5pm GMT (9-17 UTC)', hoursPerWeek: 20, nightHours: 0, weekendHours: 4 },
    // APAC Region - 2 people in Tokyo timezone
    { name: 'Yuki (APAC)', timezone: 'Asia/Tokyo', region: 'APAC', workingHours: '9am-5pm JST (0-8 UTC)', hoursPerWeek: 20, nightHours: 0, weekendHours: 4 },
    { name: 'Hana (APAC)', timezone: 'Asia/Tokyo', region: 'APAC', workingHours: '9am-5pm JST (0-8 UTC)', hoursPerWeek: 20, nightHours: 0, weekendHours: 4 },
  ],
  coverage: createWeekCoverage((day, hour) => {
    const isWeekday = day >= 1 && day <= 5;
    const apac = ['Yuki (APAC)', 'Hana (APAC)'];
    const eu = ['Emma (EU)', 'Liam (EU)'];
    const us = ['Alex (US)', 'Jordan (US)'];

    // Pick primary and secondary within each region (rotate by day)
    const apacPrimary = pickByDay(apac, day);
    const apacSecondary = pickByDay(apac, day, 1);
    const euPrimary = pickByDay(eu, day);
    const euSecondary = pickByDay(eu, day, 1);
    const usPrimary = pickByDay(us, day);
    const usSecondary = pickByDay(us, day, 1);

    // UTC coverage with overlaps for handoffs:
    // APAC: 0-8 UTC (9am-5pm JST)
    // EU: 9-17 UTC (9am-5pm GMT)
    // US: 14-22 UTC (9am-5pm ET)

    if (hour >= 0 && hour < 8) {
      // APAC shift: 0-8 UTC
      return { covered: true, members: [apacPrimary, apacSecondary] };
    }
    if (hour === 8) {
      // APAC/EU handoff hour
      return { covered: true, members: [apacPrimary, euPrimary] };
    }
    if (hour >= 9 && hour < 14) {
      // EU shift: 9-14 UTC (before US overlap)
      return { covered: true, members: [euPrimary, euSecondary] };
    }
    if (hour >= 14 && hour < 17) {
      // EU/US overlap: 14-17 UTC
      return { covered: true, members: [euPrimary, usPrimary] };
    }
    if (hour >= 17 && hour < 22) {
      // US shift: 17-22 UTC (after EU overlap)
      return { covered: true, members: [usPrimary, usSecondary] };
    }
    if (hour >= 22 && hour < 24) {
      // US/APAC handoff: 22-24 UTC
      return { covered: true, members: [usPrimary, apacPrimary] };
    }

    // Weekends - rotate through all team members
    if (!isWeekday) {
      const allMembers = [...apac, ...eu, ...us];
      const weekendPrimary = pickByDay(allMembers, day);
      const weekendSecondary = pickByDay(allMembers, day, 1);
      return { covered: true, members: [weekendPrimary, weekendSecondary] };
    }

    return { covered: false, members: [] };
  }),
  metrics: {
    coveragePercent: 100,
    nightHoursPerPerson: 0,
    weekendHoursPerPerson: 8,
    hoursPerWeekPerPerson: 28,
    teamSize: 6,
    shiftLength: '8h',
    rotation: 'Daily handoffs between regions',
    onCallFrequency: 'Every other day (within region)',
    handoffsPerWeek: 21,
  },
  tradeoffs: {
    pros: [
      'Zero night shifts - everyone works business hours only',
      'Fastest response - always someone awake and alert',
      'Most sustainable for long-term team health',
      'Natural overlap windows enable smooth handoffs',
      'Primary + secondary redundancy within each shift',
    ],
    cons: [
      'Requires distributed team across 3 time zones',
      'More handoffs (3/day) increases coordination needs',
      'Weekend coverage rotated across all members',
      'Communication overhead across regions',
    ],
  },
};

// Model 2: Weekly Rotation (24/7) - With primary + secondary
const weeklyRotation: CoverageModel = {
  id: 'weekly-rotation',
  name: 'Weekly Rotation (8-person)',
  description: 'Primary + secondary each week, rotating through 8 team members. Secondary provides escalation backup and shadows before becoming primary.',
  rotationType: 'weekly',
  rotationWeeks: 8,
  team: [
    { name: 'Alex', timezone: 'America/New_York', region: 'Single', workingHours: 'Week 1 Primary, Week 8 Secondary', hoursPerWeek: 42, nightHours: 14, weekendHours: 12 },
    { name: 'Jordan', timezone: 'America/New_York', region: 'Single', workingHours: 'Week 2 Primary, Week 1 Secondary', hoursPerWeek: 42, nightHours: 14, weekendHours: 12 },
    { name: 'Taylor', timezone: 'America/New_York', region: 'Single', workingHours: 'Week 3 Primary, Week 2 Secondary', hoursPerWeek: 42, nightHours: 14, weekendHours: 12 },
    { name: 'Morgan', timezone: 'America/New_York', region: 'Single', workingHours: 'Week 4 Primary, Week 3 Secondary', hoursPerWeek: 42, nightHours: 14, weekendHours: 12 },
    { name: 'Casey', timezone: 'America/New_York', region: 'Single', workingHours: 'Week 5 Primary, Week 4 Secondary', hoursPerWeek: 42, nightHours: 14, weekendHours: 12 },
    { name: 'Riley', timezone: 'America/New_York', region: 'Single', workingHours: 'Week 6 Primary, Week 5 Secondary', hoursPerWeek: 42, nightHours: 14, weekendHours: 12 },
    { name: 'Quinn', timezone: 'America/New_York', region: 'Single', workingHours: 'Week 7 Primary, Week 6 Secondary', hoursPerWeek: 42, nightHours: 14, weekendHours: 12 },
    { name: 'Avery', timezone: 'America/New_York', region: 'Single', workingHours: 'Week 8 Primary, Week 7 Secondary', hoursPerWeek: 42, nightHours: 14, weekendHours: 12 },
  ],
  // This week: Alex is primary, Jordan is secondary
  coverage: createWeekCoverage(() => ({ covered: true, members: ['Alex', 'Jordan'] })),
  metrics: {
    coveragePercent: 100,
    nightHoursPerPerson: 14, // 56h nights × 2 roles / 8 people
    weekendHoursPerPerson: 12, // 48h weekend × 2 roles / 8 people
    hoursPerWeekPerPerson: 42, // 168h × 2 roles / 8 people
    teamSize: 8,
    shiftLength: '168h (full week)',
    rotation: 'Weekly (Primary + Secondary)',
    onCallFrequency: '1 week primary + 1 week secondary every 8 weeks',
    handoffsPerWeek: 1,
  },
  tradeoffs: {
    pros: [
      'Built-in escalation path for complex incidents',
      'Secondary shadows before becoming primary',
      'Clear accountability with safety net',
      'Only 1 handoff/week minimizes miscommunication',
    ],
    cons: [
      'Two people committed each week (primary + secondary)',
      'On-call week includes nights and weekends',
      'Higher total burden than single-person rotation',
      'Requires clear primary vs secondary responsibilities',
    ],
  },
};

// Model 3: 12-Hour Shifts - US/EU split for natural day/night coverage
const twelveHourShifts: CoverageModel = {
  id: '12-hour-shifts',
  name: '12-Hour Shifts (US/EU)',
  description: 'Two 12-hour shifts with US team covering their daytime (12-00 UTC) and EU team covering theirs (00-12 UTC). Each region works business-adjacent hours.',
  rotationType: 'shift',
  team: [
    // US team (New York) - covers 12:00-00:00 UTC (7am-7pm ET)
    { name: 'Alex (US)', timezone: 'America/New_York', region: 'US', workingHours: 'Day shift 7am-7pm ET', hoursPerWeek: 28, nightHours: 0, weekendHours: 4 },
    { name: 'Jordan (US)', timezone: 'America/New_York', region: 'US', workingHours: 'Day shift 7am-7pm ET', hoursPerWeek: 28, nightHours: 0, weekendHours: 4 },
    { name: 'Taylor (US)', timezone: 'America/New_York', region: 'US', workingHours: 'Day shift 7am-7pm ET', hoursPerWeek: 28, nightHours: 0, weekendHours: 4 },
    { name: 'Morgan (US)', timezone: 'America/New_York', region: 'US', workingHours: 'Day shift 7am-7pm ET', hoursPerWeek: 28, nightHours: 0, weekendHours: 4 },
    { name: 'Sam (US)', timezone: 'America/New_York', region: 'US', workingHours: 'Day shift 7am-7pm ET', hoursPerWeek: 28, nightHours: 0, weekendHours: 4 },
    { name: 'Jamie (US)', timezone: 'America/New_York', region: 'US', workingHours: 'Day shift 7am-7pm ET', hoursPerWeek: 28, nightHours: 0, weekendHours: 4 },
    // EU team (London) - covers 00:00-12:00 UTC (midnight-noon GMT, or 7am-7pm in winter)
    { name: 'Emma (EU)', timezone: 'Europe/London', region: 'EU', workingHours: 'Day shift 7am-7pm GMT', hoursPerWeek: 28, nightHours: 0, weekendHours: 4 },
    { name: 'Liam (EU)', timezone: 'Europe/London', region: 'EU', workingHours: 'Day shift 7am-7pm GMT', hoursPerWeek: 28, nightHours: 0, weekendHours: 4 },
    { name: 'Oliver (EU)', timezone: 'Europe/London', region: 'EU', workingHours: 'Day shift 7am-7pm GMT', hoursPerWeek: 28, nightHours: 0, weekendHours: 4 },
    { name: 'Sophie (EU)', timezone: 'Europe/London', region: 'EU', workingHours: 'Day shift 7am-7pm GMT', hoursPerWeek: 28, nightHours: 0, weekendHours: 4 },
    { name: 'Noah (EU)', timezone: 'Europe/London', region: 'EU', workingHours: 'Day shift 7am-7pm GMT', hoursPerWeek: 28, nightHours: 0, weekendHours: 4 },
    { name: 'Isla (EU)', timezone: 'Europe/London', region: 'EU', workingHours: 'Day shift 7am-7pm GMT', hoursPerWeek: 28, nightHours: 0, weekendHours: 4 },
  ],
  coverage: createWeekCoverage((day, hour) => {
    // US shift: 12-00 UTC (7am-7pm ET) - "day" shift
    // EU shift: 00-12 UTC (midnight-noon GMT, ~7am-7pm local) - "night" shift label but daytime for EU
    const usTeam = ['Alex (US)', 'Jordan (US)', 'Taylor (US)', 'Morgan (US)', 'Sam (US)', 'Jamie (US)'];
    const euTeam = ['Emma (EU)', 'Liam (EU)', 'Oliver (EU)', 'Sophie (EU)', 'Noah (EU)', 'Isla (EU)'];

    if (hour >= 0 && hour < 12) {
      // EU shift: 00-12 UTC
      const primary = pickByDay(euTeam, day);
      const backup = pickByDay(euTeam, day, 3);
      return { covered: true, members: [primary, backup] };
    }
    // US shift: 12-00 UTC
    const primary = pickByDay(usTeam, day);
    const backup = pickByDay(usTeam, day, 3);
    return { covered: true, members: [primary, backup] };
  }),
  metrics: {
    coveragePercent: 100,
    nightHoursPerPerson: 0, // No one works nights in their local time
    weekendHoursPerPerson: 4, // Weekend duty distributed across all 12
    hoursPerWeekPerPerson: 28, // 168h × 2 roles / 12 people
    teamSize: 12,
    shiftLength: '12h',
    rotation: 'Regional day shifts with rotating primary/backup',
    onCallFrequency: '~2 shifts/week within region',
    handoffsPerWeek: 14, // 2/day × 7 days
  },
  tradeoffs: {
    pros: [
      'Zero night shifts - each region works their daytime',
      '12h shifts balance continuity vs. fatigue',
      'Larger pool (12 people) absorbs PTO and sick days',
      'Primary + backup ensures escalation path',
    ],
    cons: [
      'Requires teams in both US and EU timezones',
      'Larger team size required (12 people)',
      'Handoff coordination between regions twice daily',
      'Weekend coverage still required from both regions',
    ],
  },
};

// Model 4: US Business Hours + On-Call - 24/7 with enhanced business hours
const businessHoursOnly: CoverageModel = {
  id: 'business-hours',
  name: 'US Business Hours + On-Call',
  description: '24/7 coverage with Primary + Secondary during US business hours (9am ET - 5pm PT), Primary only for nights and weekends.',
  rotationType: 'daily',
  team: [
    // East Coast (New York) - covers 9am-5pm ET = 14:00-22:00 UTC
    { name: 'Alex (ET)', timezone: 'America/New_York', region: 'US', workingHours: '9am-5pm ET + on-call rotation', hoursPerWeek: 28, nightHours: 10, weekendHours: 8 },
    { name: 'Jordan (ET)', timezone: 'America/New_York', region: 'US', workingHours: '9am-5pm ET + on-call rotation', hoursPerWeek: 28, nightHours: 10, weekendHours: 8 },
    { name: 'Taylor (ET)', timezone: 'America/New_York', region: 'US', workingHours: '9am-5pm ET + on-call rotation', hoursPerWeek: 28, nightHours: 10, weekendHours: 8 },
    // West Coast (Los Angeles) - covers 9am-5pm PT = 17:00-01:00 UTC
    { name: 'Morgan (PT)', timezone: 'America/Los_Angeles', region: 'US', workingHours: '9am-5pm PT + on-call rotation', hoursPerWeek: 28, nightHours: 10, weekendHours: 8 },
    { name: 'Casey (PT)', timezone: 'America/Los_Angeles', region: 'US', workingHours: '9am-5pm PT + on-call rotation', hoursPerWeek: 28, nightHours: 10, weekendHours: 8 },
    { name: 'Riley (PT)', timezone: 'America/Los_Angeles', region: 'US', workingHours: '9am-5pm PT + on-call rotation', hoursPerWeek: 28, nightHours: 10, weekendHours: 8 },
  ],
  coverage: createWeekCoverage((day, hour) => {
    const isWeekday = day >= 1 && day <= 5;
    const etTeam = ['Alex (ET)', 'Jordan (ET)', 'Taylor (ET)'];
    const ptTeam = ['Morgan (PT)', 'Casey (PT)', 'Riley (PT)'];
    const allTeam = [...etTeam, ...ptTeam];

    const etPrimary = etTeam[day % etTeam.length];
    const ptPrimary = ptTeam[day % ptTeam.length];
    const onCallPrimary = allTeam[day % allTeam.length];

    // Business hours: 9am ET - 5pm PT = 14:00-01:00 UTC
    const isBusinessHours = isWeekday && (hour >= 14 || hour < 1);

    if (isBusinessHours) {
      if (hour >= 14 && hour < 17) {
        // ET only: 9am-12pm ET (before PT starts)
        return { covered: true, members: [etPrimary, onCallPrimary !== etPrimary ? onCallPrimary : ptPrimary] };
      }
      if (hour >= 17 && hour < 22) {
        // Overlap: ET primary, PT secondary
        return { covered: true, members: [etPrimary, ptPrimary] };
      }
      if (hour >= 22 || hour < 1) {
        // PT primary, with secondary
        return { covered: true, members: [ptPrimary, onCallPrimary !== ptPrimary ? onCallPrimary : etPrimary] };
      }
    }

    // Off-hours: Primary only (nights 01:00-14:00 UTC weekdays, all weekend)
    return { covered: true, members: [onCallPrimary] };
  }),
  metrics: {
    coveragePercent: 100,
    nightHoursPerPerson: 10,
    weekendHoursPerPerson: 8,
    hoursPerWeekPerPerson: 28,
    teamSize: 6,
    shiftLength: '8h business + rotating on-call',
    rotation: 'Daily rotation, coast-based during business hours',
    onCallFrequency: '~5 days per week (mix of business + on-call)',
    handoffsPerWeek: 14,
  },
  tradeoffs: {
    pros: [
      '24/7 coverage for all incidents',
      'Enhanced coverage (Primary + Secondary) during peak hours',
      'Off-hours incidents get immediate response',
      'Balanced burden across team',
    ],
    cons: [
      'Everyone takes some night/weekend on-call',
      'Off-hours have reduced redundancy (no secondary)',
      'Requires staff on both coasts',
      'Higher overall on-call burden than business-hours-only',
    ],
  },
};

export const COVERAGE_MODELS: CoverageModel[] = [
  businessHoursOnly, // Most common pattern first
  followTheSun,
  weeklyRotation,
  twelveHourShifts,
];

export function getModelById(id: string): CoverageModel | undefined {
  return COVERAGE_MODELS.find((m) => m.id === id);
}
