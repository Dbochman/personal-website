# Plan: Add SRE Keywords to Title/Meta/H1

## Goal

Add "Site Reliability Engineer" and "SRE" keywords to visible content. Currently the site emphasizes "Technical Incident Manager" but hiring managers often search for "SRE portfolio" or "Site Reliability Engineer."

## Non-Goals

- Keyword stuffing or unnatural phrasing
- Changing the JSON-LD schema (covered in plan 52)
- Adding new pages (covered in plan 54)

## Current State

The title and meta description focus on "Technical Incident Manager":

```
┌─────────────────────────────────────────────────────────────────┐
│  Tab: Dylan Bochman - Technical Incident Manager                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                     Dylan Bochman                               │
│              Technical Incident Manager    ← No "SRE" here      │
│                                                                 │
│  "Specializing in Reliability, Resilience, and Incident         │
│   Management, with experience spanning SRE..."  ← SRE mentioned │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Files to Modify

| File | Line | Change |
|------|------|--------|
| `index.html` | 43 | Update `<title>` |
| `index.html` | 50 | Update `<meta name="description">` |
| `index.html` | 54-55 | Update OG title/description |
| `index.html` | 82 | Update JSON-LD jobTitle |
| `src/components/Seo.tsx` | 20-36 | Reorder default keywords |
| `src/components/sections/HeroSection.tsx` | 32, 41 | Update role text |

---

## Change 1: index.html Title and Meta

**File:** `index.html`

### Line 43 - Title
```diff
- <title>Dylan Bochman - Technical Incident Manager</title>
+ <title>Dylan Bochman - Site Reliability Engineer & Incident Manager</title>
```

### Line 50 - Meta Description
```diff
- <meta name="description" content="Technical Incident Manager and Former SRE / PM specializing in Reliability and Incident Management. Experience at Groq, HashiCorp and Spotify." />
+ <meta name="description" content="Site Reliability Engineer (SRE) and Technical Incident Manager specializing in reliability, incident management, and SLO monitoring. Experience at Groq, HashiCorp, and Spotify." />
```

### Lines 54-55 - Open Graph
```diff
- <meta property="og:title" content="Dylan Bochman - Technical Incident Manager" />
- <meta property="og:description" content="Technical Incident Manager and Former SRE / PM specializing in Reliability and Incident Management. Experience at Groq, HashiCorp and Spotify." />
+ <meta property="og:title" content="Dylan Bochman - Site Reliability Engineer & Incident Manager" />
+ <meta property="og:description" content="Site Reliability Engineer (SRE) and Technical Incident Manager specializing in reliability, incident management, and SLO monitoring. Experience at Groq, HashiCorp, and Spotify." />
```

### Line 82 - JSON-LD jobTitle
```diff
- "jobTitle": "Technical Incident Manager",
+ "jobTitle": "Site Reliability Engineer & Technical Incident Manager",
```

---

## Change 2: Seo.tsx Default Keywords

**File:** `src/components/Seo.tsx` (lines 20-36)

Reorder to lead with "Site Reliability Engineer" (noun, what people search) before "Site Reliability Engineering" (gerund):

```tsx
const defaultKeywords = [
  'Site Reliability Engineer',        // ← Add: the job title people search
  'SRE',
  'SRE Portfolio',                    // ← Add: common search term
  'Site Reliability Engineering',
  'Technical Incident Manager',
  'Incident Management',
  'Groq',
  'HashiCorp',
  'Spotify',
  'Post-Incident Analysis',
  'SLO Monitoring',
  'Operational Readiness',
  'Infrastructure Reliability',
  'DevOps',
  'System Reliability',
  'Incident Response',
  'Dylan Bochman'
];
```

---

## Change 3: HeroSection.tsx Role Text

**File:** `src/components/sections/HeroSection.tsx`

### Lines 31-32 - Main heading
```diff
  <h2 className="text-6xl font-bold text-foreground mb-2 leading-tight font-mono tracking-tighter">
    Dylan Bochman<br />
-   <span className="block opacity-0 animate-fade-in-delay text-foreground/80 text-4xl">
-     Technical Incident Manager
+   <span className="block opacity-0 animate-fade-in-delay text-foreground/80 text-3xl">
+     Site Reliability Engineer & Incident Manager
    </span>
  </h2>
```

Note: Changed `text-4xl` to `text-3xl` to accommodate longer text.

### Lines 40-42 - Ghost/shadow text (mirrors main heading)
```diff
  <div
    className="absolute inset-0 text-6xl font-bold text-foreground/20 mb-2 leading-tight font-mono tracking-tighter animate-pulse"
    style={{ transform: 'translate(2px, 2px)' }}
  >
    Dylan Bochman<br />
-   <span className="block opacity-0 animate-fade-in-delay text-foreground/20 text-4xl">
-     Technical Incident Manager
+   <span className="block opacity-0 animate-fade-in-delay text-foreground/20 text-3xl">
+     Site Reliability Engineer & Incident Manager
    </span>
  </div>
```

---

## After State

```
┌─────────────────────────────────────────────────────────────────┐
│  Tab: Dylan Bochman - Site Reliability Engineer & Incident...   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                     Dylan Bochman                               │
│        Site Reliability Engineer & Incident Manager             │
│                                                                 │
│  "Specializing in Reliability, Resilience, and Incident         │
│   Management, with experience spanning SRE..."                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Testing

### 1. Visual Check
```bash
npm run dev
# Open http://localhost:5173
# Verify:
# - Browser tab shows new title
# - Hero section shows "Site Reliability Engineer & Incident Manager"
# - Text fits on one line (may need font size adjustment)
```

### 2. SEO Audit
```bash
npm run build && npm run preview
# Run Lighthouse > SEO
# Check title and meta description appear correctly
```

### 3. View Source Validation
- Right-click → View Page Source
- Search for "Site Reliability Engineer" - should appear in:
  - `<title>`
  - `<meta name="description">`
  - `<meta property="og:title">`
  - `<meta property="og:description">`
  - JSON-LD `jobTitle`

### 4. Rich Results Test
- Go to https://search.google.com/test/rich-results
- Enter `https://dylanbochman.com`
- Verify Person schema shows updated jobTitle

---

## Checklist

- [ ] Update `<title>` in index.html (line 43)
- [ ] Update `<meta name="description">` in index.html (line 50)
- [ ] Update OG title/description in index.html (lines 54-55)
- [ ] Update JSON-LD jobTitle in index.html (line 82)
- [ ] Reorder keywords in Seo.tsx (lines 20-36)
- [ ] Update HeroSection heading text (lines 31-32)
- [ ] Update HeroSection shadow text (lines 40-42)
- [ ] Verify text fits without wrapping awkwardly
- [ ] Run Lighthouse SEO audit
- [ ] Test with Rich Results Test

---

## Effort

~20 minutes implementation + ~10 minutes testing
