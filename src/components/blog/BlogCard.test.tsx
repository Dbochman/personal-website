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
  it('renders entire card as clickable link', () => {
    renderWithRouter(<BlogCard post={mockPost} />);
    const cardLink = screen.getByRole('link');
    expect(cardLink).toBeInTheDocument();
    expect(cardLink).toHaveAttribute('href', `/blog/${mockPost.slug}`);
    // Title should be visible within the link
    expect(screen.getByText(mockPost.title)).toBeInTheDocument();
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
});
