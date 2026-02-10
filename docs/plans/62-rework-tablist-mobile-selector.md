# Plan 62: Rework TabList Mobile Selector

## Context

On mobile (< 640px), tab lists across the site use inconsistent workarounds: horizontal scrolling (AnalyticsDashboard, 6 tabs), flex-wrap (IncidentCommandDiagrams, 3 long titles), dual hidden/visible spans (SloTool). The AnalyticsDashboard is the worst offender — 6 tabs crammed into a horizontal scroll on small screens. This plan creates a reusable `ResponsiveTabsList` component that renders a native `Select` dropdown on mobile and standard `TabsList` triggers on desktop.

## Approach

### 1. Create `src/components/ui/responsive-tabs.tsx`

New component (~70 lines) with this API:

```tsx
interface TabItem {
  value: string;
  label: string;         // desktop label
  mobileLabel?: string;  // shorter label for Select, falls back to label
}

interface ResponsiveTabsListProps {
  items: TabItem[];
  value: string;
  onValueChange: (value: string) => void;
  tabsListClassName?: string;   // forwarded to desktop TabsList
  triggerClassName?: string;    // forwarded to each desktop TabsTrigger
  selectClassName?: string;     // style mobile SelectTrigger
}
```

Internal rendering strategy:

```tsx
export function ResponsiveTabsList({
  items, value, onValueChange,
  tabsListClassName, triggerClassName, selectClassName,
}: ResponsiveTabsListProps) {
  return (
    <>
      {/* Mobile: Select dropdown */}
      <div className="sm:hidden">
        <Select value={value} onValueChange={onValueChange}>
          <SelectTrigger className={cn("w-full", selectClassName)}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {items.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.mobileLabel ?? item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Desktop TabsList — visible at sm+.
          On mobile: sr-only (not display:none) so TabsTrigger elements
          remain accessible and aria-labelledby on TabsContent resolves. */}
      <TabsList className={cn("sr-only sm:not-sr-only sm:inline-flex", tabsListClassName)}>
        {items.map((item) => (
          <TabsTrigger
            key={item.value}
            value={item.value}
            className={triggerClassName}
          >
            {item.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </>
  );
}
```

**Key design decisions:**

1. **Accessibility:** The desktop `TabsList` uses `sr-only sm:not-sr-only sm:inline-flex` instead of `hidden sm:inline-flex`. This keeps `TabsTrigger` elements in the accessibility tree on mobile so that each `TabsContent`'s `aria-labelledby` resolves to real text. At `sm+`, `not-sr-only` restores normal positioning and `inline-flex` makes it visible.

2. **Controlled Select value:** The `Select` receives `value={value}` directly from props, ensuring it stays in sync when the parent changes the active tab programmatically (e.g., hash navigation in IncidentCommandDiagrams, `AnimatePresence` in AnalyticsDashboard).

3. **Class forwarding:** `tabsListClassName` and `triggerClassName` are forwarded directly via `cn()` to preserve per-consumer desktop styling (grid layout for SloTool, flex-wrap/zinc background for IncidentCommandDiagrams, w-full for AnalyticsDashboard).

### 2. Migrate AnalyticsDashboard (highest impact)

**File:** `src/components/analytics/AnalyticsDashboard.tsx` (~line 179)

- Remove the `overflow-x-auto -mx-2 px-2` wrapper div and inline `TabsList`/`TabsTrigger`
- Replace with `<ResponsiveTabsList items={ANALYTICS_TABS} value={activeTab} onValueChange={setActiveTab} tabsListClassName="w-full sm:w-auto" />`
- Define constant with 6 tabs: Traffic, Blog, Performance (mobileLabel: "Perf"), Search, Tools, CI/CD

### 3. Migrate IncidentCommandDiagrams

**File:** `src/components/projects/incident-command-diagrams/index.tsx` (~line 234)

- Replace flex-wrap `TabsList` + mapped `TabsTrigger`
- Derive items from existing `DIAGRAMS` array
- Preserve custom styling via `tabsListClassName` and `triggerClassName` props

### 4. Migrate SloTool

**File:** `src/components/projects/slo-tool/index.tsx` (~line 237)

- Replace the dual `<span hidden/sm:hidden>` pattern with `mobileLabel` prop
- Preserve `grid w-full grid-cols-3` via `tabsListClassName`
- Preserve `trackToolEvent` call in `onValueChange` wrapper

### 5. Skip K8sRightsizer

Only 2 short tabs (CPU / Memory) — no mobile UX issue. A dropdown would be worse UX (extra tap).

## Verification

1. `npm run build` — no TS/compilation errors
2. `npm run dev` — check each page at 320px and 768px+:
   - `/analytics` — Select dropdown on mobile, 6-tab bar on desktop
   - `/projects/slo-calculator` — Select on mobile, grid tabs on desktop, `trackToolEvent` fires
   - `/projects/incident-command-diagrams` — Select on mobile, styled tabs on desktop, URL hash updates
3. Tab switching works identically in both modes (content panels show/hide correctly)
4. Accessibility: verify `aria-labelledby` on `TabsContent` resolves on mobile (sr-only triggers still in a11y tree)
5. MCP Chrome DevTools: responsive viewport test at 320px, 640px, 1024px
