export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

export const indexById = arr => Object.fromEntries(arr.map(x => [x.id, x]));

export function weightedPick(items, weightFn, rng = Math.random) {
  const total = items.reduce((sum, it) => sum + weightFn(it), 0);
  if (total <= 0) return null;
  let r = rng() * total;
  for (const it of items) {
    r -= weightFn(it);
    if (r <= 0) return it;
  }
  return items[items.length - 1];
}

export const randRange = ([min, max], rng = Math.random) => min + rng() * (max - min);

export const fmt = (n, decimals = 0) =>
  Number(n).toLocaleString('es-MX', { maximumFractionDigits: decimals, minimumFractionDigits: decimals });

export const fmtTime = seconds => {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

export const signed = n => (n > 0 ? `+${n}` : `${n}`);

export const STAT_NAMES = { tech: 'Técnica', analysis: 'Análisis', speed: 'Rapidez', calm: 'Calma' };
export const STAT_SHORT = { tech: 'TEC', analysis: 'ANA', speed: 'RAP', calm: 'CAL' };

export const EFFECT_LABELS = {
  integrity: 'Integridad',
  power: 'Energía',
  life: 'Soporte vital',
  science: 'Ciencia',
  data: 'Datos',
  fatigueAll: 'Fatiga del equipo',
  blackout: '⚫ Apagón (consola bloqueada)',
  commsDown: '📡 Sin comunicaciones',
  sensorsDown: '🔬 Sensores degradados',
  crewOut: '🤕 Fuera de servicio'
};

export const TIMED_EFFECTS = ['blackout', 'commsDown', 'sensorsDown', 'crewOut'];

export function effectsText(effects) {
  return effects
    .filter(e => e.value !== 0)
    .map(e => {
      const label = EFFECT_LABELS[e.key] || e.key;
      if (TIMED_EFFECTS.includes(e.key)) return `${label}${e.who ? `: ${e.who}` : ''} ${Math.round(e.value)} s`;
      return `${label} ${signed(Math.round(e.value))}`;
    })
    .join(' · ');
}
