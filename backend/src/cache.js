import { getCached, setCached } from '@kg/database';

const inFlight = new Map();

/**
 * Returns cached data when it is fresh; otherwise loads it, stores it and
 * returns it. If loading fails but older data exists, the older data is returned
 * with `stale: true` so the page still works while the source is down.
 * A `null` result from the loader means "not found" and is not cached.
 */
export async function cached(db, key, ttlMs, loader, { now = Date.now } = {}) {
  const hit = getCached(db, key);
  if (hit && now() - hit.fetchedAt < ttlMs) return { data: hit.data, fetchedAt: hit.fetchedAt, stale: false };

  // Several visitors opening the same page at once share one upstream request.
  if (!inFlight.has(key)) {
    inFlight.set(
      key,
      (async () => {
        try {
          const data = await loader();
          if (data == null) return { data: null };
          const fetchedAt = now();
          setCached(db, key, data, fetchedAt);
          return { data, fetchedAt, stale: false };
        } finally {
          inFlight.delete(key);
        }
      })(),
    );
  }

  try {
    return await inFlight.get(key);
  } catch (error) {
    if (hit) return { data: hit.data, fetchedAt: hit.fetchedAt, stale: true };
    throw error;
  }
}
