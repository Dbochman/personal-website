import { useState, useEffect } from 'react';
import type { PrStatus } from '@/types/kanban';

const REPO_OWNER = 'Dbochman';
const REPO_NAME = 'personal-website';
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

interface CacheEntry {
  status: PrStatus | null;
  timestamp: number;
}

interface CheckRun {
  status: 'queued' | 'in_progress' | 'completed';
  conclusion: 'success' | 'failure' | 'neutral' | 'cancelled' | 'skipped' | 'timed_out' | 'action_required' | null;
}

interface CheckRunsResponse {
  total_count: number;
  check_runs: CheckRun[];
}

interface PrResponse {
  head: {
    sha: string;
  };
}

// Module-level cache shared across all hook instances
const cache = new Map<number, CacheEntry>();

function getCachedStatus(prNumber: number): PrStatus | null {
  const entry = cache.get(prNumber);
  if (!entry) return null;

  const isExpired = Date.now() - entry.timestamp > CACHE_TTL;
  if (isExpired) {
    cache.delete(prNumber);
    return null;
  }

  return entry.status;
}

function setCachedStatus(prNumber: number, status: PrStatus | null): void {
  cache.set(prNumber, { status, timestamp: Date.now() });
}

async function fetchPrStatus(prNumber: number): Promise<PrStatus | null> {
  try {
    // First, get the PR to find the head SHA
    const prResponse = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/pulls/${prNumber}`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    );

    if (!prResponse.ok) {
      if (prResponse.status === 404) {
        // PR not found - hide indicator rather than show misleading status
        return null;
      }
      if (prResponse.status === 403) {
        console.warn('GitHub API rate limit reached');
      }
      // Rate limited or other error - hide indicator
      return null;
    }

    const prData: PrResponse = await prResponse.json();
    const sha = prData.head.sha;

    // Now fetch the check runs for that commit
    const checksResponse = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits/${sha}/check-runs`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    );

    if (!checksResponse.ok) {
      // Error fetching checks - hide indicator
      return null;
    }

    const checksData: CheckRunsResponse = await checksResponse.json();

    if (checksData.total_count === 0) {
      // No checks configured - hide indicator
      return null;
    }

    // Determine overall status
    const hasFailure = checksData.check_runs.some(
      (run) => run.conclusion === 'failure' || run.conclusion === 'timed_out'
    );
    if (hasFailure) {
      return 'failing';
    }

    const hasPending = checksData.check_runs.some(
      (run) => run.status === 'queued' || run.status === 'in_progress'
    );
    if (hasPending) {
      return 'pending';
    }

    // All checks completed successfully (success, neutral, skipped)
    return 'passing';
  } catch (error) {
    console.error('Error fetching PR status:', error);
    // Network error - hide indicator
    return null;
  }
}

export interface UsePrStatusResult {
  status: PrStatus | null;
  loading: boolean;
}

export function usePrStatus(prNumber: number | null): UsePrStatusResult {
  const [status, setStatus] = useState<PrStatus | null>(() => {
    if (prNumber === null) return null;
    return getCachedStatus(prNumber);
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (prNumber === null) {
      setStatus(null);
      setLoading(false);
      return;
    }

    // Check cache first
    const cached = getCachedStatus(prNumber);
    if (cached) {
      setStatus(cached);
      setLoading(false);
      return;
    }

    // Fetch from API
    let cancelled = false;
    setLoading(true);

    fetchPrStatus(prNumber).then((newStatus) => {
      if (!cancelled) {
        setCachedStatus(prNumber, newStatus);
        setStatus(newStatus);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [prNumber]);

  return { status, loading };
}
