import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const DB_PATH = process.env.DB_PATH ?? resolve(process.cwd(), 'data', 'greenhouse.db');

mkdirSync(dirname(DB_PATH), { recursive: true });

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS plants (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    type            TEXT NOT NULL,
    icon            TEXT NOT NULL,
    frequency       INTEGER NOT NULL,
    water_amount_ml INTEGER NOT NULL DEFAULT 250,
    location        TEXT NOT NULL DEFAULT '',
    last_watered    TEXT,
    created_at      TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS waterings (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    plant_id  TEXT NOT NULL,
    date      TEXT NOT NULL,
    amount_ml INTEGER,
    FOREIGN KEY (plant_id) REFERENCES plants(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS waterings_plant_id_idx ON waterings(plant_id);
  CREATE INDEX IF NOT EXISTS waterings_date_idx ON waterings(date);

  CREATE TABLE IF NOT EXISTS badges (
    id        TEXT PRIMARY KEY,
    earned_at TEXT NOT NULL
  );
`);

interface ColumnInfo { name: string }
function hasColumn(table: string, column: string): boolean {
  const rows = db.prepare(`PRAGMA table_info(${table})`).all() as ColumnInfo[];
  return rows.some((r) => r.name === column);
}

if (!hasColumn('plants', 'water_amount_ml')) {
  db.exec(`ALTER TABLE plants ADD COLUMN water_amount_ml INTEGER NOT NULL DEFAULT 250`);
}
if (!hasColumn('waterings', 'amount_ml')) {
  db.exec(`ALTER TABLE waterings ADD COLUMN amount_ml INTEGER`);
}
