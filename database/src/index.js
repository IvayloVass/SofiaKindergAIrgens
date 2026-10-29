import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';

const schema = readFileSync(new URL('./schema.sql', import.meta.url), 'utf8');

/**
 * Opens (or creates) the database and makes sure the schema exists.
 * Pass ':memory:' for a throwaway database (used in tests).
 */
export function openDatabase(path = ':memory:') {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(schema);
  return db;
}

/** Replaces all regions and kindergartens in a single transaction. */
export function replaceAll(db, { regions, kindergartens }) {
  const insertRegion = db.prepare('INSERT INTO regions (id, name) VALUES (?, ?)');
  const insertKg = db.prepare(`
    INSERT INTO kindergartens
      (id, name, type, region_id, address, phones, has_nursery, has_kindergarten, has_preparatory)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  db.exec('BEGIN');
  try {
    db.exec('DELETE FROM kindergartens; DELETE FROM regions;');
    for (const r of regions) insertRegion.run(String(r.id), r.name);
    for (const k of kindergartens) {
      insertKg.run(
        k.id,
        k.name,
        k.type,
        k.regionId ?? null,
        k.address ?? '',
        JSON.stringify(k.phones ?? []),
        k.hasNursery ? 1 : 0,
        k.hasKindergarten ? 1 : 0,
        k.hasPreparatory ? 1 : 0,
      );
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

/** All regions, sorted by name, each with the number of kindergartens in it. */
export function getRegions(db) {
  return db
    .prepare(
      `SELECT r.id, r.name, COUNT(k.id) AS count
       FROM regions r LEFT JOIN kindergartens k ON k.region_id = r.id
       GROUP BY r.id, r.name
       ORDER BY r.name COLLATE NOCASE`,
    )
    .all()
    .map((row) => ({ id: row.id, name: row.name, count: Number(row.count) }))
    .sort((a, b) => a.name.localeCompare(b.name, 'bg'));
}

/** Kindergartens, optionally limited to one region. */
export function getKindergartens(db, { regionId } = {}) {
  const sql = `
    SELECT k.*, r.name AS region_name
    FROM kindergartens k LEFT JOIN regions r ON r.id = k.region_id
    ${regionId ? 'WHERE k.region_id = ?' : ''}
  `;
  const stmt = db.prepare(sql);
  const rows = regionId ? stmt.all(String(regionId)) : stmt.all();
  return rows.map(toKindergarten).sort((a, b) => a.name.localeCompare(b.name, 'bg', { numeric: true }));
}

export function countKindergartens(db) {
  return Number(db.prepare('SELECT COUNT(*) AS n FROM kindergartens').get().n);
}

export function getMeta(db, key) {
  const row = db.prepare('SELECT value FROM meta WHERE key = ?').get(key);
  return row ? row.value : null;
}

export function setMeta(db, key, value) {
  db.prepare(
    'INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
  ).run(key, value == null ? null : String(value));
}

function toKindergarten(row) {
  return {
    id: Number(row.id),
    name: row.name,
    type: row.type,
    regionId: row.region_id,
    regionName: row.region_name ?? '',
    address: row.address,
    phones: JSON.parse(row.phones || '[]'),
    hasNursery: row.has_nursery === 1,
    hasKindergarten: row.has_kindergarten === 1,
    hasPreparatory: row.has_preparatory === 1,
  };
}
