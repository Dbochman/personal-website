# Plan: Add aria-labels to Icon Links

## Goal

Add descriptive `aria-label` attributes to social links for accessibility. While the current buttons have visible text ("Get In Touch", "LinkedIn"), adding `aria-label` to the anchor elements provides explicit context for screen readers.

## Non-Goals

- Redesigning the buttons (they work fine)
- Adding tooltips (aria-label is sufficient)

## Current State

**File:** `src/components/sections/HeroSection.tsx` (lines 57-68)

```tsx
<Button size="lg" className="..." asChild>
  <a href="mailto:dylanbochman@gmail.com">
    <Mail className="w-4 h-4 mr-2" />
    Get In Touch
  </a>
</Button>
<Button size="lg" className="..." asChild>
  <a href="https://www.linkedin.com/in/dbochman/" target="_blank" rel="noopener noreferrer">
    <Linkedin className="w-4 h-4 mr-2" />
    LinkedIn
  </a>
</Button>
```

The `<a>` elements lack `aria-label`. Screen readers will read the button content, but explicit labels are better practice.

---

## Changes

### Change 1: Email Link (line 58)

```diff
  <Button size="lg" className="bg-foreground text-background hover:bg-foreground/90 hover-lift font-medium" asChild>
-   <a href="mailto:dylanbochman@gmail.com">
+   <a href="mailto:dylanbochman@gmail.com" aria-label="Send email to Dylan Bochman">
      <Mail className="w-4 h-4 mr-2" />
      Get In Touch
    </a>
  </Button>
```

### Change 2: LinkedIn Link (line 64)

```diff
  <Button size="lg" className="bg-foreground text-background hover:bg-foreground/90 hover-lift font-medium" asChild>
-   <a href="https://www.linkedin.com/in/dbochman/" target="_blank" rel="noopener noreferrer">
+   <a href="https://www.linkedin.com/in/dbochman/" target="_blank" rel="noopener noreferrer" aria-label="Visit Dylan Bochman's LinkedIn profile">
      <Linkedin className="w-4 h-4 mr-2" />
      LinkedIn
    </a>
  </Button>
```

---

## Additional Audit

Check other components for icon-only links that need labels:

### ContactSection.tsx

If there are additional contact links, they may need aria-labels too. Check the file and apply the same pattern.

### Sidebar.tsx

No external links in current implementation.

### Footer (if exists)

Check for social links.

---

## Testing

### 1. Screen Reader Test (VoiceOver on Mac)

```bash
# Enable VoiceOver: Cmd + F5
# Navigate to HeroSection using Tab
# Verify screen reader announces:
#   "Send email to Dylan Bochman, link"
#   "Visit Dylan Bochman's LinkedIn profile, link"
```

### 2. Accessibility Audit (Lighthouse)

```bash
npm run build && npm run preview
# Run Lighthouse > Accessibility
# Verify no "Links do not have a discernible name" issues
```

### 3. axe DevTools

```bash
# Install axe DevTools Chrome extension
# Run audit on home page
# Verify no link-related issues
```

---

## Checklist

- [ ] Add `aria-label` to email link in HeroSection (line 58)
- [ ] Add `aria-label` to LinkedIn link in HeroSection (line 64)
- [ ] Check ContactSection.tsx for additional links needing labels
- [ ] Run Lighthouse accessibility audit
- [ ] Test with screen reader (VoiceOver or NVDA)

---

## Effort

~10 minutes implementation + ~10 minutes testing
