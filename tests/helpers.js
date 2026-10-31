import fixture from './fixtures/source.json';
import detail171 from './fixtures/detail-171.json';

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
