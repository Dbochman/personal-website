# Plan: Add Crawlable Skills Section

## Goal

Make technical skills crawlable by search engines. Currently, skills are hidden inside collapsed `ExpertiseCard` components and only visible after user interaction. Search engines can't index content that requires JavaScript interaction to reveal.

## Non-Goals

- Replacing the existing ExpertiseCard accordion (it's a good UX pattern)
- Duplicating all content (just the skill keywords)
- Adding a separate "Skills" page (overkill for SEO purposes)

## Current State

Skills exist in `src/data/expertise.ts` but are rendered inside collapsed cards:

```
┌─────────────────────────────────────────────────────────────────┐
│  Sidebar                                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Core Expertise                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Site Reliability Engineering                    [+]       │ │
│  └───────────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Incident Command & Coordination                 [+]       │ │
│  └───────────────────────────────────────────────────────────┘ │
│  ...                                                            │
│                                                                 │
│  Skills hidden until card expanded:                             │
│  Terraform, Kubernetes, Prometheus, Datadog                     │
│  (not crawlable!)                                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Problem:** `ExpertiseCard.tsx` line 118-119:
```tsx
className={`hidden md:block overflow-hidden ... ${isExpanded ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}
```

Skills have `max-h-0 opacity-0` by default = invisible to crawlers.

## Existing Data Structure

**File:** `src/data/expertise.ts`

```ts
export const coreExpertise: ExpertiseItem[] = [
  {
    title: "Site Reliability Engineering",
    skills: ['Terraform', 'Kubernetes', 'Prometheus', 'Datadog']
  },
  {
    title: "Incident Command & Coordination",
    skills: ['Incident Command', 'Crisis Communication', 'Runbooks']
  },
  // ... 8 total items with skills arrays
];
```

**All unique skills (extracted):**
- Terraform, Kubernetes, Prometheus, Datadog
- Incident Command, Crisis Communication, Runbooks
- Root Cause Analysis, Blameless Retrospectives, Executive Reporting
- SLO/SLI Design, Error Budgets, Backstage, Alerting Strategy
- Facilitation, Action Item Tracking, Learning Culture
- Executive Updates, Customer Communication, Status Pages
- Chaos Engineering, Runbook Development, Onboarding
- Synthetic Testing, Automated Remediation, Observability

---

## Solution: Add Skills Summary to Sidebar

Add a visually-hidden but crawlable skills list below the expertise cards. This keeps the current UX while making skills indexable.

### Option A: Visually Hidden List (Minimal UI Change)

Add a `<ul>` with `sr-only` class that's read by screen readers and crawlers but not displayed:

**File:** `src/components/Sidebar.tsx` (after line 49, before closing `</CardContent>`)

```tsx
{/* Crawlable skills list - visible to search engines and screen readers */}
<div className="sr-only">
  <h4>Technical Skills</h4>
  <ul>
    {Array.from(new Set(coreExpertise.flatMap(item => item.skills))).map(skill => (
      <li key={skill}>{skill}</li>
    ))}
  </ul>
</div>
```

**Pros:** Zero visual change, immediate SEO benefit
**Cons:** Could be seen as cloaking (hidden text)

### Option B: Visible Skills Footer (Recommended)

Add a compact skills summary at the bottom of the Sidebar, always visible:

```
┌─────────────────────────────────────────────────────────────────┐
│  Core Expertise                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Site Reliability Engineering                              │ │
│  └───────────────────────────────────────────────────────────┘ │
│  ...                                                            │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Key Skills                                                │ │
│  │ Terraform • Kubernetes • Prometheus • Datadog •           │ │
│  │ SLO/SLI Design • Error Budgets • Incident Command •       │ │
│  │ Root Cause Analysis • Chaos Engineering • Observability   │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation (Option B)

### Step 1: Extract Unique Skills Helper

**File:** `src/data/expertise.ts` (add at bottom)

```ts
// Extract all unique skills from expertise items
export const allSkills = Array.from(
  new Set(coreExpertise.flatMap(item => item.skills))
).sort();
```

### Step 2: Update Sidebar Component

**File:** `src/components/Sidebar.tsx`

```diff
  import { coreExpertise } from "@/data/expertise";
+ import { allSkills } from "@/data/expertise";
  import { ExpertiseCard } from "./ExpertiseCard";
```

After the expertise cards (line 48), before closing `</CardContent>`:

```tsx
{/* Skills Summary - Always visible for SEO */}
<div className="mt-6 pt-4 border-t border-foreground/10">
  <h4 className="text-xs font-medium text-foreground/60 mb-2">
    Key Skills
  </h4>
  <p className="text-xs text-foreground/80 leading-relaxed">
    {allSkills.join(' • ')}
  </p>
</div>
```

### Step 3: Full Sidebar.tsx Diff

```diff
  return (
    <div className="lg:sticky lg:top-24 space-y-6">
      {/* Core Expertise Card */}
      <Card className="bg-background/60 backdrop-blur-sm border-transparent">
        <CardContent className="p-6">
          <h3 className="text-lg font-bold text-foreground mb-6">Core Expertise</h3>
          <motion.div
            className="space-y-2"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            {coreExpertise.map((item, index) => (
              <motion.div key={index} variants={staggerItem}>
                <ExpertiseCard
                  item={item}
                  index={index}
                  isExpanded={expandedIndices.has(index)}
                  onExpand={() => handleExpand(index)}
                  onCollapse={() => handleCollapse(index)}
                />
              </motion.div>
            ))}
          </motion.div>
+
+         {/* Skills Summary - Always visible for SEO */}
+         <div className="mt-6 pt-4 border-t border-foreground/10">
+           <h4 className="text-xs font-medium text-foreground/60 mb-2">
+             Key Skills
+           </h4>
+           <p className="text-xs text-foreground/80 leading-relaxed">
+             {allSkills.join(' • ')}
+           </p>
+         </div>
        </CardContent>
      </Card>
    </div>
  );
```

---

## After State

```
┌─────────────────────────────────────────────────────────────────┐
│  Core Expertise                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Site Reliability Engineering                              │ │
│  │ Incident Command & Coordination                           │ │
│  │ Post-Incident Analysis and Reporting                      │ │
│  │ SLO Monitoring and Strategy                               │ │
│  │ ... (expandable cards)                                    │ │
│  └───────────────────────────────────────────────────────────┘ │
│  ─────────────────────────────────────────────────────────────  │
│  Key Skills                                                     │
│  Alerting Strategy • Automated Remediation • Backstage •       │
│  Blameless Retrospectives • Chaos Engineering • Crisis         │
│  Communication • Customer Communication • Datadog • Error      │
│  Budgets • Executive Reporting • Executive Updates •           │
│  Facilitation • Incident Command • Kubernetes • Learning       │
│  Culture • Observability • Onboarding • Prometheus • Root      │
│  Cause Analysis • Runbook Development • Runbooks • SLO/SLI     │
│  Design • Status Pages • Synthetic Testing • Terraform         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Testing

### 1. Visual Check
```bash
npm run dev
# Open http://localhost:5173
# Verify "Key Skills" section appears below expertise cards
# Verify all skills are visible without interaction
```

### 2. View Source Check
```bash
# Right-click → View Page Source
# Ctrl+F for "Terraform" - should appear in visible text
# Ctrl+F for "Kubernetes" - should appear in visible text
```

### 3. Lighthouse SEO
```bash
npm run build && npm run preview
# Run Lighthouse > SEO
# No issues about hidden content
```

### 4. Mobile Check
```bash
# Open DevTools → Toggle device toolbar
# Verify skills section is readable on mobile
```

---

## Checklist

- [ ] Add `allSkills` export to `src/data/expertise.ts` (line ~62)
- [ ] Import `allSkills` in `src/components/Sidebar.tsx` (line 5)
- [ ] Add skills summary section to Sidebar (after line 48)
- [ ] Verify skills render in page source without JS
- [ ] Check mobile layout
- [ ] Run Lighthouse SEO audit

---

## Alternative: Structured Data Enhancement

For extra SEO, add skills to the Person JSON-LD in `index.html`:

```diff
  "knowsAbout": [
    "Site Reliability Engineering",
    "Incident Management",
    "DevOps",
    "System Reliability",
    "Post-Incident Analysis",
-   "SLO Monitoring"
+   "SLO Monitoring",
+   "Kubernetes",
+   "Terraform",
+   "Prometheus",
+   "Chaos Engineering"
  ],
```

This is complementary to the visible skills section.

---

## Effort

~30 minutes implementation + ~15 minutes testing
