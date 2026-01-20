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
