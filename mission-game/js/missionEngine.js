// Pure mission simulation. The views only read this state and call assign()/tick().
import { clamp, weightedPick, randRange, STAT_NAMES, effectsText, indexById, signed, fmt } from './util.js';
import { computeShipStats, getSelectedCrew, isAvailable } from './ship.js';

const TUNING = {
  powerRegenPerKw: 0.5,      // % of battery recovered per second per kW of surplus
  fatigueRecovery: 1.5,      // fatigue points recovered per second while idle
  fatiguePerTask: 25,
  fatiguePenalty: 0.25,      // % chance lost per fatigue point
  statWeight: 8,             // % chance per stat point above/below difficulty
  specialtyBonus: 20,
  powerOutDamage: 0.6,       // integrity lost per second with no power
  lifeOutDamage: 1.5,        // integrity lost per second with no life support
  minChance: 5,
  maxChance: 95
};

// Points: the main (scripted) objectives share MAIN_POINTS of the grade; random events
// add or subtract a few points each (defaults below, overridable per event with "points").
export const MAIN_POINTS = 30;
const RANDOM_POINTS = {
  negative: { success: 3, fail: -2, ignored: -4 },
  positive: { success: 4, fail: 0, ignored: -1 }
};

const PART_LABELS = {
  structure: 'Cabina', propulsion: 'Motor', power: 'Energía', battery: 'Baterías', life_support: 'Soporte vital',
  comms: 'Antena', computer: 'Computadora', attitude: 'Orientación', shielding: 'Blindaje', instruments: 'Instrumentos'
};

export function createMission(level, design, data, launchInfo = {}) {
  const stats = computeShipStats(design, level, data);
  const crew = getSelectedCrew(design, data).map(m => ({ ...m, fatigue: 0, taskUid: null }));
  const eventsById = indexById(data.events);
  const s = {
    level, design, data, stats,
    components: stats.comps,
    componentIds: new Set(stats.comps.map(c => c.id)),
    time: 0,
    duration: level.durationSec,
    pauseReasons: new Set(),
    over: false,
    outcome: null,
    integrity: 100,
    power: 100,
    life: 100,
    scienceRaw: 0,
    scienceBonus: 0,
    dataGenerated: 0,
    dataSent: 0,
    crew,
    events: [],
    // Main objectives, in order. status: upcoming | active | success | fail | ignored
    script: (level.script || [])
      .map(step => ({ at: step.at, def: eventsById[step.event], status: 'upcoming', uid: null }))
      .filter(step => step.def),
    points: 0, // net points from random events
    uid: 0,
    nextSpawnAt: level.firstEventAt ?? 4,
    spawnCounts: {},
    log: [],
    counters: {
      spawned: 0, success: 0, fail: 0, ignored: 0,
      randomSuccess: 0, randomFail: 0, randomIgnored: 0,
      powerOutSec: 0, lifeOutSec: 0, damageBy: {}, hints: {}
    },
    version: 0
  };
  if (launchInfo.anomalyDamage) {
    s.integrity -= launchInfo.anomalyDamage;
    s.counters.damageBy['Anomalía en el lanzamiento'] = launchInfo.anomalyDamage;
    s.log.push({
      time: 0, kind: 'fail', title: '⚠️ Anomalía en el lanzamiento',
      text: `Vibraciones fuertes durante el ascenso dañaron la nave (−${launchInfo.anomalyDamage} integridad).`,
      hints: ['Un cohete más confiable reduce el riesgo de anomalías en el lanzamiento.']
    });
  }
  return s;
}

export const isPaused = s => s.pauseReasons.size > 0;

export function creditedScience(s) {
  const fraction = s.dataGenerated > 0 ? s.dataSent / s.dataGenerated : 1;
  return Math.max(0, s.scienceRaw * fraction + s.scienceBonus);
}

export function sentFraction(s) {
  return s.dataGenerated > 0 ? s.dataSent / s.dataGenerated : 1;
}

export const mainValue = s => MAIN_POINTS / Math.max(1, s.script.length);

// Points an event gives for a result: 'success' | 'fail' | 'ignored'.
export function eventPoints(s, ev, result) {
  if (ev.main) return result === 'success' ? mainValue(s) : 0;
  const base = ev.def.positive ? RANDOM_POINTS.positive : RANDOM_POINTS.negative;
  return ev.def.points?.[result] ?? base[result];
}

