import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { BlogCard } from './BlogCard';
import type { BlogPost } from '@/types/blog';
import { filterPostsBySearch, filterPostsByTag, sortPostsByDate, getAllTags } from '@/lib/mdx';

interface BlogListProps {
  posts: BlogPost[];
}

export function BlogList({ posts }: BlogListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

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

    // Sort: featured posts first, then by date (newest first)
    const sorted = sortPostsByDate(filtered, 'desc');
    const featured = sorted.filter(post => post.featured);
    const nonFeatured = sorted.filter(post => !post.featured);

    return [...featured, ...nonFeatured];
  }, [posts, searchTerm, selectedTag]);

  const handleTagClick = (tag: string) => {
    setSelectedTag(selectedTag === tag ? null : tag);
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
          className="max-w-md"
        />

        {/* Tags Filter */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
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
