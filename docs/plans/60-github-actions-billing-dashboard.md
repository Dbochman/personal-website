# Plan 60: GitHub Actions Billing Dashboard

Track GitHub Actions usage/spend via the analytics dashboard, similar to the metered usage view in GitHub Settings.

## Goal

Add a "Costs" section to the analytics dashboard showing:
- Total Actions minutes used (current billing period)
- Breakdown by runner type (Linux, macOS, Windows) and repository
- Historical trend over time
- Gross cost vs actual cost (after free tier discount)

## Data Source

GitHub REST API **Enhanced Billing Platform** endpoint:
```
GET /users/{username}/settings/billing/usage
```

**Note:** The legacy endpoint `/users/{username}/settings/billing/actions` returns HTTP 410 (Gone) as of 2026. Use the new enhanced billing endpoint.

### Example Response (actual data from Phase 0 validation)

```json
{
  "usageItems": [
    {
      "date": "2026-01-01T05:20:13Z",
      "product": "actions",
      "sku": "Actions Linux",
      "quantity": 4057.0,
      "unitType": "Minutes",
      "pricePerUnit": 0.006,
      "grossAmount": 24.342,
      "discountAmount": 24.342,
      "netAmount": 0.0,
      "repositoryName": "personal-website"
    },
    {
      "date": "2026-01-06T02:35:42Z",
      "product": "actions",
      "sku": "Actions Linux",
      "quantity": 1182.0,
      "unitType": "Minutes",
      "pricePerUnit": 0.006,
      "grossAmount": 7.092,
      "discountAmount": 7.092,
      "netAmount": 0.0,
      "repositoryName": "dbochman.github.io"
    },
    {
      "date": "2026-01-06T03:00:00Z",
      "product": "actions",
      "sku": "Actions storage",
      "quantity": 642.224551374,
      "unitType": "GigabyteHours",
      "pricePerUnit": 0.00033602,
      "grossAmount": 0.21580002,
      "discountAmount": 0.21580002,
      "netAmount": 0.0,
      "repositoryName": "personal-website"
    }
  ]
}
```

### Response Fields

| Field | Description |
|-------|-------------|
| `date` | ISO 8601 timestamp of usage aggregation |
| `product` | Product category (e.g., "actions") |
| `sku` | Specific SKU (e.g., "Actions Linux", "Actions macOS", "Actions storage") |
| `quantity` | Amount used (minutes for compute, GB-hours for storage) |
| `unitType` | Unit of measurement ("Minutes", "GigabyteHours") |
| `pricePerUnit` | Cost per unit in USD |
| `grossAmount` | Total cost before discounts |
| `discountAmount` | Free tier discount applied |
| `netAmount` | Actual cost after discounts (0 if within free tier) |
| `repositoryName` | Repository the usage is attributed to |

### Auth Requirements

**Required scope:** Personal access token (classic) with `user` scope.

```bash
# Add user scope to gh CLI
gh auth refresh -h github.com -s user
```

Note: The `GITHUB_TOKEN` in Actions workflows does NOT have billing access. A separate PAT with `user` scope must be stored as `GH_BILLING_TOKEN` secret.

## Phase 0: API Validation ✅ COMPLETE

Validated on 2026-01-28:

```bash
$ gh api /users/Dbochman/settings/billing/usage
# Returns usageItems array with actual billing data
```

**Findings:**
- New endpoint works: `/users/{username}/settings/billing/usage`
- Requires `user` scope (not `repo`)
- Returns itemized data by date/product/sku/repo
- Current usage: 5,239 total Actions minutes (Jan 2026)
- All within free tier: `netAmount: 0` across all items

## Implementation

### Phase 1: Data Collection

1. **Create fetch script** (`scripts/fetch-github-billing.js`)
   - Call `/users/Dbochman/settings/billing/usage`
   - Auth via `GH_BILLING_TOKEN` secret (PAT with `user` scope)
   - Filter `usageItems` to `product === "actions"`
   - Aggregate by SKU (Linux, macOS, Windows, storage)
   - Aggregate by repository
   - **Failure guard:** Skip commit if response is empty or malformed
   - Append to `docs/metrics/github-billing-history.json`
   - Maintain 52 entries max (1 year weekly)

2. **Add to CI workflow** (`.github/workflows/daily-analytics.yml`)
   - New job `github-billing` running weekly (Sundays with Lighthouse)
   - Requires `GH_BILLING_TOKEN` secret with `user` scope
   - **Schema validation:** Validate JSON before commit
   - Commit results to `docs/metrics/`

