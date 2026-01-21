import { useState, memo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TagList } from '@/components/blog/TagList';
import { TransitionLink } from '@/hooks/useViewTransition';
import type { BlogPost } from '@/types/blog';

interface BlogCardProps {
  post: BlogPost;
}

export const BlogCard = memo(function BlogCard({ post }: BlogCardProps) {
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
          <div className="pt-2">
            <TagList tags={post.tags} variant="outline" size="sm" />
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
}, (prevProps, nextProps) => prevProps.post.slug === nextProps.post.slug)
