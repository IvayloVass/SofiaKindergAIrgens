import { beforeEach, describe, expect, it, vi } from 'vitest';
import { countKindergartens, getMeta, openDatabase } from '@kg/database';
import { isStale, syncIfStale, syncNow } from '../../backend/src/sync.js';
import { fakeSourceFetch } from '../helpers.js';

const DAY = 24 * 60 * 60 * 1000;
const at = (iso) => () => new Date(iso);

describe('sync', () => {
  let db;
  beforeEach(() => {
    db = openDatabase(':memory:');
  });

  it('syncNow stores the data and the sync time', async () => {
    const count = await syncNow(db, { fetchImpl: fakeSourceFetch(), now: at('2026-10-01T10:00:00Z') });
    expect(count).toBe(9);
    expect(countKindergartens(db)).toBe(9);
    expect(getMeta(db, 'lastSyncedAt')).toBe('2026-10-01T10:00:00.000Z');
  });

  it('isStale is true when empty, false when fresh, true when old', async () => {
    expect(isStale(db)).toBe(true);
    await syncNow(db, { fetchImpl: fakeSourceFetch(), now: at('2026-10-01T10:00:00Z') });
    expect(isStale(db, { now: at('2026-10-01T20:00:00Z'), maxAgeMs: DAY })).toBe(false);
    expect(isStale(db, { now: at('2026-10-02T11:00:00Z'), maxAgeMs: DAY })).toBe(true);
  });

  it('syncIfStale skips the download when data is fresh', async () => {
    await syncNow(db, { fetchImpl: fakeSourceFetch(), now: at('2026-10-01T10:00:00Z') });
    const fetchImpl = vi.fn(fakeSourceFetch());
    const result = await syncIfStale(db, { fetchImpl, now: at('2026-10-01T11:00:00Z') });
    expect(result).toEqual({ synced: false });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('keeps serving old data when the source is down', async () => {
    await syncNow(db, { fetchImpl: fakeSourceFetch(), now: at('2026-10-01T10:00:00Z') });
    const failing = async () => ({ ok: false, status: 503 });
    const result = await syncIfStale(db, { fetchImpl: failing, now: at('2026-10-05T10:00:00Z') });
    expect(result.synced).toBe(false);
    expect(result.error.message).toMatch(/503/);
    expect(countKindergartens(db)).toBe(9);
  });

  it('throws when the source is down and there is no data yet', async () => {
    const failing = async () => ({ ok: false, status: 503 });
    await expect(syncIfStale(db, { fetchImpl: failing })).rejects.toThrow(/503/);
  });

  it('refuses to wipe data when the source returns an empty list', async () => {
    const empty = fakeSourceFetch({ regions: [], groups: {} });
    await expect(syncNow(db, { fetchImpl: empty })).rejects.toThrow(/no kindergartens/);
  });
});
