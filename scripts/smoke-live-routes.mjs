#!/usr/bin/env node
// Post-deploy smoke check: probe the live GitHub Pages deployment to verify
// that canonical slashless URLs serve the real prerendered HTML directly
// (no 3xx redirect to a trailing-slash variant), and that trailing-slash and
// legacy URLs serve the meta-refresh redirect artifact pointing at the right
// canonical target.
//
// This is the only place where the assumption baked into prerender.mjs —
// that GitHub Pages prefers `foo.html` over `foo/index.html` for `/foo` when
// both exist — is verified against real Pages behavior. If GitHub ever
// changes that precedence, this check fails the deploy workflow loudly.

import { readFileSync } from 'fs';
import { join } from 'path';

const SITE_URL = process.argv[2];
if (!SITE_URL) {
  console.error('Usage: smoke-live-routes.mjs <base-url>');
  process.exit(1);
}

const seoRedirectsPath = join(process.cwd(), 'src', 'data', 'seo-redirects.json');
const { legacyRedirects } = JSON.parse(readFileSync(seoRedirectsPath, 'utf8'));

// A representative sample is enough — the GH Pages precedence rule applies
// uniformly. Spot-check a section root, a content page, and one legacy entry.
const CANONICAL_ROUTES = [
  '/',
  '/blog',
  '/projects',
  '/runbook',
  '/blog/hello-world',
];

const REDIRECT_ROUTES = [
  { from: '/blog/', to: '/blog' },
  { from: '/projects/', to: '/projects' },
  { from: '/runbook/', to: '/runbook' },
  { from: '/blog/hello-world/', to: '/blog/hello-world' },
  ...legacyRedirects.flatMap(({ from, to }) => [
    { from, to },
    { from: `${from}/`, to },
  ]),
];

const RETRY_ATTEMPTS = 8;
const RETRY_DELAY_MS = 15_000;

async function fetchOnce(url) {
  // redirect: 'manual' so we observe any GH Pages-issued 3xx instead of
  // following it silently. Our static redirect artifacts return 200 with
  // meta-refresh, not 3xx, so a 3xx here means something went wrong.
  return fetch(url, { redirect: 'manual', headers: { 'cache-control': 'no-cache' } });
}

async function fetchWithRetry(url) {
  let lastErr;
  for (let i = 0; i < RETRY_ATTEMPTS; i++) {
    try {
      const res = await fetchOnce(url);
      if (res.status >= 500) {
        lastErr = new Error(`status ${res.status}`);
      } else {
        return res;
      }
    } catch (err) {
      lastErr = err;
    }
    if (i < RETRY_ATTEMPTS - 1) {
      await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
    }
  }
  throw new Error(`${url}: ${lastErr?.message ?? 'unknown error'}`);
}

let failures = 0;
function fail(msg) {
  console.error(`❌ ${msg}`);
  failures += 1;
}

console.log(`🔎 Probing ${SITE_URL} ...`);

for (const route of CANONICAL_ROUTES) {
  const url = `${SITE_URL}${route}`;
  const res = await fetchWithRetry(url);
  if (res.status !== 200) {
    const loc = res.headers.get('location');
    fail(`${route} expected 200, got ${res.status}${loc ? ` → ${loc}` : ''}`);
    continue;
  }
  const body = await res.text();
  if (/<meta\s+http-equiv=["']refresh["']/i.test(body)) {
    fail(`${route} returned the redirect template; canonical should serve the real prerendered page`);
    continue;
  }
  console.log(`✅ ${route} → 200 (canonical content)`);
}

for (const { from, to } of REDIRECT_ROUTES) {
  const url = `${SITE_URL}${from}`;
  const res = await fetchWithRetry(url);
  if (res.status !== 200) {
    const loc = res.headers.get('location');
    fail(`${from} expected 200 (meta-refresh redirect file), got ${res.status}${loc ? ` → ${loc}` : ''}`);
    continue;
  }
  const body = await res.text();
  if (!body.includes(`url=${to}`) || !body.includes(`https://dylanbochman.com${to}`)) {
    fail(`${from} returned 200 but the body does not redirect to ${to}`);
    continue;
  }
  console.log(`✅ ${from} → 200 (redirect to ${to})`);
}

if (failures) {
  console.error(`\n❌ ${failures} live route check${failures === 1 ? '' : 's'} failed`);
  process.exit(1);
}
console.log('\n✅ All live route checks passed');
