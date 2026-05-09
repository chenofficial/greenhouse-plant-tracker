import { db } from './db.js';
import type { Plant, Watering, BadgeRecord, AppState, PlantType } from '../shared/types.js';
import { PLANT_PRESETS } from '../shared/types.js';

interface PlantRow {
  id: string;
  name: string;
  type: PlantType;
  icon: string;
  frequency: number;
  location: string;
  last_watered: string | null;
  created_at: string;
}

interface WateringRow {
  id: number;
  plant_id: string;
  plant_name: string;
  date: string;
}

interface BadgeRow {
  id: string;
  earned_at: string;
}

const rowToPlant = (r: PlantRow): Plant => ({
  id: r.id,
  name: r.name,
  type: r.type,
  icon: r.icon,
  frequency: r.frequency,
  location: r.location,
  lastWatered: r.last_watered,
  createdAt: r.created_at,
});

const rowToWatering = (r: WateringRow): Watering => ({
  id: r.id,
  plantId: r.plant_id,
  plantName: r.plant_name,
  date: r.date,
  type: 'water',
});

const rowToBadge = (r: BadgeRow): BadgeRecord => ({
  id: r.id,
  earnedAt: r.earned_at,
});

export function getAllPlants(): Plant[] {
  const rows = db.prepare('SELECT * FROM plants ORDER BY created_at ASC').all() as PlantRow[];
  return rows.map(rowToPlant);
}

export function getPlant(id: string): Plant | null {
  const row = db.prepare('SELECT * FROM plants WHERE id = ?').get(id) as PlantRow | undefined;
  return row ? rowToPlant(row) : null;
}

export function createPlant(input: {
  name: string;
  type: PlantType;
  frequency?: number;
  location?: string;
}): Plant {
  const preset = PLANT_PRESETS[input.type] ?? PLANT_PRESETS.other;
  const plant: Plant = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name: input.name,
    type: input.type,
    icon: preset.icon,
    frequency: input.frequency ?? preset.freq,
    location: input.location ?? '',
    lastWatered: null,
    createdAt: new Date().toISOString(),
  };

  db.prepare(`
    INSERT INTO plants (id, name, type, icon, frequency, location, last_watered, created_at)
    VALUES (@id, @name, @type, @icon, @frequency, @location, @lastWatered, @createdAt)
  `).run(plant);

  return plant;
}

export function deletePlant(id: string): boolean {
  const result = db.prepare('DELETE FROM plants WHERE id = ?').run(id);
  return result.changes > 0;
}

export function getAllWaterings(): Watering[] {
  const rows = db.prepare(`
    SELECT w.id, w.plant_id, w.date, p.name AS plant_name
    FROM waterings w
    JOIN plants p ON p.id = w.plant_id
    ORDER BY w.date DESC, w.id DESC
  `).all() as WateringRow[];
  return rows.map(rowToWatering);
}

export function recordWatering(plantId: string): { plant: Plant; watering: Watering } | null {
  const plant = getPlant(plantId);
  if (!plant) return null;

  const now = new Date().toISOString();
  const today = now.slice(0, 10);

  const tx = db.transaction(() => {
    const result = db.prepare('INSERT INTO waterings (plant_id, date) VALUES (?, ?)').run(plantId, now);
    db.prepare('UPDATE plants SET last_watered = ? WHERE id = ?').run(today, plantId);
    return result.lastInsertRowid as number;
  });

  const id = tx();

  return {
    plant: { ...plant, lastWatered: today },
    watering: { id, plantId, plantName: plant.name, date: now, type: 'water' },
  };
}

export function getAllBadges(): BadgeRecord[] {
  const rows = db.prepare('SELECT * FROM badges ORDER BY earned_at ASC').all() as BadgeRow[];
  return rows.map(rowToBadge);
}

export function awardBadge(id: string): BadgeRecord | null {
  const exists = db.prepare('SELECT id FROM badges WHERE id = ?').get(id);
  if (exists) return null;
  const earnedAt = new Date().toISOString();
  db.prepare('INSERT INTO badges (id, earned_at) VALUES (?, ?)').run(id, earnedAt);
  return { id, earnedAt };
}

export function getAppState(): AppState {
  return {
    plants: getAllPlants(),
    log: getAllWaterings(),
    badges: getAllBadges(),
  };
}
