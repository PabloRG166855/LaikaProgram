// Repair minigames: when a part of the ship breaks, YOU fix it with a quick one-button game.
// Mechanics adapted from the team's STS-125 minigames (press on time, hold & release, tap fast).
//   aim    -> antenna / star tracker / computer reboot   (press when the pointer is on the green)
//   charge -> battery / cooling                          (hold, release inside the green band)
//   tap    -> CO2 filter / stuck bolt / fuel valve       (tap fast before time runs out)
//   patch  -> hull hole                                  (drop the patch right over the hole)
// The game config lives in data/events.json ("minigame": { game, theme, option, how }).
import { icon } from '../icons.js';
import { sfx, sfxNoise } from '../sfx.js';
import { esc } from '../ui.js';

const W = 320;
const H = 180;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const C = {
  black: '#000000', navy: '#1D2B53', plum: '#7E2553', dgreen: '#008751', brown: '#AB5236', dgrey: '#5F574F',
  grey: '#C2C3C7', white: '#FFF1E8', red: '#FF004D', orange: '#FFA300', yellow: '#FFEC27', green: '#00E436',
  blue: '#29ADFF', lav: '#83769C', pink: '#FF77A8', peach: '#FFCCAA'
};

export function openRepairGame(host, { def, main = false, onDone }) {
  const cfg = def.minigame;
  const photo = cfg.photo ? `
          <figure class="rg-photo"><img src="${esc(cfg.photo)}" alt=""><figcaption>FOTO REAL · ${esc(cfg.caption || 'NASA')}</figcaption></figure>` : '';
  const facts = cfg.facts ? `<dl class="rg-facts">${cfg.facts.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>` : '';
  const overlay = document.createElement('div');
  overlay.className = 'rg-overlay';
  overlay.innerHTML = `
    <div class="rg-box">
      <header class="rg-head">
        <span class="rg-ico ${main ? 'main' : ''}">${icon(main ? def.ico || 'target' : 'wrench', 30)}</span>
        <div class="rg-title"><small class="${main ? 'main' : ''}">${main ? 'OBJETIVO PRINCIPAL' : '¡REPÁRALO TÚ!'}</small><h2>${esc(def.name)}</h2></div>
        <span class="rg-pips" id="rg-pips"></span>
      </header>
      <div class="rg-stage" id="rg-stage">
        <canvas id="rg-canvas" width="${W}" height="${H}"></canvas>
        <div class="rg-start ${cfg.photo ? 'with-photo' : ''}" id="rg-start">${photo}
          <div class="rg-start-main">
          ${cfg.kicker ? `<span class="rg-kicker">${esc(cfg.kicker)}</span>` : ''}
          ${facts}
          <p>${esc(cfg.how)}</p>
          <div class="rg-btns">
            <button class="btn ghost" data-r="later">Después</button>
            <button class="btn go" data-r="go">${icon(main ? 'play' : 'wrench', 18)} ${main ? '¡Vamos!' : '¡Reparar!'}</button>
          </div>
          </div>
        </div>
      </div>
      <p class="rg-how">${icon('circle-dot', 18)} ${esc(cfg.how)}</p>
    </div>`;
  host.appendChild(overlay);
  document.body.classList.add('rg-open');
  const $ = id => overlay.querySelector(`#${id}`);
  const canvas = $('rg-canvas');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // ---------- drawing helpers ----------
  function px(x, y, c, w = 1, h = 1) {
    ctx.fillStyle = c;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }
  function text(str, x, y, c = C.white, sz = 8, align = 'center') {
    if (window.T) str = window.T(str);
    ctx.font = `${sz}px "Press Start 2P", monospace`;
    ctx.textAlign = align;
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#000';
    ctx.fillText(str, Math.round(x) + 1, Math.round(y) + 1);
    ctx.fillStyle = c;
    ctx.fillText(str, Math.round(x), Math.round(y));
  }
  function disc(x, y, r, c) {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(Math.round(x), Math.round(y), r, 0, Math.PI * 2);
    ctx.fill();
  }
  const stars = Array.from({ length: 70 }, () => ({ x: Math.random() * W, y: Math.random() * H, c: Math.random() < 0.3 ? C.white : C.lav }));
  function space() {
    px(0, 0, C.black, W, H);
    for (const s of stars) px(s.x, s.y, s.c);
  }
  let particles = [];
  function burst(x, y, n, colors, spd = 40, life = 0.7, g = 0) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = rand(0.3, 1) * spd;
      particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: rand(life * 0.5, life), c: colors[(Math.random() * colors.length) | 0], g });
    }
  }
  function particlesStep(dt) {
    for (const p of particles) { p.life -= dt; p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; }
    particles = particles.filter(p => p.life > 0);
    for (const p of particles) px(p.x, p.y, p.c, 2, 2);
  }
  let popup = null;
  const say = (str, c) => { popup = { str, c, age: 0 }; };

  // ---------- input: one button (space / click / touch) ----------
  const input = { held: false, pressed: false };
  const onKeyDown = e => {
    if (e.code !== 'Space' && e.code !== 'Enter') return;
    if (e.target.closest && e.target.closest('button')) return;
    e.preventDefault();
    e.stopPropagation();
    if (phase === 'intro') { begin(); return; }
    if (!e.repeat) input.pressed = true;
    input.held = true;
  };
  const onKeyUp = e => { if (e.code === 'Space' || e.code === 'Enter') input.held = false; };
  const onDown = e => {
    if (e.target.closest('button, .rg-start')) return;
    e.preventDefault();
    input.pressed = true;
    input.held = true;
  };
  const onUp = () => { input.held = false; };
  window.addEventListener('keydown', onKeyDown, true);
  window.addEventListener('keyup', onKeyUp, true);
  $('rg-stage').addEventListener('pointerdown', onDown);
  window.addEventListener('pointerup', onUp);

  // ---------- the four mechanics ----------
  const st = {};
  const GAMES = {
    // --- press when the pointer is on the green ---
    aim: {
      rounds: 3,
      need: 2,
      init(r) {
        if (cfg.theme === 'gyro') {
          // the box spins; press when its red arrow points UP
          Object.assign(st, { wrap: true, u: 0.35, speed: 0.5 + r * 0.12, c: 0, w: 0.14 - r * 0.02, round: r });
          return;
        }
        Object.assign(st, { u: Math.random() * 0.2, dir: 1, speed: 0.5 + r * 0.18, c: rand(0.2, 0.8), w: 0.2 - r * 0.03, glow: 0 });
      },
      update(dt) {
        if (st.wrap) {
          st.u = (st.u + st.speed * dt) % 1;
          if (input.pressed) {
            const d = Math.abs(st.u - st.c);
            return Math.min(d, 1 - d) <= st.w / 2 ? 'hit' : 'miss';
          }
          return null;
        }
        st.u += st.dir * st.speed * dt;
        if (st.u > 1) { st.u = 1; st.dir = -1; }
        if (st.u < 0) { st.u = 0; st.dir = 1; }
        if (input.pressed) return Math.abs(st.u - st.c) <= st.w / 2 ? 'hit' : 'miss';
        return null;
      },
      draw(t, result) {
        if (cfg.theme === 'computer') return drawComputer(t, result);
        if (cfg.theme === 'gyro') return drawGyros(t, result);
        space();
        const cx = W / 2;
        const cy = H - 22;
        const R = cfg.theme === 'arm' ? 100 : 118;
        const ang = u => lerp(-1.15, 1.15, u);
        const at = (a, r) => [cx + Math.sin(a) * r, cy - Math.cos(a) * r];
        // green target arc + the thing to aim at
        if (cfg.theme !== 'arm') for (let a = ang(st.c - st.w / 2); a <= ang(st.c + st.w / 2); a += 0.012) {
          const [x, y] = at(a, R);
          px(x - 1, y - 1, C.green, 3, 3);
        }
        const [tx, ty] = at(ang(st.c), R + 14);
        if (cfg.theme === 'arm') {
          // place the Hubble so its grapple pin sits right where the gripper closes
          const [pxx, pyy] = at(ang(st.c), R - 6);
          drawHubble(pxx - 13 * 0.7, pyy + 0.7, 0.7, t, true);
          const rr = 9 + (Math.floor(t * 4) % 2);
          for (let k = 0; k < 24; k++) px(pxx + Math.cos((k / 24) * Math.PI * 2) * rr, pyy + Math.sin((k / 24) * Math.PI * 2) * rr, C.green, 2, 2);
          text('PUNTO DE AGARRE', pxx - 9, Math.max(4, pyy - 56), C.green, 8);
        } else if (cfg.theme === 'antenna') {
          disc(tx, ty, 11, C.blue);
          disc(tx - 3, ty - 2, 5, C.green);
          disc(tx + 4, ty + 4, 3, C.green);
          text('TIERRA', tx, ty - 26, C.blue, 8);
        } else {
          const tw = Math.floor(t * 6) % 2;
          px(tx - 1, ty - 6 - tw, C.yellow, 3, 13 + tw * 2);
          px(tx - 6 - tw, ty - 1, C.yellow, 13 + tw * 2, 3);
          px(tx - 2, ty - 2, C.white, 5, 5);
          text('ESTRELLA', tx, ty - 22, C.yellow, 8);
        }
        // the beam / pointer
        const a = ang(st.u);
        const ok = result === 'hit';
        if (cfg.theme === 'arm') {
          // robotic arm: two segments and a gripper
          const [ex, ey] = at(a + 0.35, R * 0.5);
          const [gx, gy] = at(a, R - 6);
          thick(cx, cy - 4, ex, ey, C.white);
          thick(ex, ey, gx, gy, C.white);
          px(ex - 3, ey - 3, C.dgrey, 7, 7);
          px(gx - 4, gy - 4, C.navy, 9, 9);
          px(gx - 5, gy - 6, ok ? C.green : C.yellow, 2, 12);
          px(gx + 4, gy - 6, ok ? C.green : C.yellow, 2, 12);
          px(cx - 18, cy + 6, C.dgrey, 36, 16);
          return;
        }
        for (let r = 18; r < R - 4; r += 6) {
          const [x, y] = at(a, r);
          px(x - 1, y - 1, ok ? C.yellow : C.white, 2, 2);
        }
        // the device
        px(cx - 18, cy + 6, C.dgrey, 36, 16);
        px(cx - 4, cy - 4, C.grey, 8, 12);
        ctx.save();
        ctx.translate(cx, cy - 4);
        ctx.rotate(a);
        if (cfg.theme === 'antenna') {
          ctx.fillStyle = C.white;
          ctx.beginPath();
          ctx.ellipse(0, -10, 16, 6, 0, Math.PI, 0);
          ctx.fill();
          ctx.fillStyle = C.grey;
          ctx.fillRect(-1, -22, 2, 12);
        } else {
          ctx.fillStyle = C.grey;
          ctx.fillRect(-6, -26, 12, 26);
          ctx.fillStyle = C.navy;
          ctx.fillRect(-4, -28, 8, 4);
        }
        ctx.restore();
        if (ok) for (let k = 0; k < 3; k++) {
          const rr = ((t * 60 + k * 14) % 42) + 6;
          const [x, y] = at(a, R - rr);
          px(x - 3, y - 1, C.yellow, 6, 2);
        }
      }
    },

    // --- hold to fill, release inside the green band ---
    charge: {
      rounds: 3,
      need: 2,
      init(r) {
        const lo = rand(0.5, 0.72);
        Object.assign(st, { v: 0.06, lo, hi: lo + 0.17 - r * 0.025, wasHeld: false, rate: 0.4 + r * 0.07 });
      },
      update(dt) {
        if (input.held) {
          st.v += dt * st.rate;
          st.wasHeld = true;
          if (Math.random() < 0.3) sfxNoise(0.05, 0.03, cfg.theme === 'cool' ? 2500 : 600);
          if (st.v >= 1) { st.v = 1; return 'miss'; }
        } else if (st.wasHeld) {
          return st.v >= st.lo && st.v <= st.hi ? 'hit' : 'miss';
        }
        return null;
      },
      draw(t) {
        if (cfg.theme === 'lift') return drawLift(t);
        px(0, 0, C.navy, W, H);
        for (let y = 0; y < H; y += 12) px(0, y, '#22305e', W, 1);
        const cool = cfg.theme === 'cool';
        const x0 = 130;
        const y0 = 26;
        const bw = 60;
        const bh = 128;
        // body
        px(x0 - 4, y0 - 4, C.white, bw + 8, bh + 8);
        px(x0, y0, C.black, bw, bh);
        if (!cool) px(x0 + 18, y0 - 10, C.white, 24, 6);
        // green band (where to release)
        const level = cool ? 1 - st.v : st.v; // what the column shows
        const bandLo = cool ? 1 - st.hi : st.lo;
        const bandHi = cool ? 1 - st.lo : st.hi;
        px(x0 + bw + 8, y0 + bh * (1 - bandHi), C.green, 10, bh * (bandHi - bandLo));
        px(x0 - 18, y0 + bh * (1 - bandHi), C.green, 10, bh * (bandHi - bandLo));
        // column
        const col = cool ? (level > 0.6 ? C.red : level > 0.35 ? C.orange : C.blue) : st.v > st.hi ? C.red : C.yellow;
        px(x0 + 4, y0 + 4 + (bh - 8) * (1 - level), col, bw - 8, (bh - 8) * level);
        for (let y = y0 + 4; y < y0 + bh; y += 16) px(x0 + 4, y, C.black, bw - 8, 2);
        // green lines across the gauge: release between them
        for (let x = x0 + 2; x < x0 + bw - 2; x += 6) {
          px(x, y0 + bh * (1 - bandHi), C.green, 4, 2);
          px(x, y0 + bh * (1 - bandLo) - 2, C.green, 4, 2);
        }
        // icon text
        text(cool ? 'TEMPERATURA' : 'CARGA', W / 2, y0 + bh + 10, C.white, 8);
        if (input.held && phase === 'play') {
          if (cool) burst(x0 + bw / 2 + rand(-20, 20), y0 + 6, 2, [C.white, C.blue], 30, 0.6, -20);
          else burst(x0 + bw / 2 + rand(-24, 24), y0 + bh * (1 - st.v) + 4, 1, [C.yellow, C.white], 30, 0.4);
        }
        if (st.v > 0.92 && phase === 'play') text(cool ? '¡SE CONGELA!' : '¡SE SOBRECARGA!', W / 2, 8, C.red, 8);
        void t;
      }
    },

    // --- tap fast before time runs out ---
    tap: {
      rounds: 1,
      need: 1,
      init() {
        Object.assign(st, { v: 0, time: 5, spin: 0 });
      },
      update(dt) {
        st.time -= dt;
        st.v = Math.max(0, st.v - dt * 0.12);
        if (input.pressed) {
          st.v += 0.075;
          st.spin += 0.5;
          sfx('tick');
          burst(W / 2 + rand(-20, 20), H / 2 - 10 + rand(-20, 20), 3, [C.white, C.yellow, C.grey], 50, 0.4);
        }
        if (st.v >= 1) { st.perfectTap = st.time > 2; return 'hit'; }
        if (st.time <= 0) return 'miss';
        return null;
      },
      draw(t) {
        px(0, 0, C.navy, W, H);
        for (let y = 0; y < H; y += 12) px(0, y, '#22305e', W, 1);
        const cx = W / 2;
        const cy = 78;
        if (cfg.theme === 'rail') {
          // STIS panel with a stuck handrail: tapping loosens its bolt
          px(cx - 70, cy - 20, C.grey, 140, 70);
          px(cx - 70, cy - 20, C.white, 140, 3);
          text('STIS', cx, cy + 22, C.navy, 8);
          ctx.save();
          ctx.translate(cx - 50, cy - 28);
          ctx.rotate(-st.v * 0.5 + (input.pressed ? rand(-0.05, 0.05) : 0));
          ctx.fillStyle = C.yellow;
          ctx.fillRect(0, -4, 100, 8);
          ctx.fillStyle = C.orange;
          ctx.fillRect(0, 2, 100, 2);
          ctx.fillStyle = C.dgrey;
          ctx.fillRect(-4, -6, 10, 12);
          ctx.fillRect(92, -6 - st.v * 10, 10, 12);
          ctx.restore();
          text('PASAMANOS', cx, cy - 52, C.yellow, 8);
        } else if (cfg.theme === 'filter') {
          // slot + cartridge sliding out
          px(cx - 50, cy - 26, C.dgrey, 100, 52);
          px(cx - 44, cy - 20, C.black, 88, 40);
          const out = st.v * 70;
          px(cx - 40 + out, cy - 16, C.grey, 80, 32);
          for (let i = 0; i < 6; i++) px(cx - 36 + out + i * 13, cy - 14, C.dgrey, 3, 28);
          px(cx + 36 + out, cy - 6, C.orange, 8, 12);
          if (st.v < 0.95 && Math.random() < 0.4) burst(cx - 40, cy - 30, 1, [C.lav, C.grey], 20, 1, -20);
          text('CO2', cx - 70, cy - 4, C.lav, 8);
        } else {
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(st.spin * 0.6 + st.v * 6);
          if (cfg.theme === 'valve') {
            ctx.strokeStyle = C.red;
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.arc(0, 0, 30, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = C.red;
            for (let k = 0; k < 4; k++) { ctx.rotate(Math.PI / 2); ctx.fillRect(-2, 0, 4, 30); }
            ctx.fillStyle = C.grey;
            ctx.fillRect(-6, -6, 12, 12);
          } else {
            ctx.fillStyle = C.grey;
            ctx.beginPath();
            for (let k = 0; k < 6; k++) ctx.lineTo(Math.cos((k * Math.PI) / 3) * 26, Math.sin((k * Math.PI) / 3) * 26);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = C.dgrey;
            ctx.fillRect(-8, -8, 16, 16);
          }
          ctx.restore();
          if (cfg.theme === 'valve' && st.v < 0.95) {
            const n = Math.round((1 - st.v) * 4);
            for (let i = 0; i < n; i++) burst(cx + 40, cy, 1, [C.lav, C.grey, C.white], 40, 0.6);
          }
        }
        // progress + timer
        px(60, 132, C.white, 200, 14);
        px(62, 134, C.black, 196, 10);
        px(62, 134, C.green, 196 * clamp(st.v, 0, 1), 10);
        const blocks = 10;
        const on = Math.ceil((st.time / 5) * blocks);
        for (let i = 0; i < blocks; i++) px(60 + i * 20, 152, i < on ? (st.time < 1.5 ? C.red : C.yellow) : C.dgrey, 16, 6);
        if (phase === 'play' && Math.floor(t * 4) % 2) text('¡TOCA RÁPIDO!', W / 2, 10, C.yellow, 8);
      }
    },

    // --- drop the patch right over the hole ---
    patch: {
      rounds: 3,
      need: 2,
      init(r) {
        const old = st.patched || [];
        let hole;
        do { hole = rand(70, 250); } while (old.some(h => Math.abs(h - hole) < 40));
        Object.assign(st, { hole, x: 40, dir: 1, speed: 100 + r * 35, drop: null, tol: 10 - r * 1.5, patched: old });
      },
      update(dt) {
        if (st.drop == null) {
          st.x += st.dir * st.speed * dt;
          if (st.x > 280) { st.x = 280; st.dir = -1; }
          if (st.x < 40) { st.x = 40; st.dir = 1; }
          if (input.pressed) { st.drop = 0; sfx('blip'); }
          return null;
        }
        st.drop += dt * 3;
        if (st.drop >= 1) {
          const ok = Math.abs(st.x - st.hole) <= st.tol;
          if (ok) st.patched = [...st.patched, st.hole];
          return ok ? 'hit' : 'miss';
        }
        return null;
      },
      draw(t, result) {
        if (cfg.theme === 'camera') return drawCameraSlot(t, result);
        space();
        // hull
        const hy = 110;
        px(0, hy, C.grey, W, H - hy);
        for (let x = 0; x < W; x += 40) px(x, hy, C.dgrey, 1, H - hy);
        for (let x = 6; x < W; x += 20) px(x, hy + 6, C.dgrey, 2, 2);
        px(0, hy, C.white, W, 2);
        for (const h of st.patched || []) {
          px(h - 13, hy - 4, C.orange, 26, 10);
          px(h - 11, hy - 2, C.yellow, 22, 2);
        }
        const covered = (st.patched || []).includes(st.hole);
        if (!covered) {
          px(st.hole - 7, hy, C.black, 14, 10);
          px(st.hole - 4, hy + 10, C.black, 8, 4);
          if (Math.random() < 0.7) particles.push({ x: st.hole + rand(-4, 4), y: hy - 2, vx: rand(-12, 12), vy: rand(-40, -20), life: 0.8, c: Math.random() < 0.5 ? C.white : C.lav, g: 0 });
          if (Math.floor(t * 4) % 2) text('¡FUGA!', st.hole, hy + 24, C.red, 8);
        }
        // the patch
        if (result !== 'hit' || st.drop == null || st.drop < 1) {
          const y = st.drop == null ? 40 : lerp(40, hy - 4, clamp(st.drop, 0, 1));
          px(st.x - 13, y, C.orange, 26, 10);
          px(st.x - 11, y + 2, C.yellow, 22, 2);
          if (st.drop == null) for (let i = 0; i < 6; i++) px(st.x, 52 + i * 9, C.dgrey, 1, 4);
        }
      }
    }
  };

  /** Hubble space telescope (pixel sprite, upright). pin = show the yellow grapple point. */
  function drawHubble(x, y, s2, t, pin = false) {
    const R = (dx, dy, w, h, c) => px(x + dx * s2, y + dy * s2, c, Math.max(1, w * s2), Math.max(1, h * s2));
    for (const side of [-1, 1]) {
      const ax = side < 0 ? -44 : 14;
      R(side < 0 ? -14 : 10, 8, 4, 2, C.lav);
      R(ax, -2, 30, 22, C.navy);
      for (let i = 0; i < 30; i += 5) R(ax + i, -2, 1, 22, C.blue);
      for (let j = 0; j < 22; j += 6) R(ax, -2 + j, 30, 1, C.blue);
    }
    R(-10, -40, 20, 70, C.grey);
    R(-10, -40, 5, 70, C.white);
    R(6, -40, 4, 70, C.lav);
    for (let i = -34; i < 30; i += 10) R(-10, i, 20, 1, C.dgrey);
    R(-10, -44, 20, 4, C.grey);
    R(-12, -52, 14, 2, C.grey);
    R(-12, 30, 24, 16, C.grey);
    R(-6, 34, 8, 8, C.dgrey);
    if (Math.floor(t * 2) % 2 === 0) R(7, 33, 2, 2, C.red);
    if (pin) {
      R(10, -4, 7, 7, C.navy);
      R(11, -3, 5, 5, Math.floor(t * 3) % 2 ? C.yellow : C.orange);
    }
  }
  function thick(x0, y0, x1, y1, c) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let i = 0; i <= n; i += 1) px(x0 + ((x1 - x0) * i) / n - 2, y0 + ((y1 - y0) * i) / n - 2, c, 4, 4);
  }
  /** Hubble gyro bay: 3 slots; the current box spins until you press with the arrow UP. */
  function drawGyros(t, result) {
    space();
    const SLOTS = [90, 160, 230];
    const Y = 92;
    px(40, 40, C.grey, 240, 96);
    px(40, 40, C.white, 240, 3);
    px(40, 133, C.lav, 240, 3);
    text('GIROSCOPIOS DEL HUBBLE', 160, 122, C.navy, 8);
    SLOTS.forEach((x, i) => {
      px(x - 22, Y - 22, C.navy, 44, 44);
      if (i < round || (i === round && result)) {
        const okBox = marks[i] === 'hit';
        px(x - 18, Y - 18, okBox ? C.green : C.red, 36, 36);
        text(okBox ? 'OK' : 'X', x, Y - 4, C.black, 8);
        return;
      }
      if (i > round) {
        px(x - 18, Y - 18, C.dgrey, 36, 36);
        return;
      }
      // the spinning box with its red arrow
      px(x - 3, Y - 32, C.green, 7, 6); // notch: the arrow must point here
      ctx.save();
      ctx.translate(x, Y);
      ctx.rotate(st.u * Math.PI * 2);
      ctx.fillStyle = C.white;
      ctx.fillRect(-16, -16, 32, 32);
      ctx.fillStyle = C.red;
      ctx.fillRect(-2, -14, 5, 18);
      ctx.fillRect(-6, -14, 13, 4);
      ctx.fillRect(-4, -18, 9, 4);
      ctx.restore();
    });
    text('ARRIBA', SLOTS[Math.min(round, 2)], Y - 44, C.green, 8);
  }

  /** WFC3 install: the new camera moves above the Hubble; press when it is over the empty slot. */
  function drawCameraSlot(t, result) {
    space();
    const hy = 110;
    px(0, hy, C.grey, W, H - hy);
    px(0, hy, C.white, W, 2);
    for (let x = 0; x < W; x += 32) px(x, hy, C.lav, 1, H - hy);
    text('HUBBLE', 30, hy + 52, C.dgrey, 8, 'left');
    const placed = result === 'hit' && st.drop != null && st.drop >= 1;
    // empty slot with green guides
    px(st.hole - 16, hy, C.black, 32, 18);
    px(st.hole - 18, hy - 6, C.green, 2, 6);
    px(st.hole + 16, hy - 6, C.green, 2, 6);
    if (!placed) text('HUECO', st.hole, hy + 26, C.green, 8);
    const camX = placed ? st.hole : st.x;
    const y = placed ? hy - 6 : st.drop == null ? 40 : lerp(40, hy - 6, clamp(st.drop, 0, 1));
    // the camera: white box with a curved radiator
    px(camX - 15, y - 12, C.white, 30, 20);
    px(camX - 15, y + 6, C.lav, 30, 2);
    px(camX - 19, y - 10, C.grey, 4, 16);
    px(camX - 4, y - 16, C.yellow, 8, 4);
    text('WFC3', camX, y - 6, C.navy, 8);
    if (st.drop == null) for (let i = 0; i < 6; i++) px(camX, 62 + i * 8, C.dgrey, 1, 4);
    if (placed) text('¡CLIC!', st.hole, hy + 26, C.green, 8);
  }

  /** Release: lift the Hubble with the arm and let go inside the green band. */
  function drawLift(t) {
    space();
    const base = 150;
    const top = 26;
    const yAt = v => lerp(base - 30, top, v);
    px(0, base, C.dgrey, W, H - base);
    px(0, base, C.grey, W, 3);
    // green release band
    for (let x = 60; x < W - 20; x += 8) {
      px(x, yAt(st.hi), C.green, 5, 2);
      px(x, yAt(st.lo), C.green, 5, 2);
    }
    text('SUELTA AQUÍ', W - 24, (yAt(st.hi) + yAt(st.lo)) / 2 - 4, C.green, 8, 'right');
    const hy = yAt(st.v);
    const hx = 170;
    drawHubble(hx, hy, 0.5, t, false);
    // arm from the shoulder to the grapple point
    const sx = 40;
    const sy = base - 4;
    const gx = hx + 7;
    const gy = hy - 1;
    const ex = (sx + gx) / 2 - 10;
    const ey = Math.min(sy, gy) - 24;
    thick(sx, sy, ex, ey, C.white);
    thick(ex, ey, gx, gy, C.white);
    px(sx - 5, sy - 5, C.dgrey, 10, 10);
    px(ex - 3, ey - 3, C.dgrey, 7, 7);
    px(gx - 4, gy - 4, C.navy, 9, 9);
    if (st.v > 0.92 && phase === 'play') text('¡MUY ALTO!', W / 2, 8, C.red, 8);
  }

  function drawComputer(t, result) {
    px(0, 0, C.black, W, H);
    px(20, 14, C.dgrey, W - 40, H - 28);
    px(26, 20, C.black, W - 52, H - 40);
    for (let i = 0; i < 6; i++) {
      const len = ((i * 53 + Math.floor(t * 3) * 17) % 140) + 30;
      px(36, 30 + i * 10, i % 3 ? C.dgreen : C.green, len, 3);
    }
    text(result === 'hit' ? 'OK' : 'REINICIANDO...', W / 2, 96, result === 'hit' ? C.green : C.white, 8);
    const x0 = 46;
    const bw = W - 92;
    const y = 120;
    px(x0 - 2, y - 2, C.white, bw + 4, 18);
    px(x0, y, C.black, bw, 14);
    px(x0 + bw * (st.c - st.w / 2), y, C.green, bw * st.w, 14);
    const cx = x0 + bw * st.u;
    px(cx - 1, y - 8, C.yellow, 3, 30);
    px(cx - 4, y - 10, C.yellow, 9, 3);
  }

  // ---------- flow ----------
  const game = GAMES[cfg.game] || GAMES.aim;
  const ROUNDS = cfg.rounds || game.rounds;
  const NEED = Math.min(ROUNDS, cfg.need || game.need);
  let phase = 'intro';
  let round = 0;
  let hits = 0;
  const marks = [];
  let lastResult = null;
  let phaseT = 0;
  let success = false;
  let raf = 0;
  let last = performance.now();
  let closed = false;

  function pips() {
    $('rg-pips').innerHTML = Array.from({ length: ROUNDS }, (_, i) =>
      `<i class="${marks[i] || (i === round && phase === 'play' ? 'now' : '')}"></i>`).join('');
  }
  game.init(0);
  pips();

  function begin() {
    if (phase !== 'intro') return;
    $('rg-start').classList.add('hidden');
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    phase = 'play';
    phaseT = 0;
    lastResult = null;
    sfx('blip');
    pips();
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    phaseT += dt;
    if (phase === 'play' && phaseT > 0.25) {
      const r = game.update(dt);
      if (r) {
        lastResult = r;
        marks[round] = r;
        if (r === 'hit') {
          hits++;
          sfx('success');
          say(['¡BIEN!', '¡ESO!', '¡PERFECTO!'][Math.floor(Math.random() * 3)], C.green);
          burst(W / 2, H / 2, 20, [C.green, C.yellow, C.white], 60);
        } else {
          sfx('fail');
          say(ROUNDS - round - 1 > 0 && hits < NEED ? '¡OTRA VEZ!' : '¡FALLÓ!', C.red);
          canvas.classList.remove('shake');
          void canvas.offsetWidth;
          canvas.classList.add('shake');
        }
        phase = 'feedback';
        phaseT = 0;
        pips();
      }
    } else if (phase === 'feedback' && phaseT > 0.8) {
      const left = ROUNDS - round - 1;
      const done = hits >= NEED || hits + left < NEED || left === 0;
      if (done) {
        success = hits >= NEED;
        phase = 'end';
        phaseT = 0;
        sfx(success ? 'objective' : 'fail');
      } else {
        round++;
        game.init(round);
        phase = 'play';
        phaseT = 0;
        lastResult = null;
        pips();
      }
    } else if (phase === 'end' && phaseT > 1.4) {
      const perfect = success && hits === marks.length && (cfg.game !== 'tap' || st.perfectTap);
      return finish({ success, perfect });
    }

    game.draw(now / 1000, phase === 'feedback' || phase === 'end' ? lastResult : null);
    particlesStep(dt);
    if (popup) {
      popup.age += dt;
      text(popup.str, W / 2, 30 - popup.age * 10, popup.c, 16);
      if (popup.age > 0.8) popup = null;
    }
    if (phase === 'end') {
      px(0, H / 2 - 22, '#000', W, 44);
      text(success ? (main ? '¡LOGRADO!' : '¡REPARADO!') : 'NO SE PUDO...', W / 2, H / 2 - 8, success ? C.green : C.red, 16);
    }
    input.pressed = false;
  }

  function finish(result) {
    if (closed) return;
    closed = true;
    cancelAnimationFrame(raf);
    window.removeEventListener('keydown', onKeyDown, true);
    window.removeEventListener('keyup', onKeyUp, true);
    window.removeEventListener('pointerup', onUp);
    overlay.remove();
    document.body.classList.remove('rg-open');
    onDone(result);
  }

  overlay.addEventListener('click', e => {
    const b = e.target.closest('[data-r]');
    if (!b) return;
    if (b.dataset.r === 'go') begin();
    if (b.dataset.r === 'later') finish(null);
  });
  overlay.querySelector('[data-r="go"]').focus();
  raf = requestAnimationFrame(frame);
  return { close: () => finish(null) };
}
