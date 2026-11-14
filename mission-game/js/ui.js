// Small shared UI helpers.
export const $ = (sel, root = document) => root.querySelector(sel);

export function esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

export function barHtml(pct, cls = '') {
  const w = Math.max(0, Math.min(100, pct));
  return `<div class="bar ${cls}"><div style="width:${w}%"></div></div>`;
}

export function setBar(el, pct, cls) {
  if (!el) return;
  el.className = `bar ${cls || ''}`;
  el.firstElementChild.style.width = `${Math.max(0, Math.min(100, pct))}%`;
}

export const levelClass = pct => (pct < 25 ? 'bad' : pct < 50 ? 'warn' : 'good');

export function toast({ kind = 'info', title, text, effects, reason, hints }, ms = 7000) {
  const box = document.getElementById('toasts');
  const el = document.createElement('div');
  el.className = `toast ${kind}`;
  el.innerHTML = `
    <b>${esc(title)}</b>
    ${text ? `<div>${esc(text)}</div>` : ''}
    ${effects ? `<div class="fx">${esc(effects)}</div>` : ''}
    ${reason ? `<div class="why">${esc(reason)}</div>` : ''}
    ${(hints || []).slice(0, 2).map(h => `<div class="hint">💡 ${esc(h)}</div>`).join('')}`;
  el.addEventListener('click', () => el.remove());
  box.appendChild(el);
  while (box.children.length > 4) box.firstElementChild.remove();
  setTimeout(() => el.remove(), ms);
}
