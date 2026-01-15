# Plan: React.memo for List Components

## Summary
Wrap frequently-rendered list item components with `React.memo` to prevent unnecessary re-renders when parent state changes.

## Problem
List components like `BlogCard`, `ProjectCard`, and `MetricCard` re-render whenever their parent component updates, even if their props haven't changed. With 50+ blog posts and growing, this creates unnecessary work.

## Solution
Wrap these components with `React.memo()` to skip re-renders when props are unchanged.

## Components to Optimize

### 1. BlogCard
**File**: `src/components/blog/BlogCard.tsx`
**Renders**: 50+ times in blog list
**Parent updates**: Search filtering, sort changes

```typescript
import { memo } from 'react';

export const BlogCard = memo(function BlogCard({ post, featured }: BlogCardProps) {
  // existing implementation
});
```

### 2. ProjectCard
**File**: `src/components/projects/ProjectCard.tsx`
**Renders**: 6+ times in project grid
**Parent updates**: Filter changes (if added)

```typescript
import { memo } from 'react';

export const ProjectCard = memo(function ProjectCard({ project }: ProjectCardProps) {
  // existing implementation
});
```

### 3. MetricCard
**File**: `src/components/analytics/MetricCard.tsx`
**Renders**: 8+ times in analytics dashboard
**Parent updates**: Tab switches, data refreshes

```typescript
import { memo } from 'react';

export const MetricCard = memo(function MetricCard({ title, value, ... }: MetricCardProps) {
  // existing implementation
});
```

### 4. ExpertiseCard (if exists)
**File**: `src/components/home/ExpertiseCard.tsx` (or similar)
**Renders**: In sidebar/skills section

## Implementation Notes

### When NOT to use memo
- Components that almost always receive new props
- Very simple components (overhead > benefit)
- Components with frequently-changing children

### Custom comparison (if needed)
For objects/arrays in props, add custom comparator:
```typescript
export const BlogCard = memo(function BlogCard({ post }: Props) {
  // ...
}, (prevProps, nextProps) => {
  return prevProps.post.slug === nextProps.post.slug;
});
```

## Impact
- **Blog page with 50 posts**: Fewer re-renders during search/filter
- **Analytics dashboard**: Cleaner updates during tab switches
- **React DevTools**: Visible reduction in "Rendered" highlights

## Files Changed
- `src/components/blog/BlogCard.tsx`
- `src/components/projects/ProjectCard.tsx`
- `src/components/analytics/MetricCard.tsx`

## Testing
1. Open React DevTools Profiler
2. Enable "Highlight updates when components render"
3. Type in blog search - only filtered cards should highlight
4. Switch analytics tabs - unchanged cards shouldn't re-render

## Effort
Small (~20 minutes)
