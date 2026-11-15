// Step 2 of the hangar: pick an animal astronaut for each seat. Big portraits, bars without numbers.
import { computeShipStats, crewIdsOf } from '../ship.js';
import { esc, avatar, radarSvg, averageStats } from '../ui.js';
import { sfx } from '../sfx.js';
import { icon } from '../icons.js';
import { STAT_NAMES } from '../util.js';

const STAT_ICON = { speed: 'zap', analysis: 'brain', tech: 'wrench', calm: 'feather' };
const STAT_ORDER = ['speed', 'analysis', 'tech', 'calm'];
const STAT_HELP = {
  speed: 'Reacciona rápido en emergencias.',
  analysis: 'Piensa, diagnostica y hace ciencia.',
  tech: 'Repara y maneja máquinas.',
  calm: 'No se pone nervioso y se cansa menos.'
};

const coins = cost => {
  const n = cost < 35 ? 1 : cost < 50 ? 2 : 3;
  return `<span class="coins">${[1, 2, 3].map(i => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</span>`;
};

export function statBarsHtml(m) {
  return `<div class="kstats">${STAT_ORDER.map(k => `
    <div class="kstat ${k}" title="${STAT_NAMES[k]}: ${STAT_HELP[k]}">
      ${icon(STAT_ICON[k], 16)}
      <span class="kbar"><span style="width:${m.stats[k] * 10}%"></span></span>
    </div>`).join('')}</div>`;
}

export function renderCrew(root, ctx) {
  const { data, level, design } = ctx;
  const roles = data.crew.roles;
  const byId = id => data.crew.members.find(m => m.id === id);
  let seat = (level.crewSlots.find(s => !design.crew[s.id]) || level.crewSlots[0]).id;
  let help = false;

  root.innerHTML = `
    <div class="crewstep">
      <div class="cs-top">
        <button class="btn ghost" data-act="back">${icon('arrow-right', 18, 'flip')} Nave</button>
        <div class="cs-title"><span class="h-step">2/2</span><div><b>Elige tu tripulación</b><small>Un animal astronauta para cada asiento</small></div></div>

      </div>
      <div class="cs-seats" id="cs-seats"></div>
      <div class="cs-body">
        <div class="cs-cands" id="cs-cands"></div>
        <aside class="cs-side glass">
          <div class="cs-radar" id="cs-radar"></div>
          <div class="cs-legend" id="cs-legend"></div>
          <div id="cs-alert"></div>
          <button class="btn go big" id="cs-launch" data-act="launch">${icon('rocket', 20)} ¡Despegar!</button>
        </aside>
      </div>
    </div>`;
  const el = id => root.querySelector(`#${id}`);

  function render() {
    const st = computeShipStats(design, level, data);

    el('cs-seats').innerHTML = level.crewSlots.map(s => {
      const m = design.crew[s.id] ? byId(design.crew[s.id]) : null;
      const r = roles[s.roles[0]];
      return `
        <button class="seat ${seat === s.id ? 'active' : ''} ${m ? 'filled' : ''}" data-act="seat" data-id="${s.id}">
          <span class="seat-label">${icon(r.ico, 16)} ${esc(s.label)}</span>
          ${m ? avatar(m, 'seat-av') : `<span class="seat-empty">${icon('user', 40)}</span>`}
          <b>${m ? esc(m.name) : 'Vacío'}</b>
        </button>`;
    }).join('');

    const slot = level.crewSlots.find(s => s.id === seat);
    const cands = data.crew.members.filter(m => slot.roles.includes(m.role));
    el('cs-cands').innerHTML = `
      <div class="cs-cands-head">
        <b>${esc(slot.label)}</b>
        <button class="q ${help ? 'on' : ''}" data-act="help" aria-label="¿Qué significan las barras?">?</button>
        ${help ? `<div class="hs-help">${STAT_ORDER.map(k => `<span>${icon(STAT_ICON[k], 14)} <b>${STAT_NAMES[k]}</b>: ${STAT_HELP[k]}</span>`).join('')}</div>` : ''}
      </div>
      <div class="cand-grid">
        ${cands.map(m => {
          const inSeat = level.crewSlots.find(s => design.crew[s.id] === m.id);
          return `
            <button class="cand ${inSeat ? 'selected' : ''}" data-act="pick" data-id="${m.id}">
              ${avatar(m, 'cand-av')}
              <span class="cand-info">
                <b>${esc(m.name)}</b>
                <small>${icon(roles[m.role].ico, 14)} ${esc(roles[m.role].name)}</small>
                ${statBarsHtml(m)}
                <span class="cand-bio">${esc(m.bio)}</span>
              </span>
              ${inSeat ? `<span class="cand-check">${icon('check', 18)}</span>` : ''}
            </button>`;
        }).join('')}
      </div>`;

    const team = crewIdsOf(design).map(byId);
    el('cs-radar').innerHTML = radarSvg(averageStats(team), { size: 170, labels: false });
    el('cs-legend').innerHTML = STAT_ORDER.map(k => `<span class="${k}">${icon(STAT_ICON[k], 14)} ${STAT_NAMES[k]}</span>`).join('');
    const missing = level.crewSlots.filter(s => !design.crew[s.id]).length;
    const problem = missing ? ['user', `Faltan ${missing === 1 ? 'un tripulante' : `${missing} tripulantes`}.`]
      : !st.valid ? ['triangle-alert', 'Revisa tu nave antes de despegar.'] : null;
    el('cs-alert').innerHTML = problem
      ? `<div class="alert-pill">${icon(problem[0], 18)}<span>${esc(problem[1])}</span></div>`
      : `<div class="alert-pill ok">${icon('check', 18)}<span>¡Todo listo para despegar!</span></div>`;
    el('cs-launch').disabled = !!problem;
  }

  root.onclick = e => {
    const t = e.target.closest('[data-act]');
    if (!t) return;
    const { act, id } = t.dataset;
    if (act === 'back') return ctx.onBack();
    if (act === 'launch') { if (!t.disabled) ctx.onLaunch(); return; }
    if (act === 'help') help = !help;
    if (act === 'seat') seat = id;
    if (act === 'pick') {
      sfx('select');
      const slot = level.crewSlots.find(s => s.id === seat);
      const current = level.crewSlots.find(s => design.crew[s.id] === id);
      if (current) design.crew[current.id] = null;
      else {
        design.crew[slot.id] = id;
        const next = level.crewSlots.find(s => !design.crew[s.id]);
        if (next) seat = next.id;
      }
    }
    render();
  };

  render();
}
