import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import type { BlogPost } from '@/types/blog';

interface FeaturedHeroProps {
  post: BlogPost;
  badgeText?: string;
}

export function FeaturedHero({ post, badgeText = 'Featured' }: FeaturedHeroProps) {
  const handleClick = () => {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'featured_hero_click', {
        event_category: 'engagement',
        event_label: post.slug
      });
    }
  };

  return (
    <article className="relative group h-full">
      <div className="h-full p-6 md:p-8 rounded-lg border border-foreground/10
                      bg-gradient-to-br from-zinc-50 to-zinc-100
                      dark:from-zinc-800/60 dark:to-zinc-900/60
                      transition-all duration-300
                      group-hover:border-primary/50 group-hover:shadow-lg
                      group-focus-within:border-primary/50 group-focus-within:shadow-lg">
        {/* Featured label */}
        <div className="mb-4">
          <Badge variant="secondary" className="text-xs uppercase tracking-wide">
            {badgeText}
          </Badge>
        </div>

        {/* Title with main link */}
        <h2 className="text-2xl md:text-3xl font-bold mb-3
                       group-hover:text-primary group-focus-within:text-primary transition-colors">
          <Link
            to={`/blog/${post.slug}`}
            onClick={handleClick}
            className="after:absolute after:inset-0 after:content-[''] focus:outline-none"
          >
            {post.title}
          </Link>
        </h2>

        {/* Meta */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
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
        </div>

        {/* Description - always visible */}
        <p className="text-muted-foreground mb-4 max-w-3xl">
          {post.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </div>
    </article>
  );
}
