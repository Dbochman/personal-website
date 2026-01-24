import { type MDXComponents } from 'mdx/types';
import { Link } from 'react-router-dom';
import { CodeBlock } from './CodeBlock';
import { Callout } from './Callout';
import { BlogImage } from './BlogImage';
import { Chart, MultiSeriesChart } from './Chart';
import { MTTRBuilder } from './MTTRBuilder';
import { SeveritySelector } from './SeveritySelector';
import { AnimatedMermaidDiagram } from '@/components/projects/incident-command-diagrams/AnimatedMermaidDiagram';

// Check if URL is internal to dylanbochman.com
const isInternalUrl = (href: string | undefined): string | null => {
  if (!href) return null;

  // Already a relative path
  if (href.startsWith('/') && !href.startsWith('//')) {
    return href;
  }

  // Absolute URL to our domain
  try {
    const url = new URL(href);
    if (url.hostname === 'dylanbochman.com' || url.hostname === 'www.dylanbochman.com') {
      return url.pathname + url.search + url.hash;
    }
  } catch {
    // Not a valid URL, treat as external
  }

  return null;
};

// Smart link component that uses React Router for internal links
const SmartLink = ({ href, children }: { href?: string; children?: React.ReactNode }) => {
  const internalPath = isInternalUrl(href);

  if (internalPath) {
    return (
      <Link
        to={internalPath}
        state={{ fromBlog: true }}
        className="text-primary underline hover:text-primary/80 font-medium"
      >
        {children}
      </Link>
    );
  }

  return (
    <a
      href={href}
      className="text-primary underline hover:text-primary/80 font-medium"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  );
};

/**
 * Custom components for MDX rendering
 * These components provide consistent styling for all MDX content
 */
export const mdxComponents: MDXComponents = {
  // Headings
  h1: ({ children }) => (
    <h1 className="text-4xl font-bold mt-8 mb-4 text-foreground scroll-mt-20" id={String(children).toLowerCase().replace(/\s+/g, '-')}>
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-3xl font-bold mt-8 mb-4 text-foreground scroll-mt-20" id={String(children).toLowerCase().replace(/\s+/g, '-')}>
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-2xl font-semibold mt-6 mb-3 text-foreground scroll-mt-20" id={String(children).toLowerCase().replace(/\s+/g, '-')}>
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-xl font-semibold mt-4 mb-2 text-foreground scroll-mt-20" id={String(children).toLowerCase().replace(/\s+/g, '-')}>
      {children}
    </h4>
  ),
  h5: ({ children }) => (
    <h5 className="text-lg font-semibold mt-4 mb-2 text-foreground scroll-mt-20" id={String(children).toLowerCase().replace(/\s+/g, '-')}>
      {children}
    </h5>
  ),
  h6: ({ children }) => (
    <h6 className="text-base font-semibold mt-4 mb-2 text-foreground scroll-mt-20" id={String(children).toLowerCase().replace(/\s+/g, '-')}>
      {children}
    </h6>
  ),

  // Paragraphs and text
  p: ({ children }) => (
    <p className="my-4 text-foreground/80 leading-7">
      {children}
    </p>
  ),

  // Links - uses React Router for internal links to preserve state
  a: SmartLink,

  // Lists
  ul: ({ children }) => (
    <ul className="my-4 ml-6 list-disc space-y-2 text-foreground/80">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-4 ml-6 list-decimal space-y-2 text-foreground/80">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="leading-7">
      {children}
    </li>
  ),

  // Code blocks with copy button
  pre: ({ children, className }) => (
    <CodeBlock className={className}>
      {children}
    </CodeBlock>
  ),
  code: ({ children, className }) => {
    const isInline = !className;

    if (isInline) {
      return (
        <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono text-foreground">
          {children}
        </code>
      );
    }

    return (
      <code className={`${className || ''} font-mono`}>
        {children}
      </code>
    );
  },

  // Blockquotes
  blockquote: ({ children }) => (
    <blockquote className="my-4 border-l-4 border-primary pl-4 italic text-foreground/70">
      {children}
    </blockquote>
  ),

  // Horizontal rule
  hr: () => (
    <hr className="my-8 border-border" />
  ),

  // Tables
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto">
      <table className="w-full border-collapse">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-muted">
      {children}
    </thead>
  ),
  tbody: ({ children }) => (
    <tbody>
      {children}
    </tbody>
  ),
  tr: ({ children }) => (
    <tr className="border-b border-border">
      {children}
    </tr>
  ),
  th: ({ children }) => (
    <th className="px-4 py-2 text-left font-semibold text-foreground">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-4 py-2 text-foreground/80">
      {children}
    </td>
  ),

  // Images with lazy loading
  img: ({ src, alt }) => (
    <BlogImage
      src={src || ''}
      alt={alt || ''}
    />
  ),

  // Strong and emphasis
  strong: ({ children }) => (
    <strong className="font-bold text-foreground">
      {children}
    </strong>
  ),
  em: ({ children }) => (
    <em className="italic">
      {children}
    </em>
  ),

  // Custom components available in MDX
  Callout,
  BlogImage,
  Chart,
  MultiSeriesChart,
  MTTRBuilder,
  SeveritySelector,
  AnimatedMermaidDiagram,
};
