// Pure scoring and cause analysis for the final report.
import { fmt, fmtTime, clamp, signed } from './util.js';
import { creditedScience, sentFraction, MAIN_POINTS } from './missionEngine.js';

export const GRADE_THRESHOLDS = [
  { grade: 'A', min: 85 },
  { grade: 'B', min: 70 },
  { grade: 'C', min: 55 },
  { grade: 'D', min: 40 },
  { grade: 'F', min: 0 }
];

export const RANDOM_POINTS_CAP = 10;

// Light-weight score, also used live in the mission HUD.
export function computeScore(s) {
  const level = s.level;
  const science = creditedScience(s);
  const c = s.counters;
  const budgetLeft = Math.max(0, s.stats.budgetLeft);
  const mainTotal = s.script.length;
  const mainOk = s.script.filter(x => x.status === 'success').length;

  const breakdown = [
    { key: 'main', label: '🎯 Objetivos principales', value: mainTotal ? (mainOk / mainTotal) * MAIN_POINTS : MAIN_POINTS, max: MAIN_POINTS,
      detail: `${mainOk} de ${mainTotal} cumplidos` },
    { key: 'science', label: '🔬 Ciencia obtenida', value: Math.min(1, science / level.scienceGoal) * 30, max: 30,
      detail: `${fmt(science)} de ${fmt(level.scienceGoal)} puntos de la meta` },
    { key: 'integrity', label: '🛡️ Integridad de la nave', value: (s.integrity / 100) * 20, max: 20,
      detail: `${fmt(s.integrity)} % al final` },
    { key: 'random', label: '🎲 Imprevistos', value: clamp(s.points, -RANDOM_POINTS_CAP, RANDOM_POINTS_CAP), max: RANDOM_POINTS_CAP,
      detail: `${signed(s.points)} pts netos · ${c.randomSuccess} resueltos · ${c.randomFail} fallidos · ${c.randomIgnored} sin atender (pueden restar hasta ${RANDOM_POINTS_CAP})` },
    { key: 'budget', label: '💲 Eficiencia del presupuesto', value: Math.min(1, budgetLeft / (0.25 * level.budget)) * 10, max: 10,
      detail: `Te sobraron $${fmt(budgetLeft)} M de $${fmt(level.budget)} M` }
  ];
  const score = clamp(Math.round(breakdown.reduce((acc, b) => acc + b.value, 0)), 0, 100);
  return { score, breakdown, science, mainOk, mainTotal };
}

export function computeReport(s) {
  const level = s.level;
  const { score, breakdown, science, mainOk, mainTotal } = computeScore(s);
  const fraction = sentFraction(s);
  const aborted = s.outcome === 'aborted';
  const grade = aborted ? 'F' : GRADE_THRESHOLDS.find(t => score >= t.min).grade;
  const goalMet = science >= level.scienceGoal;

  let title;
  let subtitle;
  if (aborted) {
    title = 'Misión abortada';
    subtitle = `La integridad de la nave llegó a 0 a los ${fmtTime(s.abortedAt)}. La tripulación tuvo que regresar a la Tierra.`;
  } else if (goalMet && mainOk === mainTotal && grade <= 'B') {
    title = 'Misión cumplida';
    subtitle = 'La tripulación completó todos los objetivos y los científicos están felices con los datos.';
  } else if (goalMet || mainOk >= mainTotal / 2) {
    title = 'Misión cumplida con problemas';
    subtitle = `Se cumplieron ${mainOk} de ${mainTotal} objetivos principales${goalMet ? ' y la meta científica' : ''}, pero hubo tropiezos.`;
  } else {
    title = 'Misión incompleta';
    subtitle = 'La tripulación regresó a salvo, pero la mayoría de los objetivos no se cumplió.';
  }

  return {
    score, grade, title, subtitle, aborted, goalMet, science, fraction, breakdown, mainOk, mainTotal,
    objectives: s.script.map(step => ({ name: step.def.name, icon: step.def.icon, at: step.at, status: step.status })),
    causes: buildCauses(s, science, fraction),
    strengths: buildStrengths(s, fraction),
    tips: topHints(s, 4)
  };
}

function buildCauses(s, science, fraction) {
  const causes = [];
  const st = s.stats;
  for (const step of s.script) {
    if (step.status === 'fail') causes.push(`Fallaste el objetivo principal "${step.def.name}".`);
    else if (step.status === 'ignored') causes.push(`Nadie atendió el objetivo principal "${step.def.name}".`);
    else if (step.status === 'upcoming') causes.push(`No llegaste al objetivo "${step.def.name}" porque la misión terminó antes.`);
    else if (step.status === 'active') causes.push(`El objetivo "${step.def.name}" seguía sin resolverse cuando terminó la misión.`);
  }
  const damage = Object.entries(s.counters.damageBy)
    .filter(([, v]) => v >= 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  for (const [name, amount] of damage) {
    causes.push(`"${name}" le quitó ${fmt(amount)} puntos de integridad a la nave.`);
  }
  if (fraction < 0.9) {
    causes.push(`Solo llegó a la Tierra el ${Math.round(fraction * 100)} % de los datos. Tus instrumentos generan ${fmt(st.dataRate, 1)} unidades/s y tu antena envía ${fmt(st.sendRate, 1)}/s desde ${s.level.destinationName}. Una mejor antena o menos instrumentos lo resolvería.`);
  }
  if (s.counters.powerOutSec > 2) {
    causes.push(`Pasaste ${fmt(s.counters.powerOutSec)} s sin energía: sin energía no hay ciencia y la nave se daña. Considera paneles más potentes o mejores baterías.`);
  }
  if (s.counters.lifeOutSec > 2) {
    causes.push(`El soporte vital se agotó durante ${fmt(s.counters.lifeOutSec)} s. Un sistema con más capacidad o regenerativo dura más.`);
  }
  if (science < s.level.scienceGoal) {
    causes.push(`Te faltaron ${fmt(s.level.scienceGoal - science)} puntos de ciencia. Más instrumentos, una mejor antena o aprovechar los eventos científicos te habrían acercado a la meta.`);
  }
  if (s.points < 0) {
    causes.push(`Los imprevistos te restaron ${fmt(-s.points)} puntos: ignorar o fallar problemas resta, resolverlos suma.`);
  }
  return causes;
}

function buildStrengths(s, fraction) {
  const out = [];
  const c = s.counters;
  const total = c.success + c.fail + c.ignored;
  if (s.script.length && s.script.every(x => x.status === 'success')) out.push('Cumpliste todos los objetivos principales de la misión.');
  if (total > 0 && c.success / total >= 0.7) out.push('Asignaste bien a tu tripulación: la mayoría de los eventos se resolvió con éxito.');
  if (s.points >= 8) out.push(`Manejaste muy bien los imprevistos (${signed(s.points)} pts).`);
  if (fraction >= 0.95) out.push('Tus comunicaciones fueron suficientes: casi todos los datos llegaron a la Tierra.');
  if (s.integrity >= 80) out.push('La nave terminó en muy buen estado.');
  if (s.stats.budgetLeft >= 0.2 * s.level.budget) out.push('Fuiste eficiente con el presupuesto.');
  if (c.powerOutSec === 0) out.push('Nunca te quedaste sin energía.');
  return out;
}

function topHints(s, n) {
  return Object.entries(s.counters.hints)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([h]) => h);
}
