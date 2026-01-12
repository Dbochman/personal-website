import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Calendar, Clock, User } from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';
import { Badge } from '@/components/ui/badge';
import { mdxComponents } from '@/components/blog/MDXComponents';
import {
  getPostSync,
  getPostsSync,
  getPostComponent,
} from '@/lib/blog-loader-precompiled';
import { Comments } from '@/components/blog/Comments';
import { RelatedPosts } from '@/components/blog/RelatedPosts';

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();

  // Load synchronously for SSR/pre-rendering
  const post = slug ? getPostSync(slug) : null;
  const allPosts = getPostsSync();
  const MDXContent = slug ? getPostComponent(slug) : null;

  if (!post) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto">
            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md mb-4">
              Post not found
            </div>
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              <ArrowLeft className="w-4 h-4" />
              View all posts
            </Link>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <>
      <Helmet>
        <title>{post.title} - Dylan Bochman</title>
        <meta name="description" content={post.description} />
        <meta name="keywords" content={post.tags.join(', ')} />
        <meta name="author" content={post.author} />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://dylanbochman.com/blog/${post.slug}`} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.description} />
        <meta property="og:image" content={post.image || 'https://dylanbochman.com/social-preview.webp'} />
        <meta property="og:site_name" content="Dylan Bochman" />

        {/* Article-specific Open Graph */}
        <meta property="article:published_time" content={post.date} />
        {post.updated && <meta property="article:modified_time" content={post.updated} />}
        <meta property="article:author" content={post.author} />
        {post.tags.map((tag) => (
          <meta key={tag} property="article:tag" content={tag} />
        ))}

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={`https://dylanbochman.com/blog/${post.slug}`} />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={post.description} />
        <meta name="twitter:image" content={post.image || 'https://dylanbochman.com/social-preview.webp'} />

        <link rel="canonical" href={`https://dylanbochman.com/blog/${post.slug}`} />

        {/* JSON-LD Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: post.title,
            description: post.description,
            image: post.image || 'https://dylanbochman.com/social-preview.webp',
            datePublished: post.date,
            dateModified: post.updated || post.date,
            author: {
              '@type': 'Person',
              name: post.author,
              url: 'https://dylanbochman.com',
            },
            publisher: {
              '@type': 'Person',
              name: 'Dylan Bochman',
              url: 'https://dylanbochman.com',
            },
            mainEntityOfPage: {
              '@type': 'WebPage',
              '@id': `https://dylanbochman.com/blog/${post.slug}`,
            },
            keywords: post.tags.join(', '),
          })}
        </script>
      </Helmet>

      <PageLayout>
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto">
            {/* Back link */}
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              View all posts
            </Link>

            {/* Post header */}
            <header className="mb-8">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                {post.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>{post.author}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <time dateTime={post.date}>
                    {new Date(post.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </time>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{post.readingTime}</span>
                </div>

                {post.updated && (
                  <div className="text-xs">
                    Updated: {new Date(post.updated).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                )}
              </div>

              <p className="text-xl text-muted-foreground mb-6">
                {post.description}
              </p>

              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </header>

            {/* Post content */}
            <article className="prose prose-lg max-w-none">
              {MDXContent && (
                <MDXContent components={mdxComponents} />
              )}
            </article>

            {/* Related Posts */}
            <RelatedPosts currentPost={post} allPosts={allPosts} />

            {/* Comments */}
            <Comments slug={post.slug} />

            {/* Post footer */}
            <footer className="mt-12 pt-8 border-t border-border">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Written by {post.author}
                </div>
                <Link
                  to="/blog"
                  className="text-sm text-primary hover:underline"
                >
                  View all posts →
                </Link>
              </div>
            </footer>
          </div>
        </div>
      </PageLayout>
    </>
  );
}
