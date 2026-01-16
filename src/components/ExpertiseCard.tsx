import { useRef, useEffect, useState } from 'react';
import type { ExpertiseItem } from '@/data/expertise';
import { CompanyLogo } from './CompanyLogo';

const EXPAND_DELAY = 1000; // 1 second before expanding

interface ExpertiseCardProps {
  item: ExpertiseItem;
  isExpanded: boolean;
  onExpand: () => void;
  onCollapse: () => void;
}

export function ExpertiseCard({ item, isExpanded, onExpand, onCollapse }: ExpertiseCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const expandTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (expandTimeoutRef.current) clearTimeout(expandTimeoutRef.current);
    };
  }, []);

  const handleMouseEnter = () => {
    setIsHovered(true);

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

  const handleMouseLeave = () => {
    setIsHovered(false);

    // Cancel any pending expand
    if (expandTimeoutRef.current) {
      clearTimeout(expandTimeoutRef.current);
      expandTimeoutRef.current = null;
    }
  };

  const handleClick = () => {
    if (isExpanded) {
      onCollapse();
    }
  };

  return (
    <div
      className="group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/50 focus-visible:ring-offset-1 rounded-sm"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
      onClick={handleClick}
      tabIndex={0}
    >
      {/* Title - always visible */}
      <div
        className={`text-xs p-2 border transition-all duration-200
                    ${isExpanded ? 'cursor-pointer' : 'cursor-default'}
                    ${isHovered || isExpanded
                      ? 'bg-foreground/15 border-foreground/40 text-foreground scale-[1.02] shadow-sm'
                      : 'bg-foreground/5 border-foreground/20 text-foreground/80'}`}
      >
        {item.title}
      </div>

      {/* Expanded content - desktop only, controlled by parent */}
      <div
        className={`hidden md:block overflow-hidden transition-all duration-500 ease-out motion-reduce:transition-none
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
    </div>
  );
}
