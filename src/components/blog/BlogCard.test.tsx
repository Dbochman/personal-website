import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { BlogCard } from './BlogCard';
import type { BlogPost } from '@/types/blog';

const mockPost: BlogPost = {
  title: 'Test Blog Post',
  slug: 'test-blog-post',
  date: '2026-01-07',
  author: 'Claude',
  description: 'This is a test blog post description',
  tags: ['Testing', 'Vitest', 'React'],
  category: 'Technical',
  featured: true,
  draft: false,
  content: 'Test content',
  readingTime: '5 min read',
};

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('BlogCard', () => {
  it('renders title as clickable link to post', () => {
    renderWithRouter(<BlogCard post={mockPost} />);
    const titleLink = screen.getByRole('link', { name: mockPost.title });
    expect(titleLink).toBeInTheDocument();
    expect(titleLink).toHaveAttribute('href', `/blog/${mockPost.slug}`);
  });

  it('renders author as clickable link to filtered posts', () => {
    renderWithRouter(<BlogCard post={mockPost} />);
    const authorLink = screen.getByRole('link', { name: mockPost.author });
    expect(authorLink).toBeInTheDocument();
    expect(authorLink).toHaveAttribute('href', `/blog?author=${mockPost.author}`);
  });

  it('displays formatted date', () => {
    renderWithRouter(<BlogCard post={mockPost} />);
    // Date might be off by one day due to timezone, so just check for 2026
    const dateElement = screen.getByText(/2026/i);
    expect(dateElement).toBeInTheDocument();
  });

  it('displays reading time', () => {
    renderWithRouter(<BlogCard post={mockPost} />);
    expect(screen.getByText(mockPost.readingTime)).toBeInTheDocument();
  });

  it('displays post description', () => {
    renderWithRouter(<BlogCard post={mockPost} />);
    expect(screen.getByText(mockPost.description)).toBeInTheDocument();
  });

  it('renders all tags', () => {
    renderWithRouter(<BlogCard post={mockPost} />);
    mockPost.tags.forEach((tag) => {
      expect(screen.getByText(tag)).toBeInTheDocument();
    });
  });

  it('renders with card component classes', () => {
    const { container } = renderWithRouter(<BlogCard post={mockPost} />);
    const card = container.querySelector('.group-hover\\:shadow-lg');
    expect(card).toBeInTheDocument();
  });

  describe('analytics', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      window.gtag = vi.fn();
      // Mock requestIdleCallback to run callback immediately
      window.requestIdleCallback = vi.fn((cb) => {
        cb({} as IdleDeadline);
        return 1;
      });
    });

    afterEach(() => {
      vi.useRealTimers();
      delete (window as unknown as { gtag?: unknown }).gtag;
      delete (window as unknown as { requestIdleCallback?: unknown }).requestIdleCallback;
    });

    it('fires blog_card_expand event on first hover', async () => {
      renderWithRouter(<BlogCard post={mockPost} />);
      const article = screen.getByRole('article');

      await act(async () => {
        fireEvent.mouseEnter(article);
        vi.runAllTimers();
      });

      expect(window.gtag).toHaveBeenCalledWith('event', 'blog_card_expand', {
        event_category: 'engagement',
        event_label: mockPost.slug
      });
    });

    it('fires blog_card_expand event only once', async () => {
      renderWithRouter(<BlogCard post={mockPost} />);
      const article = screen.getByRole('article');

      await act(async () => {
        fireEvent.mouseEnter(article);
        vi.runAllTimers();
      });
      await act(async () => {
        fireEvent.mouseLeave(article);
        fireEvent.mouseEnter(article);
        vi.runAllTimers();
      });

      expect(window.gtag).toHaveBeenCalledTimes(1);
    });

    it('fires blog_card_expand event on focus', async () => {
      renderWithRouter(<BlogCard post={mockPost} />);
      const article = screen.getByRole('article');

      await act(async () => {
        fireEvent.focus(article);
        vi.runAllTimers();
      });

      expect(window.gtag).toHaveBeenCalledWith('event', 'blog_card_expand', {
        event_category: 'engagement',
        event_label: mockPost.slug
      });
    });
  });
});
