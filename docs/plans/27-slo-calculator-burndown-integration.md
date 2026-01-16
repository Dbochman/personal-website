# SLO Calculator Burndown Integration

## Overview

Add a "SLO Burndown" tab to the existing SLO Uptime Calculator that visualizes error budget consumption over time. Reuses the `BurndownChart` component from Error Budget Burndown with simulated incidents based on the calculator's "incidents per month" input.

## Current State

The SLO Uptime Calculator (`/projects/uptime-calculator`) has:
- Two modes: "What can I achieve?" and "Can I meet this SLA?"
- Response time inputs for incident phases (alert, acknowledge, diagnose, fix)
- Incidents per month slider (1-20)
- Results panel showing achievable SLA and error budget

## Proposed Changes

### New Tab: "SLO Burndown"

Add a third tab that shows:
1. **Burndown Chart** - Reuse `BurndownChart` from error-budget-burndown
2. **Simulated Incidents** - Generate incidents distributed across the month based on:
   - `incidentsPerMonth` count
   - `effectiveProfile` total response time as average duration
   - 100% impact (full outage assumption)
3. **Summary** - Show burn rate and projection inline

### UI Layout

```
┌─────────────────────────────────────────────────────────┐
│  [What can I achieve?] [Can I meet SLA?] [SLO Burndown] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Response profile: [Dropdown]                           │
│                                                         │
│  ┌─ Response Times ──────────────────────────────────┐  │
│  │  Alert latency    [====|====] 5 min               │  │
│  │  Acknowledge      [====|====] 10 min              │  │
│  │  ...                                              │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  Incidents per month: [====|====] 4                     │
│                                                         │
│  ┌─ SLO Burndown ────────────────────────────────────┐  │
│  │  [Burndown Chart - reused component]              │  │
│  │                                                   │  │
│  │  Burn Rate: 1.2x | On Track / At Risk             │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Implementation

### 1. Import BurndownChart

```typescript
import { BurndownChart } from '@/components/projects/error-budget-burndown/BurndownChart';
import {
  calculateBudget,
  generateChartData,
  type SloConfig,
  type Incident
} from '@/components/projects/error-budget-burndown/calculations';
```

### 2. Generate Simulated Incidents

```typescript
function generateSimulatedIncidents(
  incidentsPerMonth: number,
  avgDurationMinutes: number
): Incident[] {
  const incidents: Incident[] = [];
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  // Only generate incidents up to current day
  const daysElapsed = Math.floor(
    (today.getTime() - startOfMonth.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Distribute incidents evenly across elapsed days
  const spacing = Math.max(1, Math.floor(daysElapsed / incidentsPerMonth));

  for (let i = 0; i < incidentsPerMonth && i * spacing <= daysElapsed; i++) {
    const day = Math.min(daysElapsed, i * spacing);
    const incidentDate = new Date(startOfMonth.getTime() + day * 24 * 60 * 60 * 1000);

    incidents.push({
      id: `sim-${i}`,
      name: `Incident ${i + 1}`,
      date: incidentDate.toISOString().split('T')[0],
      durationMinutes: avgDurationMinutes,
      impactPercent: 100,
    });
  }

  return incidents;
}
```

### 3. Add TabsContent for Burndown

```tsx
<TabsContent value="burndown" className="mt-6 space-y-6">
  <SloBurndownPanel
    targetSla={mode === 'target' ? targetSla : achievableResult.sla}
    incidentsPerMonth={incidentsPerMonth}
    avgDurationMinutes={effectiveProfile.totalTime}
  />
</TabsContent>
```

### 4. Create SloBurndownPanel Component

New file: `src/components/projects/uptime-calculator/SloBurndownPanel.tsx`

```typescript
interface SloBurndownPanelProps {
  targetSla: number;
  incidentsPerMonth: number;
  avgDurationMinutes: number;
}

export function SloBurndownPanel({
  targetSla,
  incidentsPerMonth,
  avgDurationMinutes
}: SloBurndownPanelProps) {
  const config: SloConfig = {
    target: targetSla,
    period: 'monthly',
    startDate: getFirstOfMonth(),
  };

  const incidents = generateSimulatedIncidents(incidentsPerMonth, avgDurationMinutes);
  const calculation = calculateBudget(config, incidents);
  const chartData = generateChartData(config, incidents, calculation);

  return (
    <div className="space-y-4">
      <BurndownChart
        data={chartData}
        daysElapsed={calculation.daysElapsed}
        isOnTrack={calculation.isOnTrack}
      />
      <BurnRateSummary calculation={calculation} />
    </div>
  );
}
```

## Implementation Checklist

- [ ] Export BurndownChart and calculations from error-budget-burndown
- [ ] Create SloBurndownPanel component
- [ ] Add generateSimulatedIncidents helper
- [ ] Add "SLO Burndown" tab to UptimeCalculator
- [ ] Wire up inputs (targetSla, incidentsPerMonth, effectiveProfile)
- [ ] Add compact burn rate summary below chart
- [ ] Test with different incident counts and response profiles
- [ ] Mobile responsive check

## Technical Notes

- Reuses existing chart component - no new dependencies
- Simulated incidents use the calculated total response time as duration
- Chart updates reactively as user adjusts sliders
- Consider memoizing incident generation to avoid recalc on every render

## Future Enhancements

- Allow toggling between "simulated" and "manual" incident entry
- Show comparison between current SLA target and achievable SLA on chart
- Add tooltips explaining how simulated incidents are generated
