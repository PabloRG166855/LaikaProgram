// Full-screen hangar: the ship fills the screen, you tap a part (or a tab) and pick a piece.
// Stats are bars without numbers; each has a small "?" that explains it when tapped.
import { computeShipStats, isAvailable, getSelectedComponents } from '../ship.js';
import { esc } from '../ui.js';
import { sfx } from '../sfx.js';
import { icon, drawIcon } from '../icons.js';
import { drawShip, shipModel, shipSize } from './shipRenderer.js';

const HOTSPOTS = [
  { cat: 'structure', anchor: 'hull' },
  { cat: 'propulsion', anchor: 'engine' },
  { cat: 'power', anchor: 'power' },
  { cat: 'comms', anchor: 'comms' },
  { cat: 'shielding', anchor: 'cabin' },
  { cat: 'instruments', anchor: 'instruments' }
];

const STAT_HELP = {
  money: ['Presupuesto', 'Cada pieza cuesta. Lo que te queda se ve en los bloques: elige con cuidado, ¡no alcanza para todo!'],
  weight: ['Peso', 'El cohete solo puede levantar cierto peso. Si la barra se llena, la nave no despega.'],
  energy: ['Energía', 'Los paneles dan electricidad y cada pieza consume un poco. Si gastas más de lo que generas, la nave se apaga.'],
  engine: ['Motor', 'Para llegar a la Luna el motor necesita suficiente fuerza. La rayita marca lo mínimo.'],
  shield: ['Protección', 'Lejos de la Tierra hay más radiación. El escudo protege a la tripulación. La rayita marca lo mínimo.'],
  science: ['Ciencia', 'Lo que descubrirás y enviarás a la Tierra. Más instrumentos y una buena antena llenan la barra.'],
  signal: ['Señal', 'Qué tanto de tu ciencia llega a la Tierra. Muchos instrumentos con una antena débil = ciencia perdida.']
};

/** Price as a coin icon + 4 rising bars (no numbers). */
const coins = cost => {
  const n = cost < 50 ? 1 : cost < 150 ? 2 : cost < 300 ? 3 : 4;
  return `<span class="price" title="Precio">${icon('coins', 16)}<span class="price-bars">${[1, 2, 3, 4].map(i => `<i class="${i <= n ? 'on' : ''}" style="height:${4 + i * 3}px"></i>`).join('')}</span></span>`;
};
const BUDGET_BLOCKS = 12;

function tagsFor(c, level) {
  const t = [];
  if (c.propulsion) t.push(c.propulsion >= level.minPropulsion ? ['flame', 'up', 'Llega a la Luna'] : ['lock', 'down', 'No llega a la Luna']);
  if (c.powerGen) t.push(['battery-charging', 'up', 'Más energía']);
  if (c.science) t.push(['flask-conical', 'up', 'Más ciencia']);
  if (c.comms) t.push(['satellite-dish', c.comms >= 5 ? 'up' : 'mid', c.comms >= 5 ? 'Señal fuerte' : 'Señal débil']);
  if (c.shielding) t.push(['shield', 'up', 'Más protección']);
  if (c.crewMax) t.push(['users', 'mid', `${c.crewMax} asientos`]);
  if (c.mass >= 1000) t.push(['weight', 'down', 'Pesado']);
  else if (c.category !== 'structure') t.push(['weight', 'up', 'Ligero']);
  return t.slice(0, 3).map(([ic, dir, label]) => `<span class="tag ${dir}">${icon(ic, 14)}${esc(label)}</span>`).join('');
}

function blockers(st, level, design) {
  const out = [];
  if (!design.rocketId) out.push(['rocket', 'Elige un cohete para despegar.', 'rocket']);
  else if (st.totalMass > st.rocketCapacity) out.push(['weight', 'Tu nave pesa demasiado para este cohete. Quita piezas o elige un cohete más fuerte.', 'rocket']);
  if (st.propulsionLevel < level.minPropulsion) out.push(['flame', 'Este motor no llega a la Luna. Elige uno más fuerte.', 'propulsion']);
  if (st.shielding < level.minShielding) out.push(['shield', 'Necesitas un escudo para ir a la Luna.', 'shielding']);
  if (st.instruments.length === 0) out.push(['microscope', 'Agrega al menos un instrumento de ciencia.', 'instruments']);
  if (st.powerUse > st.powerGen) out.push(['battery-low', 'No hay suficiente energía. Pon mejores paneles o quita instrumentos.', 'power']);
  if (st.budgetLeft < 0) out.push(['coins', 'No te alcanza el presupuesto. Cambia alguna pieza cara.', null]);
  return out;
}

