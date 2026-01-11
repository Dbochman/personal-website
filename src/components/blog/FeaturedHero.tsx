import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import type { BlogPost } from '@/types/blog';

interface FeaturedHeroProps {
  post: BlogPost;
}

export function FeaturedHero({ post }: FeaturedHeroProps) {
  return (
    <Link to={`/blog/${post.slug}`} className="block group focus:outline-none h-full">
      <article className="h-full p-6 md:p-8 rounded-lg border border-foreground/10
                          bg-gradient-to-br from-zinc-50 to-zinc-100
                          dark:from-zinc-800/60 dark:to-zinc-900/60
                          transition-all duration-300
                          group-hover:border-primary/50 group-hover:shadow-lg
                          group-focus:border-primary/50 group-focus:shadow-lg">
        {/* Featured label */}
        <div className="mb-4">
          <Badge variant="secondary" className="text-xs uppercase tracking-wide">
            Featured
          </Badge>
        </div>

        {/* Title */}
        <h2 className="text-2xl md:text-3xl font-bold mb-3
                       group-hover:text-primary group-focus:text-primary transition-colors">
          {post.title}
        </h2>

        {/* Meta */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
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
      </article>
    </Link>
  );
}
