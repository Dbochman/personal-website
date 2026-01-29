import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Calendar, Clock, User } from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';
import { TagList } from '@/components/blog/TagList';
import { mdxComponents } from '@/components/blog/MDXComponents';
import {
  getPostBySlug,
  getAllPosts,
  getPostComponent,
} from '@/content/blog';
import { Comments } from '@/components/blog/Comments';
import { RelatedPosts } from '@/components/blog/RelatedPosts';
import { TransitionLink } from '@/hooks/useViewTransition';

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();

  // Load synchronously for SSR/pre-rendering
  const post = slug ? getPostBySlug(slug) : null;
  const allPosts = getAllPosts();
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

        {/* JSON-LD Structured Data - BlogPosting */}
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
              sameAs: [
                'https://www.linkedin.com/in/dbochman',
                'https://github.com/Dbochman',
              ],
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

        {/* JSON-LD Breadcrumb for navigation */}
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: 'https://dylanbochman.com',
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'Blog',
                item: 'https://dylanbochman.com/blog',
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: post.title,
                item: `https://dylanbochman.com/blog/${post.slug}`,
              },
            ],
          })}
        </script>
      </Helmet>

      <PageLayout>
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto">
            {/* Back link */}
            <TransitionLink
              to="/blog"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              View all posts
            </TransitionLink>

            {/* Post header */}
            <header className="mb-8">
              <h1
                className="text-4xl md:text-5xl font-bold mb-4"
                style={{ viewTransitionName: `blog-title-${slug}` }}
              >
                {post.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                <Link
                  to={`/blog?author=${post.author}`}
                  className="flex items-center gap-2 hover:text-primary transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span className="hover:underline">{post.author}</span>
                </Link>

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

              <TagList tags={post.tags} variant="secondary" />
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
                  Written by{' '}
                  <Link
                    to={`/blog?author=${post.author}`}
                    className="hover:text-primary hover:underline transition-colors"
                  >
                    {post.author}
                  </Link>
                </div>
                <TransitionLink
                  to="/blog"
                  className="text-sm text-primary hover:underline"
                >
                  View all posts →
                </TransitionLink>
              </div>
            </footer>
          </div>
        </div>
      </PageLayout>
    </>
  );
}
