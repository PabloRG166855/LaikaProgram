import { computeReport, GRADE_THRESHOLDS } from '../report.js';
import { fmt, fmtTime } from '../util.js';

const OBJ_ICON = { success: '✅', fail: '❌', ignored: '⌛', active: '⏳', upcoming: '⬜' };
const OBJ_TEXT = { success: 'cumplido', fail: 'fallido', ignored: 'sin atender', active: 'sin terminar', upcoming: 'no se alcanzó' };
import { esc, barHtml } from '../ui.js';

export function renderReport(root, { state: s, onRedesign, onMenu }) {
  const r = computeReport(s);
  const level = s.level;
  const decisions = s.log.filter(e => e.kind !== 'info');

  root.innerHTML = `
    <div class="report-head">
      <div class="grade ${r.grade}">${r.grade}</div>
      <div style="flex:1;min-width:260px">
        <h1>${r.aborted ? '🛑' : r.goalMet ? '🏆' : '🧭'} ${esc(r.title)}</h1>
        <p>${esc(r.subtitle)}</p>
        <p class="info">${esc(level.name)}: ${esc(level.title)} · Puntaje <b>${r.score} / 100</b> · Escala: ${GRADE_THRESHOLDS.filter(t => t.grade !== 'F').map(t => `${t.grade} ≥ ${t.min}`).join(', ')}, F < 40 o misión abortada</p>
      </div>
    </div>

    <div class="report-grid">
      <div class="card">
        <h3>📊 Cómo se calculó tu calificación</h3>
        ${r.breakdown.map(b => `
          <div class="score-row">
            <div class="top"><span>${esc(b.label)}</span><b>${b.value < 0 ? '−' : ''}${fmt(Math.abs(b.value))} / ${b.max}</b></div>
            ${barHtml((Math.max(0, b.value) / b.max) * 100, b.value / b.max >= 0.7 ? 'good' : b.value / b.max >= 0.4 ? 'warn' : 'bad')}
            <small>${esc(b.detail)}</small>
          </div>`).join('')}
      </div>

      <div class="card">
        <h3>🎯 Objetivos principales (${r.mainOk} / ${r.mainTotal})</h3>
        <ul class="objectives">
          ${r.objectives.map(o => `<li class="${o.status}"><span>${OBJ_ICON[o.status] || '•'}</span> ${o.icon} <b>${esc(o.name)}</b> <small>${fmtTime(o.at)} · ${OBJ_TEXT[o.status] || ''}</small></li>`).join('')}
        </ul>
      </div>

      <div class="card">
        <h3>🔍 ¿Por qué pasó esto?</h3>
        ${r.causes.length ? `<ul>${r.causes.map(c => `<li>${esc(c)}</li>`).join('')}</ul>` : '<p>No hubo problemas importantes. ¡Excelente trabajo!</p>'}
        ${r.strengths.length ? `<h4 style="margin-top:12px">💪 Lo que hiciste bien</h4><ul>${r.strengths.map(c => `<li>${esc(c)}</li>`).join('')}</ul>` : ''}
      </div>

      <div class="card">
        <h3>💡 Para tu próximo intento</h3>
        ${r.tips.length ? `<ul>${r.tips.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : '<p class="info">Prueba otro diseño: ¿puedes lograr lo mismo gastando menos?</p>'}
      </div>

      <div class="card">
        <h3>🛰️ Misión real parecida a la tuya</h3>
        <p><b>${esc(level.realMission.name)}</b></p>
        <p class="info">${esc(level.realMission.text)}</p>
      </div>

      <div class="card" style="grid-column:1/-1">
        <h3>📜 Bitácora completa (${decisions.length} eventos)</h3>
        <div class="log" style="max-height:260px;overflow:auto">
          ${decisions.map(e => `<div class="entry ${e.kind}"><b>${esc(e.title)}</b> — ${esc(e.text)} ${e.effects ? `<small>(${esc(e.effects)})</small>` : ''}</div>`).join('') || '<p class="info">Sin eventos.</p>'}
        </div>
      </div>
    </div>

    <div class="actions">
      <button class="btn big" data-act="redesign">🔧 Rediseñar y relanzar</button>
      <button class="btn ghost big" data-act="menu">🌍 Elegir otro nivel</button>
    </div>`;

  root.onclick = e => {
    const t = e.target.closest('[data-act]');
    if (!t) return;
    if (t.dataset.act === 'redesign') onRedesign();
    if (t.dataset.act === 'menu') onMenu();
  };
}
