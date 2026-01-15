# Plan: Skeleton Loaders for Suspense Fallbacks

## Summary
Replace generic "Loading..." text with skeleton loaders for better perceived performance during lazy loading.

## Problem
Current Suspense fallbacks show plain text:
```tsx
<Suspense fallback={<div>Loading...</div>}>
```

This creates a jarring experience:
1. User sees "Loading..." text
2. Content suddenly appears
3. Layout shifts as content fills space

## Solution
Create skeleton components that match the shape of loading content, providing visual continuity.

## Skeleton Components to Create

### 1. PageSkeleton (for lazy-loaded pages)
```typescript
// src/components/ui/skeletons/PageSkeleton.tsx
export function PageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 animate-pulse">
      {/* Title */}
      <div className="h-10 bg-muted rounded w-1/3 mb-6" />
      {/* Subtitle */}
      <div className="h-6 bg-muted rounded w-2/3 mb-8" />
      {/* Content blocks */}
      <div className="space-y-4">
        <div className="h-4 bg-muted rounded w-full" />
        <div className="h-4 bg-muted rounded w-5/6" />
        <div className="h-4 bg-muted rounded w-4/6" />
      </div>
    </div>
  );
}
```

### 2. BlogListSkeleton
```typescript
// src/components/ui/skeletons/BlogListSkeleton.tsx
export function BlogListSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-4">
          <div className="h-24 w-24 bg-muted rounded shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-6 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
```

### 3. ProjectGridSkeleton
```typescript
// src/components/ui/skeletons/ProjectGridSkeleton.tsx
export function ProjectGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="rounded-lg border p-4 space-y-3">
          <div className="h-6 bg-muted rounded w-2/3" />
          <div className="h-4 bg-muted rounded w-full" />
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="flex gap-2">
            <div className="h-6 w-16 bg-muted rounded" />
            <div className="h-6 w-16 bg-muted rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
```

### 4. ChartSkeleton (for Analytics)
```typescript
// src/components/ui/skeletons/ChartSkeleton.tsx
export function ChartSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-muted rounded w-1/3 mb-4" />
      <div className="h-64 bg-muted rounded" />
    </div>
  );
}
```

## File Structure
```
src/components/ui/skeletons/
├── index.ts
├── PageSkeleton.tsx
├── BlogListSkeleton.tsx
├── ProjectGridSkeleton.tsx
├── ChartSkeleton.tsx
└── CardSkeleton.tsx
```

## Update App.tsx
```typescript
import { PageSkeleton } from '@/components/ui/skeletons';

// Replace generic fallback
<Suspense fallback={<PageSkeleton />}>
  <Routes>
    {/* ... */}
  </Routes>
</Suspense>
```

## Update Individual Pages (Optional)
For page-specific skeletons:
```typescript
// In Blog.tsx parent
<Suspense fallback={<BlogListSkeleton />}>
  <BlogList posts={posts} />
</Suspense>
```

## Tailwind Animation
Already have `animate-pulse` in Tailwind. If needed, add custom shimmer:
```css
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.animate-shimmer {
  background: linear-gradient(90deg,
    hsl(var(--muted)) 25%,
    hsl(var(--muted-foreground) / 0.1) 50%,
    hsl(var(--muted)) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
```

## Impact
- **Perceived performance**: Users see immediate visual feedback
- **Layout stability**: Skeletons reserve space, preventing CLS
- **Professional feel**: Modern loading pattern used by top apps

## Files Changed
- `src/components/ui/skeletons/*.tsx` (new directory)
- `src/App.tsx` (update Suspense fallback)
- Optionally: individual page components

## Testing
1. Throttle network to Slow 3G
2. Navigate between pages
3. Verify skeletons appear and match content layout
4. Check for smooth transition to loaded content

## Effort
Small-Medium (~30 minutes)
