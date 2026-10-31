import { vi } from 'vitest';
import fixture from './fixtures/source.json';
import detail171 from './fixtures/detail-171.json';
import waiting9006 from './fixtures/waiting-9006.json';
import entryHtml from './fixtures/rating-entry-446-9006.html?raw';
import ratedHtml from './fixtures/rating-rated-446-6059.html?raw';
import notRatedHtml from './fixtures/rating-notrated-446-9006.html?raw';

const json = (body) => ({ ok: true, status: 200, json: async () => body });

/**
 * Fake kg.sofia.bg for detail requests: kindergarten 171, the waiting list of
 * group 9006 and its ranking 446. Everything else is a 404.
 */
export function fakeDetailSource() {
  return vi.fn(async (url) => {
    const path = new URL(url).pathname.replace('/api', '');
    if (path === '/public/0/dz/171') return json({ items: structuredClone(detail171) });
    if (path.startsWith('/public/0/dz/')) return json({ items: { schoolYear: '2026/2027' } });
    if (path === '/stat-rating/waiting/9006') return json({ items: structuredClone(waiting9006) });
    if (path === '/stat-rating/entry/446/9006') return json({ content: entryHtml });
    if (path === '/stat-rating/rated/446/9006') return json({ content: ratedHtml });
    if (path === '/stat-rating/not-rated/446/9006') return json({ content: notRatedHtml });
    return { ok: false, status: 404, json: async () => ({}) };
  });
}

/** Trimmed real responses captured from kg.sofia.bg (9 kindergartens, 4 districts). */
export function loadSourceFixture() {
  return structuredClone(fixture);
}

/**
 * A fake fetch that answers source URLs from the fixture. Detail pages are
 * answered from `details` (id → raw `items`); unknown ids get a 404.
 */
export function fakeSourceFetch(fixture = loadSourceFixture(), details = { 171: detail171 }) {
  return async (url) => {
    const path = new URL(url).pathname;
    const detailId = /\/public\/0\/dz\/(\d+)$/.exec(path)?.[1];
    if (detailId) {
      const items = details[detailId];
      if (!items) return { ok: false, status: 404, json: async () => ({}) };
      return { ok: true, status: 200, json: async () => ({ items: structuredClone(items) }) };
    }
    let body;
    if (path.endsWith('/nomenclature/regions')) body = fixture.regions;
    else {
      const group = path.split('/').pop();
      body = { items: { kinderGardens: fixture.groups[group] ?? [] } };
    }
    return { ok: true, status: 200, json: async () => body };
  };
}
