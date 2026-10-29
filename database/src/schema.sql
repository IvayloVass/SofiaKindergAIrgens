PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS regions (
  id   TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS kindergartens (
  id               INTEGER PRIMARY KEY,
  name             TEXT    NOT NULL,
  type             TEXT    NOT NULL,
  region_id        TEXT    REFERENCES regions(id),
  address          TEXT    NOT NULL DEFAULT '',
  phones           TEXT    NOT NULL DEFAULT '[]', -- JSON array of strings
  has_nursery      INTEGER NOT NULL DEFAULT 0,
  has_kindergarten INTEGER NOT NULL DEFAULT 0,
  has_preparatory  INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_kindergartens_region ON kindergartens(region_id);

CREATE TABLE IF NOT EXISTS meta (
  key   TEXT PRIMARY KEY,
  value TEXT
);
