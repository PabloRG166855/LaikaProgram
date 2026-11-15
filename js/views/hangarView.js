// Full-screen hangar: the ship fills the screen, you tap a part (or a tab) and pick a piece.
// Stats are bars without numbers; each has a small "?" that explains it when tapped.
import { computeShipStats, isAvailable, getSelectedComponents } from '../ship.js';
import { esc, avatar } from '../ui.js';
import { sfx } from '../sfx.js';
import { icon, drawIcon } from '../icons.js';
import { shipModel, shipSize } from './shipRenderer.js';
import { drawShipPixel } from './pixelShip.js';

const HOTSPOTS = [
  { cat: 'structure', anchor: 'hull' },
  { cat: 'propulsion', anchor: 'engine' },
  { cat: 'power', anchor: 'power' },
  { cat: 'comms', anchor: 'comms' },
  { cat: 'shielding', anchor: 'cabin' },
  { cat: 'instruments', anchor: 'instruments' }
];

const STAT_HELP = {
  weight: ['Peso', 'El cohete solo puede levantar cierto peso. La rayita MÁX es el límite: si la barra la pasa, la nave no despega.'],
  energy: ['Energía', 'Los paneles dan electricidad y cada pieza consume un poco. La barra debe pasar la rayita MÍN: ahí generas justo lo que gastas.'],
  engine: ['Motor', 'Para llegar a tu destino el motor necesita suficiente fuerza. La rayita MÍN marca lo mínimo.'],
  shield: ['Protección', 'En el espacio hay mucho calor y frío, y lejos de la Tierra más radiación. El escudo protege a la tripulación. La rayita MÍN marca lo mínimo.'],
  science: ['Ciencia', 'Lo que descubrirás y enviarás a la Tierra. Para despegar debes pasar la rayita MÍN; la barra llena es la meta de la misión.'],
  signal: ['Señal', 'Qué tanto de tu ciencia llega a la Tierra. Muchos instrumentos con una antena débil = ciencia perdida.']
};

/** Price as a coin icon + 4 rising bars (no numbers). */

const MASS_RANGE = {};
function tagList(c, level) {
  const t = [];
  const to = level.goTo || `a ${level.destinationName}`;
  if (c.propulsion) t.push(c.propulsion >= level.minPropulsion ? ['flame', 'up', `Llega ${to}`] : ['lock', 'down', `No llega ${to}`]);
  if (c.powerGen) t.push(['battery-charging', 'up', 'Más energía']);
  if (c.science) t.push(['flask-conical', 'up', 'Más ciencia']);
  if (c.comms) t.push(['satellite-dish', c.comms >= 5 ? 'up' : 'mid', c.comms >= 5 ? 'Señal fuerte' : 'Señal débil']);
  if (c.shielding) t.push(['shield', 'up', 'Más protección']);
  if (c.crewMax) t.push(['users', 'mid', `${c.crewMax} asientos`]);
  // weight compared with the other pieces of the same kind
  const same = MASS_RANGE[c.category];
  if (same && same.max > same.min) {
    if (c.mass === same.max) t.push(['weight', 'down', 'Pesado']);
    else if (c.mass === same.min) t.push(['weight', 'up', 'Ligero']);
  }
  return t.slice(0, 3);
}
function tagsFor(c, level) {
  return tagList(c, level).map(([ic, dir, label]) => `<span class="tag ${dir}">${icon(ic, 14)}${esc(label)}</span>`).join('');
}

function blockers(st, level, design) {
  const out = [];
  if (!design.rocketId) out.push(['rocket', 'Elige un cohete para despegar.', 'rocket']);
  else if (st.totalMass > st.rocketCapacity) out.push(['weight', 'Tu nave pesa demasiado para el cohete de esta misión. Cambia piezas por otras más ligeras.', 'structure']);
  const to = level.goTo || `a ${level.destinationName}`;
  if (st.propulsionLevel < level.minPropulsion) out.push(['flame', `Este motor no llega ${to}. Elige uno más fuerte.`, 'propulsion']);
  if (st.shielding < level.minShielding) out.push(['shield', `Necesitas un escudo para ir ${to}.`, 'shielding']);
  if (st.instruments.length === 0) out.push(['microscope', 'Agrega al menos un instrumento de ciencia.', 'instruments']);
  else if (st.projectedScience < level.scienceGoal * (level.minScience || 0)) out.push(['flask-conical', 'Tu nave hace muy poca ciencia: agrega instrumentos o una antena más fuerte.', 'instruments']);
  if (st.powerUse > st.powerGen) out.push(['battery-low', 'No hay suficiente energía. Pon mejores paneles o quita instrumentos.', 'power']);
  return out;
}

