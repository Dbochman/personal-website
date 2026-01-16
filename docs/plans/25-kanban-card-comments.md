# Plan: Kanban Card Comments

## Overview

Add giscus discussion threads to kanban board cards, allowing persistent comments/discussion on individual roadmap items. Reuse the existing blog Comments pattern with theme matching.

## Current State

- Blog posts have giscus comments via `src/components/blog/Comments.tsx`
- Theme matching already implemented (light/dark sync)
- Kanban cards have a detail modal (`CardEditorModal.tsx`) where comments would fit naturally

## Implementation

### 1. Create CardComments Component

Adapt the blog Comments component for kanban cards:

```tsx
// src/components/projects/kanban/CardComments.tsx
import { useEffect, useRef, useState } from 'react';
import { useTheme } from '@/context/ThemeContext';

interface CardCommentsProps {
  cardId: string;
}

export function CardComments({ cardId }: CardCommentsProps) {
  // Lazy load via IntersectionObserver
  // Use cardId as giscus term (data-term)
  // Match theme with site (dark/light)
  // Update theme dynamically via postMessage
}
```

Key differences from blog Comments:
- Uses `@/context/ThemeContext` instead of `next-themes`
- Term is `kanban-{cardId}` to namespace from blog comments
- Smaller container styling for modal context

### 2. Theme Matching

```tsx
const { isDark } = useTheme();

const getGiscusTheme = () => isDark ? 'dark' : 'light';

// Update theme when it changes
useEffect(() => {
  const iframe = containerRef.current?.querySelector('iframe.giscus-frame');
  iframe?.contentWindow?.postMessage(
    { giscus: { setConfig: { theme: getGiscusTheme() } } },
    'https://giscus.app'
  );
}, [isDark]);
```

### 3. Add to CardEditorModal

Insert comments section after the history section:

```tsx
{/* Comments section */}
{card && (
  <div className="space-y-2 pt-4 border-t">
    <Label>Discussion</Label>
    <CardComments cardId={card.id} />
  </div>
)}
```

### 4. Giscus Configuration

Use same repo/category as blog comments but different term prefix:
- `data-term`: `kanban-{cardId}` (e.g., `kanban-sentry-enhancement`)
- `data-mapping`: `specific`
- All other settings match blog Comments

## Checklist

- [ ] Create `CardComments.tsx` component
- [ ] Add theme matching using `useTheme` context
- [ ] Add lazy loading via IntersectionObserver
- [ ] Integrate into `CardEditorModal.tsx`
- [ ] Test theme switching (verify dynamic update)
- [ ] Test comment persistence across modal open/close
- [ ] Verify no console errors

## Files to Modify

| File | Change |
|------|--------|
| `src/components/projects/kanban/CardComments.tsx` | New file |
| `src/components/projects/kanban/CardEditorModal.tsx` | Add comments section |

## Risks

| Risk | Mitigation |
|------|------------|
| Modal height with comments | Use max-height with scroll, lazy load |
| Too many discussions created | Only show comments for existing cards, not new |
| Theme flash on load | Load with correct theme from start |

## Testing

1. Open a card modal - comments should lazy load when scrolled into view
2. Toggle dark/light mode - giscus should update immediately
3. Add a comment, close modal, reopen - comment should persist
4. Check console for errors during all operations
