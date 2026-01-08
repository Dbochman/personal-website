import { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';

interface CommentsProps {
  slug: string;
}

export function Comments({ slug }: CommentsProps) {
  const commentsRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const { theme } = useTheme();

  // Lazy load comments when they come into view
  useEffect(() => {
    if (!commentsRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(commentsRef.current);

    return () => observer.disconnect();
  }, []);

  // Load Giscus script when visible
  useEffect(() => {
    if (!isVisible || !commentsRef.current) return;

    const giscusTheme = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
      ? 'dark'
      : 'light';

    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.setAttribute('data-repo', 'Dbochman/personal-website');
    script.setAttribute('data-repo-id', 'R_kgDONdlvVw');
    script.setAttribute('data-category', 'Blog Comments');
    script.setAttribute('data-category-id', 'DIC_kwDONdlvV84Cl6Z3');
    script.setAttribute('data-mapping', 'specific');
    script.setAttribute('data-term', slug);
    script.setAttribute('data-strict', '0');
    script.setAttribute('data-reactions-enabled', '1');
    script.setAttribute('data-emit-metadata', '0');
    script.setAttribute('data-input-position', 'bottom');
    script.setAttribute('data-theme', giscusTheme);
    script.setAttribute('data-lang', 'en');
    script.setAttribute('crossorigin', 'anonymous');
    script.async = true;

    commentsRef.current.appendChild(script);
  }, [isVisible, slug, theme]);

  return (
    <div className="mt-12 pt-8 border-t border-border">
      <h2 className="text-2xl font-bold mb-6">Comments</h2>
      <div ref={commentsRef} className="giscus-container">
        {!isVisible && (
          <div className="text-center text-muted-foreground py-8">
            Comments will load when you scroll down...
          </div>
        )}
      </div>
    </div>
  );
}
