# personal-website

![Build](https://github.com/Dbochman/personal-website/actions/workflows/deploy.yml/badge.svg)
[![Live Site](https://img.shields.io/badge/live-dylanbochman.com-blue)](https://dylanbochman.com)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)

Personal portfolio and blog built with React 18, TypeScript, TailwindCSS, and Vite. Deployed via GitHub Actions to GitHub Pages.

## Tech Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS, Radix UI
- **Build:** Vite with SWC
- **Testing:** Vitest, React Testing Library, Playwright E2E
- **Blog:** MDX with Decap CMS

## Development

```bash
git clone https://github.com/Dbochman/personal-website.git
cd personal-website
npm install
npm run dev    # http://localhost:8080
```

## Project Structure

```
├── content/blog/        # MDX blog posts
├── src/
│   ├── components/      # UI components
│   ├── pages/           # Route components
│   ├── hooks/           # Custom React hooks
│   └── lib/             # Utilities
└── .github/workflows/   # CI/CD pipeline
```

## License

[MIT](LICENSE)

---

**Dylan Bochman** · [dylanbochman.com](https://dylanbochman.com) · dylanbochman@gmail.com
