import { useRef, useEffect, useState } from 'react';
import type { ExpertiseItem } from '@/data/expertise';
import { CompanyLogo } from './CompanyLogo';

const EXPAND_DELAY = 1000; // 1 second before expanding

interface ExpertiseCardProps {
  item: ExpertiseItem;
  index: number;
  isExpanded: boolean;
  onExpand: () => void;
  onCollapse: () => void;
}

export function ExpertiseCard({ item, index, isExpanded, onExpand, onCollapse }: ExpertiseCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const expandTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Generate stable ID for aria-controls using index (avoids collisions from duplicate titles)
  const panelId = `expertise-panel-${index}`;

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (expandTimeoutRef.current) clearTimeout(expandTimeoutRef.current);
    };
  }, []);

  const scheduleExpand = () => {
    // If already expanded, no need to set another expand timeout
    if (isExpanded) return;

    // Schedule expansion after delay
    expandTimeoutRef.current = setTimeout(() => {
      if (typeof gtag !== 'undefined') {
        gtag('event', 'expertise_card_expand', {
          event_category: 'engagement',
          event_label: item.title
        });
      }
      onExpand();
      expandTimeoutRef.current = null;
    }, EXPAND_DELAY);
  };

  const cancelExpand = () => {
    if (expandTimeoutRef.current) {
      clearTimeout(expandTimeoutRef.current);
      expandTimeoutRef.current = null;
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    scheduleExpand();
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    cancelExpand();
  };

  const handleFocus = () => {
    setIsFocused(true);
    scheduleExpand();
  };

  const handleBlur = () => {
    setIsFocused(false);
    cancelExpand();
  };

  const handleClick = () => {
    if (isExpanded) {
      onCollapse();
    } else {
      // Cancel any pending expand timeout since we're expanding immediately
      if (expandTimeoutRef.current) {
        clearTimeout(expandTimeoutRef.current);
        expandTimeoutRef.current = null;
      }
      if (typeof gtag !== 'undefined') {
        gtag('event', 'expertise_card_expand', {
          event_category: 'engagement',
          event_label: item.title
        });
      }
      onExpand();
    }
  };

  return (
    <button
      type="button"
      className="group w-full text-left focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-foreground/50 focus-visible:ring-offset-1 rounded-sm"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onClick={handleClick}
      aria-expanded={isExpanded}
      aria-controls={panelId}
    >
      {/* Title - always visible */}
      <div
        className={`text-xs p-2 border transition-[background-color,border-color,color,transform,box-shadow] duration-200 cursor-pointer
                    ${isHovered || isFocused || isExpanded
                      ? 'bg-foreground/15 border-foreground/40 text-foreground scale-[1.02] shadow-xs'
                      : 'bg-foreground/5 border-foreground/20 text-foreground/80'}`}
      >
        {item.title}
      </div>

      {/* Expanded content - desktop only, controlled by parent */}
      <div
        id={panelId}
        className={`hidden md:block overflow-hidden transition-[max-height,opacity] duration-500 ease-out motion-reduce:transition-none
                    ${isExpanded ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="p-2 pt-0 border-x border-b border-foreground/20 bg-foreground/5 space-y-2">
          {/* Company logos */}
          <div className="flex gap-2 pt-2">
            {item.companies.map((company) => (
              <CompanyLogo key={company} company={company} className="w-4 h-4" />
            ))}
          </div>

          {/* Description */}
          <p className="text-xs text-muted-foreground leading-relaxed">
            {item.description}
          </p>

          {/* Skills */}
          <div className="flex flex-wrap gap-1">
            {item.skills.map((skill, index) => (
              <span key={skill} className="text-xs text-foreground/60">
                {skill}{index < item.skills.length - 1 && ' •'}
              </span>
            ))}
          </div>
        </div>
      </div>
    </button>
  );
}
