# personal-website

![Build](https://github.com/Dbochman/personal-website/actions/workflows/deploy.yml/badge.svg)
[![Live Site](https://img.shields.io/badge/live-dbochman.github.io-blue)](https://dbochman.github.io)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)

This is the source repository for [dbochman.github.io](https://dbochman.github.io), a modern personal portfolio showcasing Site Reliability Engineering expertise. Built with React 18, TypeScript, TailwindCSS, and Vite.

## 🌐 Live Site

- **Production URL:** [https://dbochman.github.io](https://dbochman.github.io)
- **Deployment Method:** Static site hosted on GitHub Pages

## 🛠 Project Structure

This repo contains the full editable source code, including:

```
├── public/              # Static assets (runbook.html, resume PDF, dynamic favicons for light/dark themes, social preview image)
├── src/                 # Main application source code
│   ├── components/       # Reusable UI components
│   │   ├── ui/            # Radix UI components (accordion, button, card, etc.)
│   │   ├── sections/      # Main content sections (Hero, Experience, Goals, Contact)
│   │   ├── layout/        # Layout components (Header, PageLayout, ParallaxBackground)
│   │   ├── icons/         # Custom SVG icon components (geometric patterns)
│   │   └── ...            # Navigation, utility components (Sidebar, BackToTop, etc.)
│   ├── pages/            # Route components (Index, NotFound)
│   ├── data/             # Content data (experiences, expertise, navigation)
│   ├── context/          # React context providers (NavigationContext)
│   ├── hooks/            # Custom React hooks (useParallax, useTheme, use-mobile)
│   ├── lib/              # Utility functions (utils.ts)
│   ├── assets/           # Static assets (company logos)
│   ├── main.tsx          # Application entry point with dark mode detection
│   ├── App.tsx           # Root component with routing
│   └── index.css         # Global Tailwind CSS styles
├── dist/                # Build output directory (auto-generated)
├── .github/workflows/   # GitHub Actions CI/CD pipeline
├── index.html           # HTML template with Google Analytics
├── vite.config.ts       # Vite build configuration with path aliases
├── tailwind.config.ts   # Tailwind design system configuration
├── vitest.config.ts     # Test configuration
├── vitest-setup.ts      # Test setup with DOM matchers
├── eslint.config.js     # Code quality configuration
├── components.json      # Radix UI component configuration
└── package.json         # Dependencies and build scripts
```

## 🚀 Deployment Workflow

This project uses GitHub Actions for automated CI/CD. The workflow triggers on pushes to the `main` branch and is defined in `.github/workflows/deploy.yml`:

**Workflow Steps:**
1. **Checkout** - Source code checkout with `actions/checkout@v6`
2. **Setup Node.js** - Node.js 24 LTS installation with `actions/setup-node@v6`
3. **Cache Dependencies** - NPM cache using `actions/cache@v4` for faster builds
4. **Install Dependencies** - `npm install` to install all project dependencies
5. **Security Audit** - `npm audit` for vulnerability scanning
6. **Run Tests** - `npm test` executes the full Vitest test suite
7. **Build** - `npm run build` creates optimized production bundle
8. **Deploy** - Uses `peaceiris/actions-gh-pages@v4` to deploy to external repository

**Deployment Details:**
- **Target:** `Dbochman/dbochman.github.io` repository (separate GitHub Pages repo)
- **Custom Domain:** `dylanbochman.com` via CNAME configuration
- **Authentication:** Personal access token via `DEPLOY_TOKEN` secret
- **Strategy:** Force orphan commits to `main` branch for clean deployment history

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
npm run type-check   # Run TypeScript compiler without emitting files

# Code Quality
npm run lint         # Run ESLint for code quality checks

# Testing
npm test             # Run all tests once with Vitest
npm run test:watch   # Run tests in watch mode for development
npm run test:coverage # Run tests with coverage report
npm run test:e2e     # Run Playwright console error monitoring tests
npm run test:e2e:ui  # Run Playwright tests in interactive UI mode
npm run test:e2e:headed # Run Playwright tests with visible browser

# SEO & Monitoring
npm run check-seo    # Check SEO metrics with PageSpeed Insights API
```

### Development Notes
- **Hot Module Replacement:** Changes are reflected instantly during development
- **TypeScript:** Strict type checking enabled with comprehensive coverage
- **Path Aliases:** Use `@/` prefix for clean imports from `src/` directory
- **Port Configuration:** Dev server runs on port 8080 (configurable in package.json)

## 🧪 Testing

This project uses [Vitest](https://vitest.dev/) for comprehensive testing with [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) for component rendering and user interaction simulation.

### Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode for development
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Test Coverage

The project maintains **100% coverage** for critical business logic files. Current test suite includes:

#### **Core Application Logic (100% Coverage)**
- **useTheme.ts** - Theme management and system preference detection
- **NavigationContext.tsx** - Application state management and context providers
- **NotFound.tsx** - Error page handling and 404 logging
- **Seo.tsx** - SEO meta tag rendering and social media optimization
- **Sidebar.tsx** - Core UI component rendering and data display
- **utils.ts** - Utility functions and Tailwind class merging

#### **Interactive Components & Hooks**
- **Custom Hooks:** `useParallax`, `use-mobile` for responsive behavior and animations
- **UI Components:** `AccordionSection`, `MobileNav`, `BackToTop` for user interactions
- **Layout Components:** `Header` with dark mode toggle and responsive navigation
- **Page Components:** `Index` page integration testing

#### **Test Categories**
- **Unit Tests:** Isolated logic testing for hooks and utilities
- **Component Tests:** Rendering, user interactions, and prop handling
- **Integration Tests:** Full page rendering and cross-component functionality
- **Async Testing:** DOM updates with react-helmet-async for SEO components
- **Error Handling:** 404 pages, missing context providers, and edge cases

### Coverage Report

```bash
# Generate detailed coverage report
npm run test:coverage

# Coverage targets achieved:
# - Critical files: 100% coverage
# - Overall test files: 14 test suites
# - Total tests: 86 passing tests
```

### Configuration

- **`vitest.config.ts`:** Main test configuration with jsdom environment and path aliases
- **`vitest-setup.ts`:** Test setup extending expect with DOM matchers from `@testing-library/jest-dom`
- **`@vitest/coverage-v8`:** Coverage reporting with V8 provider for accurate metrics

## 🧩 Key Technologies

**Frontend Framework:**
- [React 18](https://react.dev/) with [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev) with SWC plugin for fast builds

**UI & Styling:**
- [Tailwind CSS](https://tailwindcss.com) for utility-first styling
- System font stack (San Francisco, Segoe UI, Roboto) for zero web font overhead
- [Radix UI](https://www.radix-ui.com/) for accessible components
- [React Helmet Async](https://github.com/staylor/react-helmet-async) for SEO

**Testing & Quality:**
- [Vitest](https://vitest.dev/) test runner with jsdom environment
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) for component testing
- [Playwright](https://playwright.dev/) for end-to-end console error monitoring
- ESLint for code quality

**Features:**
- Advanced dark/light theme system with dynamic favicons
- Mobile-responsive design with parallax animations
- Automated CI/CD deployment to GitHub Pages

## 🎨 Theme System

This site implements a sophisticated dark/light theme system with seamless user experience and technical polish:

### User Experience
- **Dynamic Favicons:** Separate favicon sets for light and dark themes (12 variants including ico, png, and apple-touch-icon)
- **Theme Persistence:** Theme selection persists across page navigation via URL parameters
- **Smooth Transitions:** 1.2-second CSS transitions for theme changes using custom timing variables
- **No Flash:** Preload class technique prevents flash of unstyled content on page load
- **Bidirectional Consistency:** Theme state maintained between homepage and operational runbook

### Technical Implementation

**Flash Prevention:**
```javascript
// Blocking script in <head> applies theme before CSS loads
document.documentElement.classList.add('preload');
// Theme applied based on URL param or system preference
// Preload class removed after 100ms to enable smooth transitions
```

**Theme Persistence:**
- URL parameters (`?theme=light` / `?theme=dark`) passed between pages
- Header component checks URL param first, then falls back to system preference
- Custom `themeChange` events trigger favicon updates across components
- Dynamic home link updates maintain theme state during navigation

**Timing & Transitions:**
- Custom CSS variables for animation timing (`--timing-slow: 1.2s`)
- Easing functions (`--easing-smooth: cubic-bezier(0.4, 0.0, 0.2, 1)`)
- Transitions disabled during initial load, enabled after DOM ready
- Applied to background-color, color, and border-color for consistency

**Files Modified:**
- `index.html` - Theme initialization and favicon management
- `public/runbook.html` - Consistent theme handling for operational docs
- `src/components/layout/Header.tsx` - Theme toggle and URL parameter handling
- `src/hooks/useTheme.ts` - Theme state management (unused but available)

## 📈 Analytics & Monitoring

### Analytics
This site uses [Google Analytics](https://analytics.google.com). The tracking script is included in `index.html` and is configured to only run in production.

### Automated SEO Monitoring
Weekly automated SEO checks using PageSpeed Insights API:
- **Workflow:** `.github/workflows/seo-check.yml`
- **Schedule:** Every Monday at 9 AM UTC
- **Metrics:** Performance, SEO scores, Core Web Vitals (mobile & desktop)
- **Alerting:** GitHub issues created if scores drop below thresholds
- **Documentation:** [docs/AUTOMATED_SEO_CHECKS.md](docs/AUTOMATED_SEO_CHECKS.md)
- **Manual Check:** `npm run check-seo`

### Console Error Monitoring
Automated console error detection with Playwright:
- **Workflow:** `.github/workflows/console-check.yml`
- **Trigger:** Runs after each successful deployment
- **Coverage:** Home page and runbook page
- **Alerting:** GitHub issues created when errors detected
- **Documentation:** [docs/CONSOLE_ERROR_MONITORING.md](docs/CONSOLE_ERROR_MONITORING.md)
- **Local Testing:** `npm run test:e2e`

### Core Web Vitals Tracking
Real-user monitoring with web-vitals library:
- **Integration:** Google Analytics 4 custom events
- **Metrics:** LCP, FID, CLS, INP, FCP, TTFB
- **Mode:** Production only
- **Dashboard:** Google Analytics Events → Web Vitals category

### Error Tracking
Client-side error monitoring is provided by [Sentry](https://sentry.io). To enable:

1. Create a Sentry project at https://sentry.io
2. Copy your DSN from the project settings
3. Create a `.env` file in the project root:
   ```bash
   VITE_SENTRY_DSN=your_sentry_dsn_here
   ```

### Uptime Monitoring
External uptime monitoring is configured with [UptimeRobot](https://uptimerobot.com):
- **Status Page:** [https://stats.uptimerobot.com/zquZllQfNJ](https://stats.uptimerobot.com/zquZllQfNJ)
- **Check Interval:** 5 minutes
- **Monitored URL:** https://dylanbochman.com

### Performance Monitoring
Comprehensive performance monitoring with Lighthouse CI:
- **Workflow:** `.github/workflows/lighthouse.yml`
- **Schedule:** After deployment, weekly Mondays at 10 AM UTC
- **Metrics:** Performance, Accessibility, Best Practices, SEO scores
- **Core Web Vitals:** LCP, FID, CLS, FCP, TTI, TBT, Speed Index
- **Historical Tracking:** `docs/metrics/lighthouse-history.json` (100 entries)
- **Alerting:** GitHub issues when scores drop below thresholds
- **Manual Test:** `npm run lighthouse:production`

### Search Console Integration
Automated SEO visibility tracking via Google Search Console API:
- **Workflow:** `.github/workflows/search-console.yml`
- **Schedule:** Weekly on Mondays at 11 AM UTC
- **Metrics:** Clicks, impressions, CTR, average position
- **Data:** Top queries and pages from last 7 days
- **Historical Tracking:** `docs/metrics/search-console-history.json` (52 weeks)
- **Alerting:** GitHub issues for >20% ranking drops
- **Manual Fetch:** `npm run fetch-search-console`
- **Setup Required:** Google Cloud service account with Search Console API access

### GA4 Analytics Export
Automated visitor analytics from Google Analytics 4 Data API:
- **Workflow:** `.github/workflows/ga4-export.yml`
- **Schedule:** Weekly on Mondays at 12 PM UTC
- **Metrics:** Sessions, users, page views, bounce rate, session duration
- **Data:** Top pages and device breakdown from last 7 days
- **Historical Tracking:** `docs/metrics/ga4-history.json` (52 weeks)
- **Alerting:** GitHub issues for >30% traffic drops or bounce rate spikes
- **Manual Fetch:** `npm run fetch-ga4`
- **Setup Required:** Google Cloud service account with GA4 Data API access

### Metrics Dashboard
All analytics consolidated in `docs/metrics/latest.json`:
- Latest Lighthouse scores and Core Web Vitals
- Search Console performance (clicks, impressions, CTR, position)
- GA4 analytics (sessions, users, pageviews, top pages)
- Automated updates from weekly workflows
- Accessible via GitHub raw URL for external dashboards

**Complete Setup Guide:** [docs/ANALYTICS_INTEGRATIONS.md](docs/ANALYTICS_INTEGRATIONS.md)

### Operational Documentation
- **Incident Response:** [/runbook.html](https://dylanbochman.com/runbook.html)
- **SRE Procedures:** Complete troubleshooting and recovery procedures
- **Performance Standards:** Defined SLIs/SLOs for reliability monitoring
- **Escalation Paths:** Contact information and support channels

## ⚡ Performance

This site is optimized for exceptional performance and user experience:

### Lighthouse Scores (January 2026)
- **Performance:** 95/100 🟢
- **Accessibility:** 100/100 🟢
- **Best Practices:** 100/100 🟢
- **SEO:** 100/100 🟢

### Core Web Vitals
- **LCP (Largest Contentful Paint):** 2.3s (Target: <2.5s) ✅
- **FID (First Input Delay):** 59ms (Target: <100ms) ✅
- **CLS (Cumulative Layout Shift):** 0.002 (Target: <0.1) ✅
- **TBT (Total Blocking Time):** 15ms ✅
- **FCP (First Contentful Paint):** 2.3s ✅

### Performance Optimizations
- **System Font Stack:** Zero web font requests using native fonts (San Francisco, Segoe UI, Roboto)
- **Lazy Loading:** Web vitals library loaded after page interactive
- **Code Splitting:** React components split for optimal loading
- **Zero Render-Blocking:** Only CSS file blocks rendering (310ms)
- **Instant Font Rendering:** No FOIT (Flash of Invisible Text) or FOUT (Flash of Unstyled Text)

### Continuous Monitoring
- Automated Lighthouse CI runs weekly and after deployments
- Performance degradation alerts via GitHub issues
- Historical metrics tracked in `docs/metrics/lighthouse-history.json`
- Manual testing: `npm run lighthouse:production`

## 🔍 SEO & Professional Visibility

This personal resume website implements comprehensive SEO optimization for professional discovery and career visibility:

### Current SEO Implementation
- **Structured Data:** JSON-LD schema markup for Person entity with job title and professional links
- **Custom Domain:** `dylanbochman.com` with canonical URLs and automatic redirects
- **Social Media Optimization:** Open Graph and Twitter Card meta tags for professional sharing
- **Technical SEO:** Semantic HTML, fast loading times, mobile responsiveness
- **Google Analytics:** Visitor tracking and engagement analytics

### SEO Component Structure
The `Seo` component uses [react-helmet-async](https://github.com/staylor/react-helmet-async) to dynamically manage:
- Page titles with professional branding (`Title | Dylan Bochman`)
- Meta descriptions optimized for SRE/technical keywords
- Social sharing images and URLs
- Open Graph properties for LinkedIn/professional networks

### Professional SEO Strategy
**Target Keywords:** `Site Reliability Engineer`, `Technical Incident Manager`, `Dylan Bochman`, `SRE Nvidia`, `SRE Groq`, `SRE Spotify`, `HashiCorp SRE`

**Key Optimizations for Career Visibility:**
- Professional title in page title and structured data
- Company names (Nvidia, Groq, HashiCorp, Spotify) for association-based searches
- Technical skills keywords in meta descriptions
- LinkedIn profile linked via structured data
- Resume PDF indexed for document searches

## 🎯 Portfolio Focus

This site showcases expertise in **Site Reliability Engineering (SRE)** and **Incident Management** and includes:

- **Professional Experience:** Technical Incident Manager roles at Nvidia (upcoming), Groq, HashiCorp/IBM, and Spotify
- **Core Expertise:** Incident command & coordination, post-incident analysis, SLO monitoring & strategy
- **Technical Skills:** Infrastructure reliability, operational resilience, cross-functional coordination
- **Resume:** Available for download as PDF

## ✨ Future Plans

-   **Add a blog:** Create a simple blog to share SRE articles and tutorials
-   **Improve accessibility:** Conduct a full accessibility audit and address any issues  
-   **Implement i18n:** Add support for multiple languages
-   **Enhanced animations:** Expand parallax and interaction effects

## 📝 License

This project is licensed under the [MIT License](LICENSE).

## 👤 Author

**Dylan Bochman**  
[https://dbochman.github.io](https://dbochman.github.io)  
📬 dylanbochman@gmail.com
<!-- Deployment token updated Thu Oct 16 23:09:13 EDT 2025 -->
