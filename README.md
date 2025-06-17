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
├── public/              # Static assets
├── src/                 # All components and views
├── dist/                # Build output (ignored in git)
├── index.html           # App entry
├── vite.config.ts       # Vite config
├── tailwind.config.ts   # TailwindCSS config
├── package.json         # Dependencies and scripts
└── .github/workflows/   # GitHub Actions deploy pipeline
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
- Polish typography and responsiveness
- Possibly add a contact form or resume download link

## 📝 License

This project is licensed under the [MIT License](LICENSE).

## 👤 Author

**Dylan Bochman**  
[https://dbochman.github.io](https://dbochman.github.io)  
📬 dylanbochman@gmail.com
