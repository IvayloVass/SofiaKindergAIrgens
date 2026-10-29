import { GROUP_LISTS, SOURCE_BASE_URL } from './config.js';

const TIMEOUT_MS = 30_000;

async function getJson(fetchImpl, path) {
  const res = await fetchImpl(`${SOURCE_BASE_URL}${path}`, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'SofiaKindergartensSPA/1.0 (open data viewer)',
    },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Source request failed: ${path} → HTTP ${res.status}`);
  return res.json();
}

/**
 * Downloads the raw data from kg.sofia.bg:
 * the list of districts plus the kindergarten list for each group kind.
 */
export async function fetchSourceData(fetchImpl = fetch) {
  const [regions, ...lists] = await Promise.all([
    getJson(fetchImpl, '/nomenclature/regions'),
    ...GROUP_LISTS.map((group) =>
      getJson(
        fetchImpl,
        `/public/kg/type/kinderGarden/${group}?filterType=by_region&kgType=0&regionId=0`,
      ),
    ),
  ]);

  const groups = Object.fromEntries(
    GROUP_LISTS.map((group, i) => [group, lists[i]?.items?.kinderGardens ?? []]),
  );
  return { regions, groups };
}
