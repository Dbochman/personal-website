import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Rss } from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';
import { BlogList } from '@/components/blog/BlogList';
import { loadBlogPosts } from '@/lib/blog-loader';
import type { BlogPost } from '@/types/blog';

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBlogPosts()
      .then((loadedPosts) => {
        setPosts(loadedPosts);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading blog posts:', err);
        setError('Failed to load blog posts. Please try again later.');
        setLoading(false);
      });
  }, []);

  return (
    <>
      <Helmet>
        <title>Blog - Dylan Bochman</title>
        <meta
          name="description"
          content="Articles and insights on Site Reliability Engineering, Incident Management, DevOps, and System Reliability."
        />
        <meta
          name="keywords"
          content="SRE Blog, Incident Management, DevOps, System Reliability, Technical Writing, Post-Incident Analysis"
        />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://dylanbochman.com/blog" />
        <meta property="og:title" content="Blog - Dylan Bochman" />
        <meta
          property="og:description"
          content="Articles and insights on Site Reliability Engineering, Incident Management, DevOps, and System Reliability."
        />
        <meta property="og:image" content="https://dylanbochman.com/social-preview.webp" />
        <meta property="og:site_name" content="Dylan Bochman" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://dylanbochman.com/blog" />
        <meta name="twitter:title" content="Blog - Dylan Bochman" />
        <meta
          name="twitter:description"
          content="Articles and insights on Site Reliability Engineering, Incident Management, DevOps, and System Reliability."
        />
        <meta name="twitter:image" content="https://dylanbochman.com/social-preview.webp" />

        <link rel="canonical" href="https://dylanbochman.com/blog" />
      </Helmet>

      <PageLayout>
        <div className="container mx-auto px-4 py-12">
          <header className="mb-12">
            <div className="flex items-center gap-4 mb-4">
              <h1 className="text-4xl font-bold">Blog</h1>
              <a
                href="/rss.xml"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-orange-500 transition-colors"
                title="Subscribe via RSS"
                aria-label="RSS Feed"
              >
                <Rss className="w-6 h-6" />
              </a>
            </div>
            <p className="text-xl text-muted-foreground">
              Insights on Site Reliability Engineering, Incident Management, and DevOps practices.
            </p>
          </header>

          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">Loading posts...</div>
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {!loading && !error && <BlogList posts={posts} />}
        </div>
      </PageLayout>
    </>
  );
}
