import type { Plant } from '@shared/types';

export type PlantStatus = 'healthy' | 'soon' | 'needs-water';

export interface PlantStatusInfo {
  status: PlantStatus;
  label: string;
  daysUntil: number;
  overdue: boolean;
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function daysBetween(a: string, b: string): number {
  return Math.floor((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

export function formatDate(iso: string): string {
  const d = new Date(iso + 'T12:00:00');
  return d
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    .toLowerCase();
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).toLowerCase();
}

export function getPlantStatus(plant: Plant): PlantStatusInfo {
  if (!plant.lastWatered) {
    return { status: 'needs-water', label: 'needs water', daysUntil: 0, overdue: true };
  }
  const since = daysBetween(plant.lastWatered, today());
  const until = plant.frequency - since;
  if (until <= 0) {
    const overdueDays = Math.abs(until);
    return {
      status: 'needs-water',
      label: `${overdueDays} day${overdueDays !== 1 ? 's' : ''} overdue`,
      daysUntil: until,
      overdue: true,
    };
  }
  if (until === 1) return { status: 'soon', label: 'water tomorrow', daysUntil: 1, overdue: false };
  if (until <= 2) return { status: 'soon', label: `water in ${until} days`, daysUntil: until, overdue: false };
  return { status: 'healthy', label: `water in ${until} days`, daysUntil: until, overdue: false };
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => {
    switch (c) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case "'": return '&#39;';
      default: return c;
    }
  });
}
