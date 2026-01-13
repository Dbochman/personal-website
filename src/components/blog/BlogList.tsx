import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BlogCard } from './BlogCard';
import type { BlogPost, BlogAuthor } from '@/types/blog';
import { filterPostsBySearch, filterPostsByTags, sortPostsByDate, sortPostsByReadingTime, getAllTags } from '@/lib/blog-utils';

type SortOption = 'newest' | 'oldest' | 'longest' | 'shortest';

interface BlogListProps {
  posts: BlogPost[];
}

export function BlogList({ posts }: BlogListProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedAuthor, setSelectedAuthor] = useState<BlogAuthor | 'all'>('all');
  const [sortOption, setSortOption] = useState<SortOption>('newest');

  // Sync author filter with URL params (handles back/forward navigation)
  useEffect(() => {
    const authorParam = searchParams.get('author');
    if (authorParam === 'Claude' || authorParam === 'Dylan') {
      setSelectedAuthor(authorParam);
    } else {
      setSelectedAuthor('all');
    }
  }, [searchParams]);

  // Update URL when author filter changes
  const handleAuthorChange = (value: BlogAuthor | 'all') => {
    setSelectedAuthor(value);
    if (value === 'all') {
      searchParams.delete('author');
    } else {
      searchParams.set('author', value);
    }
    setSearchParams(searchParams);
  };

  const allTags = useMemo(() => getAllTags(posts), [posts]);

  const filteredPosts = useMemo(() => {
    let filtered = posts;

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
  }, [posts, searchTerm, selectedTags, selectedAuthor, sortOption]);

  const handleTagClick = (tag: string) => {
    setSelectedTags(prev => {
      const isSelected = prev.includes(tag);
      const newTags = isSelected
        ? prev.filter(t => t !== tag)
        : [...prev, tag];

      if (!isSelected && typeof gtag !== 'undefined') {
        gtag('event', 'tag_filter_click', {
          event_category: 'engagement',
          event_label: tag
        });
      }

      return newTags;
    });
  };

  const handleSearchBlur = () => {
    if (searchTerm && typeof gtag !== 'undefined') {
      gtag('event', 'blog_search', {
        event_category: 'engagement',
        event_label: searchTerm
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
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onBlur={handleSearchBlur}
          className="max-w-md"
        />

        {/* Tags Filter and Sort */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          {allTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Filter by tag:</span>
              {allTags.map((tag) => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-primary/10"
                  onClick={() => handleTagClick(tag)}
                >
                  {tag}
                </Badge>
              ))}
              {selectedTags.length > 0 && (
                <button
                  onClick={() => setSelectedTags([])}
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
                <SelectItem value="Claude">Claude</SelectItem>
                <SelectItem value="Dylan">Dylan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Sort:</span>
            <Select value={sortOption} onValueChange={(value: SortOption) => setSortOption(value)}>
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

      {/* Posts Grid */}
      {filteredPosts.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No posts found matching your criteria.
          </p>
          {(searchTerm || selectedTags.length > 0 || selectedAuthor !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedTags([]);
                handleAuthorChange('all');
              }}
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
