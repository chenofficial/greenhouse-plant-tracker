import type { AppState } from '@shared/types';
import { getPlantStatus, formatDate, today, daysBetween, escapeHtml } from '../util.js';

export function renderPlants(state: AppState): string {
  const plants = state.plants.map((p) => ({ plant: p, status: getPlantStatus(p) }));

  return `
    <div class="top">
      <div class="top-left">
        <div class="crumbs">garden &middot; <b>my plants</b></div>
        <h1 class="page-title">My <em>plants</em></h1>
      </div>
      <div class="top-right">
        <button class="btn-dot btn-dot--filled" data-action="add-plant">
          <span class="dot"></span> add plant <span class="dot"></span>
        </button>
      </div>
    </div>

    ${plants.length === 0
      ? `<div class="empty-state-lg">
          <div class="empty-icon-lg">🌱</div>
          <h3>No plants yet</h3>
          <p>Add your first plant to start tracking your watering schedule.</p>
          <button class="btn-dot btn-dot--forest" data-action="add-plant">
            <span class="dot"></span> add your first plant <span class="dot"></span>
          </button>
        </div>`
      : `<div class="plant-grid">
          ${plants.map(({ plant: p, status }) => {
            const fillPct = p.lastWatered
              ? Math.max(0, Math.min(100, ((p.frequency - Math.max(0, daysBetween(p.lastWatered, today()))) / p.frequency) * 100))
              : 0;
            const statusLabel =
              status.status === 'needs-water' ? 'needs water'
              : status.status === 'soon' ? 'water soon'
              : 'healthy';
            return `
              <div class="plant-card">
                <div class="plant-card-top">
                  <div class="plant-card-icon">${p.icon}</div>
                  <div class="plant-card-status-tag ${status.status}">
                    <span class="tag-dot"></span>
                    ${statusLabel}
                  </div>
                </div>
                <div class="plant-card-body">
                  <h4 class="plant-card-name">${escapeHtml(p.name)}</h4>
                  <div class="plant-card-meta">${escapeHtml(p.type)}${p.location ? ` &middot; ${escapeHtml(p.location)}` : ''}</div>
                  <div class="plant-card-schedule">
                    <span>every ${p.frequency} day${p.frequency !== 1 ? 's' : ''} &middot; ${p.waterAmountMl}ml</span>
                    <span class="plant-card-since">${p.lastWatered ? `last: ${formatDate(p.lastWatered)}` : 'never watered'}</span>
                  </div>
                  <div class="plant-card-bar">
                    <div class="plant-card-bar-fill ${status.status}" style="width:${fillPct}%"></div>
                  </div>
                </div>
                <div class="plant-card-actions">
                  <button class="btn-water" data-plant-id="${p.id}">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2c0 0-8 9.27-8 14a8 8 0 0016 0C20 11.27 12 2 12 2z"/></svg>
                    water now
                  </button>
                  <button class="btn-remove" data-remove-id="${p.id}" data-remove-name="${escapeHtml(p.name)}" title="Remove plant">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>`
    }
  `;
}
