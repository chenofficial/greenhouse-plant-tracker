import type { AppState, Plant, Watering } from '@shared/types';
import { today, daysBetween, formatDate, escapeHtml } from '../util.js';

const RANGE_DAYS = 84;

type CellState =
  | 'empty'
  | 'scheduled-future'
  | 'scheduled-today'
  | 'missed'
  | 'overdue'
  | 'watered'
  | 'watered-on-time'
  | 'watered-late'
  | 'watered-early';

interface DayCell {
  date: string;
  state: CellState;
  amountMl: number;
  scheduled: boolean;
  delta: number | null;
}

function getDateRange(days: number): string[] {
  const out: string[] = [];
  const t = new Date(today() + 'T00:00:00');
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(t.getTime() - i * 86400000);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

function addDays(iso: string, n: number): string {
  return new Date(new Date(iso + 'T00:00:00').getTime() + n * 86400000).toISOString().slice(0, 10);
}

function buildPlantTimeline(plant: Plant, log: Watering[], range: string[]): DayCell[] {
  const t = today();
  const wateredMap = new Map<string, Watering[]>();
  for (const e of log) {
    if (e.plantId !== plant.id) continue;
    const d = e.date.slice(0, 10);
    if (!wateredMap.has(d)) wateredMap.set(d, []);
    wateredMap.get(d)!.push(e);
  }

  const created = plant.createdAt.slice(0, 10);
  const startWalk = created;
  const endWalk = range[range.length - 1]!;
  const endStop = endWalk > t ? endWalk : t;

  const dayState = new Map<string, DayCell>();
  let nextDue = addDays(created, plant.frequency);

  let cursor = startWalk;
  let guard = 0;
  while (cursor <= endStop && guard < 5000) {
    guard++;
    const events = wateredMap.get(cursor) ?? [];
    const amountMl = events.reduce((s, e) => s + (e.amountMl ?? plant.waterAmountMl), 0);

    if (events.length > 0) {
      const delta = daysBetween(nextDue, cursor);
      let state: CellState;
      if (delta < -1) state = 'watered-early';
      else if (delta > 1) state = 'watered-late';
      else state = 'watered-on-time';
      dayState.set(cursor, { date: cursor, state, amountMl, scheduled: cursor === nextDue, delta });
      nextDue = addDays(cursor, plant.frequency);
    } else if (cursor === nextDue) {
      if (cursor === t) {
        dayState.set(cursor, { date: cursor, state: 'scheduled-today', amountMl: 0, scheduled: true, delta: 0 });
      } else if (cursor > t) {
        dayState.set(cursor, { date: cursor, state: 'scheduled-future', amountMl: 0, scheduled: true, delta: 0 });
      } else {
        dayState.set(cursor, { date: cursor, state: 'missed', amountMl: 0, scheduled: true, delta: 0 });
      }
    } else if (cursor > nextDue && cursor <= t) {
      dayState.set(cursor, { date: cursor, state: 'overdue', amountMl: 0, scheduled: false, delta: daysBetween(nextDue, cursor) });
    } else {
      dayState.set(cursor, { date: cursor, state: 'empty', amountMl: 0, scheduled: false, delta: null });
    }

    cursor = addDays(cursor, 1);
  }

  return range.map((date) => {
    if (date < created) return { date, state: 'empty', amountMl: 0, scheduled: false, delta: null };
    const cell = dayState.get(date);
    return cell ?? { date, state: 'empty', amountMl: 0, scheduled: false, delta: null };
  });
}

function cellTitle(plantName: string, cell: DayCell): string {
  const date = formatDate(cell.date);
  switch (cell.state) {
    case 'watered-on-time':
      return `${plantName} — watered on schedule, ${date} (${cell.amountMl}ml)`;
    case 'watered-late':
      return `${plantName} — watered late by ${cell.delta} day${cell.delta === 1 ? '' : 's'}, ${date} (${cell.amountMl}ml)`;
    case 'watered-early':
      return `${plantName} — watered early by ${Math.abs(cell.delta!)} day${cell.delta === -1 ? '' : 's'}, ${date} (${cell.amountMl}ml)`;
    case 'watered':
      return `${plantName} — watered ${date} (${cell.amountMl}ml)`;
    case 'missed':
      return `${plantName} — scheduled watering missed, ${date}`;
    case 'overdue':
      return `${plantName} — overdue by ${cell.delta} day${cell.delta === 1 ? '' : 's'}, ${date}`;
    case 'scheduled-today':
      return `${plantName} — due today, ${date}`;
    case 'scheduled-future':
      return `${plantName} — due ${date}`;
    default:
      return `${plantName} — ${date}`;
  }
}

function monthLabels(range: string[]): { label: string; index: number }[] {
  const labels: { label: string; index: number }[] = [];
  let lastMonth = '';
  range.forEach((d, i) => {
    const month = d.slice(0, 7);
    if (month !== lastMonth) {
      const date = new Date(d + 'T12:00:00');
      labels.push({
        label: date.toLocaleDateString('en-US', { month: 'short' }).toLowerCase(),
        index: i,
      });
      lastMonth = month;
    }
  });
  return labels;
}

export function renderChart(state: AppState): string {
  const range = getDateRange(RANGE_DAYS);
  const months = monthLabels(range);

  const plantsSorted = [...state.plants].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  let totalScheduled = 0;
  let totalWatered = 0;
  let onTimeCount = 0;
  let lateCount = 0;
  let missedCount = 0;
  let totalMl = 0;

  const rows = plantsSorted.map((p) => {
    const cells = buildPlantTimeline(p, state.log, range);
    cells.forEach((c) => {
      if (c.scheduled) totalScheduled++;
      if (c.state.startsWith('watered')) {
        totalWatered++;
        totalMl += c.amountMl;
        if (c.state === 'watered-on-time') onTimeCount++;
        else if (c.state === 'watered-late') lateCount++;
      }
      if (c.state === 'missed') missedCount++;
    });
    return { plant: p, cells };
  });

  const onTimeRate = totalWatered > 0 ? Math.round((onTimeCount / totalWatered) * 100) : 0;
  const litersPoured = (totalMl / 1000).toFixed(1);

  return `
    <div class="top">
      <div class="top-left">
        <div class="crumbs">garden &middot; <b>chart</b></div>
        <h1 class="page-title">Watering <em>rhythm</em></h1>
      </div>
      <div class="top-right">
        <button class="btn-dot btn-dot--filled" data-action="add-plant">
          <span class="dot"></span> add plant <span class="dot"></span>
        </button>
      </div>
    </div>

    <section class="stat-strip">
      <div class="stat-cell">
        <div class="stat-head"><span class="swatch" style="background:var(--fm-forest);"></span>on-time rate</div>
        <div class="stat-big">${onTimeRate}<em>%</em></div>
        <div class="stat-foot">${onTimeCount} of ${totalWatered} waterings</div>
      </div>
      <div class="stat-cell">
        <div class="stat-head"><span class="swatch" style="background:var(--fm-ochre);"></span>late waterings</div>
        <div class="stat-big">${lateCount}</div>
        <div class="stat-foot">last ${RANGE_DAYS} days</div>
      </div>
      <div class="stat-cell">
        <div class="stat-head"><span class="swatch" style="background:var(--fm-terracotta);"></span>missed</div>
        <div class="stat-big">${missedCount}</div>
        <div class="stat-foot">of ${totalScheduled} scheduled</div>
      </div>
      <div class="stat-cell">
        <div class="stat-head"><span class="swatch" style="background:var(--fm-leaf);"></span>water poured</div>
        <div class="stat-big">${litersPoured}<em>L</em></div>
        <div class="stat-foot">${totalWatered} sessions</div>
      </div>
    </section>

    <section class="panel chart-panel">
      <div class="panel-head">
        <div>
          <h3 class="panel-title">Last <em>${RANGE_DAYS} days</em></h3>
          <div class="chart-legend">
            <span class="legend-item"><span class="legend-cell legend-on-time"></span>on time</span>
            <span class="legend-item"><span class="legend-cell legend-late"></span>late</span>
            <span class="legend-item"><span class="legend-cell legend-early"></span>early</span>
            <span class="legend-item"><span class="legend-cell legend-scheduled"></span>scheduled</span>
            <span class="legend-item"><span class="legend-cell legend-missed"></span>missed</span>
          </div>
        </div>
      </div>

      ${plantsSorted.length === 0
        ? `<div class="empty-state-lg">
            <div class="empty-icon-lg">📅</div>
            <h3>No plants to chart yet</h3>
            <p>Add a plant and the timeline will start tracking scheduled and actual waterings.</p>
            <button class="btn-dot btn-dot--forest" data-action="add-plant">
              <span class="dot"></span> add your first plant <span class="dot"></span>
            </button>
          </div>`
        : `<div class="chart-scroll">
            <div class="chart-grid" style="--days:${RANGE_DAYS};">
              <div class="chart-corner"></div>
              <div class="chart-months">
                ${months.map((m) => `<span class="chart-month" style="grid-column:${m.index + 1};">${m.label}</span>`).join('')}
              </div>
              ${rows.map(({ plant, cells }) => `
                <div class="chart-plant-label" title="${escapeHtml(plant.name)} — every ${plant.frequency}d, ${plant.waterAmountMl}ml">
                  <span class="chart-plant-icon">${plant.icon}</span>
                  <span class="chart-plant-name">${escapeHtml(plant.name)}</span>
                </div>
                <div class="chart-row">
                  ${cells.map((c) => `<span class="chart-cell ${c.state}" title="${escapeHtml(cellTitle(plant.name, c))}"></span>`).join('')}
                </div>
              `).join('')}
            </div>
          </div>`
      }
    </section>
  `;
}
