// Small shared UI helpers.
import { STAT_NAMES, STAT_SHORT } from './util.js';
import { animalSvg, spriteOf } from './views/animals.js';
import { iconBody } from './icons.js';

export const STAT_ICON_NAME = { speed: 'zap', analysis: 'brain', tech: 'wrench', calm: 'feather' };

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

// ---------- Stats visuals (style taken from the teammate's MDL prototype) ----------
export const STAT_KEYS = ['speed', 'analysis', 'tech', 'calm'];
export const STAT_COLORS = { speed: '#29ADFF', analysis: '#00E436', tech: '#FFA300', calm: '#FF77A8' };

/**
 * Diamond radar chart. Axes: top = Rapidez, right = Análisis, bottom = Técnica, left = Calma.
 * stats values are 0..10. Pass null for an empty team.
 */
export function radarSvg(stats, { size = 140, labels = true, fill = 'rgba(6,182,212,.28)', stroke = '#22d3ee' } = {}) {
  const c = 70;
  const R = labels ? 46 : 58;
  const v = k => (stats ? Math.max(0, Math.min(10, stats[k])) / 10 : 0);
  const pts = [
    [c, c - v('speed') * R],
    [c + v('analysis') * R, c],
    [c, c + v('tech') * R],
    [c - v('calm') * R, c]
  ].map(p => p.map(n => n.toFixed(1)).join(',')).join(' ');
  const rings = [1, 2 / 3, 1 / 3].map(f => `<polygon points="${c},${c - R * f} ${c + R * f},${c} ${c},${c + R * f} ${c - R * f},${c}" fill="none" stroke="#1e293b" stroke-width="1"/>`).join('');
  const val = k => (stats ? (Math.round(stats[k] * 10) / 10).toString() : '–');
  const lbl = labels ? `
    <text x="${c}" y="12" text-anchor="middle" fill="${STAT_COLORS.speed}" font-size="9.5" font-weight="700" font-family="monospace">${STAT_SHORT.speed} ${val('speed')}</text>
    <text x="${c + R + 4}" y="${c - 4}" text-anchor="start" fill="${STAT_COLORS.analysis}" font-size="9.5" font-weight="700" font-family="monospace">${STAT_SHORT.analysis}</text>
    <text x="${c + R + 4}" y="${c + 8}" text-anchor="start" fill="${STAT_COLORS.analysis}" font-size="9.5" font-weight="700" font-family="monospace">${val('analysis')}</text>
    <text x="${c}" y="136" text-anchor="middle" fill="${STAT_COLORS.tech}" font-size="9.5" font-weight="700" font-family="monospace">${STAT_SHORT.tech} ${val('tech')}</text>
    <text x="${c - R - 4}" y="${c - 4}" text-anchor="end" fill="${STAT_COLORS.calm}" font-size="9.5" font-weight="700" font-family="monospace">${STAT_SHORT.calm}</text>
    <text x="${c - R - 4}" y="${c + 8}" text-anchor="end" fill="${STAT_COLORS.calm}" font-size="9.5" font-weight="700" font-family="monospace">${val('calm')}</text>` : '';
  return `
    <svg viewBox="0 0 140 140" width="${size}" height="${size}" aria-label="Gráfica radar de habilidades">
      ${rings}
      <line x1="${c}" y1="${c - R}" x2="${c}" y2="${c + R}" stroke="#1e293b"/>
      <line x1="${c - R}" y1="${c}" x2="${c + R}" y2="${c}" stroke="#1e293b"/>
      <polygon points="${pts}" fill="${fill}" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/>
      ${lbl}
    </svg>`;
}

export const STAT_ICONS = { speed: '⚡', analysis: '🧠', tech: '🔧', calm: '🧘' };

/**
 * Big Dispatch-style radar: the problem's requirement shape (dashed amber) over the team's stats (cyan).
 * Axes: top = Rapidez, right = Análisis, bottom = Técnica, left = Calma. Values 0..10.
 */
