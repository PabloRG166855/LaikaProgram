// Draws the spacecraft from its installed components. Side view, nose pointing right.
// Every component has its own look so the player SEES what they install.
// Returns anchor points (screen coords) for each ship part, used to place events on the ship.

export function shipModel(components) {
  const sel = {};
  const instruments = [];
  for (const c of components) {
    if (c.category === 'instruments') instruments.push(c.id);
    else sel[c.category] = c.id;
  }
  return { sel, instruments };
}

export const CATEGORY_ANCHOR = {
  structure: 'hull', propulsion: 'engine', power: 'power', battery: 'battery', life_support: 'life_support',
  comms: 'comms', computer: 'computer', attitude: 'attitude', shielding: 'hull', instruments: 'instruments'
};

function layout(model) {
  const s = model.sel;
  const large = s.structure === 'str_large';
  const tailX = large ? -104 : -44;
  const stageLen = s.propulsion === 'prop_advanced' ? 46 : s.propulsion === 'prop_medium' ? 30 : 0;
  const nozzleLen = s.propulsion === 'prop_advanced' ? 22 : s.propulsion === 'prop_medium' ? 16 : s.propulsion ? 12 : 0;
  const panelH = s.power === 'pwr_high' ? 52 : s.power === 'pwr_basic' ? 26 : 0;
  const minX = tailX - stageLen - nozzleLen - 18;
  const maxX = 44;
  const minY = -Math.max(46, panelH ? 28 + panelH : 0) - 4;
  const maxY = Math.max(50, panelH ? 28 + panelH : 0) + 4;
  const boomX = large ? -70 : -36;
  return { large, tailX, stageLen, nozzleLen, panelH, minX, maxX, minY, maxY, boomX };
}

export function shipSize(model) {
  const L = layout(model);
  return { w: L.maxX - L.minX, h: L.maxY - L.minY };
}

const bottomY = x => (x < 0 ? 20 : 22 - (Math.min(x, 34) / 34) * 12);

function rect(ctx, x, y, w, h, fill, stroke, lw = 1) {
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lw;
    ctx.strokeRect(x, y, w, h);
  }
}

function line(ctx, x1, y1, x2, y2, color, lw = 1.5) {
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function circle(ctx, x, y, r, fill, stroke) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
}

function poly(ctx, pts, fill, stroke) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
}

function solarPanel(ctx, x, y, w, h, high) {
  rect(ctx, x, y, w, h, high ? '#1d4ed8' : '#334155', high ? '#93c5fd' : '#64748b');
  ctx.strokeStyle = high ? 'rgba(191,219,254,.6)' : 'rgba(148,163,184,.5)';
  ctx.lineWidth = 0.6;
  const cols = high ? 3 : 2;
  const rows = Math.round(h / 7);
  for (let i = 1; i < cols; i++) line(ctx, x + (w / cols) * i, y, x + (w / cols) * i, y + h, ctx.strokeStyle, 0.6);
  for (let j = 1; j < rows; j++) line(ctx, x, y + (h / rows) * j, x + w, y + (h / rows) * j, ctx.strokeStyle, 0.6);
}

function drawInstrument(ctx, id, ix, by) {
  switch (id) {
    case 'ins_camera':
      line(ctx, ix, by, ix, by + 4, '#94a3b8');
      circle(ctx, ix, by + 8, 4.5, '#1e3a8a', '#93c5fd');
      circle(ctx, ix - 1.4, by + 6.6, 1.2, '#e0f2fe');
      break;
    case 'ins_spectro':
      rect(ctx, ix - 5, by, 10, 8, '#e2e8f0', '#64748b');
      ['#ef4444', '#facc15', '#22c55e', '#3b82f6'].forEach((c, i) => rect(ctx, ix - 4 + i * 2, by + 3, 2, 3, c));
      break;
    case 'ins_radar':
      line(ctx, ix, by, ix, by + 7, '#94a3b8');
      rect(ctx, ix - 10, by + 7, 20, 3, '#f8fafc', '#64748b');
      break;
    case 'ins_geo':
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(ix, by); ctx.lineTo(ix + 5, by + 7); ctx.lineTo(ix + 1, by + 13); ctx.stroke();
      poly(ctx, [[ix - 2, by + 13], [ix + 4, by + 13], [ix + 1, by + 18]], '#f59e0b');
      break;
    case 'ins_bio':
      rect(ctx, ix - 5, by, 10, 9, '#15803d', '#86efac');
      circle(ctx, ix - 2, by + 3, 1, '#dcfce7'); circle(ctx, ix + 2, by + 5, 1, '#dcfce7'); circle(ctx, ix - 1, by + 7, 0.8, '#dcfce7');
      break;
    case 'ins_rad':
      rect(ctx, ix - 3.5, by, 7, 6, '#facc15', '#a16207');
      circle(ctx, ix, by + 3, 1.3, '#1f2937');
      break;
    default:
      rect(ctx, ix - 4, by, 8, 6, '#94a3b8');
  }
}

