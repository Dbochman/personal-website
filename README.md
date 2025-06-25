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

This project uses GitHub Actions to build and deploy the site to a separate public repo:

- **Source repository:** [`Dbochman/personal-website`](https://github.com/Dbochman/personal-website) (this repo)
- **Deploy target:** [`Dbochman/dbochman.github.io`](https://github.com/Dbochman/dbochman.github.io)
- **Trigger:** Any push to `main`
- **Build command:** `npm run build`
- **Output directory:** `dist/`

The deployment action uses [`peaceiris/actions-gh-pages`](https://github.com/peaceiris/actions-gh-pages) to push the contents of `dist/` to the `main` branch of the `dbochman.github.io` repo, which is served directly via GitHub Pages.

## 🔧 Development

```bash
# Install dependencies
npm install

# Start local dev server
npm run dev

# Build for production
npm run build
```

## 🧩 Dependencies

- [Lovable](https://lovable.dev)
- [Vite](https://vitejs.dev)
- [TailwindCSS](https://tailwindcss.com)

## ✨ Future Plans

- Add SEO metadata
- Optionally integrate analytics (e.g. Plausible or Umami)

## 📝 License

This project is licensed under the [MIT License](LICENSE).

## 👤 Author

**Dylan Bochman**  
[https://dbochman.github.io](https://dbochman.github.io)  
📬 dylanbochman@gmail.com
