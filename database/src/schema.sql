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
  has_preparatory  INTEGER NOT NULL DEFAULT 0,
  -- Places in the current school year, summed over all groups (NULL = unknown)
  capacity         INTEGER,
  enrolled         INTEGER,
  free_places      INTEGER
);

CREATE INDEX IF NOT EXISTS idx_kindergartens_region ON kindergartens(region_id);

CREATE TABLE IF NOT EXISTS meta (
  key   TEXT PRIMARY KEY,
  value TEXT
);

-- Responses fetched on demand (kindergarten details, waiting lists, rankings), stored as JSON.
CREATE TABLE IF NOT EXISTS cache (
  key        TEXT PRIMARY KEY,
  data       TEXT    NOT NULL,
  fetched_at INTEGER NOT NULL -- epoch milliseconds
);
