# ARIA Live Regions Plan

## Overview

Add ARIA live regions to announce dynamic content changes to screen readers. Focuses on search/filter results and loading/error states.

## Priority Areas

| Component | Impact | Effort |
|-----------|--------|--------|
| BlogList search results | High | Low |
| Analytics loading/error/warning | High | Low |
| On-Call model description | Medium | Low |

## Implementation

### Files to Modify

```
src/components/blog/BlogList.tsx
src/components/analytics/AnalyticsDashboard.tsx
src/components/projects/oncall-coverage/index.tsx
```

### 1. BlogList - Search Results Announcements

**File:** `src/components/blog/BlogList.tsx`

Add screen reader announcement when search/filter results change:

```tsx
// Add a visually hidden status announcement
<div role="status" aria-live="polite" className="sr-only">
  {filteredPosts.length} {filteredPosts.length === 1 ? 'post' : 'posts'} found
</div>

// Update empty state with role="status"
<div className="text-center py-12" role="status">
  <p className="text-muted-foreground">No posts found...</p>
</div>
```

### 2. Analytics Dashboard - Loading/Error/Warning States

**File:** `src/components/analytics/AnalyticsDashboard.tsx`

```tsx
// Loading state - add aria-live
<div className="space-y-6" aria-live="polite" aria-busy="true">
  <span className="sr-only">Loading analytics data...</span>
  {/* skeleton cards */}
</div>

// Error state - use role="alert" for assertive announcement
<Card className="border-destructive" role="alert">
  ...
</Card>

// Warning state - already a Card, add role="status"
<Card className="border-yellow-500/50 ..." role="status">
  ...
</Card>
```

### 3. On-Call Coverage - Model Change Announcement

**File:** `src/components/projects/oncall-coverage/index.tsx`

```tsx
// Model description - announce when model changes
<p className="text-sm text-muted-foreground ..." aria-live="polite">
  {currentModel.description}
</p>
```

## Verification

1. Install screen reader (VoiceOver on Mac: Cmd+F5)
2. Navigate to `/blog`, type in search - should announce "X posts found"
3. Navigate to `/analytics` - should announce loading state
4. Navigate to `/projects/oncall-coverage`, change model - should announce description
5. Run Lighthouse accessibility audit
