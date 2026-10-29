import { normalize } from '../../backend/src/normalize.js';
import { loadSourceFixture } from '../helpers.js';

/** The same records the API would return for the fixture data. */
export function sampleData() {
  const { regions, kindergartens } = normalize(loadSourceFixture());
  const regionsWithCounts = regions
    .map((r) => ({ ...r, count: kindergartens.filter((k) => k.regionId === r.id).length }))
    .sort((a, b) => a.name.localeCompare(b.name, 'bg'));
  return { regions: regionsWithCounts, kindergartens };
}

export function mockApi(data = sampleData()) {
  return async (url) => {
    const body = {
      '/api/kindergartens': data.kindergartens,
      '/api/regions': data.regions,
      '/api/meta': { lastSyncedAt: '2026-10-29T10:00:00.000Z', source: 'https://kg.sofia.bg/#/kindergartens', rankingsPublished: false },
    }[url];
    return body ? { ok: true, status: 200, json: async () => body } : { ok: false, status: 404, json: async () => ({}) };
  };
}
