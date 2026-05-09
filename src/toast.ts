import type { BadgeDef } from '@shared/types';
import { BADGES } from '@shared/types';

function ensureContainer(): HTMLElement {
  let el = document.getElementById('toast-container');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast-container';
    el.className = 'toast-container';
    document.body.appendChild(el);
  }
  return el;
}

export function showToast(message: string, duration = 2800): void {
  const container = ensureContainer();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('is-visible'));
  setTimeout(() => {
    toast.classList.remove('is-visible');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

export function showBadgeToast(badgeId: string): void {
  const def: BadgeDef | undefined = BADGES.find((b) => b.id === badgeId);
  if (!def) return;
  const container = ensureContainer();
  const toast = document.createElement('div');
  toast.className = 'toast toast-badge';
  toast.innerHTML = `<span class="toast-badge-icon">${def.icon}</span> Badge unlocked: <b>${def.name}</b>`;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('is-visible'));
  setTimeout(() => {
    toast.classList.remove('is-visible');
    setTimeout(() => toast.remove(), 300);
  }, 3800);
}
