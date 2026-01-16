# Plan: SLO Tools Cross-Pollination

## Overview

Connect the SLO Uptime Calculator and Error Budget Burndown tools with shared presets and cross-linking insights. Users should be able to flow between tools with context preserved.

## Current State

### Uptime Calculator (`/projects/uptime-calculator`)
- `COMMON_SLO_TARGETS`: 99%, 99.5%, 99.9%, 99.95%, 99.99%
- Calculates MTTR, achievable SLO, incident allowance
- Has response profile presets (Incident Commander, On-Call, After Hours)
- New "SLO Burndown" tab reuses Error Budget chart

### Error Budget Burndown (`/projects/error-budget-burndown`)
- `SLO_PRESETS`: 99%, 99.9%, 99.95%, 99.99%, 99.999%
- Includes `budgetDesc` (e.g., "43.2min/mo")
- Tracks incident history and burn rate
- Shows projected exhaustion date

### Differences
| Feature | Uptime Calculator | Error Budget Burndown |
|---------|-------------------|----------------------|
| 99.5% SLO | ✓ | ✗ |
| 99.999% SLO | ✗ | ✓ |
| Budget descriptions | ✗ | ✓ |
| Label capitalization | "two nines" | "Two nines" |

## Design

### Shared Presets (`src/lib/slo/presets.ts`)

```typescript
export interface SloPreset {
  value: number;           // e.g., 99.9
  label: string;           // e.g., "99.9% (Three nines)"
  shortLabel: string;      // e.g., "Three nines"
  monthlyBudget: string;   // e.g., "43.2 min"
  yearlyBudget: string;    // e.g., "8.76 hours"
}

export const SLO_PRESETS: SloPreset[] = [
  { value: 99,    label: '99% (Two nines)',      shortLabel: 'Two nines',   monthlyBudget: '7.2 hours',  yearlyBudget: '3.65 days' },
  { value: 99.5,  label: '99.5%',                shortLabel: '99.5%',       monthlyBudget: '3.6 hours',  yearlyBudget: '1.83 days' },
  { value: 99.9,  label: '99.9% (Three nines)',  shortLabel: 'Three nines', monthlyBudget: '43.2 min',   yearlyBudget: '8.76 hours' },
  { value: 99.95, label: '99.95%',               shortLabel: '99.95%',      monthlyBudget: '21.6 min',   yearlyBudget: '4.38 hours' },
  { value: 99.99, label: '99.99% (Four nines)',  shortLabel: 'Four nines',  monthlyBudget: '4.32 min',   yearlyBudget: '52.6 min' },
  { value: 99.999,label: '99.999% (Five nines)', shortLabel: 'Five nines',  monthlyBudget: '26 sec',     yearlyBudget: '5.26 min' },
];
```

### Cross-Tool Links

**From Uptime Calculator → Error Budget Burndown:**
- When showing phase breakdown: "Diagnosis takes 40% of MTTR"
- Link: "See how this impacts your error budget →"
- URL: `/projects/error-budget-burndown?slo=99.9&mttr=50`

**From Error Budget Burndown → Uptime Calculator:**
- When showing burn rate warning: "Projected to exhaust budget Jan 20"
- Link: "What response improvements would help? →"
- URL: `/projects/uptime-calculator?slo=99.9&mode=target`

### URL Parameters

| Param | Description | Used By |
|-------|-------------|---------|
| `slo` | Target SLO percentage | Both |
| `mttr` | Mean time to resolve (minutes) | Uptime Calculator |
| `mode` | Tab to show (`achieve`/`target`/`burndown`) | Uptime Calculator |
| `incidents` | Expected incidents per month | Uptime Calculator |

## Implementation

### Files to Create

| File | Purpose |
|------|---------|
| `src/lib/slo/presets.ts` | Shared SLO presets with budget calculations |
| `src/lib/slo/index.ts` | Barrel export |

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/projects/uptime-calculator/calculations.ts` | Import shared presets, remove local `COMMON_SLO_TARGETS` |
| `src/components/projects/uptime-calculator/SloTargetInput.tsx` | Update import path |
| `src/components/projects/uptime-calculator/index.tsx` | Add URL param reading, add cross-tool link |
| `src/components/projects/error-budget-burndown/calculations.ts` | Import shared presets, remove local `SLO_PRESETS` |
| `src/components/projects/error-budget-burndown/index.tsx` | Add URL param reading, add cross-tool link |
| `src/components/projects/error-budget-burndown/SloInput.tsx` | Update import path, use shared preset format |

## Checklist

- [ ] Create `src/lib/slo/presets.ts` with unified SLO presets
- [ ] Create barrel export `src/lib/slo/index.ts`
- [ ] Update Error Budget Burndown to use shared presets
- [ ] Update Uptime Calculator to use shared presets
- [ ] Add URL param reading to Uptime Calculator (`slo`, `mode`, `incidents`)
- [ ] Add URL param reading to Error Budget Burndown (`slo`)
- [ ] Add "See impact on Error Budget" link from Uptime Calculator insights
- [ ] Add "Improve response times" link from Error Budget Burndown
- [ ] Test cross-tool navigation preserves context
- [ ] Verify both tools work with shared presets

## Cross-Link Placement

### Uptime Calculator
**Location:** Below the phase breakdown chart in "What SLO can I achieve?" mode
**Trigger:** When showing MTTR breakdown
**Text:** "See how incidents impact your error budget →"
**Links to:** `/projects/error-budget-burndown?slo={achievedSlo}`

### Error Budget Burndown
**Location:** In the status card when showing burn rate
**Trigger:** When `burnMultiplier > 1` (burning faster than sustainable)
**Text:** "Improve your incident response times →"
**Links to:** `/projects/uptime-calculator?slo={targetSlo}&mode=target`

## Testing

1. Navigate to Uptime Calculator, click cross-link → Error Budget opens with SLO pre-filled
2. Navigate to Error Budget Burndown, click cross-link → Uptime Calculator opens with SLO pre-filled
3. Both tools display all 6 SLO presets consistently
4. Budget descriptions match across tools
5. Direct URL navigation works (e.g., `/projects/uptime-calculator?slo=99.9&mode=burndown`)
