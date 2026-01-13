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
// Per Datadog: "shifts can be scheduled to follow the sun and distribute
// on-call responsibilities across time zones in a way that minimizes nighttime work"
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
// Per Datadog: "6-8 engineers so that each serves on-call no more than once per month"
const weeklyRotation: CoverageModel = {
  id: 'weekly-rotation',
  name: 'Weekly Rotation (8-person)',
  description: 'Primary + secondary each week, rotating through 8 team members. Secondary provides escalation backup and shadows before becoming primary.',
  rotationType: 'weekly',
  rotationWeeks: 8,
  team: [
    { name: 'Alex', timezone: 'America/New_York', region: 'Single', workingHours: 'Primary/Secondary every 4 weeks', hoursPerWeek: 42, nightHours: 14, weekendHours: 12 },
    { name: 'Jordan', timezone: 'America/New_York', region: 'Single', workingHours: 'Primary/Secondary every 4 weeks', hoursPerWeek: 42, nightHours: 14, weekendHours: 12 },
    { name: 'Taylor', timezone: 'America/New_York', region: 'Single', workingHours: 'Primary/Secondary every 4 weeks', hoursPerWeek: 42, nightHours: 14, weekendHours: 12 },
    { name: 'Morgan', timezone: 'America/New_York', region: 'Single', workingHours: 'Primary/Secondary every 4 weeks', hoursPerWeek: 42, nightHours: 14, weekendHours: 12 },
    { name: 'Casey', timezone: 'America/New_York', region: 'Single', workingHours: 'Primary/Secondary every 4 weeks', hoursPerWeek: 42, nightHours: 14, weekendHours: 12 },
    { name: 'Riley', timezone: 'America/New_York', region: 'Single', workingHours: 'Primary/Secondary every 4 weeks', hoursPerWeek: 42, nightHours: 14, weekendHours: 12 },
    { name: 'Quinn', timezone: 'America/New_York', region: 'Single', workingHours: 'Primary/Secondary every 4 weeks', hoursPerWeek: 42, nightHours: 14, weekendHours: 12 },
    { name: 'Avery', timezone: 'America/New_York', region: 'Single', workingHours: 'Primary/Secondary every 4 weeks', hoursPerWeek: 42, nightHours: 14, weekendHours: 12 },
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

// Model 3: 12-Hour Shifts - balanced shift length for single-site teams
const twelveHourShifts: CoverageModel = {
  id: '12-hour-shifts',
  name: '12-Hour Shifts (12-person)',
  description: 'Two 12-hour shifts daily with rotating day/night coverage. Everyone rotates through both shifts, distributing night burden fairly across the team.',
  rotationType: 'shift',
  team: [
    // All 12 rotate through both day and night shifts
    // Week A: First 6 on days, second 6 on nights
    // Week B: Swap - second 6 on days, first 6 on nights
    { name: 'Alex', timezone: 'America/New_York', region: 'Single', workingHours: 'Rotating day/night shifts', hoursPerWeek: 28, nightHours: 14, weekendHours: 4 },
    { name: 'Jordan', timezone: 'America/New_York', region: 'Single', workingHours: 'Rotating day/night shifts', hoursPerWeek: 28, nightHours: 14, weekendHours: 4 },
    { name: 'Taylor', timezone: 'America/New_York', region: 'Single', workingHours: 'Rotating day/night shifts', hoursPerWeek: 28, nightHours: 14, weekendHours: 4 },
    { name: 'Morgan', timezone: 'America/New_York', region: 'Single', workingHours: 'Rotating day/night shifts', hoursPerWeek: 28, nightHours: 14, weekendHours: 4 },
    { name: 'Sam', timezone: 'America/New_York', region: 'Single', workingHours: 'Rotating day/night shifts', hoursPerWeek: 28, nightHours: 14, weekendHours: 4 },
    { name: 'Jamie', timezone: 'America/New_York', region: 'Single', workingHours: 'Rotating day/night shifts', hoursPerWeek: 28, nightHours: 14, weekendHours: 4 },
    { name: 'Casey', timezone: 'America/New_York', region: 'Single', workingHours: 'Rotating day/night shifts', hoursPerWeek: 28, nightHours: 14, weekendHours: 4 },
    { name: 'Riley', timezone: 'America/New_York', region: 'Single', workingHours: 'Rotating day/night shifts', hoursPerWeek: 28, nightHours: 14, weekendHours: 4 },
    { name: 'Quinn', timezone: 'America/New_York', region: 'Single', workingHours: 'Rotating day/night shifts', hoursPerWeek: 28, nightHours: 14, weekendHours: 4 },
    { name: 'Avery', timezone: 'America/New_York', region: 'Single', workingHours: 'Rotating day/night shifts', hoursPerWeek: 28, nightHours: 14, weekendHours: 4 },
    { name: 'Drew', timezone: 'America/New_York', region: 'Single', workingHours: 'Rotating day/night shifts', hoursPerWeek: 28, nightHours: 14, weekendHours: 4 },
    { name: 'Blake', timezone: 'America/New_York', region: 'Single', workingHours: 'Rotating day/night shifts', hoursPerWeek: 28, nightHours: 14, weekendHours: 4 },
  ],
  coverage: createWeekCoverage((day, hour) => {
    // Day shift: 12-00 UTC (7am-7pm ET)
    // Night shift: 00-12 UTC (7pm-7am ET)
    // All 12 people rotate through both shifts
    const allPeople = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Sam', 'Jamie', 'Casey', 'Riley', 'Quinn', 'Avery', 'Drew', 'Blake'];

    // Day shift uses first 6 in rotation, night uses second 6
    // This rotates daily so everyone gets both shifts over time
    if (hour >= 0 && hour < 12) {
      // Night shift: pick from pool offset by 6 from day shift
      const primary = pickByDay(allPeople, day, 6);
      const backup = pickByDay(allPeople, day, 9); // Offset by 3 from primary
      return { covered: true, members: [primary, backup] };
    }
    // Day shift
    const primary = pickByDay(allPeople, day);
    const backup = pickByDay(allPeople, day, 3); // Offset by 3 from primary
    return { covered: true, members: [primary, backup] };
  }),
  metrics: {
    coveragePercent: 100,
    nightHoursPerPerson: 14, // Night burden shared: 84h × 2 roles / 12 people
    weekendHoursPerPerson: 4, // Weekend duty distributed across all 12
    hoursPerWeekPerPerson: 28, // 168h × 2 roles / 12 people
    teamSize: 12,
    shiftLength: '12h',
    rotation: 'Rotating day/night with offset backup',
    onCallFrequency: '~2 shifts/week (rotating day/night)',
    handoffsPerWeek: 14, // 2/day × 7 days
  },
  tradeoffs: {
    pros: [
      '12h shifts balance continuity vs. fatigue',
      'Night burden shared equally - no permanent night crew',
      'Larger pool (12 people) absorbs PTO and sick days',
      'Primary + backup ensures escalation path',
    ],
    cons: [
      'Everyone does some night shifts',
      'Larger team size required (12 people)',
      'Requires night shift differential pay',
      'Rotating schedules can be harder to plan around',
    ],
  },
};

// Model 4: Primary + Secondary with rotating secondary
const primarySecondary: CoverageModel = {
  id: 'primary-secondary',
  name: 'Primary + Secondary (8-person)',
  description: 'Two-tier escalation with rotating backup. Primary owns the week, secondary rotates to spread the backup burden.',
  rotationType: 'weekly',
  rotationWeeks: 8,
  team: [
    { name: 'Alex', timezone: 'America/New_York', region: 'Single', workingHours: 'Primary all week', hoursPerWeek: 168, nightHours: 56, weekendHours: 48 },
    { name: 'Jordan', timezone: 'America/New_York', region: 'Single', workingHours: 'Secondary rotation (1 day/week)', hoursPerWeek: 24, nightHours: 8, weekendHours: 6 },
    { name: 'Taylor', timezone: 'America/New_York', region: 'Single', workingHours: 'Secondary rotation (1 day/week)', hoursPerWeek: 24, nightHours: 8, weekendHours: 6 },
    { name: 'Morgan', timezone: 'America/New_York', region: 'Single', workingHours: 'Secondary rotation (1 day/week)', hoursPerWeek: 24, nightHours: 8, weekendHours: 6 },
    { name: 'Casey', timezone: 'America/New_York', region: 'Single', workingHours: 'Secondary rotation (1 day/week)', hoursPerWeek: 24, nightHours: 8, weekendHours: 6 },
    { name: 'Riley', timezone: 'America/New_York', region: 'Single', workingHours: 'Secondary rotation (1 day/week)', hoursPerWeek: 24, nightHours: 8, weekendHours: 6 },
    { name: 'Quinn', timezone: 'America/New_York', region: 'Single', workingHours: 'Secondary rotation (1 day/week)', hoursPerWeek: 24, nightHours: 8, weekendHours: 6 },
    { name: 'Avery', timezone: 'America/New_York', region: 'Single', workingHours: 'Secondary rotation (1 day/week)', hoursPerWeek: 24, nightHours: 8, weekendHours: 6 },
  ],
  coverage: createWeekCoverage((day) => {
    // Primary is always Alex, secondary rotates
    const secondaryRotation = ['Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Quinn', 'Avery'];
    return {
      covered: true,
      members: ['Alex', pickByDay(secondaryRotation, day)],
    };
  }),
  metrics: {
    coveragePercent: 100,
    nightHoursPerPerson: 14, // (56 + 56) / 8
    weekendHoursPerPerson: 12, // (48 + 48) / 8
    hoursPerWeekPerPerson: 42, // (168 + 168) / 8
    teamSize: 8,
    shiftLength: '168h (full week)',
    rotation: 'Primary weekly, Secondary daily rotation',
    onCallFrequency: 'Primary every 8 weeks, Secondary 1 day/week',
    handoffsPerWeek: 1,
  },
  tradeoffs: {
    pros: [
      'Built-in backup for complex or extended incidents',
      'Secondary learns from primary (mentorship)',
      'Reduced stress knowing backup is available',
      'Escalation path without finding new responder',
    ],
    cons: [
      'Two people partially committed at all times',
      'Secondary interruptions can be unpredictable',
      'Higher total on-call burden across team',
      'Requires clear escalation criteria',
    ],
  },
};

// Model 6: Business Hours Only - For non-critical services
const businessHoursOnly: CoverageModel = {
  id: 'business-hours',
  name: 'Business Hours Only',
  description: 'Coverage during business hours only with daily rotation. Appropriate for internal tools and services without SLA obligations.',
  rotationType: 'daily',
  team: [
    { name: 'Alex', timezone: 'America/New_York', region: 'Single', workingHours: 'Primary Mon & Fri', hoursPerWeek: 16, nightHours: 0, weekendHours: 0 },
    { name: 'Jordan', timezone: 'America/New_York', region: 'Single', workingHours: 'Primary Tuesday', hoursPerWeek: 8, nightHours: 0, weekendHours: 0 },
    { name: 'Taylor', timezone: 'America/New_York', region: 'Single', workingHours: 'Primary Wednesday', hoursPerWeek: 8, nightHours: 0, weekendHours: 0 },
    { name: 'Morgan', timezone: 'America/New_York', region: 'Single', workingHours: 'Primary Thursday', hoursPerWeek: 8, nightHours: 0, weekendHours: 0 },
  ],
  coverage: createWeekCoverage((day, hour) => {
    const isWeekday = day >= 1 && day <= 5;
    // 9am-5pm ET = 14-22 UTC
    const isBusinessHours = hour >= 14 && hour < 22;
    // Daily rotation: Mon=Alex, Tue=Jordan, Wed=Taylor, Thu=Morgan, Fri=Alex
    const dailyPrimary: Record<number, string> = {
      1: 'Alex',    // Monday
      2: 'Jordan',  // Tuesday
      3: 'Taylor',  // Wednesday
      4: 'Morgan',  // Thursday
      5: 'Alex',    // Friday
    };
    if (isWeekday && isBusinessHours) {
      return { covered: true, members: [dailyPrimary[day]] };
    }
    return { covered: false, members: [] };
  }),
  metrics: {
    coveragePercent: 24, // 40h of 168h
    nightHoursPerPerson: 0,
    weekendHoursPerPerson: 0,
    hoursPerWeekPerPerson: 10,
    teamSize: 4,
    shiftLength: '8h',
    rotation: 'Daily rotation of primary',
    onCallFrequency: '1 day every 4 days',
    handoffsPerWeek: 5,
  },
  tradeoffs: {
    pros: [
      'Minimal on-call burden',
      'No nights or weekends - fully sustainable',
      'Works with very small teams',
      'Appropriate for internal/low-criticality services',
    ],
    cons: [
      '76% of the week has no coverage',
      'After-hours incidents wait until morning',
      'Not suitable for customer-facing services',
      'May need emergency escalation path',
    ],
  },
};

export const COVERAGE_MODELS: CoverageModel[] = [
  followTheSun,      // Healthiest first
  weeklyRotation,
  twelveHourShifts,
  primarySecondary,
  businessHoursOnly,
];

export function getModelById(id: string): CoverageModel | undefined {
  return COVERAGE_MODELS.find((m) => m.id === id);
}
