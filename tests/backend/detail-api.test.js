import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { openDatabase } from '@kg/database';
import { createServer } from '../../backend/src/server.js';
import { syncNow } from '../../backend/src/sync.js';
import { cached } from '../../backend/src/cache.js';
import { fakeDetailSource, fakeSourceFetch } from '../helpers.js';

describe('detail API', () => {
  let server;
  let base;

  beforeAll(async () => {
    const db = openDatabase(':memory:');
    await syncNow(db, { fetchImpl: fakeSourceFetch() });
    server = createServer(db, { fetchImpl: fakeDetailSource() });
    await new Promise((resolve) => server.listen(0, resolve));
    base = `http://localhost:${server.address().port}`;
  });

  afterAll(() => server?.close());

  const get = async (path) => {
    const res = await fetch(base + path);
    return { status: res.status, body: await res.json() };
  };

  it('GET /api/kindergartens/:id returns details merged with list data', async () => {
    const { status, body } = await get('/api/kindergartens/171');
    expect(status).toBe(200);
    expect(body).toMatchObject({ id: 171, director: 'Боряна Ковачева', regionId: '03', hasNursery: true, stale: false });
    expect(body.groups).toHaveLength(5);
  });

  it('GET waiting list for a group of this kindergarten', async () => {
    const { status, body } = await get('/api/kindergartens/171/groups/9006/waiting');
    expect(status).toBe(200);
    expect(body.lists[0].entries[0].applicationNumber).toBe('24018148');
  });

  it('GET ranking returns all three stages for a known ranking date', async () => {
    const { status, body } = await get('/api/kindergartens/171/groups/9006/rankings/446');
    expect(status).toBe(200);
    expect(body).toMatchObject({ ratingId: 446, groupId: 9006, date: '2026-10-15T21:00:00.000+00:00' });
    expect(body.rated.heading).toBe('КЛАСИРАНЕ НА 16.10.2026');
    expect(body.entry.sections[2].entries).toHaveLength(5);
    expect(body.notRated.sections).toHaveLength(3);
  });

  it('refuses groups that belong to another kindergarten', async () => {
    expect((await get('/api/kindergartens/171/groups/6059/waiting')).status).toBe(404);
  });
});

describe('cached()', () => {
  it('serves stale data when the source fails', async () => {
    const db = openDatabase(':memory:');
    let now = 1_000;
    const opts = { now: () => now };
    const ok = vi.fn(async () => ({ v: 1 }));
    expect(await cached(db, 'k', 100, ok, opts)).toEqual({ data: { v: 1 }, fetchedAt: 1_000, stale: false });

    now = 2_000; // expired
    const failing = async () => {
      throw new Error('down');
    };
    expect(await cached(db, 'k', 100, failing, opts)).toEqual({ data: { v: 1 }, fetchedAt: 1_000, stale: true });
  });
});
