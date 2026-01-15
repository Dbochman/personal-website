# Framer Motion Animations Plan (Updated)

## Overview

Add polished animations using Framer Motion, focusing on **stagger animations, scroll reveals, and micro-interactions**. Page transitions are already handled by the View Transitions API.

## What's Already Done

- ✅ Page transitions (View Transitions API in `useViewTransition.tsx`)
- ✅ Directional navigation animations (forward/back/to-home)
- ✅ Modal/dialog animations (Radix + tailwindcss-animate)
- ✅ Accordion expand/collapse animations
- ✅ Sheet slide animations
- ✅ Basic CSS hover effects (`.hover-lift`)

## Remaining Opportunities

### High Priority

| Component | Animation | Impact |
|-----------|-----------|--------|
| BlogList grid | Stagger cards on load/filter | Professional feel |
| ProjectGrid | Stagger cards on load | Portfolio polish |
| MetricCards | Stagger + skeleton fade | Smooth data loading |
| Kanban columns | Stagger cards within columns | Visual flow |

### Medium Priority

| Component | Animation | Impact |
|-----------|-----------|--------|
| MobileNav items | Stagger on menu open | Delightful UX |
| TabsContent | Fade/slide on tab switch | Smooth transitions |
| ExperienceSection | Scroll-triggered reveal | Engagement |
| RelatedPosts | Stagger on scroll into view | Polish |
| Table rows | Sequential row reveal | Data visualization |

### Low Priority (Nice-to-have)

| Component | Animation | Impact |
|-----------|-----------|--------|
| Buttons | Enhanced hover (scale/shadow) | Micro-feedback |
| Tag badges | Click pulse feedback | Interaction clarity |
| GoalsSection | Entrance animation | Visual interest |
| Search input | Focus glow animation | Input feedback |

## Easing Guide

Use consistent easing functions based on animation context:

```
Is the element entering or exiting the viewport?
├─ Yes → ease-out
└─ No
   ├─ Is it moving/morphing on screen?
   │  └─ Yes → ease-in-out
   ├─ Is it a hover change?
   │  └─ Yes → ease
   └─ Is it constant motion?
      ├─ Yes → linear
      └─ Default → ease-out
```

| Animation Type | Easing | Framer Motion | Example Use |
|----------------|--------|---------------|-------------|
| Enter/Exit | `ease-out` | `'easeOut'` | Stagger items, scroll reveals, page load |
| Move/Morph | `ease-in-out` | `'easeInOut'` | Tab content slide, drag animations |
| Hover | `ease` | `'ease'` | Button scale, link underlines |
| Loading/Progress | `linear` | `'linear'` | Spinners, progress bars |

## Implementation

### Phase 1: Setup & Shared Variants

```bash
npm install framer-motion
```

**File:** `src/lib/motion.ts`

```ts
import { Variants } from 'framer-motion';

// Stagger container for grids/lists
export const staggerContainer: Variants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

// Individual item in stagger
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

// Fade up for scroll reveals
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

// Tab content transition (ease-in-out for on-screen morphing)
export const tabContent: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.2, ease: 'easeInOut' } },
  exit: { opacity: 0, x: 10, transition: { duration: 0.15, ease: 'easeInOut' } },
};

// Mobile nav items
export const navItem: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
};

// Skeleton to content crossfade
export const crossfade: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
};
```

### Phase 2: Grid Stagger Animations

**BlogList.tsx:**
```tsx
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '@/lib/motion';

<motion.div
  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
  variants={staggerContainer}
  initial="hidden"
  animate="visible"
  key={searchTerm + selectedTags.join(',')} // Re-animate on filter
>
  {filteredPosts.map((post) => (
    <motion.div key={post.slug} variants={staggerItem}>
      <BlogCard post={post} />
    </motion.div>
  ))}
</motion.div>
```

**ProjectGrid.tsx:** Same pattern.

**Analytics MetricCards:** Same pattern for the 4-card grid.

### Phase 3: Scroll-Triggered Reveals

