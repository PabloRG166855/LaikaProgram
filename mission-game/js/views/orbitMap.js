// 2D orbital map drawn on a canvas. Reads mission state only; never mutates it.
// The ship is the same SVG drawn in the design screen, and every event is drawn where
// it happens: on a ship part, out in space, on the planet, or next to the Earth.
import { SHIP_VB } from '../shipArt.js';

const SHIP_SPEED = 0.045; // rad/s along the orbit — slow, so events on the ship are easy to click
const SHIP_START = -Math.PI * 0.65;
const HIT_RADIUS = 24;

export class OrbitMap {
  constructor(canvas, level, shipArt, onEventClick) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.level = level;
    this.anchors = shipArt.anchors;
    this.markers = [];
    this.shipBox = null;
    this.stars = Array.from({ length: 140 }, () => ({ x: Math.random(), y: Math.random(), r: Math.random() * 1.2 + 0.2, a: Math.random() }));
    this.img = new Image();
    this.imgReady = false;
    this.img.onload = () => { this.imgReady = true; };
    this.img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(shipArt.svg)}`;

    canvas.addEventListener('click', e => {
      const hit = this.hitTest(e);
      if (hit) onEventClick(hit.uid);
    });
    canvas.addEventListener('mousemove', e => {
      canvas.style.cursor = this.hitTest(e) ? 'pointer' : 'default';
    });
  }

  hitTest(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    let best = null;
    // Only pending events can be opened; "working" ones are just shown.
    for (const m of this.markers.filter(k => k.pending)) {
      const d = Math.hypot(m.x - x, m.y - y);
      if (d < HIT_RADIUS && (!best || d < best.d)) best = { ...m, d };
    }
    if (best) return best;
    // Clicking anywhere on the ship opens the closest event on the ship.
    const b = this.shipBox;
    if (b && x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
      for (const m of this.markers.filter(k => k.onShip && k.pending)) {
        const d = Math.hypot(m.x - x, m.y - y);
        if (!best || d < best.d) best = { ...m, d };
      }
    }
    return best;
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    if (this.canvas.width !== Math.round(w * dpr) || this.canvas.height !== Math.round(h * dpr)) {
      this.canvas.width = Math.round(w * dpr);
      this.canvas.height = Math.round(h * dpr);
    }
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.w = w;
    this.h = h;
  }

  layout() {
    const { w, h } = this;
    const base = Math.min(w, h);
    const shipW = Math.max(100, Math.min(175, w * 0.19));
    return {
      cx: w / 2,
      cy: h / 2 + 6,
      bodyR: base * 0.15,
      rx: w * 0.34,
      ry: h * 0.33,
      shipW,
      scale: shipW / SHIP_VB.w,
      earth: { x: 44, y: 44, r: 15 }
    };
  }

  shipPos(s, L) {
    const a = SHIP_START + s.time * SHIP_SPEED;
    return { x: L.cx + Math.cos(a) * L.rx, y: L.cy + Math.sin(a) * L.ry };
  }

  partPoint(ship, part, L) {
    const an = this.anchors[part] || this.anchors.structure;
    return { x: ship.x + (an.x - SHIP_VB.w / 2) * L.scale, y: ship.y + (an.y - SHIP_VB.h / 2) * L.scale };
  }

  eventPoint(s, ev, L, ship) {
    const { loc } = ev;
    const planet = () => {
      const a = loc.a * Math.PI * 2;
      const r = L.bodyR * (0.35 + loc.b * 0.3);
      return { x: L.cx + Math.cos(a) * r, y: L.cy + Math.sin(a) * r };
    };
    switch (loc.type) {
      case 'ship':
        return this.partPoint(ship, loc.part, L);
      case 'planet':
        return planet();
      case 'earth':
        if (this.level.destination === 'LEO') return planet();
        return { x: L.earth.x + 30, y: L.earth.y + 14 };
      default: {
        // Somewhere out in space, beyond the orbit
        const a = loc.a * Math.PI * 2;
        let x = L.cx + Math.cos(a) * L.rx * (1.2 + loc.b * 0.15);
        let y = L.cy + Math.sin(a) * L.ry * (1.35 + loc.b * 0.2);
        x = Math.max(34, Math.min(this.w - 34, x));
        y = Math.max(34, Math.min(this.h - 44, y));
        // Threats (debris, asteroids, storms) close in on the ship while nobody handles them
        if (ev.def.threat && ev.status === 'pending') {
          const p = Math.min(1, (s.time - ev.spawnedAt) / (ev.expiresAt - ev.spawnedAt)) * 0.55;
          x += (ship.x - x) * p;
          y += (ship.y - y) * p;
        }
        return { x, y };
      }
    }
  }

  label(text, x, y, color) {
    const { ctx } = this;
    ctx.font = '600 11px system-ui';
    const tw = ctx.measureText(text).width;
    ctx.fillStyle = 'rgba(6,10,22,.82)';
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(x - tw / 2 - 5, y - 8, tw + 10, 16, 6) : ctx.rect(x - tw / 2 - 5, y - 8, tw + 10, 16);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.fillText(text, x, y + 0.5);
  }

  draw(s, nowMs) {
    this.resize();
    const { ctx, w, h, level } = this;
    const L = this.layout();
    ctx.clearRect(0, 0, w, h);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (const st of this.stars) {
      ctx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(nowMs / 1500 + st.a * 10));
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(st.x * w, st.y * h, st.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Small Earth in the corner when we are far from home
    if (level.destination !== 'LEO') {
      const E = L.earth;
      const g = ctx.createRadialGradient(E.x - 5, E.y - 5, 2, E.x, E.y, E.r);
      g.addColorStop(0, '#60a5fa');
      g.addColorStop(1, '#1e3a8a');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(E.x, E.y, E.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = '10px system-ui';
      ctx.fillStyle = 'rgba(255,255,255,.7)';
      ctx.fillText('Tierra', E.x, E.y + E.r + 10);
    }

    // Orbit
    ctx.strokeStyle = 'rgba(120,150,255,.3)';
    ctx.setLineDash([6, 6]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(L.cx, L.cy, L.rx, L.ry, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Planet
    const grad = ctx.createRadialGradient(L.cx - L.bodyR * 0.35, L.cy - L.bodyR * 0.35, L.bodyR * 0.1, L.cx, L.cy, L.bodyR);
    grad.addColorStop(0, level.bodyColor);
    grad.addColorStop(1, level.bodyColor2);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(L.cx, L.cy, L.bodyR, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = '12px system-ui';
    ctx.fillStyle = 'rgba(255,255,255,.8)';
    ctx.fillText(level.bodyName, L.cx, L.cy + L.bodyR + 14);

    // Ship
    const ship = this.shipPos(s, L);
    const shipH = SHIP_VB.h * L.scale;
    this.shipBox = { x: ship.x - L.shipW / 2, y: ship.y - shipH / 2, w: L.shipW, h: shipH };
    const glow = ctx.createRadialGradient(ship.x, ship.y, 4, ship.x, ship.y, L.shipW * 0.6);
    glow.addColorStop(0, 'rgba(79,140,255,.18)');
    glow.addColorStop(1, 'rgba(79,140,255,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(ship.x, ship.y, L.shipW * 0.6, 0, Math.PI * 2);
    ctx.fill();
    if (this.imgReady) ctx.drawImage(this.img, this.shipBox.x, this.shipBox.y, L.shipW, shipH);
    else {
      ctx.font = '28px system-ui';
      ctx.fillText('🛰️', ship.x, ship.y);
    }

    // Events
    const pulse = 1 + 0.15 * Math.sin(nowMs / 180);
    this.markers = [];
    const placed = s.events.map(ev => ({ ev, p: this.eventPoint(s, ev, L, ship) }));

    // Threat trajectories and damaged-part glow (under the markers)
    for (const { ev, p } of placed) {
      if (ev.status !== 'pending') continue;
      if (ev.loc.type === 'space' && ev.def.threat) {
        ctx.strokeStyle = 'rgba(239,68,68,.55)';
        ctx.setLineDash([4, 5]);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(ship.x, ship.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      if (ev.loc.type === 'ship' && !ev.def.positive) {
        ctx.fillStyle = `rgba(239,68,68,${0.18 + 0.12 * Math.sin(nowMs / 160)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 22 * pulse, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    for (const { ev, p } of placed) {
      const working = ev.status === 'working';
      const left = working ? 1 : Math.max(0, (ev.expiresAt - s.time) / (ev.expiresAt - ev.spawnedAt));
      const color = working ? '#22d3ee'
        : ev.main ? '#facc15'
          : ev.def.positive ? '#22c55e'
            : left < 0.35 ? '#ef4444' : '#f59e0b';
      const R = ev.main ? 17 : 15;
      // countdown ring
      ctx.strokeStyle = 'rgba(255,255,255,.12)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(p.x, p.y, R + 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, (R + 4) * (working ? 1 : pulse), -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * left);
      ctx.stroke();
      ctx.fillStyle = 'rgba(10,15,31,.92)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, R, 0, Math.PI * 2);
      ctx.fill();
      if (ev.main) {
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      ctx.font = `${ev.main ? 18 : 16}px system-ui`;
      ctx.fillStyle = '#fff';
      ctx.fillText(ev.def.icon, p.x, p.y + 1);
      const text = working ? 'en proceso…' : `${ev.main ? '★ ' : ''}${ev.def.short || ev.def.name}`;
      this.label(text, p.x, p.y + R + 14, color);
      this.markers.push({ uid: ev.uid, x: p.x, y: p.y, onShip: ev.loc.type === 'ship', pending: ev.status === 'pending' });
    }
    ctx.textBaseline = 'alphabetic';
  }
}