export function renderHangar(root, ctx) {
  const { data, level, design } = ctx;
  const cats = data.components.categories.filter(c => !c.auto);
  const comps = data.components.components;
  for (const c of comps) {
    if (!isAvailable(c, level)) continue;
    const r = MASS_RANGE[c.category] || (MASS_RANGE[c.category] = { min: Infinity, max: -Infinity });
    r.min = Math.min(r.min, c.mass);
    r.max = Math.max(r.max, c.mass);
  }
  let active = 'structure';
  let help = null;
  let flash = null;
  let laikaPiece = null; // piece Laika is explaining (hover / last pick)
  let laikaHelp = null; // stat that Laika explains after tapping its "?"
  let laikaIntro = true; // first visit: Laika says hello until a tab is touched
  const guide = data.components.guide || {};

  root.innerHTML = `
    <div class="hangar">
      <canvas id="h-ship"></canvas>
      <div class="h-title glass">
        <span class="h-step">1/2</span>
        <div><b>Arma tu nave</b><small>Toca una parte de la nave para cambiarla</small></div>
      </div>
      <div class="h-laika glass" id="h-laika"></div>
      <aside class="h-stats glass" id="h-stats"></aside>
      <div class="h-actionbar">
        <div class="h-alert" id="h-alert"></div>
        <button class="h-next btn go" id="h-next" data-act="next">Tripulación ${icon('arrow-right', 18)}</button>
      </div>
      <div class="h-tray glass">
        <div class="h-tabs" id="h-tabs"></div>
        <div class="h-options" id="h-options"></div>
      </div>
      <button class="h-back btn ghost" data-act="back">${icon('house', 18)}</button>
    </div>`;

  const el = id => root.querySelector(`#${id}`);
  const canvas = el('h-ship');
  const c2d = canvas.getContext('2d');
  let anchors = {};
  let model = shipModel(getSelectedComponents(design, data));
  const stars = Array.from({ length: 160 }, () => ({ x: Math.random(), y: Math.random(), r: Math.random() * 1.3 + 0.2, a: Math.random() }));

  function needsAttention(st) {
    return {
      propulsion: st.propulsionLevel < level.minPropulsion,
      shielding: st.shielding < level.minShielding,
      instruments: st.instruments.length === 0 || st.projectedScience < level.scienceGoal * (level.minScience || 0),
      power: st.powerUse > st.powerGen,
      rocket: !design.rocketId || st.totalMass > st.rocketCapacity
    };
  }

  const PX = 3;
  function draw(now) {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const lw = Math.max(1, Math.round(w / PX));
    const lh = Math.max(1, Math.round(h / PX));
    if (canvas.width !== lw || canvas.height !== lh) {
      canvas.width = lw;
      canvas.height = lh;
    }
    c2d.setTransform(1 / PX, 0, 0, 1 / PX, 0, 0);
    c2d.imageSmoothingEnabled = false;
    c2d.fillStyle = '#000';
    c2d.fillRect(0, 0, w, h);
    for (const st of stars) {
      if (Math.sin(now / 500 + st.a * 20) < -0.6) continue;
      c2d.fillStyle = st.r > 1.2 ? '#29ADFF' : '#FFF1E8';
      c2d.fillRect(Math.round(st.x * w / PX) * PX, Math.round(st.y * h / PX) * PX, PX, PX);
    }
    // hangar floor grid (perspective-free, retro)
    c2d.fillStyle = '#1D2B53';
    for (let y = h - 240; y < h; y += 18) c2d.fillRect(0, y, w, PX);
    // ship area: between the title (top), the stats panel (right) and the tray + action bar (bottom)
    // ship area: right of the title/Laika column, left of the stats panel, above the action bar
    const left = Math.min(440, w * 0.33);
    const right = w - Math.min(380, w * 0.3);
    const top = 20;
    const bottom = h - 318;
    const areaW = Math.max(160, right - left);
    const areaH = Math.max(120, bottom - top);
    const size = shipSize(model);
    const scale = Math.min((areaW * 0.8) / size.w, (areaH * 0.85) / size.h, 3);
    const cx = left + areaW / 2;
    const cy = top + areaH / 2 + (Math.floor(now / 400) % 2 ? PX : 0);
    let highlight = null;
    if (flash) {
      const t = (now - flash.start) / 1000;
      if (t >= 1) flash = null;
      else highlight = { anchor: flash.anchor, alpha: 1 - t, color: '#FFEC27' };
    }
    anchors = drawShipPixel(c2d, model, { x: cx, y: cy, scale, time: now / 1000, crewCount: 0, highlight });
    const st = computeShipStats(design, level, data);
    const need = needsAttention(st);
    const blink = Math.floor(now / 300) % 2 === 0;
    for (const hs of HOTSPOTS) {
      const a = anchors[hs.anchor];
      if (!a) continue;
      const cat = cats.find(c => c.id === hs.cat);
      const isActive = active === hs.cat;
      const warn = need[hs.cat];
      const col = warn ? '#FF004D' : isActive ? '#FFEC27' : '#29ADFF';
      const sz = 36;
      const x = Math.round(a.x - sz / 2);
      const y = Math.round(a.y - sz / 2);
      c2d.fillStyle = warn && blink ? '#FF004D' : '#000';
      c2d.fillRect(x - PX * 2, y - PX * 2, sz + PX * 4, sz + PX * 4);
      c2d.fillStyle = '#000';
      c2d.fillRect(x, y, sz, sz);
      c2d.strokeStyle = col;
      c2d.lineWidth = PX;
      c2d.strokeRect(x + PX / 2, y + PX / 2, sz - PX, sz - PX);
      drawIcon(c2d, cat.ico, a.x, a.y, 24, col);
    }
  }

  let alive = true;
  if (root._stopPreview) root._stopPreview();
  root._stopPreview = () => { alive = false; };
  (function loop(now) {
    if (!alive || root.classList.contains('hidden')) { alive = false; return; }
    draw(now);
    requestAnimationFrame(loop);
  })(performance.now());

  canvas.addEventListener('click', e => {
    const r = canvas.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    let best = null;
    for (const hs of HOTSPOTS) {
      const a = anchors[hs.anchor];
      if (!a) continue;
      const d = Math.hypot(a.x - x, a.y - y);
      if (d < 34 && (!best || d < best.d)) best = { ...hs, d };
    }
    if (best) { active = best.cat; renderTray(); }
  });

  // ---------- Tray ----------
  function renderTray() {
    const st = computeShipStats(design, level, data);
    const need = needsAttention(st);
    // no rocket tab: each mission has its own rocket, so the challenge is weight and energy
    const tabs = cats.map(c => ({ id: c.id, ico: c.ico, label: c.short }));
    el('h-tabs').innerHTML = tabs.map(t => `
      <button class="h-tab ${active === t.id ? 'active' : ''} ${need[t.id] ? 'warn' : ''}" data-act="tab" data-id="${t.id}">
        ${icon(t.ico, 22)}<span>${esc(t.label)}</span>
      </button>`).join('');
    const cat = cats.find(c => c.id === active);
    renderLaika();
    if (active === 'rocket') {
      const maxCap = Math.max(...data.rockets.map(r => r.capacityKg[level.destination] || 0));
      el('h-options').innerHTML = data.rockets.filter(r => r.capacityKg[level.destination]).map(r => {
        const cap = r.capacityKg[level.destination];
        const sel = design.rocketId === r.id;
        return `
          <button class="h-opt ${sel ? 'selected' : ''}" data-act="rocket" data-id="${r.id}">
            <span class="h-opt-name">${sel ? icon('check', 16) : ''}${esc(r.name)}</span>
            <span class="h-opt-desc">Carga</span>
            <span class="mini-bar"><span style="width:${(cap / maxCap) * 100}%"></span></span>
          </button>`;
      }).join('');
      return;
    }
    el('h-options').innerHTML = comps.filter(c => c.category === active && isAvailable(c, level)).map(c => {
      const sel = c.category === 'instruments' ? design.instruments.includes(c.id) : design.selections[c.category] === c.id;
      return `
        <button class="h-opt ${sel ? 'selected' : ''}" data-act="comp" data-id="${c.id}" title="${esc(c.desc)}">
          <span class="h-opt-name">${sel ? icon('check', 16) : ''}${esc(c.name)}</span>
          <span class="h-opt-desc">${esc(c.desc)}</span>
          <span class="h-opt-tags">${tagsFor(c, level)}</span>
        </button>`;
    }).join('') + (cat.required || cat.multi ? '' : `
        <button class="h-opt ${design.selections[cat.id] ? '' : 'selected'}" data-act="none" data-id="${cat.id}">
          <span class="h-opt-name">${design.selections[cat.id] ? '' : icon('check', 16)}Sin ${esc(cat.short.toLowerCase())}</span>
          <span class="h-opt-desc">Ahorras peso y energía.</span>
        </button>`);
  }

  // ---------- Stats (bars, no numbers) ----------
  function bar(key, ic, frac, cls, marker, markLabel = 'MÍN') {
    const [label, text] = STAT_HELP[key];
    return `
      <div class="hs-row">
        <span class="hs-ico ${cls}">${icon(ic, 20)}</span>
        <div class="hs-main">
          <div class="hs-label">${esc(label)}<button class="q" data-act="help" data-id="${key}" aria-label="¿Qué es ${esc(label)}?">?</button></div>
          <div class="hs-bar ${cls}"><span style="width:${Math.max(0, Math.min(1, frac)) * 100}%"></span>${marker != null ? `<i class="mk" style="left:${marker * 100}%" data-l="${markLabel}"></i>` : ''}</div>
        </div>
      </div>`;
  }

  function renderStats() {
    const st = computeShipStats(design, level, data);
    // Cada barra marca lo que hace falta para despegar:
    //  peso: la rayita MÁX es la capacidad del cohete (la barra llega hasta 125 %)
    //  energía: la rayita MÍN es generar lo mismo que se gasta (la barra llega hasta el doble)
    //  motor / protección: nivel mínimo del destino · ciencia: MÍN = minScience de la meta, barra llena = meta
    const weight = st.rocketCapacity ? st.totalMass / st.rocketCapacity : 0;
    const energyRatio = st.powerUse ? st.powerGen / st.powerUse : 2;
    const sci = st.projectedScience / level.scienceGoal;
    const minSci = level.minScience || 0;
    el('h-stats').innerHTML = `
      ${bar('weight', 'weight', weight / 1.25, !st.rocketCapacity ? 'off' : weight > 1 ? 'bad' : weight > 0.85 ? 'warn' : 'good', 0.8, 'MÁX')}
      ${bar('energy', 'battery-charging', Math.min(1, energyRatio / 2), energyRatio < 1 ? 'bad' : energyRatio < 1.15 ? 'warn' : 'good', 0.5)}
      ${bar('engine', 'flame', st.propulsionLevel / 3, st.propulsionLevel < level.minPropulsion ? 'bad' : 'good', level.minPropulsion / 3)}
      ${bar('shield', 'shield', st.shielding / 3, st.shielding < level.minShielding ? 'bad' : 'good', level.minShielding ? level.minShielding / 3 : null)}
      ${bar('science', 'flask-conical', sci, sci < minSci ? 'bad' : sci >= 1 ? 'good' : 'warn', minSci || null)}`;
    const b = blockers(st, level, design);
    el('h-alert').innerHTML = b.length
      ? `<button class="alert-pill" data-act="tab" data-id="${b[0][2] || active}">${icon(b[0][0], 20)}<span>${esc(b[0][1])}</span></button>`
      : `<div class="alert-pill ok">${icon('check', 20)}<span>¡Tu nave está lista! Ahora elige a tu tripulación.</span></div>`;
    el('h-next').disabled = b.length > 0;
  }

  // ---------- Laika, the tutorial guide ----------
  function pieceText(piece) {
    if (piece.kind === 'rocket') {
      const r = data.rockets.find(x => x.id === piece.id);
      return r && [r.name, r.desc];
    }
    const c = comps.find(x => x.id === piece.id);
    if (!c) return null;
    const words = tagList(c, level).map(t => t[2].toLowerCase());
    return [c.name, `${c.desc}${words.length ? ` Con esta pieza: ${words.join(', ')}.` : ''}`];
  }
  function renderLaika() {
    const cat = cats.find(c => c.id === active);
    let title;
    let text;
    let ico;
    const piece = laikaPiece && pieceText(laikaPiece);
    if (laikaHelp) {
      [title, text] = STAT_HELP[laikaHelp];
      ico = 'circle-help';
    } else if (laikaIntro) {
      title = '¡Hola!';
      text = guide.intro;
      ico = 'sparkles';
    } else if (piece) {
      [title, text] = piece;
      ico = active === 'rocket' ? 'rocket' : cat.ico;
    } else if (active === 'rocket') {
      title = 'El cohete';
      text = guide.rocket;
      ico = 'rocket';
    } else {
      title = cat.short === 'Cabina' ? 'La cabina' : cat.name;
      text = cat.laika || cat.kid;
      ico = cat.ico;
    }
    el('h-laika').innerHTML = `
      <span class="hl-face">${avatar(data.crew.director, 'lg')}<small>Laika</small></span>
      <div class="hl-bubble">
        <b>${icon(ico, 18)} ${esc(title)}</b>
        <p>${esc(text || '')}</p>
      </div>`;
  }
  function bubblePop() {
    const b = el('h-laika');
    b.classList.remove('pop');
    void b.offsetWidth;
    b.classList.add('pop');
  }
  // hovering a card makes Laika explain it (on touch, picking does the same)
  el('h-options').addEventListener('pointerover', e => {
    const t = e.target.closest('[data-act="comp"], [data-act="rocket"]');
    if (!t || e.pointerType === 'touch') return;
    const next = { kind: t.dataset.act === 'rocket' ? 'rocket' : 'comp', id: t.dataset.id };
    if (laikaPiece && laikaPiece.id === next.id) return;
    laikaPiece = next;
    laikaIntro = false;
    laikaHelp = null;
    renderLaika();
  });

  function refresh() {
    model = shipModel(getSelectedComponents(design, data));
    renderTray();
    renderStats();
  }

  root.onclick = e => {
    const t = e.target.closest('[data-act]');
    if (!t) return;
    const { act, id } = t.dataset;
    if (act === 'back') return ctx.onBack();
    if (act === 'next') { if (!t.disabled) ctx.onNext(); return; }
    if (act === 'help') { laikaHelp = id; laikaIntro = false; laikaPiece = null; bubblePop(); renderLaika(); return; }
    laikaHelp = null;
    if (act === 'tab') { active = id; laikaIntro = false; laikaPiece = null; bubblePop(); return renderTray(); }
    if (act === 'rocket') { design.rocketId = id; laikaPiece = { kind: 'rocket', id }; laikaIntro = false; bubblePop(); }
    if (act === 'none') design.selections[id] = null;
    if (act === 'comp' || act === 'rocket' || act === 'pick') sfx('select');
    if (act === 'comp') {
      const c = comps.find(x => x.id === id);
      laikaPiece = { kind: 'comp', id };
      laikaIntro = false;
      bubblePop();
      const cat = cats.find(k => k.id === c.category);
      if (cat.multi) {
        if (design.instruments.includes(id)) design.instruments = design.instruments.filter(x => x !== id);
        else if (design.instruments.length < 6) design.instruments = [...design.instruments, id];
      } else {
        design.selections[cat.id] = id;
      }
      const hs = HOTSPOTS.find(h => h.cat === cat.id);
      flash = { anchor: hs ? hs.anchor : 'hull', start: performance.now() };
    }
    refresh();
  };

  refresh();
}
