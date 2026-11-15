// Full-screen mission: the orbital map fills the screen; a light HUD with rings (no numbers).
// Events appear on the map; tapping one opens a Dispatch-style window to send 1–2 crew.
import {
  createMission, tick, assign, calcChance, isPaused, creditedScience, sentFraction, isBlackout, isExhausted,
  unavailableReason, taskDuration, requirements, teamStats, chooseApproach, eventSpecialties, MAX_TEAM, resolveRepair, debugSpawn
} from '../missionEngine.js';
import { openRepairGame } from './repairGame.js';
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

let hintSeenThisSession = false; // el aviso de "toca un evento" sale una sola vez

export function startMission(root, ctx) {
  const s = createMission(ctx.level, ctx.design, ctx.data, ctx.launchInfo);
  const roles = ctx.data.crew.roles;

  root.innerHTML = `
    <div class="mission-full">
      <div class="hud-bar">
        <div class="hud-progress glass">
          <div class="hp-label" id="hp-label"></div>
          <div class="hp-track" id="hp-track"><div class="hp-fill" id="hp-fill"></div><div id="hp-marks"></div></div>
        </div>
        <button class="hud-pause glass" data-act="pause" id="m-pause" aria-label="Pausa">${icon('pause', 20)}</button>
      </div>
      <div class="m-body">
        <div class="m-mapwrap">
          <canvas id="m-map"></canvas>
          <div class="hud-status" id="m-status"></div>
          <div class="m-alerts" id="m-alerts" aria-live="polite"></div>
          <div class="m-laika hidden" id="m-laika">
            <span class="hl-face">${avatar(ctx.data.crew.director, 'lg')}<small>Laika</small></span>
            <div class="hl-bubble" id="m-laika-text"></div>
          </div>
          <div class="hud-crew" id="m-crew"></div>
          <div class="m-speed" id="m-speed"><span>VELOCIDAD DE TU NAVE</span><b id="m-speed-val">—</b></div>
          <div class="m-redflash" id="m-redflash" aria-hidden="true"></div>
          <div class="paused-banner hidden" id="m-paused">${icon('pause', 16)} Pausa</div>
          <div class="blackout-overlay hidden" id="m-blackout">${icon('battery-low', 56)}<b>APAGÓN</b><span>Nadie puede trabajar un momento…</span></div>
        </div>
        <aside class="hud-rings glass">
          ${ring('r-int', 'heart', 'Nave')}
          ${ring('r-pow', 'battery-charging', 'Energía')}
          ${ring('r-life', 'wind', 'Aire')}
          ${ring('r-sci', 'flask-conical', 'Ciencia')}
        </aside>
      </div>
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
  let hintShown = hintSeenThisSession;

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
    $('hp-fill').style.width = `${Math.min(1, s.time / s.duration) * 100}%`;
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
    if (s.events.length > 0 && !hintShown) {
      hintShown = true;
      hintSeenThisSession = true;
      laikaSay('crosshair', '¡Algo pasa!', 'Toca un evento en el mapa. Los que tienen llave los arreglas tú; los demás, tu tripulación.', 9000);
    }
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
      kidToast('bad', 'battery-low', 'Apagón: espera a que vuelva la energía');
      return;
    }
    if (ev.def.sts125) return openSts125(ev);
    if (ev.def.minigame) return openRepair(ev);
    modalUid = uid;
    picked = [];
    hoverId = null;
    if (s.level.pauseOnDecision) s.pauseReasons.add('modal');
    renderModal();
    modal.classList.remove('hidden');
  }

  // ---------- Ship repairs: the player fixes them with a minigame ----------
  let repairOpen = null;
  function openRepair(ev) {
    if (repairOpen) return;
    s.pauseReasons.add('repair');
    repairOpen = openRepairGame(root.querySelector('.mission-full'), {
      def: ev.def,
      main: ev.main,
      onDone: res => {
        repairOpen = null;
        s.pauseReasons.delete('repair');
        if (!res) return;
        const n = resolveRepair(s, ev.uid, res);
        if (n) showNotice(n);
      }
    });
  }

  // ---------- Hubble objectives: the team's STS-125 minigames, played inside the mission ----------
  let stsOpen = null;
  function openSts125(ev) {
    if (stsOpen) return;
    s.pauseReasons.add('repair');
    const wrap = document.createElement('div');
    wrap.className = 'sts-overlay';
    wrap.innerHTML = `
      <iframe src="minigames/sts125/${ev.def.sts125}/index.html?embed=1${ev.def.sts125Query ? `&${ev.def.sts125Query}` : ''}" title="${esc(ev.def.name)}" allow="autoplay"></iframe>
      <button class="sts-exit" type="button" aria-label="Salir y seguir después">${icon('x', 18)}<span>Salir (seguir después)</span></button>`;
    root.querySelector('.mission-full').appendChild(wrap);
    document.body.classList.add('rg-open');
    const frame = wrap.querySelector('iframe');
    frame.addEventListener('load', () => frame.focus());
    let result = null;
    const onMsg = e => {
      if (e.source !== frame.contentWindow || !e.data || e.data.source !== 'sts125') return;
      if (e.data.type === 'result') result = e.data;
      if (e.data.type === 'close') close();
    };
    function close() {
      window.removeEventListener('message', onMsg);
      wrap.remove();
      document.body.classList.remove('rg-open');
      stsOpen = null;
      s.pauseReasons.delete('repair');
      if (!result) return; // left before finishing: the objective stays on the map
      // finishing the team's game completes the objective; lots of stars give bonus points
      const ratio = result.max ? result.total / result.max : 0;
      const n = resolveRepair(s, ev.uid, { success: true, perfect: ratio >= 0.85 });
      if (n) showNotice(n);
    }
    wrap.querySelector('.sts-exit').addEventListener('click', close);
    window.addEventListener('message', onMsg);
    stsOpen = { close };
  }

  function closeModal() {
    modal.classList.remove('dsp-mode');
    modalUid = null;
    picked = [];
    hoverId = null;
    s.pauseReasons.delete('modal');
    modal.classList.add('hidden');
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
    const line = !res
      ? `Elige a quién mandar: su forma <b class="c-team">azul</b> debe cubrir la <b class="c-req">amarilla</b>.`
      : res.missing.length
        ? `${icon('triangle-alert', 14)} Le falta: ${res.missing.map(k => `<b class="verb ${k}">${STAT_NAMES[k]}</b>`).join(', ')}`
        : `${icon('check', 14)} ¡Cubre todo lo que pide!`;
    return `
      <div class="dsp-radar">${dispatchRadar(req, stats, 300, false)}</div>
      <p class="lite-line ${res ? (res.missing.length ? 'miss' : 'ok') : ''}">${line}</p>`;
  }

  function renderRoster(ev) {
    const specs = eventSpecialties(ev.def);
    const order = [...s.crew].sort((x, y) => (unavailableReason(s, x) ? 1 : 0) - (unavailableReason(s, y) ? 1 : 0));
    return order.map(m => {
      const why = unavailableReason(s, m);
      const [st, label] = crewState(m);
      const sel = picked.includes(m.id);
      return `
        <button class="crew-pick lite ${sel ? 'selected' : ''}" data-m="pick" data-id="${m.id}" ${why ? 'disabled' : ''}>
          <span class="cp-face">${avatar(m, 'lg')}${sel ? `<span class="cp-check">${icon('check', 14)}</span>` : ''}</span>
          <span class="cp-info">
            <b>${esc(m.name)}</b>
            <small>${specs.includes(m.role) ? `<span class="spec">${icon('star', 11)} IDEAL</span>` : esc(roles[m.role].name)}${st !== 'free' ? ` · <span class="badge ${st}">${label}</span>` : ''}</small>
          </span>
        </button>`;
    }).join('');
  }

  function renderModal() {
    const ev = s.events.find(e => e.uid === modalUid);
    if (!ev) return closeModal();
    const def = ev.def;
    const kind = ev.main ? '<span class="tag-main">OBJETIVO</span>' : def.positive ? '<span class="tag-kind pos">OPORTUNIDAD</span>' : '<span class="tag-kind neg">EMERGENCIA</span>';
    modal.classList.add('dsp-mode');
    modalBox.className = `modal-box dsp lite ${ev.main ? 'main' : ''}`;
    modalBox.innerHTML = `
      <header class="dsp-top">
        <span class="dsp-icon ${ev.main ? 'main' : def.positive ? 'pos' : 'neg'}">${icon(def.ico, 30)}</span>
        <div class="dsp-title">${kind}<h2>${esc(def.name)}</h2></div>
        <div class="meter timer" id="dsp-timer"><span class="meter-ico">${icon('timer', 20)}</span><span class="blocks">${'<i></i>'.repeat(BLOCKS)}</span></div>
        <button class="btn ghost small" data-m="close" aria-label="Cerrar">${icon('x', 18)}</button>
      </header>
      <div class="lite-body">
        <section class="lite-left">
          <p class="case-text">${esc(def.text)}</p>
          <div id="dsp-center">${renderCenter(ev)}</div>
        </section>
        <section class="lite-right">
          <header class="panel-head">¿A QUIÉN MANDAS?</header>
          <div class="crew-list" id="dsp-roster">${renderRoster(ev)}</div>
          <button class="btn go big" data-m="send" id="dsp-send" ${picked.length ? '' : 'disabled'}>${icon('rocket', 18)} Enviar</button>
        </section>
      </div>`;
    updateModalTimer();
  }

  function refreshModalParts() {
    const ev = s.events.find(e => e.uid === modalUid);
    if (!ev) return;
    modalBox.querySelector('#dsp-center').innerHTML = renderCenter(ev);
    modalBox.querySelector('#dsp-roster').innerHTML = renderRoster(ev);
    modalBox.querySelector('#dsp-send').disabled = !picked.length;
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

  // ---------- Avisos simples: Laika habla, y los resultados son iconos pequeños ----------
  let laikaTimer = 0;
  function laikaSay(ico, title, text, ms = 6000) {
    const box = $('m-laika');
    $('m-laika-text').innerHTML = `<b>${icon(ico, 16)} ${esc(title)}</b><p>${esc(text)}</p>`;
    box.classList.remove('hidden', 'pop');
    void box.offsetWidth;
    box.classList.add('pop');
    clearTimeout(laikaTimer);
    laikaTimer = setTimeout(() => box.classList.add('hidden'), ms);
  }
  $('m-laika').addEventListener('click', () => $('m-laika').classList.add('hidden'));

  // pequeño aviso con icono (se va solo); los fallos además hacen parpadear el borde en rojo, suave
  function kidToast(kind, ico, title) {
    const box = $('m-alerts');
    const el = document.createElement('div');
    el.className = `m-chip ${kind}`;
    el.innerHTML = `${icon(ico, 18)}<span>${esc(title)}</span>`;
    box.appendChild(el);
    while (box.children.length > 3) box.firstElementChild.remove();
    setTimeout(() => el.remove(), 3200);
    if (kind === 'fail' || kind === 'bad') {
      const f = $('m-redflash');
      f.classList.remove('on');
      void f.offsetWidth;
      f.classList.add('on');
    }
  }

  function showNotice(n) {
    sfx(n.kind === 'main' ? 'objective' : n.kind === 'success' ? 'success' : n.kind === 'status' ? 'blip' : 'fail');
    if (n.kind === 'main') return laikaSay('target', '¡Nuevo objetivo!', `${n.title.replace(/^🎯\s*Objetivo principal:\s*/, '')}. ${n.text || ''}`, 5000);
    if (n.kind === 'status') return kidToast('status', 'check', n.title.replace(/^[^\wÁÉÍÓÚáéíóúñ¡]+/, ''));
    const name = n.eventName || '';
    if (n.kind === 'success') return kidToast('success', 'check', n.repair ? `Reparado · ${name}` : `¡Bien! · ${name}`);
    kidToast('fail', n.kind === 'fail' ? 'x' : 'clock', `${n.kind === 'fail' ? 'Fallaste' : 'Se te pasó'} · ${name}`);
  }

  // ---------- Loop ----------
  function frame(now) {
    if (!running) return;
    const dt = Math.min(0.25, (now - last) / 1000);
    last = now;
    tick(s, dt).forEach(showNotice);

    if (modalUid !== null && isBlackout(s)) {
      closeModal();
      kidToast('bad', 'battery-low', 'Apagón: la consola se bloqueó');
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
    if (map.speed) {
      const v = Math.round(map.speed);
      const el = $('m-speed-val');
      const txt = `${v.toLocaleString('es-MX')} km/h`;
      if (el.textContent !== txt) {
        el.classList.toggle('up', v > (el._v || v));
        el.classList.toggle('down', v < (el._v || v));
        el._v = v;
        el.textContent = txt;
      }
    }

    if (s.over) {
      running = false;
      closeModal();
      if (repairOpen) repairOpen.close();
      if (stsOpen) stsOpen.close();
      setTimeout(() => ctx.onEnd(s), 900);
      return;
    }
    requestAnimationFrame(frame);
  }

  if (location.search.includes('debug')) window.__laika = { s, openEvent, spawn: id => debugSpawn(s, id) };
  requestAnimationFrame(t => { last = t; frame(t); });
}
