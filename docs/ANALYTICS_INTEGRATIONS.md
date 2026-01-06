# Analytics & Monitoring Integrations

This document provides comprehensive setup and usage instructions for all analytics and monitoring integrations in this project.

## Overview

The site uses three automated data collection workflows to provide visibility into performance, search rankings, and visitor engagement:

1. **Lighthouse CI** - Performance monitoring and Core Web Vitals tracking
2. **Google Search Console API** - Search rankings and SEO visibility
3. **GA4 Data API** - Visitor analytics and engagement metrics

All metrics are consolidated into `docs/metrics/latest.json` for easy at-a-glance viewing, with historical data stored separately for trend analysis.

## Table of Contents

- [Lighthouse CI Integration](#lighthouse-ci-integration)
- [Google Search Console API](#google-search-console-api)
- [GA4 Data API](#ga4-data-api)
- [Metrics Dashboard](#metrics-dashboard)
- [Troubleshooting](#troubleshooting)

---

## Lighthouse CI Integration

### What It Does

- Runs Lighthouse performance audits on production site
- Tracks Core Web Vitals: LCP, FID, CLS, FCP, TTI, TBT, Speed Index
- Saves historical scores for trend analysis
- Alerts when scores drop below thresholds

### Workflow

- **File:** `.github/workflows/lighthouse.yml`
- **Triggers:**
  - After successful deployment (workflow_run)
  - Manual trigger (workflow_dispatch)
  - Weekly schedule (Mondays at 10 AM UTC)
- **Runs on:** Production site (https://dylanbochman.com)

### Performance Thresholds

| Category | Threshold |
|----------|-----------|
| Performance | ≥ 90 |
| Accessibility | ≥ 95 |
| SEO | ≥ 95 |
| Best Practices | ≥ 90 |

### Data Files

- **History:** `docs/metrics/lighthouse-history.json` (last 100 entries)
- **Summary:** `docs/metrics/latest.json` (latest scores only)
- **Raw Report:** Uploaded as GitHub Actions artifact (90-day retention)

### Manual Usage

```bash
# Run Lighthouse locally
npm run lighthouse

# Run against production
npm run lighthouse:production

# Save scores to history
npm run save-lighthouse-scores

# Generate summary
npm run generate-metrics-summary
```

### Alerting

When scores drop below thresholds:
- Workflow fails
- GitHub issue created with:
  - Score breakdown
  - Core Web Vitals metrics
  - Link to full Lighthouse report
  - Recommended actions

---

## Google Search Console API

### What It Does

- Fetches search performance data from Google Search Console
- Tracks clicks, impressions, CTR, and average position
- Identifies top performing queries and pages
- Alerts on significant ranking drops

### Setup Instructions

#### 1. Create Google Cloud Service Account

```bash
# Go to Google Cloud Console
https://console.cloud.google.com/

# Create or select a project

# Enable API
1. Navigate to "APIs & Services" > "Library"
2. Search for "Google Search Console API"
3. Click "Enable"

# Create Service Account
1. Navigate to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Name: "search-console-reader"
4. Grant role: "Viewer"
5. Click "Done"

# Create Key
1. Click on the service account email
2. Go to "Keys" tab
3. Click "Add Key" > "Create new key"
4. Select "JSON"
5. Download the JSON file
```

#### 2. Add Service Account to Search Console

```bash
# Go to Search Console
https://search.google.com/search-console

# Add user
1. Select your property
2. Click "Settings" (left sidebar)
3. Click "Users and permissions"
4. Click "Add user"
5. Enter the service account email (found in JSON file)
6. Set permission to "Full" or "Owner"
7. Click "Add"
```

#### 3. Configure GitHub Secrets

```bash
# Base64 encode the credentials file
cat service-account.json | base64

# Add to GitHub repository secrets
1. Go to repository Settings > Secrets and variables > Actions
2. Click "New repository secret"
3. Name: SEARCH_CONSOLE_CREDENTIALS
4. Value: <paste base64 string>
5. Click "Add secret"
```

### Workflow

- **File:** `.github/workflows/search-console.yml`
- **Triggers:**
  - Manual trigger (workflow_dispatch)
  - Weekly schedule (Mondays at 11 AM UTC)
- **Data Period:** Last 7 days

### Ranking Drop Thresholds

- **Clicks:** > 20% decrease
- **Impressions:** > 20% decrease
- **Position:** > 5 positions worse

### Data Files

- **History:** `docs/metrics/search-console-history.json` (52 weeks)
- **Summary:** `docs/metrics/latest.json` (updated automatically)

### Manual Usage

```bash
# Fetch Search Console data
SEARCH_CONSOLE_CREDENTIALS="<base64>" npm run fetch-search-console
```

### Site URL Configuration

The script uses `sc-domain:dylanbochman.com` by default. To change:

```javascript
// In scripts/fetch-search-console-data.js
const SITE_URL = 'https://dylanbochman.com'; // or sc-domain:dylanbochman.com
```

---

## GA4 Data API

### What It Does

- Fetches visitor analytics from Google Analytics 4
- Tracks sessions, users, page views, bounce rate
- Analyzes top pages and device breakdown
- Alerts on traffic anomalies

### Setup Instructions

#### 1. Create Google Cloud Service Account

Follow the same steps as Search Console, but enable the **Google Analytics Data API** instead.

#### 2. Add Service Account to GA4

```bash
# Go to Google Analytics
https://analytics.google.com

# Add user
1. Click "Admin" (gear icon)
2. Under "Property" column, click "Property Access Management"
3. Click the "+" in top right corner
4. Click "Add users"
5. Enter the service account email (from JSON file)
6. Select "Viewer" role
7. Uncheck "Notify new users by email"
8. Click "Add"
```

#### 3. Get Property ID

```bash
# In Google Analytics
1. Click "Admin" (gear icon)
2. Under "Property" column, click "Property Settings"
3. Copy the "Property ID" (format: 123456789)
```

#### 4. Configure GitHub Secrets

```bash
# Base64 encode the credentials file
cat service-account.json | base64

# Add to GitHub repository secrets
1. GA4_CREDENTIALS: <base64 string>
2. GA4_PROPERTY_ID: properties/123456789  # Note: include "properties/" prefix
```

### Workflow

- **File:** `.github/workflows/ga4-export.yml`
- **Triggers:**
  - Manual trigger (workflow_dispatch)
  - Weekly schedule (Mondays at 12 PM UTC)
- **Data Period:** Last 7 days

### Traffic Anomaly Thresholds

- **Sessions/Users/Page Views:** > 30% decrease
- **Bounce Rate:** > 10 percentage points increase

### Data Files

- **History:** `docs/metrics/ga4-history.json` (52 weeks)
- **Summary:** `docs/metrics/latest.json` (updated automatically)

### Manual Usage

```bash
# Fetch GA4 data
GA4_CREDENTIALS="<base64>" GA4_PROPERTY_ID="properties/123456789" npm run fetch-ga4
```

---

## Metrics Dashboard

### Consolidated Summary

All metrics are consolidated in `docs/metrics/latest.json`:

```json
{
  "generated": "2026-01-06T12:00:00.000Z",
  "lighthouse": {
    "date": "2026-01-06",
    "scores": {
      "performance": 95,
      "accessibility": 98,
      "bestPractices": 92,
      "seo": 100
    },
    "coreWebVitals": {
      "lcp": 1200,
      "fid": 50,
      "cls": 0.05,
      "fcp": 800,
      "tti": 2000,
      "tbt": 150,
      "speedIndex": 1500
    }
  },
  "searchConsole": {
    "lastCheck": "2026-01-06T11:00:00.000Z",
    "clicks": 245,
    "impressions": 5430,
    "averageCTR": 4.51,
    "averagePosition": 12.3
  },
  "analytics": {
    "lastCheck": "2026-01-06T12:00:00.000Z",
    "sessions_7d": 892,
    "users_7d": 678,
    "pageviews_7d": 1456,
    "avgSessionDuration": 145,
    "bounceRate": 42.3,
    "topPages": [...]
  }
}
```

### Historical Data

Each integration maintains its own historical file:

- `docs/metrics/lighthouse-history.json` - Array of 100 most recent Lighthouse runs
- `docs/metrics/search-console-history.json` - Array of 52 weekly Search Console reports
- `docs/metrics/ga4-history.json` - Array of 52 weekly GA4 snapshots

### Accessing Data

All metrics files are:
- Committed to the repository (automatically updated by workflows)
- Available as GitHub Actions artifacts (downloadable)
- Accessible via GitHub API

Example: Fetch latest metrics via curl

```bash
curl https://raw.githubusercontent.com/Dbochman/personal-website/main/docs/metrics/latest.json
```

---

## Troubleshooting

### Lighthouse Workflow Fails

**Issue:** "Chrome prevented page load with an interstitial"

**Solution:** Wait 30 seconds after deployment before running Lighthouse (already implemented in workflow)

---

### Search Console: "Permission Denied"

**Issue:** Service account doesn't have access

**Solution:**
1. Verify service account email is added in Search Console
2. Check permission is set to "Full" or "Owner"
3. Wait 5-10 minutes for permissions to propagate

---

### Search Console: "Site not found"

**Issue:** Wrong site URL format

**Solution:**
- Domain property: Use `sc-domain:example.com`
- URL-prefix property: Use `https://example.com`

---

### GA4: "Permission Denied"

**Issue:** Service account doesn't have access

**Solution:**
1. Verify service account email is added in GA4 Property Access Management
2. Check role is "Viewer" or higher
3. Wait 5-10 minutes for permissions to propagate

---

### GA4: "Invalid property ID"

**Issue:** Wrong property ID format

**Solution:**
- Must include `properties/` prefix
- Example: `properties/123456789` (not just `123456789`)
- Find in GA4 Admin > Property Settings

---

### Workflow Doesn't Run

**Issue:** Scheduled workflow not triggering

**Solution:**
1. Check workflow is enabled in GitHub Actions UI
2. Verify cron syntax is correct
3. Note: GitHub Actions may delay scheduled runs by up to 15 minutes during high load
4. Try manual trigger with "Run workflow" button

---

### Credentials Not Working

**Issue:** "Invalid credentials" or "Could not load default credentials"

**Solution:**
1. Verify base64 encoding is correct: `cat file.json | base64`
2. Check no extra whitespace in secret value
3. Ensure JSON file is complete and valid
4. Try re-downloading service account key

---

## Support

For issues with these integrations:

1. Check workflow logs in GitHub Actions
2. Review error messages in script output
3. Verify all prerequisites are met
4. Check Google Cloud Console for API quota limits
5. Open an issue in the repository with error details

---

## Future Enhancements

Potential additions:
- Real-time alerting via Slack/Discord
- Trend visualization dashboard
- Automated performance regression testing
- Competitive analysis integration
- Custom metric thresholds per page
