# Plan: Create Dedicated About Page

## Goal

Create a standalone `/about` page with detailed biography, SRE terminology, and career history. This provides more crawlable content for "SRE portfolio" searches and gives visitors a deeper look at Dylan's background.

## Non-Goals

- Duplicating all content from the home page
- Creating a generic "about me" page (needs SRE focus)
- Adding a photo gallery or personal details

## Current State

No dedicated About page exists. The home page has a brief bio in `HeroSection.tsx`:

```
"Specializing in Reliability, Resilience, and Incident Management,
with experience spanning SRE and Product Management at Groq,
HashiCorp, and Spotify."
```

This is too short for SEO purposes.

---

## Architecture

### Route Setup

**File:** `src/App.tsx`

```diff
+ const About = lazy(() => import("./pages/About"));

  <Routes>
    <Route path="/" element={<Index />} />
+   <Route path="/about" element={<About />} />
    <Route path="/blog" element={<Blog />} />
    ...
  </Routes>
```

### File Structure

```
src/pages/
├── About.tsx           # New page
├── Blog.tsx
├── Index.tsx
...
```

---

## Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Header (existing)                                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  About Dylan Bochman                                            │
│  ════════════════════                                           │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Site Reliability Engineer & Technical Incident Manager       ││
│  │                                                              ││
│  │ I specialize in building reliable systems and leading        ││
│  │ incident response at scale. Over 8+ years, I've developed    ││
│  │ SLO frameworks, built observability platforms, and managed   ││
│  │ hundreds of production incidents at Groq, HashiCorp, and     ││
│  │ Spotify.                                                     ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  Experience                                                     │
│  ──────────                                                     │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Groq (2023-Present)                                         ││
│  │ Technical Incident Manager                                   ││
│  │ • Built incident management from zero to maturity            ││
│  │ • Reduced MTTR by 40% through automated detection            ││
│  │ • Established blameless postmortem culture                   ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ HashiCorp (2021-2023)                                       ││
│  │ Site Reliability Engineer                                    ││
│  │ • Designed SLO framework for Terraform Cloud                 ││
│  │ • Built multi-region observability with Datadog              ││
│  │ • Led incident response for critical infrastructure          ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Spotify (2017-2021)                                         ││
│  │ Site Reliability Engineer                                    ││
│  │ • Maintained 99.99% availability for music streaming         ││
│  │ • Pioneered chaos engineering practices                      ││
│  │ • Mentored junior SREs on incident response                  ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  Philosophy                                                     │
│  ──────────                                                     │
│  • Error budgets over uptime targets                            │
│  • Blameless retrospectives over root cause hunting             │
│  • Automated detection over manual monitoring                   │
│  • Learning culture over incident counts                        │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ [Request Resume]  [LinkedIn]  [GitHub]                      ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  Footer (existing)                                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation

### Step 1: Create About.tsx

**File:** `src/pages/About.tsx`

