import { fileURLToPath } from 'node:url';
import {
  countKindergartens,
  getKindergartens,
  getMeta,
  openDatabase,
  replaceAll,
  setCached,
  setMeta,
} from '@kg/database';
import { DB_PATH, MAX_DATA_AGE_MS } from './config.js';
import { fetchKindergartenDetail, fetchSourceData } from './source.js';
import { normalize } from './normalize.js';
import { normalizeDetail } from './details.js';

/** How many detail requests run at the same time (be gentle with kg.sofia.bg). */
const DETAIL_CONCURRENCY = 4;

/** Places in the current school year, summed over all groups of one kindergarten. */
export function placesOf(detail) {
  const sum = (key) => detail.groups.reduce((acc, g) => acc + g.totals[key], 0);
  return { capacity: sum('capacity'), enrolled: sum('enrolled'), free: sum('free') };
}

/** Runs `fn` for every item, at most `limit` at a time. */
async function forEachLimited(items, limit, fn) {
  let next = 0;
  const worker = async () => {
    while (next < items.length) await fn(items[next++]);
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
}

/**
 * Adds `places` to every kindergarten from its detail page. The detail is also
 * stored in the detail cache, so detail pages open fast after a sync.
 * When one detail cannot be loaded, the previously stored places are kept.
 */
async function attachPlaces(db, kindergartens, fetchImpl, now) {
  const previous = new Map(getKindergartens(db).map((k) => [k.id, k.places]));
  await forEachLimited(kindergartens, DETAIL_CONCURRENCY, async (k) => {
    try {
      const detail = normalizeDetail(await fetchKindergartenDetail(k.id, fetchImpl));
      if (!detail) throw new Error('no details');
      setCached(db, `detail:${k.id}`, detail, now().getTime());
      k.places = placesOf(detail);
    } catch {
      k.places = previous.get(k.id) ?? null;
    }
  });
}

/** Downloads fresh data and stores it. Returns the number of kindergartens saved. */
export async function syncNow(db, { fetchImpl = fetch, now = () => new Date() } = {}) {
  const data = normalize(await fetchSourceData(fetchImpl));
  if (data.kindergartens.length === 0) {
    throw new Error('Source returned no kindergartens; keeping existing data.');
  }
  await attachPlaces(db, data.kindergartens, fetchImpl, now);
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
