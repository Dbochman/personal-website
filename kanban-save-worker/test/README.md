# Worker contract tests

From `kanban-save-worker/`:

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm test -- --run
npm exec tsc -- --noEmit -p test/tsconfig.json
```

The required PR Checks job runs these commands separately from the website's
Vitest suite, which only includes `src/` tests.

The tests exercise the Worker entry point, routing, CORS, session lookup and
logout, OAuth state and return-origin validation, input validation, board reads,
and atomic board creation. GitHub requests use `fetchMock` with unmatched network
requests disabled. All credentials and repository names are fixtures.

`vitest.config.mts` defines an isolated local `SESSIONS` KV namespace. It does not
load `wrangler.jsonc`, whose KV binding points to production. The compatibility
date matches the workerd version in the existing test lockfile; production
Wrangler configuration is unchanged.