export function locationLabel(s, ev) {
  const loc = ev.loc;
  if (loc.type === 'ship') {
    const comp = loc.part === 'instruments' ? null : s.components.find(c => c.category === loc.part);
    return `En la nave · ${PART_LABELS[loc.part] || 'Casco'}${comp ? ` (${comp.name})` : ''}`;
  }
  if (loc.type === 'planet') return s.level.planetLocation || `En ${s.level.bodyName}`;
  if (loc.type === 'earth') return s.level.destination === 'LEO' ? 'Estación terrena en la Tierra' : 'Enlace con la Tierra';
  return 'En el espacio, cerca de la nave';
}

// Where the event happens. a/b are random seeds the map uses to place it.
function makeLocation(s, def, rng) {
  const type = def.location || 'space';
  let part = null;
  if (type === 'ship') {
    const wanted = def.part || 'structure';
    part = s.components.some(c => c.category === wanted) ? wanted : 'structure';
  }
  return { type, part, a: rng(), b: rng() };
}

export function optionDifficulty(s, option) {
  return option.difficulty + (s.level.difficultyBonus || 0) + (option.destDifficulty?.[s.level.destination] || 0);
}

export function calcChance(s, event, optionIdx, member) {
  const opt = event.def.options[optionIdx];
  const diff = optionDifficulty(s, opt);
  const stat = member.stats[opt.stat];
  const lines = [{ label: 'Base', value: 50 }];
  lines.push({ label: `${STAT_NAMES[opt.stat]} ${stat} vs dificultad ${diff}`, value: (stat - diff) * TUNING.statWeight });
  if (opt.specialties?.includes(member.role)) {
    lines.push({ label: `Especialidad: ${s.data.crew.roles[member.role].name}`, value: TUNING.specialtyBonus });
  }
  const fatigue = -Math.round(member.fatigue * TUNING.fatiguePenalty);
  if (fatigue) lines.push({ label: 'Fatiga', value: fatigue });
  for (const c of s.components) {
    const bonus = c.eventMods?.[event.def.id];
    if (bonus) lines.push({ label: c.name, value: bonus });
  }
  const raw = lines.reduce((acc, l) => acc + l.value, 0);
  return { chance: Math.round(clamp(raw, TUNING.minChance, TUNING.maxChance)), lines };
}

export function assign(s, eventUid, optionIdx, crewId) {
  const ev = s.events.find(e => e.uid === eventUid);
  const member = s.crew.find(m => m.id === crewId);
  if (!ev || ev.status !== 'pending' || !member || member.taskUid) return false;
  const opt = ev.def.options[optionIdx];
  const { chance, lines } = calcChance(s, ev, optionIdx, member);
  ev.status = 'working';
  ev.task = {
    crewId, optionIdx, chance, lines,
    fatigueAtStart: member.fatigue,
    startedAt: s.time,
    doneAt: s.time + opt.duration
  };
  member.taskUid = ev.uid;
  member.fatigue = clamp(member.fatigue + (opt.fatigue ?? TUNING.fatiguePerTask), 0, 100);
  s.version++;
  return true;
}

