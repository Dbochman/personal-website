import type { LazyExoticComponent, ComponentType } from 'react';

/**
 * Project status indicating development state
 */
export type ProjectStatus = 'active' | 'experimental' | 'archived' | 'draft';

/**
 * Project metadata for display in lists and cards
 */
export interface ProjectMeta {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  icon?: string; // lucide-react icon name
  status: ProjectStatus;
  createdAt: string;
  updatedAt?: string;
  fullWidth?: boolean; // Break out of max-w-4xl constraint
  keywords?: string[]; // SEO keywords for meta tags and JSON-LD
  ogImage?: string; // Custom Open Graph image path
}

/**
 * Full project definition including the lazy-loaded component
 */
export interface ProjectDefinition extends ProjectMeta {
  component: LazyExoticComponent<ComponentType>;
}
