// Auto-generated - do not edit
// Source: content/kanban/roadmap/
export const board = {
  "id": "roadmap",
  "title": "Site Roadmap",
  "columns": [
    {
      "id": "ideas",
      "title": "Ideas",
      "description": "Draft plans and attach them, then move to To Do",
      "cards": [
        {
          "id": "k8s-resource-rightsizer",
          "title": "K8s Resource Right-Sizer",
          "labels": [
            "Medium",
            "SRE",
            "Calculator"
          ],
          "checklist": [
            {
              "id": "krr-1",
              "text": "Build inputs for current requests/limits and replicas",
              "completed": false
            },
            {
              "id": "krr-2",
              "text": "Build utilization percentile inputs (P50/P95/P99/Max)",
              "completed": false
            },
            {
              "id": "krr-3",
              "text": "Create goal slider (efficiency Ã¢ÂÂ safety)",
              "completed": false
            },
            {
              "id": "krr-4",
              "text": "Implement recommendation engine with reasoning",
              "completed": false
            },
            {
              "id": "krr-5",
              "text": "Add savings/impact calculation and risk indicators",
              "completed": false
            },
            {
              "id": "krr-6",
              "text": "Create YAML snippet output with copy",
              "completed": false
            },
            {
              "id": "krr-7",
              "text": "Add preset profiles (web server, worker, db)",
              "completed": false
            }
          ],
          "planFile": "docs/plans/44-k8s-resource-rightsizer.md",
          "createdAt": "2026-01-17T00:00:00.000Z",
          "history": [],
          "description": "Recommend CPU/memory requests/limits from utilization percentiles. Goal slider for efficiency vs safety, YAML snippet output."
        },
        {
          "id": "logql-builder",
          "title": "LogQL / CloudWatch Insights Builder",
          "labels": [
            "Medium",
            "SRE",
            "Tool"
          ],
          "checklist": [
            {
              "id": "lql-1",
              "text": "Create language toggle (LogQL vs CloudWatch Insights)",
              "completed": false
            },
            {
              "id": "lql-2",
              "text": "Build LogQL stream selector with label matchers",
              "completed": false
            },
            {
              "id": "lql-3",
              "text": "Build pipeline stage builder (filters, parsers, formatters)",
              "completed": false
            },
            {
              "id": "lql-4",
              "text": "Build CloudWatch command builder (fields, filter, stats, sort)",
              "completed": false
            },
            {
              "id": "lql-5",
              "text": "Add query preview with syntax highlighting and copy",
              "completed": false
            },
            {
              "id": "lql-6",
              "text": "Add presets for common queries",
              "completed": false
            },
            {
              "id": "lql-7",
              "text": "Implement debounced async generation with cancellation",
              "completed": false
            }
          ],
          "planFile": "docs/plans/39-logql-builder.md",
          "createdAt": "2026-01-17T00:00:00.000Z",
          "history": [],
          "description": "Visual query builder for LogQL and CloudWatch Insights. Language toggle, stream selectors, pipeline stages, and presets for common queries."
        },
        {
          "id": "metric-naming-linter",
          "title": "Metric Naming Linter",
          "labels": [
            "Small",
            "SRE",
            "Tool"
          ],
          "checklist": [
            {
              "id": "mnl-1",
              "text": "Create metric name input (one per line, optional type hints)",
              "completed": false
            },
            {
              "id": "mnl-2",
              "text": "Build standard selector (Prometheus, OTel, custom)",
              "completed": false
            },
            {
              "id": "mnl-3",
              "text": "Implement lint rules with severity levels",
              "completed": false
            },
            {
              "id": "mnl-4",
              "text": "Show before/after diff for auto-fix suggestions",
              "completed": false
            },
            {
              "id": "mnl-5",
              "text": "Add bulk apply for auto-fixable rules",
              "completed": false
            },
            {
              "id": "mnl-6",
              "text": "Export results as text/JSON report",
              "completed": false
            }
          ],
          "planFile": "docs/plans/46-metric-naming-linter.md",
          "createdAt": "2026-01-17T00:00:00.000Z",
          "history": [],
          "description": "Lint metric names against Prometheus/OTel conventions. Severity-coded issues, auto-fix suggestions, bulk apply and export."
        },
        {
          "id": "react-component-xray",
          "title": "React Component X-ray",
          "labels": [
            "Medium",
            "Learning",
            "Tool"
          ],
          "checklist": [
            {
              "id": "rcx-1",
              "text": "Create code editor for React/TSX input",
              "completed": false
            },
            {
              "id": "rcx-2",
              "text": "Implement AST parsing in Web Worker (Babel/TS)",
              "completed": false
            },
            {
              "id": "rcx-3",
              "text": "Derive component tree from AST",
              "completed": false
            },
            {
              "id": "rcx-4",
              "text": "Visualize tree with props and render hints",
              "completed": false
            },
            {
              "id": "rcx-5",
              "text": "Detect issues (inline functions, missing keys, unstable deps)",
              "completed": false
            },
            {
              "id": "rcx-6",
              "text": "Build issue list with line refs and severity",
              "completed": false
            },
            {
              "id": "rcx-7",
              "text": "Add suggested fix panel with copyable snippets",
              "completed": false
            }
          ],
          "planFile": "docs/plans/48-react-component-xray.md",
          "createdAt": "2026-01-17T00:00:00.000Z",
          "history": [],
          "description": "Analyze React code to visualize component trees. Flag render anti-patterns (inline functions, missing keys, unstable deps)."
        },
        {
          "id": "recording-rules-generator",
          "title": "Prometheus Recording Rules Generator",
          "labels": [
            "Medium",
            "SRE",
            "Tool"
          ],
          "checklist": [
            {
              "id": "rrg-1",
              "text": "Create PromQL input with syntax highlighting",
              "completed": false
            },
            {
              "id": "rrg-2",
              "text": "Implement query analysis (rate, aggregation, grouping hints)",
              "completed": false
            },
            {
              "id": "rrg-3",
              "text": "Build naming config (level:metric:operations format)",
              "completed": false
            },
            {
              "id": "rrg-4",
              "text": "Add evaluation interval and extra labels config",
              "completed": false
            },
            {
              "id": "rrg-5",
              "text": "Export YAML for rule groups",
              "completed": false
            },
            {
              "id": "rrg-6",
              "text": "Add presets for HTTP and Kubernetes rules",
              "completed": false
            },
            {
              "id": "rrg-7",
              "text": "Add bulk entry mode for multiple queries",
              "completed": false
            }
          ],
          "planFile": "docs/plans/42-recording-rules-generator.md",
          "createdAt": "2026-01-17T00:00:00.000Z",
          "history": [],
          "description": "Generate recording rules from PromQL queries. Naming conventions, analysis hints, YAML export with presets for HTTP/K8s rules."
        },
        {
          "id": "regex-log-parser",
          "title": "Regex Log Parser",
          "labels": [
            "Medium",
            "SRE",
            "Tool"
          ],
          "checklist": [
            {
              "id": "rlp-1",
              "text": "Create sample log input area (1-20 lines)",
              "completed": false
            },
            {
              "id": "rlp-2",
              "text": "Build field highlight and naming UI",
              "completed": false
            },
            {
              "id": "rlp-3",
              "text": "Add pattern templates (timestamp, IP, UUID, etc.)",
              "completed": false
            },
            {
              "id": "rlp-4",
              "text": "Implement live match preview with Web Worker",
              "completed": false
            },
            {
              "id": "rlp-5",
              "text": "Add export to regex, grok, Logstash, Fluent Bit, Vector",
              "completed": false
            },
            {
              "id": "rlp-6",
              "text": "Show non-matching lines indicator",
              "completed": false
            }
          ],
          "planFile": "docs/plans/40-regex-log-parser.md",
          "createdAt": "2026-01-17T00:00:00.000Z",
          "history": [],
          "description": "Build regex parsing rules interactively. Highlight fields, live matching preview, export to grok/Logstash/Fluent Bit/Vector formats."
        },
        {
          "id": "new-board-feature",
          "title": "New Board Creation",
          "labels": [
            "Medium",
            "Kanban",
            "Feature"
          ],
          "checklist": [
            {
              "id": "nbf-1",
              "text": "Worker: Add GET /boards endpoint with dynamic discovery",
              "completed": false
            },
            {
              "id": "nbf-2",
              "text": "Worker: Add markdown fallback to GET /board/:id (before precompile)",
              "completed": false
            },
            {
              "id": "nbf-3",
              "text": "Worker: Add POST /boards endpoint with retry logic for 409",
              "completed": false
            },
            {
              "id": "nbf-4",
              "text": "Worker: Add column/size validation (SAFE_ID, max limits)",
              "completed": false
            },
            {
              "id": "nbf-5",
              "text": "Frontend: BoardSelector component with dropdown",
              "completed": false
            },
            {
              "id": "nbf-6",
              "text": "Frontend: CreateBoardModal with title/ID inputs",
              "completed": false
            },
            {
              "id": "nbf-7",
              "text": "Frontend: Remove static VALID_BOARDS allowlist",
              "completed": false
            },
            {
              "id": "nbf-8",
              "text": "Frontend: Handle precompiled:false response (optimistic UI)",
              "completed": false
            }
          ],
          "planFile": "~/.claude/plans/new-board-creation.md",
          "createdAt": "2026-01-22T00:00:00.000Z",
          "updatedAt": "2026-01-23T00:00:00.000Z",
          "history": [],
          "description": "Add ability to create new kanban boards from the UI. Board selector dropdown to switch between boards, plus 'New Board' button to create fresh boards.\n\n**Architecture Decision**: Dynamic board discovery (Option A from plan). Worker scans `content/kanban/` to discover boards, no hardcoded allowlist.\n\n**Codex Review Complete** (2026-01-23):\n- Race condition handling with retry logic on 409\n- Markdown fallback for new boards before precompile\n- Column ID validation with `SAFE_ID`\n- Optimistic UI with `precompiled: false` indicator\n\nSee `~/.claude/plans/new-board-creation.md` for full implementation plan."
        }
      ]
    },
    {
      "id": "todo",
      "title": "To Do",
      "description": "Planned tasks ready to start",
      "cards": []
    },
    {
      "id": "in-progress",
      "title": "In Progress",
      "color": "blue",
      "cards": []
    },
    {
      "id": "in-review",
      "title": "In Review",
      "color": "pink",
      "cards": []
    },
    {
      "id": "changelog",
      "title": "Change Log",
      "cards": [
        {
          "id": "tailwind-v4",
          "title": "Tailwind CSS v4 Upgrade",
          "labels": [
            "Medium-Large",
            "Infrastructure"
          ],
          "checklist": [
            {
              "id": "tw-1",
              "text": "Run npx @tailwindcss/upgrade on feature branch",
              "completed": true
            },
            {
              "id": "tw-2",
              "text": "Update PostCSS config (remove autoprefixer)",
              "completed": true
            },
            {
              "id": "tw-3",
              "text": "Consider Vite plugin migration",
              "completed": true
            },
            {
              "id": "tw-4",
              "text": "Fix shadow/blur/rounded utility renames",
              "completed": true
            },
            {
              "id": "tw-5",
              "text": "Update outline-none → outline-hidden",
              "completed": true
            },
            {
              "id": "tw-6",
              "text": "Migrate tailwindcss-animate plugin",
              "completed": true
            },
            {
              "id": "tw-7",
              "text": "Remove @tailwindcss/container-queries (now built-in)",
              "completed": true
            },
            {
              "id": "tw-8",
              "text": "Test dark mode and animations",
              "completed": true
            },
            {
              "id": "tw-9",
              "text": "Run Lighthouse audit before/after",
              "completed": true
            }
          ],
          "planFile": "docs/plans/22-tailwind-v4-upgrade.md",
          "createdAt": "2026-01-08T00:00:00.000Z",
          "updatedAt": "2026-01-21T00:00:00.000Z",
          "history": [
            {
              "type": "column",
              "timestamp": "2026-01-08T00:00:00.000Z",
              "columnId": "ideas",
              "columnTitle": "Ideas"
            },
            {
              "type": "column",
              "timestamp": "2026-01-20T00:00:00.000Z",
              "columnId": "in-progress",
              "columnTitle": "In Progress"
            },
            {
              "type": "column",
              "timestamp": "2026-01-21T00:00:00.000Z",
              "columnId": "changelog",
              "columnTitle": "Change Log"
            }
          ],
          "description": "Migrate to v4: CSS-based config, Vite plugin, updated utilities. ~116 class renames across 59 files.\n\nCompleted Jan 21. See blog post: \"Tailwind v4 Upgrade: The Performance Tradeoff\""
        },
        {
          "id": "preview-deploys",
          "title": "Preview Deployments",
          "labels": [
            "Infrastructure"
          ],
          "checklist": [
            {
              "id": "pd-1",
              "text": "Set up Cloudflare Pages with GitHub repo",
              "completed": true
            },
            {
              "id": "pd-2",
              "text": "Configure preview URL pattern",
              "completed": true
            },
            {
              "id": "pd-3",
              "text": "Create PR comment workflow with preview link",
              "completed": true
            },
            {
              "id": "pd-4",
              "text": "Configure environment variables (disable analytics in preview)",
              "completed": true
            },
            {
              "id": "pd-5",
              "text": "Add PreviewBanner component for visual indicator",
              "completed": true
            }
          ],
          "planFile": "docs/plans/10-preview-deployments.md",
          "createdAt": "2026-01-13",
          "updatedAt": "2026-01-16T03:35:00.000Z",
          "history": [
            {
              "type": "column",
              "timestamp": "2026-01-16T02:58:32.294Z",
              "columnId": "in-progress",
              "columnTitle": "In Progress"
            },
            {
              "type": "column",
              "timestamp": "2026-01-16T03:22:00.000Z",
              "columnId": "in-review",
              "columnTitle": "In Review"
            },
            {
              "type": "column",
              "timestamp": "2026-01-16T03:35:00.000Z",
              "columnId": "changelog",
              "columnTitle": "Change Log"
            }
          ],
          "description": "Deploy PRs to unique preview URLs via Cloudflare Pages. Enables visual review before merge.\n\nPreview URL: https://personal-website-adg.pages.dev\nBranch pattern: <branch>.personal-website-adg.pages.dev"
        },
        {
          "id": "analytics-dedupe",
          "title": "Analytics Data Deduplication",
          "labels": [
            "Small",
            "Bug Fix"
          ],
          "checklist": [
            {
              "id": "ad-1",
              "text": "Add deduplicateByDate helper function",
              "completed": true
            },
            {
              "id": "ad-2",
              "text": "Apply to ga4History and searchHistory data",
              "completed": true
            },
            {
              "id": "ad-3",
              "text": "Verify charts show one point per date",
              "completed": true
            }
          ],
          "createdAt": "2026-01-15",
          "updatedAt": "2026-01-16T01:35:00.000Z",
          "history": [
            {
              "type": "column",
              "timestamp": "2026-01-15T12:00:00.000Z",
              "columnId": "todo",
              "columnTitle": "To Do"
            },
            {
              "type": "column",
              "timestamp": "2026-01-16T01:22:46.568Z",
              "columnId": "in-progress",
              "columnTitle": "In Progress"
            },
            {
              "type": "column",
              "timestamp": "2026-01-16T01:22:46.910Z",
              "columnId": "in-review",
              "columnTitle": "In Review"
            },
            {
              "type": "column",
              "timestamp": "2026-01-16T01:35:00.000Z",
              "columnId": "changelog",
              "columnTitle": "Change Log"
            }
          ],
          "description": "Deduplicate time-series data in useAnalyticsData hook. ga4-history.json has multiple entries per date from automated collection."
        },
        {
          "id": "sentry-enhancement",
          "title": "Sentry Error Tracking Enhancement",
          "labels": [
            "PR #130",
            "Observability"
          ],
          "checklist": [
            {
              "id": "se-1",
              "text": "Install @sentry/cli and add auth token to GitHub secrets",
              "completed": true
            },
            {
              "id": "se-2",
              "text": "Add source map upload to deploy workflow",
              "completed": true
            },
            {
              "id": "se-3",
              "text": "Wrap App in Sentry.ErrorBoundary with fallback UI",
              "completed": true
            },
            {
              "id": "se-4",
              "text": "Add release tracking with commit SHA",
              "completed": true
            },
            {
              "id": "se-5",
              "text": "Verify source maps appear in Sentry dashboard",
              "completed": true
            }
          ],
          "createdAt": "2026-01-15",
          "updatedAt": "2026-01-16T02:10:00.000Z",
          "history": [
            {
              "type": "column",
              "timestamp": "2026-01-16T01:22:48.676Z",
              "columnId": "in-progress",
              "columnTitle": "In Progress"
            },
            {
              "type": "column",
              "timestamp": "2026-01-16T01:41:18.527Z",
              "columnId": "in-review",
              "columnTitle": "In Review"
            },
            {
              "type": "column",
              "timestamp": "2026-01-16T02:10:00.000Z",
              "columnId": "changelog",
              "columnTitle": "Change Log"
            }
          ],
          "description": "Source maps for readable stack traces, React error boundaries, release tracking, and improved debugging context.\n\nCodex Review of PR #130:\n- High (fixed): Sentry lazy loading inconsistency - ErrorBoundary imported but Sentry.init deferred. Fixed: now initializes synchronously before render.\n- Medium (fixed): Source maps publicly served exposing source code. Fixed: using hidden sourcemaps + delete after Sentry upload."
        },
        {
          "id": "error-budget-burndown",
          "title": "Error Budget Burndown",
          "labels": [
            "PR #136",
            "SRE",
            "Calculator"
          ],
          "checklist": [
            {
              "id": "ebb-1",
              "text": "Create ErrorBudgetBurndown component",
              "completed": true
            },
            {
              "id": "ebb-2",
              "text": "Add to project registry with route",
              "completed": true
            },
            {
              "id": "ebb-3",
              "text": "Build SLO configuration inputs",
              "completed": true
            },
            {
              "id": "ebb-4",
              "text": "Build incident input form",
              "completed": true
            },
            {
              "id": "ebb-5",
              "text": "Implement budget calculations",
              "completed": true
            },
            {
              "id": "ebb-6",
              "text": "Create burndown chart with Recharts",
              "completed": true
            },
            {
              "id": "ebb-7",
              "text": "Add summary cards with key metrics",
              "completed": true
            },
            {
              "id": "ebb-8",
              "text": "Mobile responsive layout",
              "completed": true
            }
          ],
          "planFile": "docs/plans/26-error-budget-burndown.md",
          "createdAt": "2026-01-16",
          "updatedAt": "2026-01-17T14:00:00.000Z",
          "history": [
            {
              "type": "column",
              "timestamp": "2026-01-16T04:30:00.000Z",
              "columnId": "todo",
              "columnTitle": "To Do"
            },
            {
              "type": "column",
              "timestamp": "2026-01-16T05:00:00.000Z",
              "columnId": "in-progress",
              "columnTitle": "In Progress"
            },
            {
              "type": "column",
              "timestamp": "2026-01-17T14:00:00.000Z",
              "columnId": "changelog",
              "columnTitle": "Change Log"
            }
          ],
          "description": "Visualize how quickly you're consuming error budget. Input SLO target + incident history to see burn rate and projected exhaustion date."
        },
        {
          "id": "kanban-giscus",
          "title": "Kanban Card Comments",
          "labels": [
            "PR #131",
            "Feature"
          ],
          "checklist": [
            {
              "id": "gc-1",
              "text": "Create reusable CardComments component",
              "completed": true
            },
            {
              "id": "gc-2",
              "text": "Add theme matching (sync with site dark/light mode)",
              "completed": true
            },
            {
              "id": "gc-3",
              "text": "Add to CardEditorModal with lazy loading",
              "completed": true
            },
            {
              "id": "gc-4",
              "text": "Use card.id as discussion term",
              "completed": true
            },
            {
              "id": "gc-5",
              "text": "Test theme switching and comment persistence",
              "completed": true
            }
          ],
          "planFile": "docs/plans/25-kanban-card-comments.md",
          "createdAt": "2026-01-16",
          "updatedAt": "2026-01-16T02:30:00.000Z",
          "history": [
            {
              "type": "column",
              "timestamp": "2026-01-16T02:20:00.000Z",
              "columnId": "in-progress",
              "columnTitle": "In Progress"
            },
            {
              "type": "column",
              "timestamp": "2026-01-16T02:25:00.000Z",
              "columnId": "in-review",
              "columnTitle": "In Review"
            },
            {
              "type": "column",
              "timestamp": "2026-01-16T02:30:00.000Z",
              "columnId": "changelog",
              "columnTitle": "Change Log"
            }
          ],
          "description": "Add giscus discussion threads to kanban cards. Reuse existing blog Comments pattern with theme matching. Also fixed blog Comments to use ThemeContext."
        },
        {
          "id": "slo-calculator-seo",
          "title": "SLO Calculator SEO",
          "labels": [
            "PR #149",
            "SEO",
            "Enhancement"
          ],
          "checklist": [
            {
              "id": "seo-1",
              "text": "Add WebApplication JSON-LD schema to Project.tsx",
              "completed": true
            },
            {
              "id": "seo-2",
              "text": "Add BreadcrumbList JSON-LD schema",
              "completed": true
            },
            {
              "id": "seo-3",
              "text": "Add keywords field to ProjectMeta type",
              "completed": true
            },
            {
              "id": "seo-4",
              "text": "Update SLO Calculator with keywords",
              "completed": true
            },
            {
              "id": "seo-5",
              "text": "Fix ogImage to use absolute URLs",
              "completed": true
            }
          ],
          "createdAt": "2026-01-16T00:00:00.000Z",
          "updatedAt": "2026-01-17T03:00:00.000Z",
          "history": [
            {
              "type": "column",
              "timestamp": "2026-01-16T23:30:00.000Z",
              "columnId": "ideas",
              "columnTitle": "Ideas"
            },
            {
              "type": "column",
              "timestamp": "2026-01-17T02:30:00.000Z",
              "columnId": "in-review",
              "columnTitle": "In Review"
            },
            {
              "type": "column",
              "timestamp": "2026-01-17T03:00:00.000Z",
              "columnId": "changelog",
              "columnTitle": "Change Log"
            }
          ],
          "description": "Added JSON-LD structured data and keyword optimization for SLO Calculator project page.\n\nImplemented:\n- WebApplication JSON-LD schema for active projects\n- BreadcrumbList JSON-LD schema for navigation\n- Keywords and ogImage fields in ProjectMeta type\n- SEO-optimized keywords for SLO Calculator\n- resolveOgImage helper for absolute URL handling\n\nOG image generation moved to separate task (Programmatic OG Image Generation)."
        },
        {
          "id": "slo-tools-cross-pollination",
          "title": "SLO Tools Cross-Pollination",
          "labels": [
            "PR #143",
            "PR #144",
            "Enhancement",
            "SRE"
          ],
          "checklist": [
            {
              "id": "slo-xp-1",
              "text": "Create shared sloPresets.ts with target, label, budget description",
              "completed": true
            },
            {
              "id": "slo-xp-2",
              "text": "Update Error Budget Burndown to use shared presets",
              "completed": true
            },
            {
              "id": "slo-xp-3",
              "text": "Update Uptime Calculator to use shared presets",
              "completed": true
            },
            {
              "id": "slo-xp-4",
              "text": "Add 'See impact on Error Budget' link from Uptime Calculator insights",
              "completed": true
            },
            {
              "id": "slo-xp-5",
              "text": "Add 'Improve response times' link from Error Budget Burndown",
              "completed": true
            },
            {
              "id": "slo-xp-6",
              "text": "Pass context via URL params for pre-populated views",
              "completed": true
            }
          ],
          "planFile": "docs/plans/31-slo-tools-cross-pollination.md",
          "createdAt": "2026-01-16",
          "updatedAt": "2026-01-16T23:30:00.000Z",
          "history": [
            {
              "type": "column",
              "timestamp": "2026-01-16T19:45:00.000Z",
              "columnId": "ideas",
              "columnTitle": "Ideas"
            },
            {
              "type": "column",
              "timestamp": "2026-01-16T22:45:00.000Z",
              "columnId": "in-progress",
              "columnTitle": "In Progress"
            },
            {
              "type": "column",
              "timestamp": "2026-01-16T22:55:00.000Z",
              "columnId": "in-review",
              "columnTitle": "In Review"
            },
            {
              "type": "column",
              "timestamp": "2026-01-16T23:30:00.000Z",
              "columnId": "changelog",
              "columnTitle": "Change Log"
            }
          ],
          "description": "Connected SLO tools with shared presets and cross-linking. Unified sloPresets.ts, slider magnetism, flexible input ranges (0-99.999%), and URL param sync for SLO + incidents."
        },
        {
          "id": "unified-slo-tool",
          "title": "Unified SLO Calculator",
          "summary": "Merged SLO Calculator + Error Budget into 3-tab interface",
          "labels": [
            "PR #145",
            "PR #146",
            "Feature",
            "SRE"
          ],
          "checklist": [
            {
              "id": "ust-1",
              "text": "Create unified calculations.ts",
              "completed": true
            },
            {
              "id": "ust-2",
              "text": "Create SloConfiguration with period selector",
              "completed": true
            },
            {
              "id": "ust-3",
              "text": "Create ResponseTimeInputs with toggles",
              "completed": true
            },
            {
              "id": "ust-4",
              "text": "Create BudgetChart (compact/full modes)",
              "completed": true
            },
            {
              "id": "ust-5",
              "text": "Create AchievableTab",
              "completed": true
            },
            {
              "id": "ust-6",
              "text": "Create TargetTab",
              "completed": true
            },
            {
              "id": "ust-7",
              "text": "Create BurndownTab",
              "completed": true
            },
            {
              "id": "ust-8",
              "text": "Add to project registry",
              "completed": true
            },
            {
              "id": "ust-9",
              "text": "Remove old SLO Calculator and Error Budget Burndown",
              "completed": true
            }
          ],
          "planFile": "docs/plans/32-unified-slo-tool.md",
          "createdAt": "2026-01-16T00:00:00.000Z",
          "updatedAt": "2026-01-16T23:00:00.000Z",
          "history": [
            {
              "type": "column",
              "timestamp": "2026-01-16T20:45:00.000Z",
              "columnId": "ideas",
              "columnTitle": "Ideas"
            },
            {
              "type": "column",
              "timestamp": "2026-01-16T21:00:00.000Z",
              "columnId": "in-progress",
              "columnTitle": "In Progress"
            },
            {
              "type": "column",
              "timestamp": "2026-01-16T23:45:00.000Z",
              "columnId": "in-review",
              "columnTitle": "In Review"
            },
            {
              "type": "column",
              "timestamp": "2026-01-16T23:00:00.000Z",
              "columnId": "changelog",
              "columnTitle": "Change Log"
            }
          ],
          "description": "Consolidated SLO Calculator and Error Budget Burndown into one project with three tabs:\n\n- What can I achieve? (response time inputs directly visible)\n- Can I meet this SLO? (collapsible config)\n- Budget Burndown (full chart view)\n\nRemoved 2,700+ lines of redundant code. Collapsible configuration for target/burndown tabs, direct inputs for achievable tab."
        },
        {
          "id": "gr9qef9",
          "title": "Change Log Explorer Project",
          "labels": [
            "PR #140",
            "Feature",
            "Meta"
          ],
          "checklist": [
            {
              "id": "cle-1",
              "text": "Create useChangelogData hook to fetch and merge data",
              "completed": true
            },
            {
              "id": "cle-2",
              "text": "Create ChangelogExplorer main component",
              "completed": true
            },
            {
              "id": "cle-3",
              "text": "Create ChangelogCard with expand/collapse animation",
              "completed": true
            },
            {
              "id": "cle-4",
              "text": "Create ExpandedDetails with plan rendering",
              "completed": true
            },
            {
              "id": "cle-5",
              "text": "Add filter controls and PR link badges",
              "completed": true
            },
            {
              "id": "cle-6",
              "text": "Add to project registry with route",
              "completed": true
            },
            {
              "id": "cle-7",
              "text": "Mobile responsive layout and loading skeletons",
              "completed": true
            }
          ],
          "planFile": "docs/plans/28-changelog-explorer-project.md",
          "createdAt": "2026-01-16T14:45:36.426Z",
          "updatedAt": "2026-01-16T18:35:00.000Z",
          "history": [
            {
              "type": "column",
              "timestamp": "2026-01-16T14:45:36.426Z",
              "columnId": "ideas",
              "columnTitle": "Ideas"
            },
            {
              "type": "column",
              "timestamp": "2026-01-16T17:50:00.000Z",
              "columnId": "todo",
              "columnTitle": "To Do"
            },
            {
              "type": "column",
              "timestamp": "2026-01-16T21:00:00.000Z",
              "columnId": "in-progress",
              "columnTitle": "In Progress"
            },
            {
              "type": "column",
              "timestamp": "2026-01-16T18:14:27.000Z",
              "columnId": "in-review",
              "columnTitle": "In Review"
            },
            {
              "type": "column",
              "timestamp": "2026-01-16T18:35:00.000Z",
              "columnId": "changelog",
              "columnTitle": "Change Log"
            }
          ],
          "description": "Visualize completed work from kanban changelog and archive. Rich expandable cards with PR links, plan file content, and completion history."
        },
        {
          "id": "kanban-url-cleanup",
          "title": "Kanban URL Simplification",
          "labels": [
            "PR #139",
            "Cleanup",
            "UX"
          ],
          "checklist": [
            {
              "id": "kus-1",
              "text": "Delete useKanbanPersistence.ts",
              "completed": true
            },
            {
              "id": "kus-2",
              "text": "Remove URL persistence from KanbanBoard.tsx",
              "completed": true
            },
            {
              "id": "kus-3",
              "text": "Add initialCardId prop and auto-open logic",
              "completed": true
            },
            {
              "id": "kus-4",
              "text": "Update index.tsx to read card param",
              "completed": true
            },
            {
              "id": "kus-5",
              "text": "Update Share button to copy clean URL",
              "completed": true
            },
            {
              "id": "kus-6",
              "text": "Add Copy Card Link to card menu",
              "completed": true
            },
            {
              "id": "kus-7",
              "text": "Remove lz-string dependency",
              "completed": true
            }
          ],
          "planFile": "docs/plans/29-kanban-url-simplification.md",
          "createdAt": "2026-01-16T17:55:00.000Z",
          "updatedAt": "2026-01-16T18:14:27.000Z",
          "history": [
            {
              "type": "column",
              "timestamp": "2026-01-16T17:55:00.000Z",
              "columnId": "ideas",
              "columnTitle": "Ideas"
            },
            {
              "type": "column",
              "timestamp": "2026-01-16T18:05:00.000Z",
              "columnId": "todo",
              "columnTitle": "To Do"
            },
            {
              "type": "column",
              "timestamp": "2026-01-16T21:00:00.000Z",
              "columnId": "in-progress",
              "columnTitle": "In Progress"
            },
            {
              "type": "column",
              "timestamp": "2026-01-16T18:14:27.000Z",
              "columnId": "changelog",
              "columnTitle": "Change Log"
            }
          ],
          "description": "Remove URL state persistence, keep just `?board=roadmap`. Add deep linking with `?card=id` to open specific cards on load."
        },
        {
          "id": "precommit-hooks",
          "title": "Pre-commit Hooks (Husky + lint-staged)",
          "labels": [
            "PR #137",
            "Infrastructure",
            "DX"
          ],
          "checklist": [
            {
              "id": "pch-1",
              "text": "Install husky and lint-staged",
              "completed": true
            },
            {
              "id": "pch-2",
              "text": "Initialize husky and create pre-commit hook",
              "completed": true
            },
            {
              "id": "pch-3",
              "text": "Add lint-staged config to package.json",
              "completed": true
            },
            {
              "id": "pch-4",
              "text": "Test with intentional lint error",
              "completed": true
            },
            {
              "id": "pch-5",
              "text": "Verify normal commits work",
              "completed": true
            }
          ],
          "createdAt": "2026-01-16T19:30:00.000Z",
          "updatedAt": "2026-01-16T20:00:00.000Z",
          "history": [
            {
              "type": "column",
              "timestamp": "2026-01-16T19:30:00.000Z",
              "columnId": "ideas",
              "columnTitle": "Ideas"
            },
            {
              "type": "column",
              "timestamp": "2026-01-16T19:45:00.000Z",
              "columnId": "in-progress",
              "columnTitle": "In Progress"
            },
            {
              "type": "column",
              "timestamp": "2026-01-16T19:55:00.000Z",
              "columnId": "in-review",
              "columnTitle": "In Review"
            },
            {
              "type": "column",
              "timestamp": "2026-01-16T20:00:00.000Z",
              "columnId": "changelog",
              "columnTitle": "Change Log"
            }
          ],
          "description": "Add Husky + lint-staged for pre-commit hooks. Runs ESLint with auto-fix on staged TS/JS files before every commit."
        },
        {
          "id": "kanban-external-change-detection",
          "title": "Kanban External Change Detection",
          "summary": "Toast notification when board is updated externally",
          "labels": [
            "PR #141",
            "UX",
            "Kanban"
          ],
          "checklist": [
            {
              "id": "ecd-1",
              "text": "Add checkForExternalChanges callback",
              "completed": true
            },
            {
              "id": "ecd-2",
              "text": "Add visibility change listener and 15s polling",
              "completed": true
            },
            {
              "id": "ecd-3",
              "text": "Show Sonner toast with reload action",
              "completed": true
            },
            {
              "id": "ecd-4",
              "text": "Use toast ID to prevent duplicates",
              "completed": true
            },
            {
              "id": "ecd-5",
              "text": "Clean up interval and listener on unmount",
              "completed": true
            },
            {
              "id": "ecd-6",
              "text": "Test external change detection",
              "completed": true
            }
          ],
          "planFile": "docs/plans/30-kanban-external-change-detection.md",
          "createdAt": "2026-01-16T20:15:00.000Z",
          "updatedAt": "2026-01-16T18:50:00.000Z",
          "history": [
            {
              "type": "column",
              "timestamp": "2026-01-16T20:15:00.000Z",
              "columnId": "ideas",
              "columnTitle": "Ideas"
            },
            {
              "type": "column",
              "timestamp": "2026-01-16T18:45:00.000Z",
              "columnId": "in-progress",
              "columnTitle": "In Progress"
            },
            {
              "type": "column",
              "timestamp": "2026-01-16T18:50:00.000Z",
              "columnId": "changelog",
              "columnTitle": "Change Log"
            }
          ],
          "description": "Detect when board is updated externally (e.g., by Claude commits). Check on tab focus + every 15s while visible. Show toast with reload button to prevent save conflicts."
        },
        {
          "id": "cli-tool-playground",
          "title": "CLI Tool Playground",
          "summary": "In-browser kubectl/jq/grep/sed/awk with Learn and Play modes",
          "labels": [
            "PR #156",
            "Feature",
            "Learning",
            "Tool"
          ],
          "checklist": [
            {
              "id": "ctp-1",
              "text": "Create tool selector (kubectl, jq, grep, sed, awk)",
              "completed": true
            },
            {
              "id": "ctp-2",
              "text": "Build input editor with sample data presets",
              "completed": true
            },
            {
              "id": "ctp-3",
              "text": "Build command editor with syntax highlighting",
              "completed": true
            },
            {
              "id": "ctp-4",
              "text": "Implement pure JS execution engines",
              "completed": true
            },
            {
              "id": "ctp-5",
              "text": "Create output panel with copy and clear",
              "completed": true
            },
            {
              "id": "ctp-6",
              "text": "Add explanation panel for command breakdown",
              "completed": true
            },
            {
              "id": "ctp-7",
              "text": "Implement shareable URL state (input + command)",
              "completed": true
            },
            {
              "id": "ctp-8",
              "text": "Add kubectl simulator with 5 triage scenarios",
              "completed": true
            },
            {
              "id": "ctp-9",
              "text": "Add --help for all tools",
              "completed": true
            },
            {
              "id": "ctp-10",
              "text": "Security fixes (XSS, URL validation, race conditions)",
              "completed": true
            }
          ],
          "planFile": "docs/plans/47-cli-tool-playground.md",
          "createdAt": "2026-01-17T00:00:00.000Z",
          "updatedAt": "2026-01-18T01:15:00.000Z",
          "history": [
            {
              "type": "column",
              "timestamp": "2026-01-17T21:30:00.000Z",
              "columnId": "in-progress",
              "columnTitle": "In Progress"
            },
            {
              "type": "column",
              "timestamp": "2026-01-18T01:15:00.000Z",
              "columnId": "changelog",
              "columnTitle": "Change Log"
            }
          ],
          "description": "Interactive in-browser demos for CLI tools. Pure JS implementations (no WASM).\n\nFeatures:\n- Tool selector: kubectl, jq, grep, sed, awk\n- Learn mode with goals, hints, and command chips\n- Playground mode for freeform experimentation\n- Command explainer with flag breakdowns and 'Try next' suggestions\n- Shareable URL state (tool, mode, input, command)\n- 5 presets per tool covering common use cases\n\nkubectl simulator:\n- 5 triage scenarios (CrashLoopBackOff, ImagePullBackOff, Service Mismatch, Rollout Regression, Node Pressure)\n- Full K8s resource schema (pods, deployments, services, nodes, events)\n- Supports: get, describe, logs, rollout, top, events\n- Session state mutation for rollback commands\n\nSecurity fixes:\n- Replaced Function() with safe regex parser (XSS)\n- URL param validation with fallbacks\n- Race condition guards for async results"
        },
        {
          "id": "programmatic-og-images",
          "title": "Programmatic OG Image Generation",
          "summary": "Build-time OG images via satori + resvg for project pages",
          "labels": [
            "PR #150",
            "Enhancement",
            "Infrastructure"
          ],
          "checklist": [
            {
              "id": "og-1",
              "text": "Research @vercel/og vs satori for static generation",
              "completed": true
            },
            {
              "id": "og-2",
              "text": "Design OG image template (layout, colors, typography)",
              "completed": true
            },
            {
              "id": "og-3",
              "text": "Create generateOgImages.mjs script",
              "completed": true
            },
            {
              "id": "og-4",
              "text": "Add to build pipeline",
              "completed": true
            },
            {
              "id": "og-5",
              "text": "Update Project.tsx to use generated images",
              "completed": true
            },
            {
              "id": "og-6",
              "text": "Generate images for all active projects",
              "completed": true
            }
          ],
          "planFile": "docs/plans/33-programmatic-og-images.md",
          "createdAt": "2026-01-17T00:00:00.000Z",
          "updatedAt": "2026-01-17T03:15:00.000Z",
          "history": [
            {
              "type": "column",
              "timestamp": "2026-01-17T02:45:00.000Z",
              "columnId": "ideas",
              "columnTitle": "Ideas"
            },
            {
              "type": "column",
              "timestamp": "2026-01-17T02:49:00.000Z",
              "columnId": "in-progress",
              "columnTitle": "In Progress"
            },
            {
              "type": "column",
              "timestamp": "2026-01-17T03:15:00.000Z",
              "columnId": "changelog",
              "columnTitle": "Change Log"
            }
          ],
          "description": "Generate Open Graph images at build time for project pages using satori + @resvg/resvg-js.\n\nImplemented:\n- Build-time generation via scripts/generate-og-images.mjs\n- Build-time validation via scripts/validate-projects.mjs\n- Dark theme template with icon, title, description, tags\n- Inter font (regular + bold) for typography\n- Added to build pipeline in package.json\n- Extracted project metadata to projects-meta.json\n- Simplified projects.ts by removing inline metadata\n- Fail-fast guards for CI (exits 1 on generation or validation failures)"
        },
        {
          "id": "slo-burndown-integration",
          "title": "SLO Calculator Burndown Integration",
          "labels": [
            "PR #142",
            "Enhancement",
            "SRE"
          ],
          "checklist": [
            {
              "id": "sbi-1",
              "text": "Export BurndownChart and calculations from error-budget-burndown",
              "completed": true
            },
            {
              "id": "sbi-2",
              "text": "Create SloBurndownPanel component",
              "completed": true
            },
            {
              "id": "sbi-3",
              "text": "Add generateSimulatedIncidents helper",
              "completed": true
            },
            {
              "id": "sbi-4",
              "text": "Add 'SLO Burndown' tab to UptimeCalculator",
              "completed": true
            },
            {
              "id": "sbi-5",
              "text": "Wire up inputs and add burn rate summary",
              "completed": true
            },
            {
              "id": "sbi-6",
              "text": "Mobile responsive check",
              "completed": true
            }
          ],
          "planFile": "docs/plans/27-slo-calculator-burndown-integration.md",
          "createdAt": "2026-01-17",
          "updatedAt": "2026-01-16T20:15:00.000Z",
          "history": [
            {
              "type": "column",
              "timestamp": "2026-01-17T14:10:00.000Z",
              "columnId": "todo",
              "columnTitle": "To Do"
            },
            {
              "type": "column",
              "timestamp": "2026-01-16T18:48:53.156Z",
              "columnId": "in-progress",
              "columnTitle": "In Progress"
            },
            {
              "type": "column",
              "timestamp": "2026-01-16T18:48:53.165Z",
              "columnId": "todo",
              "columnTitle": "To Do"
            },
            {
              "type": "column",
              "timestamp": "2026-01-16T18:48:53.187Z",
              "columnId": "in-progress",
              "columnTitle": "In Progress"
            },
            {
              "type": "column",
              "timestamp": "2026-01-16T19:30:00.000Z",
              "columnId": "in-review",
              "columnTitle": "In Review"
            },
            {
              "type": "column",
              "timestamp": "2026-01-16T20:15:00.000Z",
              "columnId": "changelog",
              "columnTitle": "Change Log"
            }
          ],
          "description": "Add 'SLO Burndown' tab to SLO Uptime Calculator. Reuse BurndownChart from Error Budget Burndown, generate simulated incidents from 'incidents per month' input."
        },
        {
          "id": "slo-tool-ux-improvements",
          "title": "SLO Tool UX Improvements",
          "summary": "Better defaults, collapsible sections, burn rate simulator",
          "labels": [
            "PR #151",
            "Enhancement",
            "SRE"
          ],
          "checklist": [],
          "createdAt": "2026-01-17T00:00:00.000Z",
          "updatedAt": "2026-01-17T01:37:34.000Z",
          "history": [
            {
              "type": "column",
              "timestamp": "2026-01-17T01:37:34.000Z",
              "columnId": "changelog",
              "columnTitle": "Change Log"
            }
          ],
          "description": "Polished the SLO Calculator with better defaults and new burn rate simulator.\n\nChanges:\n- Realistic default response times (26m MTTR)\n- Collapsible Response Times section (shows Alert latency by default)\n- Removed redundant burndown charts from Achievable/Target tabs\n- Added interactive Burn Rate Simulator slider (0.1x-5x)\n- Explanatory text for the 'ideal' line concept\n- Fixed slider resync when inputs change (Codex finding)\n- Fixed edge case when zero incidents (Codex finding)"
        },
        {
          "id": "animated-mermaid-diagrams",
          "title": "Animated Mermaid Diagrams",
          "summary": "Interactive step-by-step walkthrough for incident command flowcharts",
          "labels": [
            "PR #162",
            "Feature",
            "SRE"
          ],
          "checklist": [],
          "createdAt": "2026-01-18T00:00:00.000Z",
          "updatedAt": "2026-01-18T19:30:00.000Z",
          "history": [
            {
              "type": "column",
              "timestamp": "2026-01-18T16:49:00.000Z",
              "columnId": "in-progress",
              "columnTitle": "In Progress"
            },
            {
              "type": "column",
              "timestamp": "2026-01-18T19:30:00.000Z",
              "columnId": "changelog",
              "columnTitle": "Change Log"
            }
          ],
          "description": "Added animated walkthrough mode to incident-command-diagrams with:\n\n- Step-by-step animation with play/pause/skip/back controls\n- Decision nodes that pause for user to choose a path (branching logic)\n- Link nodes for cross-diagram navigation and external tool links\n- Side-by-side layout with sticky context panel\n- Auto-scroll to center active node in viewport\n- Progress bar and step counter\n- Lazy-loaded Mermaid rendering with theme support"
        },
        {
          "id": "analytics-bot-ci-tagging",
          "title": "Analytics Bot & CI Traffic Tagging",
          "labels": [
            "Small",
            "Analytics"
          ],
          "checklist": [
            {
              "id": "abt-1",
              "text": "Create traffic classification utility (bot, ci, human)",
              "completed": true
            },
            {
              "id": "abt-2",
              "text": "Detect CI via user agent (HeadlessChrome, Playwright)",
              "completed": true
            },
            {
              "id": "abt-3",
              "text": "Add custom dimension to GA4 config",
              "completed": true
            },
            {
              "id": "abt-4",
              "text": "Tag sessions on first pageview",
              "completed": true
            },
            {
              "id": "abt-5",
              "text": "Add traffic type filter to analytics dashboard",
              "completed": true
            },
            {
              "id": "abt-6",
              "text": "Document patterns discovered for future reference",
              "completed": true
            }
          ],
          "createdAt": "2026-01-19T00:00:00.000Z",
          "updatedAt": "2026-01-23T00:00:00.000Z",
          "history": [
            {
              "type": "column",
              "timestamp": "2026-01-19T00:00:00.000Z",
              "columnId": "ideas",
              "columnTitle": "Ideas"
            },
            {
              "type": "column",
              "timestamp": "2026-01-21T00:00:00.000Z",
              "columnId": "in-progress",
              "columnTitle": "In Progress"
            },
            {
              "type": "column",
              "timestamp": "2026-01-23T00:00:00.000Z",
              "columnId": "changelog",
              "columnTitle": "Change Log"
            }
          ],
          "description": "Tag suspicious traffic with custom dimension instead of filtering. Enables analysis of bot patterns while keeping data.\n\nImplemented in `src/lib/analytics/clientTrafficClassifier.ts`:\n- Known bot user agents (Googlebot, Bingbot, HeadlessChrome, etc.)\n- CI/automation user agents (GitHub Actions runners, Playwright)\n- Known probe paths (wp-admin, .env, xmlrpc.php, etc.)\n- Sessions tagged on first pageview with GA4 custom dimension"
        },
        {
          "id": "analytics-event-tracking",
          "title": "Analytics Event Tracking",
          "labels": [
            "Small",
            "Analytics"
          ],
          "checklist": [
            {
              "id": "aet-1",
              "text": "Define event schema (tool_interaction, action, tool_name)",
              "completed": true
            },
            {
              "id": "aet-2",
              "text": "Add events to SLO Calculator (tab switch, calculate, copy)",
              "completed": true
            },
            {
              "id": "aet-3",
              "text": "Add events to CLI Playground (run command, preset select)",
              "completed": true
            },
            {
              "id": "aet-4",
              "text": "Add events to On-Call Coverage (timezone add, model switch)",
              "completed": true
            },
            {
              "id": "aet-5",
              "text": "Update analytics dashboard to show tool engagement",
              "completed": true
            }
          ],
          "createdAt": "2026-01-19T00:00:00.000Z",
          "updatedAt": "2026-01-23T00:00:00.000Z",
          "history": [
            {
              "type": "column",
              "timestamp": "2026-01-19T00:00:00.000Z",
              "columnId": "ideas",
              "columnTitle": "Ideas"
            },
            {
              "type": "column",
              "timestamp": "2026-01-21T00:00:00.000Z",
              "columnId": "in-progress",
              "columnTitle": "In Progress"
            },
            {
              "type": "column",
              "timestamp": "2026-01-23T00:00:00.000Z",
              "columnId": "changelog",
              "columnTitle": "Change Log"
            }
          ],
          "description": "Add GA4 events for interactive tool usage. Track calculator submissions, tab switches, copy-to-clipboard actions.\n\nImplemented in `src/lib/trackToolEvent.ts` with events firing in:\n- SLO Calculator: tab_switch, calculate, period_change\n- CLI Playground: command_run, tool_select, mode_switch, preset_select, share_copy\n- On-Call Coverage: model_select"
        },
        {
          "id": "lighthouse-a11y-seo-focus",
          "title": "Lighthouse: A11y & SEO Focus",
          "labels": [
            "Small",
            "Analytics",
            "Accessibility"
          ],
          "checklist": [
            {
              "id": "las-1",
              "text": "Review current Lighthouse workflow frequency and categories",
              "completed": true
            },
            {
              "id": "las-2",
              "text": "Configure Lighthouse to focus on a11y and SEO categories",
              "completed": true
            },
            {
              "id": "las-3",
              "text": "Reduce run frequency (weekly or on significant changes)",
              "completed": true
            },
            {
              "id": "las-4",
              "text": "Add a11y score to analytics dashboard",
              "completed": true
            }
          ],
          "createdAt": "2026-01-19T00:00:00.000Z",
          "updatedAt": "2026-01-23T00:00:00.000Z",
          "history": [
            {
              "type": "column",
              "timestamp": "2026-01-19T00:00:00.000Z",
              "columnId": "ideas",
              "columnTitle": "Ideas"
            },
            {
              "type": "column",
              "timestamp": "2026-01-21T00:00:00.000Z",
              "columnId": "in-progress",
              "columnTitle": "In Progress"
            },
            {
              "type": "column",
              "timestamp": "2026-01-23T00:00:00.000Z",
              "columnId": "changelog",
              "columnTitle": "Change Log"
            }
          ],
          "description": "Lab Lighthouse provides unique value for accessibility audits and SEO checks that field CWV data can't capture. Reframed the workflow to focus on these strengths.\n\nImplemented in `.github/workflows/lighthouse.yml`:\n- Path-based triggers (only runs on UI changes to src/pages, components, CSS)\n- Multi-page testing with thresholds: A11y ≥95, SEO ≥90, Best Practices ≥90\n- Results stored in lighthouse-metrics branch for historical tracking"
        },
        {
          "id": "react-hook-form-update",
          "title": "react-hook-form & @hookform/resolvers Update",
          "summary": "Dependency updates to unblock form validation library",
          "labels": [
            "PR #165",
            "Infrastructure"
          ],
          "checklist": [
            {
              "id": "rhf-1",
              "text": "Update react-hook-form to latest 7.x",
              "completed": true
            },
            {
              "id": "rhf-2",
              "text": "Run tests to verify form functionality",
              "completed": true
            },
            {
              "id": "rhf-3",
              "text": "Merge @hookform/resolvers PR #165",
              "completed": true
            }
          ],
          "createdAt": "2026-01-19T00:00:00.000Z",
          "updatedAt": "2026-01-19T20:40:00.000Z",
          "history": [
            {
              "type": "column",
              "timestamp": "2026-01-19T20:00:00.000Z",
              "columnId": "in-progress",
              "columnTitle": "In Progress"
            },
            {
              "type": "column",
              "timestamp": "2026-01-19T20:40:00.000Z",
              "columnId": "changelog",
              "columnTitle": "Change Log"
            }
          ],
          "description": "Updated react-hook-form from 7.53.0 to 7.71.1 and @hookform/resolvers from 3.10.0 to 5.2.2. The resolvers package had a peer dependency requiring react-hook-form >=7.55.0."
        },
        {
          "id": "markdown-based-kanban",
          "title": "Migrate Kanban to Markdown Files",
          "labels": [
            "Medium",
            "DX",
            "Infrastructure"
          ],
          "checklist": [
            {
              "id": "mbk-1",
              "text": "Evaluate Backlog.md vs custom Content Collections approach",
              "completed": true
            },
            {
              "id": "mbk-2",
              "text": "Design folder structure and frontmatter schema",
              "completed": true
            },
            {
              "id": "mbk-3",
              "text": "Create migration script (JSON → markdown files)",
              "completed": true
            },
            {
              "id": "mbk-4",
              "text": "Build aggregation utility (markdown files → typed data)",
              "completed": true
            },
            {
              "id": "mbk-5",
              "text": "Update useChangelogData hook to use new source",
              "completed": true
            },
            {
              "id": "mbk-6",
              "text": "Migrate roadmap-board.json",
              "completed": true
            },
            {
              "id": "mbk-7",
              "text": "Migrate house-board.json",
              "completed": true
            }
          ],
          "createdAt": "2026-01-22T00:00:00.000Z",
          "updatedAt": "2026-01-23T16:00:00.000Z",
          "history": [
            {
              "type": "column",
              "timestamp": "2026-01-22T00:00:00.000Z",
              "columnId": "ideas",
              "columnTitle": "Ideas"
            },
            {
              "type": "column",
              "timestamp": "2026-01-22T12:00:00.000Z",
              "columnId": "in-progress",
              "columnTitle": "In Progress"
            },
            {
              "type": "column",
              "timestamp": "2026-01-23T15:34:46.043Z",
              "columnId": "in-review",
              "columnTitle": "In Review"
            },
            {
              "type": "column",
              "timestamp": "2026-01-23T16:00:00.000Z",
              "columnId": "changelog",
              "columnTitle": "Change Log"
            }
          ],
          "description": "Replace monolithic roadmap-board.json with individual markdown files per card. Adopt Backlog.md pattern or Astro Content Collections approach.\n\nProblem: 1665-line JSON file is error-prone for manual editing (trailing commas, bracket mismatches).\n\nOptions evaluated:\n- Backlog.md (ready-made, Claude Code compatible)\n- Astro Content Collections pattern (gray-matter + Zod)\n- YAML files\n- TypeScript data files"
        },
        {
          "id": "phase-2-markdown-only-saves",
          "title": "Phase 2: Markdown-Only Saves",
          "labels": [
            "Medium",
            "Kanban",
            "Infrastructure"
          ],
          "checklist": [
            {
              "id": "p2-1",
              "text": "Update save workflow to write .md files instead of JSON",
              "completed": true
            },
            {
              "id": "p2-2",
              "text": "Generate card IDs from title slug (like CLI does)",
              "completed": true
            },
            {
              "id": "p2-3",
              "text": "Handle card renames (rename .md file)",
              "completed": true
            },
            {
              "id": "p2-4",
              "text": "Handle card deletion (delete .md file)",
              "completed": true
            },
            {
              "id": "p2-5",
              "text": "Trigger precompile after save (GitHub Action or webhook)",
              "completed": true
            },
            {
              "id": "p2-6",
              "text": "Remove JSON files after validation",
              "completed": true
            }
          ],
          "createdAt": "2026-01-23T00:00:00.000Z",
          "updatedAt": "2026-01-23T16:00:00.000Z",
          "history": [
            {
              "type": "column",
              "timestamp": "2026-01-23T00:00:00.000Z",
              "columnId": "ideas",
              "columnTitle": "Ideas"
            },
            {
              "type": "column",
              "timestamp": "2026-01-23T10:00:00.000Z",
              "columnId": "in-progress",
              "columnTitle": "In Progress"
            },
            {
              "type": "column",
              "timestamp": "2026-01-23T15:34:40.506Z",
              "columnId": "in-review",
              "columnTitle": "In Review"
            },
            {
              "type": "column",
              "timestamp": "2026-01-23T16:00:00.000Z",
              "columnId": "changelog",
              "columnTitle": "Change Log"
            }
          ],
          "description": "Eliminate dual maintenance by making markdown the single source of truth.\n\nCurrent state: JSON files are edited by save workflow, markdown files power ChangelogExplorer.\n\nTarget state: Save workflow writes .md files directly via GitHub API, precompile runs on every push.\n\nBenefits:\n- Single source of truth (no sync issues)\n- Better git diffs for card changes\n- Easier manual editing when needed\n- CLI tools work with same format"
        },
        {
          "id": "jan-23-kanban-phase-2",
          "title": "Jan 23: Kanban Phase 2 Complete",
          "summary": "Markdown is now the single source of truth for kanban boards",
          "labels": [
            "Infrastructure",
            "Kanban"
          ],
          "checklist": [],
          "createdAt": "2026-01-23T16:00:00.000Z",
          "updatedAt": "2026-01-23T16:00:00.000Z",
          "history": [
            {
              "type": "column",
              "timestamp": "2026-01-23T16:00:00.000Z",
              "columnId": "changelog",
              "columnTitle": "Change Log"
            }
          ],
          "description": "## Phase 2: Markdown-Only Saves\n\nCompleted the migration to make markdown the single source of truth for kanban boards.\n\n### Key Changes\n\n- **Eliminated JSON files**: Removed `roadmap-board.json`, `house-board.json`, and `roadmap-archive.json`\n- **Worker writes directly to markdown**: Save flow now commits `.md` files via GitHub Trees API\n- **Commit SHA conflict detection**: Replaced timestamp-based detection with atomic commit SHA comparison\n- **Precompiled JS fallback**: Board loads from worker API (primary) or generated JS (offline fallback)\n\n### Bug Fixes\n\n- Fixed UTF-8 encoding corruption for non-ASCII characters (arrows, emojis)\n- Fixed duplicate history entries during drag operations (moved tracking from `handleDragOver` to `handleDragEnd`)\n- Fixed Cloudflare Workers 50 subrequest limit by using inline content in tree items\n- Fixed open redirect vulnerability in OAuth return_to validation\n\n### Architecture\n\n```\nSave: UI → Worker → GitHub Trees API → content/kanban/*.md\n                ↓\n      repository_dispatch → precompile-content.yml\n                ↓\n      src/generated/kanban/*.js\n\nLoad: UI → Worker API (primary) → precompiled JS (fallback)\n```\n\nRelated PRs: #195, #198"
        }
      ]
    },
    {
      "id": "archived",
      "title": "Archived",
      "cards": [
        {
          "id": "jan-6-7",
          "title": "Jan 6-7: Node.js v24 + Perf",
          "labels": [
            "Performance"
          ],
          "checklist": [],
          "createdAt": "2026-01-07T00:00:00.000Z",
          "history": [],
          "description": "55 Ã¢ÂÂ 98 Lighthouse, system fonts, Radix cleanup"
        },
        {
          "id": "jan-8",
          "title": "Jan 8: Blog Phase 4 & 5",
          "labels": [
            "Feature"
          ],
          "checklist": [],
          "createdAt": "2026-01-08T00:00:00.000Z",
          "history": [],
          "description": "Comments, syntax highlighting, RSS, structured data"
        },
        {
          "id": "jan-11",
          "title": "Jan 11: MDX Precompilation",
          "labels": [
            "PR #84",
            "Performance"
          ],
          "checklist": [],
          "createdAt": "2026-01-11T00:00:00.000Z",
          "history": [],
          "description": "Blog LCP 5.6s Ã¢ÂÂ 3.1s (45% faster)"
        },
        {
          "id": "jan-12",
          "title": "Jan 12: Projects Page Launch",
          "labels": [
            "PR #88-92"
          ],
          "checklist": [],
          "createdAt": "2026-01-12T00:00:00.000Z",
          "history": [],
          "description": "SLO Calculator, Status Page Generator, registry pattern"
        },
        {
          "id": "jan-13",
          "title": "Jan 13: Analytics & Accessibility",
          "labels": [
            "PR #94",
            "PR #96"
          ],
          "checklist": [],
          "createdAt": "2026-01-13T00:00:00.000Z",
          "history": [],
          "description": "Analytics Dashboard, On-Call Coverage Explorer, Skip Navigation, Footer/Nav cleanup"
        },
        {
          "id": "jan-14",
          "title": "Jan 14: Kanban & UX",
          "labels": [
            "PR #97-108"
          ],
          "checklist": [],
          "createdAt": "2026-01-14T00:00:00.000Z",
          "history": [],
          "description": "Kanban board with drag-and-drop, card colors, House Projects board, performance budgets, ARIA live regions, deploy notifications"
        },
        {
          "id": "renovate-wontdo",
          "title": "Renovate Automation",
          "labels": [
            "Won't Do"
          ],
          "checklist": [],
          "createdAt": "2026-01-14T00:00:00.000Z",
          "history": [],
          "description": "Decided against: overhead not justified for actively-maintained personal project. Manual npm update works fine."
        },
        {
          "id": "jan-14-15",
          "title": "Jan 14-15: Infrastructure & Polish",
          "labels": [
            "PR #109",
            "PR #113",
            "PR #115-117"
          ],
          "checklist": [],
          "createdAt": "2026-01-15T00:00:00.000Z",
          "history": [],
          "description": "View Transitions API, RUM with web-vitals, CI/CD improvements with PR checks, Container Queries, MCP testing workflows"
        },
        {
          "id": "pr-124",
          "title": "React Performance Optimizations",
          "labels": [
            "PR #124",
            "Performance"
          ],
          "checklist": [],
          "createdAt": "2026-01-15T00:00:00.000Z",
          "history": [],
          "description": "Analytics CLS 0.71Ã¢ÂÂ0.10, scroll throttling, React.memo, lazy-loaded charts, skeleton loaders"
        },
        {
          "id": "pr-125",
          "title": "Dynamic PR Status Indicator",
          "labels": [
            "PR #125",
            "UX"
          ],
          "checklist": [],
          "createdAt": "2026-01-15T00:00:00.000Z",
          "history": [],
          "description": "Live CI status for In Review cards via GitHub API, merged icon for changelog PRs"
        },
        {
          "id": "pr-126",
          "title": "Framer Motion Animations",
          "labels": [
            "PR #126",
            "UX"
          ],
          "checklist": [],
          "createdAt": "2026-01-15T00:00:00.000Z",
          "history": [],
          "description": "Stagger animations for grids, scroll reveals, tab transitions, mobile nav stagger. Respects prefers-reduced-motion."
        },
        {
          "id": "pr-127",
          "title": "Kanban Board Save Feature",
          "labels": [
            "PR #127",
            "Feature"
          ],
          "checklist": [],
          "createdAt": "2026-01-15T00:00:00.000Z",
          "updatedAt": "2026-01-15T23:03:36.667Z",
          "history": [
            {
              "type": "column",
              "timestamp": "2026-01-15T22:29:58.815Z",
              "columnId": "in-review",
              "columnTitle": "In Review"
            },
            {
              "type": "column",
              "timestamp": "2026-01-15T23:03:36.401Z",
              "columnId": "changelog",
              "columnTitle": "Change Log"
            },
            {
              "type": "column",
              "timestamp": "2026-01-15T23:03:36.413Z",
              "columnId": "in-review",
              "columnTitle": "In Review"
            },
            {
              "type": "column",
              "timestamp": "2026-01-15T23:03:36.443Z",
              "columnId": "changelog",
              "columnTitle": "Change Log"
            },
            {
              "type": "column",
              "timestamp": "2026-01-15T23:03:36.465Z",
              "columnId": "in-review",
              "columnTitle": "In Review"
            },
            {
              "type": "column",
              "timestamp": "2026-01-15T23:03:36.489Z",
              "columnId": "changelog",
              "columnTitle": "Change Log"
            },
            {
              "type": "column",
              "timestamp": "2026-01-15T23:03:36.509Z",
              "columnId": "in-review",
              "columnTitle": "In Review"
            },
            {
              "type": "column",
              "timestamp": "2026-01-15T23:03:36.532Z",
              "columnId": "changelog",
              "columnTitle": "Change Log"
            },
            {
              "type": "column",
              "timestamp": "2026-01-15T23:03:36.555Z",
              "columnId": "in-review",
              "columnTitle": "In Review"
            },
            {
              "type": "column",
              "timestamp": "2026-01-15T23:03:36.579Z",
              "columnId": "changelog",
              "columnTitle": "Change Log"
            },
            {
              "type": "column",
              "timestamp": "2026-01-15T23:03:36.599Z",
              "columnId": "in-review",
              "columnTitle": "In Review"
            },
            {
              "type": "column",
              "timestamp": "2026-01-15T23:03:36.622Z",
              "columnId": "changelog",
              "columnTitle": "Change Log"
            },
            {
              "type": "column",
              "timestamp": "2026-01-15T23:03:36.643Z",
              "columnId": "in-review",
              "columnTitle": "In Review"
            },
            {
              "type": "column",
              "timestamp": "2026-01-15T23:03:36.667Z",
              "columnId": "changelog",
              "columnTitle": "Change Log"
            }
          ],
          "description": "GitHub OAuth login, Cloudflare Worker proxy, save to GitHub via Actions. Includes conflict detection, unsaved changes warning."
        },
        {
          "id": "grafana-dashboard-builder",
          "title": "Grafana Dashboard JSON Builder",
          "labels": [
            "Deferred",
            "Large",
            "SRE",
            "Tool"
          ],
          "checklist": [],
          "planFile": "docs/plans/41-grafana-dashboard-builder.md",
          "createdAt": "2026-01-17T00:00:00.000Z",
          "archivedAt": "2026-01-19T00:00:00.000Z",
          "archiveReason": "Too large for current priorities. Consider revisiting when smaller SRE tools are complete.",
          "history": [],
          "description": "Visual editor for Grafana dashboards. Drag-and-drop panel layout, panel type picker, export schema v38+ JSON."
        },
        {
          "id": "log-pattern-extractor",
          "title": "Log Pattern Extractor",
          "labels": [
            "Deferred",
            "Medium",
            "SRE",
            "Tool"
          ],
          "checklist": [],
          "planFile": "docs/plans/45-log-pattern-extractor.md",
          "createdAt": "2026-01-17T00:00:00.000Z",
          "archivedAt": "2026-01-19T00:00:00.000Z",
          "archiveReason": "Overlaps significantly with regex-log-parser. Build that first, then evaluate if this adds enough value.",
          "history": [],
          "description": "Detect recurring log patterns from raw lines. Auto-group by template, field type inference, export to regex/grok/logstash format."
        },
        {
          "id": "retention-cost-estimator",
          "title": "Retention Cost Estimator",
          "labels": [
            "Deferred",
            "Medium",
            "SRE",
            "Calculator"
          ],
          "checklist": [],
          "planFile": "docs/plans/43-retention-cost-estimator.md",
          "createdAt": "2026-01-17T00:00:00.000Z",
          "archivedAt": "2026-01-19T00:00:00.000Z",
          "archiveReason": "Pricing models change frequently. Maintenance burden outweighs value for a personal site.",
          "history": [],
          "description": "Estimate observability costs across providers (Datadog, Grafana Cloud, New Relic). Side-by-side comparison, retention tradeoffs."
        }
      ]
    }
  ],
  "createdAt": "2026-01-16T14:45:27.429Z",
  "updatedAt": "2026-01-23T15:59:45.003Z"
};