export function tick(s, dt, rng = Math.random) {
  const notices = [];
  if (s.over || isPaused(s)) return notices;
  s.time += dt;
  const st = s.stats;

  // Continuous resources
  const surplus = Math.max(0, st.powerGen - st.powerUse);
  s.power = clamp(s.power + surplus * TUNING.powerRegenPerKw * st.batteryMult * dt, 0, 100);
  const lifeDrain = s.level.lifeSupportDrain * (s.crew.length / Math.max(1, st.lifeCapacity)) * st.lifeDrainMult;
  s.life = clamp(s.life - lifeDrain * dt, 0, 100);

  if (s.power > 0) {
    s.scienceRaw += st.scienceRate * dt;
    const generated = st.dataRate * dt;
    s.dataGenerated += generated;
    s.dataSent += Math.min(generated, st.sendRate * dt);
  } else {
    s.counters.powerOutSec += dt;
    damage(s, TUNING.powerOutDamage * dt, 'Falta de energía');
  }
  if (s.life <= 0) {
    s.counters.lifeOutSec += dt;
    damage(s, TUNING.lifeOutDamage * dt, 'Soporte vital agotado');
  }

  for (const m of s.crew) {
    if (!m.taskUid) m.fatigue = Math.max(0, m.fatigue - TUNING.fatigueRecovery * dt);
  }

  // Events: finish tasks / expire
  for (const ev of [...s.events]) {
    if (ev.status === 'working' && s.time >= ev.task.doneAt) resolveTask(s, ev, rng, notices);
    else if (ev.status === 'pending' && s.time >= ev.expiresAt) expireEvent(s, ev, notices);
  }

  // Main (scripted) events always appear at their time
  for (const step of s.script) {
    if (step.status !== 'upcoming' || s.time < step.at) continue;
    const ev = spawnEvent(s, step.def, rng, true);
    step.status = 'active';
    step.uid = ev.uid;
    notices.push({ kind: 'main', title: `🎯 Objetivo principal: ${step.def.name}`, text: step.def.text });
  }

  // Random events
  if (s.time >= s.nextSpawnAt) {
    const activeRandom = s.events.filter(e => !e.main).length;
    const def = activeRandom < s.level.maxActiveEvents ? pickRandomEvent(s, rng) : null;
    if (def) {
      spawnEvent(s, def, rng, false);
      s.nextSpawnAt = s.time + randRange(s.level.eventInterval, rng);
    } else {
      s.nextSpawnAt = s.time + 2;
    }
  }

  // End conditions
  if (s.integrity <= 0) {
    s.integrity = 0;
    s.over = true;
    s.outcome = 'aborted';
    s.abortedAt = s.time;
  } else if (s.time >= s.duration) {
    s.over = true;
    s.outcome = 'completed';
  }
  return notices;
}

function eventWeight(s, def) {
  let w = def.weight ?? 1;
  w *= def.destWeight?.[s.level.destination] ?? 1;
  for (const c of s.components) w *= c.eventWeights?.[def.id] ?? 1;
  return w;
}

function pickRandomEvent(s, rng) {
  const activeIds = new Set(s.events.map(e => e.def.id));
  const candidates = s.data.events.filter(def =>
    !def.main &&
    (!def.destinations || def.destinations.includes(s.level.destination)) &&
    !activeIds.has(def.id) &&
    (!def.maxPerMission || (s.spawnCounts[def.id] || 0) < def.maxPerMission));
  return weightedPick(candidates, d => eventWeight(s, d), rng);
}

function spawnEvent(s, def, rng, main) {
  const ev = {
    uid: ++s.uid,
    def,
    main,
    loc: makeLocation(s, def, rng),
    spawnedAt: s.time,
    expiresAt: s.time + def.timeout * s.level.eventTimeoutMult,
    status: 'pending',
    task: null
  };
  s.events.push(ev);
  s.spawnCounts[def.id] = (s.spawnCounts[def.id] || 0) + 1;
  s.counters.spawned++;
  s.version++;
  return ev;
}

function damage(s, amount, cause) {
  s.integrity = clamp(s.integrity - amount, 0, 100);
  s.counters.damageBy[cause] = (s.counters.damageBy[cause] || 0) + amount;
}

function applyEffects(s, effects, causeName) {
  const applied = [];
  for (const [key, raw] of Object.entries(effects || {})) {
    let v = raw;
    switch (key) {
      case 'integrity':
        if (v < 0) damage(s, -v, causeName);
        else s.integrity = clamp(s.integrity + v, 0, 100);
        break;
      case 'power':
        if (v < 0) v = Math.round(v / s.stats.batteryMult);
        s.power = clamp(s.power + v, 0, 100);
        break;
      case 'life':
        s.life = clamp(s.life + v, 0, 100);
        break;
      case 'science':
        s.scienceBonus += v;
        break;
      case 'data': {
        // "data" is measured in seconds of instrument output recovered/lost
        const amount = v * Math.max(1, s.stats.dataRate);
        s.dataSent = clamp(s.dataSent + amount, 0, s.dataGenerated);
        break;
      }
      case 'fatigueAll':
        s.crew.forEach(m => { m.fatigue = clamp(m.fatigue + v, 0, 100); });
        break;
      default:
        break;
    }
    applied.push({ key, value: v });
  }
  return applied;
}

function addHints(s, hints) {
  for (const h of hints) s.counters.hints[h] = (s.counters.hints[h] || 0) + 1;
}

