import { beforeEach, describe, expect, it } from 'vitest';
import { countKindergartens, getKindergartens, openDatabase } from '@kg/database';
import { syncIfStale, syncNow } from '../../backend/src/sync.js';
import { fakeSourceFetch } from '../helpers.js';

const at = (iso) => () => new Date(iso);

describe('sync', () => {
  let db;
  beforeEach(() => {
    db = openDatabase(':memory:');
  });

  it('stores the kindergartens with their places from the detail pages', async () => {
    const count = await syncNow(db, { fetchImpl: fakeSourceFetch(), now: at('2026-10-01T10:00:00Z') });
    expect(count).toBe(9);
    expect(countKindergartens(db)).toBe(9);
    const byId = new Map(getKindergartens(db).map((k) => [k.id, k]));
    expect(byId.get(171).places).toEqual({ capacity: 160, enrolled: 140, free: 18 });
    // No detail page for this one, so its places are unknown.
    expect(byId.get(242).places).toBeNull();
  });

  it('keeps serving old data when the source is down', async () => {
    await syncNow(db, { fetchImpl: fakeSourceFetch(), now: at('2026-10-01T10:00:00Z') });
    const failing = async () => ({ ok: false, status: 503 });
    const result = await syncIfStale(db, { fetchImpl: failing, now: at('2026-10-05T10:00:00Z') });
    expect(result.synced).toBe(false);
    expect(result.error.message).toMatch(/503/);
    expect(countKindergartens(db)).toBe(9);
  });

  it('refuses to wipe data when the source returns an empty list', async () => {
    const empty = fakeSourceFetch({ regions: [], groups: {} });
    await expect(syncNow(db, { fetchImpl: empty })).rejects.toThrow(/no kindergartens/);
  });
});
