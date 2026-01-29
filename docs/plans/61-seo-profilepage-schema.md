# Plan 61: ProfilePage Structured Data

Add ProfilePage schema to the homepage to improve Google's understanding of the site owner and enable enhanced search appearances.

## Goal

Implement ProfilePage structured data on the homepage (`index.html`) to:
- Help Google understand Dylan as the creator/owner of the site
- Enable potential "Perspectives" filter appearances in search
- Link to external profiles (LinkedIn, GitHub) for identity verification
- Complement existing Person schema with creator-specific metadata

## Background

Google's [ProfilePage schema](https://developers.google.com/search/docs/appearance/structured-data/profile-page) is designed for pages that represent a single person or organization. It enhances:
- "Discussions and Forums" feature in search results
- Creator attribution in article/recipe rich results
- Identity linking across platforms via `sameAs`

The homepage already has a `Person` schema. ProfilePage wraps it with additional context about the page being a profile.

## Schema Structure

```json
{
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  "dateCreated": "2026-01-04",
  "dateModified": "2026-01-28",
  "mainEntity": {
    "@type": "Person",
    "name": "Dylan Bochman",
    "alternateName": ["Dbochman", "@dylanbochman"],
    "identifier": "dylanbochman",
    "description": "Site Reliability Engineer & Technical Incident Manager specializing in reliability, incident management, and SLO monitoring.",
    "image": "https://dylanbochman.com/social-preview.webp",
    "url": "https://dylanbochman.com",
    "jobTitle": "Site Reliability Engineer & Technical Incident Manager",
    "worksFor": {
      "@type": "Organization",
      "name": "Groq",
      "url": "https://groq.com"
    },
    "alumniOf": [
      { "@type": "Organization", "name": "HashiCorp" },
      { "@type": "Organization", "name": "Spotify" }
    ],
    "knowsAbout": [
      "Site Reliability Engineering",
      "Incident Management",
      "DevOps",
      "SLO Monitoring"
    ],
    "sameAs": [
      "https://www.linkedin.com/in/dylanbochman",
      "https://github.com/Dbochman"
    ]
  }
}
```

## Required Properties

| Property | Value | Notes |
|----------|-------|-------|
| `@type` | ProfilePage | Page type |
| `mainEntity` | Person object | The person this profile represents |
| `mainEntity.name` | Dylan Bochman | Real name (required) |

## Recommended Properties

| Property | Value | Notes |
|----------|-------|-------|
| `dateCreated` | 2026-01-04 | Site launch date |
| `dateModified` | Dynamic or build date | Last content update |
| `mainEntity.alternateName` | Dbochman, @dylanbochman | Social handles |
| `mainEntity.identifier` | dylanbochman | Site-specific ID |
| `mainEntity.description` | Job title + specialty | Credentials/byline |
| `mainEntity.image` | social-preview.webp | Profile image |
| `mainEntity.sameAs` | LinkedIn, GitHub URLs | External profiles |

## Implementation

### Option A: Enhance index.html (Recommended)

Replace the existing Person schema with ProfilePage that wraps Person:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  "dateCreated": "2026-01-04",
  "dateModified": "2026-01-28",
  "mainEntity": {
    "@type": "Person",
    "name": "Dylan Bochman",
    <!-- ... existing Person properties ... -->
    "sameAs": [
      "https://www.linkedin.com/in/dylanbochman",
      "https://github.com/Dbochman"
    ]
  }
}
</script>
```

### Option B: Add ProfilePage alongside Person

Keep existing Person schema and add a separate ProfilePage schema. Less clean but lower risk of breaking existing rich results.

## Files to Modify

| File | Change |
|------|--------|
| `index.html` | Update Person schema → ProfilePage wrapper |

## Verification

- [ ] Rich Results Test passes for ProfilePage
- [ ] Existing Person rich results still work
- [ ] `sameAs` links resolve correctly
- [ ] No validation errors in Search Console

## Risks

| Risk | Mitigation |
|------|------------|
| Breaking existing Person rich results | Test in Rich Results Test before deploy |
| Incorrect sameAs URLs | Verify LinkedIn/GitHub URLs are correct |

## References

- [ProfilePage Structured Data](https://developers.google.com/search/docs/appearance/structured-data/profile-page)
- [Rich Results Test](https://search.google.com/test/rich-results)
- Existing schema: `index.html` lines 75-120
