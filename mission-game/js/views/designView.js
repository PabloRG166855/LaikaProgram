import { computeShipStats, isAvailable, slotLabel, getSelectedComponents } from '../ship.js';
import { buildShipArt, buildRocketArt } from '../shipArt.js';
import { fmt, indexById, STAT_INFO, TIER_INFO } from '../util.js';
import { esc, barHtml, toast } from '../ui.js';

export function renderDesign(root, ctx) {
  const { data, level, design } = ctx;
  const cats = data.components.categories;
  const comps = data.components.components;
  const compById = indexById(comps);
  const roles = data.crew.roles;
  const members = data.crew.members;
  const memberById = indexById(members);
  const slots = level.crewSlots;
  if (!design.crewSlots || design.crewSlots.length !== slots.length) design.crewSlots = slots.map(() => null);

  // Roles that this mission has a slot for, in slot order.
  const missionRoles = [...new Set(slots.flatMap(s => s.roles))];

  let focusedSlot = firstEmptySlot();
  let activeRole = slots[focusedSlot ?? 0]?.roles[0] || missionRoles[0];
  let prevIds = new Set(installedIds());
  let prevCrew = crewCount();
  let lastChange = null;
  let hoverId = null;

  root.innerHTML = `
    <header class="topbar">
      <button class="btn ghost" data-act="back">← Niveles</button>
      <h2>Fase 1 · Diseña tu nave — ${esc(level.name)}: ${esc(level.title)}</h2>
    </header>
    <div class="design-layout">
      <div class="design-main">
        <div class="card">
          <h3>🎯 Objetivo de la misión</h3>
          <p>Llevar a <b>${level.crewSize} astronautas</b> a <b>${esc(level.destinationName)}</b>, cumplir <b>${level.script.length} objetivos principales</b> en <b>${Math.round(level.durationSec / 60 * 10) / 10} min</b> y conseguir <b>${fmt(level.scienceGoal)} puntos de ciencia</b>.</p>
          <p class="info">Cada pieza que agregues aparece en el dibujo de tu nave (a la derecha). Todo cuesta masa, energía y dinero: lo que gastes en la nave ya no estará disponible para la tripulación.</p>
        </div>
        <div id="d-components"></div>
        <h3 class="section-title">🚀 Cohete <span class="req">obligatorio</span></h3>
        <p class="info">El cohete pone tu nave en camino. Cada uno lleva cierta masa a cada destino: entre más lejos, menos carga puede llevar.</p>
        <div id="d-rockets" class="grid"></div>
        <h3 class="section-title">👩‍🚀 Tripulación <span class="req">llena los ${slots.length} puestos</span></h3>
        <p class="info">La misión pide estos puestos. Toca un puesto y elige a quién mandar desde su categoría. Más experiencia = mejores habilidades, pero cuesta más del presupuesto.</p>
        <div id="d-slots" class="slots"></div>
        <div class="stat-legend">${Object.values(STAT_INFO).map(i => `<span>${i.icon} <b>${i.name}:</b> ${i.desc}</span>`).join('')}</div>
        <div id="d-tabs" class="tabs"></div>
        <div id="d-crew" class="grid crew-grid"></div>
      </div>
      <aside class="design-side" id="d-stats"></aside>
    </div>`;

  const el = id => root.querySelector(`#${id}`);

  // ---------- helpers ----------
  function installedIds() {
    return [...Object.values(design.selections), ...design.instruments].filter(Boolean);
  }
  function crewCount() {
    return design.crewSlots.filter(Boolean).length;
  }
  function firstEmptySlot() {
    const i = design.crewSlots.findIndex(x => !x);
    return i >= 0 ? i : null;
  }
  const slotFits = (i, m) => slots[i].roles.includes(m.role);

  // Slot a candidate would go to: the focused slot if it fits, else an empty one, else replace.
  function targetSlotFor(m) {
    if (focusedSlot !== null && slotFits(focusedSlot, m)) return focusedSlot;
    const empty = slots.findIndex((_, i) => slotFits(i, m) && !design.crewSlots[i]);
    if (empty >= 0) return empty;
    return slots.findIndex((_, i) => slotFits(i, m));
  }

  function chipsFor(c) {
    const out = [`<span class="chip">⚖️ ${fmt(c.mass)} kg</span>`];
    if (c.powerGen) out.push(`<span class="chip good">⚡ +${c.powerGen} kW</span>`);
    if (c.powerUse) out.push(`<span class="chip">⚡ −${c.powerUse} kW</span>`);
    out.push(`<span class="chip">💲 ${fmt(c.cost)} M</span>`);
    if (c.crewMax) out.push(`<span class="chip">👥 ${c.crewMax} plazas</span>`);
    if (c.propulsion) out.push(`<span class="chip">🔥 empuje nivel ${c.propulsion}</span>`);
    if (c.lifeSupport) out.push(`<span class="chip">🫁 ${c.lifeSupport} personas</span>`);
    if (c.comms) out.push(`<span class="chip">📶 ${c.comms} datos/s</span>`);
    if (c.shielding) out.push(`<span class="chip">🛡️ blindaje ${c.shielding}</span>`);
    if (c.science) out.push(`<span class="chip good">🔬 +${c.science} ciencia/s</span>`);
    if (c.data) out.push(`<span class="chip">💾 ${c.data} datos/s</span>`);
    return out.join('');
  }

  function isSelected(c) {
    return c.category === 'instruments' ? design.instruments.includes(c.id) : design.selections[c.category] === c.id;
  }

  // ---------- rendering ----------
  function renderComponents() {
    el('d-components').innerHTML = cats.map(cat => `
      <h3 class="section-title">${cat.icon} ${esc(cat.name)} ${cat.required ? '<span class="req">obligatorio</span>' : cat.multi ? '<span class="req">elige uno o más</span>' : '<span class="req">opcional</span>'}</h3>
      <p class="info">${esc(cat.info)}</p>
      <div class="grid">
        ${comps.filter(c => c.category === cat.id).map(c => {
          const avail = isAvailable(c, level);
          return `
            <button class="opt-card ${isSelected(c) ? 'selected' : ''} ${avail ? '' : 'disabled'}" data-act="comp" data-id="${c.id}">
              <span class="name">${isSelected(c) ? '✔ ' : ''}${esc(c.name)}</span>
              <span class="desc">${avail ? esc(c.desc) : `No sirve para ${esc(level.destinationName)}.`}</span>
              <span>${chipsFor(c)}</span>
            </button>`;
        }).join('')}
      </div>`).join('');
  }

  function renderRockets() {
    el('d-rockets').innerHTML = data.rockets.map(r => {
      const cap = r.capacityKg[level.destination] || 0;
      return `
        <button class="opt-card rocket-card ${design.rocketId === r.id ? 'selected' : ''} ${cap ? '' : 'disabled'}" data-act="rocket" data-id="${r.id}">
          <span class="rocket-thumb">${buildRocketArt(r)}</span>
          <span class="rocket-info">
            <span class="name">${design.rocketId === r.id ? '✔ ' : ''}${esc(r.name)}</span>
            <span class="desc">${esc(r.desc)}</span>
            <span>
              <span class="chip ${cap ? 'good' : 'bad'}">📦 ${cap ? `${fmt(cap)} kg a ${esc(level.destinationName)}` : 'No llega a este destino'}</span>
              <span class="chip">💲 ${fmt(r.cost)} M</span>
              <span class="chip">✅ ${Math.round(r.reliability * 100)} % confiable</span>
            </span>
          </span>
        </button>`;
    }).join('');
  }

  function renderSlots() {
    el('d-slots').innerHTML = slots.map((slot, i) => {
      const m = memberById[design.crewSlots[i]];
      const icons = slot.roles.map(r => roles[r].icon).join('');
      return `
        <button class="slot ${m ? 'filled' : ''} ${focusedSlot === i ? 'focused' : ''}" data-act="slot" data-i="${i}">
          <span class="slot-role">${icons} ${esc(slotLabel(slot, data))}</span>
          ${m
            ? `<span class="slot-name">${esc(m.name)}</span>
               <span class="slot-sub">${esc(roles[m.role].name)} · ${TIER_INFO[m.tier]?.stars || ''} · $${fmt(m.cost)} M</span>
               <span class="slot-x" data-act="unslot" data-i="${i}" title="Quitar">✕</span>`
            : '<span class="slot-empty">＋ Puesto vacío — elegir</span>'}
        </button>`;
    }).join('');
  }

  function renderTabs() {
    el('d-tabs').innerHTML = missionRoles.map(r => {
      const needed = slots.some((s, i) => s.roles.includes(r) && !design.crewSlots[i]);
      const count = members.filter(m => m.role === r).length;
      return `<button class="tab ${activeRole === r ? 'active' : ''} ${needed ? 'needed' : ''}" data-act="tab" data-role="${r}">
        ${roles[r].icon} ${esc(roles[r].name)} <small>(${count})</small>${needed ? '<i class="dot" title="Falta llenar un puesto de este rol"></i>' : ''}
      </button>`;
    }).join('');
  }

  function statBars(m) {
    return Object.entries(STAT_INFO).map(([k, info]) => {
      const v = m.stats[k];
      const cls = v >= 8 ? 'hi' : v >= 6 ? 'mid' : 'lo';
      return `<div class="stat-line" title="${esc(info.name)}: ${esc(info.desc)}">
        <span class="sl">${info.icon} ${info.name}</span>
        <span class="pips ${cls}">${Array.from({ length: 10 }, (_, i) => `<i class="${i < v ? 'on' : ''}"></i>`).join('')}</span>
        <b>${v}</b>
      </div>`;
    }).join('');
  }

  function renderCrew(st) {
    const role = roles[activeRole];
    const list = members.filter(m => m.role === activeRole).sort((a, b) => a.cost - b.cost);
    el('d-crew').innerHTML = `
      <div class="role-head">
        <div><b>${role.icon} ${esc(role.name)}</b> — <span class="info">${esc(role.desc)}</span></div>
        <div class="chip ${st.budgetLeft < 0 ? 'bad' : 'good'}">💲 Te quedan $${fmt(st.budgetLeft)} M</div>
      </div>
      ${list.map(m => {
        const slotIdx = design.crewSlots.indexOf(m.id);
        const onBoard = slotIdx >= 0;
        const target = onBoard ? slotIdx : targetSlotFor(m);
        const occupant = !onBoard && target >= 0 ? memberById[design.crewSlots[target]] : null;
        const delta = onBoard ? 0 : m.cost - (occupant ? occupant.cost : 0);
        const affordable = st.budgetLeft - delta >= 0;
        const strong = Object.entries(m.stats).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k]) => STAT_INFO[k].name);
        const action = onBoard
          ? `✔ A bordo como ${esc(slotLabel(slots[slotIdx], data))} · toca para quitar`
          : occupant
            ? `⇄ Reemplazar a ${esc(occupant.name)}`
            : `＋ Enviar como ${esc(slotLabel(slots[target], data))}`;
        return `
          <button class="opt-card crew-card ${onBoard ? 'selected' : ''}" data-act="crew" data-id="${m.id}">
            <span class="crew-top">
              <span class="name">${esc(m.name)}</span>
              <span class="tier tier-${m.tier}">${TIER_INFO[m.tier]?.stars || ''} ${TIER_INFO[m.tier]?.name || ''}</span>
            </span>
            <span class="desc">${esc(m.bio)}</span>
            <span class="stat-bars">${statBars(m)}</span>
            <span class="desc">💪 Fuerte en: <b>${strong.join(' y ')}</b></span>
            <span class="crew-bottom">
              <span class="chip ${affordable ? '' : 'bad'}">💲 ${fmt(m.cost)} M${affordable ? '' : ' · no alcanza'}</span>
              <span class="crew-action ${onBoard ? 'on' : ''}">${action}</span>
            </span>
          </button>`;
      }).join('')}`;
  }

  function statRow(label, valueText, pct, cls) {
    return `<div class="stat-row"><div class="top"><span>${label}</span><b>${valueText}</b></div>${barHtml(pct, cls)}</div>`;
  }

  function renderStats(st, highlight) {
    const okCls = ok => (ok ? 'good' : 'bad');
    const art = buildShipArt(getSelectedComponents(design, data), { crewCount: crewCount(), highlight });
    const legend = st.comps.map(c => {
      const cat = cats.find(k => k.id === c.category);
      return `<span class="chip legend-chip" data-hover="${c.id}">${cat?.icon || '▫️'} ${esc(c.name)}</span>`;
    }).join('');
    el('d-stats').innerHTML = `
      <div class="card ship-card">
        <h3>🛰️ Tu nave <small>· se arma con cada pieza</small></h3>
        <div class="ship-stage">${art.svg}</div>
        <div class="ship-caption ${lastChange ? lastChange.kind : ''}">${lastChange ? esc(lastChange.text) : 'Agrega o cambia piezas y míralas aparecer aquí.'}</div>
        <div class="rocket-row">
          <div class="rocket-mini">${buildRocketArt(st.rocket)}</div>
          <div>
            <b>${st.rocket ? esc(st.rocket.name) : 'Sin cohete'}</b><br>
            <small>👩‍🚀 ${crewCount()} / ${slots.length} tripulantes a bordo</small><br>
            <small>⚖️ ${fmt(st.totalMass)} kg${st.rocket ? ` de ${fmt(st.rocketCapacity)} kg` : ''}</small>
          </div>
        </div>
        <details class="ship-legend"><summary>Piezas instaladas (${st.comps.length})</summary>${legend}</details>
      </div>
      <div class="card">
        ${statRow('💲 Presupuesto usado', `$${fmt(st.totalCost)} / ${fmt(level.budget)} M`, st.totalCost / level.budget * 100, st.budgetLeft < 0 ? 'bad' : st.budgetLeft < level.budget * 0.1 ? 'warn' : 'good')}
        <div class="info" style="margin:-6px 0 10px;font-size:.8rem">Nave $${fmt(st.componentCost)} · Cohete $${fmt(st.rocketCost)} · Tripulación $${fmt(st.crewCost)}</div>
        ${statRow('⚖️ Masa vs. capacidad del cohete', st.rocket ? `${fmt(st.totalMass)} / ${fmt(st.rocketCapacity)} kg` : `${fmt(st.totalMass)} kg (sin cohete)`, st.rocketCapacity ? st.totalMass / st.rocketCapacity * 100 : 0, okCls(st.rocketCapacity && st.totalMass <= st.rocketCapacity))}
        <div class="info" style="margin:-6px 0 10px;font-size:.8rem">Equipo ${fmt(st.componentMass)} kg · Tripulación y provisiones ${fmt(st.crewMass)} kg</div>
        ${statRow('⚡ Consumo vs. generación', `${fmt(st.powerUse, 1)} / ${fmt(st.powerGen, 1)} kW`, st.powerGen ? st.powerUse / st.powerGen * 100 : 100, okCls(st.powerUse <= st.powerGen))}
        ${statRow('👥 Tripulación', `${st.crew.length} / ${level.crewSize} · plazas ${st.crewMax} · soporte vital ${st.lifeCapacity}`, st.crew.length / level.crewSize * 100, okCls(st.crew.length === level.crewSize && st.crew.length <= st.crewMax && st.crew.length <= st.lifeCapacity))}
        ${statRow('🔥 Propulsión', `nivel ${st.propulsionLevel} (necesitas ${level.minPropulsion})`, st.propulsionLevel / 3 * 100, okCls(st.propulsionLevel >= level.minPropulsion))}
        ${statRow('🛡️ Blindaje', `nivel ${st.shielding} (necesitas ${level.minShielding})`, Math.min(1, st.shielding / 4) * 100, okCls(st.shielding >= level.minShielding))}
        ${statRow('🔬 Ciencia proyectada', `${fmt(st.projectedScience)} / ${fmt(level.scienceGoal)}`, st.projectedScience / level.scienceGoal * 100, st.projectedScience >= level.scienceGoal ? 'good' : 'warn')}
        ${statRow('📶 Datos que llegarán a la Tierra', `${Math.round(st.sentFraction * 100)} %`, st.sentFraction * 100, st.sentFraction >= 0.95 ? 'good' : st.sentFraction >= 0.7 ? 'warn' : 'bad')}
      </div>
      <div class="msgs">
        ${st.errors.map(e => `<div class="msg err">⛔ ${esc(e)}</div>`).join('')}
        ${st.warnings.map(w => `<div class="msg warn">⚠️ ${esc(w)}</div>`).join('')}
        ${st.valid ? '<div class="msg ok">✅ El diseño es válido. ¡Listo para lanzar!</div>' : ''}
      </div>
      <button class="btn big" data-act="launch" ${st.valid ? '' : 'disabled'}>🚀 Lanzar misión</button>`;
  }

  function refresh() {
    // Parts installed since the last render get a "just added" animation on the ship.
    const ids = installedIds();
    const highlight = new Set(ids.filter(id => !prevIds.has(id)));
    if (crewCount() > prevCrew) highlight.add('@crew');
    prevIds = new Set(ids);
    prevCrew = crewCount();

    const st = computeShipStats(design, level, data);
    renderComponents();
    renderRockets();
    renderSlots();
    renderTabs();
    renderCrew(st);
    renderStats(st, highlight);
    hoverId = null;
  }

  function setHover(id) {
    if (id === hoverId) return;
    hoverId = id;
    root.querySelectorAll('.ship-stage .part.hover').forEach(g => g.classList.remove('hover'));
    if (id) root.querySelectorAll(`.ship-stage .part[data-id="${id}"]`).forEach(g => g.classList.add('hover'));
  }

  // Hovering a component card (or a legend chip) lights up that part on the ship.
  root.onmouseover = e => {
    const t = e.target.closest('[data-act="comp"], [data-hover]');
    setHover(t ? t.dataset.id || t.dataset.hover : null);
  };

  function assignMember(id) {
    const m = memberById[id];
    const current = design.crewSlots.indexOf(id);
    if (current >= 0) {
      design.crewSlots[current] = null;
      focusedSlot = current;
      lastChange = { kind: 'removed', text: `👋 ${m.name} se bajó de la nave.` };
      return;
    }
    const target = targetSlotFor(m);
    if (target < 0) {
      toast({ kind: 'ignored', title: 'No hay puesto para este rol', text: `Esta misión no pide un(a) ${roles[m.role].name}.` }, 3500);
      return;
    }
    const replaced = memberById[design.crewSlots[target]];
    design.crewSlots[target] = id;
    lastChange = replaced
      ? { kind: 'swapped', text: `⇄ ${m.name} reemplaza a ${replaced.name} como ${slotLabel(slots[target], data)}.` }
      : { kind: 'added', text: `👩‍🚀 ${m.name} sube a bordo como ${slotLabel(slots[target], data)}.` };
    // Guide the player to the next empty slot and its category.
    focusedSlot = firstEmptySlot();
    if (focusedSlot !== null) activeRole = slots[focusedSlot].roles.includes(activeRole) ? activeRole : slots[focusedSlot].roles[0];
  }

  root.onclick = e => {
    const t = e.target.closest('[data-act]');
    if (!t) return;
    const { act, id } = t.dataset;
    if (act === 'back') return ctx.onBack();
    if (act === 'launch') {
      if (computeShipStats(design, level, data).valid) ctx.onLaunch();
      return;
    }
    if (act === 'comp') {
      const c = compById[id];
      const cat = cats.find(k => k.id === c.category);
      if (!isAvailable(c, level)) return;
      if (cat.multi) {
        if (design.instruments.includes(id)) {
          design.instruments = design.instruments.filter(x => x !== id);
          lastChange = { kind: 'removed', text: `➖ Quitaste: ${c.name}` };
        } else {
          design.instruments = [...design.instruments, id];
          lastChange = { kind: 'added', text: `➕ Instalaste: ${c.name}` };
        }
      } else if (design.selections[cat.id] === id) {
        if (cat.required) return;
        design.selections[cat.id] = null;
        lastChange = { kind: 'removed', text: `➖ Quitaste: ${c.name}` };
      } else {
        const old = compById[design.selections[cat.id]];
        design.selections[cat.id] = id;
        lastChange = old
          ? { kind: 'swapped', text: `🔁 Cambiaste ${old.name} por ${c.name}` }
          : { kind: 'added', text: `➕ Instalaste: ${c.name}` };
      }
    } else if (act === 'rocket') {
      const r = data.rockets.find(x => x.id === id);
      if (!r.capacityKg[level.destination]) return;
      design.rocketId = design.rocketId === id ? null : id;
      lastChange = design.rocketId ? { kind: 'added', text: `🚀 Cohete elegido: ${r.name}` } : { kind: 'removed', text: `➖ Quitaste el cohete ${r.name}` };
    } else if (act === 'unslot') {
      const i = Number(t.dataset.i);
      const m = memberById[design.crewSlots[i]];
      design.crewSlots[i] = null;
      focusedSlot = i;
      activeRole = slots[i].roles[0];
      if (m) lastChange = { kind: 'removed', text: `👋 ${m.name} se bajó de la nave.` };
    } else if (act === 'slot') {
      const i = Number(t.dataset.i);
      focusedSlot = i;
      const occupant = memberById[design.crewSlots[i]];
      activeRole = occupant ? occupant.role : slots[i].roles.includes(activeRole) ? activeRole : slots[i].roles[0];
    } else if (act === 'tab') {
      activeRole = t.dataset.role;
      if (focusedSlot === null || !slots[focusedSlot].roles.includes(activeRole)) {
        const i = slots.findIndex((s, k) => s.roles.includes(activeRole) && !design.crewSlots[k]);
        focusedSlot = i >= 0 ? i : focusedSlot;
      }
    } else if (act === 'crew') {
      assignMember(id);
    }
    refresh();
  };

  refresh();
}
