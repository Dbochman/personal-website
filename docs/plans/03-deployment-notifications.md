# Deployment Notifications Plan

## Overview

Add email notifications for deployment events (success/failure) to improve visibility into site deployments.

## Current State

- **Failures**: GitHub creates issues automatically for workflow failures (configured in repo settings)
- **Successes**: No notifications - requires checking GitHub Actions manually
- **Workflows**: `deploy.yml` handles build, test, and deploy to GitHub Pages

## Implementation

### Option A: GitHub Action Email (Recommended)

Use `dawidd6/action-send-mail` action to send emails on deployment completion.

**File:** `.github/workflows/deploy.yml`

Add notification job after deploy:

```yaml
notify:
  runs-on: ubuntu-latest
  needs: deploy
  if: always()  # Run even if deploy fails
  steps:
    - name: Send deployment notification
      uses: dawidd6/action-send-mail@v3
      with:
        server_address: smtp.gmail.com
        server_port: 587
        username: ${{ secrets.EMAIL_USERNAME }}
        password: ${{ secrets.EMAIL_APP_PASSWORD }}
        subject: |
          ${{ needs.deploy.result == 'success' && '✅' || '❌' }} Deploy ${{ needs.deploy.result }}: ${{ github.repository }}
        to: ${{ secrets.NOTIFICATION_EMAIL }}
        from: GitHub Actions <noreply@github.com>
        body: |
          Deployment ${{ needs.deploy.result }} for ${{ github.repository }}

          Commit: ${{ github.sha }}
          Author: ${{ github.actor }}
          Message: ${{ github.event.head_commit.message }}

          View workflow: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}
```

### Option B: GitHub Notification Settings

Simpler approach using GitHub's built-in notification system.

1. Go to repository Settings → Actions → General
2. Under "Workflow notifications", enable email notifications
3. Configure in personal GitHub notification settings

**Pros**: No secrets needed, built-in
**Cons**: Less customizable, may include noise from other workflows

## Required Secrets

For Option A, add these repository secrets:

| Secret | Description |
|--------|-------------|
| `EMAIL_USERNAME` | Gmail address (e.g., `you@gmail.com`) |
| `EMAIL_APP_PASSWORD` | Gmail App Password (not regular password) |
| `NOTIFICATION_EMAIL` | Where to send notifications |

### Gmail App Password Setup

1. Enable 2-Step Verification on Google Account
2. Go to Google Account → Security → App passwords
3. Generate password for "Mail" + "Other (GitHub Actions)"
4. Use generated 16-character password as `EMAIL_APP_PASSWORD`

## Alternative: SendGrid (if Gmail limits become an issue)

```yaml
- name: Send deployment notification
  uses: dawidd6/action-send-mail@v3
  with:
    server_address: smtp.sendgrid.net
    server_port: 587
    username: apikey
    password: ${{ secrets.SENDGRID_API_KEY }}
    # ... rest same as above
```

## Verification

1. Push a commit to trigger deployment
2. Verify email received on success
3. Introduce a failing test, verify failure email received
4. Check email includes: commit info, status, link to workflow

## Effort

- **Setup secrets**: 10 min
- **Modify workflow**: 5 min
- **Test**: 10 min

**Total**: ~25 minutes

## Decision

Recommend **Option A** for full control over notification content and timing. Option B is simpler but less flexible.
