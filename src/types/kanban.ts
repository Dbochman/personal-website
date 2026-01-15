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

export type ColumnColor = 'default' | 'yellow' | 'orange' | 'purple' | 'blue' | 'green' | 'red' | 'pink';

// Card colors reuse the same palette as columns
export type CardColor = ColumnColor;

export type PrStatus = 'passing' | 'failing' | 'pending';

export interface KanbanCard {
  id: string;
  title: string;
  description?: string;
  labels?: string[];
  checklist?: ChecklistItem[];
  planFile?: string; // Path to plan file, e.g., 'docs/plans/11-framer-motion.md'
  color?: CardColor;
  prStatus?: PrStatus; // CI status for cards in "In Review" column
  createdAt: string;
  updatedAt?: string;
  history?: CardChange[];
}

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

// Card colors use the same config as columns
export const CARD_COLORS = COLUMN_COLORS;

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
      ],
    },
    {
      id: 'todo',
      title: 'To Do',
      cards: [],
    },
    {
      id: 'in-progress',
      title: 'In Progress',
      color: 'blue',
      cards: [
        {
          id: 'dynamic-pr-status',
          title: 'Dynamic PR Status Indicator',
          description: 'Fetch PR check status from GitHub API at runtime so In Review cards show live CI status.',
          labels: ['Small-Medium', 'UX'],
          planFile: 'docs/plans/21-dynamic-pr-status.md',
          checklist: [
            { id: 'dps-1', text: 'Create usePrStatus hook with GitHub API fetch', completed: true },
            { id: 'dps-2', text: 'Add in-memory cache with 2-minute TTL', completed: true },
            { id: 'dps-3', text: 'Update KanbanCard to use hook for PR labels', completed: true },
            { id: 'dps-4', text: 'Add loading spinner state', completed: true },
            { id: 'dps-5', text: 'Handle edge cases (404, rate limit, no checks)', completed: true },
            { id: 'dps-6', text: 'Test with real PR in In Review column', completed: false },
          ],
          history: [
            { type: 'column', timestamp: '2026-01-15T22:30:00.000Z', columnId: 'todo', columnTitle: 'To Do' },
            { type: 'column', timestamp: '2026-01-15T22:35:00.000Z', columnId: 'in-progress', columnTitle: 'In Progress' },
          ],
          createdAt: '2026-01-15',
        },
      ],
    },
    {
      id: 'in-review',
      title: 'In Review',
      color: 'pink',
      cards: [],
    },
    {
      id: 'changelog',
      title: 'Change Log',
      cards: [
        { id: 'pr-124', title: 'React Performance Optimizations', description: 'Analytics CLS 0.71→0.10, scroll throttling, React.memo, lazy-loaded charts, skeleton loaders', labels: ['PR #124', 'Performance'], createdAt: '2026-01-15' },
        { id: 'jan-14-15', title: 'Jan 14-15: Infrastructure & Polish', description: 'View Transitions API, RUM with web-vitals, CI/CD improvements with PR checks, Container Queries, MCP testing workflows', labels: ['PR #109', 'PR #113', 'PR #115-117'], createdAt: '2026-01-15' },
        { id: 'jan-14', title: 'Jan 14: Kanban & UX', description: 'Kanban board with drag-and-drop, card colors, House Projects board, performance budgets, ARIA live regions, deploy notifications', labels: ['PR #97-108'], createdAt: '2026-01-14' },
        { id: 'renovate-wontdo', title: 'Renovate Automation', description: 'Decided against: overhead not justified for actively-maintained personal project. Manual npm update works fine.', labels: ["Won't Do"], createdAt: '2026-01-14' },
        { id: 'jan-13', title: 'Jan 13: Analytics & Accessibility', description: 'Analytics Dashboard, On-Call Coverage Explorer, Skip Navigation, Footer/Nav cleanup', labels: ['PR #94', 'PR #96'], createdAt: '2026-01-13' },
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
