import type { AppState, Stats, BadgeRecord } from '@shared/types';
import { api } from './api.js';
import { renderDashboard } from './views/dashboard.js';
import { renderPlants } from './views/plants.js';
import { renderLog } from './views/log.js';
import { renderBadges } from './views/badges.js';
import { renderChart } from './views/chart.js';
import { showAddPlantModal, closeModal } from './modal.js';
import { showToast, showBadgeToast } from './toast.js';

type View = 'dashboard' | 'chart' | 'plants' | 'log' | 'badges';

interface AppStateWithStats {
  state: AppState;
  stats: Stats;
}

let view: View = 'dashboard';
let cache: AppStateWithStats = { state: { plants: [], log: [], badges: [] }, stats: emptyStats() };

function emptyStats(): Stats {
  return {
    totalPlants: 0,
    totalWaterings: 0,
    wateredToday: 0,
    currentStreak: 0,
    longestStreak: 0,
    allWateredToday: false,
    badgesEarned: 0,
  };
}

async function refresh(): Promise<void> {
  const data = await api.getState();
  cache = { state: { plants: data.plants, log: data.log, badges: data.badges }, stats: data.stats };
}

function switchView(next: View): void {
  view = next;
  document.querySelectorAll<HTMLElement>('.nav-item').forEach((el) => {
    el.classList.toggle('is-active', el.dataset.view === view);
  });
  render();
}

function render(): void {
  const main = document.getElementById('main-content');
  if (!main) return;

  const { state, stats } = cache;

  switch (view) {
    case 'dashboard': main.innerHTML = renderDashboard(state, stats); break;
    case 'chart':     main.innerHTML = renderChart(state); break;
    case 'plants':    main.innerHTML = renderPlants(state); break;
    case 'log':       main.innerHTML = renderLog(state); break;
    case 'badges':    main.innerHTML = renderBadges(state, stats); break;
  }

  bindEvents();
  updateSidebarCounts(stats);
}

function updateSidebarCounts(stats: Stats): void {
  const streakEl = document.getElementById('nav-streak');
  if (streakEl) streakEl.textContent = stats.currentStreak > 0 ? `${stats.currentStreak}d` : '';
  const plantCount = document.getElementById('nav-plant-count');
  if (plantCount) plantCount.textContent = stats.totalPlants ? String(stats.totalPlants) : '';
  const badgeCount = document.getElementById('nav-badge-count');
  if (badgeCount) badgeCount.textContent = stats.badgesEarned ? String(stats.badgesEarned) : '';
}

function celebrateBadges(badges: BadgeRecord[]): void {
  badges.forEach((b, i) => setTimeout(() => showBadgeToast(b.id), 600 + i * 400));
}

function bindEvents(): void {
  document.querySelectorAll<HTMLButtonElement>('.btn-water').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.plantId;
      if (!id) return;
      btn.disabled = true;
      try {
        const result = await api.waterPlant(id);
        await refresh();
        render();
        showToast('Plant watered! 💧');
        celebrateBadges(result.newBadges);
      } catch (err) {
        console.error(err);
        showToast('Could not save watering — try again.');
        btn.disabled = false;
      }
    });
  });

  document.querySelectorAll<HTMLButtonElement>('.btn-remove').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.removeId;
      const name = btn.dataset.removeName ?? 'this plant';
      if (!id) return;
      if (!confirm(`Remove "${name}" from your garden?`)) return;
      try {
        await api.deletePlant(id);
        await refresh();
        render();
        showToast('Plant removed');
      } catch (err) {
        console.error(err);
        showToast('Could not remove plant — try again.');
      }
    });
  });

  document.querySelectorAll<HTMLButtonElement>('[data-action="add-plant"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      showAddPlantModal(async (input) => {
        try {
          const result = await api.createPlant(input);
          await refresh();
          closeModal();
          render();
          showToast('Plant added! 🌱');
          celebrateBadges(result.newBadges);
        } catch (err) {
          console.error(err);
          showToast('Could not save plant — check your input.');
        }
      });
    });
  });

  document.querySelectorAll<HTMLButtonElement>('[data-action="close-modal"]').forEach((btn) => {
    btn.addEventListener('click', closeModal);
  });

  const switches: Record<string, View> = {
    'switch-chart': 'chart',
    'switch-plants': 'plants',
    'switch-log': 'log',
    'switch-badges': 'badges',
  };
  Object.entries(switches).forEach(([action, target]) => {
    document.querySelectorAll<HTMLElement>(`[data-action="${action}"]`).forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        switchView(target);
      });
    });
  });
}

async function init(): Promise<void> {
  document.querySelectorAll<HTMLElement>('.nav-item').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const target = el.dataset.view as View | undefined;
      if (target) switchView(target);
    });
  });

  const overlay = document.getElementById('modal-overlay');
  overlay?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });

  try {
    await refresh();
  } catch (err) {
    console.error('Failed to load initial state', err);
    showToast('Could not reach the server — start it with npm run dev.');
  }
  render();
}

document.addEventListener('DOMContentLoaded', init);
