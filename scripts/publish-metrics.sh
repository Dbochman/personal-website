#!/usr/bin/env bash
# Publish generated metrics through the same required checks as other changes.
# Checkout must use DEPLOY_TOKEN so the resulting PR triggers validation.
set -euo pipefail

: "${GITHUB_REPOSITORY:?}"
: "${GITHUB_RUN_ID:?}"
: "${GITHUB_RUN_ATTEMPT:?}"
: "${GH_TOKEN:?}"
[[ "$GITHUB_RUN_ID" =~ ^[0-9]+$ && "$GITHUB_RUN_ATTEMPT" =~ ^[0-9]+$ ]]

git add -- docs/metrics/
if git diff --cached --quiet; then
  echo 'No metrics changes to publish.'
  exit 0
fi

# Fail before pushing if anything beyond generated metric JSON was staged.
while IFS= read -r -d '' file; do
  [[ "$file" =~ ^docs/metrics/[a-zA-Z0-9_-]+\.json$ ]] || {
    echo "Refusing to publish a non-metrics change: $file" >&2
    exit 1
  }
done < <(git diff --cached --name-only -z)

branch="automation/metrics-${GITHUB_RUN_ID}-${GITHUB_RUN_ATTEMPT}"
git switch -c "$branch"
git config user.email '41898282+github-actions[bot]@users.noreply.github.com'
git config user.name 'github-actions[bot]'
git commit -m 'chore: refresh analytics reports [skip-changelog]'
head_sha=$(git rev-parse HEAD)
git push origin "HEAD:refs/heads/$branch"

body=$(mktemp)
trap 'rm -f "$body"' EXIT
cat > "$body" <<EOF
Refresh the generated analytics reports collected by the scheduled/manual export.

Source run: https://github.com/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}

Only docs/metrics JSON files are included. Auto-merge waits for the required
checks and branch protection; merging triggers the normal site deployment.
EOF
pr_url=$(gh pr create --repo "$GITHUB_REPOSITORY" --base main --head "$branch" \
  --title 'chore: refresh analytics reports [skip-changelog]' --body-file "$body")
gh pr merge "$pr_url" --repo "$GITHUB_REPOSITORY" --auto --squash --match-head-commit "$head_sha"
echo "Metrics PR: $pr_url"
