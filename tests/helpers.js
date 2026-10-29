import fixture from './fixtures/source.json';

/** Trimmed real responses captured from kg.sofia.bg (9 kindergartens, 4 districts). */
export function loadSourceFixture() {
  return structuredClone(fixture);
}

/** A fake fetch that answers source URLs from the fixture. */
export function fakeSourceFetch(fixture = loadSourceFixture()) {
  return async (url) => {
    const path = new URL(url).pathname;
    let body;
    if (path.endsWith('/nomenclature/regions')) body = fixture.regions;
    else {
      const group = path.split('/').pop();
      body = { items: { kinderGardens: fixture.groups[group] ?? [] } };
    }
    return { ok: true, status: 200, json: async () => body };
  };
}
