import { useCallback, useEffect, useState } from 'react';

// Responses kept for this browser session, so going back and forth is instant.
const memory = new Map();

export function clearApiMemory() {
  memory.clear();
}

/**
 * Loads JSON from `url` (skip with url = null).
 * Returns { status: 'idle'|'loading'|'ready'|'error'|'notfound', data, error, reload }.
 */
export function useApi(url) {
  const [state, setState] = useState(() =>
    url && memory.has(url) ? { status: 'ready', data: memory.get(url), error: null } : { status: url ? 'loading' : 'idle', data: null, error: null },
  );

  const load = useCallback(
    async (signal) => {
      if (!url) return setState({ status: 'idle', data: null, error: null });
      if (memory.has(url)) return setState({ status: 'ready', data: memory.get(url), error: null });
      setState({ status: 'loading', data: null, error: null });
      try {
        const res = await fetch(url, { headers: { Accept: 'application/json' }, signal });
        if (res.status === 404) return setState({ status: 'notfound', data: null, error: null });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error || `Грешка ${res.status}`);
        memory.set(url, body);
        setState({ status: 'ready', data: body, error: null });
      } catch (error) {
        if (error.name !== 'AbortError') setState({ status: 'error', data: null, error });
      }
    },
    [url],
  );

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const reload = useCallback(() => {
    memory.delete(url);
    load();
  }, [url, load]);

  return { ...state, reload };
}
