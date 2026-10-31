import detailFixture from '../fixtures/detail-171.json';
import waitingFixture from '../fixtures/waiting-9006.json';
import entryHtml from '../fixtures/rating-entry-446-9006.html?raw';
import ratedHtml from '../fixtures/rating-rated-446-6059.html?raw';
import notRatedHtml from '../fixtures/rating-notrated-446-9006.html?raw';
import { normalize } from '../../backend/src/normalize.js';
import { normalizeDetail, normalizeWaiting, parseRatingHtml } from '../../backend/src/details.js';
import { loadSourceFixture } from '../helpers.js';

/** The same records the API would return for the fixture data. */
export function sampleData() {
  const { regions, kindergartens } = normalize(loadSourceFixture());
  const regionsWithCounts = regions
    .map((r) => ({ ...r, count: kindergartens.filter((k) => k.regionId === r.id).length }))
    .sort((a, b) => a.name.localeCompare(b.name, 'bg'));
  return { regions: regionsWithCounts, kindergartens };
}

/** What GET /api/kindergartens/171 returns. */
export function sampleDetail() {
  const d = normalizeDetail(structuredClone(detailFixture));
  return {
    ...d,
    regionId: '03',
    hasNursery: true,
    hasKindergarten: true,
    hasPreparatory: true,
    fetchedAt: '2026-10-29T10:00:00.000Z',
    stale: false,
  };
}

export function sampleWaiting() {
  return { ...normalizeWaiting(structuredClone(waitingFixture)), fetchedAt: '2026-10-29T10:00:00.000Z', stale: false };
}

export function sampleRanking() {
  return {
    ratingId: 446,
    groupId: 9006,
    date: '2026-10-15T21:00:00.000+00:00',
    entry: parseRatingHtml(entryHtml),
    rated: parseRatingHtml(ratedHtml),
    notRated: parseRatingHtml(notRatedHtml),
    fetchedAt: '2026-10-29T10:00:00.000Z',
    stale: false,
  };
}

export function mockApi(data = sampleData()) {
  return async (url) => {
    const report = /^\/api\/kindergartens\/171\/report\.(xlsx|pdf)$/.exec(url);
    if (report) {
      const name = encodeURIComponent(`Червената шапчица - класиране 2026-10-31.${report[1]}`);
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'Content-Disposition': `attachment; filename="kindergarten-171.${report[1]}"; filename*=UTF-8''${name}` }),
        blob: async () => new Blob(['file']),
      };
    }
    const body = {
      '/api/kindergartens': data.kindergartens,
      '/api/regions': data.regions,
      '/api/meta': { lastSyncedAt: '2026-10-29T10:00:00.000Z', source: 'https://kg.sofia.bg/#/kindergartens' },
      '/api/kindergartens/171': sampleDetail(),
      '/api/kindergartens/171/groups/9006/waiting': sampleWaiting(),
      '/api/kindergartens/171/groups/9006/rankings/446': sampleRanking(),
    }[url];
    return body
      ? { ok: true, status: 200, json: async () => structuredClone(body) }
      : { ok: false, status: 404, json: async () => ({ error: 'Not found' }) };
  };
}
