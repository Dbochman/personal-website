# personal-website

![Build](https://github.com/Dbochman/personal-website/actions/workflows/deploy.yml/badge.svg)
[![Live Site](https://img.shields.io/badge/live-dbochman.github.io-blue)](https://dbochman.github.io)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)

This is the source repository for [dbochman.github.io](https://dbochman.github.io), a modern personal portfolio showcasing Site Reliability Engineering expertise. Built with React 18, TypeScript, TailwindCSS, and Vite.

## 🌐 Live Site

- **Production URL:** [https://dylanbochman.com](https://dylanbochman.com)
- **Deployment Method:** Static site hosted on GitHub Pages

## 🎯 Portfolio Focus

Site Reliability Engineering (SRE) and Incident Management expertise:

- **Experience:** Technical Incident Manager at Nvidia (upcoming), Groq, HashiCorp/IBM, Spotify
- **Expertise:** Incident command, post-incident analysis, SLO monitoring
- **Skills:** Infrastructure reliability, operational resilience, cross-functional coordination
- **Resume:** Available for download as PDF

## 🛠 Project Structure

```
├── content/             # MDX blog posts and content
│   └── blog/             # Blog posts in MDX format
├── public/              # Static assets (runbook.html, resume PDF, favicons, social preview)
├── src/                 # Main application source code
│   ├── components/       # Reusable UI components
│   ├── pages/            # Route components (Index, Blog, BlogPost, NotFound)
│   ├── data/             # Content data (experiences, expertise, navigation)
│   ├── hooks/            # Custom React hooks (useParallax, useTheme, use-mobile)
│   ├── lib/              # Utility functions (utils.ts, blog-loader.ts)
│   └── ...
├── .github/workflows/   # GitHub Actions CI/CD pipeline
└── package.json         # Dependencies and build scripts
```

## 🚀 Deployment Workflow

Automated CI/CD via GitHub Actions on pushes to `main`:

**Workflow Steps:**
1. Checkout source code
2. Setup Node.js 24 LTS
3. Cache NPM dependencies
4. Install dependencies
5. Run security audit
6. Execute test suite
7. Build production bundle
8. Deploy to `dbochman.github.io` repository

**Deployment Details:**
- **Target:** Separate GitHub Pages repository
- **Custom Domain:** `dylanbochman.com` via CNAME
- **Authentication:** Personal access token (`DEPLOY_TOKEN` secret)

## 🔧 Development

### Prerequisites
- Node.js 24 LTS or higher
- npm 11.x (comes with Node.js 24)

### Getting Started
```bash
# Clone the repository
git clone https://github.com/Dbochman/personal-website.git
cd personal-website

# Install dependencies
npm install

# Start development server (runs on http://localhost:8080)
npm run dev
```

### Available Scripts
```bash
# Development
npm run dev          # Start Vite dev server on port 8080
npm run preview      # Preview production build locally

# Building
npm run build        # TypeScript compile + Vite production build
npm run type-check   # Run TypeScript compiler

# Code Quality
npm run lint         # Run ESLint

# Testing
npm test             # Run all tests once
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
npm run test:e2e     # Run Playwright console error tests
```

## 🧪 Testing

Comprehensive testing with [Vitest](https://vitest.dev/) and [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/):

- **100% coverage** for critical business logic
- **86 passing tests** across 14 test suites
- Unit tests for hooks and utilities
- Component tests for rendering and interactions
- Integration tests for full page functionality
- E2E console error monitoring with Playwright

**Key test files:**
- Core logic: `useTheme.ts`, `NavigationContext.tsx`, `utils.ts`
- Components: `Header`, `MobileNav`, `BackToTop`, `Sidebar`
- Pages: `Index`, `NotFound`, `Seo`

## 🧩 Key Technologies

**Frontend:**
- [React 18](https://react.dev/) with [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev) with SWC for fast builds
- [Tailwind CSS](https://tailwindcss.com) for styling
- [Radix UI](https://www.radix-ui.com/) for accessible components

**Testing & Quality:**
- [Vitest](https://vitest.dev/) with jsdom
- [React Testing Library](https://testing-library.com/)
- [Playwright](https://playwright.dev/) for E2E monitoring
- ESLint for code quality

**Features:**
- Dark/light theme with dynamic favicons
- Mobile-responsive with parallax animations
- MDX blog with syntax highlighting
- Automated CI/CD to GitHub Pages

## 📈 Analytics & Monitoring

Comprehensive monitoring and analytics setup:

**Core Monitoring:**
- **Google Analytics 4** - Visitor tracking and engagement
- **UptimeRobot** - 5-minute uptime checks ([status page](https://stats.uptimerobot.com/zquZllQfNJ))
- **Sentry** - Client-side error tracking (optional, requires DSN in `.env`)
- **Web Vitals** - Real-user performance monitoring

**Automated CI Checks:**
- **Lighthouse CI** - Weekly performance audits + post-deployment
- **Console Error Monitoring** - Playwright tests after each deploy
- **SEO Checks** - Weekly PageSpeed Insights via Search Console API
- **Search Console Export** - Weekly ranking and visibility metrics
- **GA4 Export** - Weekly analytics snapshots

**Documentation:**
- Setup guides: [docs/ANALYTICS_INTEGRATIONS.md](docs/ANALYTICS_INTEGRATIONS.md)
- Runbook: [/runbook.html](https://dylanbochman.com/runbook.html)
- Metrics dashboard: `docs/metrics/latest.json`

## 📝 Blog

MDX-based blog for SRE insights and technical tutorials:

**Features:**
- MDX support with embedded React components
- Syntax highlighting with Shiki
- Search and filter by tags
- Related posts recommendations
- GitHub Discussions comments (Giscus)
- SEO optimized with structured data

**Blog URLs:**
- [Blog Home](https://dylanbochman.com/blog)
- [Adventures in AI-Assisted Web Development](https://dylanbochman.com/blog/2025-01-07-adventures-in-ai-assisted-web-development)
- [Uptime Monitoring for a Personal Site](https://dylanbochman.com/blog/2025-01-07-uptime-monitoring-for-a-personal-site)
- [Writing a Runbook for My Personal Website](https://dylanbochman.com/blog/2025-01-07-writing-a-runbook-for-my-personal-website)

## ✨ Future Plans

- RSS feed and enhanced blog SEO
- Full accessibility audit
- i18n support for multiple languages
- Enhanced parallax and animation effects

## 📝 License

This project is licensed under the [MIT License](LICENSE).

## 👤 Author

**Dylan Bochman**
[https://dylanbochman.com](https://dylanbochman.com)
📬 dylanbochman@gmail.com
