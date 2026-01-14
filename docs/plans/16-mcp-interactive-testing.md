# MCP-Powered Interactive Testing Plan

## Overview

Leverage Chrome DevTools MCP (Model Context Protocol) tools for comprehensive interactive testing during Claude Code sessions. This enables real-time browser automation, performance analysis, and accessibility auditing without leaving the conversation.

## What We Have

The Chrome DevTools MCP server provides these capabilities:

| Tool | Purpose |
|------|---------|
| `take_snapshot` | Accessibility tree inspection |
| `take_screenshot` | Visual state capture |
| `performance_start_trace` | Core Web Vitals measurement |
| `emulate` | CPU/network throttling, geolocation |
| `resize_page` | Responsive breakpoint testing |
| `list_console_messages` | JavaScript error detection |
| `list_network_requests` | Resource loading verification |
| `click/fill/hover/drag` | Interactive element testing |
| `evaluate_script` | Custom JavaScript execution |

## Testing Workflows

### 1. Full Site Audit

Systematically check all pages for errors and performance issues.

**Steps:**
1. Navigate to each page (`/`, `/blog`, `/projects`, etc.)
2. Check `list_console_messages` for JS errors
3. Check `list_network_requests` for failed resources
4. Run `performance_start_trace` on key pages
5. Take `take_snapshot` to verify accessibility tree

**When to use:** After deployments, before releases, periodic health checks.

### 2. Responsive Testing

Verify layouts across common breakpoints.

**Steps:**
1. Navigate to target page
2. For each breakpoint (320px, 768px, 1024px, 1440px):
   - `resize_page` to dimensions
   - `take_screenshot` for visual record
   - `take_snapshot` to check element visibility/accessibility
3. Document any layout issues found

**Breakpoints:**
| Name | Width | Typical Device |
|------|-------|----------------|
| Mobile S | 320px | iPhone SE |
| Mobile L | 414px | iPhone Plus |
| Tablet | 768px | iPad |
| Desktop | 1024px | Laptop |
| Desktop L | 1440px | External monitor |

### 3. Performance Stress Testing

Test under degraded conditions to find performance cliffs.

**Steps:**
1. `emulate` with slow network (Slow 3G) and CPU throttling (4x)
2. Navigate to page
3. `performance_start_trace` with reload
4. Analyze LCP, CLS under constrained conditions
5. Compare to baseline metrics

**Emulation presets:**
| Scenario | Network | CPU | Use Case |
|----------|---------|-----|----------|
| Budget mobile | Slow 3G | 4x | Low-end device simulation |
| Spotty connection | Fast 3G | 1x | Network issues |
| Overloaded device | No throttle | 6x | CPU-bound testing |

### 4. Interactive Flow Testing

Test user journeys through click/fill interactions.

**Steps:**
1. `take_snapshot` to identify interactive elements (get UIDs)
2. `click` on navigation, buttons, links
3. `fill` form inputs
4. Verify state changes via snapshot/screenshot
5. Check console for errors after interactions

**Example flows:**
- Theme toggle (light → dark → light)
- Navigation between pages
- Blog filtering/search (if applicable)
- Project card interactions

### 5. Accessibility Audit

Use the accessibility tree for a11y verification.

**Steps:**
1. Navigate to page
2. `take_snapshot` (returns a11y tree)
3. Review for:
   - Missing labels on interactive elements
   - Incorrect heading hierarchy
   - Missing alt text indicators
   - Focus order issues
4. Cross-reference with Lighthouse a11y score

## Standard Test Session Checklist

```markdown
## Pre-Session
- [ ] Chrome browser open
- [ ] MCP server connected

## Full Audit Checklist
- [ ] Homepage
  - [ ] No console errors
  - [ ] All network requests 2xx
  - [ ] LCP < 2.5s
  - [ ] CLS < 0.1
- [ ] Blog
  - [ ] No console errors
  - [ ] All network requests 2xx
- [ ] Projects
  - [ ] No console errors
  - [ ] All network requests 2xx
- [ ] Responsive (320px, 768px, 1024px)
  - [ ] No layout breaks
  - [ ] Interactive elements accessible

## Post-Session
- [ ] Document any issues found
- [ ] Create GitHub issues for bugs
```

## Integration with Existing Workflows

### Complements Playwright Tests
- Playwright: Automated, CI-integrated, deterministic
- MCP Testing: Interactive, exploratory, real-time debugging

### When to Use MCP vs Playwright

| Scenario | Use MCP | Use Playwright |
|----------|---------|----------------|
| Exploring a bug | ✅ | |
| Regression testing | | ✅ |
| Performance profiling | ✅ | |
| Visual regression | | ✅ |
| Accessibility audit | ✅ | ✅ |
| Interactive debugging | ✅ | |
| CI/CD integration | | ✅ |

## Example Session Transcript

```
User: Check the performance of dylanbochman.com

Claude: [Navigates to site, runs performance trace]

Results:
- LCP: 128ms ✅
- CLS: 0.00 ✅
- Render blocking: 1 CSS file (6ms) ✅
- Third parties: GTM 404KB, 20ms main thread
- Cache: 600s TTL (GitHub Pages default)

User: Check for console errors across all pages

Claude: [Navigates to each page, checks console]

Results:
- /: No errors
- /blog: No errors
- /projects: No errors
```

## Limitations

- **Local Chrome only**: Cannot test on remote devices (Android, iOS)
- **Single browser**: Chrome only, no Firefox/Safari testing
- **Manual**: Not automated in CI, requires active session
- **Session-bound**: Results not persisted unless documented

## Future Enhancements

1. **Automated test scripts**: Pre-built prompts for common test flows
2. **Results archiving**: Save performance traces to `docs/performance-reports/`
3. **Comparison mode**: Track metrics over time
4. **Remote device support**: If MCP adds android debug bridge support

## Files Referenced

```
docs/plans/13-mcp-interactive-testing.md  # This plan
docs/PERFORMANCE_EVALUATION_GUIDE.md      # Detailed perf methodology
docs/performance-reports/                 # Where to save results
```

## Effort

**Estimate**: Low (documentation only)

This is primarily a workflow/process improvement, not a code change. The tools already exist; this documents how to use them effectively.
