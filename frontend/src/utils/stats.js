import { GROUPS, TYPES, typeInfo } from './types.js';

const collator = new Intl.Collator('bg', { numeric: true, sensitivity: 'base' });

export const pct = (part, total) => (total ? Math.round((part / total) * 100) : 0);

/** Headline numbers for the stat tiles. */
export function summarize(list) {
  const total = list.length;
  const nursery = list.filter((k) => k.hasNursery).length;
  const preparatory = list.filter((k) => k.hasPreparatory).length;
  return {
    total,
    nursery,
    nurseryPct: pct(nursery, total),
    preparatory,
    preparatoryPct: pct(preparatory, total),
    districts: new Set(list.map((k) => k.regionId)).size,
  };
}

/** Counts per kindergarten type, in the fixed type order (only non-empty types). */
export function countByType(list) {
  const counts = new Map();
  for (const k of list) counts.set(k.type, (counts.get(k.type) ?? 0) + 1);
  const known = TYPES.map((t) => t.key);
  const keys = [...known, ...[...counts.keys()].filter((k) => !known.includes(k)).sort(collator.compare)];
  return keys
    .filter((key) => counts.get(key))
    .map((key) => ({ ...typeInfo(key), count: counts.get(key) }));
}

/** Counts per district for every district (zeros included), largest first. */
export function countByRegion(list, regions) {
  const counts = new Map();
  for (const k of list) counts.set(k.regionId, (counts.get(k.regionId) ?? 0) + 1);
  return regions
    .map((r) => ({ id: r.id, name: r.name, count: counts.get(r.id) ?? 0 }))
    .sort((a, b) => b.count - a.count || collator.compare(a.name, b.name));
}

/** Share (%) of kindergartens offering each group kind. */
export function groupShares(list) {
  const total = list.length;
  return Object.fromEntries(
    GROUPS.map((g) => {
      const count = list.filter((k) => k[g.key]).length;
      return [g.key, { count, pct: pct(count, total) }];
    }),
  );
}

/**
 * Rows for the district comparison chart: one row per district plus an
 * "all Sofia" reference row, each with group shares.
 */
export function groupSharesByRegion(list, regions, regionIds, referenceLabel = 'Цяла София') {
  const rows = regionIds
    .map((id) => regions.find((r) => r.id === id))
    .filter(Boolean)
    .map((r) => {
      const inRegion = list.filter((k) => k.regionId === r.id);
      return { id: r.id, name: r.name, total: inRegion.length, shares: groupShares(inRegion) };
    });
  return [{ id: 'all', name: referenceLabel, total: list.length, shares: groupShares(list) }, ...rows];
}

export function sortKindergartens(list, sortBy) {
  const byName = (a, b) => collator.compare(a.name, b.name);
  const sorted = [...list];
  if (sortBy === 'region') sorted.sort((a, b) => collator.compare(a.regionName, b.regionName) || byName(a, b));
  else sorted.sort(byName);
  return sorted;
}
