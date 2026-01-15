# Plan: Scroll Listener Throttling

## Summary
Add throttling to the BackToTop scroll listener to prevent excessive state updates and potential scroll jank.

## Problem
The `BackToTop.tsx` component attaches a scroll listener that fires on every scroll pixel, triggering state updates constantly during scrolling. This can cause:
- Layout thrashing (reads `window.pageYOffset` directly)
- Unnecessary re-renders
- Potential scroll jank on lower-powered devices

## Solution
Throttle the scroll handler to fire at most once per 100ms using a simple throttle utility.

## Implementation

### Step 1: Create throttle utility
Add to `src/lib/utils.ts`:
```typescript
export function throttle<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): T {
  let lastCall = 0;
  return ((...args: unknown[]) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      fn(...args);
    }
  }) as T;
}
```

### Step 2: Update BackToTop component
```typescript
// src/components/layout/BackToTop.tsx
import { throttle } from '@/lib/utils';

useEffect(() => {
  const toggleVisibility = () => {
    setIsVisible(window.pageYOffset > 300);
  };

  const throttledToggle = throttle(toggleVisibility, 100);

  window.addEventListener('scroll', throttledToggle, { passive: true });
  return () => window.removeEventListener('scroll', throttledToggle);
}, []);
```

### Step 3: Add passive event listener
The `{ passive: true }` option tells the browser we won't call `preventDefault()`, allowing scroll optimization.

## Impact
- **Before**: ~60+ state updates per second during scroll
- **After**: ~10 state updates per second during scroll
- **Result**: Smoother scrolling, less CPU usage

## Files Changed
- `src/lib/utils.ts` - Add throttle utility
- `src/components/layout/BackToTop.tsx` - Apply throttling

## Testing
1. Scroll rapidly on homepage
2. Verify Back to Top button still appears/disappears correctly
3. Check DevTools Performance tab for fewer React renders during scroll

## Effort
Small (~15 minutes)
