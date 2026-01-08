import { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';

interface CommentsProps {
  slug: string;
}

export function Comments({ slug }: CommentsProps) {
  const commentsRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const { theme } = useTheme();
  const currentSlugRef = useRef<string | null>(null);

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

  const getGiscusTheme = () =>
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
      ? 'dark'
      : 'light';

  const sendThemeUpdate = (giscusTheme: string) => {
    const iframe = commentsRef.current?.querySelector<HTMLIFrameElement>('iframe.giscus-frame');
    iframe?.contentWindow?.postMessage(
      { giscus: { setConfig: { theme: giscusTheme } } },
      'https://giscus.app'
    );
  };

  const loadGiscus = (giscusTheme: string) => {
    if (!commentsRef.current) return;
    commentsRef.current.innerHTML = '';
    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.setAttribute('data-repo', 'Dbochman/personal-website');
    script.setAttribute('data-repo-id', 'R_kgDOO7-rBw');
    script.setAttribute('data-category', 'General');
    script.setAttribute('data-category-id', 'DIC_kwDOO7-rB84C0ubL');
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
  };

  // Load Giscus script when visible
  useEffect(() => {
    if (!isVisible || !commentsRef.current) return;

    const giscusTheme = getGiscusTheme();
    if (currentSlugRef.current !== slug) {
      currentSlugRef.current = slug;
      loadGiscus(giscusTheme);
      return;
    }

    sendThemeUpdate(giscusTheme);
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
