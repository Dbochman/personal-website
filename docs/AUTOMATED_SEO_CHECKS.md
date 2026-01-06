# Automated SEO Checks

This document describes the automated weekly SEO monitoring workflow for dylanbochman.com.

## Overview

The site has an automated GitHub Actions workflow that runs weekly SEO checks using the PageSpeed Insights API. Results are posted to the workflow summary and artifacts are saved for historical tracking.

## Workflow Schedule

- **Frequency**: Every Monday at 9 AM UTC (1 AM PST / 4 AM EST)
- **Duration**: ~2-3 minutes per run
- **Workflow File**: `.github/workflows/seo-check.yml`

## What It Checks

### Metrics Collected

**Performance Scores (0-100):**
- Mobile Performance
- Desktop Performance
- Accessibility
- Best Practices
- SEO Score

**Core Web Vitals:**
- **LCP** (Largest Contentful Paint)
- **FID** (First Input Delay)
- **CLS** (Cumulative Layout Shift)
- **INP** (Interaction to Next Paint)
- **FCP** (First Contentful Paint)
- **TTFB** (Time to First Byte)

### Alert Thresholds

The workflow automatically creates a GitHub issue if scores fall below:

| Metric | Mobile Threshold | Desktop Threshold |
|--------|------------------|-------------------|
| Performance | < 70 | < 80 |
| SEO Score | < 90 | < 90 |

## Viewing Results

### GitHub Actions UI

1. Go to **Actions** tab in the repository
2. Select **Weekly SEO Check** workflow
3. Click on the latest run
4. View the **Summary** tab for formatted results

### Artifacts

Historical results are saved as artifacts for 90 days:
- Navigate to the workflow run
- Scroll to **Artifacts** section
- Download `seo-results-{run-number}.txt`

### Workflow Summary

Each run creates a detailed summary including:
- Date and URL tested
- Score table (Mobile vs Desktop)
- Full text report with all metrics
- Core Web Vitals assessments

Example summary:
```
## 🔍 Weekly SEO Check Results

**Date:** 2026-01-06
**URL:** https://dylanbochman.com

### 📊 Scores

| Metric | Mobile | Desktop |
|--------|--------|---------|
| Performance | 95/100 | 98/100 |
| SEO Score | 100/100 | 100/100 |
```

## Manual Triggering

You can manually run the SEO check anytime:

1. Go to **Actions** → **Weekly SEO Check**
2. Click **Run workflow** button
3. Select branch (usually `main`)
4. Click **Run workflow**

## Alert Issues

When scores drop below thresholds, an automated issue is created with:

**Title:**
```
🔍 SEO Alert: Performance degradation detected (YYYY-MM-DD)
```

**Content:**
- Score comparison table
- Action items for investigation
- Links to workflow run and resources
- Automatically labeled: `seo`, `performance`, `automated`

## Interpreting Results

### Performance Score

- **90-100**: Excellent (Green 🟢)
- **50-89**: Needs Improvement (Yellow 🟡)
- **0-49**: Poor (Red 🔴)

### Core Web Vitals Assessment

**LCP (Largest Contentful Paint):**
- Good: ≤ 2.5s
- Needs Improvement: 2.5s - 4.0s
- Poor: > 4.0s

**FID/INP (Interactivity):**
- Good: ≤ 100ms / ≤ 200ms
- Needs Improvement: 100-300ms / 200-500ms
- Poor: > 300ms / > 500ms

**CLS (Cumulative Layout Shift):**
- Good: ≤ 0.1
- Needs Improvement: 0.1 - 0.25
- Poor: > 0.25

## Troubleshooting

### Workflow Fails

**Issue**: Workflow run fails with npm errors
**Solution**:
- Check if dependencies are up to date
- Verify `npm run check-seo` works locally
- Review workflow logs for specific error

**Issue**: PageSpeed API rate limit
**Solution**:
- Wait 100 seconds between requests
- The free tier allows ~25 requests per 100 seconds
- This shouldn't happen with weekly runs

### False Positives

PageSpeed scores can vary ±5 points between runs due to:
- Server load variations
- Network conditions
- PageSpeed Insights infrastructure

**Mitigation**:
- Compare trends over multiple weeks
- Investigate only if scores drop consistently
- Focus on significant changes (>10 points)

## Historical Tracking

### Download All Artifacts

```bash
# Install GitHub CLI
gh auth login

# List all workflow runs
gh run list --workflow="seo-check.yml"

# Download artifacts for a specific run
gh run download <run-id>
```

### Parse Results

```bash
# Extract mobile performance score
grep "Performance:" seo-results.txt | head -1 | awk '{print $3}'

# Extract Core Web Vitals
grep "LCP:" seo-results.txt
grep "CLS:" seo-results.txt
grep "INP:" seo-results.txt
```

## Customization

### Changing Schedule

Edit `.github/workflows/seo-check.yml`:

```yaml
on:
  schedule:
    # Run daily at 9 AM UTC
    - cron: '0 9 * * *'

    # Run every Monday and Thursday at 9 AM UTC
    - cron: '0 9 * * 1,4'
```

### Adjusting Thresholds

Modify the threshold checks in the workflow:

```yaml
- name: Check for performance degradation
  run: |
    # Change these values
    if [ "$MOBILE_PERF" -lt 80 ]; then ALERT=true; fi  # Was 70
    if [ "$MOBILE_SEO" -lt 95 ]; then ALERT=true; fi   # Was 90
```

### Adding Notifications

To get Slack/Discord notifications, add a step:

```yaml
- name: Send Slack notification
  if: steps.check-degradation.outputs.alert == 'true'
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK }}
    payload: |
      {
        "text": "SEO Alert: Scores below threshold"
      }
```

## Integration with Other Tools

### Export to BigQuery

For long-term trend analysis:

```yaml
- name: Export to BigQuery
  run: |
    # Install bq CLI and authenticate
    # Insert results into BigQuery table
    bq insert dataset.seo_metrics results.json
```

### Create Dashboard

Use GitHub Actions to:
1. Save results to a JSON file
2. Commit to repository
3. Render dashboard with GitHub Pages

## Disabling the Workflow

To temporarily disable:

1. Go to **Actions** → **Weekly SEO Check**
2. Click **⋮** (three dots)
3. Select **Disable workflow**

Or delete/comment out the `schedule` section in the workflow file.

## Resources

- [PageSpeed Insights API](https://developers.google.com/speed/docs/insights/v5/get-started)
- [GitHub Actions Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [Core Web Vitals](https://web.dev/vitals/)
- [SEO Measurement Guide](./SEO_MEASUREMENT.md)

## Cost

- **GitHub Actions**: Free for public repositories
- **PageSpeed API**: Free (no API key required)
- **Storage**: Artifacts retained for 90 days (included in free tier)

**Total Cost**: $0/month
