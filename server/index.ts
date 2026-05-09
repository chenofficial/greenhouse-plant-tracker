import express from 'express';
import cors from 'cors';
import { z } from 'zod';
import {
  getAppState,
  getAllPlants,
  createPlant,
  deletePlant,
  recordWatering,
  getAllWaterings,
} from './repo.js';
import { computeStats, checkBadges } from './stats.js';

const PLANT_TYPES = [
  'succulent', 'fern', 'cactus', 'pothos', 'monstera',
  'snake plant', 'orchid', 'herb', 'fiddle leaf', 'peace lily', 'other',
] as const;

const CreatePlantSchema = z.object({
  name: z.string().trim().min(1).max(80),
  type: z.enum(PLANT_TYPES),
  frequency: z.number().int().min(1).max(365).optional(),
  waterAmountMl: z.number().int().min(10).max(10000).optional(),
  location: z.string().trim().max(120).optional(),
});

const WaterPlantSchema = z.object({
  amountMl: z.number().int().min(1).max(10000).optional(),
});

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/state', (_req, res) => {
  const state = getAppState();
  res.json({ ...state, stats: computeStats(state) });
});

app.get('/api/plants', (_req, res) => {
  res.json(getAllPlants());
});

app.post('/api/plants', (req, res) => {
  const parsed = CreatePlantSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid input', issues: parsed.error.issues });
    return;
  }
  const plant = createPlant(parsed.data);
  const newBadges = checkBadges(getAppState());
  res.status(201).json({ plant, newBadges });
});

app.delete('/api/plants/:id', (req, res) => {
  const ok = deletePlant(req.params.id);
  if (!ok) {
    res.status(404).json({ error: 'plant not found' });
    return;
  }
  res.status(204).end();
});

app.post('/api/plants/:id/water', (req, res) => {
  const parsed = WaterPlantSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid input', issues: parsed.error.issues });
    return;
  }
  const result = recordWatering(req.params.id, parsed.data.amountMl);
  if (!result) {
    res.status(404).json({ error: 'plant not found' });
    return;
  }
  const newBadges = checkBadges(getAppState());
  res.status(201).json({ ...result, newBadges });
});

app.get('/api/waterings', (_req, res) => {
  res.json(getAllWaterings());
});

const PORT = Number(process.env.API_PORT ?? 3001);
app.listen(PORT, () => {
  console.log(`[greenhouse] api listening on http://localhost:${PORT}`);
});
