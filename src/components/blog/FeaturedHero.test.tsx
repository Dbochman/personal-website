import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { FeaturedHero } from './FeaturedHero';
import type { BlogPost } from '@/types/blog';

const mockPost: BlogPost = {
  title: 'Featured Post Title',
  slug: 'featured-post',
  date: '2026-01-07',
  author: 'Author',
  description: 'This is the featured post description',
  tags: ['Featured', 'Blog'],
  category: 'Technical',
  featured: true,
  draft: false,
  content: 'Content',
  readingTime: '5 min read',
};

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('FeaturedHero', () => {
  it('renders the post title', () => {
    renderWithRouter(<FeaturedHero post={mockPost} />);
    expect(screen.getByText('Featured Post Title')).toBeInTheDocument();
  });

  it('renders the featured badge', () => {
    renderWithRouter(<FeaturedHero post={mockPost} />);
    // "Featured" appears as both badge and tag, so use getAllByText
    const featuredElements = screen.getAllByText('Featured');
    expect(featuredElements.length).toBeGreaterThanOrEqual(1);
  });

  it('renders the description', () => {
    renderWithRouter(<FeaturedHero post={mockPost} />);
    expect(screen.getByText(mockPost.description)).toBeInTheDocument();
  });

  it('links to the correct post', () => {
    renderWithRouter(<FeaturedHero post={mockPost} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/blog/featured-post');
  });

  describe('analytics', () => {
    beforeEach(() => {
      window.gtag = vi.fn();
    });

    afterEach(() => {
      delete (window as unknown as { gtag?: unknown }).gtag;
    });

    it('fires featured_hero_click event when clicked', () => {
      renderWithRouter(<FeaturedHero post={mockPost} />);

      const link = screen.getByRole('link');
      fireEvent.click(link);

      expect(window.gtag).toHaveBeenCalledWith('event', 'featured_hero_click', {
        event_category: 'engagement',
        event_label: 'featured-post'
      });
    });
  });
});
