# SEO Measurement & Monitoring Guide

This guide explains how to measure and monitor SEO performance for dylanbochman.com using various free and paid tools.

## Table of Contents

1. [Core Web Vitals Tracking](#core-web-vitals-tracking)
2. [PageSpeed Insights API](#pagespeed-insights-api)
3. [Google Search Console API](#google-search-console-api)
4. [Google Analytics 4](#google-analytics-4)
5. [Monitoring Best Practices](#monitoring-best-practices)

---

## Core Web Vitals Tracking

### Current Implementation

The site automatically tracks Core Web Vitals in production using the `web-vitals` library.

**Tracked Metrics:**
- **LCP** (Largest Contentful Paint): Main content load time
- **FID** (First Input Delay): Interactivity responsiveness (legacy)
- **INP** (Interaction to Next Paint): Replaces FID, measures responsiveness
- **CLS** (Cumulative Layout Shift): Visual stability
- **FCP** (First Contentful Paint): Initial paint time
- **TTFB** (Time to First Byte): Server response time

**Implementation**: `src/lib/reportWebVitals.ts`

**Viewing Data**:
1. Go to [Google Analytics 4](https://analytics.google.com)
2. Navigate to **Events** → Filter for "Web Vitals" category
3. View metrics: CLS, FCP, INP, LCP, TTFB

**Good Thresholds** (per Google):
- LCP: ≤ 2.5s
- FID/INP: ≤ 100ms / ≤ 200ms
- CLS: ≤ 0.1
- FCP: ≤ 1.8s
- TTFB: ≤ 800ms

---

## PageSpeed Insights API

### Overview

PageSpeed Insights provides free performance and SEO analysis without requiring an API key.

**Rate Limits**: ~25 requests per 100 seconds (no key required)

### Usage

#### Via Script

```bash
# Install tsx for running TypeScript scripts
npm install -D tsx

# Run the SEO metrics check
npx tsx scripts/check-seo-metrics.ts
```

#### Programmatic Usage

```typescript
import { getPageSpeedMetrics, isPageSpeedError, assessCoreWebVitals } from './src/lib/pageSpeedInsights';

const result = await getPageSpeedMetrics('https://dylanbochman.com', 'mobile');

if (!isPageSpeedError(result)) {
  console.log('Performance Score:', result.performance);
  console.log('SEO Score:', result.seo);
  console.log('Core Web Vitals:', result.coreWebVitals);

  const assessment = assessCoreWebVitals(result.coreWebVitals);
  console.log('LCP Assessment:', assessment.lcp); // 'good' | 'needs-improvement' | 'poor'
}
```

### What It Measures

- **Performance Score** (0-100): Overall speed and optimization
- **Accessibility Score** (0-100): A11y compliance
- **Best Practices Score** (0-100): Modern web standards
- **SEO Score** (0-100): Technical SEO health
- **Core Web Vitals**: Real metrics from Lighthouse

---

## Google Search Console API

### Overview

Google Search Console API provides search performance data: queries, impressions, clicks, CTR, and average position.

**Free**: Unlimited for verified site owners
**Authentication**: OAuth 2.0 or Service Account

### Setup Instructions

#### 1. Verify Site Ownership

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Add property for `https://dylanbochman.com`
3. Verify ownership via:
   - DNS record (recommended for custom domains)
   - HTML file upload
   - HTML meta tag

#### 2. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project (e.g., "dylanbochman-seo")
3. Enable **Google Search Console API**:
   - Navigation menu → **APIs & Services** → **Library**
   - Search for "Search Console API"
   - Click **Enable**

#### 3. Set Up Authentication

**Option A: Service Account** (Recommended for automation)

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **Service Account**
3. Name it (e.g., "seo-metrics-reader")
4. Grant role: **Viewer**
5. Click **Done**
6. Click on the service account → **Keys** tab
7. **Add Key** → **Create new key** → **JSON**
8. Download and save as `service-account-key.json`
9. **IMPORTANT**: Add to `.gitignore`!

10. Add service account email to Search Console:
    - Go to Search Console → Settings → Users and permissions
    - Add service account email (ends with `@*.iam.gserviceaccount.com`)
    - Grant "Full" or "Restricted" permission

**Option B: OAuth 2.0** (For personal use)

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Application type: **Web application**
4. Add authorized redirect URI: `http://localhost:3000/oauth2callback`
5. Download `client_secret.json`
6. **IMPORTANT**: Add to `.gitignore`!

#### 4. Install Google APIs Client Library

```bash
npm install googleapis
```

#### 5. Example Usage

**Service Account Example:**

```typescript
import { google } from 'googleapis';
import * as fs from 'fs';

const auth = new google.auth.GoogleAuth({
  keyFile: './service-account-key.json', // DO NOT COMMIT THIS
  scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
});

const searchconsole = google.searchconsole({ version: 'v1', auth });

async function getSearchAnalytics() {
  const response = await searchconsole.searchanalytics.query({
    siteUrl: 'https://dylanbochman.com/',
    requestBody: {
      startDate: '2025-12-01',
      endDate: '2025-12-31',
      dimensions: ['query', 'page', 'country', 'device'],
      rowLimit: 1000,
    },
  });

  return response.data.rows;
}
```

**OAuth 2.0 Example:**

```typescript
import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  'http://localhost:3000/oauth2callback'
);

// Generate auth URL and have user authorize
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: ['https://www.googleapis.com/auth/webmasters.readonly'],
});

// After user authorizes, exchange code for tokens
const { tokens } = await oauth2Client.getToken(code);
oauth2Client.setCredentials(tokens);

// Now you can make API requests
const searchconsole = google.searchconsole({ version: 'v1', auth: oauth2Client });
```

### Available Metrics

- **Queries**: Search terms that triggered your site
- **Impressions**: Number of times your site appeared in search results
- **Clicks**: Number of clicks from search results
- **CTR** (Click-Through Rate): clicks / impressions
- **Position**: Average ranking position for queries
- **Filters**: By page, query, country, device, date range

---

## Google Analytics 4

### Current Setup

- **Property ID**: `G-VDM15EMJN2`
- **Implementation**: `index.html` (gtag.js)
- **Features Enabled**:
  - Anonymize IP
  - Cookie expires: 2 years
  - Sample rate: 100%

### Custom Events

The site sends custom **Web Vitals** events:

```javascript
gtag('event', 'CLS', {
  event_category: 'Web Vitals',
  event_label: 'metric-id',
  value: 0.05, // CLS score
  non_interaction: true,
});
```

### Google Analytics 4 API

**Setup**:
1. Go to [Google Analytics](https://analytics.google.com)
2. Admin → Property → API Access
3. Create or use existing Google Cloud Project
4. Enable **Google Analytics Data API**
5. Use same authentication as Search Console API

**Example Query**:

```typescript
import { BetaAnalyticsDataClient } from '@google-analytics/data';

const analyticsDataClient = new BetaAnalyticsDataClient({
  keyFilename: './service-account-key.json',
});

async function getWebVitalsData() {
  const [response] = await analyticsDataClient.runReport({
    property: `properties/YOUR-GA4-PROPERTY-ID`,
    dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
    dimensions: [{ name: 'eventName' }],
    metrics: [{ name: 'eventCount' }, { name: 'eventValue' }],
    dimensionFilter: {
      filter: {
        fieldName: 'eventName',
        stringFilter: {
          matchType: 'BEGINS_WITH',
          value: 'Web Vitals',
        },
      },
    },
  });

  return response.rows;
}
```

---

## Monitoring Best Practices

### Daily Checks
- Monitor Google Search Console for:
  - Coverage issues (indexing errors)
  - Security issues
  - Manual actions

### Weekly Reviews
- Run PageSpeed Insights script
- Check Core Web Vitals trends in GA4
- Review top search queries in Search Console

### Monthly Analysis
- Organic traffic trends
- Click-through rate (CTR) for top queries
- Page-level performance analysis
- Compare mobile vs desktop metrics

### Quarterly Deep Dives
- Competitor analysis
- Keyword ranking changes
- Backlink profile review
- Content gap analysis

### Automation Ideas

**1. GitHub Actions Workflow** (check weekly):

```yaml
name: Weekly SEO Check
on:
  schedule:
    - cron: '0 9 * * 1' # Monday 9 AM UTC
  workflow_dispatch:

jobs:
  seo-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '24'
      - run: npm ci
      - run: npm install -D tsx
      - run: npx tsx scripts/check-seo-metrics.ts
```

**2. Slack/Discord Notifications**:
- Set up webhooks
- Alert on performance score drops
- Weekly summary reports

**3. Data Warehouse Integration**:
- Export to BigQuery
- Build Looker/Tableau dashboards
- Track historical trends

---

## Troubleshooting

### PageSpeed Insights Issues

**Error: Rate limit exceeded**
- Solution: Wait 100 seconds between requests
- Alternative: Use API key for higher limits

**Error: Invalid URL**
- Ensure URL includes protocol: `https://`
- URL must be publicly accessible

### Search Console API Issues

**Error: Forbidden (403)**
- Check service account has Search Console access
- Verify siteUrl matches exactly

**Error: Not found (404)**
- Site not verified in Search Console
- Wrong site URL (check www vs non-www)

### Core Web Vitals Not Showing

- Check production deployment
- Verify gtag is loaded
- Wait 24-48 hours for data collection
- Check GA4 DebugView for real-time events

---

## Security Notes

### Never Commit:
- `service-account-key.json`
- `client_secret.json`
- API keys
- OAuth tokens

### Add to `.gitignore`:
```
service-account-key.json
client_secret.json
*.credentials.json
.env.local
```

### Use Environment Variables:
```bash
# .env.local
GSC_SERVICE_ACCOUNT_KEY=path/to/key.json
GA4_PROPERTY_ID=123456789
```

---

## Resources

- [PageSpeed Insights API Docs](https://developers.google.com/speed/docs/insights/v5/get-started)
- [Search Console API Docs](https://developers.google.com/webmaster-tools/v1/api_reference_index)
- [Google Analytics Data API](https://developers.google.com/analytics/devguides/reporting/data/v1)
- [Web Vitals](https://web.dev/vitals/)
- [Core Web Vitals Thresholds](https://web.dev/articles/defining-core-web-vitals-thresholds)
