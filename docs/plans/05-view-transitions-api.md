# View Transitions API Plan

## Overview

Implement smooth page transitions using the View Transitions API. Creates native-feeling navigation animations between routes without heavy animation libraries.

## Browser Support

| Feature | Chrome | Firefox | Safari | Status |
|---------|--------|---------|--------|--------|
| View Transitions (SPA) | 111+ | ❌ | 18+ | 🟡 ~75% coverage |
| View Transitions (MPA) | 126+ | ❌ | ❌ | 🔴 ~65% coverage |

**Note**: Progressive enhancement approach - works great where supported, no impact where not.

## How It Works

```tsx
// Basic usage
document.startViewTransition(() => {
  // Update the DOM (React re-render, route change, etc.)
});

// The browser automatically:
// 1. Takes a screenshot of the old state
// 2. Runs your callback to update DOM
// 3. Takes a screenshot of the new state
// 4. Animates between them
```

## Implementation

### Phase 1: Basic Route Transitions

Wrap route changes with view transitions.

**File:** `src/main.tsx` or custom router wrapper

```tsx
import { useNavigate, useLocation } from 'react-router-dom';

function useViewTransitionNavigate() {
  const navigate = useNavigate();

  return (to: string) => {
    if (!document.startViewTransition) {
      navigate(to);
      return;
    }

    document.startViewTransition(() => {
      navigate(to);
    });
  };
}
```

### Phase 2: Shared Element Transitions

Make specific elements animate between pages (like card → full page).

**Blog card → Blog post example:**

```css
/* BlogCard.tsx - give the title a view-transition-name */
.blog-card-title {
  view-transition-name: blog-title;
}

/* BlogPost.tsx - same name creates shared transition */
.blog-post-title {
  view-transition-name: blog-title;
}
```

**Dynamic names for lists:**

```tsx
// Each card needs unique transition name
<h2 style={{ viewTransitionName: `blog-title-${post.slug}` }}>
  {post.title}
</h2>
```

### Phase 3: Custom Transition Animations

```css
/* globals.css */

/* Default crossfade */
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 200ms;
}

/* Slide transitions for navigation */
::view-transition-old(root) {
  animation: slide-out 200ms ease-out;
}

::view-transition-new(root) {
  animation: slide-in 200ms ease-out;
}

@keyframes slide-out {
  to { transform: translateX(-10%); opacity: 0; }
}

@keyframes slide-in {
  from { transform: translateX(10%); opacity: 0; }
}

/* Respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  ::view-transition-group(*),
  ::view-transition-old(*),
  ::view-transition-new(*) {
    animation: none !important;
  }
}
```

## Use Cases

| Navigation | Transition Type |
|------------|-----------------|
| Home → Blog | Slide right |
| Blog list → Blog post | Shared title + fade |
| Projects → Project detail | Shared card expansion |
| Back navigation | Slide left (reverse) |

## Files to Modify

```
src/App.tsx or src/main.tsx    # Navigation wrapper
src/components/blog/BlogCard.tsx
src/components/projects/ProjectCard.tsx
src/pages/BlogPost.tsx
src/pages/Project.tsx
src/styles/globals.css         # Transition animations
```

## React Router Integration

React Router v7 has built-in view transition support:

```tsx
// Future: when upgrading to RR v7
<Link to="/blog" viewTransition>
  Blog
</Link>
```

For current version, create a custom hook or Link wrapper.

## Verification

1. Navigate between pages - should see smooth crossfade
2. Click blog card → post title should animate into place
3. Test on Chrome (full support) and Safari (basic support)
4. Test Firefox - should work normally without transitions
5. Test with `prefers-reduced-motion: reduce` - no animation

## Gotchas

- Each `view-transition-name` must be unique on the page
- Transitions only work for same-document navigations (SPA)
- Can cause layout issues if elements move significantly
- Consider performance on low-end devices

## Effort

**Estimate**: Small-Medium

- Basic route transitions: 30 min
- Shared element transitions: 1 hour
- Custom animations: 30 min
- Testing across browsers: 30 min

## Dependencies

None - can be implemented independently. Pairs well with Framer Motion for fallback animations.
