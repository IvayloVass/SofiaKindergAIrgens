import { useCallback, useEffect, useState } from 'react';

function readUrl() {
  const params = new URLSearchParams(window.location.search);
  return {
    query: params.get('q') ?? '',
    regions: (params.get('regions') ?? '').split(',').filter(Boolean),
    view: params.get('view') === 'compare' ? 'compare' : 'list',
    sort: params.get('sort') === 'region' ? 'region' : 'name',
  };
}

function writeUrl(state) {
  const params = new URLSearchParams();
  if (state.query) params.set('q', state.query);
  if (state.regions.length) params.set('regions', state.regions.join(','));
  if (state.view !== 'list') params.set('view', state.view);
  if (state.sort !== 'name') params.set('sort', state.sort);
  const search = params.toString();
  const url = `${window.location.pathname}${search ? `?${search}` : ''}${window.location.hash}`;
  // Keep history.state: it holds the saved scroll position used when coming back.
  window.history.replaceState(window.history.state, '', url);
}

/**
 * Filter/search/view state that lives in the URL, so a page reload or a
 * shared link restores exactly what the user was looking at.
 */
export function useUrlState() {
  const [state, setState] = useState(readUrl);

  useEffect(() => writeUrl(state), [state]);

  useEffect(() => {
    const onPop = () => setState(readUrl());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const update = useCallback((patch) => setState((s) => ({ ...s, ...patch })), []);

  const toggleRegion = useCallback(
    (id) =>
      setState((s) => ({
        ...s,
        regions: s.regions.includes(id) ? s.regions.filter((r) => r !== id) : [...s.regions, id],
      })),
    [],
  );

  return { ...state, update, toggleRegion };
}
