import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigationType, useSearchParams } from 'react-router-dom';
import type { SimConfig } from './simulation';
import { configsEqual, parseConfig, toolParamsKey, writeConfig } from './url-state';

export const URL_SYNC_DELAY_MS = 150;

/**
 * Simulator settings mirrored in the URL.
 *
 * Local state keeps sliders responsive; edits are written back with a short
 * debounce using `replace`, so dragging doesn't add history entries. Any
 * navigation the hook didn't make itself (Back/Forward, a link, a typed URL)
 * wins: the pending write is dropped and the controls adopt the new URL.
 * Unrelated parameters such as `theme` (which ThemeContext updates with
 * history.replaceState, outside the router) are read at write time and kept.
 */
export function useUrlConfig() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const [, setSearchParams] = useSearchParams();
  const [config, setConfig] = useState<SimConfig>(() =>
    parseConfig(new URLSearchParams(location.search))
  );

  // Compared by identity: React Router creates a new location per navigation,
  // while `key` can repeat ("default") for entries written outside the router.
  const seenLocation = useRef(location);
  const ownSearch = useRef<string | null>(null);
  // Tool parameters of the URL the current state was derived from or written to.
  const syncedParams = useRef(toolParamsKey(location.search));
  const pendingWrite = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (location === seenLocation.current) return;
    seenLocation.current = location;
    const isOwnWrite = navigationType === 'REPLACE' && ownSearch.current === location.search;
    ownSearch.current = null;
    syncedParams.current = toolParamsKey(location.search);
    if (isOwnWrite) return;

    if (pendingWrite.current) {
      clearTimeout(pendingWrite.current);
      pendingWrite.current = null;
    }
    const next = parseConfig(new URLSearchParams(location.search));
    setConfig((prev) => (configsEqual(prev, next) ? prev : next));
  }, [location, navigationType]);

  useEffect(() => {
    pendingWrite.current = setTimeout(() => {
      pendingWrite.current = null;
      const current = window.location.search;
      // The URL's scenario changed under us (a navigation the router hasn't
      // delivered yet). Let that navigation win instead of overwriting it.
      if (toolParamsKey(current) !== syncedParams.current) return;
      const params = writeConfig(new URLSearchParams(current), config);
      const nextSearch = params.toString() ? `?${params}` : '';
      if (nextSearch === current) return;
      ownSearch.current = nextSearch;
      syncedParams.current = toolParamsKey(nextSearch);
      setSearchParams(params, { replace: true, preventScrollReset: true });
    }, URL_SYNC_DELAY_MS);

    return () => {
      if (pendingWrite.current) {
        clearTimeout(pendingWrite.current);
        pendingWrite.current = null;
      }
    };
  }, [config, setSearchParams]);

  return [config, setConfig] as const;
}
