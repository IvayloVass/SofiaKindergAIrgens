import { describe, expect, it } from 'vitest';
import { cleanText, extractPhones, normalize } from '../../backend/src/normalize.js';
import { loadSourceFixture } from '../helpers.js';

describe('normalize', () => {
  const { regions, kindergartens } = normalize(loadSourceFixture());

  it('maps regions and drops the "all" pseudo-region', () => {
    expect(regions.map((r) => r.name).sort()).toEqual(['Възраждане', 'Люлин', 'Младост', 'Средец']);
    expect(normalize({ regions: [{ id: '0', label: 'всички' }], groups: {} }).regions).toEqual([]);
  });

  it('keeps every kindergarten once with a region id', () => {
    expect(kindergartens).toHaveLength(9);
    expect(new Set(kindergartens.map((k) => k.id)).size).toBe(9);
    expect(kindergartens.every((k) => k.regionId)).toBe(true);
  });

  it('builds a clean record from the source shape', () => {
    const kg = kindergartens.find((k) => k.id === 171);
    expect(kg).toMatchObject({
      name: 'ДГ №1 Червената шапчица (с яслени групи)',
      type: 'ДГ (с яслени групи)',
      regionName: 'Възраждане',
      address: 'гр. София, ул. "Брегалница", №48',
      phones: ['02/831 70 17'],
    });
  });

  it('sets group flags from the group lists', () => {
    const flags = (id) => {
      const k = kindergartens.find((x) => x.id === id);
      return [k.hasNursery, k.hasKindergarten, k.hasPreparatory];
    };
    // СДЯ = standalone nursery: nursery groups only.
    expect(flags(265)).toEqual([true, false, false]);
    expect(flags(242)).toEqual([true, false, false]);
    // A plain ДГ has no nursery groups.
    expect(flags(183)[0]).toBe(false);
  });

  it('handles kindergartens without contacts', () => {
    expect(kindergartens.find((k) => k.id === 74).phones).toEqual([]);
  });
});

describe('helpers', () => {
  it('cleanText collapses whitespace', () => {
    expect(cleanText('  ДГ   №1 \n Слънце ')).toBe('ДГ №1 Слънце');
    expect(cleanText(null)).toBe('');
  });

  it('extractPhones keeps unique business phones only', () => {
    const phone = (v, type = 'business', kind = 'phone') => ({
      fieldValue: v,
      typeCommunication: { label: type },
      kindCommunication: { label: kind },
    });
    expect(
      extractPhones([phone('02/1'), phone(' 02/1 '), phone('x@y.bg', 'business', 'email'), phone('02/2', 'private')]),
    ).toEqual(['02/1']);
  });
});
