# Career Timeline Plan

## Overview

Create an interactive career timeline showing work history, key achievements, and skill development over time. Visual representation of professional journey.

## Design Options

### Option A: Vertical Timeline (Recommended)

- Chronological scroll
- Mobile-friendly
- Room for details
- Common pattern

### Option B: Horizontal Timeline

- Compact overview
- Requires scroll on mobile
- Good for limited entries

### Option C: Interactive Cards

- Expandable details
- Filter by type (job, project, achievement)
- More complex interaction

## Data Structure

**File:** `src/data/career.ts`

```ts
export type EntryType = 'job' | 'education' | 'achievement' | 'project';

export interface CareerEntry {
  id: string;
  type: EntryType;
  title: string;
  organization: string;
  location?: string;
  startDate: string;  // YYYY-MM
  endDate?: string;   // YYYY-MM or 'present'
  description: string;
  highlights?: string[];
  skills?: string[];
  logo?: string;  // URL or icon name
}

export const careerEntries: CareerEntry[] = [
  {
    id: 'current-role',
    type: 'job',
    title: 'Senior Site Reliability Engineer',
    organization: 'Example Corp',
    location: 'Remote',
    startDate: '2022-01',
    endDate: 'present',
    description: 'Leading SRE practices for platform reliability and developer productivity.',
    highlights: [
      'Reduced incident response time by 40%',
      'Implemented SLO framework across 50+ services',
      'Built internal on-call tooling',
    ],
    skills: ['Kubernetes', 'Prometheus', 'Terraform'],
  },
  {
    id: 'prev-role',
    type: 'job',
    title: 'DevOps Engineer',
    organization: 'Previous Inc',
    startDate: '2019-06',
    endDate: '2021-12',
    description: 'Infrastructure automation and CI/CD pipeline development.',
    highlights: [
      'Migrated 200+ services to Kubernetes',
      'Reduced deploy time from 30min to 5min',
    ],
    skills: ['AWS', 'Docker', 'Jenkins'],
  },
  // ... more entries
];
```

## Implementation

### Phase 1: Timeline Component

**File:** `src/components/career/CareerTimeline.tsx`

```tsx
import { careerEntries, type CareerEntry } from '@/data/career';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const typeStyles = {
  job: 'border-l-blue-500',
  education: 'border-l-green-500',
  achievement: 'border-l-yellow-500',
  project: 'border-l-purple-500',
};

function formatDateRange(start: string, end?: string) {
  const startDate = new Date(start + '-01');
  const startStr = startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  if (!end) return startStr;
  if (end === 'present') return `${startStr} - Present`;

  const endDate = new Date(end + '-01');
  const endStr = endDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  return `${startStr} - ${endStr}`;
}

export function CareerTimeline() {
  // Sort by start date, newest first
  const sortedEntries = [...careerEntries].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

      {/* Entries */}
      <div className="space-y-8">
        {sortedEntries.map((entry) => (
          <TimelineEntry key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  );
}

function TimelineEntry({ entry }: { entry: CareerEntry }) {
  return (
    <div className="relative pl-12">
      {/* Timeline dot */}
      <div className="absolute left-2.5 w-3 h-3 rounded-full bg-primary border-2 border-background" />

      {/* Content card */}
      <div
        className={cn(
          'p-4 rounded-lg border-l-4 bg-card',
          typeStyles[entry.type]
        )}
      >
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <h3 className="font-semibold text-lg">{entry.title}</h3>
          <Badge variant="outline" className="text-xs">
            {entry.type}
          </Badge>
        </div>

        <div className="text-muted-foreground text-sm mb-2">
          {entry.organization}
          {entry.location && ` • ${entry.location}`}
        </div>

        <div className="text-sm text-muted-foreground mb-3">
          {formatDateRange(entry.startDate, entry.endDate)}
        </div>

        <p className="text-sm mb-3">{entry.description}</p>

        {entry.highlights && (
          <ul className="list-disc list-inside text-sm space-y-1 mb-3">
            {entry.highlights.map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ul>
        )}

        {entry.skills && (
          <div className="flex flex-wrap gap-1">
            {entry.skills.map((skill) => (
              <Badge key={skill} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

### Phase 2: Filter Controls

```tsx
const [typeFilter, setTypeFilter] = useState<EntryType | 'all'>('all');

const filteredEntries = typeFilter === 'all'
  ? sortedEntries
  : sortedEntries.filter((e) => e.type === typeFilter);

// Filter buttons
<div className="flex gap-2 mb-6">
  {['all', 'job', 'education', 'achievement', 'project'].map((type) => (
    <button
      key={type}
      onClick={() => setTypeFilter(type as any)}
      className={cn(
        'px-3 py-1 rounded-full text-sm capitalize',
        typeFilter === type
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted hover:bg-muted/80'
      )}
    >
      {type === 'all' ? 'All' : type}
    </button>
  ))}
</div>
```

### Phase 3: Experience Page

**File:** `src/pages/Experience.tsx`

```tsx
import { Helmet } from 'react-helmet-async';
import PageLayout from '@/components/layout/PageLayout';
import { Footer } from '@/components/layout/Footer';
import { CareerTimeline } from '@/components/career/CareerTimeline';

export default function Experience() {
  return (
    <>
      <Helmet>
        <title>Experience - Dylan Bochman</title>
        <meta name="description" content="Dylan Bochman's career timeline and work history" />
      </Helmet>

      <PageLayout>
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold mb-4">Career Timeline</h1>
            <p className="text-muted-foreground mb-8">
              My professional journey in software engineering and SRE.
            </p>

            <CareerTimeline />

            <div className="mt-16">
              <Footer />
            </div>
          </div>
        </div>
      </PageLayout>
    </>
  );
}
```

### Phase 4: Scroll Animations (Optional)

With Framer Motion:

```tsx
import { motion, useInView } from 'framer-motion';

function TimelineEntry({ entry }: { entry: CareerEntry }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -20 }}
      animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
      transition={{ duration: 0.4 }}
      className="relative pl-12"
    >
      {/* ... */}
    </motion.div>
  );
}
```

## Accessibility

- Semantic HTML (article, time elements)
- Proper heading hierarchy
- Screen reader friendly date formatting
- Focus management for filter changes
- Color not sole indicator of entry type

```tsx
<article aria-label={`${entry.type}: ${entry.title} at ${entry.organization}`}>
  <time dateTime={entry.startDate}>
    {formatDateRange(entry.startDate, entry.endDate)}
  </time>
</article>
```

## Files to Create/Modify

```
src/data/career.ts                     # Career data
src/components/career/CareerTimeline.tsx
src/pages/Experience.tsx               # Optional dedicated page
src/App.tsx                            # Add route if page created
```

## Verification

1. Timeline renders with all entries
2. Entries sorted newest first
3. Type filters work correctly
4. Date ranges display properly
5. Responsive layout on mobile
6. Screen reader reads entries meaningfully
7. Animations work (if implemented)

## Effort

**Estimate**: Medium

- Data structure: 30 min (actual content takes longer)
- Timeline component: 45 min
- Filters: 20 min
- Experience page: 20 min
- Animations: 30 min (optional)
- Accessibility: 20 min
- Content population: Variable

## Dependencies

- Could pair with Skills visualization (link skills to timeline)
- Could pair with Framer Motion for animations
- No external dependencies required
