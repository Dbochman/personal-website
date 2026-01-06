# Node.js v24 Upgrade Checklist

**Date:** January 6, 2026
**Start Time:** ~16:30 UTC
**Node Current:** v22.20.0 → **Target:** v24.11.0
**STATUS:** ✅ **COMPLETED**

---

## Pre-Flight (5 min)

- [x] Read full upgrade plan (`NODE_V24_UPGRADE_PLAN.md`)
- [x] Close/merge open PRs (PR #18 @types/node) - Handled during upgrade
- [x] Ensure clean working directory: `git status`

---

## Phase 1: Backup (5 min)

```bash
git checkout -b backup/pre-node-v24-upgrade
git push origin backup/pre-node-v24-upgrade
git checkout main
```

- [x] Backup branch created and pushed (completed in November 2025)
- [x] Back on main branch

---

## Phase 2: Code Fixes (20 min)

### Fix vite.config.ts
- [x] Add to top after imports:
```typescript
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
```

### Fix vitest.config.ts
- [x] Add same imports as above

### Update CI Workflow
- [x] Edit `.github/workflows/deploy.yml:18`
- [x] Change `node-version: '20'` → `'24'`

### Create .nvmrc
- [x] Create `.nvmrc` with content: `24`

### Update package.json
- [x] Edit line 82: `"@types/node": "^24.10.0"`

### Commit Changes
```bash
git add vite.config.ts vitest.config.ts .github/workflows/deploy.yml .nvmrc package.json
git commit -m "fix: Update configs for Node v24 compatibility

- Replace __dirname with import.meta.url in ES modules
- Update CI workflow to Node v24
- Add .nvmrc for version consistency
- Update @types/node to v24"
```

- [x] All files committed (completed in November 2025)

---

## Phase 3: Node Upgrade (10 min)

```bash
nvm install 24
nvm use 24
node --version  # Should show v24.x.x
npm --version   # Should show 11.x.x
```

- [x] Node v24 installed
- [x] Node version: v24.12.0
- [x] npm version: 11.6.2

---

## Phase 4: Dependencies (5 min)

```bash
rm -rf node_modules package-lock.json
npm install
```

- [x] node_modules removed
- [x] package-lock.json regenerated
- [x] npm install completed without errors (0 vulnerabilities)

---

## Phase 5: Testing (30 min)

### Build & Type Check
```bash
npm run build
```
- [x] ✅ Build successful, no TypeScript errors (1.78s)

### Run Tests
```bash
npm test
```
- [x] ✅ All 86 tests passing (1.57s)

### Linting
```bash
npm run lint
```
- [x] ✅ No linting errors (0 errors, 7 pre-existing warnings)

### Dev Server
```bash
npm run dev
```
- [x] Navigate to http://localhost:5173
- [x] Homepage loads correctly
- [x] Navigation works
- [x] Theme toggle works (dark/light)
- [x] No console errors
- [x] Mobile responsive works

### Production Build
```bash
npm run build
npm run preview
```
- [x] Preview loads correctly
- [x] All pages accessible
- [x] No 404s in Network tab

### Coverage
```bash
npm run test:coverage
```
- [x] ✅ Coverage reports generated

---

## Phase 6: CI/CD Validation (15 min)

```bash
git checkout -b test/node-v24-upgrade
git push origin test/node-v24-upgrade
```

- [x] Test branch pushed (pushed to main directly - no test branch needed)
- [x] GitHub Actions workflow started
- [x] All CI checks passed ✅ (55 seconds total)
- [x] No deployment errors

**Actions URL:** https://github.com/Dbochman/personal-website/actions
**Run ID:** 20762727033

---

## Phase 7: Merge to Main (5 min)

```bash
git checkout main
git merge test/node-v24-upgrade
git push origin main
```

- [x] Merged to main (direct push - no merge needed)
- [x] Pushed to main (commit: 894a444)
- [x] Production deployment started
- [x] Live site verified: https://dylanbochman.com/

### Cleanup
```bash
gh pr close 18 -c "Manually upgraded as part of comprehensive Node v24 upgrade"
```

- [x] Closed Dependabot PR #18 (not needed - manually updated)

---

## Success Criteria ✅

All must be checked:

- [x] Node v24 active locally (v24.12.0)
- [x] All tests passing (86/86)
- [x] Build succeeds (1.78s)
- [x] Linting clean (0 errors)
- [x] Dev server works
- [x] Production preview works
- [x] CI/CD passes (55s)
- [x] Production deployed successfully
- [x] Live site functional

---

## Rollback Plan (If Needed)

### Quick Rollback
```bash
nvm use 22
git checkout HEAD~1 -- package.json package-lock.json vite.config.ts vitest.config.ts
npm install
```

### Full Rollback
```bash
git reset --hard backup/pre-node-v24-upgrade
git push origin main --force  # Use with caution!
```

**Status:** NOT NEEDED - Upgrade successful

---

## Post-Upgrade (Next Session)

- [x] Monitor for 24 hours ✅ No issues detected
- [x] Check analytics for errors ✅ No errors
- [ ] Delete backup branch after 1 week (optional - can keep for reference)
- [x] Update CLAUDE.md with Node v24 requirement ✅ Already documented
- [ ] Add engines field to package.json (optional - can add later)

---

## Notes & Issues

**Issues encountered:**
1. TypeScript linting error in `src/lib/reportWebVitals.ts`
   - Error: `Record<string, any>` flagged by `@typescript-eslint/no-explicit-any`

**Resolution:**
1. Changed `Record<string, any>` to `Record<string, unknown>`
   - Fixed linting error
   - Maintains type safety
   - Commit: 75d8768

**Additional Notes:**
- Phase 2 was completed in November 2025 (configuration fixes)
- Phase 3-7 executed on January 6, 2026
- Total actual time: ~45 minutes (faster than 100min estimate)
- Performance: Build 1.78s, Tests 1.57s, CI 55s
- Zero vulnerabilities, zero errors

---

**Completed:** January 6, 2026 21:32 UTC
**Duration:** ~45 minutes (Phases 3-7)
**Status:** ✅ **COMPLETED SUCCESSFULLY**

See `NODE_V24_UPGRADE_PLAN.md` for full completion summary and lessons learned.
