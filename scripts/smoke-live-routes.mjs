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
//
// Sample routes are derived from dist/sitemap.xml so a renamed or drafted
// post doesn't become a deploy blocker. Legacy redirect routes come from
// src/data/seo-redirects.json — the same source prerender.mjs and
// verify-seo-routes.mjs read, so the three stay aligned.

import { readFileSync } from 'fs';
import { join, resolve } from 'path';

const SITE_URL = (process.argv[2] ?? '').replace(/\/+$/, '');
const distDir = resolve(process.argv[3] ?? 'dist');
const redirectsPath = resolve(process.argv[4] ?? join('src', 'data', 'seo-redirects.json'));

if (!SITE_URL) {
  console.error('Usage: smoke-live-routes.mjs <base-url> [dist-dir] [redirects-json]');
  process.exit(1);
}

// Polling budgets. The propagation wait covers GitHub Pages rebuilding plus
// any CDN cache replacement. Per-route timeouts handle cache lag on
// individual URLs after propagation has otherwise completed.
const PROPAGATION_TIMEOUT_MS = 5 * 60 * 1000;
const ROUTE_TIMEOUT_MS = 90 * 1000;
const POLL_INTERVAL_MS = 8 * 1000;

const REDIRECT_META_REGEX = /<meta\s+http-equiv=["']refresh["']/i;

const sitemap = readFileSync(join(distDir, 'sitemap.xml'), 'utf8');
const sitemapUrls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]);
const sitemapPaths = sitemapUrls.map(u => new URL(u).pathname);

// Canonical host is whatever the sitemap advertises. Same value all our
// artifacts hardcode for canonical / og:url tags, so probing localhost
// (or any non-prod host) still works — we're checking that artifact
// content points at the canonical, not that SITE_URL equals canonical.
const expectedCanonicalOrigin = new URL(sitemapUrls[0]).origin;

// Local build marker. The propagation gate below polls the live URL until
// its build-info.json `sha` matches this value, which guarantees we're
// checking the artifact this run produced and not a leftover from a
// previous deploy that happens to satisfy the same route shape.
const localBuildInfo = JSON.parse(readFileSync(join(distDir, 'build-info.json'), 'utf8'));

const sectionRoots = sitemapPaths.filter(p => /^\/[^/]+$/.test(p));
const blogPosts = sitemapPaths.filter(p => p.startsWith('/blog/'));
const projectPages = sitemapPaths.filter(p => p.startsWith('/projects/'));

if (blogPosts.length === 0) {
  console.error('No /blog/<slug> entries in sitemap to sample from');
  process.exit(1);
}

// Alphabetical pick is stable across renames/drafts of unrelated posts.
const sampleBlogRoute = [...blogPosts].sort()[0];
const sampleProjectRoute = projectPages.length > 0 ? [...projectPages].sort()[0] : null;

const canonicalRoutes = Array.from(new Set([
  '/',
  ...sectionRoots,
  sampleBlogRoute,
  ...(sampleProjectRoute ? [sampleProjectRoute] : []),
]));

const { legacyRedirects } = JSON.parse(readFileSync(redirectsPath, 'utf8'));

const redirectRoutes = [
  ...sectionRoots.map(r => ({ from: `${r}/`, to: r })),
  { from: `${sampleBlogRoute}/`, to: sampleBlogRoute },
  ...(sampleProjectRoute ? [{ from: `${sampleProjectRoute}/`, to: sampleProjectRoute }] : []),
  ...legacyRedirects.flatMap(({ from, to }) => [
    { from, to },
    { from: `${from}/`, to },
  ]),
];

async function fetchRoute(url) {
  // redirect: 'manual' surfaces any GH Pages-issued 3xx instead of following
  // it silently. cache: no-store + cache-control headers reduce the chance
  // of seeing a stale edge-cached body during a deploy.
  return fetch(url, {
    redirect: 'manual',
    cache: 'no-store',
    headers: { 'cache-control': 'no-cache', pragma: 'no-cache' },
  });
}

function canonicalPredicate(res, body) {
  if (res.status !== 200) {
    const loc = res.headers.get('location');
    return { ok: false, reason: `status ${res.status}${loc ? ` → ${loc}` : ''}` };
  }
  if (REDIRECT_META_REGEX.test(body)) {
    return { ok: false, reason: 'returned meta-refresh template (expected real prerendered page)' };
  }
  return { ok: true };
}

