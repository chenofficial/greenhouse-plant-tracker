const PLANT_PRESETS = {
  'succulent':    { icon: '🪴', freq: 14, light: 'bright indirect' },
  'fern':         { icon: '🌿', freq: 3,  light: 'low to medium' },
  'cactus':       { icon: '🌵', freq: 21, light: 'direct sun' },
  'pothos':       { icon: '🍃', freq: 7,  light: 'low light' },
  'monstera':     { icon: '🌱', freq: 7,  light: 'bright indirect' },
  'snake plant':  { icon: '🌿', freq: 14, light: 'any' },
  'orchid':       { icon: '🌸', freq: 7,  light: 'bright indirect' },
  'herb':         { icon: '🌾', freq: 2,  light: 'direct sun' },
  'fiddle leaf':  { icon: '🌳', freq: 7,  light: 'bright indirect' },
  'peace lily':   { icon: '☘️', freq: 5,  light: 'low to medium' },
  'other':        { icon: '🌱', freq: 7,  light: 'varies' },
};

const BADGES = [
  { id: 'first_plant',    name: 'Seed sown',           desc: 'Add your first plant',              icon: '🌱', check: s => s.totalPlants >= 1 },
  { id: 'first_water',    name: 'First drop',          desc: 'Water a plant for the first time',  icon: '💧', check: s => s.totalWaterings >= 1 },
  { id: 'five_plants',    name: 'Growing collection',  desc: 'Add 5 plants to your garden',       icon: '🪴', check: s => s.totalPlants >= 5 },
  { id: 'ten_plants',     name: 'Urban jungle',        desc: 'Reach 10 plants',                   icon: '🌳', check: s => s.totalPlants >= 10 },
  { id: 'streak_3',       name: 'Getting started',     desc: 'Maintain a 3-day watering streak',  icon: '🔥', check: s => s.longestStreak >= 3 },
  { id: 'streak_7',       name: 'Week warrior',        desc: '7-day watering streak',             icon: '⚡', check: s => s.longestStreak >= 7 },
  { id: 'streak_14',      name: 'Fortnight force',     desc: '14-day watering streak',            icon: '🌟', check: s => s.longestStreak >= 14 },
  { id: 'streak_30',      name: 'Monthly master',      desc: '30-day watering streak',            icon: '👑', check: s => s.longestStreak >= 30 },
  { id: 'water_10',       name: 'Diligent gardener',   desc: 'Log 10 watering events',            icon: '🚿', check: s => s.totalWaterings >= 10 },
  { id: 'water_50',       name: 'Devoted caretaker',   desc: 'Log 50 watering events',            icon: '🏆', check: s => s.totalWaterings >= 50 },
  { id: 'water_100',      name: 'Plant whisperer',     desc: 'Log 100 watering events',           icon: '✨', check: s => s.totalWaterings >= 100 },
  { id: 'all_watered',    name: 'Perfect day',         desc: 'Water all plants in a single day',  icon: '☀️', check: s => s.allWateredToday },
];

function loadData() {
  const raw = localStorage.getItem('waterplants_data');
  if (raw) return JSON.parse(raw);
  return { plants: [], log: [], badges: [], streakDays: [] };
}

function saveData(data) {
  localStorage.setItem('waterplants_data', JSON.stringify(data));
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(a, b) {
  const da = new Date(a), db = new Date(b);
  return Math.floor((db - da) / 86400000);
}

function formatDate(iso) {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toLowerCase();
}

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).toLowerCase();
}

function getPlantStatus(plant) {
  if (!plant.lastWatered) return { status: 'needs-water', label: 'needs water', daysUntil: 0, overdue: true };
  const since = daysBetween(plant.lastWatered, today());
  const until = plant.frequency - since;
  if (until <= 0) return { status: 'needs-water', label: `${Math.abs(until)} day${Math.abs(until) !== 1 ? 's' : ''} overdue`, daysUntil: until, overdue: true };
  if (until === 1) return { status: 'soon', label: 'water tomorrow', daysUntil: 1, overdue: false };
  if (until <= 2) return { status: 'soon', label: `water in ${until} days`, daysUntil: until, overdue: false };
  return { status: 'healthy', label: `water in ${until} days`, daysUntil: until, overdue: false };
}

