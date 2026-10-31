import { TYPES, typeInfo } from './types.js';

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
    places: placesTotals(list),
  };
}

/**
 * Places summed over a list of kindergartens (current school year).
 * `known` is how many of them have place data; the rest are left out.
 */
export function placesTotals(list) {
  let capacity = 0;
  let enrolled = 0;
  let free = 0;
  let known = 0;
  for (const k of list) {
    if (!k.places) continue;
    known += 1;
    capacity += k.places.capacity;
    enrolled += k.places.enrolled;
    free += k.places.free;
  }
  return { capacity, enrolled, free, taken: capacity - free, freePct: pct(free, capacity), known, total: list.length };
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

export function sortKindergartens(list, sortBy) {
  const byName = (a, b) => collator.compare(a.name, b.name);
  const sorted = [...list];
  if (sortBy === 'region') sorted.sort((a, b) => collator.compare(a.regionName, b.regionName) || byName(a, b));
  else sorted.sort(byName);
  return sorted;
}
