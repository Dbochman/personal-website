export interface KanbanCard {
  id: string;
  title: string;
  description?: string;
  labels?: string[];
  createdAt: string;
}

export interface KanbanColumn {
  id: string;
  title: string;
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
export const defaultBoard: KanbanBoard = {
  id: 'roadmap',
  title: 'Site Roadmap',
  columns: [
    {
      id: 'backlog',
      title: 'Backlog',
      cards: [
        { id: 'tailwind-v4', title: 'Tailwind CSS v4 Upgrade', labels: ['Medium', 'Infrastructure'], createdAt: '2026-01-08' },
        { id: 'test-cicd', title: 'Test & CI/CD Improvements', labels: ['Medium', 'Infrastructure'], createdAt: '2026-01-08' },
        { id: 'framer-motion', title: 'Framer Motion Animations', labels: ['Medium', 'Learning'], createdAt: '2026-01-13' },
        { id: 'career-timeline', title: 'Career Timeline', labels: ['Medium', 'Content'], createdAt: '2026-01-13' },
        { id: 'skills-viz', title: 'Skills Visualization', labels: ['Small-Medium', 'Content'], createdAt: '2026-01-13' },
        { id: 'contact-form', title: 'Contact Form', labels: ['Small-Medium', 'Content'], createdAt: '2026-01-13' },
        { id: 'visual-regression', title: 'Visual Regression Testing', labels: ['Medium', 'Analytics'], createdAt: '2026-01-13' },
        { id: 'preview-deploys', title: 'Preview Deployments', labels: ['Small-Medium', 'Infrastructure'], createdAt: '2026-01-13' },
        { id: 'rum', title: 'Real User Monitoring (RUM)', labels: ['Small-Medium', 'Analytics'], createdAt: '2026-01-13' },
        { id: 'view-transitions', title: 'View Transitions API', labels: ['Small-Medium', 'Learning'], createdAt: '2026-01-13' },
        { id: 'container-queries', title: 'Container Queries & :has()', labels: ['Small', 'Learning'], createdAt: '2026-01-13' },
        { id: 'mcp-testing', title: 'MCP Interactive Testing', labels: ['Medium', 'Analytics'], createdAt: '2026-01-13' },
      ],
    },
    {
      id: 'todo',
      title: 'To Do',
      cards: [
        { id: 'aria-live', title: 'ARIA Live Regions', description: 'Screen reader announcements for dynamic content', labels: ['Small', 'Accessibility'], createdAt: '2026-01-13' },
        { id: 'deploy-notifications', title: 'Deployment Notifications', description: 'Email notifications for deploy success/failure', labels: ['Small', 'Infrastructure'], createdAt: '2026-01-13' },
        { id: 'perf-budget', title: 'Performance Budget Enforcement', description: 'Bundle size limits in CI', labels: ['Small', 'Analytics'], createdAt: '2026-01-13' },
        { id: 'renovate', title: 'Renovate Automation', description: 'Automated dependency updates', labels: ['Small', 'Infrastructure'], createdAt: '2026-01-13' },
      ],
    },
    {
      id: 'in-progress',
      title: 'In Progress',
      cards: [
        { id: 'kanban', title: 'Kanban Board', description: 'Interactive task board with drag-and-drop', labels: ['Medium', 'Content'], createdAt: '2026-01-13' },
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
