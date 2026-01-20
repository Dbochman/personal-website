# Plan: Write SRE-Focused Blog Posts

## Goal

Create 2-3 blog posts specifically targeting SRE-related search queries. Current blog content focuses on building this site and AI tooling. Adding incident management, SLO, and postmortem content will improve discoverability for "SRE portfolio" searches.

## Non-Goals

- Changing the blog infrastructure (it works fine)
- Writing generic "what is SRE?" content (plenty exists elsewhere)
- Keyword stuffing (write for humans first)

## Current State

The blog has 19 posts, mostly about building this site:

```
content/blog/
├── 2025-01-04-hello-world.txt
├── 2025-01-05-notes-on-building-this-site-together.txt
├── 2025-01-07-uptime-monitoring-for-a-personal-site.txt
├── 2025-01-07-writing-a-runbook-for-my-personal-website.txt
├── 2025-01-08-fixing-404-errors-on-github-pages-spas.txt
├── 2026-01-09-adding-a-cms-to-a-static-site.txt
├── 2026-01-10-architecture-of-a-free-website.txt
├── 2026-01-10-automating-the-blog-itself.txt
├── 2026-01-10-theme-persistence-and-the-code-reviewer-who-never-sleeps.txt
├── 2026-01-11-shaving-minutes-off-deploys.txt
├── 2026-01-13-building-interactive-sre-tools.txt    ← SRE-adjacent
├── 2026-01-13-on-call-coverage-model-explorer.txt   ← SRE-adjacent
├── 2026-01-13-slo-uptime-calculator.txt             ← SRE-adjacent
├── 2026-01-13-status-page-update-generator.txt      ← SRE-adjacent
├── 2026-01-14-the-site-that-plans-itself.txt
├── 2026-01-15-free-observability-for-a-static-site.txt
├── 2026-01-15-the-ai-code-reviewer-who-reviews-ai-code.txt
├── 2026-01-15-the-serverless-kanban.txt
└── 2026-01-16-using-a-kanban-board-to-talk-to-my-ai.txt
```

The SRE-adjacent posts describe tools, not practices. We need content about incident management, SLOs, and postmortems from an experienced practitioner's perspective.

---

## Blog Post Format

Posts live in `content/blog/` as `.txt` files with YAML frontmatter:

```yaml
---
title: "Post Title Here"
date: "2026-01-XX"
author: Dylan Bochman
description: "One-sentence description for meta tags and cards."
tags:
  - SRE
  - Incident Management
category: Technical
draft: false
---
```

**File naming convention:** `YYYY-MM-DD-slug-with-dashes.txt`

---

## Post 1: Incident Response Lessons

### Target Keywords
- incident management best practices
- incident response SRE
- on-call incident response

### File
`content/blog/2026-01-XX-lessons-from-hundreds-of-incidents.txt`

### Frontmatter
```yaml
---
title: "What Hundreds of Incidents Taught Me About Response"
date: "2026-01-XX"
author: Dylan Bochman
description: "Practical incident response lessons from years at Groq, HashiCorp, and Spotify. What actually works when systems fail."
tags:
  - SRE
  - Incident Management
  - Incident Response
category: Technical
draft: false
---
```

### Outline

```markdown
# What Hundreds of Incidents Taught Me About Response

*After managing incidents at Groq, HashiCorp, and Spotify, patterns emerge.
Here's what I wish I knew on day one.*

## The 80/20 of incident response

Most incidents resolve the same way. The exotic failures are memorable but rare.
Optimize for the common case.

## Lesson 1: Slow down to speed up

The first 5 minutes set the tone. Rushing to "fix" before understanding causes...
[Dylan's specific example from Groq/HashiCorp/Spotify]

## Lesson 2: Communication is mitigation

Customers tolerate downtime better than silence. A status update every 15 minutes...
[Example of good vs bad communication timing]

## Lesson 3: The war room is a crutch

10 people in a Zoom watching 1 person type doesn't parallelize work...
[How to actually parallelize incident response]

## Lesson 4: Your runbook is lying to you

Runbooks written after an incident solve *that* incident. They age immediately...
[How to keep runbooks honest]

## Lesson 5: Metrics that matter during incidents

MTTR is a lagging indicator. During the incident, track...
[Real metrics Dylan uses]

## The meta-lesson

Incidents are practice for larger failures. Treat every incident as training...
```

---

## Post 2: SLO Implementation Lessons

### Target Keywords
- SLO implementation
- SLO vs SLA vs SLI
- error budget management

### File
`content/blog/2026-01-XX-slo-lessons-from-the-trenches.txt`

### Frontmatter
```yaml
---
title: "SLO Lessons from the Trenches"
date: "2026-01-XX"
author: Dylan Bochman
description: "What I learned implementing SLOs at Groq, HashiCorp, and Spotify. The theory is simple; the practice is not."
tags:
  - SRE
  - SLO
  - SLI
  - Reliability
category: Technical
draft: false
---
```

### Outline

