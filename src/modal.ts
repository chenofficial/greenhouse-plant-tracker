import type { CreatePlantInput, PlantType } from '@shared/types';
import { PLANT_PRESETS } from '@shared/types';

export function showAddPlantModal(onSubmit: (input: CreatePlantInput) => void | Promise<void>): void {
  const overlay = document.getElementById('modal-overlay');
  if (!overlay) return;

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
            ${Object.keys(PLANT_PRESETS).map((k) => `<option value="${k}">${k}</option>`).join('')}
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

  const typeSelect = overlay.querySelector<HTMLSelectElement>('select[name="type"]');
  const freqInput = overlay.querySelector<HTMLInputElement>('input[name="frequency"]');
  if (typeSelect && freqInput) {
    typeSelect.addEventListener('change', () => {
      const preset = PLANT_PRESETS[typeSelect.value as PlantType];
      if (preset) freqInput.placeholder = String(preset.freq);
    });
  }

  const form = overlay.querySelector<HTMLFormElement>('#add-plant-form');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const name = String(fd.get('name') ?? '').trim();
    if (!name) return;
    const type = String(fd.get('type') ?? 'other') as PlantType;
    const freqRaw = fd.get('frequency');
    const frequency = freqRaw ? parseInt(String(freqRaw), 10) : undefined;
    const location = String(fd.get('location') ?? '').trim();
    await onSubmit({
      name,
      type,
      frequency: Number.isFinite(frequency) ? frequency : undefined,
      location: location || undefined,
    });
  });
}

export function closeModal(): void {
  const overlay = document.getElementById('modal-overlay');
  if (!overlay) return;
  overlay.classList.remove('is-open');
  overlay.innerHTML = '';
}
