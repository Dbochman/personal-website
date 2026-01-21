import { Badge } from '@/components/ui/badge';

interface TagListProps {
  tags: string[];
  variant?: 'outline-solid' | 'secondary' | 'default';
  size?: 'sm' | 'default';
  /** Max tags on mobile (default 5) */
  mobileLimit?: number;
  /** Max tags on desktop/tablet (default 10) */
  desktopLimit?: number;
}

export function TagList({
  tags,
  variant = 'outline',
  size = 'default',
  mobileLimit = 5,
  desktopLimit = 10,
}: TagListProps) {
  const mobileTags = tags.slice(0, mobileLimit);
  const desktopOnlyTags = tags.slice(mobileLimit, desktopLimit);
  const mobileOverflow = tags.length - mobileLimit;
  const desktopOverflow = tags.length - desktopLimit;

  const sizeClass = size === 'sm' ? 'text-xs' : '';

  return (
    <div className="flex flex-wrap gap-1.5">
      {/* Tags visible on all screen sizes (up to mobileLimit) */}
      {mobileTags.map((tag) => (
        <Badge key={tag} variant={variant} className={sizeClass}>
          {tag}
        </Badge>
      ))}

      {/* Tags visible only on md+ screens (mobileLimit to desktopLimit) */}
      {desktopOnlyTags.map((tag) => (
        <Badge
          key={tag}
          variant={variant}
          className={`hidden md:inline-flex ${sizeClass}`}
        >
          {tag}
        </Badge>
      ))}

      {/* Overflow indicator for mobile */}
      {mobileOverflow > 0 && (
        <Badge
          variant="outline"
          className={`md:hidden text-muted-foreground ${sizeClass}`}
        >
          +{mobileOverflow}
        </Badge>
      )}

      {/* Overflow indicator for desktop (if more than desktopLimit) */}
      {desktopOverflow > 0 && (
        <Badge
          variant="outline"
          className={`hidden md:inline-flex text-muted-foreground ${sizeClass}`}
        >
          +{desktopOverflow}
        </Badge>
      )}
    </div>
  );
}
