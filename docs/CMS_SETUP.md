# CMS Setup Guide

**Last Updated:** January 9, 2026

This document covers the Decap CMS (formerly Netlify CMS) setup for managing blog content.

---

## Quick Start

**Editor URL:** https://dylanbochman.netlify.app/editor/

> **Note:** Visiting `dylanbochman.com/editor/` will automatically redirect to the Netlify subdomain. See [Known Issues](#known-issues) for why this is necessary.

---

## Architecture

### Backend
- **Type:** Git Gateway (via Netlify Identity)
- **Repository:** GitHub (`Dbochman/personal-website`)
- **Branch:** `main`

### Content Location
- **Blog posts:** `content/blog/`
- **Media uploads:** `public/images/blog/`

### Configuration Files
- **CMS Config:** `public/editor/config.yml`
- **Editor HTML:** `public/editor/index.html`
- **Netlify Config:** `netlify.toml`

---

## Authentication

The CMS uses **Netlify Identity** with **Git Gateway** for authentication:

1. Users authenticate via Netlify Identity
2. Git Gateway provides write access to the repository
3. Changes are committed directly to the `main` branch

### Managing Users

1. Go to [Netlify Dashboard](https://app.netlify.com) → Site → Identity
2. Invite users via email
3. Users receive an email to set their password

---

## Known Issues

### Custom Domain Authentication (405 Error)

**Problem:** Accessing the CMS at `https://dylanbochman.com/editor/` returns a 405 error on `/.netlify/identity/token`.

**Cause:** The custom domain is proxied through Cloudflare, which intercepts Netlify Identity API endpoints.

**Solution:** A Netlify redirect automatically sends `/editor/*` requests to the Netlify subdomain:
- `https://dylanbochman.com/editor/` → redirects to `https://dylanbochman.netlify.app/editor/`
- Authentication works correctly on the Netlify subdomain

**Why this approach:**
- The CMS is a private admin interface with no SEO value
- The redirect is seamless - users don't need to remember a different URL
- No need to modify Cloudflare proxy settings

---

## Local Development

For local CMS development, uncomment the local backend in `public/editor/config.yml`:

```yaml
# Local development workflow - uncomment for local testing
local_backend: true
```

Then run:
```bash
npx decap-server
npm run dev
```

Access at: `http://localhost:5173/editor/`

---

## Content Schema

### Blog Post Fields

| Field | Widget | Required | Description |
|-------|--------|----------|-------------|
| `title` | string | Yes | Post title |
| `date` | datetime | Yes | Publish date (YYYY-MM-DD) |
| `author` | string | Yes | Author name (default: Dylan Bochman) |
| `description` | text | Yes | SEO summary |
| `tags` | list | No | Post tags |
| `category` | string | No | Post category |
| `featured` | boolean | No | Show on homepage |
| `draft` | boolean | Yes | Draft status (default: true) |
| `slug` | string | No | Custom URL slug |
| `image` | image | No | Featured image |
| `body` | markdown | Yes | Post content |

---

## Workflow

1. **Create post:** Go to editor → Blog Posts → New Blog Post
2. **Edit content:** Fill in fields and write content in markdown
3. **Save draft:** Set `draft: true` and save
4. **Publish:** Set `draft: false` and save
5. **Commit:** CMS automatically commits to `main` branch
6. **Deploy:** Netlify auto-deploys on commit

---

## Troubleshooting

### "Failed to load config"
- Check `public/editor/config.yml` syntax
- Verify the file is deployed to `dist/editor/config.yml`

### "Unable to authenticate"
- Ensure you're using `https://dylanbochman.netlify.app/editor/`
- Verify Netlify Identity is enabled in dashboard
- Check Git Gateway is enabled in Netlify Identity settings

### "Failed to persist entry"
- Verify Git Gateway is enabled
- Check GitHub repo permissions
- Ensure branch exists

---

## Related Documentation

- [Decap CMS Docs](https://decapcms.org/docs/)
- [Netlify Identity Docs](https://docs.netlify.com/security/secure-access-to-sites/identity/)
- [Blog Feature Plan](./completed-projects/BLOG_FEATURE_PLAN.md)

---

**Maintained By:** Repository Owner