export function dispatchRadar(req, team, size = 270, numbers = true) {
  const c = 100;
  const R = 66;
  const pt = (k, v) => {
    const f = Math.max(0, Math.min(10, v)) / 10 * R;
    return { speed: [c, c - f], analysis: [c + f, c], tech: [c, c + f], calm: [c - f, c] }[k];
  };
  const poly = vals => STAT_KEYS.map(k => pt(k, vals[k]).map(n => n.toFixed(1)).join(',')).join(' ');
  const rings = [1, 0.8, 0.6, 0.4, 0.2].map(f => `<polygon points="${c},${c - R * f} ${c + R * f},${c} ${c},${c + R * f} ${c - R * f},${c}" fill="${f === 1 ? '#000' : 'none'}" stroke="#1D2B53" stroke-width="2"/>`).join('');
  const reqVals = {};
  for (const k of STAT_KEYS) reqVals[k] = req[k] || 0;
  const badge = k => {
    const [x, y] = pt(k, 10);
    const off = { speed: [0, -20], analysis: [24, 0], tech: [0, 20], calm: [-24, 0] }[k];
    const bx = x + off[0];
    const by = y + off[1];
    const need = req[k] || 0;
    const have = team ? team[k] : null;
    const miss = team && need && have < need;
    const label = numbers ? (team ? `${have} / ${need}` : `pide ${need}`) : STAT_NAMES[k];
    return `
      <rect x="${bx - 13}" y="${by - 13}" width="26" height="26" fill="#000" stroke="${miss ? '#FF004D' : STAT_COLORS[k]}" stroke-width="3"/>
      <g transform="translate(${bx - 7} ${by - 7}) scale(.5833)" fill="${miss ? '#FF004D' : STAT_COLORS[k]}" shape-rendering="crispEdges">${iconBody(STAT_ICON_NAME[k])}</g>
      <text x="${bx}" y="${by + (k === 'speed' ? -17 : 26)}" text-anchor="middle" font-size="8" font-family="'Press Start 2P', monospace" fill="${miss ? '#fda4af' : STAT_COLORS[k]}">${numbers ? `${STAT_SHORT[k]} ` : ''}${label}</text>`;
  };
  const reqDots = STAT_KEYS.filter(k => req[k]).map(k => { const [x, y] = pt(k, req[k]); return `<rect x="${x - 3}" y="${y - 3}" width="6" height="6" fill="#FFEC27"/>`; }).join('');
  return `
    <svg viewBox="-12 -16 224 232" width="${size}" height="${size}" aria-label="Requisitos del problema contra las habilidades del equipo">
      ${rings}
      <line x1="${c}" y1="${c - R}" x2="${c}" y2="${c + R}" stroke="#1e293b"/>
      <line x1="${c - R}" y1="${c}" x2="${c + R}" y2="${c}" stroke="#1e293b"/>
      <polygon points="${poly(reqVals)}" fill="rgba(255,236,39,.12)" stroke="#FFEC27" stroke-width="3" stroke-dasharray="6 4" stroke-linejoin="round"/>
      ${team ? `<polygon points="${poly(team)}" fill="rgba(41,173,255,.4)" stroke="#29ADFF" stroke-width="3" stroke-linejoin="round"/>` : ''}
      ${reqDots}
      ${STAT_KEYS.map(badge).join('')}
    </svg>`;
}

export function averageStats(members) {
  if (!members.length) return null;
  const out = {};
  for (const k of STAT_KEYS) out[k] = members.reduce((a, m) => a + m.stats[k], 0) / members.length;
  return out;
}

export function topStat(m) {
  return STAT_KEYS.reduce((best, k) => (m.stats[k] > m.stats[best] ? k : best), STAT_KEYS[0]);
}

/** 2x2 colored bars, like the teammate's candidate cards. */
export function statGrid(m) {
  const top = topStat(m);
  return `<div class="sgrid">${STAT_KEYS.map(k => `
    <div class="sg ${k === top ? 'top' : ''}" title="${STAT_NAMES[k]}">
      <div class="row"><span>${STAT_SHORT[k]}</span><b>${m.stats[k]}</b></div>
      <div class="sg-track"><div class="sg-fill ${k}" style="width:${m.stats[k] * 10}%"></div></div>
    </div>`).join('')}</div>`;
}

/** 4 colored numbers in a row (mission crew tiles). */
export function stat4(m) {
  return `<div class="stat4">${STAT_KEYS.map(k => `<div class="${k}">${STAT_SHORT[k]}<b>${m.stats[k]}</b></div>`).join('')}</div>`;
}

export function avatar(m, cls = '') {
  const sprite = spriteOf(m);
  if (sprite) return `<span class="avatar px ${cls}" title="${esc(m.name)}"><img src="${sprite}" alt="${esc(m.name)}"></span>`;
  return `<span class="avatar ${cls}" title="${esc(m.name)}">${animalSvg(m)}</span>`;
}

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
