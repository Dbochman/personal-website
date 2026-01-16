# Plan: Unified SLO Tool

## Overview

Consolidate the SLO Calculator and Error Budget Burndown into a single, seamless project. The unified tool combines the best features of both while simplifying the experience. A consistent Budget Burndown visualization appears on all tabs, showing how your configuration impacts error budget over time.

## Current State

### SLO Calculator (`/projects/uptime-calculator`)
- **Tabs**: What can I achieve? / Can I meet this SLO? / SLO Burndown
- Response time inputs with visibility toggles (exclude phases from calculation)
- Response profile presets (Incident Commander, On-Call, After Hours)
- Incidents per month slider
- MTTR breakdown visualization
- Cross-links to Error Budget with `?slo=X&incidents=Y`

### Error Budget Burndown (`/projects/error-budget`)
- SLO configuration with presets + slider magnetism
- Budget period selector (monthly/quarterly/yearly)
- Period start date picker
- Incident list (auto-generate or manual entry)
- Average duration, average impact % sliders
- Burndown chart with ideal/actual/projected lines
- Burn rate and exhaustion projections

## Design: Unified Tool

### Tab Structure

```
┌─────────────────────┬─────────────────────┬─────────────────────┐
│ What can I achieve? │ Can I meet this SLO?│   Budget Burndown   │
└─────────────────────┴─────────────────────┴─────────────────────┘
```

All tabs share:
- SLO target input (with presets + slider magnetism)
- Budget period selector
- Response time inputs
- Incidents per period slider
- **Budget Burndown chart** (ideal + projected lines)

### Tab-Specific Content

**Tab 1: What can I achieve?**
- Shows maximum achievable SLO based on response profile
- MTTR breakdown by phase (with exclude toggles)
- "With your response times and X incidents/period, you can achieve Y% SLO"

**Tab 2: Can I meet this SLO?**
- Target SLO input prominently displayed
- Shows if target is achievable (green) or not (red)
- Suggestions: reduce incidents, reduce MTTR, or lower target
- Budget usage percentage

**Tab 3: Budget Burndown**
- Full burndown chart (larger view)
- Burn rate indicator (0.5x, 1.0x, 1.5x, etc.)
- Projected exhaustion date
- On track / At risk status

### Budget Burndown Chart (All Tabs)

The chart appears on every tab as a compact visualization:

```
Budget Remaining
├─────────────────────────────────────┤
│  ╲                                  │
│   ╲  Ideal                          │
│    ╲___                             │
│        ╲___  Projected              │
│            ╲___                     │
│                ╲___                 │
├─────────────────────────────────────┤
Day 1        Day 15              Day 30
```

- **Ideal line**: Linear burn from 100% to 0% over period
- **Projected line**: Based on current MTTR × incidents/period
- Updates in real-time as user adjusts inputs

### Simplified Incident Model

**Keep:**
- Incidents per period (slider, 0-20)
- Average duration derived from MTTR calculation

**Prune:**
- Average impact % (assume 100% - full outage)
- Manual incident entry (use simulated incidents based on response profile)
- Incident names/dates (generated automatically for visualization)

### URL Parameters

| Param | Description | Example |
|-------|-------------|---------|
| `slo` | Target SLO percentage | `99.9` |
| `mode` | Active tab | `achievable`, `target`, `burndown` |
| `incidents` | Incidents per period | `4` |
| `period` | Budget period | `monthly`, `quarterly`, `yearly` |

## Implementation

### Phase 1: Create Unified Component Structure

```
src/components/projects/slo-tool/
├── index.tsx                 # Main component with tabs
├── SloConfiguration.tsx      # Shared SLO + period inputs
├── ResponseTimeInputs.tsx    # Reuse from uptime-calculator
├── IncidentInput.tsx         # Simplified incidents slider
├── BudgetChart.tsx           # Compact burndown chart for all tabs
├── AchievableTab.tsx         # "What can I achieve?" content
├── TargetTab.tsx             # "Can I meet this SLO?" content
├── BurndownTab.tsx           # Full burndown view
└── calculations.ts           # Merged calculation logic
```

### Phase 2: Merge Calculations

