import { useState, memo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TagList } from '@/components/blog/TagList';
import { TransitionLink } from '@/hooks/useViewTransition';
import type { BlogPost } from '@/types/blog';
import { trackEventDeferred } from '@/lib/analytics';
import { formatBlogDate } from '@/lib/blog-utils';

interface BlogCardProps {
  post: BlogPost;
}

export const BlogCard = memo(function BlogCard({ post }: BlogCardProps) {
  const [hasBeenHovered, setHasBeenHovered] = useState(false);

  const handleFirstInteraction = () => {
    if (!hasBeenHovered) {
      // Defer analytics to avoid blocking INP
      trackEventDeferred('blog_card_expand', {
        event_category: 'engagement',
        event_label: post.slug,
      });
      setHasBeenHovered(true);
    }
  };

  return (
    <article
      className="relative group"
      onMouseEnter={handleFirstInteraction}
      onFocus={handleFirstInteraction}
    >
      <Card className="transition-all duration-300 bg-card  group-hover:border-primary/50  group-focus-within:border-primary/50 h-full">
        <CardHeader className="pb-3">
          <CardTitle
            className="text-xl group-hover:text-primary group-focus-within:text-primary transition-colors"
            style={{ viewTransitionName: `blog-title-${post.slug}` }}
          >
            {/* Main card link - covers entire card */}
            <TransitionLink
              to={`/blog/${post.slug}`}
              className="after:absolute after:inset-0 after:content-[''] focus:outline-hidden"
            >
              {post.title}
            </TransitionLink>
          </CardTitle>
          <CardDescription className="flex flex-wrap items-center gap-2 text-sm">
            {/* Author link - sits above overlay via z-index */}
            <Link
              to={`/blog?author=${encodeURIComponent(post.author)}`}
              className="relative z-10 hover:text-primary hover:underline transition-colors"
            >
              {post.author}
            </Link>
            <span>•</span>
            <time dateTime={post.date}>
              {formatBlogDate(post.date)}
            </time>
            <span>•</span>
            <span>{post.readingTime}</span>
          </CardDescription>
          {/* Tags - always visible */}
          <div className="pt-2">
            <TagList tags={post.tags} variant="outline" size="sm" />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Description - expands on first hover/focus and stays expanded */}
          <div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {post.description}
            </p>
          </div>
        </CardContent>
      </Card>
    </article>
  );
});
