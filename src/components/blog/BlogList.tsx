import { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { badgeVariants } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { readBlogFilters, type BlogSortOption } from '@/lib/blog-filters';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BlogCard } from './BlogCard';
import { BLOG_AUTHORS, type BlogPost, type BlogAuthor } from '@/types/blog';
import { filterPostsBySearch, filterPostsByTags, sortPostsByDate, sortPostsByReadingTime, getAllTags } from '@/lib/blog-utils';
import { staggerContainer, staggerItem } from '@/lib/motion';
import { trackEventDeferred } from '@/lib/analytics';

interface BlogListProps {
  posts: BlogPost[];
  featuredSlug?: string;
}

export function BlogList({ posts, featuredSlug }: BlogListProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { search: searchTerm, tags: selectedTags, author: selectedAuthor, sort: sortOption, active } =
    useMemo(() => readBlogFilters(searchParams), [searchParams]);
  // Keep keystrokes synchronous while the router transitions to the new URL.
  const [searchDraft, setSearchDraft] = useState(searchTerm);
  useEffect(() => setSearchDraft(searchTerm), [searchTerm]);
  const [hasInteracted, setHasInteracted] = useState(false);
  const pendingTagRef = useRef<string | null>(null);

  // Read the current URL at the event boundary: a prior navigation (or the theme
  // toggle) may have updated history before React commits the next render.
  const updateFilter = (key: string, values: string[], replace = false) => {
    setHasInteracted(true);
    const next = new URLSearchParams(window.location.search);
    next.delete(key);
    values.forEach(value => next.append(key, value));
    setSearchParams(next, { replace });
  };

  const handleAuthorChange = (value: BlogAuthor | 'all') => {
    updateFilter('author', value === 'all' ? [] : [value]);
  };

  const clearFilters = () => {
    setHasInteracted(true);
    const next = new URLSearchParams(window.location.search);
    ['q', 'tag', 'author', 'sort'].forEach(key => next.delete(key));
    setSearchParams(next);
  };

  const allTags = useMemo(() => getAllTags(posts), [posts]);

  const filteredPosts = useMemo(() => {
    // Only omit the featured article while it is shown in the separate hero.
    let filtered = !active && featuredSlug
      ? posts.filter(post => post.slug !== featuredSlug)
      : posts;

    // Filter by search term
    if (searchTerm) {
      filtered = filterPostsBySearch(filtered, searchTerm);
    }

    // Filter by selected tags (OR logic)
    if (selectedTags.length > 0) {
      filtered = filterPostsByTags(filtered, selectedTags);
    }

    // Filter by author
    if (selectedAuthor !== 'all') {
      filtered = filtered.filter(post => post.author === selectedAuthor);
    }

    // Apply sort based on selected option
    switch (sortOption) {
      case 'oldest':
        return sortPostsByDate(filtered, 'asc');
      case 'longest':
        return sortPostsByReadingTime(filtered, 'desc');
      case 'shortest':
        return sortPostsByReadingTime(filtered, 'asc');
      case 'newest':
      default:
        return sortPostsByDate(filtered, 'desc');
    }
  }, [posts, featuredSlug, active, searchTerm, selectedTags, selectedAuthor, sortOption]);

  const handleTagClick = (tag: string) => {
    const currentTags = new URLSearchParams(window.location.search).getAll('tag');
    const isSelected = currentTags.includes(tag);
    if (!isSelected) pendingTagRef.current = tag;
    updateFilter('tag', isSelected ? currentTags.filter(value => value !== tag) : [...currentTags, tag]);
  };

  // Fire deferred analytics after state update completes
  useEffect(() => {
    if (pendingTagRef.current) {
      trackEventDeferred('tag_filter_click', {
        event_category: 'engagement',
        event_label: pendingTagRef.current,
      });
      pendingTagRef.current = null;
    }
  }, [selectedTags]);

  const handleSearchBlur = () => {
    if (searchTerm) {
      trackEventDeferred('blog_search', {
        event_category: 'engagement',
        event_label: searchTerm,
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* Search and Filter Section */}
      <div className="space-y-4">
        <Input
          type="search"
          placeholder="Search posts..."
          aria-label="Search posts"
          value={searchDraft}
          onChange={(e) => {
            setSearchDraft(e.target.value);
            updateFilter('q', e.target.value ? [e.target.value] : [], true);
          }}
          onBlur={handleSearchBlur}
          className="max-w-md"
        />

        {/* Tags Filter and Sort */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          {allTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Filter by tag:</span>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  aria-pressed={selectedTags.includes(tag)}
                  className={cn(
                    badgeVariants({ variant: selectedTags.includes(tag) ? 'default' : 'outline' }),
                    'min-h-8 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                  )}
                  onClick={() => handleTagClick(tag)}
                >
                  {tag}
                </button>
              ))}
              {selectedTags.length > 0 && (
                <button
                  onClick={() => updateFilter('tag', [])}
                  className="text-sm text-muted-foreground hover:text-foreground ml-2"
                >
                  Clear
                </button>
              )}
            </div>
          )}

          {/* Author Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Author:</span>
            <Select value={selectedAuthor} onValueChange={handleAuthorChange}>
              <SelectTrigger className="w-[120px]" aria-label="Filter by author">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {BLOG_AUTHORS.map(author => <SelectItem key={author} value={author}>{author}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Sort:</span>
            <Select value={sortOption} onValueChange={(value: BlogSortOption) => updateFilter('sort', value === 'newest' ? [] : [value])}>
              <SelectTrigger className="w-[150px]" aria-label="Sort posts by">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="longest">Longest First</SelectItem>
                <SelectItem value="shortest">Shortest First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Screen reader announcement for search results (only after user interaction) */}
      <div role="status" aria-live="polite" className="sr-only">
        {hasInteracted && `${filteredPosts.length} ${filteredPosts.length === 1 ? 'post' : 'posts'} found`}
      </div>

      {/* Posts Grid */}
      {filteredPosts.length > 0 ? (
        <motion.div
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          key={`${searchTerm}-${selectedTags.join(',')}-${selectedAuthor}-${sortOption}`}
        >
          {filteredPosts.map((post) => (
            <motion.div key={post.slug} variants={staggerItem}>
              <BlogCard post={post} />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="text-center py-12" role="status">
          <p className="text-muted-foreground">
            No posts found matching your criteria.
          </p>
          {active && (
            <button
              onClick={clearFilters}
              className="mt-2 text-sm text-primary hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
