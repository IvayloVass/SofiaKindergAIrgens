import { beforeEach, describe, expect, it } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  countKindergartens,
  getKindergartens,
  getRegions,
  openDatabase,
  replaceAll,
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
      places: null,
    });
    expect(all[1].phones).toEqual([]);
  });

  it('adds the places columns to a database file created before they existed', () => {
    const dir = mkdtempSync(join(tmpdir(), 'kg-db-'));
    const path = join(dir, 'old.db');
    const old = new DatabaseSync(path);
    old.exec(`CREATE TABLE kindergartens (
      id INTEGER PRIMARY KEY, name TEXT NOT NULL, type TEXT NOT NULL, region_id TEXT,
      address TEXT NOT NULL DEFAULT '', phones TEXT NOT NULL DEFAULT '[]',
      has_nursery INTEGER NOT NULL DEFAULT 0, has_kindergarten INTEGER NOT NULL DEFAULT 0,
      has_preparatory INTEGER NOT NULL DEFAULT 0)`);
    old.exec(`INSERT INTO kindergartens (id, name, type) VALUES (1, 'ДГ №1', 'ДГ')`);
    old.close();

    const db2 = openDatabase(path);
    try {
      expect(getKindergartens(db2)[0].places).toBeNull();
      replaceAll(db2, { regions, kindergartens: [kg(5, '15', { places: { capacity: 10, enrolled: 9, free: 1 } })] });
      expect(getKindergartens(db2)[0].places).toEqual({ capacity: 10, enrolled: 9, free: 1 });
    } finally {
      db2.close();
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('filters by region', () => {
    expect(getKindergartens(db, { regionId: '19' }).map((k) => k.id)).toEqual([3]);
    expect(getKindergartens(db, { regionId: '99' })).toEqual([]);
  });

  it('returns regions sorted in Bulgarian order with counts, including empty ones', () => {
    expect(getRegions(db)).toEqual([
      { id: '24', name: 'Банкя', count: 0 },
      { id: '19', name: 'Люлин', count: 1 },
      { id: '15', name: 'Младост', count: 2 },
    ]);
  });

  it('replaceAll rolls back on error and keeps old data', () => {
    expect(() =>
      replaceAll(db, { regions, kindergartens: [kg(1, '15'), kg(1, '15')] }),
    ).toThrow();
    expect(countKindergartens(db)).toBe(3);
  });
});
