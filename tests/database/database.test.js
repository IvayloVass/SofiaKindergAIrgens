import { beforeEach, describe, expect, it } from 'vitest';
import {
  countKindergartens,
  getKindergartens,
  getMeta,
  getRegions,
  openDatabase,
  replaceAll,
  setMeta,
} from '@kg/database';

const regions = [
  { id: '15', name: 'Младост' },
  { id: '19', name: 'Люлин' },
  { id: '24', name: 'Банкя' },
];

const kg = (id, regionId, extra = {}) => ({
  id,
  name: `ДГ №${id}`,
  type: 'ДГ',
  regionId,
  address: `ул. ${id}`,
  phones: [`02/000 00 ${id}`],
  hasNursery: false,
  hasKindergarten: true,
  hasPreparatory: false,
  ...extra,
});

describe('database', () => {
  let db;
  beforeEach(() => {
    db = openDatabase(':memory:');
    replaceAll(db, {
      regions,
      kindergartens: [kg(10, '15', { hasNursery: true }), kg(2, '15'), kg(3, '19', { phones: [] })],
    });
  });

  it('stores and reads kindergartens with all fields, sorted naturally by name', () => {
    const all = getKindergartens(db);
    expect(all.map((k) => k.id)).toEqual([2, 3, 10]);
    expect(all[2]).toEqual({
      id: 10,
      name: 'ДГ №10',
      type: 'ДГ',
      regionId: '15',
      regionName: 'Младост',
      address: 'ул. 10',
      phones: ['02/000 00 10'],
      hasNursery: true,
      hasKindergarten: true,
      hasPreparatory: false,
    });
    expect(all[1].phones).toEqual([]);
  });

  it('filters by region', () => {
    expect(getKindergartens(db, { regionId: '19' }).map((k) => k.id)).toEqual([3]);
    expect(getKindergartens(db, { regionId: 19 }).map((k) => k.id)).toEqual([3]);
    expect(getKindergartens(db, { regionId: '99' })).toEqual([]);
  });

  it('returns regions sorted in Bulgarian order with counts, including empty ones', () => {
    expect(getRegions(db)).toEqual([
      { id: '24', name: 'Банкя', count: 0 },
      { id: '19', name: 'Люлин', count: 1 },
      { id: '15', name: 'Младост', count: 2 },
    ]);
  });

  it('replaceAll replaces old data completely', () => {
    replaceAll(db, { regions, kindergartens: [kg(7, '24')] });
    expect(countKindergartens(db)).toBe(1);
    expect(getKindergartens(db)[0].regionName).toBe('Банкя');
  });

  it('replaceAll rolls back on error and keeps old data', () => {
    expect(() =>
      replaceAll(db, { regions, kindergartens: [kg(1, '15'), kg(1, '15')] }),
    ).toThrow();
    expect(countKindergartens(db)).toBe(3);
  });

  it('reads and updates meta values', () => {
    expect(getMeta(db, 'lastSyncedAt')).toBeNull();
    setMeta(db, 'lastSyncedAt', 'a');
    setMeta(db, 'lastSyncedAt', 'b');
    expect(getMeta(db, 'lastSyncedAt')).toBe('b');
  });
});