function computeStreak(data) {
  const waterDays = [...new Set(data.log.map(e => e.date.slice(0, 10)))].sort().reverse();
  if (waterDays.length === 0) return { current: 0, longest: 0 };

  let current = 0;
  const t = today();
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  if (waterDays[0] === t || waterDays[0] === yesterday) {
    current = 1;
    for (let i = 1; i < waterDays.length; i++) {
      if (daysBetween(waterDays[i], waterDays[i - 1]) === 1) current++;
      else break;
    }
  }

  let longest = 1, run = 1;
  for (let i = 1; i < waterDays.length; i++) {
    if (daysBetween(waterDays[i], waterDays[i - 1]) === 1) {
      run++;
      longest = Math.max(longest, run);
    } else {
      run = 1;
    }
  }
  longest = Math.max(longest, current);

  return { current, longest };
}

function computeStats(data) {
  const streak = computeStreak(data);
  const todayStr = today();
  const wateredToday = data.log.filter(e => e.date.slice(0, 10) === todayStr);
  const wateredTodayIds = new Set(wateredToday.map(e => e.plantId));
  const allWateredToday = data.plants.length > 0 && data.plants.every(p => wateredTodayIds.has(p.id));

  return {
    totalPlants: data.plants.length,
    totalWaterings: data.log.length,
    wateredToday: wateredTodayIds.size,
    currentStreak: streak.current,
    longestStreak: streak.longest,
    allWateredToday,
    badgesEarned: data.badges.length,
  };
}

function checkBadges(data) {
  const stats = computeStats(data);
  let newBadges = [];
  BADGES.forEach(b => {
    if (!data.badges.includes(b.id) && b.check(stats)) {
      data.badges.push(b.id);
      newBadges.push(b);
    }
  });
  if (newBadges.length > 0) saveData(data);
  return newBadges;
}

function waterPlant(data, plantId) {
  const plant = data.plants.find(p => p.id === plantId);
  if (!plant) return [];
  const now = new Date().toISOString();
  plant.lastWatered = today();
  data.log.unshift({ plantId, plantName: plant.name, date: now, type: 'water' });
  saveData(data);
  return checkBadges(data);
}

function addPlant(data, { name, type, frequency, location }) {
  const preset = PLANT_PRESETS[type] || PLANT_PRESETS['other'];
  const plant = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name,
    type,
    icon: preset.icon,
    frequency: frequency || preset.freq,
    location: location || '',
    lastWatered: null,
    createdAt: new Date().toISOString(),
  };
  data.plants.push(plant);
  saveData(data);
  checkBadges(data);
  return plant;
}

function removePlant(data, plantId) {
  data.plants = data.plants.filter(p => p.id !== plantId);
  saveData(data);
}

// ============================================================
// RENDERING
// ============================================================

let currentView = 'dashboard';
let data = loadData();

function switchView(view) {
  currentView = view;
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('is-active', el.dataset.view === view);
  });
  render();
}

function render() {
  const main = document.getElementById('main-content');
  const stats = computeStats(data);

  switch (currentView) {
    case 'dashboard': main.innerHTML = renderDashboard(stats); break;
    case 'plants':    main.innerHTML = renderPlants(stats); break;
    case 'log':       main.innerHTML = renderLog(); break;
    case 'badges':    main.innerHTML = renderBadges(stats); break;
  }

  bindEvents();
  updateSidebarCounts(stats);
}

function updateSidebarCounts(stats) {
  const streakEl = document.getElementById('nav-streak');
  if (streakEl) streakEl.textContent = stats.currentStreak > 0 ? `${stats.currentStreak}d` : '';
  const plantCount = document.getElementById('nav-plant-count');
  if (plantCount) plantCount.textContent = stats.totalPlants || '';
  const badgeCount = document.getElementById('nav-badge-count');
  if (badgeCount) badgeCount.textContent = stats.badgesEarned || '';
}

