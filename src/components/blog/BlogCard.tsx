import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { BlogPost } from '@/types/blog';

interface BlogCardProps {
  post: BlogPost;
}

export function BlogCard({ post }: BlogCardProps) {
  return (
    <Link to={`/blog/${post.slug}`} className="block h-full group">
      <Card className="h-full flex flex-col transition-all group-hover:shadow-lg group-hover:border-primary/50">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-xl group-hover:text-primary transition-colors">
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
        </CardHeader>
        <CardContent className="flex-grow">
          <p className="text-muted-foreground">{post.description}</p>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </CardFooter>
      </Card>
    </Link>
  );
}
