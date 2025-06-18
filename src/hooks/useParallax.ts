
import { useEffect } from 'react';

export const useParallax = () => {
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const parallaxElements = document.querySelectorAll('[data-speed]');
      
      parallaxElements.forEach((element) => {
        const speed = parseFloat(element.getAttribute('data-speed') || '0');
        const yPos = -(scrollY * speed);
        (element as HTMLElement).style.transform = `translateY(${yPos}px)`;
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
};
