import { useState, useMemo } from 'react';
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
import type { BlogPost } from '@/types/blog';
import { filterPostsBySearch, filterPostsByTag, sortPostsByDate, sortPostsByReadingTime, getAllTags } from '@/lib/mdx';

type SortOption = 'newest' | 'oldest' | 'longest' | 'shortest';

interface BlogListProps {
  posts: BlogPost[];
}

export function BlogList({ posts }: BlogListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>('newest');

  const allTags = useMemo(() => getAllTags(posts), [posts]);

  const filteredPosts = useMemo(() => {
    let filtered = posts;

    // Filter by search term
    if (searchTerm) {
      filtered = filterPostsBySearch(filtered, searchTerm);
    }

    // Filter by selected tag
    if (selectedTag) {
      filtered = filterPostsByTag(filtered, selectedTag);
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
  }, [posts, searchTerm, selectedTag, sortOption]);

  const handleTagClick = (tag: string) => {
    const newTag = selectedTag === tag ? null : tag;
    setSelectedTag(newTag);
    if (newTag && typeof gtag !== 'undefined') {
      gtag('event', 'tag_filter_click', {
        event_category: 'engagement',
        event_label: newTag
      });
    }
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
                  variant={selectedTag === tag ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-primary/10"
                  onClick={() => handleTagClick(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Sort:</span>
            <Select value={sortOption} onValueChange={(value: SortOption) => setSortOption(value)}>
              <SelectTrigger className="w-[150px]">
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
          {(searchTerm || selectedTag) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedTag(null);
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