```tsx
import { Helmet } from 'react-helmet-async';
import PageLayout from '@/components/layout/PageLayout';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Linkedin, Github, FileDown } from 'lucide-react';

export default function About() {
  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "Dylan Bochman",
    "url": "https://dylanbochman.com/about",
    "jobTitle": "Site Reliability Engineer & Technical Incident Manager",
    "worksFor": { "@type": "Organization", "name": "Groq" },
    "alumniOf": [
      { "@type": "Organization", "name": "HashiCorp" },
      { "@type": "Organization", "name": "Spotify" }
    ],
    "knowsAbout": [
      "Site Reliability Engineering", "Incident Management",
      "SLOs", "SLIs", "Error Budgets", "Kubernetes", "Terraform",
      "Prometheus", "Observability", "Chaos Engineering"
    ],
    "sameAs": [
      "https://www.linkedin.com/in/dylanbochman",
      "https://github.com/dbochman",
      "https://twitter.com/dylanbochman"
    ]
  };

  return (
    <>
      <Helmet>
        <title>About - Dylan Bochman | SRE Portfolio</title>
        <meta
          name="description"
          content="Learn about Dylan Bochman, Site Reliability Engineer and Technical Incident Manager with experience at Groq, HashiCorp, and Spotify. Specializing in SLOs, incident management, and reliability engineering."
        />
        <meta
          name="keywords"
          content="Site Reliability Engineer, SRE, Technical Incident Manager, Dylan Bochman, Groq, HashiCorp, Spotify, SLO, Incident Management"
        />
        <link rel="canonical" href="https://dylanbochman.com/about" />

        {/* Open Graph */}
        <meta property="og:type" content="profile" />
        <meta property="og:url" content="https://dylanbochman.com/about" />
        <meta property="og:title" content="About Dylan Bochman | SRE Portfolio" />
        <meta property="og:description" content="Site Reliability Engineer and Technical Incident Manager with experience at Groq, HashiCorp, and Spotify." />

        {/* JSON-LD */}
        <script type="application/ld+json">
          {JSON.stringify(personSchema)}
        </script>
      </Helmet>

      <PageLayout>
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          {/* Hero */}
          <header className="mb-12">
            <h1 className="text-4xl font-bold mb-4">About Dylan Bochman</h1>
            <p className="text-xl text-muted-foreground">
              Site Reliability Engineer & Technical Incident Manager
            </p>
          </header>

          {/* Bio */}
          <section className="mb-12">
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <p>
                I specialize in building reliable systems and leading incident response at scale.
                Over 8+ years in Site Reliability Engineering and Incident Management, I've developed
                SLO frameworks, built observability platforms, and managed hundreds of production
                incidents at <strong>Groq</strong>, <strong>HashiCorp</strong>, and <strong>Spotify</strong>.
              </p>
              <p>
                My approach to reliability centers on <em>error budgets over uptime targets</em>,
                <em>blameless retrospectives over root cause hunting</em>, and
                <em>automated detection over manual monitoring</em>.
              </p>
            </div>
          </section>

          {/* Experience */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Experience</h2>

            <div className="space-y-8">
              {/* Groq */}
              <div className="border-l-2 border-foreground/20 pl-6">
                <h3 className="text-lg font-semibold">Technical Incident Manager</h3>
                <p className="text-muted-foreground mb-2">Groq • 2023 - Present</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Built incident management program from zero to maturity</li>
                  <li>Reduced MTTR by 40% through automated detection and response</li>
                  <li>Established blameless postmortem culture across engineering</li>
                  <li>Developed SLO framework for AI inference infrastructure</li>
                </ul>
              </div>

              {/* HashiCorp */}
              <div className="border-l-2 border-foreground/20 pl-6">
                <h3 className="text-lg font-semibold">Site Reliability Engineer</h3>
                <p className="text-muted-foreground mb-2">HashiCorp • 2021 - 2023</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Designed and implemented SLO framework for Terraform Cloud</li>
                  <li>Built multi-region observability platform with Datadog</li>
                  <li>Led incident response for critical cloud infrastructure</li>
                  <li>Championed Terraform-based infrastructure as code practices</li>
                </ul>
              </div>

              {/* Spotify */}
              <div className="border-l-2 border-foreground/20 pl-6">
                <h3 className="text-lg font-semibold">Site Reliability Engineer</h3>
                <p className="text-muted-foreground mb-2">Spotify • 2017 - 2021</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Maintained 99.99% availability for music streaming services</li>
                  <li>Pioneered chaos engineering and game day practices</li>
                  <li>Built service monitoring dashboards with Prometheus/Grafana</li>
                  <li>Mentored junior SREs on incident response best practices</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Skills */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Technical Skills</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Monitoring</h3>
                <p className="text-muted-foreground text-sm">
                  Prometheus, Grafana, Datadog, PagerDuty
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Infrastructure</h3>
                <p className="text-muted-foreground text-sm">
                  Kubernetes, Terraform, AWS, GCP
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Practices</h3>
                <p className="text-muted-foreground text-sm">
                  SLOs/SLIs, Error Budgets, Chaos Engineering
                </p>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="flex flex-wrap gap-4">
            <Button asChild>
              <a href="/resume.pdf" download>
                <FileDown className="w-4 h-4 mr-2" />
                Download Resume
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href="https://www.linkedin.com/in/dbochman/" target="_blank" rel="noopener noreferrer">
                <Linkedin className="w-4 h-4 mr-2" />
                LinkedIn
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href="https://github.com/dbochman" target="_blank" rel="noopener noreferrer">
                <Github className="w-4 h-4 mr-2" />
                GitHub
              </a>
            </Button>
          </section>
        </div>
        <Footer />
      </PageLayout>
    </>
  );
}
```

### Step 2: Add Route to App.tsx

**File:** `src/App.tsx`

```diff
  const Blog = lazy(() => import("./pages/Blog"));
  const BlogPost = lazy(() => import("./pages/BlogPost"));
+ const About = lazy(() => import("./pages/About"));
  const Projects = lazy(() => import("./pages/Projects"));

  ...

  <Routes>
    <Route path="/" element={<Index />} />
+   <Route path="/about" element={<About />} />
    <Route path="/blog" element={<Blog />} />
```

### Step 3: Add Navigation Link

**File:** `src/data/navigation.ts` (or Header component)

Add "About" to the main navigation:

```diff
  export const navigation = [
    { name: 'Home', href: '/' },
+   { name: 'About', href: '/about' },
    { name: 'Blog', href: '/blog' },
    { name: 'Projects', href: '/projects' },
  ];
```

### Step 4: Update Sitemap

**File:** `public/sitemap.xml`

```diff
+ <url>
+   <loc>https://dylanbochman.com/about</loc>
+   <lastmod>2026-01-20</lastmod>
+   <changefreq>monthly</changefreq>
+   <priority>0.9</priority>
+ </url>
```

---

## SEO Keywords to Include Naturally

Throughout the page content, use these terms:
- Site Reliability Engineer / SRE
- Technical Incident Manager
- SLO / SLI / SLA
- Error budgets
- MTTR / MTTD
- Incident management
- Blameless postmortem
- Observability
- Chaos engineering
- Kubernetes, Terraform, Prometheus

---

## Testing

### 1. Route Check
```bash
npm run dev
# Navigate to http://localhost:5173/about
# Verify page renders without errors
```

### 2. SEO Check
```bash
# View page source
# Verify JSON-LD schema is present
# Verify meta description contains "SRE"
```

### 3. Navigation Check
```bash
# Click "About" in header nav
# Verify it navigates to /about
```

### 4. Rich Results Test
After deploy:
1. Go to https://search.google.com/test/rich-results
2. Enter `https://dylanbochman.com/about`
3. Verify Person schema detected

---

## Checklist

- [ ] Create `src/pages/About.tsx` with full content
- [ ] Add lazy import in `src/App.tsx` (line ~29)
- [ ] Add route in `src/App.tsx` (after line 53)
- [ ] Add "About" to navigation in `src/data/navigation.ts`
- [ ] Add JSON-LD Person schema to page
- [ ] Update `public/sitemap.xml` with new URL
- [ ] Verify page renders correctly
- [ ] Test navigation link
- [ ] Run Lighthouse SEO audit

---

## Future Enhancements

- Add profile photo
- Add testimonials/recommendations
- Add certifications section
- Add speaking engagements / conference talks

---

## Effort

- **Implementation:** 1-2 hours
- **Content refinement:** 1 hour (Dylan to review/personalize)
- **Testing:** 30 minutes
