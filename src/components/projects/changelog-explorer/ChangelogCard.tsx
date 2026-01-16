import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, GitMerge, ExternalLink } from 'lucide-react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExpandedDetails } from './ExpandedDetails';
import { cn } from '@/lib/utils';
import type { ChangelogEntry } from '@/hooks/useChangelogData';

const REPO_URL = 'https://github.com/Dbochman/personal-website';

interface ChangelogCardProps {
  entry: ChangelogEntry;
  expanded: boolean;
  onToggle: () => void;
}

/**
 * Parse PR label to extract PR number
 */
function parsePrLabel(label: string): number | null {
  const match = label.match(/^PR #(\d+)$/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Check if any label is a PR reference
 */
function hasPrLabel(labels: string[]): boolean {
  return labels.some((label) => label.startsWith('PR #'));
}

export function ChangelogCard({ entry, expanded, onToggle }: ChangelogCardProps) {
  const prLabels = entry.labels.filter((l) => l.startsWith('PR #'));
  const otherLabels = entry.labels.filter((l) => !l.startsWith('PR #'));
  const hasMergedPr = hasPrLabel(entry.labels);

  return (
    <Card
      className={cn(
        'overflow-hidden transition-shadow',
        expanded && 'ring-2 ring-primary/20'
      )}
    >
      <CardHeader
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={onToggle}
      >
        {/* Mobile: stack vertically, Desktop: side by side */}
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-start sm:gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {hasMergedPr && (
                <GitMerge className="w-4 h-4 text-purple-500 flex-shrink-0" title="Merged" />
              )}
              <CardTitle className="text-lg">{entry.title}</CardTitle>
            </div>
            {entry.description && (
              <CardDescription className="mt-1 line-clamp-2">
                {entry.description}
              </CardDescription>
            )}
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-2 flex-shrink-0">
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {format(new Date(entry.completedAt), 'MMM d, yyyy')}
            </span>
            <motion.div
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            </motion.div>
          </div>
        </div>

        {/* Labels */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {/* PR labels with links */}
          {prLabels.map((label) => {
            const prNumber = parsePrLabel(label);
            if (!prNumber) return null;
            return (
              <a
                key={label}
                href={`${REPO_URL}/pull/${prNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex"
              >
                <Badge
                  variant="secondary"
                  className="text-xs hover:bg-primary/20 transition-colors cursor-pointer"
                >
                  {label}
                  <ExternalLink className="w-2.5 h-2.5 ml-1 opacity-60" />
                </Badge>
              </a>
            );
          })}

          {/* Other labels */}
          {otherLabels.map((label) => (
            <Badge key={label} variant="outline" className="text-xs">
              {label}
            </Badge>
          ))}

          {/* Checklist preview */}
          {entry.checklist && entry.checklist.length > 0 && (
            <Badge variant="outline" className="text-xs">
              {entry.checklist.filter((i) => i.completed).length}/{entry.checklist.length} tasks
            </Badge>
          )}
        </div>
      </CardHeader>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            <CardContent>
              <ExpandedDetails entry={entry} />
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
