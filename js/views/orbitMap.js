// 8-bit orbital map. The scene is drawn at 1/PX resolution and upscaled with `image-rendering: pixelated`.
// Text labels go on a full-resolution overlay canvas so they stay readable.
// Ship events appear ON the ship part that failed, space events in open space, planet events on the surface.
import { drawShip, shipModel } from './shipRenderer.js';
import { drawIcon } from '../icons.js';
import { drawPixelEarth } from './pixelEarth.js';

const ORBIT_SPEED = 0.05; // rad/s — slow so ship events are easy to tap
const PX = 3;             // size of one "pixel" in screen pixels
const C = { white: '#FFF1E8', grey: '#C2C3C7', dark: '#5F574F', navy: '#1D2B53', red: '#FF004D', orange: '#FFA300', yellow: '#FFEC27', green: '#00E436', blue: '#29ADFF', pink: '#FF77A8' };

export class OrbitMap {
  constructor(canvas, state, onEventClick) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.overlay = document.createElement('canvas');
    this.overlay.className = 'map-overlay';
    canvas.after(this.overlay);
    this.octx = this.overlay.getContext('2d');
    this.level = state.level;
    this.model = shipModel(state.components);
    this.markers = [];
    this.stars = Array.from({ length: 150 }, () => ({ x: Math.random(), y: Math.random(), big: Math.random() < 0.15, a: Math.random(), c: Math.random() < 0.8 ? C.white : C.blue }));
    canvas.addEventListener('click', e => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      let best = null;
      for (const m of this.markers) {
        const d = Math.hypot(m.x - x, m.y - y);
        if (d < 32 && (!best || d < best.d)) best = { ...m, d };
      }
      if (best) onEventClick(best.uid);
    });
  }

  resize() {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    const lw = Math.max(1, Math.round(w / PX));
    const lh = Math.max(1, Math.round(h / PX));
    if (this.canvas.width !== lw || this.canvas.height !== lh) {
      this.canvas.width = lw;
      this.canvas.height = lh;
    }
    const dpr = window.devicePixelRatio || 1;
    if (this.overlay.width !== Math.round(w * dpr) || this.overlay.height !== Math.round(h * dpr)) {
      this.overlay.width = Math.round(w * dpr);
      this.overlay.height = Math.round(h * dpr);
    }
    this.ctx.setTransform(1 / PX, 0, 0, 1 / PX, 0, 0);
    this.ctx.imageSmoothingEnabled = false;
    this.octx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.w = w;
    this.h = h;
  }

  geometry() {
    const { w, h } = this;
    const bodyR = Math.min(w, h) * 0.14;
    // the crew panel sits at the bottom of the map area: keep the orbit above it
    const usable = h - 165;
    return {
      cx: w / 2,
      cy: usable / 2 + 12,
      bodyR,
      rx: Math.max(bodyR + 90, w * 0.33),
      ry: Math.max(bodyR + 40, usable / 2 - 62)
    };
  }

  spotPosition(spot) {
    if (spot === 'sun') return { x: this.w - 70, y: 70 };
    if (spot === 'earth') return { x: 70, y: 70 };
    return { x: this.w / 2, y: 70 };
  }

  /** Flat-shaded pixel planet (no gradients). */
  drawPlanet(g, t = 0) {
    const { ctx, level } = this;
    const r = g.bodyR;
    if (level.destination === 'LEO') {
      // la Tierra de verdad (continentes reales), girando despacio y con el Sol arriba a la derecha
      const sun = this.spotPosition('sun');
      drawPixelEarth(ctx, g.cx, g.cy, r, PX, t * 0.06, [sun.x - g.cx, sun.y - g.cy, Math.hypot(sun.x - g.cx, sun.y - g.cy) * 0.9]);
      return;
    }
    ctx.fillStyle = level.bodyColor2;
    ctx.beginPath(); ctx.arc(g.cx, g.cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.save();
    ctx.beginPath(); ctx.arc(g.cx, g.cy, r, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = level.bodyColor;
    ctx.beginPath(); ctx.arc(g.cx - r * 0.18, g.cy - r * 0.18, r * 0.92, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,241,232,.35)';
    ctx.beginPath(); ctx.arc(g.cx - r * 0.42, g.cy - r * 0.42, r * 0.28, 0, Math.PI * 2); ctx.fill();
    // craters / patches (continents when the body is the Earth)
    ctx.fillStyle = level.bodyPatches || level.bodyColor2;
    const patches = level.bodyPatches
      ? [[0.2, 0.15, 0.3], [-0.35, 0.3, 0.2], [0.4, -0.35, 0.16], [-0.2, -0.45, 0.14], [0.05, 0.6, 0.12]]
      : [[0.25, 0.2, 0.16], [-0.3, 0.35, 0.11], [0.45, -0.3, 0.09], [-0.05, -0.45, 0.07], [0.1, 0.55, 0.12]];
    patches.forEach(([dx, dy, rr]) => {
      ctx.globalAlpha = level.bodyPatches ? 1 : 0.55;
      ctx.beginPath(); ctx.arc(g.cx + dx * r, g.cy + dy * r, rr * r, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  /** Pixel Hubble (upright tube + two solar panels), snapped to the PX grid. */
  drawHubble(x, y, t) {
    const { ctx } = this;
    const u = PX;
    const R = (dx, dy, w, h, c) => {
      ctx.fillStyle = c;
      ctx.fillRect(Math.round(x / u + dx) * u, Math.round(y / u + dy) * u, w * u, h * u);
    };
    for (const ax of [-13, 5]) {
      R(ax, -1, 8, 7, C.navy);
      for (let i = 0; i < 8; i += 2) R(ax + i, -1, 1, 7, C.blue);
    }
    R(-5, 2, 2, 1, C.grey);
    R(3, 2, 2, 1, C.grey);
    R(-3, -12, 6, 22, C.grey);
    R(-3, -12, 2, 22, C.white);
    R(2, -12, 1, 22, C.dark);
    R(-4, -14, 7, 2, C.grey);
    R(-4, 10, 8, 5, C.grey);
    R(-2, 11, 3, 3, C.dark);
    if (Math.floor(t * 2) % 2 === 0) R(3, 11, 1, 1, C.red);
  }

  label(text, x, y, color) {
    if (window.T) text = window.T(text);
    const o = this.octx;
    o.font = '9px "Press Start 2P", monospace';
    o.textAlign = 'center';
    const w = o.measureText(text).width + 10;
    o.fillStyle = 'rgba(0,0,0,.75)';
    o.fillRect(Math.round(x - w / 2), Math.round(y - 11), Math.round(w), 16);
    o.fillStyle = color;
    o.fillText(text, Math.round(x), Math.round(y + 1));
  }

  draw(s, nowMs) {
    this.resize();
    const { ctx, w, h, level } = this;
    const g = this.geometry();
    const t = nowMs / 1000;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    this.octx.clearRect(0, 0, w, h);
    for (const st of this.stars) {
      if (Math.sin(t * 2 + st.a * 20) < -0.6) continue; // twinkle
      ctx.fillStyle = st.c;
      const sz = st.big ? PX * 2 : PX;
      ctx.fillRect(Math.round(st.x * w / PX) * PX, Math.round(st.y * h / PX) * PX, sz, sz);
    }

    // Sun (top-right) and Earth (top-left, when far from home)
    const sun = this.spotPosition('sun');
    ctx.fillStyle = C.orange;
    ctx.beginPath(); ctx.arc(sun.x, sun.y, 26, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = C.yellow;
    ctx.beginPath(); ctx.arc(sun.x, sun.y, 19, 0, Math.PI * 2); ctx.fill();
    if (level.destination !== 'LEO') {
      const e = this.spotPosition('earth');
      drawPixelEarth(ctx, e.x, e.y, 16, PX, t * 0.06, [1, -0.3, 0.8]);
      this.label('TIERRA', e.x, e.y + 32, C.grey);
    }

    // Orbit (dotted, pixel steps) — en blanco para que se vea bien
    ctx.fillStyle = C.white;
    for (let a = 0; a < Math.PI * 2; a += 0.045) {
      ctx.fillRect(Math.round((g.cx + Math.cos(a) * g.rx) / PX) * PX, Math.round((g.cy + Math.sin(a) * g.ry) / PX) * PX, PX, PX);
    }

    this.drawPlanet(g, t);
    this.label(level.bodyName.toUpperCase(), g.cx, g.cy + g.bodyR + 22, C.grey);

    // Ship (slow orbit)
    const shipA = -Math.PI / 2 + s.time * ORBIT_SPEED;
    const sx = g.cx + Math.cos(shipA) * g.rx;
    const sy = g.cy + Math.sin(shipA) * g.ry;
    // Velocidad en vivo: un poco más rápido cuando la nave pasa más cerca del planeta (como en una órbita real).
    // Órbita baja de la Tierra ≈ 27.300 km/h (como el Hubble), órbita lunar ≈ 5.800 km/h, órbita baja de Marte ≈ 12.200 km/h.
    const BASE = { LEO: 27300, MOON: 5800, MARS: 12200 }[level.destination] || 27300;
    const rNorm = Math.hypot(sx - g.cx, sy - g.cy) / ((g.rx + g.ry) / 2);
    const target = BASE * (1 + 0.015 * (1 - rNorm)) + Math.sin(t * 1.7) * BASE * 0.0006;
    this.speed = this.speed ? this.speed + (target - this.speed) * 0.05 : target;
    const shipScale = Math.max(0.6, Math.min(1.05, Math.min(w, h) / 500));
    const thrust = s.events.some(e => e.loc.type === 'ship' && e.loc.part === 'engine' && e.status === 'working');
    const anchors = drawShip(ctx, this.model, { x: sx, y: sy, scale: shipScale, time: t, crewCount: s.crew.length, thrust });

    // Mission target: the Hubble shares your orbit. Before capture it flies ahead,
    // while you work on it it stays next to your ship, and after release it drifts away.
    let hubblePos = null;
    if (level.target === 'hubble') {
      const st = id => (s.objectives.find(o => o.def.id === id) || {}).status;
      const done = x => ['success', 'fail', 'ignored', 'missed'].includes(x);
      const captured = done(st('hubble_capture')) && !done(st('hubble_release'));
      const released = done(st('hubble_release'));
      if (captured) {
        hubblePos = { x: sx + 4, y: sy - 78 * shipScale };
      } else {
        if (released && this.releasedAt == null) this.releasedAt = s.time;
        const ahead = released ? 0.35 + (s.time - this.releasedAt) * 0.02 : 0.42;
        const ha = shipA + ahead;
        hubblePos = { x: g.cx + Math.cos(ha) * g.rx, y: g.cy + Math.sin(ha) * g.ry };
      }
      this.drawHubble(hubblePos.x, hubblePos.y, t);
      this.label('HUBBLE', hubblePos.x, hubblePos.y + 50, C.grey);
    }

    // Events
    this.markers = [];
    let shipCount = 0;
    const OFFSETS = [[0, 0], [0, 56], [0, -56], [64, 28]];
    for (const ev of s.events) {
      let pos;
      let link = null;
      if (ev.loc.type === 'ship') {
        const a = anchors[ev.loc.part] || anchors.hull;
        const [ox, oy] = OFFSETS[shipCount++ % OFFSETS.length];
        pos = { x: a.x + ox, y: a.y + oy };
        link = { x: a.x, y: a.y };
      } else if (ev.loc.type === 'planet') {
        pos = { x: g.cx + Math.cos(ev.loc.angle) * g.bodyR * 0.72, y: g.cy + Math.sin(ev.loc.angle) * g.bodyR * 0.72 };
      } else if (ev.loc.spot === 'station') {
        const a = shipA + 0.35;
        pos = { x: g.cx + Math.cos(a) * g.rx, y: g.cy + Math.sin(a) * g.ry };
        drawIcon(ctx, 'satellite', pos.x, pos.y - 40, 36, C.grey);
      } else if (ev.loc.spot === 'hubble' && hubblePos) {
        pos = { x: hubblePos.x + 62, y: hubblePos.y - 6 };
        link = { x: hubblePos.x + 16, y: hubblePos.y };
      } else if (ev.loc.spot) {
        pos = this.spotPosition(ev.loc.spot);
      } else {
        pos = { x: ev.loc.x * w, y: Math.min(h - 200, Math.max(60, ev.loc.y * h)) };
        if (ev.loc.trajectory) {
          ctx.fillStyle = C.red;
          const steps = 26;
          for (let i = 1; i < steps; i += 2) {
            const k = i / steps;
            ctx.fillRect(Math.round((pos.x + (sx - pos.x) * k) / PX) * PX, Math.round((pos.y + (sy - pos.y) * k) / PX) * PX, PX * 2, PX * 2);
          }
        }
      }
      this.drawMarker(ev, pos, link, s, nowMs);
      this.markers.push({ uid: ev.uid, x: pos.x, y: pos.y });
    }
  }

  drawMarker(ev, pos, link, s, nowMs) {
    const { ctx } = this;
    const working = ev.status === 'working';
    const left = working ? 1 : Math.max(0, (ev.expiresAt - s.time) / (ev.expiresAt - ev.spawnedAt));
    const color = working ? C.blue : ev.main ? C.yellow : ev.def.positive ? C.green : left < 0.35 ? C.red : C.orange;
    const blink = !working && Math.floor(nowMs / 250) % 2 === 0;
    const size = ev.main ? 46 : 40;
    const x = Math.round(pos.x - size / 2);
    const y = Math.round(pos.y - size / 2);
    if (link && (Math.abs(link.x - pos.x) > 1 || Math.abs(link.y - pos.y) > 1)) {
      ctx.fillStyle = color;
      const steps = 8;
      for (let i = 0; i <= steps; i++) {
        const k = i / steps;
        ctx.fillRect(link.x + (pos.x - link.x) * k - 1, link.y + (pos.y - link.y) * k - 1, PX, PX);
      }
    }
    // square pixel frame (blinks when it needs attention)
    ctx.fillStyle = blink ? color : '#000';
    ctx.fillRect(x - PX * 2, y - PX * 2, size + PX * 4, size + PX * 4);
    ctx.fillStyle = '#000';
    ctx.fillRect(x, y, size, size);
    ctx.strokeStyle = color;
    ctx.lineWidth = PX;
    ctx.strokeRect(x + PX / 2, y + PX / 2, size - PX, size - PX);
    drawIcon(ctx, ev.def.ico, pos.x, pos.y, size - 14, C.white);
    if ((ev.def.minigame || ev.def.sts125) && !working) {
      // wrench badge: "you repair this one yourself"
      const bx = x + size - 8;
      const by = y - 12;
      ctx.fillStyle = C.yellow;
      ctx.fillRect(bx - 2, by - 2, 24, 24);
      ctx.fillStyle = '#000';
      ctx.fillRect(bx, by, 20, 20);
      drawIcon(ctx, 'wrench', bx + 10, by + 10, 16, C.yellow);
    }
    // timer: block bar under the marker
    const blocks = 6;
    const on = Math.ceil(left * blocks);
    for (let i = 0; i < blocks; i++) {
      ctx.fillStyle = i < on ? color : C.dark;
      ctx.fillRect(x + i * (size / blocks), y + size + PX * 3, size / blocks - PX, PX * 2);
    }
    this.label(working ? 'TRABAJANDO' : ev.def.minigame && !ev.main ? `¡REPARA! ${ev.def.name}` : ev.def.name, pos.x, y + size + PX * 3 + 22, color);
  }
}
