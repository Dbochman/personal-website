import type { Variants } from 'framer-motion';

// Stagger container for grids/lists
export const staggerContainer: Variants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

// Individual item in stagger (ease-out for entering viewport)
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

// Fade up for scroll reveals (ease-out for entering viewport)
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

// Mobile nav items (ease-out for entering)
export const navItem: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

// Skeleton to content crossfade
export const crossfade: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
};