Combine logic from both tools:
- `calculateAchievableSlo()` - from uptime-calculator
- `calculateCanMeetSlo()` - from uptime-calculator
- `calculateBudget()` - from error-budget-burndown
- `generateChartData()` - from error-budget-burndown
- `generateSimulatedIncidents()` - simplified, no impact %

### Phase 3: Build Unified UI

1. Create tab container with shared state
2. Lift SLO config, period, incidents to parent
3. Pass down to tab-specific components
4. Add compact BudgetChart to all tabs
5. Full chart view on Burndown tab

### Phase 4: Migration

1. Create new `/projects/slo-tool` route
2. Add redirects from old routes:
   - `/projects/uptime-calculator` → `/projects/slo-tool`
   - `/projects/error-budget` → `/projects/slo-tool?mode=burndown`
3. Update project registry
4. Archive old components (don't delete immediately)

## Checklist

### Setup
- [ ] Create `src/components/projects/slo-tool/` directory
- [ ] Create new project entry in registry with `/projects/slo-tool` route

### Shared Components
- [ ] Create `SloConfiguration.tsx` (SLO input + period selector)
- [ ] Port `ResponseTimeInputs.tsx` from uptime-calculator
- [ ] Create simplified `IncidentInput.tsx` (no impact %)
- [ ] Create `BudgetChart.tsx` (compact version for all tabs)

### Tab Components
- [ ] Create `AchievableTab.tsx` with MTTR breakdown
- [ ] Create `TargetTab.tsx` with target validation
- [ ] Create `BurndownTab.tsx` with full chart view

### Calculations
- [ ] Merge calculation logic into unified `calculations.ts`
- [ ] Remove impact % from incident calculations (assume 100%)
- [ ] Generate simulated incidents from response profile + count

### Main Component
- [ ] Create `index.tsx` with tab navigation
- [ ] Wire up shared state (SLO, period, incidents, response profile)
- [ ] Add URL param reading/writing
- [ ] Add BudgetChart to all tabs

### Polish
- [ ] Mobile responsive layout
- [ ] Keyboard navigation between tabs
- [ ] Loading states
- [ ] Accessibility audit (aria-labels, heading hierarchy)

### Migration
- [ ] Add redirects from old routes
- [ ] Update any internal links
- [ ] Update project registry (mark old projects as archived)
- [ ] Update session notes with new pattern

## UI Mockup

```
┌─────────────────────────────────────────────────────────────────┐
│  SLO Tool                                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┬─────────────────┬─────────────────┐       │
│  │ What can I      │ Can I meet this │  Budget         │       │
│  │ achieve?        │ SLO?            │  Burndown       │       │
│  └─────────────────┴─────────────────┴─────────────────┘       │
│                                                                 │
│  ┌─────────────────────────┐  ┌─────────────────────────┐      │
│  │ SLO Configuration       │  │ Response Times          │      │
│  │                         │  │                         │      │
│  │ Target: [99.9%     ▼]   │  │ Alert latency    [5m]   │      │
│  │ ━━━━━━━━●━━━━━━━━━━━━   │  │ Acknowledge      [5m]   │      │
│  │                         │  │ To computer      [2m]   │      │
│  │ Period: [Monthly   ▼]   │  │ Authenticate     [3m]   │      │
│  │                         │  │ Diagnose        [15m]   │      │
│  │ Incidents: 4/period     │  │ Fix             [20m]   │      │
│  │ ━━━━━━━━●━━━━━━━━━━━━   │  │                         │      │
│  └─────────────────────────┘  └─────────────────────────┘      │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ [Tab-specific content here]                              │   │
│  │                                                          │   │
│  │ Maximum Achievable SLO: 99.54%                          │   │
│  │ Monthly MTTR: 3h 20m (4 incidents × 50m each)           │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Budget Burndown                              On Track ● │   │
│  │ ╲                                                        │   │
│  │  ╲   Ideal                                              │   │
│  │   ╲___                                                   │   │
│  │       ╲___  Projected                                   │   │
│  │           ╲___                                          │   │
│  │ Day 1              Day 15                      Day 30   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Future Enhancements

- **Scenarios**: Save/compare multiple configurations
- **Export**: Download chart as PNG or data as CSV
- **Alerts**: Set up notifications when approaching budget exhaustion
- **Historical**: Compare actual vs projected from previous periods