function failHints(s, ev, opt, member, task) {
  const hints = [];
  const roles = s.data.crew.roles;
  const diff = optionDifficulty(s, opt);
  if (opt.specialties?.length && !opt.specialties.includes(member.role)) {
    hints.push(`Para "${ev.def.name}" conviene un(a) ${opt.specialties.map(r => roles[r].name).join(' o ')} (+20 %).`);
  }
  if (member.stats[opt.stat] < diff) {
    hints.push(`${member.name} tiene ${STAT_NAMES[opt.stat]} ${member.stats[opt.stat]}, menor que la dificultad (${diff}). Prueba otra opción o a otra persona.`);
  }
  if (task.fatigueAtStart >= 40) {
    hints.push('Asignaste a tripulantes cansados: la fatiga baja su probabilidad de éxito. Rota al equipo.');
  }
  const helpers = s.data.components.components.filter(c =>
    c.eventMods?.[ev.def.id] && !s.componentIds.has(c.id) && isAvailable(c, s.level));
  if (helpers.length) {
    hints.push(`Equipo que ayuda con "${ev.def.name}": ${helpers.map(c => c.name).join(', ')}.`);
  }
  return hints;
}

function removeEvent(s, ev) {
  s.events = s.events.filter(e => e !== ev);
}

// Records the result: objective status (main events) or points (random events).
function scoreEvent(s, ev, result) {
  const pts = eventPoints(s, ev, result);
  if (ev.main) {
    const step = s.script.find(x => x.uid === ev.uid);
    if (step) step.status = result;
    return pts ? `🎯 Objetivo cumplido +${fmt(pts, 1)} pts` : '🎯 Objetivo no cumplido';
  }
  s.points += pts;
  s.counters[{ success: 'randomSuccess', fail: 'randomFail', ignored: 'randomIgnored' }[result]]++;
  return `⭐ ${signed(pts)} pts`;
}

function resolveTask(s, ev, rng, notices) {
  const { task } = ev;
  const opt = ev.def.options[task.optionIdx];
  const member = s.crew.find(m => m.id === task.crewId);
  const success = rng() * 100 < task.chance;
  const outcome = success ? opt.success : opt.fail;
  const applied = applyEffects(s, outcome.effects, ev.def.name);
  member.taskUid = null;
  removeEvent(s, ev);
  const hints = success ? [] : failHints(s, ev, opt, member, task);
  if (success) s.counters.success++;
  else s.counters.fail++;
  const pointsText = scoreEvent(s, ev, success ? 'success' : 'fail');
  addHints(s, hints);
  const entry = {
    time: s.time,
    kind: success ? 'success' : 'fail',
    main: ev.main,
    title: `${success ? '✅ Éxito' : '❌ Falla'}: ${ev.def.name}`,
    text: `${member.name} — ${outcome.text}`,
    effects: [pointsText, effectsText(applied)].filter(Boolean).join(' · '),
    reason: `Probabilidad de éxito: ${task.chance} % (${task.lines.map(l => `${l.label} ${l.value > 0 ? '+' : ''}${l.value}`).join(', ')})`,
    hints
  };
  s.log.push(entry);
  notices.push(entry);
  s.version++;
}

function expireEvent(s, ev, notices) {
  const outcome = ev.def.onIgnore || { effects: {}, text: 'Se perdió la oportunidad.' };
  const applied = applyEffects(s, outcome.effects, ev.def.name);
  removeEvent(s, ev);
  s.counters.ignored++;
  const pointsText = scoreEvent(s, ev, 'ignored');
  const hints = [ev.main
    ? 'Los objetivos principales valen mucho de tu calificación: atiéndelos antes que los imprevistos.'
    : ev.def.positive
      ? 'Los eventos positivos también cuentan: aprovéchalos para ganar ciencia y datos.'
      : 'Atiende los eventos antes de que se acabe su tiempo: ignorarlos siempre es peor que fallar.'];
  addHints(s, hints);
  const entry = {
    time: s.time,
    kind: 'ignored',
    main: ev.main,
    title: `⌛ Sin atender: ${ev.def.name}`,
    text: outcome.text,
    effects: [pointsText, effectsText(applied)].filter(Boolean).join(' · '),
    hints
  };
  s.log.push(entry);
  notices.push(entry);
  s.version++;
}
