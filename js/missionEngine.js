// Pure mission simulation. The views only read this state and call assign()/tick().
import { clamp, weightedPick, randRange, STAT_NAMES, effectsText, indexById } from './util.js';
import { computeShipStats, getSelectedCrew, isAvailable } from './ship.js';

const TUNING = {
  powerRegenPerKw: 0.5,      // % of battery recovered per second per kW of surplus
  fatigueRecoveryBase: 0.8,  // fatigue recovered per second while idle (+ calm * fatigueRecoveryCalm)
  fatigueRecoveryCalm: 0.12,
  fatiguePerTask: 25,        // multiplied by (1.5 - calm * 0.08): calm crew gets tired slower
  exhaustedAt: 80,           // fatigue >= this: "Agotado", tasks take 50 % longer
  exhaustedSlowdown: 1.5,
  fatiguePenalty: 0.25,      // % chance lost per fatigue point
  statWeight: 8,             // % chance per stat point above/below difficulty
  specialtyBonus: 8,
  chanceBase: 78,            // chance when the team exactly covers the problem's shape
  deficitCost: 8,            // % lost per missing skill point
  excessCap: 6,              // max bonus for skill to spare (+1 per 2 extra points)
  powerOutDamage: 0.6,       // integrity lost per second with no power
  lifeOutDamage: 1.5,        // integrity lost per second with no life support
  minChance: 5,
  maxChance: 95
};

// Points shown to the player for each outcome (can be overridden per outcome with "points").
const DEFAULT_POINTS = {
  main: { success: 100, fail: -40, ignored: -80 },
  positive: { success: 40, fail: 5, ignored: 0 },
  negative: { success: 25, fail: -15, ignored: -30 }
};

// Free-space spots (normalized canvas coords) for space events.
const SPACE_POINTS = [[0.14, 0.5], [0.86, 0.5], [0.3, 0.12], [0.7, 0.88], [0.3, 0.88], [0.62, 0.12], [0.12, 0.78], [0.88, 0.78]];

export function createMission(level, design, data, launchInfo = {}) {
  const stats = computeShipStats(design, level, data);
  const crew = getSelectedCrew(design, data).map(m => ({
    ...m, fatigue: 0, taskUid: null, outFor: 0,
    slot: level.crewSlots.find(sl => design.crew[sl.id] === m.id)?.label || ''
  }));
  const mainById = indexById(data.mainEvents);
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
    points: 0,
    status: { blackout: 0, commsDown: 0, sensorsDown: 0 },
    crew,
    events: [],
    objectives: level.mainEvents
      .map(m => ({ def: mainById[m.id], at: m.at, status: 'upcoming', uid: null }))
      .sort((a, b) => a.at - b.at),
    uid: 0,
    nextSpawnAt: level.firstEventAt ?? 15,
    spawnCounts: {},
    log: [],
    counters: {
      spawned: 0, success: 0, fail: 0, ignored: 0, powerOutSec: 0, lifeOutSec: 0,
      statusSec: { blackout: 0, commsDown: 0, sensorsDown: 0 }, crewOutSec: 0, exhaustedTasks: 0,
      damageBy: {}, hints: {}
    },
    version: 0
  };
  s.launch = launchInfo;
  if (launchInfo.anomalyDamage) {
    s.integrity -= launchInfo.anomalyDamage;
    s.counters.damageBy['Despegue movido'] = launchInfo.anomalyDamage;
    s.log.push({
      time: 0, kind: 'fail', title: 'Despegue movido',
      text: `El viaje a la órbita sacudió la nave (−${launchInfo.anomalyDamage} de vida).`,
      hints: ['Cuida la potencia en el despegue. Una nave más ligera o un escudo mejor también ayudan.']
    });
  }
  return s;
}

export const isPaused = s => s.pauseReasons.size > 0;
export const isBlackout = s => s.status.blackout > 0;
export const isExhausted = m => m.fatigue >= TUNING.exhaustedAt;

/** Why a crew member can't take a task right now (null = available). */
export function unavailableReason(s, member) {
  if (isBlackout(s)) return 'Apagón: consola bloqueada';
  if (member.outFor > 0) return `Fuera de servicio (${Math.ceil(member.outFor)} s)`;
  if (member.taskUid) return 'Ocupado';
  return null;
}

