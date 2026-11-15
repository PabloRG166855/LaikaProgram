// Pure scoring and cause analysis for the final report.
import { fmt, fmtTime } from './util.js';
import { creditedScience, sentFraction } from './missionEngine.js';

export const GRADE_THRESHOLDS = [
  { grade: 'A', min: 85 },
  { grade: 'B', min: 70 },
  { grade: 'C', min: 55 },
  { grade: 'D', min: 40 },
  { grade: 'F', min: 0 }
];

export function computeReport(s) {
  const level = s.level;
  const science = creditedScience(s);
  const fraction = sentFraction(s);
  const c = s.counters;
  const decisions = c.success + c.fail + c.ignored;

  const mainTotal = s.objectives.length;
  const mainDone = s.objectives.filter(o => o.status === 'success').length;

  const breakdown = [
    { label: 'Objetivos principales', value: mainTotal ? (mainDone / mainTotal) * 35 : 35, max: 35,
      detail: `${mainDone} de ${mainTotal} objetivos cumplidos` },
    { label: 'Ciencia obtenida', value: Math.min(1, science / level.scienceGoal) * 25, max: 25,
      detail: `${fmt(science)} de ${fmt(level.scienceGoal)} puntos de la meta` },
    { label: 'Integridad de la nave', value: (s.integrity / 100) * 15, max: 15,
      detail: `${fmt(s.integrity)} % al final` },
    { label: 'Eventos aleatorios', value: decisions ? (c.success / decisions) * 25 : 25, max: 25,
      detail: `${c.success} éxitos · ${c.fail} fallas · ${c.ignored} sin atender` }
  ];
  const score = Math.round(breakdown.reduce((acc, b) => acc + b.value, 0));
  const aborted = s.outcome === 'aborted';
  const grade = aborted ? 'F' : GRADE_THRESHOLDS.find(t => score >= t.min).grade;
  const goalMet = science >= level.scienceGoal;

  let title;
  let subtitle;
  if (aborted) {
    title = 'Misión abortada';
    subtitle = `La integridad de la nave llegó a 0 a los ${fmtTime(s.abortedAt)}. La tripulación tuvo que regresar a la Tierra.`;
  } else if (mainDone === mainTotal && goalMet) {
    title = 'Misión cumplida';
    subtitle = 'Se cumplieron todos los objetivos principales y se alcanzó la meta científica.';
  } else if (mainDone >= mainTotal / 2) {
    title = 'Misión cumplida parcialmente';
    subtitle = 'La tripulación regresó a salvo, pero no todo salió como se planeó.';
  } else {
    title = 'Misión fallida';
    subtitle = 'La tripulación regresó a salvo, pero la mayoría de los objetivos principales no se cumplieron.';
  }

  return {
    score, grade, title, subtitle, aborted, goalMet, science, fraction, breakdown,
    mainDone, mainTotal, points: s.points,
    causes: buildCauses(s, science, fraction),
    strengths: buildStrengths(s, fraction),
    tips: topHints(s, 4)
  };
}

function buildCauses(s, science, fraction) {
  const causes = [];
  const st = s.stats;
  const STATUS_TEXT = { fail: 'falló', ignored: 'nadie lo atendió', missed: 'no se alcanzó a completar' };
  for (const o of s.objectives) {
    if (STATUS_TEXT[o.status]) causes.push(`Objetivo principal "${o.def.name}": ${STATUS_TEXT[o.status]}.`);
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
  const ss = s.counters.statusSec;
  if (ss.blackout > 1) {
    causes.push(`Pasaste ${fmt(ss.blackout)} s en apagón: la consola estuvo bloqueada, nadie pudo trabajar y no hubo ciencia. Las fallas eléctricas sin resolver provocan apagones.`);
  }
  if (ss.commsDown > 1) {
    causes.push(`Estuviste ${fmt(ss.commsDown)} s sin comunicaciones: los datos de ese tiempo nunca llegaron a la Tierra.`);
  }
  if (ss.sensorsDown > 1) {
    causes.push(`Los sensores estuvieron degradados ${fmt(ss.sensorsDown)} s: en ese tiempo no se generó ciencia.`);
  }
  if (s.counters.crewOutSec > 1) {
    causes.push(`Tus tripulantes pasaron ${fmt(s.counters.crewOutSec)} s fuera de servicio en total (emergencias médicas, conflictos, accidentes).`);
  }
  if (s.counters.exhaustedTasks > 0) {
    causes.push(`Asignaste ${s.counters.exhaustedTasks} tarea(s) a tripulantes agotados (fatiga ≥ 80 %): trabajan 50 % más lento. La Calma alta reduce la fatiga.`);
  }
  if (s.counters.lifeOutSec > 2) {
    causes.push(`El soporte vital se agotó durante ${fmt(s.counters.lifeOutSec)} s. Un sistema con más capacidad o regenerativo dura más.`);
  }
  if (science < s.level.scienceGoal) {
    causes.push(`Te faltaron ${fmt(s.level.scienceGoal - science)} puntos de ciencia. Más instrumentos, una mejor antena o aprovechar los eventos científicos te habrían acercado a la meta.`);
  }
  if (s.counters.ignored > 0) {
    causes.push(`Dejaste ${s.counters.ignored} evento(s) sin atender. Ignorar un problema casi siempre es peor que intentarlo y fallar.`);
  }
  return causes;
}

function buildStrengths(s, fraction) {
  const out = [];
  const c = s.counters;
  const total = c.success + c.fail + c.ignored;
  if (total > 0 && c.success / total >= 0.7) out.push('Asignaste bien a tu tripulación: la mayoría de los eventos se resolvió con éxito.');
  if (fraction >= 0.95) out.push('Tus comunicaciones fueron suficientes: casi todos los datos llegaron a la Tierra.');
  if (s.integrity >= 80) out.push('La nave terminó en muy buen estado.');
  if (c.powerOutSec === 0) out.push('Nunca te quedaste sin energía.');
  return out;
}

function topHints(s, n) {
  return Object.entries(s.counters.hints)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([h]) => h);
}
