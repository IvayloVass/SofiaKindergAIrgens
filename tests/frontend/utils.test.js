import { describe, expect, it } from 'vitest';
import { matchesQuery } from '../../frontend/src/utils/search.js';
import { placesTotals, summarize } from '../../frontend/src/utils/stats.js';
import { mapsHref, phoneHref } from '../../frontend/src/utils/format.js';
import { sampleData } from './data.js';

const { kindergartens } = sampleData();
const byId = (id) => kindergartens.find((k) => k.id === id);

describe('search', () => {
  it('finds the same kindergarten in Cyrillic and Latin', () => {
    const kg = byId(171);
    expect(matchesQuery(kg, 'Червената')).toBe(true);
    expect(matchesQuery(kg, 'chervenata shapchitsa')).toBe(true);
    expect(matchesQuery(kg, 'Брегалница')).toBe(true); // address
    expect(matchesQuery(kg, 'Слънце')).toBe(false);
  });
});

describe('stats', () => {
  it('summarizes a list for the stat tiles', () => {
    expect(summarize(kindergartens)).toMatchObject({ total: 9, nurseryPct: 89, districts: 4 });
  });

  it('sums places over the list and skips kindergartens without data', () => {
    const list = [
      { places: { capacity: 160, enrolled: 140, free: 18 } },
      { places: { capacity: 40, enrolled: 38, free: 2 } },
      { places: null },
    ];
    expect(placesTotals(list)).toEqual({
      capacity: 200,
      enrolled: 178,
      free: 20,
      taken: 180,
      freePct: 10,
      known: 2,
      total: 3,
    });
  });
});

describe('format', () => {
  it('builds phone and map links', () => {
    expect(phoneHref('02/831 70 17')).toBe('tel:+35928317017');
    expect(mapsHref({ name: 'ДГ 1', address: 'ул. А' })).toContain(encodeURIComponent('ДГ 1, ул. А'));
  });
});
