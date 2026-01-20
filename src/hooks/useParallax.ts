
import { useEffect, useRef, useCallback, useState } from 'react';

export const useParallax = () => {
  const requestRef = useRef<number>();
  const ticking = useRef(false);
  const [isVisible, setIsVisible] = useState(true);
  // Cache parallax elements to avoid querySelectorAll on every frame
  const elementsRef = useRef<NodeListOf<Element> | null>(null);

  const updateParallax = useCallback(() => {
    if (!isVisible) return;

    // Lazy-initialize cached elements on first scroll
    if (!elementsRef.current) {
      elementsRef.current = document.querySelectorAll('[data-speed]');
    }

    const scrollY = window.scrollY;

    elementsRef.current.forEach((element) => {
      const speed = parseFloat(element.getAttribute('data-speed') || '0');
      const yPos = -(scrollY * speed);
      // Use translate3d for hardware acceleration
      (element as HTMLElement).style.transform = `translate3d(0, ${yPos}px, 0)`;
    });

    ticking.current = false;
  }, [isVisible]);

  const handleScroll = useCallback(() => {
    if (!ticking.current) {
      requestRef.current = requestAnimationFrame(updateParallax);
      ticking.current = true;
    }
  }, [updateParallax]);

  useEffect(() => {
    // Intersection Observer for performance - pause when page not visible
    let observer: IntersectionObserver | null = null;
    
    if (typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        ([entry]) => {
          setIsVisible(entry.isIntersecting);
        },
        { threshold: 0.1 }
      );

      // Observe the document body to detect when page is visible
      const target = document.body;
      if (target) {
        observer.observe(target);
      }
    }

    // Add scroll listener with passive option for better performance
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Initial call to set positions
    updateParallax();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      if (observer) {
        observer.disconnect();
      }
    };
  }, [handleScroll, updateParallax]);
};
