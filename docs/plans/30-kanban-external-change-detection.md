# Kanban External Change Detection

## Overview

Detect when the kanban board is updated externally (e.g., by Claude commits) and show a toast notification with a reload button. This prevents save conflicts when the user has stale data.

## Current State

- Board data loaded from `/data/{boardId}-board.json` on mount
- `baseUpdatedAt` tracks the timestamp used for conflict detection on save
- No polling or refresh mechanisms exist
- Toast notifications available via Sonner (preferred) or Radix toast

## Design

### Detection Strategy

1. **On tab focus**: Check when user returns to the tab (visibility change)
2. **Periodic polling**: Every 60 seconds while tab is visible
3. **Pause when hidden**: Don't poll when tab is not visible (save bandwidth)

### Check Logic

```
fetch board JSON → compare updatedAt to baseUpdatedAt → if different, show toast
```

### User Experience

- Toast appears with message: "Board was updated externally"
- Action button: "Reload" - refreshes board data
- Dismiss option available (user may want to continue with local changes)
- Don't show toast if user has unsaved changes AND board is dirty (complex merge scenario)

## Implementation

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/projects/kanban/KanbanBoard.tsx` | Add external change detection logic |

### Code Changes

Add to `KanbanBoard.tsx`:

```typescript
import { toast } from 'sonner';

// Inside KanbanBoard component:

// Track if we've already shown a toast for the current external change
const [externalChangeDetected, setExternalChangeDetected] = useState(false);

// Soft reload - fetch new data and update state in place
const handleSoftReload = useCallback(async () => {
  try {
    const res = await fetch(`/data/${boardId}-board.json`);
    if (!res.ok) throw new Error('Failed to fetch');
    const data = await res.json();

    setBoard(data);
    setBaseUpdatedAt(data.updatedAt || new Date().toISOString());
    setIsDirty(false);
    setExternalChangeDetected(false);

    toast.success('Board reloaded');
  } catch (err) {
    toast.error('Failed to reload board');
  }
}, [boardId]);

// Check for external changes
const checkForExternalChanges = useCallback(async () => {
  // Don't check if we've already detected a change
  if (externalChangeDetected) return;

  try {
    const res = await fetch(`/data/${boardId}-board.json`);
    if (!res.ok) return;

    const data = await res.json();
    const remoteUpdatedAt = data.updatedAt;

    // If remote is newer than our base, external change detected
    if (remoteUpdatedAt && remoteUpdatedAt !== baseUpdatedAt) {
      setExternalChangeDetected(true);

      toast('Board was updated externally', {
        id: 'external-change', // Prevent duplicate toasts
        description: isDirty
          ? 'You have unsaved changes that will be discarded.'
          : 'Click reload to get the latest version.',
        action: {
          label: 'Reload',
          onClick: handleSoftReload,
        },
        duration: Infinity, // Don't auto-dismiss
      });
    }
  } catch (err) {
    // Silently fail - don't disrupt user
    console.debug('External change check failed:', err);
  }
}, [boardId, baseUpdatedAt, isDirty, externalChangeDetected, handleSoftReload]);

// Set up polling and visibility detection
useEffect(() => {
  // Poll every 60 seconds while visible
  let intervalId: ReturnType<typeof setInterval> | null = null;

  const startPolling = () => {
    if (!intervalId) {
      intervalId = setInterval(checkForExternalChanges, 60000);
    }
  };

  const stopPolling = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };

  // Handle visibility change
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      checkForExternalChanges(); // Check immediately on focus
      startPolling();
    } else {
      stopPolling();
    }
  };

  // Start polling if visible
  if (document.visibilityState === 'visible') {
    startPolling();
  }

  document.addEventListener('visibilitychange', handleVisibilityChange);

  return () => {
    stopPolling();
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}, [checkForExternalChanges]);
```

**Key design decisions:**
- Uses soft reload to preserve scroll position and UI state
- Toast ID prevents duplicate notifications
- `externalChangeDetected` flag prevents repeated checks after showing toast
- Different message if user has unsaved changes

## Edge Cases

1. **User has unsaved changes**: Show toast but warn that reload will discard changes
2. **Multiple toasts**: Use toast ID to prevent duplicate notifications
3. **Network errors**: Silently fail, don't disrupt user experience
4. **Race condition on save**: After successful save, update `baseUpdatedAt` to prevent false positive

## Checklist

- [ ] Add `checkForExternalChanges` callback
- [ ] Add visibility change listener and 60s polling
- [ ] Show Sonner toast with reload action
- [ ] Use toast ID to prevent duplicates
- [ ] Clean up interval and listener on unmount
- [ ] Test: Make external change, verify toast appears on tab focus
- [ ] Test: Verify polling works every 60s
- [ ] Test: Verify no toast when board unchanged

## Verification

1. Open kanban board in browser
2. Manually edit `public/data/roadmap-board.json` and change `updatedAt`
3. Switch to another tab, then back - toast should appear
4. Wait 60s without switching tabs - toast should appear
5. Click "Reload" - board should refresh with new data
6. Verify no duplicate toasts appear
