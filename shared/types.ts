export type PlantType =
  | 'succulent'
  | 'fern'
  | 'cactus'
  | 'pothos'
  | 'monstera'
  | 'snake plant'
  | 'orchid'
  | 'herb'
  | 'fiddle leaf'
  | 'peace lily'
  | 'other';

export interface Plant {
  id: string;
  name: string;
  type: PlantType;
  icon: string;
  frequency: number;
  location: string;
  lastWatered: string | null;
  createdAt: string;
}

export interface Watering {
  id: number;
  plantId: string;
  plantName: string;
  date: string;
  type: 'water';
}

export interface BadgeRecord {
  id: string;
  earnedAt: string;
}

export interface AppState {
  plants: Plant[];
  log: Watering[];
  badges: BadgeRecord[];
}

export interface CreatePlantInput {
  name: string;
  type: PlantType;
  frequency?: number;
  location?: string;
}

export interface BadgeDef {
  id: string;
  name: string;
  desc: string;
  icon: string;
}

export interface Stats {
  totalPlants: number;
  totalWaterings: number;
  wateredToday: number;
  currentStreak: number;
  longestStreak: number;
  allWateredToday: boolean;
  badgesEarned: number;
}

export const PLANT_PRESETS: Record<PlantType, { icon: string; freq: number; light: string }> = {
  succulent:    { icon: '🪴', freq: 14, light: 'bright indirect' },
  fern:         { icon: '🌿', freq: 3,  light: 'low to medium' },
  cactus:       { icon: '🌵', freq: 21, light: 'direct sun' },
  pothos:       { icon: '🍃', freq: 7,  light: 'low light' },
  monstera:     { icon: '🌱', freq: 7,  light: 'bright indirect' },
  'snake plant':{ icon: '🌿', freq: 14, light: 'any' },
  orchid:       { icon: '🌸', freq: 7,  light: 'bright indirect' },
  herb:         { icon: '🌾', freq: 2,  light: 'direct sun' },
  'fiddle leaf':{ icon: '🌳', freq: 7,  light: 'bright indirect' },
  'peace lily': { icon: '☘️', freq: 5,  light: 'low to medium' },
  other:        { icon: '🌱', freq: 7,  light: 'varies' },
};

export const BADGES: (BadgeDef & { check: (s: Stats) => boolean })[] = [
  { id: 'first_plant',   name: 'Seed sown',          desc: 'Add your first plant',             icon: '🌱', check: (s) => s.totalPlants >= 1 },
  { id: 'first_water',   name: 'First drop',         desc: 'Water a plant for the first time', icon: '💧', check: (s) => s.totalWaterings >= 1 },
  { id: 'five_plants',   name: 'Growing collection', desc: 'Add 5 plants to your garden',      icon: '🪴', check: (s) => s.totalPlants >= 5 },
  { id: 'ten_plants',    name: 'Urban jungle',       desc: 'Reach 10 plants',                  icon: '🌳', check: (s) => s.totalPlants >= 10 },
  { id: 'streak_3',      name: 'Getting started',    desc: 'Maintain a 3-day watering streak', icon: '🔥', check: (s) => s.longestStreak >= 3 },
  { id: 'streak_7',      name: 'Week warrior',       desc: '7-day watering streak',            icon: '⚡', check: (s) => s.longestStreak >= 7 },
  { id: 'streak_14',     name: 'Fortnight force',    desc: '14-day watering streak',           icon: '🌟', check: (s) => s.longestStreak >= 14 },
  { id: 'streak_30',     name: 'Monthly master',     desc: '30-day watering streak',           icon: '👑', check: (s) => s.longestStreak >= 30 },
  { id: 'water_10',      name: 'Diligent gardener',  desc: 'Log 10 watering events',           icon: '🚿', check: (s) => s.totalWaterings >= 10 },
  { id: 'water_50',      name: 'Devoted caretaker',  desc: 'Log 50 watering events',           icon: '🏆', check: (s) => s.totalWaterings >= 50 },
  { id: 'water_100',     name: 'Plant whisperer',    desc: 'Log 100 watering events',          icon: '✨', check: (s) => s.totalWaterings >= 100 },
  { id: 'all_watered',   name: 'Perfect day',        desc: 'Water all plants in a single day', icon: '☀️', check: (s) => s.allWateredToday },
];
