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
    id           TEXT PRIMARY KEY,
    name         TEXT NOT NULL,
    type         TEXT NOT NULL,
    icon         TEXT NOT NULL,
    frequency    INTEGER NOT NULL,
    location     TEXT NOT NULL DEFAULT '',
    last_watered TEXT,
    created_at   TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS waterings (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    plant_id  TEXT NOT NULL,
    date      TEXT NOT NULL,
    FOREIGN KEY (plant_id) REFERENCES plants(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS waterings_plant_id_idx ON waterings(plant_id);
  CREATE INDEX IF NOT EXISTS waterings_date_idx ON waterings(date);

  CREATE TABLE IF NOT EXISTS badges (
    id        TEXT PRIMARY KEY,
    earned_at TEXT NOT NULL
  );
`);