export function creditedScience(s) {
  const fraction = s.dataGenerated > 0 ? s.dataSent / s.dataGenerated : 1;
  return Math.max(0, s.scienceRaw * fraction + s.scienceBonus);
}

export function sentFraction(s) {
  return s.dataGenerated > 0 ? s.dataSent / s.dataGenerated : 1;
}

export function optionDifficulty(s, option) {
  return option.difficulty + (s.level.difficultyBonus || 0) + (option.destDifficulty?.[s.level.destination] || 0);
}

export const STATS = ['speed', 'analysis', 'tech', 'calm'];
export const MAX_TEAM = 2;

/**
 * Requirement profile of an event (Dispatch style): the level the problem demands in EACH of the 4 skills.
 * Derived from the event's two approaches: the first approach's skill is the main demand,
 * the second approach's skill is the secondary one, plus a third skill (Calma for emergencies
 * and objectives, Análisis for opportunities). The rest gets a low baseline.
 * Override in JSON with "req": { "speed": 7, "analysis": 5, "tech": 3, "calm": 6 }.
 */
export function requirements(s, def) {
  const bonus = s.level.difficultyBonus || 0;
  const dest = s.level.destination;
  const req = { speed: 0, analysis: 0, tech: 0, calm: 0 };
  if (def.req) {
    for (const k of STATS) req[k] = Math.min(10, (def.req[k] || 3) + bonus);
    return req;
  }
  const [a, b] = def.options;
  req[a.stat] = Math.max(req[a.stat], a.difficulty + 1 + (a.destDifficulty?.[dest] || 0));
  if (b) req[b.stat] = Math.max(req[b.stat], b.difficulty + (b.destDifficulty?.[dest] || 0));
  const third = def.positive ? (req.analysis ? 'speed' : 'analysis') : (req.calm ? 'analysis' : 'calm');
  if (!req[third]) req[third] = def.main ? 5 : 4;
  for (const k of STATS) req[k] = req[k] ? Math.min(10, req[k] + bonus) : 2;
  return req;
}

/** Combined stats of a team: the best value of each stat among its members. */
export function teamStats(members) {
  const out = { speed: 0, analysis: 0, tech: 0, calm: 0 };
  for (const m of members) for (const k of STATS) out[k] = Math.max(out[k], m.stats[k]);
  return out;
}

/** Which approach the team takes: the option where its stat exceeds the difficulty the most. */
export function chooseApproach(s, def, members) {
  const team = teamStats(members);
  let best = 0;
  let bestScore = -Infinity;
  def.options.forEach((o, i) => {
    const spec = o.specialties?.some(r => members.some(m => m.role === r)) ? 1.5 : 0;
    const score = team[o.stat] - optionDifficulty(s, o) + spec;
    if (score > bestScore) { bestScore = score; best = i; }
  });
  return best;
}

export function eventSpecialties(def) {
  return [...new Set(def.options.flatMap(o => o.specialties || []))];
}

export function calcChance(s, event, members) {
  const req = requirements(s, event.def);
  const team = teamStats(members);
  let deficit = 0;
  let excess = 0;
  const missing = [];
  for (const k of STATS) {
    const d = Math.max(0, req[k] - team[k]);
    deficit += d;
    if (d) missing.push(k);
    excess += Math.max(0, team[k] - req[k]);
  }
  const lines = [{ label: 'Base', value: TUNING.chanceBase }];
  if (deficit) lines.push({ label: `Faltan ${deficit} punto(s) de habilidad`, value: -deficit * TUNING.deficitCost });
  const extra = Math.min(TUNING.excessCap, Math.floor(excess / 2));
  if (extra) lines.push({ label: 'Habilidad de sobra', value: extra });
  const specs = eventSpecialties(event.def);
  const specMember = members.find(m => specs.includes(m.role));
  if (specMember) lines.push({ label: `Especialista: ${s.data.crew.roles[specMember.role].name}`, value: TUNING.specialtyBonus });
  const avgFatigue = members.reduce((acc, m) => acc + m.fatigue, 0) / Math.max(1, members.length);
  const fatigue = -Math.round(avgFatigue * TUNING.fatiguePenalty);
  if (fatigue) lines.push({ label: 'Fatiga', value: fatigue });
  for (const c of s.components) {
    const bonus = c.eventMods?.[event.def.id];
    if (bonus) lines.push({ label: c.name, value: bonus });
  }
  const raw = lines.reduce((acc, l) => acc + l.value, 0);
  return { chance: Math.round(clamp(raw, TUNING.minChance, TUNING.maxChance)), lines, req, team, deficit, missing };
}

