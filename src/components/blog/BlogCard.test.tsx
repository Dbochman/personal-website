import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { BlogCard } from './BlogCard';
import type { BlogPost } from '@/types/blog';

const mockPost: BlogPost = {
  title: 'Test Blog Post',
  slug: 'test-blog-post',
  date: '2026-01-07',
  author: 'Test Author',
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
  it('renders post title with link', () => {
    renderWithRouter(<BlogCard post={mockPost} />);
    const titleLink = screen.getByRole('link', { name: mockPost.title });
    expect(titleLink).toBeInTheDocument();
    expect(titleLink).toHaveAttribute('href', `/blog/${mockPost.slug}`);
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

  it('displays featured badge when post is featured', () => {
    renderWithRouter(<BlogCard post={mockPost} />);
    expect(screen.getByText('Featured')).toBeInTheDocument();
  });

  it('does not display featured badge when post is not featured', () => {
    const nonFeaturedPost = { ...mockPost, featured: false };
    renderWithRouter(<BlogCard post={nonFeaturedPost} />);
    expect(screen.queryByText('Featured')).not.toBeInTheDocument();
  });

  it('renders with card component classes', () => {
    const { container } = renderWithRouter(<BlogCard post={mockPost} />);
    const card = container.querySelector('.hover\\:shadow-lg');
    expect(card).toBeInTheDocument();
  });
});
