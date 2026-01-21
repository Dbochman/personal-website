import { describe, it, expect } from 'vitest';
import { blogFrontmatterSchema } from './schema';

describe('blogFrontmatterSchema', () => {
  it('validates valid frontmatter with string date', () => {
    const valid = {
      title: 'Test Post',
      date: '2025-01-15',
      description: 'A test post',
      tags: ['test', 'example'],
      author: 'Dylan',
      draft: false,
    };

    const result = blogFrontmatterSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.date).toBe('2025-01-15');
    }
  });

  it('converts Date objects to YYYY-MM-DD strings', () => {
    const withDateObject = {
      title: 'Test Post',
      date: new Date('2025-01-15'),
      description: 'A test post',
      tags: ['test'],
      author: 'Claude',
      draft: false,
    };

    const result = blogFrontmatterSchema.safeParse(withDateObject);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.date).toBe('2025-01-15');
    }
  });

  it('accepts all valid author values', () => {
    const basePost = {
      title: 'Test',
      date: '2025-01-15',
      description: 'Test',
      tags: [],
      draft: false,
    };

    const authors = ['Dylan', 'Claude', 'Dylan & Claude'] as const;
    for (const author of authors) {
      const result = blogFrontmatterSchema.safeParse({ ...basePost, author });
      expect(result.success, `Author "${author}" should be valid`).toBe(true);
    }
  });

  it('rejects invalid author values', () => {
    const invalid = {
      title: 'Test',
      date: '2025-01-15',
      description: 'Test',
      tags: [],
      author: 'InvalidAuthor',
      draft: false,
    };

    const result = blogFrontmatterSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('applies default values for optional fields', () => {
    const minimal = {
      title: 'Test Post',
      date: '2025-01-15',
      description: 'A test post',
      author: 'Dylan',
    };

    const result = blogFrontmatterSchema.safeParse(minimal);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.draft).toBe(false);
      expect(result.data.featured).toBe(false);
      expect(result.data.category).toBe('General');
      expect(result.data.tags).toEqual([]);
    }
  });

  it('rejects missing required fields', () => {
    const missingTitle = {
      date: '2025-01-15',
      description: 'A test post',
      author: 'Dylan',
    };

    const result = blogFrontmatterSchema.safeParse(missingTitle);
    expect(result.success).toBe(false);
  });

  it('rejects invalid date formats', () => {
    const invalidDate = {
      title: 'Test',
      date: 'January 15, 2025', // Wrong format
      description: 'Test',
      tags: [],
      author: 'Dylan',
      draft: false,
    };

    const result = blogFrontmatterSchema.safeParse(invalidDate);
    expect(result.success).toBe(false);
  });

  it('validates optional updated date', () => {
    const withUpdated = {
      title: 'Test Post',
      date: '2025-01-15',
      updated: '2025-01-20',
      description: 'A test post',
      tags: [],
      author: 'Dylan',
      draft: false,
    };

    const result = blogFrontmatterSchema.safeParse(withUpdated);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.updated).toBe('2025-01-20');
    }
  });

  it('converts updated Date objects to strings', () => {
    const withUpdatedDate = {
      title: 'Test Post',
      date: '2025-01-15',
      updated: new Date('2025-01-20'),
      description: 'A test post',
      tags: [],
      author: 'Dylan',
      draft: false,
    };

    const result = blogFrontmatterSchema.safeParse(withUpdatedDate);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.updated).toBe('2025-01-20');
    }
  });
});
