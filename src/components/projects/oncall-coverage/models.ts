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

// Model 1: Weekly Rotation (24/7)
const weeklyRotation: CoverageModel = {
  id: 'weekly-rotation',
  name: 'Weekly Rotation (24/7)',
  description: 'One person covers the entire week, then rotates to the next engineer.',
  team: [
    { name: 'Alex', timezone: 'America/New_York', region: 'Single', workingHours: '24/7 on-call', hoursPerWeek: 168, nightHours: 56, weekendHours: 48 },
    { name: 'Jordan', timezone: 'America/New_York', region: 'Single', workingHours: 'Off rotation', hoursPerWeek: 0, nightHours: 0, weekendHours: 0 },
    { name: 'Taylor', timezone: 'America/New_York', region: 'Single', workingHours: 'Off rotation', hoursPerWeek: 0, nightHours: 0, weekendHours: 0 },
    { name: 'Morgan', timezone: 'America/New_York', region: 'Single', workingHours: 'Off rotation', hoursPerWeek: 0, nightHours: 0, weekendHours: 0 },
    { name: 'Casey', timezone: 'America/New_York', region: 'Single', workingHours: 'Off rotation', hoursPerWeek: 0, nightHours: 0, weekendHours: 0 },
  ],
  coverage: createWeekCoverage(() => ({ covered: true, members: ['Alex'] })),
  metrics: {
    coveragePercent: 100,
    nightHoursPerPerson: 11.2, // 56h / 5 people averaged
    weekendHoursPerPerson: 9.6, // 48h / 5 people averaged
    hoursPerWeekPerPerson: 33.6, // 168h / 5 people averaged
    teamSize: 5,
    shiftLength: '168h (full week)',
    rotation: 'Weekly',
  },
  tradeoffs: {
    pros: [
      'Simple scheduling - one person owns the week',
      'No handoff coordination during the week',
      'Clear accountability for incidents',
    ],
    cons: [
      'High individual burden when on-call',
      'Includes nights and weekends',
      'Can lead to burnout with high incident volume',
      'Needs minimum 5 people for sustainable rotation',
    ],
  },
};

// Model 2: Follow-the-Sun (3 Regions)
const followTheSun: CoverageModel = {
  id: 'follow-the-sun',
  name: 'Follow-the-Sun (3 Regions)',
  description: 'Three global teams hand off coverage as the sun moves, each working business hours.',
  team: [
    { name: 'Alex', timezone: 'America/New_York', region: 'US', workingHours: '9am-5pm ET', hoursPerWeek: 40, nightHours: 0, weekendHours: 0 },
    { name: 'Sam', timezone: 'America/New_York', region: 'US', workingHours: '9am-5pm ET', hoursPerWeek: 40, nightHours: 0, weekendHours: 0 },
    { name: 'Emma', timezone: 'Europe/London', region: 'EU', workingHours: '9am-5pm GMT', hoursPerWeek: 40, nightHours: 0, weekendHours: 0 },
    { name: 'Liam', timezone: 'Europe/London', region: 'EU', workingHours: '9am-5pm GMT', hoursPerWeek: 40, nightHours: 0, weekendHours: 0 },
    { name: 'Yuki', timezone: 'Asia/Tokyo', region: 'APAC', workingHours: '9am-5pm JST', hoursPerWeek: 40, nightHours: 0, weekendHours: 0 },
    { name: 'Hana', timezone: 'Asia/Tokyo', region: 'APAC', workingHours: '9am-5pm JST', hoursPerWeek: 40, nightHours: 0, weekendHours: 0 },
  ],
  coverage: createWeekCoverage((day, hour) => {
    const isWeekday = day >= 1 && day <= 5;
    if (!isWeekday) {
      // Weekend - reduced coverage, only APAC morning overlap
      if (hour >= 0 && hour < 8) return { covered: true, members: ['Yuki', 'Hana'] };
      return { covered: false, members: [] };
    }
    // Weekday coverage by region (UTC times)
    // APAC: 0-8 UTC (9am-5pm JST)
    // EU: 9-17 UTC (9am-5pm GMT)
    // US: 14-22 UTC (9am-5pm ET)
    if (hour >= 0 && hour < 8) return { covered: true, members: ['Yuki', 'Hana'] };
    if (hour >= 9 && hour < 14) return { covered: true, members: ['Emma', 'Liam'] };
    if (hour >= 14 && hour < 17) return { covered: true, members: ['Emma', 'Liam', 'Alex', 'Sam'] };
    if (hour >= 17 && hour < 22) return { covered: true, members: ['Alex', 'Sam'] };
    // Gap hours: 8-9 UTC and 22-24 UTC
    return { covered: false, members: [] };
  }),
  metrics: {
    coveragePercent: 83, // ~139h of 168h
    nightHoursPerPerson: 0,
    weekendHoursPerPerson: 0,
    hoursPerWeekPerPerson: 40,
    teamSize: 6,
    shiftLength: '8h',
    rotation: 'Daily handoff between regions',
  },
  tradeoffs: {
    pros: [
      'No night shifts - everyone works business hours',
      'Fast response times - always someone awake',
      'Sustainable long-term for team health',
      'Natural overlap periods for handoffs',
    ],
    cons: [
      'Requires globally distributed team',
      'More handoff coordination needed',
      'Weekend coverage gaps (or extra arrangements)',
      'Hiring constraints - need people in specific regions',
    ],
  },
};