```markdown
# SLO Lessons from the Trenches

*SLO theory fits on a napkin. SLO practice fills a war room.
Here's what the books don't tell you.*

## The napkin version

SLI measures service health. SLO sets the target. SLA adds consequences.
Simple.

## Reality check 1: Choosing the right SLI

"Availability" sounds obvious until you try to measure it...
[Dylan's examples of SLI debates at past companies]

## Reality check 2: Setting defensible targets

"99.9% sounds good" is how most SLOs get set. Here's what actually works...
[How to derive SLOs from user expectations, not aspirations]

## Reality check 3: Error budgets are political

When the budget runs out, who decides what gets cut? If you haven't...
[Real example of error budget negotiation]

## Reality check 4: SLOs need burn rate alerting

Alerting on threshold (e.g., below 99.9%) fires too late. Burn rate...
[Practical burn rate alerting config]

## Reality check 5: Review cadence matters

Monthly SLO reviews decay into status meetings. Weekly is too frequent...
[What cadence actually works and why]

## The tool that helped

I built an [SLO Calculator](/projects/slo-tool) to make these tradeoffs
visible. It answers "can my team actually sustain this target?"...
```

---

## Post 3: Postmortem Culture

### Target Keywords
- blameless postmortem
- writing postmortems
- postmortem culture SRE

### File
`content/blog/2026-01-XX-postmortems-that-actually-change-things.txt`

### Frontmatter
```yaml
---
title: "Postmortems That Actually Change Things"
date: "2026-01-XX"
author: Dylan Bochman
description: "How to write postmortems that lead to action, not just documentation. Lessons from building postmortem culture at three companies."
tags:
  - SRE
  - Postmortem
  - Incident Analysis
  - Learning Culture
category: Technical
draft: false
---
```

### Outline

```markdown
# Postmortems That Actually Change Things

*Most postmortems document what happened. Few change what will happen.
Here's how to write the second kind.*

## The postmortem trap

The document gets filed. Action items enter a backlog. Nothing changes.
Six months later, the same incident happens again...

## Principle 1: Blameless ≠ toothless

"Blameless" doesn't mean "no accountability." It means...
[How to balance psychological safety with improvement]

## Principle 2: The 5 Whys lie

Root cause analysis assumes a single root. Complex systems fail for
multiple interacting reasons. Instead of 5 Whys...
[Alternative: contributing factors framework]

## Principle 3: Action items need owners and deadlines

"Improve monitoring" is not an action item. "Add latency histogram
for /api/checkout by Jan 31 (owner: Alex)" is...
[Template for actionable action items]

## Principle 4: Follow-up is part of the postmortem

Schedule the review meeting *during* the postmortem meeting...
[How to ensure follow-through]

## Principle 5: Share widely, even the embarrassing ones

The best learning comes from incidents where "we should have known better"...
[How to create safety for sharing failures]

## A template that works

After iterating across three companies, here's the structure...
[Dylan's actual postmortem template]
```

---

## Internal Linking Strategy

Each post should link to:
1. **Related SRE tools** - `/projects/slo-tool`, `/projects/oncall-coverage`, `/projects/statuspage-update`
2. **Related blog posts** - Cross-link between the three new posts
3. **External authority** - Google SRE book, incident.io blog, etc.

Example internal links:
```markdown
I built an [SLO Calculator](/projects/slo-tool) to visualize these tradeoffs.

For more on incident communication, see my post on
[Status Page Updates](/blog/status-page-update-generator).

The [On-Call Coverage Explorer](/projects/oncall-coverage) shows how different
rotation models affect sustainable incident response.
```

---

## SEO Verification

After publishing, verify:

1. **Google Search Console** - Submit URLs for indexing
2. **Title/description length** - Title < 60 chars, description < 160 chars
3. **Keyword presence** - Target keyword in title, first paragraph, and H2s
4. **Internal links** - At least 2-3 internal links per post
5. **Image alt text** - If adding diagrams, include descriptive alt text

---

## Checklist

### Post 1: Incident Response
- [ ] Create `content/blog/2026-01-XX-lessons-from-hundreds-of-incidents.txt`
- [ ] Write frontmatter with correct tags
- [ ] Draft content with personal examples from Groq/HashiCorp/Spotify
- [ ] Add internal links to SRE tools
- [ ] Set `draft: false` when ready
- [ ] Verify renders correctly in dev server

### Post 2: SLO Lessons
- [ ] Create `content/blog/2026-01-XX-slo-lessons-from-the-trenches.txt`
- [ ] Write frontmatter with SLO-related tags
- [ ] Draft content with specific SLO examples
- [ ] Link to `/projects/slo-tool`
- [ ] Set `draft: false` when ready
- [ ] Verify renders correctly in dev server

### Post 3: Postmortem Culture
- [ ] Create `content/blog/2026-01-XX-postmortems-that-actually-change-things.txt`
- [ ] Write frontmatter with postmortem tags
- [ ] Draft content with postmortem template
- [ ] Cross-link to other two posts
- [ ] Set `draft: false` when ready
- [ ] Verify renders correctly in dev server

### Post-Publish
- [ ] Submit URLs to Google Search Console
- [ ] Share on LinkedIn with SRE hashtags
- [ ] Monitor Search Console for impressions

---

## Effort

- **Content drafting:** 2-3 hours per post (Dylan's time for authentic content)
- **Formatting/publishing:** 30 minutes per post
- **Total:** ~8-10 hours for all three posts
