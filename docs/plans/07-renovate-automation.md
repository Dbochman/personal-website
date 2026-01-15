# Renovate Automation Plan

> **Status: Won't Do (Jan 2026)**
>
> Decided against implementing. The overhead isn't justified for an actively-maintained personal project:
> - No production users depending on uptime
> - Active development means issues are noticed quickly
> - Manual `npm update` works fine for this scale
> - Adds infrastructure complexity without clear benefit
>
> Renovate is better suited for projects that sit idle for months, team projects where no one owns updates, or apps with security-sensitive dependencies.

## Overview

Set up Renovate for automated dependency updates. Reduces manual maintenance, improves security posture, and keeps dependencies current.

## Why Renovate over Dependabot

| Feature | Renovate | Dependabot |
|---------|----------|------------|
| Grouping | ✅ Group by type/scope | ⚠️ Limited |
| Scheduling | ✅ Flexible | ⚠️ Basic |
| Auto-merge | ✅ Conditional rules | ⚠️ Basic |
| Monorepo support | ✅ Excellent | ⚠️ Basic |
| Config flexibility | ✅ Very flexible | ⚠️ Limited |

## Implementation

### Phase 1: Basic Setup

Create `renovate.json` in repository root:

```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": [
    "config:recommended",
    ":semanticCommits",
    ":timezone(America/Los_Angeles)"
  ],
  "schedule": ["after 9am on monday"],
  "labels": ["dependencies"],
  "rangeStrategy": "bump",
  "prHourlyLimit": 2,
  "prConcurrentLimit": 5
}
```

### Phase 2: Grouping Strategy

Group related updates to reduce PR noise:

```json
{
  "packageRules": [
    {
      "description": "Group React ecosystem",
      "matchPackagePatterns": ["^react", "^@types/react"],
      "groupName": "React packages"
    },
    {
      "description": "Group Radix UI components",
      "matchPackagePatterns": ["^@radix-ui/"],
      "groupName": "Radix UI"
    },
    {
      "description": "Group testing packages",
      "matchPackagePatterns": ["vitest", "playwright", "@testing-library"],
      "groupName": "Testing packages"
    },
    {
      "description": "Group Tailwind ecosystem",
      "matchPackagePatterns": ["tailwindcss", "postcss", "autoprefixer"],
      "groupName": "Tailwind CSS"
    },
    {
      "description": "Group ESLint/Prettier",
      "matchPackagePatterns": ["eslint", "prettier", "@typescript-eslint"],
      "groupName": "Linting tools"
    },
    {
      "description": "Group TypeScript",
      "matchPackageNames": ["typescript"],
      "matchPackagePatterns": ["^@types/"],
      "groupName": "TypeScript"
    }
  ]
}
```

### Phase 3: Auto-Merge Rules

Enable auto-merge for safe updates:

```json
{
  "packageRules": [
    {
      "description": "Auto-merge patch updates for dev dependencies",
      "matchDepTypes": ["devDependencies"],
      "matchUpdateTypes": ["patch"],
      "automerge": true,
      "automergeType": "pr",
      "automergeStrategy": "squash"
    },
    {
      "description": "Auto-merge minor updates for type definitions",
      "matchPackagePatterns": ["^@types/"],
      "matchUpdateTypes": ["minor", "patch"],
      "automerge": true
    },
    {
      "description": "Require approval for major updates",
      "matchUpdateTypes": ["major"],
      "automerge": false,
      "labels": ["dependencies", "major"]
    }
  ]
}
```

### Phase 4: Node.js Version Pinning

Handle Node.js version updates carefully:

```json
{
  "packageRules": [
    {
      "description": "Node.js major updates require review",
      "matchPackageNames": ["node"],
      "matchManagers": ["nvm", "dockerfile"],
      "enabled": true,
      "automerge": false,
      "labels": ["dependencies", "node"]
    }
  ],
  "nvm": {
    "enabled": true
  }
}
```

## Complete Configuration

**File:** `renovate.json`

```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": [
    "config:recommended",
    ":semanticCommits",
    ":timezone(America/Los_Angeles)"
  ],
  "schedule": ["after 9am on monday"],
  "labels": ["dependencies"],
  "rangeStrategy": "bump",
  "prHourlyLimit": 2,
  "prConcurrentLimit": 5,
  "packageRules": [
    {
      "matchPackagePatterns": ["^react", "^@types/react"],
      "groupName": "React packages"
    },
    {
      "matchPackagePatterns": ["^@radix-ui/"],
      "groupName": "Radix UI"
    },
    {
      "matchPackagePatterns": ["vitest", "playwright", "@testing-library"],
      "groupName": "Testing packages"
    },
    {
      "matchPackagePatterns": ["tailwindcss", "postcss", "autoprefixer"],
      "groupName": "Tailwind CSS"
    },
    {
      "matchPackagePatterns": ["eslint", "prettier", "@typescript-eslint"],
      "groupName": "Linting tools"
    },
    {
      "matchPackageNames": ["typescript"],
      "matchPackagePatterns": ["^@types/"],
      "groupName": "TypeScript"
    },
    {
      "matchDepTypes": ["devDependencies"],
      "matchUpdateTypes": ["patch"],
      "automerge": true,
      "automergeType": "pr",
      "automergeStrategy": "squash"
    },
    {
      "matchPackagePatterns": ["^@types/"],
      "matchUpdateTypes": ["minor", "patch"],
      "automerge": true
    },
    {
      "matchUpdateTypes": ["major"],
      "automerge": false,
      "labels": ["dependencies", "major"]
    }
  ],
  "vulnerabilityAlerts": {
    "enabled": true,
    "labels": ["security"]
  }
}
```

## Enabling Renovate

1. Go to https://github.com/apps/renovate
2. Install on repository
3. Renovate will create onboarding PR with detected config
4. Merge onboarding PR to activate

## Verification

1. Check Renovate dashboard (PR or issues)
2. Verify grouping works as expected
3. Test auto-merge on patch update
4. Verify major updates require approval

## Effort

**Estimate**: Small

- Create config: 15 min
- Install app: 5 min
- Review onboarding PR: 10 min
- Fine-tune after first week: 30 min

## Alternatives

- **Dependabot**: Built into GitHub, simpler but less flexible
- **Manual**: Current approach, requires regular attention
- **GitHub Actions**: Custom workflow, more work to maintain
