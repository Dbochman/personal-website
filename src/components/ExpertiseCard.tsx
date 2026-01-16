import { useRef, useEffect } from 'react';
import type { ExpertiseItem } from '@/data/expertise';
import { CompanyLogo } from './CompanyLogo';

const MIN_EXPAND_DURATION = 5000; // 5 seconds

interface ExpertiseCardProps {
  item: ExpertiseItem;
  isExpanded: boolean;
  onExpand: () => void;
  onCollapse: () => void;
}

export function ExpertiseCard({ item, isExpanded, onExpand, onCollapse }: ExpertiseCardProps) {
  const expandedAtRef = useRef<number | null>(null);
  const collapseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track when card was expanded
  useEffect(() => {
    if (isExpanded) {
      expandedAtRef.current = Date.now();
    }
  }, [isExpanded]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (collapseTimeoutRef.current) {
        clearTimeout(collapseTimeoutRef.current);
      }
    };
  }, []);

  const handleExpand = () => {
    // Cancel any pending collapse
    if (collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current);
      collapseTimeoutRef.current = null;
    }

    if (!isExpanded && typeof gtag !== 'undefined') {
      gtag('event', 'expertise_card_expand', {
        event_category: 'engagement',
        event_label: item.title
      });
    }
    onExpand();
  };

  const handleCollapse = () => {
    if (!expandedAtRef.current) {
      onCollapse();
      return;
    }

    const elapsed = Date.now() - expandedAtRef.current;
    const remaining = MIN_EXPAND_DURATION - elapsed;

    if (remaining <= 0) {
      onCollapse();
    } else {
      // Schedule collapse after minimum duration
      collapseTimeoutRef.current = setTimeout(() => {
        onCollapse();
        collapseTimeoutRef.current = null;
      }, remaining);
    }
  };

  return (
    <div
      className="group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/50 focus-visible:ring-offset-1 rounded-sm"
      onMouseEnter={handleExpand}
      onMouseLeave={handleCollapse}
      onFocus={handleExpand}
      onBlur={handleCollapse}
      tabIndex={0}
    >
      {/* Title - always visible */}
      <div className="text-xs text-foreground/80 p-2 border border-foreground/20 bg-foreground/5 hover:bg-foreground/10 transition-colors cursor-default">
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
