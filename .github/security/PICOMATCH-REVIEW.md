# Temporary picomatch exposure review — November 18, 2026

## Decision and bounds

Permit only [GHSA-fc5q-39xc-vjpf](https://github.com/advisories/GHSA-fc5q-39xc-vjpf)
on installed and lockfile-pinned **picomatch 4.0.5**, at the single reviewed
`node_modules/picomatch` location, until **2026-11-25T00:00:00Z**. This is an
exposure-based exception for a real vulnerability, not a claim that 4.0.5 is fixed.
The advisory currently covers through 4.0.7 and lists no patched release.

The reviewed application has no identified path from untrusted HTTP input,
board data, or blog text to attacker-selected repeated-extglob patterns.
Untrusted filenames/URLs can be **subjects** of matching against fixed patterns;
that alone does not supply the vulnerable pattern. The exception does not claim
that arbitrary patterns are safe or that all possible future code is covered.

Shipping Vite 7.3.8 fixes a separate, directly relevant
[network-exposed dev-server RCE](https://github.com/vitejs/vite/security/advisories/GHSA-p4f5-76q4-ffq7).
This repository sets `server.host: "::"`. Keeping the prior Vite version while
waiting indefinitely for an unrelated matcher release retains that exposure.

## Reviewed call paths

Reviewed PR #370 head `5b046c1a5a7cac6f8365ae43cfbdde5830d23fba`, its installed
lockfile tree, and the exception's accompanying policy changes.

| Consumer | Pattern source | Untrusted input boundary |
| --- | --- | --- |
| Vite 7.3.8 filesystem deny/asset filters | Vite defaults and `vite.config.ts` (`**/*.wasm`) | HTTP URLs are matched subjects, not patterns. |
| Vite import-glob / tinyglobby 0.2.15 / fdir 6.5.0 | Literal `/src/generated/blog/*.js` and `/src/generated/kanban/*.js`; tool defaults | Vite's `parseImportGlob` rejects dynamic templates/non-literals. Runtime route parameters select from the generated module map. |
| Vite dependency expansion | `optimizeDeps.include`, dependency exports/sideEffects in the locked tree | `expandGlobIds` is called from manually configured includes, not directly from request URLs. This app only configures `exclude: ['jq-web']`. |
| Vite filesystem watcher | Fixed ignored directories; `disableGlobbing: true` | Discovered/requested filenames are not reinterpreted as watch glob patterns. No project override enables globbing. |
| MDX Rollup 3.1.1 / pluginutils 5.3.0 | Optional include/exclude options | Neither option is configured, so `createFilter` returns its plain string/null-byte check without constructing matchers. |
| Visualizer 7.0.1 | Optional file/bundle filters | Neither is configured; its filter uses constant true/false functions. Only used with `ANALYZE=true`. |
| Vitest 4.1.12 | `vitest.config.ts` and tool defaults | Test paths are subjects. The configured pattern is `src/**/*.{test,spec}.{ts,tsx}`. |
| lint-staged 16.4.0 | `package.json` keys `*.{ts,tsx}` and `*.{js,jsx}` | Staged filenames are subjects; `matchFiles` compiles the configuration key. |

No reviewed pattern uses the single-branch repeated extglobs required by this
advisory. Package classification alone is insufficient: npm marks picomatch as
a production dependency through `@mdx-js/rollup`, although that consumer is
loaded by build configuration, not by the shipped browser application.

Blog precompilation embeds compiled content with `JSON.stringify`; content is
not inserted into build-time glob expressions. Kanban board/card data is
serialized as data. The separately deployed Kanban worker has its own lockfile
and is outside this root-package exception.

## Verification

- Traced the installed picomatch implementation's `makeRe`, `parse`, and `scan`
  calls during a Vite production build, all 312 Vitest tests, and an isolated
  loopback dev server. The combined trace contained 32 unique patterns, with no
  `+(` or `*(` repeated-extglob patterns.
- Requested `/`, both source files containing `import.meta.glob`, and URL/query
  canaries containing repeated-extglob syntax. All requests completed; the
  canary marker never appeared in compiled patterns. The dev server was closed.
- A separate positive control compiled `+(*a)` and was captured by the same
  tracer. It did not perform an expensive match. Tracing supplements source
  inspection; it is not a proof that every possible branch was executed.
- Inspected all 77 generated browser source maps (1,175 distinct source paths):
  no picomatch, tinyglobby, or fdir sources were present. Production deployment
  serves the static `dist` output, not the Vite development server.
- Exception tests cover expiry boundaries, invalid clocks, missing/changed
  scope, installed/locked version differences, unexpected package locations,
  additional advisories, and added/deleted/renamed/changed reviewed files.

PR code and configuration remain executable inputs to CI. A contributor who
changes a script can already run code in that job; this review does not describe
arbitrary PR code as trusted. The scoped fingerprint prevents the exception
from silently covering changed application/tooling inputs. Existing CI trust
checks, token restrictions, timeouts, and required checks remain unchanged.

## Enforcement and removal

`scripts/audit-dependencies.mjs` checks the exact advisory, version, location,
current UTC interval, and a SHA-256 fingerprint of tracked application source,
scripts, configuration, manifests/lockfiles, content, and public files. Paths as
well as file contents are hashed. The audit policy itself is excluded from that
fingerprint to avoid a self-hash cycle and remains subject to code review.
The expected fingerprint is in `picomatch-review.json`; there is no automatic
refresh, environment override, or extension of the expiry date.

Any new advisory still fails. A changed reviewed input or expiry makes this
finding fail again. The full npm audit still runs, including development and
low-severity findings. Existing deployment audit behavior is not broadened;
this change only affects the required PR audit policy.

Before expiry, check the upstream advisory/release, install a fixed version
when available, and remove this exception, its fingerprint, and temporary
policy tests. If there is still no fix, stop and reassess exposure/mitigation;
do not roll the date forward automatically. Re-review immediately if any code
accepts user glob patterns, imports matcher code into the browser/server runtime,
changes watcher behavior, or alters the locked dependency graph.
