
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { ChevronUp } from 'lucide-react';

const BackToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  if (!isVisible) {
    return null;
  }

  return (
    <Button
      onClick={scrollToTop}
      size="icon"
      className="fixed bottom-8 right-8 z-50 bg-foreground text-background hover:bg-foreground/90 transition-all transform hover:scale-105 shadow-lg"
      aria-label="Back to top"
    >
      <ChevronUp className="w-4 h-4" />
    </Button>
  );
};

export default BackToTop;
