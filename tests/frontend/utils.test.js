import { describe, expect, it } from 'vitest';
import { matchesQuery, normalizeText, searchableText, toLatin, tokenize } from '../../frontend/src/utils/search.js';
import {
  countByRegion,
  countByType,
  groupShares,
  groupSharesByRegion,
  sortKindergartens,
  summarize,
} from '../../frontend/src/utils/stats.js';
import { formatDate, mapsHref, phoneHref, plural } from '../../frontend/src/utils/format.js';
import { typeInfo } from '../../frontend/src/utils/types.js';
import { sampleData } from './data.js';

const { kindergartens, regions } = sampleData();
const byId = (id) => kindergartens.find((k) => k.id === id);

describe('search', () => {
  it('transliterates Bulgarian to Latin', () => {
    expect(toLatin('щастие жълто')).toBe('shtastie zhalto');
  });

  it('normalizes case, punctuation and spelling variants', () => {
    expect(normalizeText('ДГ №1 "Червената"')).toBe('dg 1 chervenata');
    expect(normalizeText('Carevo')).toBe(normalizeText('Царево'));
    expect(tokenize('  Мики   Маус ')).toEqual(['miki', 'maus']);
  });

  it('finds the same kindergarten in Cyrillic and Latin', () => {
    const kg = byId(171);
    expect(matchesQuery(kg, 'Червената')).toBe(true);
    expect(matchesQuery(kg, 'chervenata shapchitsa')).toBe(true);
    expect(matchesQuery(kg, 'ЧЕРВЕН')).toBe(true);
    expect(matchesQuery(kg, 'Брегалница')).toBe(true); // address
    expect(matchesQuery(kg, 'Възраждане')).toBe(true); // district
    expect(matchesQuery(kg, 'Слънце')).toBe(false);
  });

  it('requires every word and matches numbers as whole words', () => {
    const kg = { ...byId(171), _search: searchableText(byId(171)) };
    expect(matchesQuery(kg, 'дг 1')).toBe(true);
    expect(matchesQuery(kg, '11')).toBe(false);
    expect(matchesQuery(kg, 'червената люлин')).toBe(false);
    expect(matchesQuery(kg, '')).toBe(true);
  });
});

describe('stats', () => {
  it('summarizes a list', () => {
    expect(summarize(kindergartens)).toEqual({
      total: 9,
      nursery: 8,
      nurseryPct: 89,
      preparatory: 7,
      preparatoryPct: 78,
      districts: 4,
    });
    expect(summarize([]).nurseryPct).toBe(0);
  });

  it('counts by type in fixed order with stable color slots', () => {
    const rows = countByType(kindergartens);
    expect(rows.map((r) => [r.key, r.count, r.slot])).toEqual([
      ['ДГ (с яслени групи)', 6, 0],
      ['ДГ', 1, 1],
      ['СДЯ', 2, 2],
    ]);
    // Filtering out a type does not repaint the others.
    const withoutFirst = countByType(kindergartens.filter((k) => k.type !== 'ДГ (с яслени групи)'));
    expect(withoutFirst.map((r) => r.slot)).toEqual([1, 2]);
  });

  it('labels unknown types', () => {
    expect(typeInfo('ДГ (с логопедични групи)')).toMatchObject({ label: 'ДГ с логопедични групи', slot: 3 });
  });

  it('counts by region including empty ones, largest first', () => {
    const rows = countByRegion(kindergartens.filter((k) => k.regionName !== 'Средец'), regions);
    expect(rows[0]).toMatchObject({ name: 'Възраждане', count: 3 });
    expect(rows.at(-1)).toMatchObject({ name: 'Средец', count: 0 });
    expect(rows).toHaveLength(4);
  });

  it('computes group shares overall and per district', () => {
    expect(groupShares(kindergartens).hasNursery).toEqual({ count: 8, pct: 89 });
    const lyulin = regions.find((r) => r.name === 'Люлин').id;
    const rows = groupSharesByRegion(kindergartens, regions, [lyulin]);
    expect(rows.map((r) => r.name)).toEqual(['Цяла София', 'Люлин']);
    expect(rows[1].total).toBe(3);
  });

  it('sorts naturally by name or by district', () => {
    const sample = [{ name: 'ДГ №10' }, { name: 'ДГ №2' }, { name: 'ДГ №1' }];
    expect(sortKindergartens(sample, 'name').map((k) => k.name)).toEqual(['ДГ №1', 'ДГ №2', 'ДГ №10']);
    const districts = sortKindergartens(kindergartens, 'region').map((k) => k.regionName);
    expect(districts).toEqual([...districts].sort((a, b) => a.localeCompare(b, 'bg')));
  });
});

describe('format', () => {
  it('builds phone and map links', () => {
    expect(phoneHref('02/831 70 17')).toBe('tel:+35928317017');
    expect(phoneHref('0885044502')).toBe('tel:+359885044502');
    expect(mapsHref({ name: 'ДГ 1', address: 'ул. А' })).toContain(encodeURIComponent('ДГ 1, ул. А'));
  });

  it('formats dates and plurals in Bulgarian', () => {
    expect(formatDate('2026-10-29T10:00:00Z')).toMatch(/2026/);
    expect(formatDate('nope')).toBe('');
    expect(plural(1, 'резултат', 'резултата')).toBe('1 резултат');
    expect(plural(5, 'резултат', 'резултата')).toBe('5 резултата');
  });
});
