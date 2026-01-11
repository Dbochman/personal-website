import type { ExpertiseItem } from '@/data/expertise';
import { CompanyLogo } from './CompanyLogo';

interface ExpertiseCardProps {
  item: ExpertiseItem;
  isExpanded: boolean;
  onExpand: () => void;
}

export function ExpertiseCard({ item, isExpanded, onExpand }: ExpertiseCardProps) {
  const handleExpand = () => {
    if (!isExpanded && typeof gtag !== 'undefined') {
      gtag('event', 'expertise_card_expand', {
        event_category: 'engagement',
        event_label: item.title
      });
    }
    onExpand();
  };

  return (
    <div
      className="group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/50 focus-visible:ring-offset-1 rounded-sm"
      onMouseEnter={handleExpand}
      onFocus={handleExpand}
      tabIndex={0}
    >
      {/* Title - always visible */}
      <div className="text-xs text-foreground/80 p-2 border border-foreground/20 bg-foreground/5 hover:bg-foreground/10 transition-colors cursor-default">
        {item.title}
      </div>

      {/* Expanded content - desktop only, controlled by parent */}
      <div
        className={`hidden md:block overflow-hidden transition-all duration-300 ease-out motion-reduce:transition-none
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
