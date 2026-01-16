# Change Log Explorer Project

## Overview

Create a new project page (`/projects/changelog`) that visualizes completed work from the kanban board's changelog and archive. Rich, expandable cards show PR details, plan files, and completion history in a visually engaging way.

## Data Sources

1. **`public/data/roadmap-archive.json`** - Older completed items (auto-archived when changelog > 10)
2. **`public/data/roadmap-board.json`** - Current changelog column (most recent completions)

## Design Goals

- **Blog-style cards** - Larger, more descriptive cards similar to blog post previews
- **Expandable details** - Click to reveal plan file content, PR descriptions, full history
- **Easy navigation** - Direct links to PRs, plan docs, and related resources
- **Timeline view** - Visual representation of when work was completed

## UI Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Change Log Explorer                                            │
│  A history of completed work on this site                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Filter: All | Features | Bug Fixes | Infrastructure]          │
│  [Sort: Newest | Oldest]                                        │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Error Budget Burndown                     Jan 17, 2026 │   │
│  │  ─────────────────────────────────────────────────────  │   │
│  │  Visualize how quickly you're consuming error budget.   │   │
│  │  Input SLO target + incident history to see burn rate.  │   │
│  │                                                         │   │
│  │  [PR #136] [SRE] [Calculator]                          │   │
│  │                                                         │   │
│  │  ▼ View Details                                        │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │  Plan: docs/plans/26-error-budget-burndown.md   │   │   │
│  │  │  ─────────────────────────────────────────────  │   │   │
│  │  │  [Rendered plan content or summary]             │   │   │
│  │  │                                                 │   │   │
│  │  │  Checklist (8/8 complete):                      │   │   │
│  │  │  ✓ Create ErrorBudgetBurndown component         │   │   │
│  │  │  ✓ Add to project registry with route           │   │   │
│  │  │  ...                                            │   │   │
│  │  │                                                 │   │   │
│  │  │  History:                                       │   │   │
│  │  │  • Jan 16 04:30 → To Do                         │   │   │
│  │  │  • Jan 16 05:00 → In Progress                   │   │   │
│  │  │  • Jan 17 14:00 → Change Log                    │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Preview Deployments                       Jan 16, 2026 │   │
│  │  ...                                                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Implementation

### 1. Create Data Hook

```typescript
// src/hooks/useChangelogData.ts
interface ChangelogEntry {
  id: string;
  title: string;
  description: string;
  labels: string[];
  checklist?: ChecklistItem[];
  history?: HistoryEntry[];
  planFile?: string;
  createdAt: string;
  completedAt: string; // Derived from last history entry
}

export function useChangelogData() {
  // Fetch both archive and current changelog
  // Merge, deduplicate, sort by completion date
  // Return unified list of entries
}
```

### 2. Create ChangelogExplorer Component

```typescript
// src/components/projects/changelog-explorer/ChangelogExplorer.tsx
export function ChangelogExplorer() {
  const { entries, isLoading } = useChangelogData();
  const [filter, setFilter] = useState<string>('all');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  return (
    <div className="space-y-6">
      <FilterControls filter={filter} onFilterChange={setFilter} />
      {entries.map(entry => (
        <ChangelogCard
          key={entry.id}
          entry={entry}
          expanded={expanded.has(entry.id)}
          onToggle={() => toggleExpanded(entry.id)}
        />
      ))}
    </div>
  );
}
```

### 3. Create ChangelogCard Component

```typescript
// src/components/projects/changelog-explorer/ChangelogCard.tsx
interface ChangelogCardProps {
  entry: ChangelogEntry;
  expanded: boolean;
  onToggle: () => void;
}

export function ChangelogCard({ entry, expanded, onToggle }: ChangelogCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader onClick={onToggle} className="cursor-pointer">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{entry.title}</CardTitle>
            <CardDescription>{entry.description}</CardDescription>
          </div>
          <span className="text-sm text-muted-foreground">
            {formatDate(entry.completedAt)}
          </span>
        </div>
        <div className="flex gap-2 mt-2">
          {entry.labels.map(label => (
            <LabelBadge key={label} label={label} />
          ))}
        </div>
      </CardHeader>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
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
```

### 4. Create ExpandedDetails Component

Shows:
- Plan file content (fetched and rendered as markdown)
- Checklist with completion status
- History timeline
- Links to PRs (with GitHub API integration for status)

### 5. Add to Project Registry

```typescript
// src/lib/projects.ts
{
  slug: 'changelog',
  title: 'Change Log Explorer',
  description: 'Browse the history of completed work on this site with expandable details, PR links, and plan files.',
  tags: ['Meta', 'History', 'Documentation'],
  status: 'active',
  createdAt: '2026-01',
}
```

## Implementation Checklist

- [ ] Create useChangelogData hook to fetch and merge data
- [ ] Create ChangelogExplorer main component
- [ ] Create ChangelogCard with expand/collapse animation
- [ ] Create ExpandedDetails with plan rendering
- [ ] Add filter controls (by label type)
- [ ] Add PR link badges with GitHub status integration
- [ ] Add to project registry with route
- [ ] Mobile responsive layout
- [ ] Loading skeletons

## Technical Notes

- Reuse existing `LabelBadge` component from kanban
- Reuse `Card` components from ui library
- Consider lazy loading plan file content on expand
- PR status can reuse logic from kanban's PR status indicator

## Future Enhancements

- Search functionality
- Date range filter
- Export to markdown/PDF
- RSS feed of completed items
- Statistics view (items completed per week, etc.)
