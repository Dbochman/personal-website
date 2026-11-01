# Daily blog traffic

`docs/metrics/ga4-blog-daily.json` is separate from the rolling seven-day
`ga4-history.json`. The public copy is `/metrics/ga4-blog-daily.json`.
Blog Traffic Over Time reads this file and displays daily page views for the
last sixty covered dates, with the top five posts and the remainder in Other.
Legacy rolling snapshots are not used as a fallback for this daily chart.

The first collection queries January 1, 2026 through two days before collection
in GA4's property timezone. Each subsequent collection replaces the last fourteen
covered days plus any collection gap, retaining older days. This incorporates
late processing without adding overlapping snapshots together. Date/path rows
are fully paginated and ordered deterministically. Raw paths are retained,
including renamed URLs and trailing-slash variants, so post aliases can be
resolved deliberately by consumers.

Each day contains its date, the sum of page views, and reported per-path page
views, sessions, and users. Page views can be stacked and summed. Sessions and
users can overlap between paths or days; do not sum them into a unique audience
total. Empty days mean GA4 reported no matching activity. They do not establish
whether tracking was installed or functioning on that day. Missing posts before
publication should not be interpreted as measured zero traffic.

Collection rejects sampling, thresholding, truncation, `(other)` data loss,
metric restrictions, invalid rows, duplicate rows, and incomplete pagination.
The existing file is replaced atomically only after the full query succeeds.
This verifies the API response, not the accuracy of upstream tracking itself.

The normal Daily Analytics Collection workflow maintains the file. To rerun
collection, dispatch GA4 Data Export on `main`. Both workflows use existing
GitHub-held GA4 credentials and publish through a metrics-only PR with required
checks and auto-merge. Do not copy credentials into the repository or run an
unreviewed branch with them.

Local regression checks:

```sh
node --test scripts/ga4-blog-daily.test.mjs
node --test .github/security/test_metrics_publishing.mjs
node .github/security/sync-workflows.mjs --check
```
