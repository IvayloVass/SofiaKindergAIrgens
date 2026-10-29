import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { searchableText } from '../utils/search.js';

/** Loads kindergartens, districts and sync info once. */
export function useKindergartens() {
  const [state, setState] = useState({ status: 'loading', kindergartens: [], regions: [], meta: null, error: null });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, status: 'loading', error: null }));
    try {
      const [kindergartens, regions, meta] = await Promise.all([
        api.kindergartens(),
        api.regions(),
        api.meta().catch(() => null),
      ]);
      // Precompute the search text once instead of on every keystroke.
      const prepared = kindergartens.map((k) => ({ ...k, _search: searchableText(k) }));
      setState({ status: 'ready', kindergartens: prepared, regions, meta, error: null });
    } catch (error) {
      setState((s) => ({ ...s, status: 'error', error }));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, reload: load };
}
