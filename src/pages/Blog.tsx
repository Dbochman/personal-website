import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
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
        <meta property="og:title" content="Blog - Dylan Bochman" />
        <meta
          property="og:description"
          content="Articles and insights on Site Reliability Engineering, Incident Management, DevOps, and System Reliability."
        />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://dylanbochman.com/blog" />
      </Helmet>

      <PageLayout>
        <div className="container mx-auto px-4 py-12">
          <header className="mb-12">
            <h1 className="text-4xl font-bold mb-4">Blog</h1>
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
