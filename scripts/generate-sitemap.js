#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const baseUrl = 'https://dylanbochman.com';
const currentDate = new Date().toISOString().split('T')[0];

// Define your site's routes and their properties
const routes = [
  {
    url: '/',
    lastmod: currentDate,
    changefreq: 'monthly',
    priority: '1.0'
  },
  // Add more routes here as your site grows
  // {
  //   url: '/blog',
  //   lastmod: currentDate,
  //   changefreq: 'weekly',
  //   priority: '0.8'
  // }
];

// Generate sitemap XML
function generateSitemap() {
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map(route => `  <url>
    <loc>${baseUrl}${route.url}</loc>
    <lastmod>${route.lastmod}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return sitemap;
}

// Write sitemap to public directory
function writeSitemap() {
  const sitemap = generateSitemap();
  const sitemapPath = path.join(process.cwd(), 'public', 'sitemap.xml');
  
  try {
    fs.writeFileSync(sitemapPath, sitemap, 'utf8');
    console.log('✅ Sitemap generated successfully at public/sitemap.xml');
  } catch (error) {
    console.error('❌ Error generating sitemap:', error);
    process.exit(1);
  }
}

// Generate robots.txt as well
function generateRobotsTxt() {
  const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml`;

  const robotsPath = path.join(process.cwd(), 'public', 'robots.txt');
  
  try {
    fs.writeFileSync(robotsPath, robotsTxt, 'utf8');
    console.log('✅ Robots.txt updated with sitemap reference');
  } catch (error) {
    console.error('❌ Error generating robots.txt:', error);
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  writeSitemap();
  generateRobotsTxt();
}

export { generateSitemap, writeSitemap };