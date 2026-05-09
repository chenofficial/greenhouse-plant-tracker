import type { AppState, Stats } from '@shared/types';
import { BADGES } from '@shared/types';
import { escapeHtml } from '../util.js';

export function renderBadges(state: AppState, stats: Stats): string {
  const earnedIds = new Set(state.badges.map((b) => b.id));

  return `
    <div class="top">
      <div class="top-left">
        <div class="crumbs">garden &middot; <b>badges</b></div>
        <h1 class="page-title">Your <em>achievements</em></h1>
      </div>
      <div class="top-right">
        <div class="badge-summary">
          <span class="badge-summary-num">${stats.badgesEarned}</span>
          <span class="badge-summary-label">of ${BADGES.length} earned</span>
        </div>
      </div>
    </div>

    <div class="badge-grid">
      ${BADGES.map((b) => {
        const earned = earnedIds.has(b.id);
        return `
          <div class="badge-card ${earned ? 'earned' : 'locked'}">
            <div class="badge-card-icon">${b.icon}</div>
            <div class="badge-card-body">
              <h4 class="badge-card-name">${escapeHtml(b.name)}</h4>
              <p class="badge-card-desc">${escapeHtml(b.desc)}</p>
            </div>
            <div class="badge-card-status">
              ${earned
                ? '<span class="badge-earned-tag"><span class="tag-dot"></span>earned</span>'
                : '<span class="badge-locked-tag">locked</span>'
              }
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}