// Model 3: 12-Hour Shifts (Single Site)
const twelveHourShifts: CoverageModel = {
  id: '12-hour-shifts',
  name: '12-Hour Shifts (Single Site)',
  description: 'Two shifts per day covering day and night, works with a single-location team.',
  team: [
    { name: 'Alex', timezone: 'America/New_York', region: 'Single', workingHours: '6am-6pm ET', hoursPerWeek: 42, nightHours: 0, weekendHours: 12 },
    { name: 'Jordan', timezone: 'America/New_York', region: 'Single', workingHours: '6pm-6am ET', hoursPerWeek: 42, nightHours: 42, weekendHours: 12 },
    { name: 'Taylor', timezone: 'America/New_York', region: 'Single', workingHours: '6am-6pm ET', hoursPerWeek: 42, nightHours: 0, weekendHours: 12 },
    { name: 'Morgan', timezone: 'America/New_York', region: 'Single', workingHours: '6pm-6am ET', hoursPerWeek: 42, nightHours: 42, weekendHours: 12 },
  ],
  coverage: createWeekCoverage((_, hour) => {
    // Day shift: 11-23 UTC (6am-6pm ET)
    // Night shift: 23-11 UTC (6pm-6am ET)
    if (hour >= 11 && hour < 23) {
      return { covered: true, members: ['Alex', 'Taylor'] };
    }
    return { covered: true, members: ['Jordan', 'Morgan'] };
  }),
  metrics: {
    coveragePercent: 100,
    nightHoursPerPerson: 21, // Half the team does nights
    weekendHoursPerPerson: 12,
    hoursPerWeekPerPerson: 42,
    teamSize: 4,
    shiftLength: '12h',
    rotation: 'Alternating day/night shifts',
  },
  tradeoffs: {
    pros: [
      'Full 24/7 coverage with single-site team',
      'Clear shift boundaries',
      'Fewer people needed than weekly rotation',
      'Consistent schedules once established',
    ],
    cons: [
      'Half the team works night shifts',
      '12-hour shifts can be tiring',
      'Health impacts from night work',
      'Requires shift differential compensation',
    ],
  },
};

// Model 4: Business Hours Only
const businessHoursOnly: CoverageModel = {
  id: 'business-hours',
  name: 'Business Hours Only',
  description: '9-5 Monday-Friday coverage only. Suitable for non-critical internal services.',
  team: [
    { name: 'Alex', timezone: 'America/New_York', region: 'Single', workingHours: '9am-5pm ET', hoursPerWeek: 15, nightHours: 0, weekendHours: 0 },
    { name: 'Jordan', timezone: 'America/New_York', region: 'Single', workingHours: '9am-5pm ET', hoursPerWeek: 15, nightHours: 0, weekendHours: 0 },
    { name: 'Taylor', timezone: 'America/New_York', region: 'Single', workingHours: '9am-5pm ET', hoursPerWeek: 15, nightHours: 0, weekendHours: 0 },
  ],
  coverage: createWeekCoverage((day, hour) => {
    const isWeekday = day >= 1 && day <= 5;
    // 9am-5pm ET = 14-22 UTC
    const isBusinessHours = hour >= 14 && hour < 22;
    if (isWeekday && isBusinessHours) {
      return { covered: true, members: ['Alex', 'Jordan', 'Taylor'] };
    }
    return { covered: false, members: [] };
  }),
  metrics: {
    coveragePercent: 24, // 40h of 168h
    nightHoursPerPerson: 0,
    weekendHoursPerPerson: 0,
    hoursPerWeekPerPerson: 13,
    teamSize: 3,
    shiftLength: '8h',
    rotation: 'Rotating primary daily',
  },
  tradeoffs: {
    pros: [
      'Minimal on-call burden',
      'No nights or weekends',
      'Sustainable for small teams',
      'Good for internal/non-critical services',
    ],
    cons: [
      '76% of the week is uncovered',
      'Incidents outside hours wait until morning',
      'Not suitable for customer-facing services',
      'May need escalation path for emergencies',
    ],
  },
};

