import {
  createMission, tick, assign, calcChance, isPaused, creditedScience, sentFraction,
  optionDifficulty, locationLabel, eventPoints, mainValue
} from '../missionEngine.js';
import { computeScore } from '../report.js';
import { buildShipArt } from '../shipArt.js';
import { fmt, fmtTime, signed, STAT_NAMES, STAT_SHORT } from '../util.js';
import { esc, setBar, levelClass, toast } from '../ui.js';
import { OrbitMap } from './orbitMap.js';

const STATUS_ICON = { upcoming: '', active: '⏳', success: '✅', fail: '❌', ignored: '⌛' };
const LOC_ICON = { ship: '🛰️', space: '🌌', planet: '🪐', earth: '🌍' };

export function startMission(root, ctx) {
  const s = createMission(ctx.level, ctx.design, ctx.data, ctx.launchInfo);
  const roles = ctx.data.crew.roles;

  root.innerHTML = `
    <div class="dashboard">
      <div class="dash time"><div class="label">⏱️ Tiempo restante</div><div class="value" id="m-time"></div><div class="bar"><div id="m-time-bar"></div></div></div>
      <div class="dash integrity" id="m-int-box"><div class="label">🛡️ Integridad (en 0 abortas)</div><div class="value" id="m-int"></div><div class="bar" id="m-int-bar"><div></div></div></div>
      <div class="dash"><div class="label">⚡ Energía</div><div class="value" id="m-pow"></div><div class="bar" id="m-pow-bar"><div></div></div></div>
      <div class="dash"><div class="label">🫁 Soporte vital</div><div class="value" id="m-life"></div><div class="bar" id="m-life-bar"><div></div></div></div>
      <div class="dash"><div class="label">🔬 Ciencia / meta</div><div class="value" id="m-sci"></div><div class="bar" id="m-sci-bar"><div></div></div></div>
      <div class="dash"><div class="label">📶 Datos enviados</div><div class="value" id="m-data"></div><div class="bar" id="m-data-bar"><div></div></div></div>
      <div class="dash score"><div class="label">⭐ Puntaje</div><div class="value" id="m-score"></div><div class="sub" id="m-score-sub"></div></div>
      <div class="dash-actions"><button class="btn ghost small" data-act="pause" id="m-pause">⏸ Pausa</button></div>
    </div>
    <div class="timeline card">
      <div class="tl-title">🎯 Objetivos principales de la misión</div>
      <div class="tl-body">
        <div class="tl-track"><div class="tl-fill" id="m-tl-fill"></div><div class="tl-now" id="m-tl-now"></div></div>
        <div id="m-tl-marks"></div>
      </div>
    </div>
    <div class="mission-body">
      <div class="map-wrap">
        <canvas id="m-map"></canvas>
        <div class="map-hint">Los eventos aparecen donde ocurren: en tu nave, en el espacio o en ${esc(ctx.level.bodyName === 'Tierra' ? 'la Tierra' : ctx.level.bodyName)}. Tócalos para atenderlos.</div>
        <div class="map-legend"><span><i style="background:#facc15"></i>Objetivo principal</span><span><i style="background:#f59e0b"></i>Problema</span><span><i style="background:#22c55e"></i>Oportunidad</span><span><i style="background:#22d3ee"></i>En proceso</span></div>
        <div class="paused-banner hidden" id="m-paused">⏸ Pausado</div>
      </div>
      <div class="side">
        <div class="card"><h3>🚨 Eventos activos</h3><div class="events-list" id="m-events"></div></div>
        <div class="card"><h3>📜 Bitácora</h3><div class="log" id="m-log"></div></div>
      </div>
    </div>
    <div class="crew-bar" id="m-crew"></div>`;

  const $ = id => root.querySelector(`#${id}`);
  const modal = document.getElementById('modal');
  const modalBox = document.getElementById('modal-box');
  const shipArt = buildShipArt(s.components, { crewCount: s.crew.length });
  const map = new OrbitMap($('m-map'), ctx.level, shipArt, uid => openEvent(uid));

  let modalUid = null;
  let selectedOpt = 0;
  let lastVersion = -1;
  let last = performance.now();
  let running = true;

  // ---------- Rendering ----------
  function evItem(ev) {
    const working = ev.status === 'working';
    const member = working ? s.crew.find(m => m.id === ev.task.crewId) : null;
    const kind = ev.main ? 'main' : ev.def.positive ? 'positive' : 'negative';
    const sub = working
      ? `👷 ${esc(member.name)} trabajando (${ev.task.chance} % de éxito)`
      : ev.main ? 'Objetivo de la misión: ¡atiéndelo!' : ev.def.positive ? 'Oportunidad: ¡aprovéchala!' : 'Problema: asigna a alguien';
    return `
      <button class="ev-item ${working ? 'working' : ''} ${kind}" data-act="event" data-uid="${ev.uid}">
        <div class="row"><b>${ev.def.icon} ${esc(ev.def.name)}</b><small id="ev-t-${ev.uid}"></small></div>
        <div class="ev-loc">${LOC_ICON[ev.loc.type] || '📍'} ${esc(locationLabel(s, ev))}</div>
        <div class="info" style="font-size:.8rem">${sub}</div>
        <div class="bar ${working ? '' : 'warn'}" id="ev-b-${ev.uid}"><div></div></div>
      </button>`;
  }

  function renderEvents() {
    const mains = s.events.filter(e => e.main);
    const rands = s.events.filter(e => !e.main);
    $('m-events').innerHTML = `
      ${mains.length ? `<div class="ev-group main">🎯 Objetivo principal</div>${mains.map(evItem).join('')}` : ''}
      <div class="ev-group">🎲 Imprevistos <small>(suman o restan puntos)</small></div>
      ${rands.length ? rands.map(evItem).join('') : '<p class="info">Sin imprevistos… por ahora.</p>'}`;
  }

  function renderTimeline() {
    $('m-tl-marks').innerHTML = s.script.map(step => {
      const pct = (step.at / s.duration) * 100;
      const edge = pct < 8 ? 'edge-left' : pct > 92 ? 'edge-right' : '';
      return `
        <button class="tl-mark ${step.status} ${edge}" style="left:${pct}%" data-act="tl" data-uid="${step.uid ?? ''}" title="${esc(step.def.name)} · ${fmtTime(step.at)}">
          <span class="tl-dot">${step.def.icon}</span>
          <span class="tl-label">${STATUS_ICON[step.status]} ${esc(step.def.short || step.def.name)}<small>${fmtTime(step.at)}</small></span>
        </button>`;
    }).join('');
  }

  function renderCrew() {
    $('m-crew').innerHTML = s.crew.map(m => {
      const ev = m.taskUid ? s.events.find(e => e.uid === m.taskUid) : null;
      return `
        <div class="crew-tile ${ev ? 'busy' : ''}">
          <div class="who"><b>${roles[m.role].icon} ${esc(m.name)}</b><small>${esc(roles[m.role].name)}</small></div>
          <div class="status">${ev ? `Ocupado: ${esc(ev.def.name)}` : 'Disponible'}</div>
          <div class="info" style="font-size:.75rem">${Object.keys(STAT_SHORT).map(k => `${STAT_SHORT[k]} ${m.stats[k]}`).join(' · ')}</div>
          <div class="info" style="font-size:.75rem;margin-top:3px">Fatiga <span id="cf-${m.id}"></span></div>
          <div class="bar" id="cb-${m.id}"><div></div></div>
        </div>`;
    }).join('');
  }

  function renderLog() {
    $('m-log').innerHTML = s.log.slice(-8).reverse().map(e => `
      <div class="entry ${e.kind} ${e.main ? 'main' : ''}">
        <b>[${fmtTime(e.time)}] ${esc(e.title)}</b><br>${esc(e.text)}
        ${e.effects ? `<br><small>${esc(e.effects)}</small>` : ''}
      </div>`).join('') || '<p class="info">Sin registros aún.</p>';
  }

  function updateDashboard() {
    const remaining = s.duration - s.time;
    const progress = (s.time / s.duration) * 100;
    $('m-time').textContent = fmtTime(remaining);
    $('m-time-bar').style.width = `${progress}%`;
    $('m-tl-fill').style.width = `${progress}%`;
    $('m-tl-now').style.left = `${progress}%`;
    $('m-int').textContent = `${fmt(s.integrity)} %`;
    setBar($('m-int-bar'), s.integrity, levelClass(s.integrity));
    $('m-int-box').classList.toggle('danger', s.integrity < 30);
    $('m-pow').textContent = `${fmt(s.power)} %`;
    setBar($('m-pow-bar'), s.power, levelClass(s.power));
    $('m-life').textContent = `${fmt(s.life)} %`;
    setBar($('m-life-bar'), s.life, levelClass(s.life));
    const sci = creditedScience(s);
    $('m-sci').textContent = `${fmt(sci)} / ${fmt(s.level.scienceGoal)}`;
    setBar($('m-sci-bar'), (sci / s.level.scienceGoal) * 100, sci >= s.level.scienceGoal ? 'good' : '');
    const frac = sentFraction(s) * 100;
    $('m-data').textContent = `${fmt(frac)} %`;
    setBar($('m-data-bar'), frac, frac >= 95 ? 'good' : frac >= 70 ? 'warn' : 'bad');
    const sc = computeScore(s);
    $('m-score').textContent = `${sc.score} / 100`;
    $('m-score-sub').textContent = `🎯 ${sc.mainOk}/${sc.mainTotal} · 🎲 ${signed(s.points)} pts`;
    $('m-paused').classList.toggle('hidden', !isPaused(s));
    $('m-pause').textContent = s.pauseReasons.has('manual') ? '▶ Reanudar' : '⏸ Pausa';
  }

  function updateTimers() {
    for (const ev of s.events) {
      const t = $(`ev-t-${ev.uid}`);
      const b = $(`ev-b-${ev.uid}`);
      if (!t || !b) continue;
      if (ev.status === 'working') {
        const total = ev.task.doneAt - ev.task.startedAt;
        t.textContent = `${Math.ceil(ev.task.doneAt - s.time)} s`;
        b.firstElementChild.style.width = `${((s.time - ev.task.startedAt) / total) * 100}%`;
      } else {
        const left = ev.expiresAt - s.time;
        t.textContent = `⏳ ${Math.ceil(left)} s`;
        const pct = (left / (ev.expiresAt - ev.spawnedAt)) * 100;
        b.className = `bar ${pct < 35 ? 'bad' : 'warn'}`;
        b.firstElementChild.style.width = `${pct}%`;
      }
    }
    for (const m of s.crew) {
      const f = $(`cf-${m.id}`);
      if (f) f.textContent = `${Math.round(m.fatigue)} %`;
      setBar($(`cb-${m.id}`), m.fatigue, m.fatigue >= 60 ? 'bad' : m.fatigue >= 30 ? 'warn' : 'good');
    }
  }

  // ---------- Event modal ----------
  function openEvent(uid) {
    const ev = s.events.find(e => e.uid === uid);
    if (!ev || ev.status !== 'pending') return;
    modalUid = uid;
    selectedOpt = 0;
    if (s.level.pauseOnDecision) s.pauseReasons.add('modal');
    renderModal();
    modal.classList.remove('hidden');
  }

  function closeModal() {
    modalUid = null;
    s.pauseReasons.delete('modal');
    modal.classList.add('hidden');
  }

  function chanceClass(c) {
    return c >= 65 ? 'hi' : c >= 40 ? 'mid' : 'lo';
  }

  function renderModal() {
    const ev = s.events.find(e => e.uid === modalUid);
    if (!ev) return closeModal();
    const opts = ev.def.options;
    const crewRows = s.crew.map(m => {
      const busy = !!m.taskUid;
      const { chance, lines } = calcChance(s, ev, selectedOpt, m);
      return `
        <button class="pick" data-m="crew" data-id="${m.id}" ${busy ? 'disabled' : ''}>
          <div><b>${roles[m.role].icon} ${esc(m.name)}</b> <small>${esc(roles[m.role].name)}${busy ? ' · ocupado' : ''} · fatiga ${Math.round(m.fatigue)} %</small></div>
          <div class="chance ${chanceClass(chance)}">${busy ? '—' : `${chance}%`}</div>
          <div class="breakdown">${lines.map(l => `${esc(l.label)} ${l.value > 0 ? '+' : ''}${l.value}`).join(' · ')}</div>
        </button>`;
    }).join('');
    const pointsLine = ev.main
      ? `Objetivo principal: vale <b>${fmt(mainValue(s), 1)} pts</b> de tu calificación si sale bien.`
      : `Éxito <b>${signed(eventPoints(s, ev, 'success'))} pts</b> · Falla <b>${signed(eventPoints(s, ev, 'fail'))}</b> · Sin atender <b>${signed(eventPoints(s, ev, 'ignored'))}</b>`;

    modalBox.innerHTML = `
      <div class="modal-head">
        <span class="icon">${ev.def.icon}</span>
        <h3>${esc(ev.def.name)}</h3>
        <button class="btn ghost small" data-m="close">✕ Cerrar</button>
      </div>
      <div class="badges">
        ${ev.main ? '<span class="badge main">★ Objetivo principal</span>' : `<span class="badge ${ev.def.positive ? 'pos' : 'neg'}">🎲 Imprevisto ${ev.def.positive ? 'positivo' : 'negativo'}</span>`}
        <span class="badge loc">${LOC_ICON[ev.loc.type] || '📍'} ${esc(locationLabel(s, ev))}</span>
      </div>
      <p>${esc(ev.def.text)}</p>
      <p class="info">${pointsLine}</p>
      ${ev.def.learn ? `<p class="learn">💡 ${esc(ev.def.learn)}</p>` : ''}
      <h4 style="margin-top:12px">1. ¿Cómo lo resuelven?</h4>
      <div class="options">
        ${opts.map((o, i) => `
          <button class="option ${i === selectedOpt ? 'selected' : ''}" data-m="opt" data-i="${i}">
            <b>${esc(o.label)}</b>
            <span>Usa <b>${STAT_NAMES[o.stat]}</b> · dificultad ${optionDifficulty(s, o)} · tarda ${o.duration} s</span>
            ${o.specialties?.length ? `<span>Ideal: ${o.specialties.map(r => roles[r].name).join(', ')}</span>` : ''}
          </button>`).join('')}
      </div>
      <h4>2. ¿Quién lo hace? <small>(toca a un tripulante para asignarlo)</small></h4>
      <div class="picks">${crewRows}</div>
      <p class="info" style="margin-top:10px">${s.level.pauseOnDecision ? '⏸ El tiempo está pausado mientras decides.' : '⚠️ ¡El tiempo sigue corriendo mientras decides!'}</p>`;
  }

  modalBox.onclick = e => {
    const t = e.target.closest('[data-m]');
    if (!t || modalUid === null) return;
    if (t.dataset.m === 'close') return closeModal();
    if (t.dataset.m === 'opt') {
      selectedOpt = Number(t.dataset.i);
      return renderModal();
    }
    if (t.dataset.m === 'crew' && !t.disabled) {
      const uid = modalUid;
      if (assign(s, uid, selectedOpt, t.dataset.id)) closeModal();
    }
  };
  modal.onclick = e => {
    if (e.target === modal) closeModal();
  };

  root.onclick = e => {
    const t = e.target.closest('[data-act]');
    if (!t) return;
    if (t.dataset.act === 'event' || (t.dataset.act === 'tl' && t.dataset.uid)) openEvent(Number(t.dataset.uid));
    if (t.dataset.act === 'pause') {
      if (s.pauseReasons.has('manual')) s.pauseReasons.delete('manual');
      else s.pauseReasons.add('manual');
    }
  };

  // ---------- Loop ----------
  function frame(now) {
    if (!running) return;
    const dt = Math.min(0.25, (now - last) / 1000);
    last = now;
    const notices = tick(s, dt);
    for (const n of notices) toast(n);

    if (modalUid !== null && !s.events.some(e => e.uid === modalUid && e.status === 'pending')) {
      closeModal();
      toast({ kind: 'ignored', title: 'Se acabó el tiempo', text: 'El evento expiró antes de que asignaras a alguien.' }, 3500);
    }
    if (s.version !== lastVersion) {
      lastVersion = s.version;
      renderEvents();
      renderTimeline();
      renderCrew();
      renderLog();
    }
    updateDashboard();
    updateTimers();
    map.draw(s, now);

    if (s.over) {
      running = false;
      closeModal();
      setTimeout(() => ctx.onEnd(s), 900);
      return;
    }
    requestAnimationFrame(frame);
  }

  if (s.log.length) toast(s.log[0]);
  requestAnimationFrame(t => {
    last = t;
    frame(t);
  });
}