export function renderHangar(root, ctx) {
  const { data, level, design } = ctx;
  const cats = data.components.categories.filter(c => !c.auto);
  const comps = data.components.components;
  let active = 'structure';
  let help = null;
  let flash = null;

  root.innerHTML = `
    <div class="hangar">
      <canvas id="h-ship"></canvas>
      <div class="h-title glass">
        <span class="h-step">1/2</span>
        <div><b>Arma tu nave</b><small>Toca una parte de la nave para cambiarla</small></div>
      </div>
      <div class="h-budget glass" id="h-budget"></div>
      <aside class="h-stats glass" id="h-stats"></aside>
      <div class="h-actionbar">
        <div class="h-alert" id="h-alert"></div>
        <button class="h-next btn go" id="h-next" data-act="next">Tripulación ${icon('arrow-right', 18)}</button>
      </div>
      <div class="h-tray glass">
        <div class="h-tabs" id="h-tabs"></div>
        <div class="h-cat-help" id="h-cat-help"></div>
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
      instruments: st.instruments.length === 0,
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
    // ship area: right of the title/budget column, left of the stats panel, above the action bar
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
    anchors = drawShip(c2d, model, { x: cx, y: cy, scale, time: now / 1000, crewCount: 0, highlight });
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
    const tabs = [...cats.map(c => ({ id: c.id, ico: c.ico, label: c.short })), { id: 'rocket', ico: 'rocket', label: 'Cohete' }];
    el('h-tabs').innerHTML = tabs.map(t => `
      <button class="h-tab ${active === t.id ? 'active' : ''} ${need[t.id] ? 'warn' : ''}" data-act="tab" data-id="${t.id}">
        ${icon(t.ico, 22)}<span>${esc(t.label)}</span>
      </button>`).join('');
    const cat = cats.find(c => c.id === active);
    el('h-cat-help').innerHTML = active === 'rocket'
      ? `${icon('rocket', 16)} El cohete lanza tu nave. Los más fuertes cargan más peso, pero cuestan más.`
      : `${icon(cat.ico, 16)} ${esc(cat.kid)}`;
    const left = st.budgetLeft;
    const currentCost = id => {
      const c = comps.find(x => x.id === id);
      return c ? c.cost : 0;
    };
    const tooExpensive = (price, replacing) => price - replacing > left;
    if (active === 'rocket') {
      const curRocket = data.rockets.find(r => r.id === design.rocketId);
      const maxCap = Math.max(...data.rockets.map(r => r.capacityKg[level.destination] || 0));
      el('h-options').innerHTML = data.rockets.filter(r => r.capacityKg[level.destination]).map(r => {
        const cap = r.capacityKg[level.destination];
        const sel = design.rocketId === r.id;
        const locked = !sel && tooExpensive(r.cost, curRocket ? curRocket.cost : 0);
        return `
          <button class="h-opt ${sel ? 'selected' : ''} ${locked ? 'locked' : ''}" data-act="rocket" data-id="${r.id}" ${locked ? 'disabled' : ''}>
            <span class="h-opt-top">${coins(r.cost)}${locked ? `<span class="lock-tag">${icon('lock', 14)} Muy caro</span>` : ''}</span>
            <span class="h-opt-name">${sel ? icon('check', 16) : ''}${esc(r.name)}</span>
            <span class="h-opt-desc">Fuerza para cargar</span>
            <span class="mini-bar"><span style="width:${(cap / maxCap) * 100}%"></span></span>
          </button>`;
      }).join('');
      return;
    }
    el('h-options').innerHTML = comps.filter(c => c.category === active && isAvailable(c, level)).map(c => {
      const sel = c.category === 'instruments' ? design.instruments.includes(c.id) : design.selections[c.category] === c.id;
      const replacing = c.category === 'instruments' ? 0 : currentCost(design.selections[c.category]);
      const locked = !sel && tooExpensive(c.cost, replacing);
      return `
        <button class="h-opt ${sel ? 'selected' : ''} ${locked ? 'locked' : ''}" data-act="comp" data-id="${c.id}" title="${esc(c.desc)}" ${locked ? 'disabled' : ''}>
          <span class="h-opt-top">${coins(c.cost)}${locked ? `<span class="lock-tag">${icon('lock', 14)} Muy caro</span>` : ''}</span>
          <span class="h-opt-name">${sel ? icon('check', 16) : ''}${esc(c.name)}</span>
          <span class="h-opt-desc">${esc(c.desc)}</span>
          <span class="h-opt-tags">${tagsFor(c, level)}</span>
        </button>`;
    }).join('') + (cat.required || cat.multi ? '' : `
        <button class="h-opt ${design.selections[cat.id] ? '' : 'selected'}" data-act="none" data-id="${cat.id}">
          <span class="h-opt-top"><span class="price free">Gratis</span></span>
          <span class="h-opt-name">${design.selections[cat.id] ? '' : icon('check', 16)}Sin ${esc(cat.short.toLowerCase())}</span>
          <span class="h-opt-desc">Ahorras peso y presupuesto.</span>
        </button>`);
  }

  // ---------- Stats (bars, no numbers) ----------
  function bar(key, ic, frac, cls, marker) {
    const [label, text] = STAT_HELP[key];
    return `
      <div class="hs-row">
        <span class="hs-ico ${cls}">${icon(ic, 20)}</span>
        <div class="hs-main">
          <div class="hs-label">${esc(label)}<button class="q ${help === key ? 'on' : ''}" data-act="help" data-id="${key}" aria-label="¿Qué es ${esc(label)}?">?</button></div>
          <div class="hs-bar ${cls}"><span style="width:${Math.max(0, Math.min(1, frac)) * 100}%"></span>${marker != null ? `<i style="left:${marker * 100}%"></i>` : ''}</div>
          ${help === key ? `<p class="hs-help">${esc(text)}</p>` : ''}
        </div>
      </div>`;
  }

  function renderStats() {
    const st = computeShipStats(design, level, data);
    const money = st.budgetLeft / level.budget;
    const weight = st.rocketCapacity ? st.totalMass / st.rocketCapacity : 0;
    const energyRatio = st.powerUse ? st.powerGen / st.powerUse : 2;
    el('h-stats').innerHTML = `
      ${bar('weight', 'weight', weight, !st.rocketCapacity ? 'off' : weight > 1 ? 'bad' : weight > 0.85 ? 'warn' : 'good')}
      ${bar('energy', 'battery-charging', Math.min(1, energyRatio / 2), energyRatio < 1 ? 'bad' : energyRatio < 1.15 ? 'warn' : 'good')}
      ${bar('engine', 'flame', st.propulsionLevel / 3, st.propulsionLevel < level.minPropulsion ? 'bad' : 'good', level.minPropulsion / 3)}
      ${bar('shield', 'shield', st.shielding / 3, st.shielding < level.minShielding ? 'bad' : 'good', level.minShielding / 3)}
      ${bar('science', 'flask-conical', st.projectedScience / level.scienceGoal, st.projectedScience >= level.scienceGoal ? 'good' : 'warn')}`;
    const on = Math.max(0, Math.ceil(money * BUDGET_BLOCKS - 0.001));
    const bcls = money < 0 ? 'bad' : money < 0.2 ? 'warn' : 'good';
    el('h-budget').innerHTML = `
      <span class="hb-ico ${bcls}">${icon('coins', 22)}</span>
      <div><div class="hb-label">Presupuesto<button class="q ${help === 'money' ? 'on' : ''}" data-act="help" data-id="money">?</button></div>
      <div class="blocks big ${bcls}">${Array.from({ length: BUDGET_BLOCKS }, (_, i) => `<i class="${i < on ? 'on' : ''}"></i>`).join('')}</div>
      ${help === 'money' ? `<p class="hs-help">${esc(STAT_HELP.money[1])}</p>` : ''}</div>`;
    const b = blockers(st, level, design);
    el('h-alert').innerHTML = b.length
      ? `<button class="alert-pill" data-act="tab" data-id="${b[0][2] || active}">${icon(b[0][0], 20)}<span>${esc(b[0][1])}</span></button>`
      : `<div class="alert-pill ok">${icon('check', 20)}<span>¡Tu nave está lista! Ahora elige a tu tripulación.</span></div>`;
    el('h-next').disabled = b.length > 0;
  }

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
    if (act === 'help') { help = help === id ? null : id; return renderStats(); }
    if (act === 'tab') { active = id; return renderTray(); }
    if (act === 'rocket') design.rocketId = id;
    if (act === 'none') design.selections[id] = null;
    if (act === 'comp' || act === 'rocket' || act === 'pick') sfx('select');
    if (act === 'comp') {
      const c = comps.find(x => x.id === id);
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
