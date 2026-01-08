import { type MDXComponents } from 'mdx/types';

/**
 * Custom components for MDX rendering
 * These components provide consistent styling for all MDX content
 */
export const mdxComponents: MDXComponents = {
  // Headings
  h1: ({ children }) => (
    <h1 className="text-5xl font-extrabold mt-20 mb-8 text-foreground scroll-mt-20 first:mt-0 tracking-tight" id={String(children).toLowerCase().replace(/\s+/g, '-')}>
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-4xl font-extrabold mt-32 mb-8 text-foreground scroll-mt-20 first:mt-0 tracking-tight border-b-2 border-border pb-4" id={String(children).toLowerCase().replace(/\s+/g, '-')}>
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-3xl font-bold mt-24 mb-6 text-foreground scroll-mt-20 first:mt-0" id={String(children).toLowerCase().replace(/\s+/g, '-')}>
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
    <p className="mb-8 text-foreground/95 text-xl leading-loose last:mb-0">
      {children}
    </p>
  ),

  // Links
  a: ({ href, children }) => (
    <a
      href={href}
      className="text-primary underline decoration-2 underline-offset-2 hover:decoration-primary/50 font-medium transition-colors"
      target={href?.startsWith('http') ? '_blank' : undefined}
      rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
    >
      {children}
    </a>
  ),

  // Lists
  ul: ({ children }) => (
    <ul className="mb-8 ml-6 list-disc space-y-4 text-foreground/95 last:mb-0">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-8 ml-6 list-decimal space-y-4 text-foreground/95 last:mb-0">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="text-xl leading-loose pl-2">
      {children}
    </li>
  ),

  // Code blocks
  pre: ({ children }) => (
    <pre className="mb-8 overflow-x-auto rounded-lg bg-muted p-6 text-base last:mb-0">
      {children}
    </pre>
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

  // Images
  img: ({ src, alt }) => (
    <img
      src={src}
      alt={alt || ''}
      className="my-4 rounded-lg max-w-full h-auto"
      loading="lazy"
    />
  ),

  // Strong and emphasis
  strong: ({ children }) => (
    <strong className="font-bold text-foreground/100">
      {children}
    </strong>
  ),
  em: ({ children }) => (
    <em className="italic text-foreground/95">
      {children}
    </em>
  ),
};
