import type {
  AppState,
  Plant,
  CreatePlantInput,
  WaterPlantInput,
  Stats,
  BadgeRecord,
  Watering,
} from '@shared/types';

interface ApiAppState extends AppState {
  stats: Stats;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  if (!res.ok && res.status !== 204) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  getState: () => request<ApiAppState>('/api/state'),
  createPlant: (input: CreatePlantInput) =>
    request<{ plant: Plant; newBadges: BadgeRecord[] }>('/api/plants', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  deletePlant: (id: string) => request<void>(`/api/plants/${id}`, { method: 'DELETE' }),
  waterPlant: (id: string, input: WaterPlantInput = {}) =>
    request<{ plant: Plant; watering: Watering; newBadges: BadgeRecord[] }>(
      `/api/plants/${id}/water`,
      { method: 'POST', body: JSON.stringify(input) },
    ),
};