function makeRedirectPredicate(target) {
  const expectedCanonical = `${expectedCanonicalOrigin}${target}`;
  return (res, body) => {
    if (res.status !== 200) {
      const loc = res.headers.get('location');
      return { ok: false, reason: `status ${res.status}${loc ? ` → ${loc}` : ''}` };
    }
    if (!REDIRECT_META_REGEX.test(body)) {
      return { ok: false, reason: 'expected meta-refresh redirect, got real page content' };
    }
    if (!body.includes(`url=${target}`) || !body.includes(expectedCanonical)) {
      return { ok: false, reason: `body does not redirect to ${target}` };
    }
    return { ok: true };
  };
}

// Polls a URL with no-cache headers until the predicate accepts the response
// or the timeout elapses. Any error (network, 4xx, 5xx, stale body) triggers
// another poll rather than an immediate fail — exactly what's needed while
// GitHub Pages and any CDN edge swap in the new deploy.
async function pollUntil(url, predicate, timeoutMs) {
  const start = Date.now();
  let last = { ok: false, reason: 'no response yet' };
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetchRoute(url);
      const body = res.status === 200 ? await res.text() : '';
      last = predicate(res, body);
      if (last.ok) return last;
    } catch (err) {
      last = { ok: false, reason: err.message };
    }
    const remaining = timeoutMs - (Date.now() - start);
    if (remaining <= 0) break;
    await new Promise(r => setTimeout(r, Math.min(POLL_INTERVAL_MS, remaining)));
  }
  return last;
}

console.log(`🔎 Probing ${SITE_URL}`);
console.log(`   expected build sha:  ${localBuildInfo.sha}`);
console.log(`   canonical origin:    ${expectedCanonicalOrigin}`);
console.log(`   sample blog post:    ${sampleBlogRoute}`);
if (sampleProjectRoute) console.log(`   sample project page: ${sampleProjectRoute}`);

// Step 1: gate on /build-info.json reporting THIS build's SHA. Polling for
// SHA match (rather than "did / return some real page") catches the case
// where Pages still serves the previous deploy, which would otherwise pass
// a content-shape check on stable routes.
console.log('⏳ Waiting for new build to propagate...');
const propagation = await pollUntil(
  `${SITE_URL}/build-info.json`,
  (res, body) => {
    if (res.status !== 200) {
      return { ok: false, reason: `build-info.json status ${res.status}` };
    }
    let parsed;
    try {
      parsed = JSON.parse(body);
    } catch (err) {
      return { ok: false, reason: `build-info.json is not valid JSON: ${err.message}` };
    }
    if (parsed.sha !== localBuildInfo.sha) {
      return { ok: false, reason: `live sha=${parsed.sha} (expected ${localBuildInfo.sha})` };
    }
    return { ok: true };
  },
  PROPAGATION_TIMEOUT_MS
);
if (!propagation.ok) {
  console.error(`❌ Propagation timeout: live build never matched local sha (${propagation.reason})`);
  process.exit(1);
}
console.log(`✅ Live build matches local sha ${localBuildInfo.sha}`);

// Step 2: check every route in parallel with a shorter per-route budget.
// Parallel keeps total wall time bounded even with many routes.
const canonicalResults = await Promise.all(
  canonicalRoutes.map(route =>
    pollUntil(`${SITE_URL}${route}`, canonicalPredicate, ROUTE_TIMEOUT_MS)
      .then(r => ({ route, r }))
  )
);
const redirectResults = await Promise.all(
  redirectRoutes.map(({ from, to }) =>
    pollUntil(`${SITE_URL}${from}`, makeRedirectPredicate(to), ROUTE_TIMEOUT_MS)
      .then(r => ({ route: from, to, r }))
  )
);

let failures = 0;
for (const { route, r } of canonicalResults) {
  if (r.ok) {
    console.log(`✅ ${route} → canonical content`);
  } else {
    console.error(`❌ ${route} → ${r.reason}`);
    failures += 1;
  }
}
for (const { route, to, r } of redirectResults) {
  if (r.ok) {
    console.log(`✅ ${route} → redirect to ${to}`);
  } else {
    console.error(`❌ ${route} → ${r.reason}`);
    failures += 1;
  }
}

if (failures) {
  console.error(`\n❌ ${failures} live route check${failures === 1 ? '' : 's'} failed`);
  process.exit(1);
}
console.log('\n✅ All live route checks passed');
