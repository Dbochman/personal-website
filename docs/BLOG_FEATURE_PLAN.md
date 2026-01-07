# Blog Feature Implementation Plan

> **Development Guidelines:**
> - **ALL work must be done in a feature branch** - DO NOT commit directly to main
> - **Each phase/feature gets its own commit** with descriptive messages
> - **Create PR for review** before merging each phase to main
> - **Run tests and build** before each commit
> - **Maintain Lighthouse score 95+** throughout development

## Project Overview
- **Approach:** MDX-based blog with file-system routing
- **Content Volume:** Medium (1-2 posts/month)
- **Key Features:** Search/filtering, tags, minimalist comments
- **Tech Stack:** Vite + React Router + MDX

---

## 1. Requirements & Scope

### Core Features (MVP)
✅ **Content Management**
- Write posts in MDX (Markdown + React components)
- Store in `content/blog/` directory
- Version controlled with Git
- Hot reload during development

✅ **Blog Pages**
- `/blog` - Blog listing page with search & filter
- `/blog/[slug]` - Individual post page
- `/blog/tags/[tag]` - Posts filtered by tag

✅ **Content Features**
- Frontmatter metadata (title, date, tags, description, author)
- Reading time estimation
- Table of contents for long posts
- Social sharing meta tags (Open Graph, Twitter Cards)

✅ **Discovery Features**
- Search posts by title/content
- Filter by tags/categories
- Sort by date (newest/oldest)
- Pagination (if needed)

✅ **Engagement**
- Minimalist comment system (Giscus - GitHub Discussions based)
- Social sharing buttons
- "Back to blog" navigation

### Nice-to-Have (Phase 2)
- RSS feed generation
- Related posts suggestions
- Dark mode optimized code blocks
- Newsletter subscription
- View count tracking

---

## 2. Technical Architecture

### File Structure
```
personal-website/
├── content/
│   └── blog/
│       ├── 2026-01-incident-management-best-practices.mdx
│       ├── 2026-02-observability-at-scale.mdx
│       └── 2026-03-sre-runbooks.mdx
├── src/
│   ├── pages/
│   │   ├── Blog.tsx              # /blog - listing page
│   │   └── BlogPost.tsx          # /blog/:slug - post page
│   ├── components/
│   │   ├── blog/
│   │   │   ├── BlogCard.tsx      # Post preview card
│   │   │   ├── BlogSearch.tsx    # Search & filter UI
│   │   │   ├── BlogTags.tsx      # Tag cloud/filter
│   │   │   ├── TableOfContents.tsx
│   │   │   ├── ReadingTime.tsx
│   │   │   ├── ShareButtons.tsx
│   │   │   └── Comments.tsx      # Giscus wrapper
│   │   └── mdx/
│   │       ├── MDXProvider.tsx   # Custom MDX components
│   │       ├── CodeBlock.tsx     # Syntax highlighted code
│   │       ├── Callout.tsx       # Info/warning boxes
│   │       └── Image.tsx         # Optimized images
│   ├── lib/
│   │   ├── mdx.ts                # MDX processing utilities
│   │   └── blog.ts               # Blog helper functions
│   └── types/
│       └── blog.ts               # TypeScript types
├── public/
│   └── blog/
│       └── images/               # Blog post images
└── scripts/
    └── generate-rss.js           # RSS feed generation
```

### Dependencies to Add
```json
{
  "@mdx-js/rollup": "^3.0.0",
  "remark-gfm": "^4.0.0",
  "remark-frontmatter": "^5.0.0",
  "rehype-slug": "^6.0.0",
  "rehype-autolink-headings": "^7.0.0",
  "rehype-prism-plus": "^2.0.0",
  "gray-matter": "^4.0.3",
  "reading-time": "^1.5.0",
  "date-fns": "^3.0.0"
}
```

---

## 3. Data Structure

### MDX Frontmatter Schema
```yaml
---
title: "Incident Management Best Practices at Scale"
slug: "incident-management-best-practices"
date: "2026-01-15"
updated: "2026-01-16"  # optional
author: "Dylan Bochman"
description: "Learn how to manage incidents effectively in high-scale environments based on experience at Groq, HashiCorp, and Spotify."
tags: ["SRE", "Incident Management", "Observability"]
category: "Technical"  # optional
featured: true  # optional - show on homepage
draft: false
image: "/blog/images/incident-management-cover.webp"  # optional
readingTime: "8 min"  # auto-calculated
---
```

