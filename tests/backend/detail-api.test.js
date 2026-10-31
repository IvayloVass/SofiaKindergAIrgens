import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import detailFixture from '../fixtures/detail-171.json';
import waitingFixture from '../fixtures/waiting-9006.json';
import entryHtml from '../fixtures/rating-entry-446-9006.html?raw';
import ratedHtml from '../fixtures/rating-rated-446-6059.html?raw';
import notRatedHtml from '../fixtures/rating-notrated-446-9006.html?raw';
import { openDatabase } from '@kg/database';
import { createServer } from '../../backend/src/server.js';
import { syncNow } from '../../backend/src/sync.js';
import { cached } from '../../backend/src/cache.js';
import { fakeSourceFetch } from '../helpers.js';

const json = (body) => ({ ok: true, status: 200, json: async () => body });

/** Fake kg.sofia.bg for detail requests. */
function fakeDetailSource() {
  return vi.fn(async (url) => {
    const path = new URL(url).pathname.replace('/api', '');
    if (path === '/public/0/dz/171') return json({ items: structuredClone(detailFixture) });
    if (path.startsWith('/public/0/dz/')) return json({ items: { schoolYear: '2026/2027' } });
    if (path === '/stat-rating/waiting/9006') return json({ items: structuredClone(waitingFixture) });
    if (path === '/stat-rating/entry/446/9006') return json({ content: entryHtml });
    if (path === '/stat-rating/rated/446/9006') return json({ content: ratedHtml });
    if (path === '/stat-rating/not-rated/446/9006') return json({ content: notRatedHtml });
    return { ok: false, status: 404, json: async () => ({}) };
  });
}

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
