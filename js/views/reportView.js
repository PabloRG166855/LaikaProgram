// Kid-friendly report: big grade, stars, bars without numbers, a few short reasons and one tip from Laika.
import { computeReport } from '../report.js';
import { esc, avatar } from '../ui.js';
import { icon } from '../icons.js';
import { sentFraction } from '../missionEngine.js';
import { sfx } from '../sfx.js';

const clean = t => t.replace(/\s*\([^)]*\d[^)]*\)/g, '').replace(/\s+\+\d+\s*%/g, '');

export function renderReport(root, { state: s, onRedesign, onMenu }) {
  const r = computeReport(s);
  const level = s.level;
  const stars = { A: 3, B: 2, C: 2, D: 1, F: 0 }[r.grade];
  const c = s.counters;

  const reasons = [];
  if (r.aborted) reasons.push(['heart', 'bad', 'La nave se dañó demasiado y tuvieron que regresar.']);
  s.objectives.filter(o => ['fail', 'ignored', 'missed'].includes(o.status)).slice(0, 2)
    .forEach(o => reasons.push(['target', 'bad', `No se logró: ${o.def.name}.`]));
  if (c.statusSec.blackout > 1) reasons.push(['battery-low', 'bad', 'Hubo apagones. Arregla rápido las fallas eléctricas.']);
  if (sentFraction(s) < 0.9 || c.statusSec.commsDown > 1) reasons.push(['satellite-dish', 'bad', 'Se perdió ciencia. Una antena más fuerte ayuda.']);
  if (c.ignored > 0) reasons.push(['clock', 'bad', 'Algunos problemas nadie los atendió.']);
  if (!r.goalMet) reasons.push(['flask-conical', 'bad', 'Faltó ciencia: lleva más instrumentos o aprovecha las oportunidades.']);
  const good = [];
  if (r.mainDone === r.mainTotal) good.push(['trophy', 'good', '¡Cumpliste todos los objetivos!']);
  if (r.goalMet) good.push(['flask-conical', 'good', '¡Llegaste a la meta de ciencia!']);
  if (s.integrity >= 70) good.push(['heart', 'good', 'La nave regresó en buen estado.']);
  const shown = [...good.slice(0, 2), ...reasons.slice(0, 3)];
  const tip = r.tips[0] ? clean(r.tips[0]) : 'Prueba otra nave o tripulación: ¡no hay una sola forma de ganar!';

  const bars = [
    ['target', 'Objetivos', r.mainTotal ? r.mainDone / r.mainTotal : 1],
    ['flask-conical', 'Ciencia', Math.min(1, r.science / level.scienceGoal)],
    ['heart', 'Nave', s.integrity / 100],
    ...(s.launch?.flight && !s.launch.flight.skipped ? [['rocket', 'Despegue', s.launch.flight.total / 9]] : [])
  ];

  root.innerHTML = `
    <div class="kid-report">
      <div class="kr-head" style="background-image:linear-gradient(90deg, rgba(0,0,0,.96) 35%, rgba(0,0,0,.5)), url('${level.image}')">
        <div class="grade ${r.grade}">${r.grade}</div>
        <div>
          <div class="kr-stars">${[1, 2, 3].map(i => `<span class="${i <= stars ? 'on' : ''}">${icon('star', 34)}</span>`).join('')}</div>
          <h1>${esc(r.title)}</h1>
          <p>${esc(r.subtitle)}</p>
        </div>
      </div>
      <div class="kr-grid">
        <div class="glass kr-card">
          ${bars.map(([ic, label, f]) => `
            <div class="hs-row">
              <span class="hs-ico ${f >= 0.7 ? 'good' : f >= 0.4 ? 'warn' : 'bad'}">${icon(ic, 20)}</span>
              <div class="hs-main"><div class="hs-label">${esc(label)}</div>
              <div class="hs-bar ${f >= 0.7 ? 'good' : f >= 0.4 ? 'warn' : 'bad'}"><span style="width:${Math.min(1, f) * 100}%"></span></div></div>
            </div>`).join('')}
        </div>
        <div class="glass kr-card">
          ${shown.map(([ic, cls, text]) => `<div class="kr-reason ${cls}">${icon(ic, 20)}<span>${esc(text)}</span></div>`).join('')}
        </div>
        <div class="glass kr-card kr-laika">
          ${avatar(s.data.crew.director, 'lg')}
          <div><b>Laika dice:</b><p>${esc(tip)}</p></div>
        </div>
        <div class="glass kr-card kr-real">
          ${icon('satellite', 22)}
          <div><b>Misión real parecida</b><p>${esc(level.realMission.name)}: ${esc(level.realMission.text)}</p></div>
        </div>
      </div>
      <div class="actions">
        <button class="btn go big" data-act="redesign">${icon('refresh-cw', 20)} Mejorar mi nave y repetir</button>
        <button class="btn ghost big" data-act="menu">${icon('house', 20)} Inicio</button>
      </div>
    </div>`;

  sfx(r.aborted || r.grade === 'F' ? 'lose' : 'win');

  root.onclick = e => {
    const t = e.target.closest('[data-act]');
    if (!t) return;
    if (t.dataset.act === 'redesign') onRedesign();
    if (t.dataset.act === 'menu') onMenu();
  };
}
