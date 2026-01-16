import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { subDays } from 'date-fns';
import { Filter, SortDesc, SortAsc, Calendar } from 'lucide-react';
import { useChangelogData } from '@/hooks/useChangelogData';
import { ChangelogCard } from './ChangelogCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

type SortOrder = 'newest' | 'oldest';
type DateRange = 'all' | '7d' | '30d' | '90d' | '365d';

const DATE_RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: 'all', label: 'All time' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '365d', label: 'Last year' },
];

// Skeleton loader for cards
function CardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-6 space-y-3 animate-pulse">
      <div className="flex justify-between">
        <div className="space-y-2 flex-1">
          <div className="h-5 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-1/2" />
        </div>
        <div className="h-4 bg-muted rounded w-24" />
      </div>
      <div className="flex gap-2">
        <div className="h-5 bg-muted rounded w-16" />
        <div className="h-5 bg-muted rounded w-20" />
        <div className="h-5 bg-muted rounded w-12" />
      </div>
    </div>
  );
}

export function ChangelogExplorer() {
  // Get board ID from URL params (default to 'roadmap')
  const [boardId, setBoardId] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('board') || 'roadmap';
    }
    return 'roadmap';
  });

  // Update boardId if URL changes (e.g., navigation)
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      setBoardId(params.get('board') || 'roadmap');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const { entries, isLoading, error, allLabels } = useChangelogData(boardId);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selectedLabels, setSelectedLabels] = useState<Set<string>>(new Set());
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [dateRange, setDateRange] = useState<DateRange>('all');

  // Toggle card expansion
  const toggleExpanded = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Toggle label filter
  const toggleLabel = useCallback((label: string) => {
    setSelectedLabels((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSelectedLabels(new Set());
    setDateRange('all');
  }, []);

  // Check if any filters are active
  const hasActiveFilters = selectedLabels.size > 0 || dateRange !== 'all';

  // Get the cutoff date for the selected range
  const getDateCutoff = useCallback((range: DateRange): Date | null => {
    const now = new Date();
    switch (range) {
      case '7d':
        return subDays(now, 7);
      case '30d':
        return subDays(now, 30);
      case '90d':
        return subDays(now, 90);
      case '365d':
        return subDays(now, 365);
      default:
        return null;
    }
  }, []);

  // Filter and sort entries
  const filteredEntries = useMemo(() => {
    let result = entries;

    // Apply date filter
    const cutoff = getDateCutoff(dateRange);
    if (cutoff) {
      result = result.filter((entry) => new Date(entry.completedAt) >= cutoff);
    }

    // Apply label filter
    if (selectedLabels.size > 0) {
      result = result.filter((entry) =>
        entry.labels.some((label) => selectedLabels.has(label))
      );
    }

    // Apply sort
    result = [...result].sort((a, b) => {
      const dateA = new Date(a.completedAt).getTime();
      const dateB = new Date(b.completedAt).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [entries, selectedLabels, sortOrder, dateRange, getDateCutoff]);

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        Failed to load changelog: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and sort */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Label filter dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="w-4 h-4" />
              Filter
              {selectedLabels.size > 0 && (
                <Badge variant="secondary" className="ml-1 px-1.5 py-0">
                  {selectedLabels.size}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48 max-h-64 overflow-y-auto">
            {allLabels.map((label) => (
              <DropdownMenuCheckboxItem
                key={label}
                checked={selectedLabels.has(label)}
                onCheckedChange={() => toggleLabel(label)}
              >
                {label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Date range filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Calendar className="w-4 h-4" />
              {DATE_RANGE_OPTIONS.find((o) => o.value === dateRange)?.label || 'All time'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Date Range</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
              {DATE_RANGE_OPTIONS.map((option) => (
                <DropdownMenuRadioItem key={option.value} value={option.value}>
                  {option.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Sort toggle */}
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => setSortOrder((prev) => (prev === 'newest' ? 'oldest' : 'newest'))}
        >
          {sortOrder === 'newest' ? (
            <>
              <SortDesc className="w-4 h-4" />
              Newest
            </>
          ) : (
            <>
              <SortAsc className="w-4 h-4" />
              Oldest
            </>
          )}
        </Button>

        {/* Active filters */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Showing:</span>
            {dateRange !== 'all' && (
              <Badge
                variant="secondary"
                className="cursor-pointer hover:bg-destructive/20"
                onClick={() => setDateRange('all')}
              >
                {DATE_RANGE_OPTIONS.find((o) => o.value === dateRange)?.label} &times;
              </Badge>
            )}
            {Array.from(selectedLabels).map((label) => (
              <Badge
                key={label}
                variant="secondary"
                className="cursor-pointer hover:bg-destructive/20"
                onClick={() => toggleLabel(label)}
              >
                {label} &times;
              </Badge>
            ))}
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear all
            </Button>
          </div>
        )}

        {/* Results count */}
        <div className="ml-auto text-sm text-muted-foreground">
          {isLoading ? 'Loading...' : `${filteredEntries.length} items`}
        </div>
      </div>

      {/* Cards list */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {hasActiveFilters
            ? 'No items match the selected filters'
            : 'No changelog entries found'}
        </div>
      ) : (
        <motion.div
          className="space-y-4"
          initial="hidden"
          animate="visible"
          variants={{
            visible: {
              transition: {
                staggerChildren: 0.05,
              },
            },
          }}
        >
          {filteredEntries.map((entry) => (
            <motion.div
              key={entry.id}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              <ChangelogCard
                entry={entry}
                expanded={expanded.has(entry.id)}
                onToggle={() => toggleExpanded(entry.id)}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
