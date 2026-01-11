import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { BlogPost } from '@/types/blog';

interface BlogCardProps {
  post: BlogPost;
}

export function BlogCard({ post }: BlogCardProps) {
  const [hasBeenHovered, setHasBeenHovered] = useState(false);

  return (
    <Link
      to={`/blog/${post.slug}`}
      className="block group focus:outline-none"
      onMouseEnter={() => setHasBeenHovered(true)}
      onFocus={() => setHasBeenHovered(true)}
    >
      <Card className="transition-all duration-300 bg-zinc-50 dark:bg-zinc-800/40 group-hover:shadow-lg group-hover:border-primary/50 group-focus:shadow-lg group-focus:border-primary/50">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-xl group-hover:text-primary group-focus:text-primary transition-colors">
              {post.title}
            </CardTitle>
            {post.featured && (
              <Badge variant="secondary" className="shrink-0">
                Featured
              </Badge>
            )}
          </div>
          <CardDescription className="flex items-center gap-2 text-sm">
            <time dateTime={post.date}>
              {new Date(post.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
            <span>•</span>
            <span>{post.readingTime}</span>
          </CardDescription>
          {/* Tags - always visible */}
          <div className="flex flex-wrap gap-1.5 pt-2">
            {post.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Description - expands on first hover/focus and stays expanded */}
          <div className={`overflow-hidden transition-all duration-300 ease-out motion-reduce:transition-none
                          ${hasBeenHovered ? 'max-h-24 opacity-100' : 'max-h-24 opacity-100 [@media(hover:hover)]:max-h-0 [@media(hover:hover)]:opacity-0'}`}>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {post.description}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
