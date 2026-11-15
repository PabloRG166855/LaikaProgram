// Full-screen mission: the orbital map fills the screen; a light HUD with rings (no numbers).
// Events appear on the map; tapping one opens a Dispatch-style window to send 1–2 crew.
import {
  createMission, tick, assign, calcChance, isPaused, creditedScience, sentFraction, isBlackout, isExhausted,
  unavailableReason, taskDuration, requirements, teamStats, chooseApproach, eventSpecialties, MAX_TEAM
} from '../missionEngine.js';
import { STAT_NAMES } from '../util.js';
import { esc, avatar, dispatchRadar, STAT_KEYS, STAT_ICON_NAME } from '../ui.js';
import { icon } from '../icons.js';
import { OrbitMap } from './orbitMap.js';
import { sfx } from '../sfx.js';

const PART_TEXT = {
  power: 'energía', battery: 'baterías', comms: 'antena', computer: 'computadora', engine: 'motor',
  hull: 'casco', cabin: 'cabina', life_support: 'aire', instruments: 'instrumentos', attitude: 'orientación'
};

// Effect → icon + whether it's good, for kid-friendly feedback (no numbers)
const FX = {
  integrity: ['heart', 'Nave'], power: ['battery-charging', 'Energía'], life: ['wind', 'Aire'],
  science: ['flask-conical', 'Ciencia'], data: ['satellite-dish', 'Señal'], fatigueAll: ['feather', 'Cansancio'],
  blackout: ['battery-low', 'Apagón'], commsDown: ['wifi-off', 'Sin señal'], sensorsDown: ['scan-search', 'Sensores'],
  crewOut: ['user', 'Tripulante fuera']
};
const BAD_WHEN_UP = new Set(['fatigueAll', 'blackout', 'commsDown', 'sensorsDown', 'crewOut']);

export function effectChips(effects) {
  return Object.entries(effects || {}).filter(([k, v]) => v && FX[k]).map(([k, v]) => {
    const good = BAD_WHEN_UP.has(k) ? v < 0 : v > 0;
    const timed = ['blackout', 'commsDown', 'sensorsDown', 'crewOut'].includes(k);
    return `<span class="fx-chip ${good ? 'good' : 'bad'}">${icon(FX[k][0], 15)}${esc(FX[k][1])}${timed ? '' : good ? ' ▲' : ' ▼'}</span>`;
  }).join('');
}

const BLOCKS = 8;
/** 8-bit block meter: an icon and 8 blocks that light up. */
function ring(id, ico, label) {
  return `
    <div class="meter" id="${id}" title="${esc(label)}">
      <span class="meter-ico">${icon(ico, 20)}</span>
      <span class="blocks">${'<i></i>'.repeat(BLOCKS)}</span>
      <small>${esc(label)}</small>
    </div>`;
}

function setRing(el, frac) {
  if (!el) return;
  const f = Math.max(0, Math.min(1, frac));
  const on = Math.ceil(f * BLOCKS - 0.001);
  el.querySelectorAll('.blocks i').forEach((b, i) => b.classList.toggle('on', i < on));
  el.classList.toggle('bad', f < 0.25);
  el.classList.toggle('warn', f >= 0.25 && f < 0.5);
}

