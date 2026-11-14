// Pure SVG drawing of the ship, built from its installed components. No DOM here:
// it returns strings, so the design view can inject the SVG and the mission map can
// draw the same picture on its canvas as an image. Every component is drawn as its
// own <g class="part" data-cat data-id> so the design view can animate/highlight it.
export const SHIP_VB = { w: 280, h: 180 };
const CY = 88;
const INK = '#0f172a';

const PROP_GEOMETRY = {
  1: { bellW: 16, bellH: 22, smW: 40, smH: 40 },
  2: { bellW: 22, bellH: 32, smW: 52, smH: 46 },
  3: { bellW: 28, bellH: 42, smW: 62, smH: 52 }
};

function part(cat, comp, body, highlight, extraCls = '') {
  const isNew = highlight && (highlight.has(comp ? comp.id : `@${cat}`));
  return `<g class="part${isNew ? ' part-new' : ''}${extraCls}" data-cat="${cat}" data-id="${comp ? comp.id : ''}">${body}</g>`;
}

export function buildShipArt(comps, opts = {}) {
  const { crewCount = 0, highlight = null } = opts;
  const by = cat => comps.find(c => c.category === cat) || null;
  const structure = by('structure');
  const propulsion = by('propulsion');
  const power = by('power');
  const battery = by('battery');
  const life = by('life_support');
  const comms = by('comms');
  const computer = by('computer');
  const attitude = by('attitude');
  const shielding = by('shielding');
  const instruments = comps.filter(c => c.category === 'instruments');
  const anchors = {};
  const out = [];

  // ---------- Geometry ----------
  const lvl = Math.max(1, Math.min(3, propulsion?.propulsion || 1));
  const P = PROP_GEOMETRY[lvl];
  const bellX = 10;
  const smX = bellX + P.bellW;
  const S = smX + P.smW;               // structure start
  const smTop = CY - P.smH / 2;
  const smBot = CY + P.smH / 2;
  const sArt = structure?.art || 'capsule';
  const habW = sArt === 'habitat' ? 56 : 0;
  const habH = 64;
  const cabW = 50;
  const cabH = 50;
  const noseW = 26;
  const C = S + habW;                  // cabin start
  const N = C + cabW;                  // nose start
  const tipX = N + noseW;
  const bodyH = habW ? habH : cabH;
  const top = CY - bodyH / 2;
  const bottom = CY + bodyH / 2;
  const mastX = smX + P.smW / 2;

  // ---------- Power (behind everything) ----------
  {
    const art = power?.art || 'panels-small';
    let b = '';
    if (art === 'rtg') {
      const bx = smX + P.smW * 0.4 - 14;
      const by2 = smBot + 16;
      b += `<line x1="${smX + P.smW * 0.4}" y1="${smBot}" x2="${bx}" y2="${by2}" stroke="#94a3b8" stroke-width="2.5"/>`;
      for (let i = 0; i < 4; i++) {
        const fy = by2 + 5 + i * 5.5;
        b += `<line x1="${bx - 11}" y1="${fy}" x2="${bx + 11}" y2="${fy}" stroke="#a1a1aa" stroke-width="2"/>`;
      }
      b += `<rect x="${bx - 6}" y="${by2}" width="12" height="28" rx="3" fill="#52525b" stroke="${INK}" stroke-width="1.5"/>`;
      b += `<circle cx="${bx}" cy="${by2 + 14}" r="5" fill="#f97316" opacity=".5"/><circle cx="${bx}" cy="${by2 + 14}" r="2.6" fill="#ef4444"/>`;
      anchors.power = { x: bx, y: by2 + 14 };
    } else {
      const large = art === 'panels-large';
      const pw = large ? 30 : 24;
      const ph = large ? 50 : 34;
      const cols = large ? 3 : 2;
      const rows = large ? 5 : 3;
      const fill = large ? '#1e3a8a' : '#1d4ed8';
      const frame = large ? '#facc15' : '#93c5fd';
      const panel = (y0) => {
        let s = `<rect x="${mastX - pw / 2}" y="${y0}" width="${pw}" height="${ph}" fill="${fill}" stroke="${frame}" stroke-width="1.5"/>`;
        for (let c = 1; c < cols; c++) s += `<line x1="${mastX - pw / 2 + (pw / cols) * c}" y1="${y0}" x2="${mastX - pw / 2 + (pw / cols) * c}" y2="${y0 + ph}" stroke="${frame}" stroke-width=".8" opacity=".7"/>`;
        for (let r = 1; r < rows; r++) s += `<line x1="${mastX - pw / 2}" y1="${y0 + (ph / rows) * r}" x2="${mastX + pw / 2}" y2="${y0 + (ph / rows) * r}" stroke="${frame}" stroke-width=".8" opacity=".7"/>`;
        return s;
      };
      b += `<line x1="${mastX}" y1="${smTop}" x2="${mastX}" y2="${smTop - 6}" stroke="#94a3b8" stroke-width="2.5"/>`;
      b += `<line x1="${mastX}" y1="${smBot}" x2="${mastX}" y2="${smBot + 6}" stroke="#94a3b8" stroke-width="2.5"/>`;
      b += panel(smTop - 6 - ph) + panel(smBot + 6);
      anchors.power = { x: mastX, y: smTop - 6 - ph / 2 };
    }
    out.push(part('power', power, b, highlight));
  }

  // ---------- Propulsion: engine bell + service module ----------
  {
    let b = `<polygon points="${smX},${CY - 8} ${smX},${CY + 8} ${bellX},${CY + P.bellH / 2} ${bellX},${CY - P.bellH / 2}" fill="${lvl === 3 ? '#94a3b8' : '#64748b'}" stroke="${INK}" stroke-width="1.5"/>`;
    b += `<line x1="${bellX + 3}" y1="${CY - P.bellH / 2 + 3}" x2="${bellX + 3}" y2="${CY + P.bellH / 2 - 3}" stroke="#cbd5e1" stroke-width="1"/>`;
    const smFill = lvl === 3 ? '#ea580c' : lvl === 2 ? '#e2e8f0' : '#cbd5e1';
    b += `<rect x="${smX}" y="${smTop}" width="${P.smW}" height="${P.smH}" rx="4" fill="${smFill}" stroke="${INK}" stroke-width="1.5"/>`;
    if (lvl === 2) {
      for (const f of [0.55, 0.8]) b += `<rect x="${smX + P.smW * f - 2}" y="${smTop}" width="4" height="${P.smH}" fill="#475569"/>`;
    }
    if (lvl === 3) {
      for (let i = 2; i <= 4; i++) b += `<line x1="${smX + (P.smW / 5) * i}" y1="${smTop + 3}" x2="${smX + (P.smW / 5) * i}" y2="${smBot - 3}" stroke="#fdba74" stroke-width="1.5"/>`;
      b += `<rect x="${S - 6}" y="${smTop}" width="6" height="${P.smH}" fill="#9a3412"/>`;
    }
    anchors.propulsion = { x: bellX + P.bellW / 2 + 4, y: CY };
    out.push(part('propulsion', propulsion, b, highlight));
  }

  // ---------- Structure ----------
  {
    const palette = {
      capsule: { fill: '#f1f5f9', line: '#94a3b8' },
      composite: { fill: '#334155', line: '#64748b' },
      habitat: { fill: '#e2e8f0', line: '#94a3b8' }
    }[sArt] || { fill: '#f1f5f9', line: '#94a3b8' };
    let b = '';
    if (habW) {
      b += `<rect x="${S}" y="${CY - habH / 2}" width="${habW + 4}" height="${habH}" rx="6" fill="${palette.fill}" stroke="${INK}" stroke-width="1.5"/>`;
      for (const dx of [14, 28, 42]) b += `<line x1="${S + dx}" y1="${CY - habH / 2 + 2}" x2="${S + dx}" y2="${CY + habH / 2 - 2}" stroke="${palette.line}" stroke-width="1.2"/>`;
    }
    b += `<rect x="${C}" y="${CY - cabH / 2}" width="${cabW + 2}" height="${cabH}" rx="4" fill="${palette.fill}" stroke="${INK}" stroke-width="1.5"/>`;
    b += `<path d="M ${N} ${CY - cabH / 2} L ${tipX - 4} ${CY - 9} Q ${tipX} ${CY} ${tipX - 4} ${CY + 9} L ${N} ${CY + cabH / 2} Z" fill="${palette.fill}" stroke="${INK}" stroke-width="1.5"/>`;
    b += `<rect x="${tipX - 3}" y="${CY - 6}" width="4" height="12" rx="1" fill="#94a3b8" stroke="${INK}"/>`;
    if (sArt === 'composite') {
      for (let i = 0; i < 5; i++) b += `<line x1="${C + 4 + i * 9}" y1="${CY - cabH / 2 + 3}" x2="${C + 10 + i * 9}" y2="${CY + cabH / 2 - 3}" stroke="${palette.line}" stroke-width="1" opacity=".8"/>`;
    }
    anchors.structure = { x: C + cabW / 2, y: CY + 2 };
    out.push(part('structure', structure, b, highlight));
  }

  // ---------- Shielding (over the hull) ----------
  if (shielding) {
    const lv = shielding.shielding || 1;
    const x0 = S;
    const w = N - S;
    let b = '';
    if (lv === 1 || lv >= 3) {
      b += `<rect x="${x0}" y="${top}" width="${w + 2}" height="${bodyH}" rx="5" fill="#eab308" opacity=".5"/>`;
      b += `<path d="M ${N} ${CY - cabH / 2} L ${tipX - 4} ${CY - 9} L ${tipX - 4} ${CY + 9} L ${N} ${CY + cabH / 2} Z" fill="#eab308" opacity=".45"/>`;
      let zig = `M ${x0 + 3} ${CY + bodyH / 2 - 6}`;
      for (let x = x0 + 9; x < N; x += 6) zig += ` L ${x} ${CY + bodyH / 2 - (((x - x0) / 6) % 2 ? 10 : 5)}`;
      b += `<path d="${zig}" fill="none" stroke="#fde68a" stroke-width="1"/>`;
    }
    if (lv >= 2) {
      b += `<rect x="${x0 - 1}" y="${top - 4}" width="${w + 4}" height="6" rx="2" fill="#475569" stroke="${INK}"/>`;
      b += `<rect x="${x0 - 1}" y="${bottom - 2}" width="${w + 4}" height="6" rx="2" fill="#475569" stroke="${INK}"/>`;
      for (let x = x0 + 12; x < N; x += 14) {
        b += `<line x1="${x}" y1="${top - 4}" x2="${x}" y2="${top + 2}" stroke="${INK}"/><line x1="${x}" y1="${bottom - 2}" x2="${x}" y2="${bottom + 4}" stroke="${INK}"/>`;
      }
    }
    if (lv >= 3) {
      b += `<rect x="${x0 - 6}" y="${top - 9}" width="${tipX - x0 + 8}" height="${bodyH + 18}" rx="12" fill="none" stroke="#cbd5e1" stroke-width="1.2" stroke-dasharray="4 3"/>`;
    }
    anchors.shielding = { x: (S + N) / 2, y: top + 4 };
    out.push(part('shielding', shielding, b, highlight));
  } else {
    anchors.shielding = anchors.structure;
  }

  // ---------- Crew windows (one per seat, helmet if occupied) ----------
  {
    const seats = structure?.crewMax || 3;
    const cabSeats = Math.min(3, seats);
    const habSeats = habW ? seats - cabSeats : 0;
    const spots = [];
    for (let i = 0; i < cabSeats; i++) spots.push({ x: C + 11 + i * 14, y: CY - 11 });
    for (let i = 0; i < habSeats; i++) spots.push({ x: S + 14 + i * 20, y: CY - 14 });
    let b = '';
    spots.forEach((p, i) => {
      b += `<circle cx="${p.x}" cy="${p.y}" r="6" fill="#0b2545" stroke="#94a3b8" stroke-width="1.5"/>`;
      if (i < crewCount) {
        b += `<circle cx="${p.x}" cy="${p.y}" r="4.3" fill="#f8fafc"/><ellipse cx="${p.x + 0.6}" cy="${p.y - 0.3}" rx="2.7" ry="1.9" fill="#f59e0b"/>`;
      }
    });
    out.push(part('crew', null, b, highlight));
  }

  // ---------- Battery (on the service module) ----------
  {
    const adv = battery?.art === 'advanced' || (battery?.batteryMult || 1) > 1;
    const bx = smX + 5;
    const by2 = CY - 9;
    let b = `<rect x="${bx}" y="${by2}" width="13" height="18" rx="2" fill="${adv ? '#15803d' : '#334155'}" stroke="${INK}" stroke-width="1.2"/>`;
    b += `<rect x="${bx + 4}" y="${by2 - 2}" width="5" height="2" fill="${INK}"/>`;
    if (adv) b += `<path d="M ${bx + 7.5} ${by2 + 3} L ${bx + 4} ${by2 + 10} L ${bx + 7} ${by2 + 10} L ${bx + 5.5} ${by2 + 15} L ${bx + 9.5} ${by2 + 7.5} L ${bx + 6.5} ${by2 + 7.5} Z" fill="#fde047"/>`;
    else for (let i = 1; i <= 3; i++) b += `<line x1="${bx + 2}" y1="${by2 + i * 4.5}" x2="${bx + 11}" y2="${by2 + i * 4.5}" stroke="#94a3b8"/>`;
    anchors.battery = { x: bx + 6.5, y: CY };
    out.push(part('battery', battery, b, highlight));
  }

  // ---------- Life support (tanks on top of the hull) ----------
  {
    const cap = life?.lifeSupport || 2;
    const regen = (life?.drainMult || 1) < 1;
    const tanks = cap >= 4 ? 2 : 1;
    const x = S + 4;
    let b = '';
    for (let i = 0; i < tanks; i++) {
      const y = top - 10 * (i + 1);
      b += `<rect x="${x}" y="${y}" width="22" height="9" rx="4.5" fill="#f8fafc" stroke="${INK}" stroke-width="1.2"/>`;
      b += `<rect x="${x + 9}" y="${y}" width="4" height="9" fill="#38bdf8"/>`;
    }
    if (regen) {
      b += `<rect x="${x + 25}" y="${top - 15}" width="16" height="15" rx="2" fill="#14532d" stroke="${INK}" stroke-width="1.2"/>`;
      b += `<ellipse cx="${x + 33}" cy="${top - 7.5}" rx="5" ry="3" fill="#4ade80" transform="rotate(-30 ${x + 33} ${top - 7.5})"/>`;
    }
    anchors.life_support = { x: x + 11, y: top - 5 * tanks };
    out.push(part('life_support', life, b, highlight));
  }

  // ---------- Computer (panel on the cabin) ----------
  {
    const triple = computer?.art === 'triple';
    const n = triple ? 3 : 1;
    let b = '';
    for (let i = 0; i < n; i++) {
      const x = C + 6 + i * 11;
      b += `<rect x="${x}" y="${CY + 6}" width="${triple ? 9 : 12}" height="11" rx="1.5" fill="#1e293b" stroke="#64748b"/>`;
      b += `<circle cx="${x + 3}" cy="${CY + 9.5}" r="1.5" fill="#4ade80"/><circle cx="${x + 6.5}" cy="${CY + 9.5}" r="1.5" fill="#38bdf8"/>`;
    }
    anchors.computer = { x: C + 6 + (triple ? 15 : 6), y: CY + 11 };
    out.push(part('computer', computer, b, highlight));
  }

  // ---------- Attitude control (on the nose) ----------
  {
    let b = '';
    if (attitude?.art === 'rcs') {
      for (const sy of [-1, 1]) {
        const y = CY + sy * 19;
        b += `<rect x="${N + 6}" y="${y - 2.5}" width="6" height="5" fill="#94a3b8" stroke="${INK}"/>`;
        b += `<line x1="${N + 9}" y1="${y + sy * 2.5}" x2="${N + 9}" y2="${y + sy * 6}" stroke="#cbd5e1" stroke-width="1.5"/>`;
      }
      b += `<rect x="${N + 12}" y="${CY - 4}" width="8" height="8" rx="1.5" fill="#1e293b" stroke="#94a3b8"/><circle cx="${N + 16}" cy="${CY}" r="2.2" fill="#38bdf8"/>`;
    } else {
      b += `<circle cx="${N + 11}" cy="${CY}" r="5.5" fill="#475569" stroke="#cbd5e1" stroke-width="1.2"/>`;
      b += `<line x1="${N + 7}" y1="${CY}" x2="${N + 15}" y2="${CY}" stroke="#cbd5e1"/><line x1="${N + 11}" y1="${CY - 4}" x2="${N + 11}" y2="${CY + 4}" stroke="#cbd5e1"/>`;
    }
    anchors.attitude = { x: N + 12, y: CY };
    out.push(part('attitude', attitude, b, highlight));
  }

  // ---------- Comms (on the nose, top) ----------
  {
    const art = comms?.art || 'omni';
    const bx = N + 5;
    const by2 = CY - cabH / 2 + 3;
    let b = '';
    if (art === 'dish') {
      b += `<line x1="${bx}" y1="${by2}" x2="${bx}" y2="${by2 - 10}" stroke="#94a3b8" stroke-width="2"/>`;
      b += `<path d="M ${bx - 15} ${by2 - 20} Q ${bx} ${by2 - 2} ${bx + 15} ${by2 - 20} Z" fill="#e5e7eb" stroke="${INK}" stroke-width="1.2"/>`;
      b += `<line x1="${bx}" y1="${by2 - 11}" x2="${bx}" y2="${by2 - 24}" stroke="#64748b" stroke-width="1.2"/><circle cx="${bx}" cy="${by2 - 25}" r="2" fill="#64748b"/>`;
      anchors.comms = { x: bx, y: by2 - 15 };
    } else if (art === 'laser') {
      b += `<line x1="${bx + 30}" y1="${by2 - 40}" x2="${bx + 70}" y2="${by2 - 70}" stroke="#4ade80" stroke-width="1.5" stroke-dasharray="4 3" opacity=".85"/>`;
      b += `<line x1="${bx}" y1="${by2}" x2="${bx}" y2="${by2 - 8}" stroke="#94a3b8" stroke-width="2"/>`;
      b += `<g transform="rotate(50 ${bx} ${by2 - 14})"><rect x="${bx - 5}" y="${by2 - 22}" width="10" height="16" rx="2" fill="#1f2937" stroke="#94a3b8"/><circle cx="${bx}" cy="${by2 - 20}" r="2.8" fill="#4ade80"/></g>`;
      anchors.comms = { x: bx, y: by2 - 14 };
    } else {
      b += `<line x1="${bx}" y1="${by2}" x2="${bx}" y2="${by2 - 24}" stroke="#cbd5e1" stroke-width="1.5"/><circle cx="${bx}" cy="${by2 - 25}" r="2.8" fill="#f8fafc" stroke="${INK}"/>`;
      anchors.comms = { x: bx, y: by2 - 14 };
    }
    out.push(part('comms', comms, b, highlight));
  }

  // ---------- Instruments (bay under the hull) ----------
  {
    const iy = bottom + 3;
    const ix = S + 4;
    if (!instruments.length) {
      out.push(`<g class="part ghost" data-cat="instruments"><rect x="${ix}" y="${iy + 3}" width="70" height="16" rx="3" fill="none" stroke="#64748b" stroke-dasharray="3 3"/><text x="${ix + 35}" y="${iy + 14}" font-size="7.5" fill="#94a3b8" text-anchor="middle" font-family="sans-serif">sin instrumentos</text></g>`);
      anchors.instruments = { x: ix + 35, y: iy + 11 };
    } else {
      out.push(`<line x1="${S + 2}" y1="${iy + 1}" x2="${ix + instruments.length * 24}" y2="${iy + 1}" stroke="#94a3b8" stroke-width="2"/>`);
      instruments.forEach((c, i) => {
        const x = ix + i * 24;
        let b = `<line x1="${x + 11}" y1="${iy + 1}" x2="${x + 11}" y2="${iy + 4}" stroke="#94a3b8" stroke-width="1.5"/>`;
        switch (c.art) {
          case 'spectro':
            b += `<rect x="${x + 3}" y="${iy + 4}" width="16" height="13" rx="1.5" fill="#475569" stroke="${INK}"/>`;
            ['#ef4444', '#facc15', '#22c55e', '#3b82f6'].forEach((col, k) => {
              b += `<line x1="${x + 5}" y1="${iy + 7 + k * 2.6}" x2="${x + 17}" y2="${iy + 7 + k * 2.6}" stroke="${col}" stroke-width="1.4"/>`;
            });
            break;
          case 'radar':
            b += `<rect x="${x + 6}" y="${iy + 4}" width="10" height="8" rx="1.5" fill="#64748b" stroke="${INK}"/>`;
            b += `<line x1="${x + 11}" y1="${iy + 12}" x2="${x + 30}" y2="${iy + 30}" stroke="#e2e8f0" stroke-width="1.6"/>`;
            for (let k = 1; k <= 3; k++) {
              const px = x + 11 + k * 5;
              const py = iy + 12 + k * 5;
              b += `<line x1="${px - 3}" y1="${py + 3}" x2="${px + 3}" y2="${py - 3}" stroke="#e2e8f0" stroke-width="1.2"/>`;
            }
            break;
          case 'drill':
            b += `<rect x="${x + 5}" y="${iy + 4}" width="12" height="6" rx="1.5" fill="#78716c" stroke="${INK}"/>`;
            b += `<polyline points="${x + 11},${iy + 10} ${x + 17},${iy + 18} ${x + 11},${iy + 25}" fill="none" stroke="#a3a3a3" stroke-width="2.5"/>`;
            b += `<polygon points="${x + 8},${iy + 25} ${x + 14},${iy + 25} ${x + 11},${iy + 34}" fill="#ca8a04" stroke="${INK}" stroke-width=".8"/>`;
            break;
          case 'lab':
            b += `<rect x="${x + 2}" y="${iy + 4}" width="18" height="15" rx="2" fill="#e2e8f0" stroke="${INK}"/>`;
            b += `<rect x="${x + 5}" y="${iy + 7}" width="12" height="9" rx="1" fill="#166534"/>`;
            b += `<ellipse cx="${x + 11}" cy="${iy + 11.5}" rx="4" ry="2.3" fill="#4ade80" transform="rotate(-25 ${x + 11} ${iy + 11.5})"/>`;
            break;
          case 'radiation':
            b += `<rect x="${x + 5}" y="${iy + 4}" width="12" height="12" rx="1.5" fill="#facc15" stroke="${INK}"/>`;
            b += `<circle cx="${x + 11}" cy="${iy + 10}" r="1.5" fill="#1f2937"/>`;
            for (let k = 0; k < 3; k++) {
              const a = -Math.PI / 2 + k * (Math.PI * 2 / 3);
              b += `<circle cx="${(x + 11 + Math.cos(a) * 3.6).toFixed(1)}" cy="${(iy + 10 + Math.sin(a) * 3.6).toFixed(1)}" r="1.7" fill="#1f2937"/>`;
            }
            break;
          default: // camera
            b += `<rect x="${x + 3}" y="${iy + 4}" width="16" height="12" rx="1.5" fill="#334155" stroke="${INK}"/>`;
            b += `<circle cx="${x + 11}" cy="${iy + 10}" r="4" fill="#0ea5e9" stroke="#e2e8f0"/><circle cx="${x + 9.6}" cy="${iy + 8.6}" r="1" fill="#fff"/>`;
        }
        out.push(part('instruments', c, b, highlight));
      });
      anchors.instruments = { x: ix + instruments.length * 12, y: iy + 11 };
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SHIP_VB.w} ${SHIP_VB.h}" width="${SHIP_VB.w}" height="${SHIP_VB.h}"><g stroke-linejoin="round" stroke-linecap="round">${out.join('')}</g></svg>`;
  return { svg, anchors };
}

// Small rocket silhouette whose size follows its lift capacity.
export function buildRocketArt(rocket) {
  if (!rocket) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 130" width="60" height="130"><rect x="22" y="40" width="16" height="80" rx="3" fill="none" stroke="#64748b" stroke-dasharray="4 3"/><text x="30" y="84" font-size="9" fill="#94a3b8" text-anchor="middle" font-family="sans-serif">?</text></svg>`;
  }
  const cap = rocket.capacityKg.LEO || 8000;
  const h = Math.round(40 + 20 * Math.log2(cap / 8000));
  const w = cap >= 100000 ? 16 : cap >= 40000 ? 13 : 10;
  const boosters = cap >= 40000;
  const base = 124;
  const cx = 30;
  const topY = base - h;
  let b = '';
  if (boosters) {
    const bh = h * 0.55;
    for (const side of [-1, 1]) {
      const bx = cx + side * (w / 2 + 4) - 3;
      b += `<rect x="${bx}" y="${base - bh}" width="6" height="${bh}" rx="1" fill="#e2e8f0" stroke="${INK}"/>`;
      b += `<polygon points="${bx},${base - bh} ${bx + 6},${base - bh} ${bx + 3},${base - bh - 7}" fill="#e2e8f0" stroke="${INK}"/>`;
    }
  }
  b += `<rect x="${cx - w / 2}" y="${topY}" width="${w}" height="${h}" rx="1.5" fill="#f8fafc" stroke="${INK}" stroke-width="1.2"/>`;
  b += `<rect x="${cx - w / 2}" y="${topY + h * 0.35}" width="${w}" height="4" fill="${cap >= 100000 ? '#ea580c' : '#1e293b'}"/>`;
  b += `<polygon points="${cx - w / 2},${topY} ${cx + w / 2},${topY} ${cx},${topY - 14}" fill="#cbd5e1" stroke="${INK}" stroke-width="1.2"/>`;
  b += `<polygon points="${cx - w / 2},${base - 14} ${cx - w / 2 - 7},${base} ${cx - w / 2},${base}" fill="#64748b" stroke="${INK}"/>`;
  b += `<polygon points="${cx + w / 2},${base - 14} ${cx + w / 2 + 7},${base} ${cx + w / 2},${base}" fill="#64748b" stroke="${INK}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 130" width="60" height="130"><g stroke-linejoin="round">${b}</g></svg>`;
}
