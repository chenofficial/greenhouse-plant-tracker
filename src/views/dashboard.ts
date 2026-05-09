import type { AppState, Stats } from '@shared/types';
import { BADGES } from '@shared/types';
import { getPlantStatus, formatDate, formatTime, escapeHtml } from '../util.js';

export function renderDashboard(state: AppState, stats: Stats): string {
  const earnedIds = new Set(state.badges.map((b) => b.id));

  const needsWater = state.plants
    .map((p) => ({ plant: p, status: getPlantStatus(p) }))
    .filter((x) => x.status.overdue || x.status.status === 'soon')
    .sort((a, b) => a.status.daysUntil - b.status.daysUntil);

  const recentLog = state.log.slice(0, 8);

  const streakPct = Math.min(100, (stats.currentStreak / 30) * 100);
  const nextMilestone = [3, 7, 14, 30].find((m) => m > stats.currentStreak) ?? 30;
  const toNextMilestone = nextMilestone - stats.currentStreak;

  const tierLabel =
    stats.currentStreak >= 30 ? 'master gardener'
    : stats.currentStreak >= 14 ? 'green thumb'
    : stats.currentStreak >= 7 ? 'growing strong'
    : 'seedling';

  return `
    <div class="top">
      <div class="top-left">
        <div class="crumbs">garden &middot; <b>dashboard</b></div>
        <h1 class="page-title">Your <em>garden</em>, at a glance.</h1>
      </div>
    </div>

    <div class="grid">
      <div class="col">
        <section class="rewards-hero">
          <div class="rh-head">
            <div class="rh-kicker">current watering streak</div>
            <div class="rh-tier"><span class="dot"></span> ${tierLabel}</div>
          </div>
          <div class="rh-number">
            <em>${stats.currentStreak}</em><span class="cents">days</span>
          </div>
          <div class="rh-sub">
            <p class="rh-desc">${stats.currentStreak > 0
              ? `You've been consistent for <em>${stats.currentStreak} day${stats.currentStreak !== 1 ? 's' : ''}</em> straight. ${toNextMilestone > 0 ? `${toNextMilestone} more to hit your next milestone.` : 'You\'ve reached the top tier!'}`
              : `Water all your plants today to <em>start a streak</em>. Consistency is the secret to a thriving garden.`
            }</p>
          </div>
          <div class="rh-progress">
            <div class="rh-progress-head">
              <span>progress to <b>${nextMilestone}-day milestone</b></span>
              <span><b>${toNextMilestone}</b> days to go</span>
            </div>
            <div class="rh-bar"><div class="rh-bar-fill" style="width:${streakPct}%"></div></div>
            <div class="rh-milestones">
              <span>0</span>
              <span>3d</span>
              <span>7d</span>
              <span>14d</span>
              <span ${stats.currentStreak >= 30 ? 'class="cur"' : ''}>30d</span>
            </div>
          </div>
        </section>

        <section class="stat-strip">
          <div class="stat-cell">
            <div class="stat-head"><span class="swatch" style="background:var(--fm-forest);"></span>total plants</div>
            <div class="stat-big">${stats.totalPlants}</div>
          </div>
          <div class="stat-cell">
            <div class="stat-head"><span class="swatch" style="background:var(--fm-leaf);"></span>watered today</div>
            <div class="stat-big">${stats.wateredToday}</div>
          </div>
          <div class="stat-cell">
            <div class="stat-head"><span class="swatch" style="background:var(--fm-harvest);"></span>longest streak</div>
            <div class="stat-big">${stats.longestStreak}<em>d</em></div>
          </div>
          <div class="stat-cell">
            <div class="stat-head"><span class="swatch" style="background:var(--fm-terracotta);"></span>badges earned</div>
            <div class="stat-big">${stats.badgesEarned}<em>/${BADGES.length}</em></div>
          </div>
        </section>

        <section class="panel">
          <div class="panel-head">
            <h3 class="panel-title">Needs <em>attention</em></h3>
            <a class="panel-action" data-action="switch-plants">all plants &rarr;</a>
          </div>
          ${needsWater.length === 0
            ? `<div class="empty-state">
                <div class="empty-icon">✓</div>
                <p>${state.plants.length === 0 ? 'Add your first plant to start tracking.' : 'All plants are happy. Nothing needs water right now.'}</p>
              </div>`
            : `<div class="water-list">
                ${needsWater.map(({ plant: p, status }) => `
                  <div class="water-row">
                    <div class="water-ico ${status.status === 'needs-water' ? 'overdue' : 'soon'}">
                      <span>${p.icon}</span>
                    </div>
                    <div class="water-body">
                      <div class="water-name">${escapeHtml(p.name)}</div>
                      <div class="water-note">${escapeHtml(p.type)} &middot; ${status.label}</div>
                    </div>
                    <button class="btn-water" data-plant-id="${p.id}">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2c0 0-8 9.27-8 14a8 8 0 0016 0C20 11.27 12 2 12 2z"/></svg>
                      water
                    </button>
                  </div>
                `).join('')}
              </div>`
          }
        </section>
      </div>

      <div class="col">
        <section class="panel">
          <div class="panel-head">
            <h3 class="panel-title">Recent <em>badges</em></h3>
            <a class="panel-action" data-action="switch-badges">all badges &rarr;</a>
          </div>
          <div class="badge-grid-sm">
            ${BADGES.slice(0, 6).map((b) => {
              const earned = earnedIds.has(b.id);
              return `<div class="badge-tile ${earned ? 'earned' : 'locked'}">
                <div class="badge-icon">${b.icon}</div>
                <div class="badge-name">${escapeHtml(b.name)}</div>
              </div>`;
            }).join('')}
          </div>
        </section>

        <section class="panel">
          <div class="panel-head">
            <h3 class="panel-title">Recent <em>activity</em></h3>
            <a class="panel-action" data-action="switch-log">full log &rarr;</a>
          </div>
          ${recentLog.length === 0
            ? `<div class="empty-state"><p>No watering events yet. Add a plant and start watering!</p></div>`
            : `<div class="feed">
                ${recentLog.map((e) => `
                  <div class="feed-row">
                    <div class="feed-ico earn">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2c0 0-8 9.27-8 14a8 8 0 0016 0C20 11.27 12 2 12 2z"/></svg>
                    </div>
                    <div class="feed-body">
                      <div class="feed-merchant">${escapeHtml(e.plantName)}</div>
                      <div class="feed-note">watered &middot; ${formatDate(e.date.slice(0, 10))} &middot; ${formatTime(e.date)}</div>
                    </div>
                  </div>
                `).join('')}
              </div>`
          }
        </section>
      </div>
    </div>
  `;
}
