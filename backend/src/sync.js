import { fileURLToPath } from 'node:url';
import { countKindergartens, getMeta, openDatabase, replaceAll, setMeta } from '@kg/database';
import { DB_PATH, MAX_DATA_AGE_MS } from './config.js';
import { fetchSourceData } from './source.js';
import { normalize } from './normalize.js';

/** Downloads fresh data and stores it. Returns the number of kindergartens saved. */
export async function syncNow(db, { fetchImpl = fetch, now = () => new Date() } = {}) {
  const data = normalize(await fetchSourceData(fetchImpl));
  if (data.kindergartens.length === 0) {
    throw new Error('Source returned no kindergartens; keeping existing data.');
  }
  replaceAll(db, data);
  setMeta(db, 'lastSyncedAt', now().toISOString());
  return data.kindergartens.length;
}

/** True when the database is empty or older than maxAgeMs. */
export function isStale(db, { maxAgeMs = MAX_DATA_AGE_MS, now = () => new Date() } = {}) {
  if (countKindergartens(db) === 0) return true;
  const last = Date.parse(getMeta(db, 'lastSyncedAt') ?? '');
  return Number.isNaN(last) || now().getTime() - last > maxAgeMs;
}

/**
 * Syncs only when needed. If the source is down but we already have data,
 * we keep serving the old data instead of failing.
 */
export async function syncIfStale(db, options = {}) {
  if (!isStale(db, options)) return { synced: false };
  try {
    const count = await syncNow(db, options);
    return { synced: true, count };
  } catch (error) {
    if (countKindergartens(db) > 0) return { synced: false, error };
    throw error;
  }
}

// CLI: `npm run sync` forces a fresh download.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const db = openDatabase(DB_PATH);
  const force = process.argv.includes('--force');
  const run = force ? syncNow(db).then((count) => ({ synced: true, count })) : syncIfStale(db);
  run
    .then((r) => console.log(r.synced ? `Synced ${r.count} kindergartens.` : 'Data is fresh, nothing to do.'))
    .catch((err) => {
      console.error('Sync failed:', err.message);
      process.exitCode = 1;
    })
    .finally(() => db.close());
}