**ExperienceSection.tsx:**
```tsx
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { staggerContainer, staggerItem } from '@/lib/motion';

function ExperienceSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <motion.section
      ref={ref}
      variants={staggerContainer}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
    >
      {experiences.map((exp) => (
        <motion.div key={exp.id} variants={staggerItem}>
          {/* experience card */}
        </motion.div>
      ))}
    </motion.section>
  );
}
```

### Phase 4: Mobile Nav Stagger

**MobileNav.tsx:**
```tsx
import { motion, AnimatePresence } from 'framer-motion';
import { staggerContainer, navItem } from '@/lib/motion';

// Inside Sheet content when open:
<motion.nav
  variants={staggerContainer}
  initial="hidden"
  animate="visible"
>
  {navItems.map((item, i) => (
    <motion.a
      key={item.href}
      variants={navItem}
      custom={i}
      href={item.href}
    >
      {item.label}
    </motion.a>
  ))}
</motion.nav>
```

### Phase 5: Tab Content Transitions

**AnalyticsDashboard.tsx:**
```tsx
import { motion, AnimatePresence } from 'framer-motion';
import { tabContent } from '@/lib/motion';

<Tabs value={activeTab} onValueChange={setActiveTab}>
  <AnimatePresence mode="wait">
    <motion.div
      key={activeTab}
      variants={tabContent}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <TabsContent value={activeTab}>
        {/* tab content */}
      </TabsContent>
    </motion.div>
  </AnimatePresence>
</Tabs>
```

### Phase 6: Micro-Interactions

**Enhanced button hover** (use `ease` for hover states):
```tsx
<motion.button
  whileHover={{ scale: 1.02, y: -1 }}
  whileTap={{ scale: 0.98 }}
  transition={{ duration: 0.15, ease: 'ease' }}
>
  Click me
</motion.button>
```

**Tag click feedback:**
```tsx
<motion.button
  whileTap={{ scale: 0.95 }}
  transition={{ duration: 0.1, ease: 'ease' }}
  onClick={() => toggleTag(tag)}
>
  <Badge>{tag}</Badge>
</motion.button>
```

### Phase 7: Reduced Motion Support

**Global config in App.tsx:**
```tsx
import { MotionConfig } from 'framer-motion';

<MotionConfig reducedMotion="user">
  <App />
</MotionConfig>
```

This automatically disables animations when `prefers-reduced-motion: reduce` is set.

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/motion.ts` | New: shared variants |
| `src/App.tsx` | Add MotionConfig wrapper |
| `src/components/blog/BlogList.tsx` | Stagger grid |
| `src/components/projects/ProjectGrid.tsx` | Stagger grid |
| `src/components/analytics/AnalyticsDashboard.tsx` | Stagger metrics, tab transitions |
| `src/components/sections/ExperienceSection.tsx` | Scroll reveal |
| `src/components/blog/RelatedPosts.tsx` | Stagger grid |
| `src/components/MobileNav.tsx` | Nav item stagger |
| `src/components/ui/tabs.tsx` | Optional: content transitions |

## Bundle Impact

- Framer Motion: ~30-40KB gzipped
- Tree-shakeable: only import what you use
- Consider: lazy loading for non-critical pages

## Checklist

- [ ] Install framer-motion
- [ ] Create `src/lib/motion.ts` with shared variants
- [ ] Add MotionConfig to App.tsx for reduced motion
- [ ] Add stagger to BlogList grid
- [ ] Add stagger to ProjectGrid
- [ ] Add stagger to Analytics MetricCards
- [ ] Add scroll reveal to ExperienceSection
- [ ] Add nav item stagger to MobileNav
- [ ] Add tab content transitions to AnalyticsDashboard
- [ ] Test with prefers-reduced-motion
- [ ] Verify no layout shift (CLS)
- [ ] Check performance on mobile

## Effort Estimate

Medium (~2-3 hours)
- Setup + variants: 20 min
- Grid staggers (3 components): 45 min
- Scroll reveals: 30 min
- Mobile nav: 20 min
- Tab transitions: 30 min
- Micro-interactions: 20 min
- Testing: 30 min

## Not Included (Already Done)

- ~~Page transitions~~ → View Transitions API
- ~~Modal animations~~ → Radix + tailwindcss-animate
- ~~Accordion animations~~ → tailwindcss-animate
- ~~Sheet animations~~ → Radix built-in