export function startMission(root, ctx) {
  const s = createMission(ctx.level, ctx.design, ctx.data, ctx.launchInfo);
  const roles = ctx.data.crew.roles;

  root.innerHTML = `
    <div class="mission-full">
      <canvas id="m-map"></canvas>
      <div class="hud-top">
        <div class="hud-rings glass">
          ${ring('r-int', 'heart', 'Nave')}
          ${ring('r-pow', 'battery-charging', 'Energía')}
          ${ring('r-life', 'wind', 'Aire')}
          ${ring('r-sci', 'flask-conical', 'Ciencia')}
        </div>
        <div class="hud-progress glass">
          <div class="hp-label" id="hp-label"></div>
          <div class="hp-track" id="hp-track"><div class="hp-fill" id="hp-fill"></div><div id="hp-marks"></div></div>
        </div>
        <button class="hud-pause glass" data-act="pause" id="m-pause" aria-label="Pausa">${icon('pause', 22)}</button>
      </div>
      <div class="hud-status" id="m-status"></div>
      <div class="hud-hint" id="m-hint">${icon('crosshair', 16)} Toca un evento en el mapa para enviar a tu tripulación</div>
      <div class="hud-crew glass" id="m-crew"></div>
      <div class="paused-banner hidden" id="m-paused">${icon('pause', 16)} Pausa</div>
      <div class="blackout-overlay hidden" id="m-blackout">${icon('battery-low', 56)}<b>APAGÓN</b><span>Nadie puede trabajar un momento…</span></div>
    </div>`;

  const $ = id => root.querySelector(`#${id}`);
  const modal = document.getElementById('modal');
  const modalBox = document.getElementById('modal-box');
  const map = new OrbitMap($('m-map'), s, uid => openEvent(uid));

  let modalUid = null;
  let picked = [];
  let hoverId = null;
  let lastVersion = -1;
  let lastTiredSig = '';
  let lastRandomCount = 0;
  let last = performance.now();
  let running = true;

  const whereText = ev => (ev.loc.type === 'ship' ? `En la nave: ${PART_TEXT[ev.loc.part] || 'casco'}` : ev.loc.type === 'planet' ? 'En la superficie' : 'En el espacio');

  // ---------- HUD ----------
  function renderProgress() {
    $('hp-marks').innerHTML = s.objectives.map(o => {
      const pos = (o.at / s.duration) * 100;
      return `<button class="hp-mark ${o.status}" style="left:${pos}%" ${o.status === 'active' ? `data-act="event" data-uid="${o.uid}"` : ''} title="${esc(o.def.name)}">${icon(o.def.ico, 16)}</button>`;
    }).join('');
    const active = s.objectives.find(o => o.status === 'active' || o.status === 'working');
    const next = s.objectives.find(o => o.status === 'upcoming');
    $('hp-label').innerHTML = active
      ? `${icon('target', 16)} <b>${esc(active.def.name)}</b>${active.status === 'active' ? ' <span class="now">¡Ahora!</span>' : ''}`
      : next ? `${icon('clock', 16)} Siguiente: ${esc(next.def.name)}` : `${icon('house', 16)} ¡De regreso a casa!`;
  }

  function crewState(m) {
    if (m.outFor > 0) return ['out', 'Fuera'];
    if (m.taskUid) return ['busy', 'Trabajando'];
    if (isExhausted(m)) return ['tired', 'Cansado'];
    return ['free', 'Libre'];
  }

  function renderCrew() {
    $('m-crew').innerHTML = s.crew.map(m => {
      const [st, label] = crewState(m);
      return `
        <div class="hc ${st}" title="${esc(m.name)} — ${label}">
          <div class="hc-av">${avatar(m)}</div>
          <div class="hc-fat" title="Energía del tripulante"><span id="cf-${m.id}"></span></div>
          <b>${esc(m.name)}</b><span class="hc-state">${label}</span>
        </div>`;
    }).join('');
  }

  function updateHud() {
    setRing($('r-int'), s.integrity / 100);
    setRing($('r-pow'), s.power / 100);
    setRing($('r-life'), s.life / 100);
    setRing($('r-sci'), creditedScience(s) / s.level.scienceGoal);
    $('r-int').classList.toggle('danger', s.integrity < 30);
    $('hp-fill').style.width = `${(s.time / s.duration) * 100}%`;
    const st = s.status;
    const out = s.crew.filter(m => m.outFor > 0);
    $('m-status').innerHTML = [
      st.blackout > 0 ? `<span class="status-chip blackout">${icon('battery-low', 16)} Apagón</span>` : '',
      st.commsDown > 0 ? `<span class="status-chip comms">${icon('wifi-off', 16)} Sin señal</span>` : '',
      st.sensorsDown > 0 ? `<span class="status-chip sensors">${icon('scan-search', 16)} Sensores fallando</span>` : '',
      ...out.map(m => `<span class="status-chip crewout">${icon('user', 16)} ${esc(m.name)} fuera</span>`),
      sentFraction(s) < 0.7 ? `<span class="status-chip comms">${icon('satellite-dish', 16)} Se pierde ciencia</span>` : ''
    ].join('');
    $('m-blackout').classList.toggle('hidden', st.blackout <= 0);
    $('m-paused').classList.toggle('hidden', !s.pauseReasons.has('manual'));
    $('m-pause').innerHTML = icon(s.pauseReasons.has('manual') ? 'play' : 'pause', 22);
    $('m-hint').classList.toggle('hidden', s.events.length === 0 || s.time > 40);
    for (const m of s.crew) {
      const c = $(`cf-${m.id}`);
      if (c) c.style.width = `${100 - m.fatigue}%`;
    }
  }

  // ---------- Event window (Dispatch style, fewer numbers) ----------
  function openEvent(uid) {
    const ev = s.events.find(e => e.uid === uid);
    if (!ev || ev.status !== 'pending') return;
    if (isBlackout(s)) {
      kidToast('bad', 'battery-low', 'Apagón', 'Espera a que vuelva la energía.');
      return;
    }
    modalUid = uid;
    picked = [];
    hoverId = null;
    if (s.level.pauseOnDecision) s.pauseReasons.add('modal');
    renderModal();
    modal.classList.remove('hidden');
  }

  function closeModal() {
    modal.classList.remove('dsp-mode');
    modalUid = null;
    picked = [];
    hoverId = null;
    s.pauseReasons.delete('modal');
    modal.classList.add('hidden');
  }

  const chanceWord = c => (c >= 70 ? ['hi', 'Alta'] : c >= 45 ? ['mid', 'Media'] : ['lo', 'Baja']);

  function reqLine(o) {
    const [verb, ...rest] = o.label.split(' ');
    return `<li><span class="req-ico" style="--c:var(--stat-${o.stat})">${icon(STAT_ICON_NAME[o.stat], 16)}</span><span><b class="verb ${o.stat}">${esc(verb)}</b> ${esc(rest.join(' '))}</span></li>`;
  }

  function teamMembers() {
    const ids = [...picked];
    if (hoverId && !ids.includes(hoverId) && ids.length < MAX_TEAM) ids.push(hoverId);
    return ids.map(id => s.crew.find(m => m.id === id)).filter(Boolean);
  }

  function renderCenter(ev) {
    const req = requirements(s, ev.def);
    const team = teamMembers();
    const stats = team.length ? teamStats(team) : null;
    const res = team.length ? calcChance(s, ev, team) : null;
    const slots = [0, 1].map(i => {
      const m = picked[i] ? s.crew.find(c => c.id === picked[i]) : null;
      return m
        ? `<button class="dsp-slot filled" data-m="unpick" data-id="${m.id}">${avatar(m, 'lg')}<span><b>${esc(m.name)}</b><small class="rm">${icon('x', 12)} quitar</small></span></button>`
        : `<div class="dsp-slot empty"><span class="plus">${icon(i === 0 ? 'user' : 'users', 20)}</span><span>${i === 0 ? 'Elige a alguien' : 'Ayudante (opcional)'}</span></div>`;
    }).join('');
    let verdict = `<div class="dsp-verdict empty">Toca a un tripulante: su forma <b class="c-team">azul</b> debe cubrir la forma <b class="c-req">amarilla</b>.</div>`;
    if (res) {
      const [cls, word] = chanceWord(res.chance);
      verdict = `
        <div class="dsp-verdict ${cls}">
          <div class="v-top"><span>Posibilidad de éxito</span><b>${word}</b></div>
          <div class="v-bar"><span style="width:${res.chance}%"></span></div>
          <div class="v-approach">${res.missing.length
            ? `${icon('triangle-alert', 14)} Le falta: ${res.missing.map(k => `<b class="verb ${k}">${STAT_NAMES[k]}</b>`).join(', ')}`
            : `${icon('check', 14)} ¡Cubre todo lo que pide!`}</div>
        </div>`;
    }
    return `
      <div class="dsp-radar">${dispatchRadar(req, stats, 310, false)}</div>
      <div class="dsp-slots">${slots}</div>
      ${verdict}
      <div class="dsp-actions">
        <button class="btn ghost" data-m="close">${icon('x', 16)} Cerrar</button>
        <button class="btn go" data-m="send" ${picked.length ? '' : 'disabled'}>${icon('rocket', 18)} Enviar</button>
      </div>`;
  }

  function barFor(m, k, need) {
    const v = m.stats[k];
    return `
      <div class="cs-row ${need > v ? 'miss' : 'ok'}">
        <span class="cs-k verb ${k}">${icon(STAT_ICON_NAME[k], 14)}</span>
        <span class="cs-track">
          <span class="cs-fill ${k}" style="width:${v * 10}%"></span>
          ${need > v ? `<span class="cs-gap" style="left:${v * 10}%;width:${(need - v) * 10}%"></span>` : ''}
          <span class="cs-need" style="left:${need * 10}%"></span>
        </span>
      </div>`;
  }

  function renderRoster(ev) {
    const specs = eventSpecialties(ev.def);
    const req = requirements(s, ev.def);
    const order = [...s.crew].sort((x, y) => (unavailableReason(s, x) ? 1 : 0) - (unavailableReason(s, y) ? 1 : 0));
    return order.map(m => {
      const why = unavailableReason(s, m);
      const [st, label] = crewState(m);
      const sel = picked.includes(m.id);
      return `
        <button class="crew-pick ${sel ? 'selected' : ''}" data-m="pick" data-id="${m.id}" ${why ? 'disabled' : ''}>
          <span class="cp-face">${avatar(m, 'xl')}${sel ? `<span class="cp-check">${icon('check', 14)}</span>` : ''}</span>
          <span class="cp-info">
            <span class="cp-head"><b>${esc(m.name)}</b><span class="badge ${st}">${label}</span></span>
            <small>${icon(roles[m.role].ico, 13)} ${esc(roles[m.role].name)}${specs.includes(m.role) ? ` <span class="spec">${icon('star', 11)} IDEAL</span>` : ''}</small>
            ${STAT_KEYS.map(k => barFor(m, k, req[k])).join('')}
          </span>
        </button>`;
    }).join('');
  }

  function renderModal() {
    const ev = s.events.find(e => e.uid === modalUid);
    if (!ev) return closeModal();
    const def = ev.def;
    const kind = ev.main ? '<span class="tag-main">OBJETIVO</span>' : def.positive ? '<span class="tag-kind pos">OPORTUNIDAD</span>' : '<span class="tag-kind neg">EMERGENCIA</span>';
    const ignore = effectChips(def.onIgnore?.effects);
    modalBox.className = `modal-box dsp ${ev.main ? 'main' : ''}`;
    modal.classList.add('dsp-mode');
    modalBox.innerHTML = `
      <header class="dsp-top">
        <span class="dsp-icon ${ev.main ? 'main' : def.positive ? 'pos' : 'neg'}">${icon(def.ico, 34)}</span>
        <div class="dsp-title">${kind}<h2>${esc(def.name)}</h2><small>${icon('map', 13)} ${esc(whereText(ev))}</small></div>
        <div class="meter timer" id="dsp-timer"><span class="meter-ico">${icon('timer', 20)}</span><span class="blocks">${'<i></i>'.repeat(BLOCKS)}</span></div>
        <button class="btn ghost small" data-m="close" aria-label="Cerrar">${icon('x', 18)}</button>
      </header>
      <div class="dsp-body">
        <section class="dsp-panel dsp-left">
          <header class="panel-head">EL PROBLEMA</header>
          <p class="case-text">${esc(def.text)}</p>
          <header class="panel-head mid">QUÉ SE NECESITA</header>
          <ul class="req-list">${def.options.map(reqLine).join('')}</ul>
          ${ignore ? `<div class="risk">${icon('triangle-alert', 16)} Si lo ignoras:<div class="fx-row">${ignore}</div></div>` : ''}
          ${def.learn ? `<details class="learn"><summary>${icon('sparkles', 14)} Dato real</summary>${esc(def.learn)}</details>` : ''}
        </section>
        <section class="dsp-panel dsp-center" id="dsp-center">${renderCenter(ev)}</section>
        <section class="dsp-panel dsp-right">
          <header class="panel-head">TU TRIPULACIÓN</header>
          <p class="info small"><span class="mk-need"></span> = lo que pide · <span class="mk-gap"></span> = le falta</p>
          <div class="crew-list" id="dsp-roster">${renderRoster(ev)}</div>
        </section>
      </div>`;
    updateModalTimer();
  }

  function refreshModalParts() {
    const ev = s.events.find(e => e.uid === modalUid);
    if (!ev) return;
    modalBox.querySelector('#dsp-center').innerHTML = renderCenter(ev);
    modalBox.querySelector('#dsp-roster').innerHTML = renderRoster(ev);
  }

  function updateModalTimer() {
    if (modalUid === null) return;
    const ev = s.events.find(e => e.uid === modalUid);
    const t = modalBox.querySelector('#dsp-timer');
    if (ev && t) setRing(t, (ev.expiresAt - s.time) / (ev.expiresAt - ev.spawnedAt));
  }

  function sendTeam() {
    if (!picked.length || modalUid === null) return;
    if (assign(s, modalUid, picked)) closeModal();
  }

  modalBox.onclick = e => {
    const t = e.target.closest('[data-m]');
    if (!t || modalUid === null) return;
    const id = t.dataset.id;
    if (t.dataset.m === 'close') return closeModal();
    if (t.dataset.m === 'send') return sendTeam();
    if (t.dataset.m === 'unpick') picked = picked.filter(x => x !== id);
    if (t.dataset.m === 'pick' && !t.disabled) {
      sfx('select');
      if (picked.includes(id)) picked = picked.filter(x => x !== id);
      else if (picked.length < MAX_TEAM) picked = [...picked, id];
      else picked = [picked[0], id];
      hoverId = null;
    }
    refreshModalParts();
  };
  modalBox.onmouseover = e => {
    const t = e.target.closest('[data-m="pick"]');
    const id = t && !t.disabled ? t.dataset.id : null;
    if (id !== hoverId && modalUid !== null) {
      hoverId = id;
      const ev = s.events.find(x => x.uid === modalUid);
      if (ev) modalBox.querySelector('#dsp-center').innerHTML = renderCenter(ev);
    }
  };
  modal.onclick = e => { if (e.target === modal) closeModal(); };
  const onKey = e => {
    if (modalUid === null || !running) return;
    if (e.key === 'Escape') closeModal();
    if (e.key === 'Enter') sendTeam();
  };
  if (document._laikaKey) document.removeEventListener('keydown', document._laikaKey);
  document._laikaKey = onKey;
  document.addEventListener('keydown', onKey);

  root.onclick = e => {
    const t = e.target.closest('[data-act]');
    if (!t) return;
    if (t.dataset.act === 'event') openEvent(Number(t.dataset.uid));
    if (t.dataset.act === 'pause') {
      if (s.pauseReasons.has('manual')) s.pauseReasons.delete('manual');
      else s.pauseReasons.add('manual');
    }
  };

  // ---------- Kid-friendly toasts ----------
  function kidToast(kind, ico, title, text, fxHtml = '') {
    const box = document.getElementById('toasts');
    const el = document.createElement('div');
    el.className = `toast kid ${kind}`;
    el.innerHTML = `<span class="kt-ico">${icon(ico, 22)}</span><div><b>${esc(title)}</b>${text ? `<div>${esc(text)}</div>` : ''}${fxHtml ? `<div class="fx-row">${fxHtml}</div>` : ''}</div>`;
    el.addEventListener('click', () => el.remove());
    box.appendChild(el);
    while (box.children.length > 3) box.firstElementChild.remove();
    setTimeout(() => el.remove(), 5000);
  }

  function showNotice(n) {
    sfx(n.kind === 'main' ? 'objective' : n.kind === 'success' ? 'success' : n.kind === 'status' ? 'blip' : 'fail');
    if (n.kind === 'main') return kidToast('main', 'target', n.title.replace(/^🎯\s*/, ''), n.text);
    if (n.kind === 'status') return kidToast('status', 'check', n.title.replace(/^[^\wÁÉÍÓÚáéíóúñ¡]+/, ''), '');
    const ev = n;
    const fx = n.rawEffects ? effectChips(n.rawEffects) : '';
    const title = n.kind === 'success' ? '¡Lo lograron!' : n.kind === 'fail' ? 'No salió bien' : 'Nadie lo atendió';
    const ico = n.kind === 'success' ? 'check' : n.kind === 'fail' ? 'triangle-alert' : 'clock';
    kidToast(n.kind === 'success' ? 'success' : 'fail', ico, `${title} · ${n.eventName || ''}`, n.shortText || '', fx);
    void ev;
  }

  // ---------- Loop ----------
  function frame(now) {
    if (!running) return;
    const dt = Math.min(0.25, (now - last) / 1000);
    last = now;
    tick(s, dt).forEach(showNotice);

    if (modalUid !== null && isBlackout(s)) {
      closeModal();
      kidToast('bad', 'battery-low', 'Apagón', 'La consola se bloqueó.');
    }
    const tiredSig = s.crew.map(m => crewState(m)[0]).join('');
    if (tiredSig !== lastTiredSig) { lastTiredSig = tiredSig; renderCrew(); }
    if (modalUid !== null && !s.events.some(e => e.uid === modalUid && e.status === 'pending')) closeModal();
    const randomCount = s.counters.spawned;
    if (randomCount > lastRandomCount) { lastRandomCount = randomCount; sfx('alert'); }
    if (s.version !== lastVersion) {
      if (modalUid !== null) refreshModalParts();
      renderProgress();
      renderCrew();
      lastVersion = s.version;
    }
    updateHud();
    updateModalTimer();
    map.draw(s, now);

    if (s.over) {
      running = false;
      closeModal();
      setTimeout(() => ctx.onEnd(s), 900);
      return;
    }
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(t => { last = t; frame(t); });
}