/**
 * @param ctx canvas 2d context
 * @param model from shipModel()
 * @param o { x, y, scale, time, crewCount, highlight: { anchor, alpha, color } | null, thrust }
 * @returns anchors in screen coordinates
 */
export function drawShip(ctx, model, o = {}) {
  const { x = 0, y = 0, scale = 1, time = 0, crewCount = 0, highlight = null, thrust = false } = o;
  const L = layout(model);
  const s = model.sel;
  const cx = (L.minX + L.maxX) / 2;
  const cy = (L.minY + L.maxY) / 2;
  const composite = s.structure === 'str_composite';
  const hull = composite ? '#475569' : '#d1d5db';
  const hullEdge = composite ? '#94a3b8' : '#6b7280';
  const service = composite ? '#334155' : '#a3aab5';
  const local = {};

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.translate(-cx, -cy);
  ctx.lineJoin = 'round';

  // ---- Solar panels (behind the body)
  if (s.power === 'pwr_basic' || s.power === 'pwr_high') {
    const high = s.power === 'pwr_high';
    const pw = high ? 30 : 22;
    const gap = 8;
    line(ctx, L.boomX, -20, L.boomX, -20 - gap, '#94a3b8', 2);
    line(ctx, L.boomX, 20, L.boomX, 20 + gap, '#94a3b8', 2);
    solarPanel(ctx, L.boomX - pw / 2, -20 - gap - L.panelH, pw, L.panelH, high);
    solarPanel(ctx, L.boomX - pw / 2, 20 + gap, pw, L.panelH, high);
    local.power = { x: L.boomX, y: -20 - gap - L.panelH / 2 };
  }

  // ---- Propulsion stage + nozzle
  let px = L.tailX;
  if (L.stageLen) {
    const adv = s.propulsion === 'prop_advanced';
    const th = adv ? 40 : 32;
    rect(ctx, px - L.stageLen, -th / 2, L.stageLen, th, adv ? '#f59e0b' : '#e5e7eb', adv ? '#b45309' : '#9ca3af');
    ctx.strokeStyle = adv ? 'rgba(255,255,255,.45)' : 'rgba(0,0,0,.15)';
    for (let i = 1; i < 4; i++) line(ctx, px - (L.stageLen / 4) * i, -th / 2, px - (L.stageLen / 4) * i, th / 2, ctx.strokeStyle, 1);
    px -= L.stageLen;
  }
  if (L.nozzleLen) {
    const n0 = s.propulsion === 'prop_advanced' ? 14 : s.propulsion === 'prop_medium' ? 10 : 8;
    const n1 = s.propulsion === 'prop_advanced' ? 32 : s.propulsion === 'prop_medium' ? 22 : 14;
    poly(ctx, [[px, -n0 / 2], [px, n0 / 2], [px - L.nozzleLen, n1 / 2], [px - L.nozzleLen, -n1 / 2]], '#475569', '#1f2937');
    if (thrust) {
      const flick = 10 + Math.sin(time * 40) * 3 + 8;
      poly(ctx, [[px - L.nozzleLen, -n1 / 2 + 2], [px - L.nozzleLen, n1 / 2 - 2], [px - L.nozzleLen - flick, 0]], 'rgba(251,146,60,.9)');
      poly(ctx, [[px - L.nozzleLen, -n1 / 4], [px - L.nozzleLen, n1 / 4], [px - L.nozzleLen - flick * 0.6, 0]], 'rgba(254,240,138,.95)');
    }
    local.engine = { x: px - L.nozzleLen / 2, y: 0 };
  }

  // ---- Habitat module (large structure)
  if (L.large) {
    rect(ctx, -104, -26, 60, 52, hull, hullEdge);
    for (let i = 1; i < 4; i++) line(ctx, -104 + i * 15, -26, -104 + i * 15, 26, 'rgba(0,0,0,.12)', 1);
    [-94, -79, -64].forEach((wx, i) => circle(ctx, wx, -8, 3.2, i < crewCount - 3 ? '#fde68a' : '#0c4a6e', '#334155'));
  }

  // ---- Service module
  rect(ctx, -44, -20, 44, 40, service, hullEdge);
  if (composite) line(ctx, -44, 0, 0, 0, '#60a5fa', 2);

  // ---- Shielding
  if (s.shielding === 'shd_thermal' || s.shielding === 'shd_full') {
    ctx.fillStyle = 'rgba(234,179,8,.55)';
    ctx.fillRect(-44, -20, 44, 40);
    ctx.strokeStyle = 'rgba(250,204,21,.8)';
    for (let i = -40; i < 0; i += 6) line(ctx, i, -20, i + 4, 20, 'rgba(255,255,255,.25)', 0.6);
  }

  // ---- Capsule
  poly(ctx, [[0, -22], [34, -10], [34, 10], [0, 22]], hull, hullEdge);
  rect(ctx, 7, -9, 15, 9, '#0c4a6e', '#334155');
  for (let i = 0; i < Math.min(3, crewCount); i++) {
    circle(ctx, 10.5 + i * 4.2, -4.5, 1.8, '#f8fafc');
  }
  local.cabin = { x: 14, y: -4 };

  if (s.shielding === 'shd_radiation' || s.shielding === 'shd_full') {
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, -22); ctx.lineTo(34, -10); ctx.lineTo(34, 10); ctx.lineTo(0, 22);
    ctx.stroke();
    if (L.large) ctx.strokeRect(-104, -26, 60, 52);
  }
  if (s.shielding === 'shd_full') {
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.strokeRect(L.tailX - 4, -30, 42 - L.tailX, 60);
    ctx.setLineDash([]);
  }
  local.hull = { x: L.large ? -74 : -22, y: -2 };

  // ---- Computer (lights on capsule)
  if (s.computer) {
    const n = s.computer === 'cpu_redundant' ? 3 : 1;
    for (let i = 0; i < n; i++) {
      const blink = 0.5 + 0.5 * Math.abs(Math.sin(time * 3 + i));
      circle(ctx, 27, -3 + i * 4, 1.4, `rgba(74,222,128,${blink})`);
    }
    local.computer = { x: 27, y: 1 };
  }

  // ---- Battery
  if (s.battery) {
    const adv = s.battery === 'bat_adv';
    rect(ctx, -41, 6, 9, 9, adv ? '#2563eb' : '#16a34a', '#0f172a');
    if (adv) rect(ctx, -30, 6, 9, 9, '#2563eb', '#0f172a');
    poly(ctx, [[-36, 7], [-38.5, 11], [-36.5, 11], [-37.5, 14], [-34, 9.5], [-36, 9.5]], '#fde047');
    local.battery = { x: -34, y: 10 };
  }

  // ---- Life support tanks
  if (s.life_support) {
    const color = s.life_support === 'ls_regen' ? '#86efac' : '#e5e7eb';
    const tanks = s.life_support === 'ls_basic' ? [[-8, -25]] : [[-8, -25], [-19, -25]];
    for (const [tx, ty] of tanks) circle(ctx, tx, ty, 5.5, color, '#475569');
    if (s.life_support === 'ls_regen') {
      poly(ctx, [[-13, -32], [-9, -38], [-5, -33]], '#22c55e');
    }
    local.life_support = { x: tanks[0][0], y: tanks[0][1] };
  }

  // ---- Comms
  if (s.comms) {
    const bx = 20;
    const by = -15;
    if (s.comms === 'com_omni') {
      line(ctx, bx, by, bx, -40, '#cbd5e1', 1.2);
      circle(ctx, bx, -41, 2.4, '#f8fafc');
      local.comms = { x: bx, y: -38 };
    } else if (s.comms === 'com_hga') {
      line(ctx, bx, by, bx, -30, '#cbd5e1', 1.6);
      ctx.beginPath();
      ctx.arc(bx, -42, 12, Math.PI * 0.15, Math.PI * 0.85);
      ctx.closePath();
      ctx.fillStyle = '#e5e7eb';
      ctx.fill();
      ctx.strokeStyle = '#64748b';
      ctx.stroke();
      line(ctx, bx, -31, bx, -38, '#94a3b8', 1);
      local.comms = { x: bx, y: -34 };
    } else {
      line(ctx, bx, by, bx, -24, '#cbd5e1', 1.6);
      rect(ctx, bx - 6, -33, 13, 9, '#475569', '#0f172a');
      const glow = 0.6 + 0.4 * Math.sin(time * 5);
      circle(ctx, bx + 7, -28.5, 2.2, `rgba(239,68,68,${glow})`);
      line(ctx, bx + 9, -29, bx + 24, -40, `rgba(248,113,113,${glow * 0.5})`, 1);
      local.comms = { x: bx, y: -28 };
    }
  }

  // ---- Attitude control
  if (s.attitude) {
    const quad = (qx, qy) => rect(ctx, qx - 1.5, qy - 1.5, 3, 3, '#f97316');
    quad(31, -11); quad(31, 11);
    if (s.attitude === 'att_adv') {
      quad(L.tailX + 2, -21); quad(L.tailX + 2, 21);
      poly(ctx, [[4, -21], [10, -27], [12, -23]], '#e2e8f0', '#64748b');
    }
    local.attitude = { x: 31, y: -11 };
  }

  // ---- RTG
  if (s.power === 'pwr_rtg') {
    const rx = L.tailX + 4;
    line(ctx, rx + 6, 20, rx + 6, 28, '#94a3b8', 2);
    rect(ctx, rx, 28, 12, 18, '#78716c', '#292524');
    for (let i = 0; i < 4; i++) line(ctx, rx - 3, 31 + i * 4, rx + 15, 31 + i * 4, '#a8a29e', 1);
    circle(ctx, rx + 6, 37, 1.8, `rgba(248,113,113,${0.5 + 0.5 * Math.sin(time * 2)})`);
    local.power = { x: rx + 6, y: 37 };
  }

  // ---- Instruments (hanging below the body)
  const slots = [-14, -3, 8, 18, 27, 36];
  model.instruments.forEach((id, i) => {
    const ix = slots[i % slots.length];
    drawInstrument(ctx, id, ix, bottomY(ix));
  });
  if (model.instruments.length) {
    const mid = slots[Math.floor((model.instruments.length - 1) / 2)];
    local.instruments = { x: mid, y: bottomY(mid) + 8 };
  }

  // ---- Highlight a part (flash when installed / event marker)
  if (highlight && local[highlight.anchor]) {
    const p = local[highlight.anchor];
    ctx.strokeStyle = highlight.color || `rgba(96,165,250,${highlight.alpha})`;
    ctx.globalAlpha = highlight.alpha ?? 1;
    ctx.lineWidth = 2.5;
    circle(ctx, p.x, p.y, 10 + (1 - (highlight.alpha ?? 1)) * 16, null);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  ctx.restore();

  const anchors = {};
  for (const [k, p] of Object.entries(local)) {
    anchors[k] = { x: x + (p.x - cx) * scale, y: y + (p.y - cy) * scale };
  }
  if (!anchors.instruments) anchors.instruments = anchors.hull;
  if (!anchors.power) anchors.power = anchors.hull;
  return anchors;
}
