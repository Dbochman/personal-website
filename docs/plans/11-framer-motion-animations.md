# Framer Motion Animations Plan

## Overview

Add polished animations using Framer Motion. Focus on page transitions, scroll reveals, and micro-interactions that enhance UX without being distracting.

## Why Framer Motion

- **Declarative API**: Animate with props, not CSS
- **Layout animations**: Smooth list reordering, shared layouts
- **Gesture support**: Drag, hover, tap animations
- **Exit animations**: AnimatePresence handles unmounting
- **Performance**: Hardware-accelerated, respects reduced motion

## Animation Opportunities

| Component | Animation Type | Priority |
|-----------|---------------|----------|
| Page transitions | Fade/slide on route change | High |
| Card reveals | Stagger on scroll | High |
| Hero section | Entrance animation | Medium |
| Blog post content | Fade in sections | Medium |
| Modal/sheet | Spring open/close | Low |
| Hover states | Scale, shadow lift | Low |

## Implementation

### Phase 1: Install and Setup

```bash
npm install framer-motion
```

**File:** `src/lib/motion.ts` - Shared animation variants

```ts
import { Variants } from 'framer-motion';

// Fade up for page/section entrances
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

// Stagger children
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

// Card item
export const cardVariant: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4 },
  },
};

// Page transition
export const pageTransition: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};
```

### Phase 2: Page Transitions

**File:** `src/App.tsx`

```tsx
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { pageTransition } from '@/lib/motion';

function App() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={pageTransition}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <Routes location={location}>
          {/* routes */}
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}
```

### Phase 3: Card Grid Animations

**File:** `src/components/blog/BlogList.tsx`

```tsx
import { motion } from 'framer-motion';
import { staggerContainer, cardVariant } from '@/lib/motion';

<motion.div
  className="grid grid-cols-1 md:grid-cols-2 gap-6"
  variants={staggerContainer}
  initial="hidden"
  animate="visible"
>
  {filteredPosts.map((post) => (
    <motion.div key={post.slug} variants={cardVariant}>
      <BlogCard post={post} />
    </motion.div>
  ))}
</motion.div>
```

### Phase 4: Scroll-Triggered Animations

**File:** `src/components/sections/HeroSection.tsx`

```tsx
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { fadeUp } from '@/lib/motion';

function HeroSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <motion.section
      ref={ref}
      variants={fadeUp}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
    >
      {/* content */}
    </motion.section>
  );
}
```

### Phase 5: Micro-Interactions

**Card hover lift:**

```tsx
<motion.div
  whileHover={{ y: -4, boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
  transition={{ duration: 0.2 }}
>
  <Card>...</Card>
</motion.div>
```

**Button tap feedback:**

```tsx
<motion.button
  whileTap={{ scale: 0.98 }}
  whileHover={{ scale: 1.02 }}
>
  Click me
</motion.button>
```

### Phase 6: Reduced Motion Support

```tsx
import { motion, useReducedMotion } from 'framer-motion';

function AnimatedComponent() {
  const shouldReduce = useReducedMotion();

  return (
    <motion.div
      initial={shouldReduce ? false : 'hidden'}
      animate="visible"
      // Skip animations for reduced motion users
    />
  );
}
```

Or globally in motion config:

```tsx
// _app.tsx or main.tsx
import { MotionConfig } from 'framer-motion';

<MotionConfig reducedMotion="user">
  <App />
</MotionConfig>
```

## Performance Considerations

- Use `layoutId` for shared element transitions
- Avoid animating layout properties (width, height) - use transform
- Use `will-change` hints sparingly
- Test on low-end devices
- Profile with React DevTools

## Files to Create/Modify

```
src/lib/motion.ts                    # New: shared variants
src/App.tsx                          # Page transitions
src/components/blog/BlogList.tsx     # Card stagger
src/components/projects/ProjectGrid.tsx
src/components/sections/HeroSection.tsx
src/components/ui/card.tsx           # Optional: hover effects
```

## Verification

1. Navigate between pages - should see smooth transitions
2. Load blog list - cards should stagger in
3. Scroll down homepage - sections should reveal
4. Test with `prefers-reduced-motion: reduce` - no motion
5. Check performance in DevTools - no layout thrashing

## Bundle Impact

Framer Motion adds ~30-40KB gzipped. Consider:
- Tree shaking unused features
- Lazy loading for non-critical pages
- Native CSS animations for simple effects

## Effort

**Estimate**: Medium

- Setup and variants: 30 min
- Page transitions: 30 min
- Card animations: 45 min
- Scroll reveals: 45 min
- Micro-interactions: 30 min
- Reduced motion: 15 min
- Testing/polish: 1 hour

## Dependencies

- Consider implementing after View Transitions API plan
- Framer Motion can be fallback where View Transitions unsupported
