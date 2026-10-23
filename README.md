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

Install and keep Google Chrome updated before `npm run build` or the Playwright
E2E commands. Both local and CI runs use `channel: 'chrome'`; do not run
`playwright install chromium`. Playwright uses an isolated temporary browser
profile, never your personal Chrome profile. Missing Chrome fails explicitly
instead of falling back to an old cached browser. Prerendering owns a loopback
preview server on a dynamically allocated port and closes only that server.

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
with `npm run lint`, `npm run typecheck`, `npm test -- --run`, `npm run build`,
`npm run check-bundle-budget`, and the Playwright `@smoke` suite against preview.

`npm run typecheck` explicitly checks both `tsconfig.app.json` (including tests)
and `tsconfig.node.json`. Plain `tsc --noEmit` at the root does **not** traverse
the referenced projects. Keep strict options enabled; PR CI runs the explicit
command. Kanban compilation regenerates typed declarations alongside its JS
outputs, and the Search Console JS helper has a typed boundary for its tests.

- Blog and kanban frontmatter use the shared YAML-only helper in
  `src/lib/frontmatter.ts` and js-yaml 4. It preserves timestamp parsing and
  Markdown bodies; malformed or non-mapping metadata fails explicitly. The MDX
  cache fingerprints this helper. Node 24's native type stripping lets the plain
  JavaScript content scripts use the same implementation.
- Blog typography is owned by `MDXComponents.tsx`. The unused Tailwind typography
  plugin and its stale selector-parser chain were removed; do not reinstall it
  solely because older examples mention `prose` classes.
- Mermaid **syntax** remains the content format, but [Pele](https://pele.run)
  1.6.0 renders the SVG. `src/lib/flowchart-renderer.ts` registers only
  `pele/diagrams/flowchart` with `pele/core`; never import the all-types entry
  point. `useFlowchart` loads it on demand and owns resize/font updates and cleanup.
  The existing component names and copyable diagram sources remain unchanged.
- All four current diagrams are flowcharts. Other diagram types, arbitrary HTML
  labels, and KaTeX/LaTeX math are **not supported by this integration**. The old
  math fixture exercised a dependency capability, not published content; its tests
  and the KaTeX override were removed with Mermaid. Evaluate future syntax against
  Pele before adding content—there is no fallback Mermaid bundle.
- Diagram links and images are disabled; React walkthrough buttons own navigation.
  Source node IDs are exposed as `.pele-node[data-id]` for highlights. Theme colors
  follow site CSS variables without redrawing. Narrow diagrams provide zoom/pan
  controls; resize redraws reapply the current highlight. Unit tests cover source
  compatibility, escaping, lifecycle and errors; browser tests cover all four
  diagrams, playback, branching, navigation, mobile zoom, and theme changes.

## License

[MIT](LICENSE)

---

**Dylan Bochman** · [dylanbochman.com](https://dylanbochman.com) · dylanbochman@gmail.com
