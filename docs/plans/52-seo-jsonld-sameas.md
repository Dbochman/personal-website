# Plan: Expand JSON-LD sameAs Links

## Goal

Add GitHub and Twitter URLs to the Person schema `sameAs` array. This strengthens identity signals to search engines by connecting Dylan's profile across platforms.

## Non-Goals

- Adding all social profiles (only the active, professional ones)
- Changing other JSON-LD properties (covered in plan 49)

## Current State

**File:** `index.html` (lines 105-107)

```json
"sameAs": [
  "https://www.linkedin.com/in/dylanbochman"
]
```

Only LinkedIn is linked. GitHub and Twitter are missing.

---

## Change

**File:** `index.html` (lines 105-107)

```diff
  "sameAs": [
-   "https://www.linkedin.com/in/dylanbochman"
+   "https://www.linkedin.com/in/dylanbochman",
+   "https://github.com/dbochman",
+   "https://twitter.com/dylanbochman"
  ]
```

### Full Context (lines 76-109)

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Dylan Bochman",
  "url": "https://dylanbochman.com",
  "jobTitle": "Technical Incident Manager",
  "worksFor": {
    "@type": "Organization",
    "name": "Groq"
  },
  "alumniOf": [
    {
      "@type": "Organization",
      "name": "HashiCorp"
    },
    {
      "@type": "Organization",
      "name": "Spotify"
    }
  ],
  "knowsAbout": [
    "Site Reliability Engineering",
    "Incident Management",
    "DevOps",
    "System Reliability",
    "Post-Incident Analysis",
    "SLO Monitoring"
  ],
  "sameAs": [
    "https://www.linkedin.com/in/dylanbochman",
    "https://github.com/dbochman",
    "https://twitter.com/dylanbochman"
  ]
}
</script>
```

---

## Verification

### 1. Local Check

```bash
npm run dev
# View page source
# Search for "sameAs"
# Verify all three URLs appear
```

### 2. JSON Validation

```bash
# Copy the JSON-LD block to https://jsonlint.com/
# Verify no syntax errors (trailing commas, missing quotes)
```

### 3. Rich Results Test

1. Go to https://search.google.com/test/rich-results
2. Enter `https://dylanbochman.com` (after deploy)
3. Verify Person schema detected
4. Check `sameAs` shows all three URLs

### 4. Schema.org Validator

1. Go to https://validator.schema.org/
2. Paste the JSON-LD
3. Verify no errors

---

## Checklist

- [ ] Update `sameAs` array in `index.html` (line 105-107)
- [ ] Add GitHub URL: `https://github.com/dbochman`
- [ ] Add Twitter URL: `https://twitter.com/dylanbochman`
- [ ] Verify JSON is valid (no trailing commas)
- [ ] Test with Rich Results Test after deploy

---

## Effort

~5 minutes implementation + ~5 minutes testing