export function taskDuration(s, def, members) {
  const opt = def.options[chooseApproach(s, def, members)];
  const tired = members.some(isExhausted) ? TUNING.exhaustedSlowdown : 1;
  const teamwork = members.length > 1 ? 0.8 : 1;
  return opt.duration * tired * teamwork;
}

export function assign(s, eventUid, crewIds) {
  const ids = [].concat(crewIds).slice(0, MAX_TEAM);
  const ev = s.events.find(e => e.uid === eventUid);
  const members = ids.map(id => s.crew.find(m => m.id === id)).filter(Boolean);
  if (!ev || ev.status !== 'pending' || !members.length || members.some(m => unavailableReason(s, m))) return false;
  const optionIdx = chooseApproach(s, ev.def, members);
  const opt = ev.def.options[optionIdx];
  const { chance, lines } = calcChance(s, ev, members);
  const duration = taskDuration(s, ev.def, members);
  if (members.some(isExhausted)) s.counters.exhaustedTasks++;
  ev.status = 'working';
  ev.task = {
    crewIds: members.map(m => m.id), optionIdx, chance, lines,
    fatigueAtStart: Math.max(...members.map(m => m.fatigue)),
    startedAt: s.time,
    doneAt: s.time + duration
  };
  for (const m of members) {
    m.taskUid = ev.uid;
    const calmFactor = Math.max(0.6, 1.5 - m.stats.calm * 0.08);
    m.fatigue = clamp(m.fatigue + (opt.fatigue ?? TUNING.fatiguePerTask) * calmFactor, 0, 100);
  }
  const obj = s.objectives.find(o => o.uid === ev.uid);
  if (obj) obj.status = 'working';
  s.version++;
  return true;
}

