import { describe, it, expect } from 'vitest';
import {
  parseMDX,
  calculateReadingTime,
  formatDate,
  createBlogPost,
  sortPostsByDate,
  filterPostsByTag,
  filterPostsBySearch,
  getAllTags,
  getAllCategories,
  filterDraftPosts,
} from './mdx';
import type { BlogPost } from '@/types/blog';

describe('MDX Utilities', () => {
  const sampleMDX = `---
title: "Test Post"
slug: "test-post"
date: "2026-01-07"
author: "Test Author"
description: "A test blog post"
tags: ["testing", "mdx"]
category: "Technical"
draft: false
---

# Test Content

This is a test blog post with some **bold** and *italic* text.

\`\`\`typescript
const test = "code block";
\`\`\`
`;

  describe('parseMDX', () => {
    it('should extract frontmatter and content', () => {
      const result = parseMDX(sampleMDX);

      expect(result.frontmatter.title).toBe('Test Post');
      expect(result.frontmatter.slug).toBe('test-post');
      expect(result.frontmatter.tags).toEqual(['testing', 'mdx']);
      expect(result.content).toContain('# Test Content');
    });

    it('should handle posts without frontmatter', () => {
      const content = '# Just Content\n\nNo frontmatter here.';
      const result = parseMDX(content);

      expect(result.content).toContain('# Just Content');
    });
  });

  describe('calculateReadingTime', () => {
    it('should calculate reading time', () => {
      const content = 'word '.repeat(200); // 200 words
      const result = calculateReadingTime(content);

      expect(result.minutes).toBeGreaterThan(0);
      expect(result.text).toContain('min');
      expect(result.words).toBe(200);
    });

    it('should handle short content', () => {
      const content = 'Just a few words';
      const result = calculateReadingTime(content);

      expect(result.minutes).toBeGreaterThanOrEqual(0);
    });
  });

  describe('formatDate', () => {
    it('should format date with default format', () => {
      const result = formatDate('2026-01-07T12:00:00Z'); // Use full ISO string
      expect(result).toContain('2026'); // Just verify year to avoid timezone issues
    });

    it('should format date with custom format', () => {
      const result = formatDate('2026-01-07T12:00:00Z', 'yyyy');
      expect(result).toBe('2026');
    });
  });

  describe('createBlogPost', () => {
    it('should create complete blog post object', () => {
      const post = createBlogPost(sampleMDX);

      expect(post.title).toBe('Test Post');
      expect(post.slug).toBe('test-post');
      expect(post.content).toContain('# Test Content');
      expect(post.readingTime).toBeTruthy();
      expect(post.readingTime).toContain('min');
    });

    it('should use frontmatter slug over fallback', () => {
      // Frontmatter slug is authoritative; fallback only used when frontmatter has no slug
      const post = createBlogPost(sampleMDX, 'fallback-slug');
      expect(post.slug).toBe('test-post'); // Uses frontmatter slug, not fallback
    });

    it('should use fallback slug when frontmatter has no slug', () => {
      const mdxWithoutSlug = `---
title: "No Slug Post"
date: "2025-01-15"
author: "Test Author"
description: "A post without a slug"
tags: ["test"]
draft: false
---

# Content
`;
      const post = createBlogPost(mdxWithoutSlug, 'filename-derived-slug');
      expect(post.slug).toBe('filename-derived-slug');
    });
  });

  describe('sortPostsByDate', () => {
    const posts: BlogPost[] = [
      createBlogPost(`---
title: "Old Post"
slug: "old"
date: "2025-01-01"
author: "Test"
description: "Old"
tags: []
draft: false
---
Content`),
      createBlogPost(`---
title: "New Post"
slug: "new"
date: "2026-01-07"
author: "Test"
description: "New"
tags: []
draft: false
---
Content`),
    ];

    it('should sort by date descending by default', () => {
      const sorted = sortPostsByDate(posts);
      expect(sorted[0].title).toBe('New Post');
      expect(sorted[1].title).toBe('Old Post');
    });

    it('should sort by date ascending when specified', () => {
      const sorted = sortPostsByDate(posts, 'asc');
      expect(sorted[0].title).toBe('Old Post');
      expect(sorted[1].title).toBe('New Post');
    });
  });

  describe('filterPostsByTag', () => {
    const posts: BlogPost[] = [
      createBlogPost(`---
title: "SRE Post"
slug: "sre"
date: "2026-01-07"
author: "Test"
description: "SRE content"
tags: ["SRE", "DevOps"]
draft: false
---
Content`),
      createBlogPost(`---
title: "Security Post"
slug: "security"
date: "2026-01-07"
author: "Test"
description: "Security content"
tags: ["Security", "DevOps"]
draft: false
---
Content`),
    ];

    it('should filter posts by tag', () => {
      const filtered = filterPostsByTag(posts, 'SRE');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].title).toBe('SRE Post');
    });

    it('should return posts with common tag', () => {
      const filtered = filterPostsByTag(posts, 'DevOps');
      expect(filtered).toHaveLength(2);
    });
  });

  describe('filterPostsBySearch', () => {
    const posts: BlogPost[] = [
      createBlogPost(`---
title: "Incident Management Guide"
slug: "incident"
date: "2026-01-07"
author: "Test"
description: "How to manage incidents"
tags: ["SRE"]
draft: false
---
Content`),
      createBlogPost(`---
title: "Monitoring Best Practices"
slug: "monitoring"
date: "2026-01-07"
author: "Test"
description: "Monitor your services"
tags: ["Observability"]
draft: false
---
Content`),
    ];

    it('should filter by title', () => {
      const filtered = filterPostsBySearch(posts, 'incident');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].title).toContain('Incident');
    });

    it('should filter by description', () => {
      const filtered = filterPostsBySearch(posts, 'monitor');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].description).toContain('Monitor');
    });

    it('should be case insensitive', () => {
      const filtered = filterPostsBySearch(posts, 'INCIDENT');
      expect(filtered).toHaveLength(1);
    });
  });

  describe('getAllTags', () => {
    const posts: BlogPost[] = [
      createBlogPost(`---
title: "Post 1"
slug: "p1"
date: "2026-01-07"
author: "Test"
description: "Test"
tags: ["SRE", "DevOps"]
draft: false
---
Content`),
      createBlogPost(`---
title: "Post 2"
slug: "p2"
date: "2026-01-07"
author: "Test"
description: "Test"
tags: ["DevOps", "Security"]
draft: false
---
Content`),
    ];

    it('should get all unique tags sorted', () => {
      const tags = getAllTags(posts);
      expect(tags).toEqual(['DevOps', 'SRE', 'Security']);
    });
  });

  describe('getAllCategories', () => {
    const posts: BlogPost[] = [
      createBlogPost(`---
title: "Post 1"
slug: "p1"
date: "2026-01-07"
author: "Test"
description: "Test"
tags: []
category: "Technical"
draft: false
---
Content`),
      createBlogPost(`---
title: "Post 2"
slug: "p2"
date: "2026-01-07"
author: "Test"
description: "Test"
tags: []
category: "Personal"
draft: false
---
Content`),
      createBlogPost(`---
title: "Post 3"
slug: "p3"
date: "2026-01-07"
author: "Test"
description: "Test"
tags: []
draft: false
---
Content`),
    ];

    it('should get all unique categories sorted', () => {
      const categories = getAllCategories(posts);
      expect(categories).toEqual(['Personal', 'Technical']);
    });

    it('should handle posts without categories', () => {
      const categories = getAllCategories(posts);
      expect(categories).not.toContain(undefined);
    });
  });

  describe('filterDraftPosts', () => {
    const posts: BlogPost[] = [
      createBlogPost(`---
title: "Published"
slug: "published"
date: "2026-01-07"
author: "Test"
description: "Test"
tags: []
draft: false
---
Content`),
      createBlogPost(`---
title: "Draft"
slug: "draft"
date: "2026-01-07"
author: "Test"
description: "Test"
tags: []
draft: true
---
Content`),
    ];

    it('should keep drafts in development', () => {
      // In test mode, should keep all posts
      const filtered = filterDraftPosts(posts);
      expect(filtered).toHaveLength(2);
    });
  });
});