### TypeScript Types
```typescript
interface BlogPost {
  slug: string
  title: string
  date: string
  updated?: string
  author: string
  description: string
  tags: string[]
  category?: string
  featured?: boolean
  draft: boolean
  image?: string
  readingTime: string
  content: string  // MDX content
}

interface BlogMeta {
  totalPosts: number
  tags: string[]
  categories: string[]
  latestPost: BlogPost
}
```

---

## 4. Implementation Phases

### Phase 1: Foundation (Week 1)
**Branch:** `feature/blog-foundation`

**Tasks:**
1. Create feature branch from main
2. Install MDX dependencies (`@mdx-js/rollup`, `remark-*`, `rehype-*`)
3. Configure Vite for MDX processing
4. Set up `content/blog/` directory structure
5. Create TypeScript types (`src/types/blog.ts`)
6. Write MDX utility functions (`src/lib/mdx.ts`)
7. Create 1 sample blog post to test pipeline
8. Write unit tests for MDX parsing

**Commits:**
- `feat(blog): install MDX and remark/rehype plugins`
- `feat(blog): configure Vite for MDX processing`
- `feat(blog): add blog TypeScript types and utilities`
- `feat(blog): create sample blog post for testing`
- `test(blog): add unit tests for MDX parsing`

**Definition of Done:**
- [ ] MDX files can be parsed
- [ ] Frontmatter metadata is extracted
- [ ] Reading time is calculated
- [ ] All tests pass
- [ ] Build succeeds
- [ ] PR created and reviewed

---

### Phase 2: Blog Listing Page (Week 2)
**Branch:** `feature/blog-listing`

**Tasks:**
1. Create `/blog` route in App.tsx
2. Create Blog.tsx page component
3. Implement BlogCard component
4. Add search functionality (client-side)
5. Add tag filtering UI
6. Add sort options (date newest/oldest)
7. Style with existing design system
8. Add loading states
9. Write component tests

**Commits:**
- `feat(blog): create /blog route and page component`
- `feat(blog): implement BlogCard preview component`
- `feat(blog): add search functionality`
- `feat(blog): add tag filtering UI`
- `feat(blog): add date sorting`
- `style(blog): apply design system to blog listing`
- `test(blog): add tests for blog listing page`

**Definition of Done:**
- [ ] /blog route renders correctly
- [ ] Blog posts are listed with preview cards
- [ ] Search filters posts by title/description
- [ ] Tag filtering works
- [ ] Sorting by date works
- [ ] Mobile responsive
- [ ] All tests pass
- [ ] Lighthouse score 95+
- [ ] PR created and reviewed

---

### Phase 3: Individual Post Page (Week 3)
**Branch:** `feature/blog-post-page`

**Tasks:**
1. Create `/blog/:slug` dynamic route
2. Create BlogPost.tsx page component
3. Implement MDX rendering with custom components
4. Add Table of Contents component
5. Add reading time display
6. Add social sharing buttons
7. Style post layout (typography, spacing, code blocks)
8. Add 404 handling for invalid slugs
9. Write component and E2E tests

**Commits:**
- `feat(blog): create dynamic post route /blog/:slug`
- `feat(blog): implement BlogPost page component`
- `feat(blog): add MDX rendering with custom components`
- `feat(blog): add Table of Contents component`
- `feat(blog): add reading time and metadata display`
- `feat(blog): add social sharing buttons`
- `style(blog): apply typography and layout styles`
- `test(blog): add tests for blog post page`

**Definition of Done:**
- [ ] Individual blog posts render from MDX
- [ ] Table of contents navigates correctly
- [ ] Reading time is accurate
- [ ] Social sharing buttons work
- [ ] Code blocks are readable
- [ ] 404 page for invalid slugs
- [ ] All tests pass
- [ ] Lighthouse score 95+
- [ ] PR created and reviewed

---

### Phase 4: Enhanced Features (Week 4)
**Branch:** `feature/blog-enhancements`

**Tasks:**
1. Integrate Giscus comments (lazy loaded)
2. Add syntax highlighting for code blocks (rehype-prism-plus)
3. Create custom MDX components (Callout, Image)
4. Add copy button to code blocks
5. Add "Related Posts" section
6. Optimize images with lazy loading
7. Add dark mode support for code blocks
8. Write tests for new components

