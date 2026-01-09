#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const baseUrl = 'https://dylanbochman.com';
const siteName = 'Dylan Bochman';
const siteDescription = 'Articles and insights on Site Reliability Engineering, Incident Management, DevOps, and System Reliability.';
const currentDate = new Date().toISOString().split('T')[0];

/**
 * Read and parse all blog posts from content/blog directory
 */
function loadBlogPosts() {
  const blogDir = path.join(process.cwd(), 'content', 'blog');

  if (!fs.existsSync(blogDir)) {
    console.warn('⚠️  No content/blog directory found');
    return [];
  }

  const files = fs.readdirSync(blogDir).filter(f => f.endsWith('.txt'));
  const posts = [];

  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(blogDir, file), 'utf8');
      const { data: frontmatter } = matter(content);

      // Skip drafts
      if (frontmatter.draft === true) {
        continue;
      }

      posts.push({
        slug: frontmatter.slug || file.replace('.txt', ''),
        title: frontmatter.title,
        description: frontmatter.description,
        date: frontmatter.date,
        updated: frontmatter.updated,
        author: frontmatter.author || 'Dylan Bochman',
        tags: frontmatter.tags || [],
      });
    } catch (error) {
      console.error(`Error parsing ${file}:`, error.message);
    }
  }

  // Sort by date, newest first
  return posts.sort((a, b) => new Date(b.date) - new Date(a.date));
}

/**
 * Escape XML special characters
 */
function escapeXml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generate RSS 2.0 feed
 */
function generateRssFeed(posts) {
  const lastBuildDate = posts.length > 0
    ? new Date(posts[0].date).toUTCString()
    : new Date().toUTCString();

  const items = posts.map(post => `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${baseUrl}/blog/${post.slug}</link>
      <guid isPermaLink="true">${baseUrl}/blog/${post.slug}</guid>
      <description>${escapeXml(post.description)}</description>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <author>dylan@dylanbochman.com (${escapeXml(post.author)})</author>
      ${post.tags.map(tag => `<category>${escapeXml(tag)}</category>`).join('\n      ')}
    </item>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteName)} - Blog</title>
    <link>${baseUrl}/blog</link>
    <description>${escapeXml(siteDescription)}</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${baseUrl}/social-preview.webp</url>
      <title>${escapeXml(siteName)} - Blog</title>
      <link>${baseUrl}/blog</link>
    </image>
${items}
  </channel>
</rss>`;
}

/**
 * Generate sitemap XML including blog posts
 */
function generateSitemap(posts) {
  // Static routes
  const staticRoutes = [
    { url: '/', changefreq: 'monthly', priority: '1.0' },
    { url: '/blog', changefreq: 'weekly', priority: '0.9' },
  ];

  // Blog post routes
  const blogRoutes = posts.map(post => ({
    url: `/blog/${post.slug}`,
    lastmod: post.updated || post.date,
    changefreq: 'monthly',
    priority: '0.7',
  }));

  const allRoutes = [...staticRoutes, ...blogRoutes];

  const urls = allRoutes.map(route => `  <url>
    <loc>${baseUrl}${route.url}</loc>
    <lastmod>${route.lastmod || currentDate}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

/**
 * Generate robots.txt with sitemap and RSS references
 */
function generateRobotsTxt() {
  return `User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml
`;
}

/**
 * Main execution
 */
function main() {
  console.log('🔄 Loading blog posts...');
  const posts = loadBlogPosts();
  console.log(`📝 Found ${posts.length} published blog posts`);

  const publicDir = path.join(process.cwd(), 'public');

  // Generate RSS feed
  const rssFeed = generateRssFeed(posts);
  const rssPath = path.join(publicDir, 'rss.xml');
  fs.writeFileSync(rssPath, rssFeed, 'utf8');
  console.log('✅ RSS feed generated at public/rss.xml');

  // Generate sitemap
  const sitemap = generateSitemap(posts);
  const sitemapPath = path.join(publicDir, 'sitemap.xml');
  fs.writeFileSync(sitemapPath, sitemap, 'utf8');
  console.log('✅ Sitemap generated at public/sitemap.xml');

  // Generate robots.txt
  const robotsTxt = generateRobotsTxt();
  const robotsPath = path.join(publicDir, 'robots.txt');
  fs.writeFileSync(robotsPath, robotsTxt, 'utf8');
  console.log('✅ Robots.txt updated at public/robots.txt');

  console.log('\n📊 Summary:');
  console.log(`   - ${posts.length} blog posts in RSS feed`);
  console.log(`   - ${posts.length + 2} URLs in sitemap (${posts.length} posts + 2 static pages)`);
}

main();
