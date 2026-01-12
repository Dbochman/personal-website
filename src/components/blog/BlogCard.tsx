import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { BlogPost } from '@/types/blog';

interface BlogCardProps {
  post: BlogPost;
}

export function BlogCard({ post }: BlogCardProps) {
  const [hasBeenHovered, setHasBeenHovered] = useState(false);
  const navigate = useNavigate();

  const handleAuthorClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/blog?author=${post.author}`);
  };

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
    <Link
      to={`/blog/${post.slug}`}
      className="block group focus:outline-none"
      onMouseEnter={handleFirstInteraction}
      onFocus={handleFirstInteraction}
    >
      <Card className="transition-all duration-300 bg-zinc-50 dark:bg-zinc-800/40 group-hover:shadow-lg group-hover:border-primary/50 group-focus:shadow-lg group-focus:border-primary/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl group-hover:text-primary group-focus:text-primary transition-colors">
            {post.title}
          </CardTitle>
          <CardDescription className="flex items-center gap-2 text-sm">
            <button
              onClick={handleAuthorClick}
              className="hover:text-primary hover:underline transition-colors"
            >
              {post.author}
            </button>
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
    </Link>
  );
}
