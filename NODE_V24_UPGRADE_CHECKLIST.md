# Node.js v24 Upgrade Checklist

**Date:** _____________
**Start Time:** _____________
**Node Current:** v22.20.0 → **Target:** v24.11.0

---

## Pre-Flight (5 min)

- [ ] Read full upgrade plan (`NODE_V24_UPGRADE_PLAN.md`)
- [ ] Close/merge open PRs (PR #18 @types/node)
- [ ] Ensure clean working directory: `git status`

---

## Phase 1: Backup (5 min)

```bash
git checkout -b backup/pre-node-v24-upgrade
git push origin backup/pre-node-v24-upgrade
git checkout main
```

- [ ] Backup branch created and pushed
- [ ] Back on main branch

---

## Phase 2: Code Fixes (20 min)

### Fix vite.config.ts
- [ ] Add to top after imports:
```typescript
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
```

### Fix vitest.config.ts
- [ ] Add same imports as above

### Update CI Workflow
- [ ] Edit `.github/workflows/deploy.yml:18`
- [ ] Change `node-version: '20'` → `'24'`

### Create .nvmrc
- [ ] Create `.nvmrc` with content: `24`

### Update package.json
- [ ] Edit line 82: `"@types/node": "^24.10.0"`

### Commit Changes
```bash
git add vite.config.ts vitest.config.ts .github/workflows/deploy.yml .nvmrc package.json
git commit -m "fix: Update configs for Node v24 compatibility

- Replace __dirname with import.meta.url in ES modules
- Update CI workflow to Node v24
- Add .nvmrc for version consistency
- Update @types/node to v24"
```

- [ ] All files committed

---

## Phase 3: Node Upgrade (10 min)

```bash
nvm install 24
nvm use 24
node --version  # Should show v24.x.x
npm --version   # Should show 11.x.x
```

- [ ] Node v24 installed
- [ ] Node version: _______________
- [ ] npm version: _______________

---

## Phase 4: Dependencies (5 min)

```bash
rm -rf node_modules package-lock.json
npm install
```

- [ ] node_modules removed
- [ ] package-lock.json regenerated
- [ ] npm install completed without errors

---

## Phase 5: Testing (30 min)

### Build & Type Check
```bash
npm run build
```
- [ ] ✅ Build successful, no TypeScript errors

### Run Tests
```bash
npm test
```
- [ ] ✅ All 86 tests passing

### Linting
```bash
npm run lint
```
- [ ] ✅ No linting errors

### Dev Server
```bash
npm run dev
```
- [ ] Navigate to http://localhost:5173
- [ ] Homepage loads correctly
- [ ] Navigation works
- [ ] Theme toggle works (dark/light)
- [ ] No console errors
- [ ] Mobile responsive works

### Production Build
```bash
npm run build
npm run preview
```
- [ ] Preview loads correctly
- [ ] All pages accessible
- [ ] No 404s in Network tab

### Coverage
```bash
npm run test:coverage
```
- [ ] ✅ Coverage reports generated

---

## Phase 6: CI/CD Validation (15 min)

```bash
git checkout -b test/node-v24-upgrade
git push origin test/node-v24-upgrade
```

- [ ] Test branch pushed
- [ ] GitHub Actions workflow started
- [ ] All CI checks passed ✅
- [ ] No deployment errors

**Actions URL:** https://github.com/Dbochman/personal-website/actions

---

## Phase 7: Merge to Main (5 min)

```bash
git checkout main
git merge test/node-v24-upgrade
git push origin main
```

- [ ] Merged to main
- [ ] Pushed to main
- [ ] Production deployment started
- [ ] Live site verified: https://dbochman.github.io/personal-website/

### Cleanup
```bash
gh pr close 18 -c "Manually upgraded as part of comprehensive Node v24 upgrade"
```

- [ ] Closed Dependabot PR #18

---

## Success Criteria ✅

All must be checked:

- [ ] Node v24 active locally
- [ ] All tests passing (86/86)
- [ ] Build succeeds
- [ ] Linting clean
- [ ] Dev server works
- [ ] Production preview works
- [ ] CI/CD passes
- [ ] Production deployed successfully
- [ ] Live site functional

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

---

## Post-Upgrade (Next Session)

- [ ] Monitor for 24 hours
- [ ] Check analytics for errors
- [ ] Delete backup branch after 1 week
- [ ] Update CLAUDE.md with Node v24 requirement
- [ ] Add engines field to package.json

---

## Notes & Issues

Issues encountered:
_____________________________________________________________
_____________________________________________________________
_____________________________________________________________

Resolution:
_____________________________________________________________
_____________________________________________________________
_____________________________________________________________

**Completed:** __________ **Duration:** __________ **Status:** __________
