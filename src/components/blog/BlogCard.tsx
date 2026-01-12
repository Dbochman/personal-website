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

  const handleFirstInteraction = () => {
    if (!hasBeenHovered) {
      if (typeof gtag !== 'undefined') {
        gtag('event', 'blog_card_expand', {
          event_category: 'engagement',
          event_label: post.slug
        });
      }
      setHasBeenHovered(true);
    }
  };

  return (
    <article
      className="relative group"
      onMouseEnter={handleFirstInteraction}
      onFocus={handleFirstInteraction}
    >
      <Card className="transition-all duration-300 bg-zinc-50 dark:bg-zinc-800/40 group-hover:shadow-lg group-hover:border-primary/50 group-focus-within:shadow-lg group-focus-within:border-primary/50 h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl group-hover:text-primary group-focus-within:text-primary transition-colors">
            {/* Main card link - covers entire card */}
            <Link
              to={`/blog/${post.slug}`}
              className="after:absolute after:inset-0 focus:outline-none"
            >
              {post.title}
            </Link>
          </CardTitle>
          <CardDescription className="flex items-center gap-2 text-sm">
            {/* Author link - sits above overlay via z-index */}
            <Link
              to={`/blog?author=${post.author}`}
              className="relative z-10 hover:text-primary hover:underline transition-colors"
            >
              {post.author}
            </Link>
            <span>•</span>
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
    </article>
  );
}
