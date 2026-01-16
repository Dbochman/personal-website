import { useRef, useEffect, useState } from 'react';
import type { ExpertiseItem } from '@/data/expertise';
import { CompanyLogo } from './CompanyLogo';

const EXPAND_DELAY = 1000; // 1 second before expanding
const MIN_EXPAND_DURATION = 5000; // 5 seconds minimum open

interface ExpertiseCardProps {
  item: ExpertiseItem;
  isExpanded: boolean;
  canCollapse: boolean;
  onExpand: () => void;
  onCollapse: () => void;
}

export function ExpertiseCard({ item, isExpanded, canCollapse, onExpand, onCollapse }: ExpertiseCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [wantsToCollapse, setWantsToCollapse] = useState(false);
  const expandedAtRef = useRef<number | null>(null);
  const expandTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const collapseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track when card was expanded
  useEffect(() => {
    if (isExpanded) {
      expandedAtRef.current = Date.now();
      setWantsToCollapse(false);
    }
  }, [isExpanded]);

  // When canCollapse becomes true and we want to collapse, do it
  useEffect(() => {
    if (canCollapse && wantsToCollapse && !isHovered) {
      onCollapse();
      setWantsToCollapse(false);
    }
  }, [canCollapse, wantsToCollapse, isHovered, onCollapse]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (expandTimeoutRef.current) clearTimeout(expandTimeoutRef.current);
      if (collapseTimeoutRef.current) clearTimeout(collapseTimeoutRef.current);
    };
  }, []);

  const handleMouseEnter = () => {
    setIsHovered(true);
    setWantsToCollapse(false);

    // Cancel any pending collapse
    if (collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current);
      collapseTimeoutRef.current = null;
    }

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

    // If not expanded, nothing to collapse
    if (!expandedAtRef.current) {
      return;
    }

    const elapsed = Date.now() - expandedAtRef.current;
    const remaining = MIN_EXPAND_DURATION - elapsed;

    const triggerCollapse = () => {
      if (canCollapse) {
        onCollapse();
      } else {
        setWantsToCollapse(true);
      }
    };

    if (remaining <= 0) {
      triggerCollapse();
    } else {
      collapseTimeoutRef.current = setTimeout(() => {
        triggerCollapse();
        collapseTimeoutRef.current = null;
      }, remaining);
    }
  };

  return (
    <div
      className="group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/50 focus-visible:ring-offset-1 rounded-sm"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
      tabIndex={0}
    >
      {/* Title - always visible */}
      <div
        className={`text-xs p-2 border transition-all duration-200 cursor-default
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
