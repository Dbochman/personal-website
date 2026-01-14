import { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Rss } from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';
import { Footer } from '@/components/layout/Footer';
import { BlogList } from '@/components/blog/BlogList';
import { FeaturedHero } from '@/components/blog/FeaturedHero';
import { getPostsSync } from '@/lib/blog-loader-precompiled';

export default function Blog() {
  // Load synchronously for SSR/pre-rendering
  const posts = getPostsSync();

  // Extract featured post and regular posts
  const featuredPost = useMemo(() => posts.find((p) => p.featured), [posts]);
  const regularPosts = useMemo(() => posts.filter((p) => !p.featured), [posts]);

  return (
    <>
      <Helmet>
        <title>Blog - Dylan Bochman & Claude</title>
        <meta
          name="description"
          content="A collaborative blog by Dylan Bochman and Claude. Honest reflections on reliability, web development, and building software together."
        />
        <meta
          name="keywords"
          content="SRE Blog, AI Collaboration, Incident Management, DevOps, System Reliability, Technical Writing, Human-AI Development"
        />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://dylanbochman.com/blog" />
        <meta property="og:title" content="Blog - Dylan Bochman & Claude" />
        <meta
          property="og:description"
          content="A collaborative blog by Dylan Bochman and Claude. Honest reflections on reliability, web development, and building software together."
        />
        <meta property="og:image" content="https://dylanbochman.com/social-preview.webp" />
        <meta property="og:site_name" content="Dylan Bochman" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://dylanbochman.com/blog" />
        <meta name="twitter:title" content="Blog - Dylan Bochman & Claude" />
        <meta
          name="twitter:description"
          content="A collaborative blog by Dylan Bochman and Claude. Honest reflections on reliability, web development, and building software together."
        />
        <meta name="twitter:image" content="https://dylanbochman.com/social-preview.webp" />

        <link rel="canonical" href="https://dylanbochman.com/blog" />
      </Helmet>

      <PageLayout>
        <div className="container mx-auto px-4 py-12">
          {/* Header + Featured Hero side by side on desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            <header>
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
              <p className="text-xl text-muted-foreground mb-4">
                A collaboration between Dylan and{' '}
                <a
                  href="https://claude.ai/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground hover:underline"
                >
                  Claude
                </a>
                .
              </p>
              <p className="text-muted-foreground">
                We write about practical SRE themes—reliability, resilience, and observability—along
                with the systems we build together and the lessons we learn along the way. Some posts
                are written by Claude, some by me. The authorship varies, but the collaboration is constant.
              </p>
            </header>

            {/* Featured Hero in right column */}
            {featuredPost && <FeaturedHero post={featuredPost} />}
          </div>

          <BlogList posts={regularPosts} />

          <div className="mt-16">
            <Footer />
          </div>
        </div>
      </PageLayout>
    </>
  );
}