3. **Data schema**
   ```typescript
   interface GitHubBillingEntry {
     timestamp: string;      // ISO 8601 collection time
     date: string;           // YYYY-MM-DD
     period: {
       start: string;        // First day of current month (YYYY-MM-01)
       end: string;          // Collection date (YYYY-MM-DD)
       description: string;  // e.g., "Jan 1 - Jan 28, 2026"
     };
     summary: {
       totalMinutes: number;         // Sum of all Actions compute minutes
       totalGrossAmount: number;     // Sum of grossAmount (USD)
       totalDiscountAmount: number;  // Sum of discountAmount (USD)
       totalNetAmount: number;       // Sum of netAmount (actual cost USD)
     };
     byRunner: {
       linux: { minutes: number; grossAmount: number };
       macos: { minutes: number; grossAmount: number };
       windows: { minutes: number; grossAmount: number };
     };
     byRepository: Array<{
       name: string;
       minutes: number;
       grossAmount: number;
     }>;
     storage: {
       gbHours: number;
       grossAmount: number;
     };
     status: 'valid' | 'partial' | 'error';
   }
   ```

4. **Failure handling in fetch script:**
   ```javascript
   const response = await fetchBillingData();

   // Guard: Don't save if no usage items
   if (!response.usageItems || response.usageItems.length === 0) {
     console.warn('No usage items returned - skipping commit');
     process.exit(0);
   }

   // Guard: Sanity check (> 50,000 minutes seems excessive)
   const totalMinutes = response.usageItems
     .filter(item => item.unitType === 'Minutes')
     .reduce((sum, item) => sum + item.quantity, 0);

   if (totalMinutes > 50000) {
     console.error('Suspiciously high minutes value - skipping');
     process.exit(1);
   }
   ```

### Phase 2: Dashboard UI

1. **Add types** (`src/components/analytics/types.ts`)
   - `GitHubBillingEntry` interface
   - Add `githubBilling` to `AnalyticsData`

2. **Update hook** (`src/hooks/useAnalyticsData.ts`)
   - Fetch `github-billing-history.json`
   - Handle missing file gracefully (new metric, won't exist initially)
   - Add to returned data

3. **Create component** (`src/components/analytics/GitHubBillingCard.tsx`)
   - Summary card: total minutes, gross cost, net cost
   - Progress indicator if approaching limits
   - Breakdown by runner type (horizontal bar chart)
   - Breakdown by repository (table or list)
   - Show "No data" state if history is empty

4. **Add chart** (`src/components/analytics/charts/BillingHistoryChart.tsx`)
   - Line chart showing minutes over time
   - Weekly data = step-like appearance (expected)
   - Optional: overlay gross vs net cost

5. **Wire to dashboard**
   - Add new "Costs" tab
   - Lazy load chart component
   - Handle empty state gracefully

### Phase 3: Copy to Public

1. **Update copy script** (`scripts/copy-metrics-to-public.js`)
   - Add `github-billing-history.json` to copy list
   - **No sanitization needed:** Billing data contains no PII
   - Repository names are already public

## Files to Create/Modify

| File | Action |
|------|--------|
| `scripts/fetch-github-billing.js` | Create |
| `docs/metrics/github-billing-history.json` | Create (auto) |
| `.github/workflows/daily-analytics.yml` | Modify |
| `src/components/analytics/types.ts` | Modify |
| `src/hooks/useAnalyticsData.ts` | Modify |
| `src/components/analytics/GitHubBillingCard.tsx` | Create |
| `src/components/analytics/charts/BillingHistoryChart.tsx` | Create |
| `src/components/analytics/AnalyticsDashboard.tsx` | Modify |
| `scripts/copy-metrics-to-public.js` | Modify |

## Verification

- [x] **Phase 0:** `gh api` returns billing data ✅
- [x] **Phase 0:** Auth scope confirmed (`user` required) ✅
- [ ] Fetch script returns valid data locally
- [ ] Fetch script skips commit on empty/malformed data
- [ ] CI job runs successfully on schedule
- [ ] CI schema validation passes
- [ ] Dashboard displays billing data
- [ ] Dashboard handles empty/missing data gracefully
- [ ] Historical chart renders correctly (step pattern expected)
- [ ] Mobile responsive

## Decisions Made

| Question | Decision |
|----------|----------|
| Per-workflow breakdown? | No - API provides per-repo, not per-workflow |
| Cost display? | Show gross, discount, and net amounts from API |
| Storage tracking? | Yes - API includes storage GB-hours |
| Data granularity | Weekly snapshots (matches other analytics cadence) |

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| API schema changes | Script breaks | Schema validation, graceful degradation |
| PAT expires | CI fails silently | Monitor for empty commits, document renewal |
| Free tier exhausted | netAmount > 0 | Dashboard will show actual costs |

## References

- [GitHub Billing Usage API](https://docs.github.com/en/rest/billing/usage)
- [Enhanced Billing Platform](https://docs.github.com/en/rest/billing/enhanced-billing)
- [GitHub Actions pricing](https://docs.github.com/en/billing/managing-billing-for-github-actions/about-billing-for-github-actions)
- Existing analytics pattern: `scripts/fetch-ga4-data.js`
