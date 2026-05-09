import type { AppState, Watering } from '@shared/types';
import { formatDate, formatTime, escapeHtml } from '../util.js';

export function renderLog(state: AppState): string {
  const logs = state.log;

  const grouped: Record<string, Watering[]> = {};
  for (const e of logs) {
    const d = e.date.slice(0, 10);
    (grouped[d] ??= []).push(e);
  }

  return `
    <div class="top">
      <div class="top-left">
        <div class="crumbs">garden &middot; <b>water log</b></div>
        <h1 class="page-title">Watering <em>history</em></h1>
      </div>
    </div>

    ${logs.length === 0
      ? `<div class="empty-state-lg">
          <div class="empty-icon-lg">💧</div>
          <h3>No watering events yet</h3>
          <p>Start watering your plants and your history will appear here.</p>
        </div>`
      : `<div class="log-timeline">
          ${Object.entries(grouped).map(([date, events]) => `
            <div class="log-day">
              <div class="log-day-label">${formatDate(date)}</div>
              <div class="feed">
                ${events.map((e) => `
                  <div class="feed-row">
                    <div class="feed-ico earn">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2c0 0-8 9.27-8 14a8 8 0 0016 0C20 11.27 12 2 12 2z"/></svg>
                    </div>
                    <div class="feed-body">
                      <div class="feed-merchant">${escapeHtml(e.plantName)}</div>
                      <div class="feed-note">${formatTime(e.date)}</div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>`
    }
  `;
}