export function tick(s, dt, rng = Math.random) {
  const notices = [];
  if (s.over || isPaused(s)) return notices;
  s.time += dt;
  const st = s.stats;

  // Temporary failure states (apagón, comunicaciones, sensores)
  const STATUS_END = {
    blackout: '⚡ Energía restablecida: la consola vuelve a funcionar.',
    commsDown: '📡 Enlace con la Tierra recuperado.',
    sensorsDown: '🔬 Sensores recalibrados: la ciencia vuelve a fluir.'
  };
  for (const k of Object.keys(s.status)) {
    if (s.status[k] > 0) {
      s.counters.statusSec[k] += Math.min(dt, s.status[k]);
      s.status[k] = Math.max(0, s.status[k] - dt);
      if (s.status[k] === 0) {
        notices.push({ kind: 'status', title: STATUS_END[k] });
        s.version++;
      }
    }
  }
  const blackout = isBlackout(s);

  // Continuous resources
  const surplus = Math.max(0, st.powerGen - st.powerUse);
  if (blackout) s.power = 0;
  else s.power = clamp(s.power + surplus * TUNING.powerRegenPerKw * st.batteryMult * dt, 0, 100);
  const lifeDrain = s.level.lifeSupportDrain * (s.crew.length / Math.max(1, st.lifeCapacity)) * st.lifeDrainMult;
  s.life = clamp(s.life - lifeDrain * dt, 0, 100);

  if (blackout) {
    // nothing works during a blackout (no damage: it is a controlled shutdown)
  } else if (s.power > 0) {
    if (s.status.sensorsDown <= 0) {
      s.scienceRaw += st.scienceRate * dt;
      const generated = st.dataRate * dt;
      s.dataGenerated += generated;
      if (s.status.commsDown <= 0) s.dataSent += Math.min(generated, st.sendRate * dt);
    }
  } else {
    s.counters.powerOutSec += dt;
    damage(s, TUNING.powerOutDamage * dt, 'Falta de energía');
  }
  if (s.life <= 0) {
    s.counters.lifeOutSec += dt;
    damage(s, TUNING.lifeOutDamage * dt, 'Soporte vital agotado');
  }

  for (const m of s.crew) {
    if (m.outFor > 0) {
      s.counters.crewOutSec += Math.min(dt, m.outFor);
      m.outFor = Math.max(0, m.outFor - dt);
      if (m.outFor === 0) {
        notices.push({ kind: 'status', title: `🩹 ${m.name} vuelve al servicio.` });
        s.version++;
      }
    } else if (!m.taskUid) {
      m.fatigue = Math.max(0, m.fatigue - (TUNING.fatigueRecoveryBase + m.stats.calm * TUNING.fatigueRecoveryCalm) * dt);
    }
  }

  // During a blackout, work in progress is frozen
  if (blackout) {
    for (const ev of s.events) {
      if (ev.status === 'working') {
        ev.task.doneAt += dt;
        ev.task.startedAt += dt;
      }
    }
  }

  // Events: finish tasks / expire
  for (const ev of [...s.events]) {
    if (ev.status === 'working' && s.time >= ev.task.doneAt) resolveTask(s, ev, rng, notices);
    else if (ev.status === 'pending' && s.time >= ev.expiresAt) expireEvent(s, ev, notices);
  }

  // Scripted main events. A "final" objective (the landing) only starts when the other objectives are
  // over (or when time runs out), and the mission ends when it is resolved.
  const OPEN = ['upcoming', 'active', 'working'];
  const othersOpen = s.objectives.some(o => !o.def.final && OPEN.includes(o.status));
  for (const obj of s.objectives) {
    if (obj.def.final && obj.status === 'upcoming' && s.time >= s.duration && othersOpen) {
      // time is up: whatever was still open is lost, then comes the landing
      for (const o of s.objectives) {
        if (o.def.final || !OPEN.includes(o.status)) continue;
        const ev = o.uid && s.events.find(e => e.uid === o.uid);
        if (ev) removeEvent(s, ev);
        o.status = 'missed';
      }
      s.version++;
    }
    const ready = obj.def.final ? (s.time >= obj.at && !s.objectives.some(o => !o.def.final && OPEN.includes(o.status))) || s.time >= s.duration : s.time >= obj.at;
    if (obj.status === 'upcoming' && ready) {
      const ev = makeEvent(s, obj.def, true, rng);
      obj.status = 'active';
      obj.uid = ev.uid;
      const entry = {
        time: s.time, kind: 'main', main: true,
        title: `🎯 Objetivo principal: ${obj.def.name}`,
        text: obj.def.objective
      };
      notices.push(entry);
    }
  }

  // Random events
  const landing = s.objectives.some(o => o.def.final && o.status !== 'upcoming');
  if (s.time >= s.nextSpawnAt && !landing) {
    const randomActive = s.events.filter(e => !e.main).length;
    if (randomActive < s.level.maxActiveEvents && spawnRandom(s, rng)) {
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
  } else {
    const final = s.objectives.find(o => o.def.final);
    if (final) {
      if (!OPEN.includes(final.status) || s.time >= s.duration + 90) {
        s.over = true;
        s.outcome = 'completed';
      }
    } else if (s.time >= s.duration) {
      s.over = true;
      s.outcome = 'completed';
    }
  }
  if (s.over) {
    for (const obj of s.objectives) {
      if (obj.status === 'upcoming' || obj.status === 'active' || obj.status === 'working') obj.status = 'missed';
    }
  }
  return notices;
}

/** Debug/testing helper: spawn a specific random event now. */
export function debugSpawn(s, defId) {
  const def = s.data.events.find(e => e.id === defId);
  return def ? makeEvent(s, def, false, Math.random) : null;
}

function eventWeight(s, def) {
  let w = def.weight ?? 1;
  w *= def.destWeight?.[s.level.destination] ?? 1;
  for (const c of s.components) w *= c.eventWeights?.[def.id] ?? 1;
  return w;
}

function resolveLocation(s, def, rng) {
  const loc = def.location || { type: 'space' };
  if (loc.type === 'ship') return { type: 'ship', part: loc.part };
  if (loc.type === 'planet' || (loc.spot === 'earth' && s.level.destination === 'LEO')) {
    // upper half of the planet (canvas y grows downwards)
    return { type: 'planet', angle: -Math.PI * (0.2 + rng() * 0.6) };
  }
  if (loc.spot) return { type: 'space', spot: loc.spot };
  const used = new Set(s.events.filter(e => e.loc.type === 'space').map(e => e.loc.pointIdx));
  const free = SPACE_POINTS.map((p, i) => i).filter(i => !used.has(i));
  const idx = free.length ? free[Math.floor(rng() * free.length)] : Math.floor(rng() * SPACE_POINTS.length);
  const [px, py] = SPACE_POINTS[idx];
  return { type: 'space', pointIdx: idx, x: px + (rng() - 0.5) * 0.05, y: py + (rng() - 0.5) * 0.05, trajectory: !!loc.trajectory };
}

function makeEvent(s, def, main, rng) {
  const timeout = main ? def.timeout : def.timeout * s.level.eventTimeoutMult;
  const ev = {
    uid: ++s.uid,
    def,
    main,
    loc: resolveLocation(s, def, rng),
    spawnedAt: s.time,
    expiresAt: s.time + timeout,
    status: 'pending',
    task: null
  };
  s.events.push(ev);
  s.version++;
  return ev;
}

function spawnRandom(s, rng) {
  const activeIds = new Set(s.events.map(e => e.def.id));
  const candidates = s.data.events.filter(def =>
    (!def.destinations || def.destinations.includes(s.level.destination)) &&
    !activeIds.has(def.id) &&
    (!def.maxPerMission || (s.spawnCounts[def.id] || 0) < def.maxPerMission));
  const def = weightedPick(candidates, d => eventWeight(s, d), rng);
  if (!def) return null;
  s.spawnCounts[def.id] = (s.spawnCounts[def.id] || 0) + 1;
  s.counters.spawned++;
  return makeEvent(s, def, false, rng);
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
      case 'blackout':
        s.status.blackout = Math.max(s.status.blackout, v);
        s.power = 0;
        break;
      case 'commsDown':
      case 'sensorsDown':
        s.status[key] = Math.max(s.status[key], v);
        break;
      case 'crewOut': {
        const idle = s.crew.filter(m => !m.taskUid && m.outFor <= 0);
        const pool = idle.length ? idle : s.crew.filter(m => m.outFor <= 0 && !m.taskUid);
        if (!pool.length) { v = 0; break; }
        const who = pool[Math.floor(Math.random() * pool.length)];
        who.outFor = Math.max(who.outFor, v);
        applied.push({ key, value: v, who: who.name });
        continue;
      }
      default:
        break;
    }
    applied.push({ key, value: v });
  }
  return applied;
}