**Commits:**
- `feat(blog): integrate Giscus comments with lazy loading`
- `feat(blog): add syntax highlighting to code blocks`
- `feat(blog): create custom MDX components (Callout, Image)`
- `feat(blog): add copy button to code blocks`
- `feat(blog): add related posts section`
- `perf(blog): optimize images with lazy loading`
- `feat(blog): add dark mode support for code blocks`
- `test(blog): add tests for enhanced features`

**Definition of Done:**
- [ ] Comments load on scroll/interaction
- [ ] Code syntax highlighting works
- [ ] Custom MDX components render
- [ ] Copy code button works
- [ ] Related posts are relevant
- [ ] Images lazy load
- [ ] Dark mode works for code
- [ ] All tests pass
- [ ] Lighthouse score 95+
- [ ] PR created and reviewed

---

### Phase 5: SEO & Discovery (Week 5)
**Branch:** `feature/blog-seo`

**Tasks:**
1. Create RSS feed generator script
2. Update sitemap to include blog posts
3. Implement Article structured data (JSON-LD)
4. Add Open Graph meta tags for posts
5. Generate Twitter Card meta tags
6. Set up analytics tracking for blog
7. Add canonical URLs
8. Create social preview images
9. Test with social media debuggers

**Commits:**
- `feat(blog): add RSS feed generation script`
- `feat(blog): update sitemap with blog posts`
- `feat(blog): add Article structured data (JSON-LD)`
- `feat(blog): add Open Graph and Twitter Card meta tags`
- `feat(blog): configure analytics for blog tracking`
- `feat(blog): add canonical URLs to posts`
- `feat(blog): create social preview images`
- `test(blog): verify SEO with social media debuggers`

**Definition of Done:**
- [ ] RSS feed generates on build
- [ ] Sitemap includes all blog posts
- [ ] Structured data validates
- [ ] Social cards preview correctly
- [ ] Analytics tracks blog views
- [ ] Canonical URLs set
- [ ] All tests pass
- [ ] Lighthouse score 95+
- [ ] PR created and reviewed

---

## 5. Git Workflow

### Branch Naming Convention
```
feature/blog-foundation
feature/blog-listing
feature/blog-post-page
feature/blog-enhancements
feature/blog-seo
```

### Commit Message Format
```
<type>(<scope>): <subject>

Examples:
feat(blog): add MDX processing utilities
fix(blog): resolve frontmatter parsing issue
test(blog): add unit tests for blog listing
perf(blog): optimize image loading
style(blog): improve code block styling
docs(blog): update blog feature plan
```

### PR Template
```markdown
## Description
Brief description of what this PR implements

## Phase
Phase X: [Phase Name]

## Changes
- Change 1
- Change 2
- Change 3

## Testing
- [ ] Unit tests pass
- [ ] E2E tests pass
- [ ] Manual testing complete
- [ ] Lighthouse score 95+

## Screenshots
[If applicable]

## Checklist
- [ ] Code follows project style
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No breaking changes
- [ ] Build succeeds
```

---

## 6. SEO & Performance Considerations

### SEO
- Auto-generate sitemap entries for new posts
- Add canonical URLs
- Implement Article structured data (JSON-LD)
- Generate Open Graph images for each post
- Create RSS feed for subscribers

### Performance
- Static generation of blog posts at build time
- Lazy load comments (Giscus)
- Optimize images (WebP, lazy loading)
- Code split blog routes
- Target: Keep Lighthouse score 95+

---

## 7. Example Blog URLs
```
https://dylanbochman.com/blog
https://dylanbochman.com/blog/incident-management-best-practices
https://dylanbochman.com/blog/tags/sre
https://dylanbochman.com/blog/tags/incident-management
```

---

## 8. Quality Gates

Before merging each phase:
1. ✅ All unit tests pass
2. ✅ All E2E tests pass
3. ✅ TypeScript has no errors
4. ✅ ESLint has no errors
5. ✅ Build succeeds without warnings
6. ✅ Lighthouse score 95+ (Performance, Accessibility, Best Practices, SEO)
7. ✅ Manual testing complete
8. ✅ PR reviewed and approved

---

## 9. Rollback Plan

If issues arise after merging:
1. Revert the problematic PR
2. Fix issues in a new branch
3. Re-test thoroughly
4. Create new PR with fixes

---

## 10. Success Metrics

Post-launch tracking:
- Blog page views (Google Analytics)
- Average reading time
- Comment engagement rate
- Social shares
- RSS subscribers
- Lighthouse score maintenance

---

**Last Updated:** 2026-01-07
**Status:** Planning Complete - Ready for Phase 1 Implementation
