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
npm ci         # Node 24+; also sets up pre-commit hooks (Husky + lint-staged)
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

## Dependency security maintenance

Run `npm ci`, `npm audit`, and `npm audit --omit=dev` with Node 24+. PR checks
audit the full dependency tree, including development tools. Validate migrations
with `npm run lint`, `npm test -- --run`, `npm run build`,
`npm run check-bundle-budget`, and the Playwright `@smoke` suite against preview.

- Blog and kanban frontmatter use the shared YAML-only helper in
  `src/lib/frontmatter.ts` and js-yaml 4. It preserves timestamp parsing and
  Markdown bodies; malformed or non-mapping metadata fails explicitly. The MDX
  cache fingerprints this helper. Node 24's native type stripping lets the plain
  JavaScript content scripts use the same implementation.
- Blog typography is owned by `MDXComponents.tsx`. The unused Tailwind typography
  plugin and its stale selector-parser chain were removed; do not reinstall it
  solely because older examples mention `prose` classes.
- The `mermaid`-scoped override pins **KaTeX 0.18.2**, the fix for
  [GHSA-238p-pmpm-9mq7](https://github.com/advisories/GHSA-238p-pmpm-9mq7).
  Mermaid 11's `renderToString` call remains compatible. The site uses native
  MathML, not custom KaTeX internal CSS classes (renamed in 0.18). Unit tests
  cover inherited-trust rejection; browser smoke tests cover math labels and
  the existing project/blog diagrams. Keep this override until a supported
  Mermaid dependency range includes patched KaTeX and passes those tests.
  [Mermaid 12](https://github.com/mermaid-js/mermaid/releases/tag/mermaid%4012.0.0)
  changes layouts, appearance, browser requirements and bundles ELK; evaluate
  that upgrade separately against the existing 5700 KiB JS budget.

## License

[MIT](LICENSE)

---

**Dylan Bochman** · [dylanbochman.com](https://dylanbochman.com) · dylanbochman@gmail.com
