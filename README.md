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
├── public/              # Static assets (resume PDF, favicon, social preview image)
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
1. **Checkout** - Source code checkout with `actions/checkout@v4`
2. **Setup Node.js** - Node.js 20 installation with `actions/setup-node@v4`
3. **Cache Dependencies** - NPM cache using `actions/cache@v4` for faster builds
4. **Install Dependencies** - `npm install` to install all project dependencies
5. **Run Tests** - `npm test` executes the full Vitest test suite
6. **Build** - `npm run build` creates optimized production bundle
7. **Deploy** - Uses `peaceiris/actions-gh-pages@v4` to deploy to external repository

**Deployment Details:**
- **Target:** `Dbochman/dbochman.github.io` repository (separate GitHub Pages repo)
- **Custom Domain:** `dylanbochman.com` via CNAME configuration
- **Authentication:** Personal access token via `DEPLOY_TOKEN` secret
- **Strategy:** Force orphan commits to `main` branch for clean deployment history

## 🔧 Development

### Prerequisites
- Node.js 20 or higher
- npm (comes with Node.js)

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
```

### Development Notes
- **Hot Module Replacement:** Changes are reflected instantly during development
- **TypeScript:** Strict type checking enabled with comprehensive coverage
- **Path Aliases:** Use `@/` prefix for clean imports from `src/` directory
- **Port Configuration:** Dev server runs on port 8080 (configurable in package.json)

## 🧪 Testing

This project uses [Vitest](https://vitest.dev/) for unit and component testing, configured with [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) for rendering components and simulating user interactions.

To run the tests:

```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch
```

### Test Coverage

The test suite includes:

*   **Unit Tests:** For custom hooks like `useParallax` and `use-mobile` to ensure the logic is correct in isolation.
*   **Component Tests:** For individual React components like `AccordionSection`, `MobileNav`, and `BackToTop` to verify they render correctly and respond to user interaction.
*   **Integration Tests:** For full pages like the `Index` page to ensure that all components and sections render together correctly and that key information and links are present.
*   **Dark-Mode Toggle Tests:** The header’s dark-mode toggle is tested by mocking window.matchMedia, rendering the `<Header>` (wrapped in its NavigationProvider), then clicking the toggle button to assert that the `<html>` element’s dark class is added and removed, and that the appropriate icon appears.


### Configuration

-   `vitest.config.ts`: The main configuration file for Vitest, including path aliases.
-   `vitest-setup.ts`: A setup file to extend Vitest's `expect` with DOM matchers from `@testing-library/jest-dom`.


## 🧩 Key Technologies

**Frontend Framework:**
- [React 18](https://react.dev/) with [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev) with SWC plugin for fast builds

**UI & Styling:**
- [Tailwind CSS](https://tailwindcss.com) for utility-first styling
- [Radix UI](https://www.radix-ui.com/) for accessible components
- [React Helmet Async](https://github.com/staylor/react-helmet-async) for SEO

**Testing & Quality:**
- [Vitest](https://vitest.dev/) test runner with jsdom environment
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) for component testing
- ESLint for code quality

**Features:**
- Dark/light mode with system preference detection
- Mobile-responsive design with parallax animations
- Automated CI/CD deployment to GitHub Pages

## 📈 Analytics

This site uses [Google Analytics](https://analytics.google.com). The tracking script is included in `index.html` and is configured to only run in production.

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
**Target Keywords:** `Site Reliability Engineer`, `Technical Incident Manager`, `Dylan Bochman`, `SRE Spotify`, `HashiCorp SRE`

**Key Optimizations for Career Visibility:**
- Professional title in page title and structured data
- Company names (HashiCorp, Spotify) for association-based searches
- Technical skills keywords in meta descriptions
- LinkedIn profile linked via structured data
- Resume PDF indexed for document searches

## 🎯 Portfolio Focus

This site showcases expertise in **Site Reliability Engineering (SRE)** and includes:

- **Professional Experience:** SRE roles at HashiCorp/IBM and Spotify
- **Core Expertise:** Incident management, monitoring, post-incident analysis
- **Technical Skills:** Infrastructure reliability, SLO strategy, cross-functional coordination
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
