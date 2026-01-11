import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { RelatedPosts } from './RelatedPosts';
import type { BlogPost } from '@/types/blog';

const currentPost: BlogPost = {
  title: 'Current Post',
  slug: 'current-post',
  date: '2026-01-07',
  author: 'Author',
  description: 'Current post description',
  tags: ['React', 'TypeScript'],
  category: 'Technical',
  featured: false,
  draft: false,
  content: 'Content',
  readingTime: '5 min read',
};

const allPosts: BlogPost[] = [
  currentPost,
  {
    title: 'Related Post 1',
    slug: 'related-post-1',
    date: '2026-01-06',
    author: 'Author',
    description: 'Related post with React tag',
    tags: ['React', 'Testing'],
    category: 'Technical',
    featured: false,
    draft: false,
    content: 'Content',
    readingTime: '3 min read',
  },
  {
    title: 'Unrelated Post',
    slug: 'unrelated-post',
    date: '2026-01-05',
    author: 'Author',
    description: 'No shared tags',
    tags: ['DevOps', 'SRE'],
    category: 'Technical',
    featured: false,
    draft: false,
    content: 'Content',
    readingTime: '4 min read',
  },
];

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('RelatedPosts', () => {
  it('renders related posts with shared tags', () => {
    renderWithRouter(<RelatedPosts currentPost={currentPost} allPosts={allPosts} />);
    expect(screen.getByText('Related Post 1')).toBeInTheDocument();
    expect(screen.queryByText('Unrelated Post')).not.toBeInTheDocument();
  });

  it('renders nothing when no related posts', () => {
    const noRelatedPosts = [currentPost, allPosts[2]]; // Only unrelated post
    const { container } = renderWithRouter(
      <RelatedPosts currentPost={currentPost} allPosts={noRelatedPosts} />
    );
    expect(container.firstChild).toBeNull();
  });

  describe('analytics', () => {
    beforeEach(() => {
      window.gtag = vi.fn();
    });

    afterEach(() => {
      delete (window as unknown as { gtag?: unknown }).gtag;
    });

    it('fires related_post_click event when related post is clicked', () => {
      renderWithRouter(<RelatedPosts currentPost={currentPost} allPosts={allPosts} />);

      const relatedPostLink = screen.getByText('Related Post 1').closest('a');
      if (relatedPostLink) {
        fireEvent.click(relatedPostLink);

        expect(window.gtag).toHaveBeenCalledWith('event', 'related_post_click', {
          event_category: 'engagement',
          event_label: 'related-post-1'
        });
      }
    });
  });
});
