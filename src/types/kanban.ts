export type CardChangeType = 'column' | 'title' | 'description' | 'labels';

export interface CardChange {
  type: CardChangeType;
  timestamp: string;
  // For column changes
  columnId?: string;
  columnTitle?: string;
  // For field changes
  from?: string;
  to?: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface KanbanCard {
  id: string;
  title: string;
  description?: string;
  labels?: string[];
  checklist?: ChecklistItem[];
  planFile?: string; // Path to plan file, e.g., 'docs/plans/11-framer-motion.md'
  createdAt: string;
  updatedAt?: string;
  history?: CardChange[];
}

export type ColumnColor = 'default' | 'yellow' | 'orange' | 'purple' | 'blue' | 'green' | 'red' | 'pink';

export const COLUMN_COLORS: Record<ColumnColor, { label: string; bg: string; border: string; dot: string }> = {
  default: { label: 'Default', bg: 'bg-muted/50', border: 'border-border', dot: 'bg-gray-400' },
  yellow: { label: 'Investigating', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', dot: 'bg-yellow-500' },
  orange: { label: 'Identified', bg: 'bg-orange-500/10', border: 'border-orange-500/30', dot: 'bg-orange-500' },
  purple: { label: 'Fixing', bg: 'bg-purple-500/10', border: 'border-purple-500/30', dot: 'bg-purple-500' },
  blue: { label: 'Monitoring', bg: 'bg-blue-500/10', border: 'border-blue-500/30', dot: 'bg-blue-500' },
  green: { label: 'Resolved', bg: 'bg-green-500/10', border: 'border-green-500/30', dot: 'bg-green-500' },
  red: { label: 'Critical', bg: 'bg-red-500/10', border: 'border-red-500/30', dot: 'bg-red-500' },
  pink: { label: 'Review', bg: 'bg-pink-500/10', border: 'border-pink-500/30', dot: 'bg-pink-500' },
};

export interface KanbanColumn {
  id: string;
  title: string;
  description?: string;
  color?: ColumnColor;
  cards: KanbanCard[];
}

export interface KanbanBoard {
  id: string;
  title: string;
  columns: KanbanColumn[];
  createdAt: string;
  updatedAt: string;
}

// Pre-populated board based on roadmap
export const roadmapBoard: KanbanBoard = {
  id: 'roadmap',
  title: 'Site Roadmap',
  columns: [
    {
      id: 'backlog',
      title: 'Backlog',
      cards: [
        {
          id: 'tailwind-v4',
          title: 'Tailwind CSS v4 Upgrade',
          description: 'Migrate to Tailwind v4 with native CSS, container queries built-in, and improved performance.',
          labels: ['Medium', 'Infrastructure'],
          createdAt: '2026-01-08',
        },
        {
          id: 'test-cicd',
          title: 'Test & CI/CD Improvements',
          description: 'Enhance test coverage and CI/CD pipeline reliability.',
          labels: ['Medium', 'Infrastructure'],
          createdAt: '2026-01-08',
        },
        {
          id: 'framer-motion',
          title: 'Framer Motion Animations',
          description: 'Add polished animations: page transitions, scroll reveals, and micro-interactions. ~30-40KB gzipped.',
          labels: ['Medium', 'Learning'],
          planFile: 'docs/plans/11-framer-motion-animations.md',
          checklist: [
            { id: 'fm-1', text: 'Install framer-motion and create shared variants', completed: false },
            { id: 'fm-2', text: 'Add page transitions with AnimatePresence', completed: false },
            { id: 'fm-3', text: 'Add stagger animations to card grids', completed: false },
            { id: 'fm-4', text: 'Add scroll-triggered reveal animations', completed: false },
            { id: 'fm-5', text: 'Add micro-interactions (hover lift, tap feedback)', completed: false },
            { id: 'fm-6', text: 'Implement reduced motion support', completed: false },
          ],
          createdAt: '2026-01-13',
        },
        {
          id: 'career-timeline',
          title: 'Career Timeline',
          description: 'Interactive vertical timeline showing work history, achievements, and skill development over time.',
          labels: ['Medium', 'Content'],
          planFile: 'docs/plans/14-career-timeline.md',
          checklist: [
            { id: 'ct-1', text: 'Create career data structure (jobs, education, achievements)', completed: false },
            { id: 'ct-2', text: 'Build CareerTimeline component with vertical layout', completed: false },
            { id: 'ct-3', text: 'Add type filters (job, education, achievement, project)', completed: false },
            { id: 'ct-4', text: 'Create Experience page with route', completed: false },
            { id: 'ct-5', text: 'Add scroll animations (optional, with Framer Motion)', completed: false },
          ],
          createdAt: '2026-01-13',
        },
        {
          id: 'skills-viz',
          title: 'Skills Visualization',
          description: 'Interactive filterable skills grid by category (Languages, Frameworks, Infrastructure, etc.) with proficiency levels.',
          labels: ['Small-Medium', 'Content'],
          planFile: 'docs/plans/13-skills-visualization.md',
          checklist: [
            { id: 'sv-1', text: 'Create skills data structure with categories and proficiency', completed: false },
            { id: 'sv-2', text: 'Build SkillsGrid component with filtering', completed: false },
            { id: 'sv-3', text: 'Add proficiency indicators (expert/proficient/familiar)', completed: false },
            { id: 'sv-4', text: 'Create SkillsSection for homepage', completed: false },
            { id: 'sv-5', text: 'Optional: Add radar chart with Recharts', completed: false },
          ],
          createdAt: '2026-01-13',
        },
        {
          id: 'contact-form',
          title: 'Contact Form',
          description: 'Contact form using Formspree (50 submissions/month free). Includes validation, spam protection, and accessibility.',
          labels: ['Small-Medium', 'Content'],
          planFile: 'docs/plans/12-contact-form.md',
          checklist: [
            { id: 'cf-1', text: 'Set up Formspree account and create form', completed: false },
            { id: 'cf-2', text: 'Create Contact page with form UI', completed: false },
            { id: 'cf-3', text: 'Add form validation with react-hook-form + zod', completed: false },
            { id: 'cf-4', text: 'Add honeypot spam protection', completed: false },
            { id: 'cf-5', text: 'Add accessibility (ARIA live regions, error states)', completed: false },
          ],
          createdAt: '2026-01-13',
        },
        {
          id: 'visual-regression',
          title: 'Visual Regression Testing',
          description: 'Playwright screenshot tests comparing against baselines. Catches unintended UI changes in CI.',
          labels: ['Medium', 'Analytics'],
          planFile: 'docs/plans/08-visual-regression-testing.md',
          checklist: [
            { id: 'vr-1', text: 'Create visual.spec.ts with full-page screenshots', completed: false },
            { id: 'vr-2', text: 'Update playwright.config.ts with snapshot settings', completed: false },
            { id: 'vr-3', text: 'Add CI integration with artifact upload on failure', completed: false },
            { id: 'vr-4', text: 'Set up baseline management (Git LFS or separate branch)', completed: false },
            { id: 'vr-5', text: 'Add flakiness handling (mask dynamic content, disable animations)', completed: false },
          ],
          createdAt: '2026-01-13',
        },
        {
          id: 'preview-deploys',
          title: 'Preview Deployments',
          description: 'Deploy PRs to unique preview URLs via Cloudflare Pages. Enables visual review before merge.',
          labels: ['Small-Medium', 'Infrastructure'],
          planFile: 'docs/plans/10-preview-deployments.md',
          checklist: [
            { id: 'pd-1', text: 'Set up Cloudflare Pages with GitHub repo', completed: false },
            { id: 'pd-2', text: 'Configure preview URL pattern', completed: false },
            { id: 'pd-3', text: 'Create PR comment workflow with preview link', completed: false },
            { id: 'pd-4', text: 'Configure environment variables (disable analytics in preview)', completed: false },
            { id: 'pd-5', text: 'Add PreviewBanner component for visual indicator', completed: false },
          ],
          createdAt: '2026-01-13',
        },
        {
          id: 'rum',
          title: 'Real User Monitoring (RUM)',
          description: 'Collect Core Web Vitals from real user sessions via web-vitals library + GA4. Complements synthetic Lighthouse testing.',
          labels: ['Small-Medium', 'Analytics'],
          planFile: 'docs/plans/09-real-user-monitoring.md',
          checklist: [
            { id: 'rum-1', text: 'Install web-vitals package', completed: false },
            { id: 'rum-2', text: 'Create web-vitals.ts reporting hook to GA4', completed: false },
            { id: 'rum-3', text: 'Initialize in main.tsx with requestIdleCallback', completed: false },
            { id: 'rum-4', text: 'Set up GA4 custom dimensions', completed: false },
            { id: 'rum-5', text: 'Update GA4 export script to include Web Vitals', completed: false },
            { id: 'rum-6', text: 'Add RUM data to Analytics Dashboard', completed: false },
          ],
          createdAt: '2026-01-13',
        },
        {
          id: 'view-transitions',
          title: 'View Transitions API',
          description: 'Native page transitions with shared element animations. ~75% browser coverage, progressive enhancement.',
          labels: ['Small-Medium', 'Learning'],
          planFile: 'docs/plans/05-view-transitions-api.md',
          checklist: [
            { id: 'vt-1', text: 'Create useViewTransitionNavigate hook', completed: false },
            { id: 'vt-2', text: 'Add shared element transitions for blog card → post', completed: false },
            { id: 'vt-3', text: 'Add custom transition CSS animations', completed: false },
            { id: 'vt-4', text: 'Add reduced motion support', completed: false },
            { id: 'vt-5', text: 'Test across Chrome, Safari, Firefox fallback', completed: false },
          ],
          createdAt: '2026-01-13',
        },
        {
          id: 'container-queries',
          title: 'Container Queries & :has()',
          description: 'Explore modern CSS: container queries for component-based responsive design, :has() for parent selection.',
          labels: ['Small', 'Learning'],
          planFile: 'docs/plans/04-container-queries-has.md',
          checklist: [
            { id: 'cq-1', text: 'Set up Tailwind container queries plugin (or use v4 built-in)', completed: false },
            { id: 'cq-2', text: 'Refactor ProjectCard with container queries', completed: false },
            { id: 'cq-3', text: 'Add :has() utilities for form validation styling', completed: false },
            { id: 'cq-4', text: 'Document gotchas and best practices', completed: false },
          ],
          createdAt: '2026-01-13',
        },
        {
          id: 'mcp-testing',
          title: 'MCP Interactive Testing',
          description: 'Chrome DevTools MCP workflows for real-time browser automation, performance analysis, and accessibility auditing.',
          labels: ['Medium', 'Analytics'],
          planFile: 'docs/plans/16-mcp-interactive-testing.md',
          checklist: [
            { id: 'mcp-1', text: 'Document full site audit workflow', completed: false },
            { id: 'mcp-2', text: 'Document responsive testing workflow (breakpoints)', completed: false },
            { id: 'mcp-3', text: 'Document performance stress testing workflow', completed: false },
            { id: 'mcp-4', text: 'Document interactive flow testing workflow', completed: false },
            { id: 'mcp-5', text: 'Create standard test session checklist', completed: false },
            { id: 'mcp-6', text: 'Add testing triggers to CLAUDE.md', completed: false },
          ],
          createdAt: '2026-01-13',
        },
      ],
    },
    {
      id: 'todo',
      title: 'To Do',
      cards: [
        {
          id: 'aria-live',
          title: 'ARIA Live Regions',
          description: 'Screen reader announcements for dynamic content: search results, loading/error states, model changes.',
          labels: ['Small', 'Accessibility'],
          planFile: 'docs/plans/02-aria-live-regions.md',
          checklist: [
            { id: 'al-1', text: 'Add BlogList search results announcement', completed: false },
            { id: 'al-2', text: 'Add Analytics Dashboard loading/error/warning announcements', completed: false },
            { id: 'al-3', text: 'Add On-Call model change announcement', completed: false },
            { id: 'al-4', text: 'Test with VoiceOver screen reader', completed: false },
          ],
          createdAt: '2026-01-13',
        },
        {
          id: 'deploy-notifications',
          title: 'Deployment Notifications',
          description: 'Email notifications for deploy success/failure via GitHub Actions + dawidd6/action-send-mail.',
          labels: ['Small', 'Infrastructure'],
          planFile: 'docs/plans/03-deployment-notifications.md',
          checklist: [
            { id: 'dn-1', text: 'Set up Gmail App Password and repo secrets', completed: false },
            { id: 'dn-2', text: 'Add notification job to deploy.yml', completed: false },
            { id: 'dn-3', text: 'Test success and failure notifications', completed: false },
          ],
          createdAt: '2026-01-13',
        },
        {
          id: 'perf-budget',
          title: 'Performance Budget Enforcement',
          description: 'Bundle size limits in CI (200KB JS, 35KB CSS). Stricter Lighthouse thresholds.',
          labels: ['Small', 'Analytics'],
          planFile: 'docs/plans/06-performance-budget-enforcement.md',
          checklist: [
            { id: 'pb-1', text: 'Add bundle size check script to deploy.yml', completed: false },
            { id: 'pb-2', text: 'Update lighthouse.yml with stricter thresholds', completed: false },
            { id: 'pb-3', text: 'Create bundle tracking script (optional)', completed: false },
            { id: 'pb-4', text: 'Add PR comment with bundle size diff (optional)', completed: false },
          ],
          createdAt: '2026-01-13',
        },
        {
          id: 'renovate',
          title: 'Renovate Automation',
          description: 'Automated dependency updates with grouping (React, Radix, Testing, etc.) and auto-merge for safe patches.',
          labels: ['Small', 'Infrastructure'],
          planFile: 'docs/plans/07-renovate-automation.md',
          checklist: [
            { id: 'rv-1', text: 'Create renovate.json with base config', completed: false },
            { id: 'rv-2', text: 'Configure package grouping rules', completed: false },
            { id: 'rv-3', text: 'Set up auto-merge for patch updates', completed: false },
            { id: 'rv-4', text: 'Install Renovate GitHub app', completed: false },
          ],
          createdAt: '2026-01-13',
        },
      ],
    },
    {
      id: 'in-progress',
      title: 'In Progress',
      cards: [
        {
          id: 'kanban',
          title: 'Kanban Board',
          description: 'Interactive task board with drag-and-drop, URL persistence, card history, checklists, and column customization.',
          labels: ['Medium', 'Content'],
          planFile: 'docs/plans/15-kanban-page.md',
          checklist: [
            { id: 'kb-1', text: 'Core drag-and-drop with dnd-kit', completed: true },
            { id: 'kb-2', text: 'URL persistence with lz-string compression', completed: true },
            { id: 'kb-3', text: 'Card editor with history tracking', completed: true },
            { id: 'kb-4', text: 'Column customization (description, colors)', completed: true },
            { id: 'kb-5', text: 'Checklist/subtasks feature', completed: true },
            { id: 'kb-6', text: 'Migrate roadmap plans to backlog cards', completed: false },
          ],
          createdAt: '2026-01-13',
        },
      ],
    },
    {
      id: 'recently-completed',
      title: 'Recently Completed',
      cards: [
        { id: 'skip-nav', title: 'Skip Navigation Links', labels: ['Small', 'Accessibility'], createdAt: '2026-01-13' },
        { id: 'analytics-dashboard', title: 'Analytics Dashboard', description: 'GA4, Search Console, Lighthouse visualizations', labels: ['PR #96'], createdAt: '2026-01-13' },
        { id: 'oncall-coverage', title: 'On-Call Coverage Model Explorer', labels: ['PR #94'], createdAt: '2026-01-13' },
        { id: 'footer-component', title: 'Footer Standardization', labels: ['Cleanup'], createdAt: '2026-01-13' },
        { id: 'nav-cleanup', title: 'Nav Cleanup', description: 'Removed Experience, Goals, Contact links', labels: ['Cleanup'], createdAt: '2026-01-13' },
      ],
    },
    {
      id: 'changelog',
      title: 'Change Log',
      cards: [
        { id: 'jan-12', title: 'Jan 12: Projects Page Launch', description: 'SLO Calculator, Status Page Generator, registry pattern', labels: ['PR #88-92'], createdAt: '2026-01-12' },
        { id: 'jan-11', title: 'Jan 11: MDX Precompilation', description: 'Blog LCP 5.6s → 3.1s (45% faster)', labels: ['PR #84', 'Performance'], createdAt: '2026-01-11' },
        { id: 'jan-8', title: 'Jan 8: Blog Phase 4 & 5', description: 'Comments, syntax highlighting, RSS, structured data', labels: ['Feature'], createdAt: '2026-01-08' },
        { id: 'jan-6-7', title: 'Jan 6-7: Node.js v24 + Perf', description: '55 → 98 Lighthouse, system fonts, Radix cleanup', labels: ['Performance'], createdAt: '2026-01-07' },
      ],
    },
  ],
  createdAt: '2026-01-13',
  updatedAt: '2026-01-13',
};

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}