function renderDashboard(stats) {
  const needsWater = data.plants
    .map(p => ({ ...p, ...getPlantStatus(p) }))
    .filter(p => p.overdue || p.status === 'soon')
    .sort((a, b) => a.daysUntil - b.daysUntil);

  const recentLog = data.log.slice(0, 8);

  const streakPct = Math.min(100, (stats.currentStreak / 30) * 100);
  const nextMilestone = [3, 7, 14, 30].find(m => m > stats.currentStreak) || 30;
  const toNextMilestone = nextMilestone - stats.currentStreak;

  return `
    <div class="top">
      <div class="top-left">
        <div class="crumbs">garden &middot; <b>dashboard</b></div>
        <h1 class="page-title">Your <em>garden</em>, at a glance.</h1>
      </div>
    </div>

    <div class="grid">
      <div class="col">

        <!-- STREAK HERO -->
        <section class="rewards-hero">
          <div class="rh-head">
            <div class="rh-kicker">current watering streak</div>
            <div class="rh-tier"><span class="dot"></span> ${stats.currentStreak >= 30 ? 'master gardener' : stats.currentStreak >= 14 ? 'green thumb' : stats.currentStreak >= 7 ? 'growing strong' : 'seedling'}</div>
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

        <!-- STAT STRIP -->
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

        <!-- NEEDS WATER -->
        <section class="panel">
          <div class="panel-head">
            <h3 class="panel-title">Needs <em>attention</em></h3>
            <a class="panel-action" data-action="switch-plants">all plants &rarr;</a>
          </div>
          ${needsWater.length === 0
            ? `<div class="empty-state">
                <div class="empty-icon">✓</div>
                <p>All plants are happy. Nothing needs water right now.</p>
              </div>`
            : `<div class="water-list">
                ${needsWater.map(p => `
                  <div class="water-row">
                    <div class="water-ico ${p.status === 'needs-water' ? 'overdue' : 'soon'}">
                      <span>${p.icon}</span>
                    </div>
                    <div class="water-body">
                      <div class="water-name">${p.name}</div>
                      <div class="water-note">${p.type} &middot; ${p.label}</div>
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

        <!-- BADGES PREVIEW -->
        <section class="panel">
          <div class="panel-head">
            <h3 class="panel-title">Recent <em>badges</em></h3>
            <a class="panel-action" data-action="switch-badges">all badges &rarr;</a>
          </div>
          <div class="badge-grid-sm">
            ${BADGES.slice(0, 6).map(b => {
              const earned = data.badges.includes(b.id);
              return `<div class="badge-tile ${earned ? 'earned' : 'locked'}">
                <div class="badge-icon">${b.icon}</div>
                <div class="badge-name">${b.name}</div>
              </div>`;
            }).join('')}
          </div>
        </section>

        <!-- RECENT ACTIVITY -->
        <section class="panel">
          <div class="panel-head">
            <h3 class="panel-title">Recent <em>activity</em></h3>
            <a class="panel-action" data-action="switch-log">full log &rarr;</a>
          </div>
          ${recentLog.length === 0
            ? `<div class="empty-state"><p>No watering events yet. Add a plant and start watering!</p></div>`
            : `<div class="feed">
                ${recentLog.map(e => `
                  <div class="feed-row">
                    <div class="feed-ico earn">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2c0 0-8 9.27-8 14a8 8 0 0016 0C20 11.27 12 2 12 2z"/></svg>
                    </div>
                    <div class="feed-body">
                      <div class="feed-merchant">${e.plantName}</div>
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

function renderPlants(stats) {
  const plants = data.plants.map(p => ({ ...p, ...getPlantStatus(p) }));

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
          ${plants.map(p => `
            <div class="plant-card">
              <div class="plant-card-top">
                <div class="plant-card-icon">${p.icon}</div>
                <div class="plant-card-status-tag ${p.status}">
                  <span class="tag-dot"></span>
                  ${p.status === 'needs-water' ? 'needs water' : p.status === 'soon' ? 'water soon' : 'healthy'}
                </div>
              </div>
              <div class="plant-card-body">
                <h4 class="plant-card-name">${p.name}</h4>
                <div class="plant-card-meta">${p.type}${p.location ? ` &middot; ${p.location}` : ''}</div>
                <div class="plant-card-schedule">
                  <span>every ${p.frequency} day${p.frequency !== 1 ? 's' : ''}</span>
                  <span class="plant-card-since">${p.lastWatered ? `last: ${formatDate(p.lastWatered)}` : 'never watered'}</span>
                </div>
                <div class="plant-card-bar">
                  <div class="plant-card-bar-fill ${p.status}" style="width:${p.lastWatered ? Math.max(0, Math.min(100, ((p.frequency - Math.max(0, daysBetween(p.lastWatered, today()))) / p.frequency) * 100)) : 0}%"></div>
                </div>
              </div>
              <div class="plant-card-actions">
                <button class="btn-water" data-plant-id="${p.id}">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2c0 0-8 9.27-8 14a8 8 0 0016 0C20 11.27 12 2 12 2z"/></svg>
                  water now
                </button>
                <button class="btn-remove" data-remove-id="${p.id}" title="Remove plant">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>
            </div>
          `).join('')}
        </div>`
    }
  `;
}

function renderLog() {
  const logs = data.log;

  const grouped = {};
  logs.forEach(e => {
    const d = e.date.slice(0, 10);
    if (!grouped[d]) grouped[d] = [];
    grouped[d].push(e);
  });

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
                ${events.map(e => `
                  <div class="feed-row">
                    <div class="feed-ico earn">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2c0 0-8 9.27-8 14a8 8 0 0016 0C20 11.27 12 2 12 2z"/></svg>
                    </div>
                    <div class="feed-body">
                      <div class="feed-merchant">${e.plantName}</div>
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

function renderBadges(stats) {
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
      ${BADGES.map(b => {
        const earned = data.badges.includes(b.id);
        return `
          <div class="badge-card ${earned ? 'earned' : 'locked'}">
            <div class="badge-card-icon">${b.icon}</div>
            <div class="badge-card-body">
              <h4 class="badge-card-name">${b.name}</h4>
              <p class="badge-card-desc">${b.desc}</p>
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

// ============================================================
// MODAL
// ============================================================

function showAddPlantModal() {
  const overlay = document.getElementById('modal-overlay');
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-head">
        <h3 class="modal-title">Add a <em>new plant</em></h3>
        <button class="modal-close" data-action="close-modal">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>
      <form id="add-plant-form" class="form-stack">
        <div class="field">
          <label class="field-label">plant name</label>
          <input class="field-input" type="text" name="name" placeholder="e.g. kitchen basil" required>
        </div>
        <div class="field">
          <label class="field-label">plant type</label>
          <select class="field-input field-select" name="type">
            ${Object.keys(PLANT_PRESETS).map(k => `<option value="${k}">${k}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label class="field-label">watering frequency (days)</label>
          <input class="field-input" type="number" name="frequency" min="1" max="90" placeholder="7">
        </div>
        <div class="field">
          <label class="field-label">location</label>
          <input class="field-input" type="text" name="location" placeholder="e.g. living room window">
        </div>
        <div class="modal-actions">
          <button type="button" class="btn-dot" data-action="close-modal"><span class="dot"></span> cancel <span class="dot"></span></button>
          <button type="submit" class="btn-dot btn-dot--filled"><span class="dot"></span> add plant <span class="dot"></span></button>
        </div>
      </form>
    </div>
  `;
  overlay.classList.add('is-open');

  const typeSelect = overlay.querySelector('[name="type"]');
  const freqInput = overlay.querySelector('[name="frequency"]');
  typeSelect.addEventListener('change', () => {
    const preset = PLANT_PRESETS[typeSelect.value];
    if (preset) freqInput.placeholder = String(preset.freq);
  });

  overlay.querySelector('#add-plant-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const name = fd.get('name').trim();
    if (!name) return;
    const type = fd.get('type');
    const freq = parseInt(fd.get('frequency')) || PLANT_PRESETS[type]?.freq || 7;
    const location = fd.get('location').trim();
    addPlant(data, { name, type, frequency: freq, location });
    closeModal();
    render();
    showToast('Plant added! 🌱');
  });
}

function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  overlay.classList.remove('is-open');
  overlay.innerHTML = '';
}

function showToast(message) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('is-visible'));
  setTimeout(() => {
    toast.classList.remove('is-visible');
    setTimeout(() => toast.remove(), 300);
  }, 2800);
}

function showBadgeToast(badge) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast toast-badge';
  toast.innerHTML = `<span class="toast-badge-icon">${badge.icon}</span> Badge unlocked: <b>${badge.name}</b>`;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('is-visible'));
  setTimeout(() => {
    toast.classList.remove('is-visible');
    setTimeout(() => toast.remove(), 300);
  }, 3800);
}

// ============================================================
// EVENT BINDING
// ============================================================

function bindEvents() {
  document.querySelectorAll('.btn-water').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.plantId;
      const newBadges = waterPlant(data, id);
      render();
      showToast('Plant watered! 💧');
      newBadges.forEach(b => setTimeout(() => showBadgeToast(b), 600));
    });
  });

  document.querySelectorAll('.btn-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.removeId;
      const plant = data.plants.find(p => p.id === id);
      if (plant && confirm(`Remove "${plant.name}" from your garden?`)) {
        removePlant(data, id);
        render();
        showToast('Plant removed');
      }
    });
  });

  document.querySelectorAll('[data-action="add-plant"]').forEach(btn => {
    btn.addEventListener('click', showAddPlantModal);
  });

  document.querySelectorAll('[data-action="close-modal"]').forEach(btn => {
    btn.addEventListener('click', closeModal);
  });

  document.querySelectorAll('[data-action="switch-plants"]').forEach(el => {
    el.addEventListener('click', (e) => { e.preventDefault(); switchView('plants'); });
  });
  document.querySelectorAll('[data-action="switch-log"]').forEach(el => {
    el.addEventListener('click', (e) => { e.preventDefault(); switchView('log'); });
  });
  document.querySelectorAll('[data-action="switch-badges"]').forEach(el => {
    el.addEventListener('click', (e) => { e.preventDefault(); switchView('badges'); });
  });
}

// ============================================================
// INIT
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.nav-item').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      switchView(el.dataset.view);
    });
  });

  document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });

  checkBadges(data);
  render();
});
