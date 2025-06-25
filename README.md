# personal-website

![Build](https://github.com/Dbochman/personal-website/actions/workflows/deploy.yml/badge.svg)
[![Live Site](https://img.shields.io/badge/live-dbochman.github.io-blue)](https://dbochman.github.io)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)

This is the source repository for [dbochman.github.io](https://dbochman.github.io), a minimalist, fast-loading personal site built with [Lovable](https://lovable.dev), TailwindCSS, and Vite.

## 🌐 Live Site

- **Production URL:** [https://dbochman.github.io](https://dbochman.github.io)
- **Deployment Method:** Static site hosted on GitHub Pages

## 🛠 Project Structure

This repo contains the full editable source code, including:

```
├── public/              # Static assets (served directly; e.g. resume PDF, icons)
├── src/                 # Main application source code (React components, pages, hooks, etc.)
│   ├── components/       # Reusable UI components (site sections, layout elements, etc.)
│   │   ├── ui/            # Generic UI elements (pre-built components like cards, buttons)
│   │   ├── sections/      # Page sections (Hero, Experience, Goals, Contact, etc.)
│   │   ├── layout/        # Layout components (site header, backgrounds, etc.)
│   │   └── ...            # Other components (e.g. Sidebar, BackToTop)
│   ├── pages/            # Top-level pages for routing (main site pages, 404 error page)
│   ├── data/             # Static data sources (e.g. experience timeline content)
│   ├── assets/           # Additional static assets (images, logos)
│   ├── hooks/            # Custom React hooks (shared logic, e.g. scroll effects)
│   ├── main.tsx          # Application entry point (mounts the React app)
│   ├── App.tsx           # Root application component (sets up router/providers)
│   └── index.css         # Global CSS stylesheet (Tailwind base and utilities)
├── dist/                # Build output directory (generated on build; not versioned)
├── index.html           # HTML template for the app (contains root <div> and script tag)
├── vite.config.ts       # Vite configuration (build settings and path aliases)
├── tailwind.config.ts   # Tailwind CSS configuration (design system and theme setup)
├── package.json         # Project metadata and NPM scripts/dependencies
└── .github/workflows/   # CI/CD pipeline (GitHub Actions workflow for deployment)
```

## 🚀 Deployment Workflow

This project uses GitHub Actions to automatically test, build, and deploy the site. The workflow is defined in `.github/workflows/deploy.yml` and includes the following steps:

1.  **Checkout:** The source code is checked out.
2.  **Setup Node.js:** Node.js 20 is installed.
3.  **Cache Dependencies:** Node modules are cached to speed up subsequent builds.
4.  **Install Dependencies:** `npm install` is run to install all project dependencies.
5.  **Run Tests:** The test suite is run with `npm test` to ensure code quality.
6.  **Build:** The site is built for production using `npm run build`.
7.  **Deploy:** The contents of the `dist` directory are deployed to the `main` branch of the `Dbochman/dbochman.github.io` repository.

## 🔧 Development

```bash
# Install dependencies
npm install

# Start local dev server
npm run dev

# Build for production
npm run build
```

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

### Configuration

-   `vitest.config.ts`: The main configuration file for Vitest, including path aliases.
-   `vitest-setup.ts`: A setup file to extend Vitest's `expect` with DOM matchers from `@testing-library/jest-dom`.


## 🧩 Dependencies

- [Vite](https://vitejs.dev)
- [React](https://react.dev/)
- [TailwindCSS](https://tailwindcss.com)
- [Vitest](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

## 📈 Analytics

This site uses [Umami](https://umami.is/) for privacy-focused web analytics. The tracking script is included in `index.html` and is configured to only run in production.

## 🔍 SEO

Search engine optimization is handled by the `Seo` component, which uses [react-helmet-async](https://github.com/staylor/react-helmet-async) to manage the following tags:

*   `<title>`
*   `<meta name="description">`
*   Open Graph tags for social media sharing
*   Twitter card tags

## ✨ Future Plans

-   **Add a blog:** Create a simple blog to share articles and tutorials.
-   **Improve accessibility:** Conduct a full accessibility audit and address any issues.
-   **Add a dark mode toggle:** Allow users to switch between light and dark themes.
-   **Implement i18n:** Add support for multiple languages.

## 📝 License

This project is licensed under the [MIT License](LICENSE).

## 👤 Author

**Dylan Bochman**  
[https://dbochman.github.io](https://dbochman.github.io)  
📬 dylanbochman@gmail.com
