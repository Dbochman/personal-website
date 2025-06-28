
import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SeoProps {
  title: string;
  description: string;
  imageUrl?: string;
  url?: string;
  keywords?: string[];
}

const Seo = ({ title, description, imageUrl, url, keywords }: SeoProps) => {
  const siteName = 'Dylan Bochman';
  const fullTitle = `${title} | ${siteName}`;
  const fullImageUrl = imageUrl ? `https://dbochman.github.io${imageUrl}` : 'https://dbochman.github.io/social-preview.png';
  const fullUrl = url ? `https://dbochman.github.io${url}` : 'https://dbochman.github.io';
  
  // Default technical skills keywords
  const defaultKeywords = [
    'Site Reliability Engineering',
    'SRE',
    'Technical Incident Manager',
    'Incident Management',
    'HashiCorp',
    'Spotify',
    'Post-Incident Analysis',
    'SLO Monitoring',
    'Operational Readiness',
    'Infrastructure Reliability',
    'DevOps',
    'System Reliability',
    'Incident Response',
    'Dylan Bochman'
  ];
  
  const allKeywords = keywords ? [...defaultKeywords, ...keywords] : defaultKeywords;
  const keywordsString = allKeywords.join(', ');

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywordsString} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImageUrl} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={fullUrl} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={fullImageUrl} />
    </Helmet>
  );
};

export default Seo;
