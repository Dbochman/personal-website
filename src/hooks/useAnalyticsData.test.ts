import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useAnalyticsData } from './useAnalyticsData';

function mockReports(timestamp: string | null, missingLatest = false) {
  vi.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-10-31T12:00:00Z'));
  vi.stubGlobal('fetch', vi.fn(async (url: string) => ({
    ok: !(missingLatest && url === '/metrics/latest.json'),
    status: missingLatest && url === '/metrics/latest.json' ? 404 : 200,
    json: async () => url === '/metrics/ga4-history.json' && timestamp ? [{
      timestamp,
      date: timestamp.slice(0, 10),
      period: { endDate: '2026-10-19' },
      topPages: [],
    }] : [],
  })));
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('traffic report freshness', () => {
  it('warns about stale reports and preserves missing-file warnings', async () => {
    mockReports('2026-10-21T10:56:57Z', true);
    const { result } = renderHook(() => useAnalyticsData());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.warning).toContain('latest.json');
    expect(result.current.warning).toContain('last collected 2026-10-21, covering visits through 2026-10-19');
    expect(result.current.ga4History).toHaveLength(1);
  });

  it('uses collection time rather than the deliberately lagging reporting window', async () => {
    mockReports('2026-10-31T10:00:00Z');
    const { result } = renderHook(() => useAnalyticsData());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.warning).toBeNull();
  });

  it('distinguishes missing traffic reports from zero visits', async () => {
    mockReports(null);
    const { result } = renderHook(() => useAnalyticsData());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.warning).toContain('No traffic reports available');
  });
});