function pointsFor(ev, kind, outcome) {
  if (outcome && outcome.points != null) return outcome.points;
  const type = ev.main ? 'main' : ev.def.positive ? 'positive' : 'negative';
  return DEFAULT_POINTS[type][kind];
}

function addHints(s, hints) {
  for (const h of hints) s.counters.hints[h] = (s.counters.hints[h] || 0) + 1;
}

function failHints(s, ev, members, task) {
  const hints = [];
  const roles = s.data.crew.roles;
  const specs = eventSpecialties(ev.def);
  if (specs.length && !members.some(m => specs.includes(m.role))) {
    hints.push(`Para "${ev.def.name}" conviene un(a) ${specs.map(r => roles[r].name).join(' o ')} (+${TUNING.specialtyBonus} %).`);
  }
  const req = requirements(s, ev.def);
  const team = teamStats(members);
  const short = STATS.filter(k => req[k] && team[k] < req[k]);
  if (short.length) {
    hints.push(`Al equipo le faltó ${short.map(k => `${STAT_NAMES[k]} (${team[k]} de ${req[k]})`).join(' y ')}. Mira la gráfica: busca a alguien que cubra esa punta.`);
  }
  if (task.fatigueAtStart >= 40) {
    hints.push('Enviaste tripulantes cansados: la fatiga baja la probabilidad de éxito. Rota al equipo.');
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

function setObjective(s, ev, status) {
  const obj = s.objectives.find(o => o.uid === ev.uid);
  if (obj) obj.status = status;
}

function resolveTask(s, ev, rng, notices) {
  const { task } = ev;
  const opt = ev.def.options[task.optionIdx];
  const members = task.crewIds.map(id => s.crew.find(m => m.id === id));
  const success = rng() * 100 < task.chance;
  const outcome = success ? opt.success : opt.fail;
  const applied = applyEffects(s, outcome.effects, ev.def.name);
  const points = pointsFor(ev, success ? 'success' : 'fail', outcome);
  s.points += points;
  members.forEach(m => { m.taskUid = null; });
  removeEvent(s, ev);
  const hints = success ? [] : failHints(s, ev, members, task);
  if (ev.main) setObjective(s, ev, success ? 'success' : 'fail');
  else if (success) s.counters.success++;
  else s.counters.fail++;
  addHints(s, hints);
  const label = ev.main ? (success ? '🎯 Objetivo cumplido' : '🎯 Objetivo fallido') : (success ? '✅ Éxito' : '❌ Falla');
  const names = members.map(m => m.name).join(' y ');
  const entry = {
    time: s.time,
    kind: success ? 'success' : 'fail',
    main: ev.main,
    title: `${label}: ${ev.def.name}`,
    text: `${names} (${opt.label.toLowerCase()}) — ${outcome.text}`,
    effects: effectsText(applied),
    rawEffects: outcome.effects,
    eventName: ev.def.name,
    shortText: outcome.text,
    points,
    reason: `Probabilidad de éxito: ${task.chance} % (${task.lines.map(l => `${l.label} ${l.value >= 0 ? '+' : ''}${l.value}`).join(', ')})`,
    hints
  };
  s.log.push(entry);
  notices.push(entry);
  s.version++;
}

/** Ship repairs are minigames: the player fixes it directly. result = { success, perfect }. */
export function resolveRepair(s, eventUid, { success, perfect = false }) {
  const ev = s.events.find(e => e.uid === eventUid);
  if (!ev || ev.status !== 'pending' || !(ev.def.minigame || ev.def.sts125)) return null;
  const opt = ev.def.options[ev.def.minigame?.option ?? 0];
  const outcome = success ? opt.success : opt.fail;
  const applied = applyEffects(s, outcome.effects, ev.def.name);
  let points = pointsFor(ev, success ? 'success' : 'fail', outcome);
  if (success && perfect) points += 5;
  s.points += points;
  removeEvent(s, ev);
  if (ev.main) setObjective(s, ev, success ? 'success' : 'fail');
  else if (success) s.counters.success++;
  else s.counters.fail++;
  const hints = success ? [] : ['En los minijuegos, lee la instrucción y espera el momento justo antes de tocar.'];
  addHints(s, hints);
  const entry = {
    time: s.time,
    kind: success ? 'success' : 'fail',
    main: ev.main,
    repair: true,
    title: ev.main
      ? `${success ? '🎯 Objetivo cumplido' : '🎯 Objetivo fallido'}: ${ev.def.name}`
      : `${success ? '🔧 Reparado' : '❌ Reparación fallida'}: ${ev.def.name}`,
    text: outcome.text,
    effects: effectsText(applied),
    rawEffects: outcome.effects,
    eventName: ev.def.name,
    shortText: outcome.text,
    points,
    reason: 'Reparación hecha por ti (minijuego).',
    hints
  };
  s.log.push(entry);
  s.version++;
  return entry;
}

function expireEvent(s, ev, notices) {
  const outcome = ev.def.onIgnore || { effects: {}, text: 'Se perdió la oportunidad.' };
  const applied = applyEffects(s, outcome.effects, ev.def.name);
  const points = pointsFor(ev, 'ignored', outcome);
  s.points += points;
  removeEvent(s, ev);
  if (ev.main) setObjective(s, ev, 'ignored');
  else s.counters.ignored++;
  const hints = [ev.main
    ? 'Los objetivos principales son lo más importante de la misión: atiéndelos en cuanto aparezcan.'
    : ev.def.positive
      ? 'Los eventos positivos también cuentan: aprovéchalos para ganar ciencia y puntos.'
      : 'Atiende los eventos antes de que se acabe su tiempo: ignorarlos siempre es peor que fallar.'];
  addHints(s, hints);
  const entry = {
    time: s.time,
    kind: 'ignored',
    main: ev.main,
    title: `${ev.main ? '🎯 Objetivo perdido' : '⌛ Sin atender'}: ${ev.def.name}`,
    text: outcome.text,
    effects: effectsText(applied),
    rawEffects: outcome.effects,
    eventName: ev.def.name,
    shortText: outcome.text,
    points,
    hints
  };
  s.log.push(entry);
  notices.push(entry);
  s.version++;
}
