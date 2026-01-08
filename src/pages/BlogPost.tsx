import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { MDXProvider } from '@mdx-js/react';
import { ArrowLeft, Calendar, Clock } from 'lucide-react';
import { evaluate } from '@mdx-js/mdx';
import * as runtime from 'react/jsx-runtime';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypePrism from 'rehype-prism-plus';
import PageLayout from '@/components/layout/PageLayout';
import { Badge } from '@/components/ui/badge';
import { mdxComponents } from '@/components/blog/MDXComponents';
import { loadBlogPost } from '@/lib/blog-loader';
import type { BlogPost as BlogPostType } from '@/types/blog';

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPostType | null>(null);
  const [MDXContent, setMDXContent] = useState<React.ComponentType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setError('No post slug provided');
      setLoading(false);
      return;
    }

    const loadPost = async () => {
      try {
        const loadedPost = await loadBlogPost(slug);

        if (!loadedPost) {
          setError('Post not found');
          setLoading(false);
          return;
        }

        setPost(loadedPost);

        // Evaluate the MDX content at runtime with custom components
        const { default: Content } = await evaluate(loadedPost.content, {
          ...runtime,
          remarkPlugins: [remarkGfm],
          rehypePlugins: [
            rehypeSlug,
            [rehypeAutolinkHeadings, { behavior: 'wrap' }],
            rehypePrism,
          ],
          useMDXComponents: () => mdxComponents,
        });
        setMDXContent(() => Content);
        setLoading(false);
      } catch (err) {
        console.error('Error loading blog post:', err);
        setError('Failed to load blog post');
        setLoading(false);
      }
    };

    loadPost();
  }, [slug]);

  if (loading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading post...</div>
        </div>
      </PageLayout>
    );
  }

  if (error || !post) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto">
            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md mb-4">
              {error || 'Post not found'}
            </div>
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Blog
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
        <meta property="og:title" content={`${post.title} - Dylan Bochman`} />
        <meta property="og:description" content={post.description} />
        <meta property="og:type" content="article" />
        <meta property="article:published_time" content={post.date} />
        {post.updated && <meta property="article:modified_time" content={post.updated} />}
        <meta property="article:author" content={post.author} />
        {post.tags.map((tag) => (
          <meta key={tag} property="article:tag" content={tag} />
        ))}
        <link rel="canonical" href={`https://dylanbochman.com/blog/${post.slug}`} />
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
              Back to Blog
            </Link>

            {/* Post header */}
            <header className="mb-8">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                {post.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
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
                <MDXProvider components={mdxComponents}>
                  <MDXContent />
                </MDXProvider>
              )}
            </article>

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