// Model 5: Weekday/Weekend Split
const weekdayWeekendSplit: CoverageModel = {
  id: 'weekday-weekend',
  name: 'Weekday/Weekend Split',
  description: 'Separate teams handle weekdays vs weekends, allowing specialization and predictability.',
  team: [
    { name: 'Alex', timezone: 'America/New_York', region: 'Single', workingHours: 'Weekdays 24h', hoursPerWeek: 48, nightHours: 16, weekendHours: 0 },
    { name: 'Jordan', timezone: 'America/New_York', region: 'Single', workingHours: 'Weekdays 24h', hoursPerWeek: 48, nightHours: 16, weekendHours: 0 },
    { name: 'Taylor', timezone: 'America/New_York', region: 'Single', workingHours: 'Weekdays 24h', hoursPerWeek: 48, nightHours: 16, weekendHours: 0 },
    { name: 'Morgan', timezone: 'America/New_York', region: 'Single', workingHours: 'Weekends 24h', hoursPerWeek: 24, nightHours: 8, weekendHours: 24 },
    { name: 'Casey', timezone: 'America/New_York', region: 'Single', workingHours: 'Weekends 24h', hoursPerWeek: 24, nightHours: 8, weekendHours: 24 },
  ],
  coverage: createWeekCoverage((day) => {
    const isWeekend = day === 0 || day === 6;
    if (isWeekend) {
      return { covered: true, members: ['Morgan', 'Casey'] };
    }
    return { covered: true, members: ['Alex', 'Jordan', 'Taylor'] };
  }),
  metrics: {
    coveragePercent: 100,
    nightHoursPerPerson: 12.8, // Averaged across team
    weekendHoursPerPerson: 9.6,
    hoursPerWeekPerPerson: 38.4,
    teamSize: 5,
    shiftLength: '24h blocks',
    rotation: 'Fixed weekday/weekend assignment',
  },
  tradeoffs: {
    pros: [
      'Predictable schedules - know your days in advance',
      'Weekend specialists can plan their week',
      'Clear ownership boundaries',
      'Can offer weekend premium pay',
    ],
    cons: [
      'Weekend team may feel isolated',
      'Uneven burden distribution',
      'Handoff at week boundaries',
      'Need people willing to do regular weekends',
    ],
  },
};

// Model 6: Primary/Secondary
const primarySecondary: CoverageModel = {
  id: 'primary-secondary',
  name: 'Primary/Secondary Escalation',
  description: 'Two-tier system where primary handles first response, secondary provides backup.',
  team: [
    { name: 'Alex (Primary)', timezone: 'America/New_York', region: 'Single', workingHours: 'Week 1: Primary', hoursPerWeek: 84, nightHours: 28, weekendHours: 24 },
    { name: 'Jordan (Secondary)', timezone: 'America/New_York', region: 'Single', workingHours: 'Week 1: Secondary', hoursPerWeek: 42, nightHours: 14, weekendHours: 12 },
    { name: 'Taylor', timezone: 'America/New_York', region: 'Single', workingHours: 'Off rotation', hoursPerWeek: 0, nightHours: 0, weekendHours: 0 },
    { name: 'Morgan', timezone: 'America/New_York', region: 'Single', workingHours: 'Off rotation', hoursPerWeek: 0, nightHours: 0, weekendHours: 0 },
  ],
  coverage: createWeekCoverage(() => ({
    covered: true,
    members: ['Alex (Primary)', 'Jordan (Secondary)'],
  })),
  metrics: {
    coveragePercent: 100,
    nightHoursPerPerson: 10.5, // Averaged
    weekendHoursPerPerson: 9,
    hoursPerWeekPerPerson: 31.5,
    teamSize: 4,
    shiftLength: '168h (full week)',
    rotation: 'Weekly, Primary → Secondary → Off',
  },
  tradeoffs: {
    pros: [
      'Built-in backup for complex incidents',
      'Secondary learns from primary',
      'Safety net reduces stress',
      'Escalation path for expertise',
    ],
    cons: [
      'Two people "on" at any time',
      'Secondary may be interrupted unexpectedly',
      'More complex scheduling',
      'Potential confusion about ownership',
    ],
  },
};

export const COVERAGE_MODELS: CoverageModel[] = [
  weeklyRotation,
  followTheSun,
  twelveHourShifts,
  businessHoursOnly,
  weekdayWeekendSplit,
  primarySecondary,
];

export function getModelById(id: string): CoverageModel | undefined {
  return COVERAGE_MODELS.find((m) => m.id === id);
}
