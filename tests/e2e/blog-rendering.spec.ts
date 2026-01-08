import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

test.describe('Blog Post Rendering', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a blog post that has all markdown features
    await page.goto(`${BASE_URL}/blog/adventures-in-ai-assisted-web-development`);
    await page.waitForLoadState('networkidle');
  });

  test('should render H2 headings with proper styling', async ({ page }) => {
    const h2Elements = page.locator('article h2');
    const count = await h2Elements.count();

    expect(count).toBeGreaterThan(0);

    // Check first H2 has proper classes and spacing
    const firstH2 = h2Elements.first();
    await expect(firstH2).toBeVisible();

    // Verify H2 has large font size (text-4xl)
    const fontSize = await firstH2.evaluate(el => {
      return window.getComputedStyle(el).fontSize;
    });
    // text-4xl is 36px (2.25rem)
    expect(parseInt(fontSize)).toBeGreaterThanOrEqual(32);

    // Verify H2 has extrabold weight
    const fontWeight = await firstH2.evaluate(el => {
      return window.getComputedStyle(el).fontWeight;
    });
    // extrabold is 800
    expect(parseInt(fontWeight)).toBeGreaterThanOrEqual(700);

    // Verify H2 has bottom border
    const borderBottomWidth = await firstH2.evaluate(el => {
      return window.getComputedStyle(el).borderBottomWidth;
    });
    expect(borderBottomWidth).not.toBe('0px');
  });

  test('should render H2 headings with dramatic vertical spacing', async ({ page }) => {
    const h2Elements = page.locator('article h2');
    const count = await h2Elements.count();

    if (count > 1) {
      // Get the second H2 (not first, since first has first:mt-0)
      const secondH2 = h2Elements.nth(1);

      const marginTop = await secondH2.evaluate(el => {
        return window.getComputedStyle(el).marginTop;
      });

      // mt-32 is 128px (8rem)
      const marginTopPx = parseInt(marginTop);
      expect(marginTopPx).toBeGreaterThanOrEqual(120); // Allow some variance
    }
  });

  test('should render paragraphs with proper spacing', async ({ page }) => {
    const paragraphs = page.locator('article p');
    const count = await paragraphs.count();

    expect(count).toBeGreaterThan(0);

    const firstParagraph = paragraphs.first();

    // Verify text-xl font size (20px)
    const fontSize = await firstParagraph.evaluate(el => {
      return window.getComputedStyle(el).fontSize;
    });
    expect(parseInt(fontSize)).toBeGreaterThanOrEqual(18);

    // Verify leading-loose line height (2.0)
    const lineHeight = await firstParagraph.evaluate(el => {
      return window.getComputedStyle(el).lineHeight;
    });
    const lineHeightRatio = parseFloat(lineHeight) / parseFloat(fontSize);
    expect(lineHeightRatio).toBeGreaterThanOrEqual(1.8);

    // Verify mb-8 bottom margin (32px)
    const marginBottom = await firstParagraph.evaluate(el => {
      return window.getComputedStyle(el).marginBottom;
    });
    expect(parseInt(marginBottom)).toBeGreaterThanOrEqual(28);
  });

  test('should render bold text correctly', async ({ page }) => {
    const strongElements = page.locator('article strong');
    const count = await strongElements.count();

    expect(count).toBeGreaterThan(0);

    const firstStrong = strongElements.first();
    await expect(firstStrong).toBeVisible();

    // Verify bold font weight
    const fontWeight = await firstStrong.evaluate(el => {
      return window.getComputedStyle(el).fontWeight;
    });
    expect(parseInt(fontWeight)).toBeGreaterThanOrEqual(700);
  });

  test('should render italic text correctly', async ({ page }) => {
    const emElements = page.locator('article em');
    const count = await emElements.count();

    if (count > 0) {
      const firstEm = emElements.first();
      await expect(firstEm).toBeVisible();

      const fontStyle = await firstEm.evaluate(el => {
        return window.getComputedStyle(el).fontStyle;
      });
      expect(fontStyle).toBe('italic');
    }
  });

  test('should render links with underlines', async ({ page }) => {
    const links = page.locator('article a');
    const count = await links.count();

    expect(count).toBeGreaterThan(0);

    const firstLink = links.first();
    await expect(firstLink).toBeVisible();

    // Verify link has underline
    const textDecoration = await firstLink.evaluate(el => {
      return window.getComputedStyle(el).textDecorationLine;
    });
    expect(textDecoration).toContain('underline');

    // Verify link opens in new tab if external
    const href = await firstLink.getAttribute('href');
    if (href?.startsWith('http')) {
      const target = await firstLink.getAttribute('target');
      expect(target).toBe('_blank');

      const rel = await firstLink.getAttribute('rel');
      expect(rel).toContain('noopener');
      expect(rel).toContain('noreferrer');
    }
  });

  test('should render unordered lists with proper styling', async ({ page }) => {
    const lists = page.locator('article ul');
    const count = await lists.count();

    if (count > 0) {
      const firstList = lists.first();
      await expect(firstList).toBeVisible();

      // Verify list has disc markers
      const listStyleType = await firstList.evaluate(el => {
        return window.getComputedStyle(el).listStyleType;
      });
      expect(listStyleType).toBe('disc');

      // Check list items
      const listItems = firstList.locator('li');
      const itemCount = await listItems.count();
      expect(itemCount).toBeGreaterThan(0);

      // Verify list item font size
      const firstItem = listItems.first();
      const fontSize = await firstItem.evaluate(el => {
        return window.getComputedStyle(el).fontSize;
      });
      expect(parseInt(fontSize)).toBeGreaterThanOrEqual(18);
    }
  });

  test('should render code blocks with proper styling', async ({ page }) => {
    const codeBlocks = page.locator('article pre');
    const count = await codeBlocks.count();

    if (count > 0) {
      const firstCodeBlock = codeBlocks.first();
      await expect(firstCodeBlock).toBeVisible();

      // Verify code block has background
      const backgroundColor = await firstCodeBlock.evaluate(el => {
        return window.getComputedStyle(el).backgroundColor;
      });
      expect(backgroundColor).not.toBe('rgba(0, 0, 0, 0)');

      // Verify code block has padding
      const padding = await firstCodeBlock.evaluate(el => {
        return window.getComputedStyle(el).padding;
      });
      expect(padding).not.toBe('0px');

      // Verify code block has rounded corners
      const borderRadius = await firstCodeBlock.evaluate(el => {
        return window.getComputedStyle(el).borderRadius;
      });
      expect(borderRadius).not.toBe('0px');
    }
  });

  test('should render inline code with proper styling', async ({ page }) => {
    // Look for inline code (code not inside pre)
    const inlineCode = page.locator('article p code, article li code');
    const count = await inlineCode.count();

    if (count > 0) {
      const firstInlineCode = inlineCode.first();
      await expect(firstInlineCode).toBeVisible();

      // Verify monospace font
      const fontFamily = await firstInlineCode.evaluate(el => {
        return window.getComputedStyle(el).fontFamily;
      });
      expect(fontFamily.toLowerCase()).toContain('mono');

      // Verify has background
      const backgroundColor = await firstInlineCode.evaluate(el => {
        return window.getComputedStyle(el).backgroundColor;
      });
      expect(backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    }
  });

  test('should have proper article structure', async ({ page }) => {
    // Verify article element exists
    const article = page.locator('article');
    await expect(article).toBeVisible();

    // Verify article has prose classes
    const articleClass = await article.getAttribute('class');
    expect(articleClass).toContain('prose');
    expect(articleClass).toContain('prose-xl');
  });

  test('should display blog post metadata', async ({ page }) => {
    // Check for date display
    const dateElement = page.locator('time[datetime]');
    await expect(dateElement).toBeVisible();

    // Check for reading time
    const readingTime = page.getByText(/\d+ min read/);
    await expect(readingTime).toBeVisible();

    // Check for tags
    const tags = page.locator('[data-testid="blog-tag"], .badge, header .inline-flex');
    const tagCount = await tags.count();
    expect(tagCount).toBeGreaterThan(0);
  });

  test('should render blog post title', async ({ page }) => {
    const title = page.locator('header h1');
    await expect(title).toBeVisible();
    await expect(title).toContainText('Adventures in AI-Assisted Web Development');

    // Verify large font size
    const fontSize = await title.evaluate(el => {
      return window.getComputedStyle(el).fontSize;
    });
    expect(parseInt(fontSize)).toBeGreaterThanOrEqual(36);
  });

  test('should render description', async ({ page }) => {
    const description = page.locator('header p.text-xl, header p').first();
    await expect(description).toBeVisible();
  });

  test('should have back to blog link', async ({ page }) => {
    const backLink = page.getByRole('link', { name: /back to blog/i });
    await expect(backLink).toBeVisible();

    await backLink.click();
    await page.waitForURL(/\/blog$/);
    expect(page.url()).toContain('/blog');
  });

  test('should verify specific markdown content renders', async ({ page }) => {
    // Test that specific content from the markdown is visible
    await expect(page.getByText('The Lovable Phase')).toBeVisible();
    await expect(page.getByText('Enter Claude Code')).toBeVisible();
    await expect(page.getByText('What Stuck With Me')).toBeVisible();

    // Verify bold text is rendered as bold
    const boldText = page.locator('strong:has-text("Lovable is great for the fuzzy stuff")');
    if (await boldText.count() > 0) {
      await expect(boldText).toBeVisible();
      const fontWeight = await boldText.evaluate(el => {
        return window.getComputedStyle(el).fontWeight;
      });
      expect(parseInt(fontWeight)).toBeGreaterThanOrEqual(700);
    }
  });

  test('should verify heading hierarchy and spacing', async ({ page }) => {
    // Get all H2 headings
    const h2Headings = page.locator('article h2');
    const h2Count = await h2Headings.count();

    if (h2Count >= 2) {
      // Measure distance between two consecutive sections
      const firstH2 = h2Headings.nth(0);
      const secondH2 = h2Headings.nth(1);

      const firstBox = await firstH2.boundingBox();
      const secondBox = await secondH2.boundingBox();

      if (firstBox && secondBox) {
        const verticalDistance = secondBox.y - (firstBox.y + firstBox.height);

        // Should have significant spacing (at least 80px between sections)
        expect(verticalDistance).toBeGreaterThan(80);
      }
    }
  });
});

test.describe('Multiple Blog Posts Rendering', () => {
  const blogPosts = [
    'adventures-in-ai-assisted-web-development',
    'writing-a-runbook-for-my-personal-website',
  ];

  for (const slug of blogPosts) {
    test(`should render ${slug} without errors`, async ({ page }) => {
      await page.goto(`${BASE_URL}/blog/${slug}`);
      await page.waitForLoadState('networkidle');

      // Verify no error message
      await expect(page.getByText(/post not found|error/i)).not.toBeVisible();

      // Verify article content exists
      const article = page.locator('article');
      await expect(article).toBeVisible();

      // Verify has paragraphs
      const paragraphs = page.locator('article p');
      const count = await paragraphs.count();
      expect(count).toBeGreaterThan(0);

      // Verify has headings
      const headings = page.locator('article h2, article h3');
      const headingCount = await headings.count();
      expect(headingCount).toBeGreaterThan(0);
    });
  }
});
