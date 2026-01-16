# Error Budget Burndown

## Overview

Interactive tool to visualize error budget consumption over time. Users input their SLO target and incident history to see burn rate, projected exhaustion date, and whether they're on track.

## User Flow

1. **Configure SLO**: Set availability target (e.g., 99.9%) and budget period (monthly/quarterly)
2. **Add Incidents**: Enter incidents with duration and impact percentage
3. **View Burndown**: See budget consumed over time, burn rate, and projection

## UI Components

### Input Section
- SLO target slider (99% - 99.999%)
- Budget period selector (Monthly / Quarterly / Yearly)
- Incident list with:
  - Date
  - Duration (minutes)
  - Impact (% of users affected, defaults to 100%)
  - Optional: incident name/description

### Visualization Section
- **Burndown chart**: X-axis = time, Y-axis = remaining budget (minutes or %)
- **Ideal line**: Linear budget consumption (if evenly distributed)
- **Actual line**: Step-down at each incident
- **Projection**: Dashed line showing current burn rate extended
- **Danger zone**: Red shading when projected to exhaust before period end

### Summary Cards
- Budget allocated (total minutes)
- Budget consumed (minutes + %)
- Budget remaining (minutes + %)
- Current burn rate (x faster/slower than sustainable)
- Projected exhaustion date (or "On track")

## Calculations

```typescript
// Total budget in minutes for period
const totalBudget = periodMinutes * (1 - sloTarget);
// e.g., 30 days * 24h * 60m * 0.001 = 43.2 minutes for 99.9% monthly

// Consumed budget per incident
const consumed = incidentDuration * (impactPercent / 100);

// Burn rate
const elapsedDays = daysSinceStart;
const consumedSoFar = sum(incidents.map(i => i.consumed));
const burnRate = consumedSoFar / elapsedDays;
const sustainableRate = totalBudget / periodDays;
const burnMultiplier = burnRate / sustainableRate;

// Projection
const projectedTotal = burnRate * periodDays;
const willExhaust = projectedTotal > totalBudget;
const exhaustionDay = totalBudget / burnRate;
```

## Implementation Checklist

- [ ] Create ErrorBudgetBurndown component in src/components/projects/
- [ ] Add to project registry with route /projects/error-budget
- [ ] Build SLO configuration inputs (slider + period selector)
- [ ] Build incident input form (date, duration, impact)
- [ ] Implement budget calculations
- [ ] Create burndown chart with Recharts (reuse existing pattern)
- [ ] Add ideal vs actual vs projected lines
- [ ] Add summary cards with key metrics
- [ ] Style danger zone / on-track indicators
- [ ] Add presets (e.g., "Google SRE standard 99.9%")
- [ ] Mobile responsive layout
- [ ] Add to Projects page grid

## Technical Notes

- Reuse Recharts from Analytics Dashboard
- Similar input patterns to SLO Calculator (sliders, cards)
- Consider URL state for shareability (like other calculators)
- No backend needed - all client-side calculation

## Future Enhancements

- Import incidents from JSON/CSV
- Multiple SLO tracking (different services)
- Alert threshold recommendations based on burn rate
- Integration with SLO Calculator for "what-if" scenarios
