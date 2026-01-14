# Skills Visualization Plan

## Overview

Create an interactive skills visualization to showcase technical expertise. Display skills by category with proficiency levels and relevant project connections.

## Visualization Options

### Option A: Radar/Spider Chart

- Shows multiple dimensions at once
- Good for comparing skill areas
- Can be crowded with many skills

### Option B: Skill Bars/Progress

- Familiar pattern
- Easy to scan
- Works well with categories

### Option C: Tag Cloud

- Compact
- Good for many skills
- Less precise (no levels)

### Option D: Interactive Grid (Recommended)

- Filterable by category
- Click to see related projects
- Responsive and accessible

## Data Structure

**File:** `src/data/skills.ts`

```ts
export type SkillCategory =
  | 'Languages'
  | 'Frameworks'
  | 'Infrastructure'
  | 'Observability'
  | 'Practices';

export type ProficiencyLevel = 'expert' | 'proficient' | 'familiar';

export interface Skill {
  name: string;
  category: SkillCategory;
  proficiency: ProficiencyLevel;
  yearsExperience?: number;
  icon?: string;  // Lucide icon name or custom SVG
  relatedProjects?: string[];  // Project slugs
}

export const skills: Skill[] = [
  // Languages
  { name: 'TypeScript', category: 'Languages', proficiency: 'expert', yearsExperience: 5 },
  { name: 'Python', category: 'Languages', proficiency: 'proficient', yearsExperience: 6 },
  { name: 'Go', category: 'Languages', proficiency: 'familiar', yearsExperience: 2 },

  // Frameworks
  { name: 'React', category: 'Frameworks', proficiency: 'expert' },
  { name: 'Node.js', category: 'Frameworks', proficiency: 'proficient' },
  { name: 'FastAPI', category: 'Frameworks', proficiency: 'proficient' },

  // Infrastructure
  { name: 'Kubernetes', category: 'Infrastructure', proficiency: 'expert' },
  { name: 'Terraform', category: 'Infrastructure', proficiency: 'proficient' },
  { name: 'AWS', category: 'Infrastructure', proficiency: 'proficient' },
  { name: 'GCP', category: 'Infrastructure', proficiency: 'familiar' },

  // Observability
  { name: 'Prometheus', category: 'Observability', proficiency: 'expert' },
  { name: 'Grafana', category: 'Observability', proficiency: 'expert' },
  { name: 'Datadog', category: 'Observability', proficiency: 'proficient' },

  // Practices
  { name: 'SRE', category: 'Practices', proficiency: 'expert' },
  { name: 'CI/CD', category: 'Practices', proficiency: 'expert' },
  { name: 'Incident Response', category: 'Practices', proficiency: 'expert' },
];
```

## Implementation

### Phase 1: Skills Grid Component

**File:** `src/components/skills/SkillsGrid.tsx`

```tsx
import { useState } from 'react';
import { skills, type SkillCategory } from '@/data/skills';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const categories: SkillCategory[] = [
  'Languages',
  'Frameworks',
  'Infrastructure',
  'Observability',
  'Practices',
];

const proficiencyColors = {
  expert: 'bg-green-500/20 text-green-500 border-green-500/50',
  proficient: 'bg-blue-500/20 text-blue-500 border-blue-500/50',
  familiar: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50',
};

export function SkillsGrid() {
  const [selectedCategory, setSelectedCategory] = useState<SkillCategory | 'all'>('all');

  const filteredSkills = selectedCategory === 'all'
    ? skills
    : skills.filter((s) => s.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Category filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory('all')}
          className={cn(
            'px-3 py-1 rounded-full text-sm',
            selectedCategory === 'all'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted hover:bg-muted/80'
          )}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={cn(
              'px-3 py-1 rounded-full text-sm',
              selectedCategory === cat
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80'
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Skills grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {filteredSkills.map((skill) => (
          <div
            key={skill.name}
            className="p-3 rounded-lg border bg-card hover:border-primary/50 transition-colors"
          >
            <div className="font-medium">{skill.name}</div>
            <Badge
              variant="outline"
              className={cn('mt-1 text-xs', proficiencyColors[skill.proficiency])}
            >
              {skill.proficiency}
            </Badge>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-green-500/50" />
          Expert
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-blue-500/50" />
          Proficient
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-yellow-500/50" />
          Familiar
        </span>
      </div>
    </div>
  );
}
```

### Phase 2: Skills Section on Homepage

**File:** `src/components/sections/SkillsSection.tsx`

```tsx
import { SkillsGrid } from '@/components/skills/SkillsGrid';

export function SkillsSection() {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-8">Skills & Technologies</h2>
        <SkillsGrid />
      </div>
    </section>
  );
}
```

### Phase 3: Optional - Radar Chart

Using Recharts (already installed):

```tsx
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts';

const radarData = [
  { category: 'Languages', level: 85 },
  { category: 'Frameworks', level: 80 },
  { category: 'Infrastructure', level: 90 },
  { category: 'Observability', level: 95 },
  { category: 'Practices', level: 90 },
];

function SkillsRadar() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={radarData}>
        <PolarGrid />
        <PolarAngleAxis dataKey="category" />
        <Radar
          dataKey="level"
          stroke="#3b82f6"
          fill="#3b82f6"
          fillOpacity={0.3}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
```

### Phase 4: Project Connections (Optional)

When skill clicked, show related projects:

```tsx
const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);

{selectedSkill?.relatedProjects && (
  <div className="mt-4 p-4 bg-muted rounded-lg">
    <h4 className="font-medium mb-2">Projects using {selectedSkill.name}</h4>
    <div className="flex gap-2">
      {selectedSkill.relatedProjects.map((slug) => (
        <Link key={slug} to={`/projects/${slug}`}>
          <Badge variant="outline">{slug}</Badge>
        </Link>
      ))}
    </div>
  </div>
)}
```

## Accessibility

- Filter buttons as proper buttons with clear focus states
- Screen reader announcements for filter changes
- Color not sole indicator of proficiency (text labels)
- Keyboard navigation through skills

```tsx
<div aria-live="polite" className="sr-only">
  Showing {filteredSkills.length} skills in {selectedCategory === 'all' ? 'all categories' : selectedCategory}
</div>
```

## Files to Create

```
src/data/skills.ts                     # Skill definitions
src/components/skills/SkillsGrid.tsx   # Main visualization
src/components/sections/SkillsSection.tsx  # Homepage section
```

## Verification

1. All skills render correctly
2. Category filters work
3. Proficiency colors and labels display
4. Keyboard navigation functional
5. Screen reader announces filter changes
6. Responsive layout on mobile

## Effort

**Estimate**: Small-Medium

- Data structure: 20 min
- Grid component: 45 min
- Category filters: 20 min
- Styling/polish: 30 min
- Optional radar chart: 30 min
- Accessibility: 20 min

## Dependencies

- Recharts already installed (for radar chart option)
- Could pair with Framer Motion for filter animations
