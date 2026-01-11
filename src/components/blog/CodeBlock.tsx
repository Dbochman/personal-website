import { useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface CodeBlockProps {
  children: React.ReactNode;
  className?: string;
}

export function CodeBlock({ children, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const preRef = useRef<HTMLPreElement>(null);

  const handleCopy = async () => {
    const codeElement = preRef.current?.querySelector('code');
    if (codeElement) {
      const text = codeElement.textContent || '';
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        if (typeof gtag !== 'undefined') {
          gtag('event', 'code_copy', {
            event_category: 'engagement',
            event_label: text.slice(0, 50)
          });
        }
      } catch (error) {
        console.error('Failed to copy code:', error);
      }
    }
  };

  return (
    <div className="relative group">
      <button
        onClick={handleCopy}
        className="absolute right-2 top-2 p-2 rounded-md bg-muted/80 hover:bg-muted transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
        aria-label="Copy code to clipboard"
        type="button"
      >
        {copied ? (
          <Check className="w-4 h-4 text-green-500" />
        ) : (
          <Copy className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
      <pre
        ref={preRef}
        className={`my-4 overflow-x-auto rounded-lg bg-muted p-4 text-sm ${className || ''}`}
      >
        {children}
      </pre>
    </div>
  );
}
