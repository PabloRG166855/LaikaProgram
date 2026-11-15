// Ascent minigame: fly the ship you built from the launch pad to Earth orbit, then the mission starts.
// Adapted from the team's DART prototype (countdown, power gauge, Max Q, stage separation with a timing ring).
// The build matters here:
//   - ship weight vs. rocket capacity -> smaller green zone and slower climb
//   - ship engine (propulsion level)  -> bigger target for the orbit burn
//   - shielding                       -> softens the damage of a rough flight
import { computeShipStats, getSelectedComponents } from '../ship.js';
import { drawShip, shipModel, shipSize } from './shipRenderer.js';
import { icon } from '../icons.js';
import { sfx, sfxNoise } from '../sfx.js';
import { esc } from '../ui.js';

const W = 320; // internal resolution width; height follows the screen aspect
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const U = 2; // rocket pixel size

const C = {
  black: '#000000', navy: '#1D2B53', plum: '#7E2553', dgreen: '#008751', brown: '#AB5236', dgrey: '#5F574F',
  grey: '#C2C3C7', white: '#FFF1E8', red: '#FF004D', orange: '#FFA300', yellow: '#FFEC27', green: '#00E436',
  blue: '#29ADFF', lav: '#83769C', pink: '#FF77A8', peach: '#FFCCAA'
};
const SKY = ['#29ADFF', '#1F86E0', '#1D5BB0', '#1D2B53', '#111830', '#000000'];
const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];

// ---------- small value noise (for the Earth texture) ----------
function hash(x, y, s) {
  let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
function vnoise(x, y, s) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  return lerp(lerp(hash(xi, yi, s), hash(xi + 1, yi, s), u), lerp(hash(xi, yi + 1, s), hash(xi + 1, yi + 1, s), u), v);
}
const fbm = (x, y, s) => vnoise(x, y, s) * 0.6 + vnoise(x * 2.1, y * 2.1, s + 7) * 0.3 + vnoise(x * 4.3, y * 4.3, s + 13) * 0.1;

function earthTexture(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  const img = g.createImageData(w, h);
  const rgb = hex => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const th = BAYER[y & 3][x & 3] / 16;
      const n = fbm(x / 34, y / 12, 3);
      const cl = fbm(x / 22 + 40, y / 7, 9);
      let col;
      if (cl > 0.66 + th * 0.04) col = C.white;
      else if (cl > 0.62 + th * 0.04) col = C.grey;
      else if (n > 0.64) col = C.green;
      else if (n > 0.56 + th * 0.03) col = C.dgreen;
      else if (n > 0.5 + th * 0.06) col = C.blue;
      else col = C.navy;
      const i = (y * w + x) * 4;
      const [r, gg, b] = rgb(col);
      img.data[i] = r; img.data[i + 1] = gg; img.data[i + 2] = b; img.data[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  return c;
}

export function renderFlight(root, { data, level, design, onDone }) {
  const st = computeShipStats(design, level, data);
  const load = clamp(st.rocketCapacity ? st.totalMass / st.rocketCapacity : 0.6, 0, 1);
  const engine = clamp(st.propulsionLevel || 1, 1, 3);
  const shield = st.shielding || 0;
  const tune = {
    lo: 0.48 + 0.24 * load,        // minimum power outside Max Q (heavier ship needs more)
    qMid: 0.38,
    qHalf: 0.17 - 0.07 * load,     // half-width of the Max Q window (heavier ship = narrower)
    climb: 1.15 - 0.4 * load,      // climb speed
    ringTol: [0, 3, 4.5, 6][engine] // orbit burn: bigger engine = bigger target
  };

  // ---------- your ship as a sprite ----------
  const model = shipModel(getSelectedComponents(design, data));
  const size = shipSize(model);
  const shipImg = document.createElement('canvas');
  shipImg.width = Math.ceil(size.w) + 12;
  shipImg.height = Math.ceil(size.h) + 12;
  drawShip(shipImg.getContext('2d'), model, { x: shipImg.width / 2, y: shipImg.height / 2, scale: 1, time: 0, crewCount: 0 });

  const loadCls = load < 0.6 ? 'good' : load < 0.85 ? 'warn' : 'bad';
  const loadText = load < 0.6 ? 'Ligera: subir será fácil.' : load < 0.85 ? 'Pesada: la zona verde será más chica.' : 'Muy pesada: ¡cuida mucho la potencia!';
  const blocks = (n, total = 12) => Array.from({ length: total }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('');

  root.innerHTML = `
    <div class="flight">
      <canvas id="f-canvas"></canvas>
      <div class="f-top">
        <ol class="f-steps" id="f-steps">
          <li data-ph="ascent">${icon('rocket', 16)} Despegue</li>
          <li data-ph="sep">${icon('box', 16)} Separación</li>
          <li data-ph="orbit">${icon('orbit', 16)} Órbita</li>
        </ol>
        <button class="btn ghost f-skip" data-act="skip">Saltar ${icon('chevron-right', 16)}</button>
      </div>
      <div class="f-action hidden" id="f-action">
        <p id="f-action-text"></p>
        <div class="f-meter hidden" id="f-meter"><i id="f-meter-fill"></i></div>
      </div>
      <div class="f-card glass" id="f-card">
        <h2>${icon('rocket', 28)} ¡Hora de despegar!</h2>
        <p>Vuela tu nave hasta la órbita de la Tierra. Ahí empieza la misión.</p>
        <div class="f-rows">
          <div class="f-row"><span>${icon('weight', 20)} Peso de tu nave</span><span class="blocks big ${loadCls}">${blocks(Math.round(load * 12))}</span></div>
          <p class="f-note ${loadCls}">${loadText}</p>
          <div class="f-row"><span>${icon('flame', 20)} Motor de tu nave</span><span class="blocks">${blocks(engine, 3)}</span></div>
          <div class="f-row"><span>${icon('shield', 20)} Escudo</span><span class="blocks">${blocks(shield, 3)}</span></div>
        </div>
        <p class="f-how">${icon('circle-dot', 18)} Mantén <b>ESPACIO</b> o el clic presionado para dar potencia.</p>
        <button class="btn go" data-act="start">${icon('rocket', 18)} ¡Despegar!</button>
      </div>
      <div class="f-flash" id="f-flash"></div>
    </div>`;

  const $ = id => root.querySelector(`#${id}`);
  const canvas = $('f-canvas');
  const ctx = canvas.getContext('2d');
  let H = 180;

  // ---------- input (one button: hold or tap) ----------
  const input = { held: false, pressed: false };
  const onKeyDown = e => {
    if (e.code !== 'Space' && e.code !== 'Enter') return;
    if (e.target.closest && e.target.closest('button')) return; // let the focused button handle it
    e.preventDefault();
    if (phase === 'intro') { start(); return; }
    if (!e.repeat) input.pressed = true;
    input.held = true;
  };
  const onKeyUp = e => { if (e.code === 'Space' || e.code === 'Enter') input.held = false; };
  const onDown = e => {
    if (e.target.closest('button, .f-card')) return;
    input.pressed = true;
    input.held = true;
  };
  const onUp = () => { input.held = false; };
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('pointerdown', onDown);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('blur', onUp);

  // ---------- HUD helpers ----------
  function setAction(str, meter = false) {
    const el = $('f-action');
    if (!str) { el.classList.add('hidden'); return; }
    el.classList.remove('hidden');
    const p = $('f-action-text');
    if (p.textContent !== str) {
      p.textContent = str;
      p.style.animation = 'none';
      void p.offsetWidth;
      p.style.animation = '';
    }
    $('f-meter').classList.toggle('hidden', !meter);
  }
  const setMeter = v => { $('f-meter-fill').style.width = `${clamp(v, 0, 1) * 100}%`; };
  function setStep(ph) {
    const order = ['ascent', 'sep', 'orbit'];
    const k = order.indexOf(ph);
    root.querySelectorAll('#f-steps li').forEach((li, i) => {
      li.classList.toggle('active', i === k);
      li.classList.toggle('done', i < k);
    });
  }
  function flash() {
    const f = $('f-flash');
    f.classList.remove('on');
    void f.offsetWidth;
    f.classList.add('on');
  }

  // ---------- drawing helpers ----------
  function px(x, y, c, w = 1, h = 1) {
    ctx.fillStyle = c;
    ctx.fillRect(Math.round(x), Math.round(y), w, h);
  }
  function text(str, x, y, c = C.white, sz = 8, align = 'center') {
    ctx.font = `${sz}px "Press Start 2P", monospace`;
    ctx.textAlign = align;
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#000';
    ctx.fillText(str, Math.round(x) + 1, Math.round(y) + 1);
    ctx.fillStyle = c;
    ctx.fillText(str, Math.round(x), Math.round(y));
  }
  function ring(cx, cy, r, c) {
    if (r <= 0) return;
    const step = 0.12 / Math.max(1, r / 10);
    for (let a = 0; a < Math.PI * 2; a += step) px(cx + Math.cos(a) * r, cy + Math.sin(a) * r, c);
  }
  const stars = Array.from({ length: 120 }, () => ({ x: Math.random(), y: Math.random(), a: Math.random(), z: Math.random() < 0.6 ? 1 : Math.random() < 0.7 ? 2 : 3, tw: Math.random() * 6 }));
  function drawStars(dt, vx = 0, vy = 0, alpha = 1) {
    for (const s of stars) {
      s.x = (s.x - (vx * s.z * dt) / W + 1) % 1;
      s.y = (s.y + (vy * s.z * dt) / H + 1) % 1;
      s.tw += dt * 3;
      if (s.a > alpha) continue;
      if (s.z === 3 && Math.sin(s.tw) < -0.6) continue;
      px(s.x * W, s.y * H, s.z === 3 ? C.white : s.z === 2 ? C.grey : C.lav);
    }
  }
  let particles = [];
  function burst(x, y, n, colors, spd = 40, life = 0.8, g = 0, s = 1) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = rand(0.3, 1) * spd;
      particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: rand(life * 0.5, life), c: colors[(Math.random() * colors.length) | 0], g, s });
    }
  }
  function updateParticles(dt) {
    for (const p of particles) { p.life -= dt; p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; }
    particles = particles.filter(p => p.life > 0);
    for (const p of particles) px(p.x, p.y, p.c, p.s, p.s);
  }
  let popups = [];
  const popup = (str, x, y, c = C.yellow, sz = 10) => popups.push({ str, x, y, c, sz, age: 0 });
  function drawPopups(dt) {
    for (const p of popups) {
      p.age += dt;
      // Press Start 2P is crisp at multiples of 8
      text(p.str, p.x, p.y - p.age * 18, p.c, p.sz >= 12 ? 16 : 8);
    }
    popups = popups.filter(p => p.age < 1.3);
  }
  function flame(x, y, len, w0) {
    for (let i = 0; i < len; i++) {
      const w = Math.max(1, w0 - Math.floor(i / 3));
      const c = i < 3 ? C.white : i < 7 ? C.yellow : i < 11 ? C.orange : C.red;
      px(x - Math.floor(w / 2), y + i, c, w, 1);
    }
  }
  /** The launcher: two stages + fairing. yb = bottom of the first stage. */
  function drawRocket(x, yb, thr, parts = { stage1: true, fairing: true }) {
    const x0 = Math.round(x - 3 * U);
    if (parts.stage1) {
      if (thr > 0.02) flame(x, yb + 1, Math.round(6 + thr * 22 + Math.random() * 6), 3 + Math.round(thr * 6));
      px(x0 - 2 * U, yb - 5 * U, C.dgrey, U, 5 * U);
      px(x0 + 7 * U, yb - 5 * U, C.dgrey, U, 5 * U);
      px(x0, yb - 24 * U, C.white, 6 * U, 24 * U);
      px(x0 + 5 * U, yb - 24 * U, C.grey, U, 24 * U);
      px(x0, yb - 24 * U, C.navy, 6 * U, U);
      px(x0, yb - 9 * U, C.red, 6 * U, U);
      px(x0 + U, yb - 20 * U, C.blue, U, 6 * U);
    }
    px(x0, yb - 34 * U, C.white, 6 * U, 10 * U);
    px(x0 + 5 * U, yb - 34 * U, C.grey, U, 10 * U);
    if (parts.fairing) {
      for (let i = 0; i < 9; i++) {
        const w = i < 3 ? 2 + i * 2 : 6;
        px(x - (w * U) / 2, yb - 43 * U + i * U, i < 3 ? C.white : C.grey, w * U, U);
      }
    }
  }
  /** Your ship. vertical = nose up (on the rocket); otherwise nose right. */
  function drawYourShip(x, y, width, vertical = false) {
    const s = width / shipImg.width;
    const w = Math.round(shipImg.width * s);
    const h = Math.round(shipImg.height * s);
    ctx.save();
    ctx.imageSmoothingEnabled = true; // average the big sprite down; the CSS upscale keeps it pixelated
    ctx.imageSmoothingQuality = 'high';
    ctx.translate(Math.round(x), Math.round(y));
    if (vertical) ctx.rotate(-Math.PI / 2);
    ctx.drawImage(shipImg, -Math.round(w / 2), -Math.round(h / 2), w, h);
    ctx.restore();
  }
  // Earth seen from orbit: a big curved horizon at the bottom
  const EARTH_R = 520;
  const earthTex = earthTexture(W + 700, 90);
  function drawEarth(topY, rot) {
    const cy = topY + EARTH_R;
    for (let x = 0; x < W; x++) {
      const dx = x - W / 2;
      const yTop = Math.round(cy - Math.sqrt(EARTH_R * EARTH_R - dx * dx));
      if (yTop >= H) continue;
      const hgt = Math.min(earthTex.height, H - yTop);
      ctx.drawImage(earthTex, Math.floor(x + rot) % earthTex.width, 0, 1, hgt, x, yTop, 1, hgt);
      if (H - yTop > earthTex.height) px(x, yTop + earthTex.height, C.navy, 1, H - yTop - earthTex.height);
      px(x, yTop - 1, C.blue);
      if ((x + Math.floor(rot)) % 2 === 0) px(x, yTop - 2, C.navy);
    }
  }
  /** Timing ring that closes on the green circle. Returns its radius. */
  function timingRing(cx, cy, p, target, color) {
    const r = lerp(56, 0, p);
    ring(cx, cy, target, C.green);
    ring(cx, cy, target + 1, C.green);
    ring(cx, cy, r, color);
    ring(cx, cy, r + 1, color);
    return r;
  }
  const judge = (r, target, tol) => {
    const d = Math.abs(r - target);
    if (d <= tol) return { stars: 3, label: '¡PERFECTO!', color: C.green };
    if (d <= tol * 2.4) return { stars: 2, label: '¡BIEN!', color: C.yellow };
    return { stars: 1, label: 'UFF…', color: C.orange };
  };

  // ---------- state machine ----------
  let phase = 'intro';
  let t = 0;
  let S = {};
  const result = { ascent: 0, sep: 0, orbit: 0 };
  let shake = 0;
  let raf = 0;
  let last = performance.now();
  let finished = false;

  function go(next) {
    phase = next;
    t = 0;
    S = {};
    ENTER[next]?.();
  }

  const ENTER = {
    count() {
      setStep('ascent');
      S = { alt: 0, thr: 0, inBand: 0, total: 0, lastN: 4 };
      setAction('Prepárate: mantén presionado para dar potencia');
    },
    sep() {
      setStep('sep');
      S = { p: 0, done: false, doneT: 0 };
      setAction('¡Separa la etapa cuando el anillo toque el verde!');
    },
    orbit() {
      setStep('orbit');
      S = { p: 0, loops: 0, done: false, doneT: 0, rot: 0 };
      setAction('Enciende tu motor cuando el anillo toque el verde para quedarte en órbita');
    }
  };

  function start() {
    if (phase !== 'intro') return;
    const card = $('f-card');
    card.innerHTML = '';
    card.classList.add('hidden');
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    sfx('blip');
    go('count');
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    t += dt;

    // size the low-res canvas to the screen aspect
    const r = root.getBoundingClientRect();
    const h = clamp(Math.round((W * r.height) / Math.max(1, r.width)), 140, 300);
    if (canvas.width !== W || canvas.height !== h) {
      canvas.width = W;
      canvas.height = h;
      H = h;
      ctx.imageSmoothingEnabled = false;
    }
    ctx.save();
    if (shake > 0) {
      ctx.translate(Math.round(rand(-2, 2) * shake * 10), Math.round(rand(-2, 2) * shake * 10));
      shake = Math.max(0, shake - dt);
    }
    (SCENES[phase] || SCENES.intro)(dt);
    ctx.restore();
    input.pressed = false;
  }

  const groundY = () => H - 22;

  function drawAscentBackground(alt) {
    const k = clamp(alt, 0, 1);
    ctx.fillStyle = SKY[Math.min(SKY.length - 1, Math.floor(k * SKY.length))];
    ctx.fillRect(0, 0, W, H);
    if (k > 0.45) drawStars(0, 0, 0, (k - 0.45) * 2);
    const cam = alt * H * 0.9;
    if (k < 0.85) {
      for (let i = 0; i < 7; i++) {
        const cy = ((i * 53 + cam * 1.7) % (H + 120)) - 60;
        const cx = (i * 71 + 13) % W;
        px(cx, cy, C.white, 30, 5);
        px(cx + 6, cy - 4, C.white, 16, 4);
        px(cx, cy + 5, C.grey, 30, 1);
      }
    }
    const gy = groundY() + cam;
    if (gy < H + 10) {
      px(0, gy, C.dgreen, W, H);
      px(0, gy, C.green, W, 2);
      // launch tower
      px(W / 2 + 18, gy - 100, C.dgrey, 4, 100);
      for (let i = 0; i < 100; i += 8) px(W / 2 + 14, gy - 100 + i, C.grey, 8, 1);
    }
    return cam;
  }

  const SCENES = {
    intro() {
      drawAscentBackground(0);
      drawRocket(W / 2, groundY(), 0);
    },

    count(dt) {
      const cam = drawAscentBackground(S.alt);
      const rx = W / 2;
      const ry = Math.max(groundY() - cam, 43 * U + 18); // keep the nose on screen
      const n = 3 - Math.floor(t);
      if (n !== S.lastN && n >= 0) {
        S.lastN = n;
        sfx(n === 0 ? 'launch' : 'blip');
      }
      if (S.phase !== 'burn') {
        drawRocket(rx, ry, 0);
        text(n > 0 ? String(n) : '¡YA!', W / 2, H * 0.2, C.yellow, 32);
        if (t >= 3.3) {
          S.phase = 'burn';
          setAction('Mantén la aguja en la zona VERDE', true);
        }
      } else {
        const holding = input.held;
        S.thr = clamp(S.thr + (holding ? 1.25 : -1.05) * dt, 0, 1);
        const maxQ = S.alt > 0.32 && S.alt < 0.58;
        const lo = maxQ ? tune.qMid - tune.qHalf : tune.lo;
        const hi = maxQ ? tune.qMid + tune.qHalf : 1.0;
        const ok = S.thr >= lo && S.thr <= hi;
        S.alt += dt * (ok ? 0.15 : 0.06) * (0.4 + S.thr) * tune.climb;
        S.total += dt;
        if (ok) S.inBand += dt;
        if (maxQ && !S.qSaid) {
          S.qSaid = true;
          setAction('¡MAX Q! Mucho aire empujando: baja un poco la potencia', true);
          sfx('alert');
        }
        if (S.qSaid && !S.qDone && S.alt >= 0.58) {
          S.qDone = true;
          setAction('¡Superado! Ahora, ¡potencia máxima!', true);
        }
        setMeter(S.alt);
        drawRocket(rx, ry, S.thr);
        if (S.thr > 0.1 && Math.random() < 0.7) {
          particles.push({ x: rx + rand(-6, 6), y: ry + 20, vx: rand(-24, 24), vy: rand(20, 40), life: 1.1, c: [C.grey, C.white, C.lav][(Math.random() * 3) | 0], g: -10, s: 2 });
        }
        if (holding && Math.random() < 0.35) sfxNoise(0.08, 0.05 * S.thr, 300);
        shake = Math.max(shake, S.thr * 0.06);
        // power gauge
        const gx = W - 34;
        const g0 = 52;
        const gh = H - 96;
        px(gx - 2, g0 - 2, C.white, 18, gh + 4);
        px(gx, g0, C.black, 14, gh);
        px(gx, g0 + gh * (1 - hi), C.dgreen, 14, gh * (hi - lo));
        px(gx, g0 + gh * (1 - S.thr) - 1, ok ? C.green : C.red, 14, 3);
        text('POTENCIA', gx - 20, g0 - 12, C.white, 8);
        if (maxQ) text('MAX Q', gx - 4, g0 + gh + 6, C.orange, 8);
        // altitude bar on the left
        px(10, g0 - 2, C.white, 8, gh + 4);
        px(12, g0, C.black, 4, gh);
        px(12, g0 + gh * (1 - S.alt), C.yellow, 4, gh * S.alt);
        text('ALTURA', 8, g0 - 12, C.white, 8, 'left');
        if (S.alt >= 1) {
          const frac = S.inBand / Math.max(0.1, S.total);
          result.ascent = frac > 0.72 ? 3 : frac > 0.5 ? 2 : 1;
          popup(result.ascent === 3 ? '¡VUELO PERFECTO!' : result.ascent === 2 ? '¡BUEN VUELO!' : '¡LLEGASTE!', W / 2, 24,
            result.ascent === 3 ? C.green : result.ascent === 2 ? C.yellow : C.orange, 16);
          sfx(result.ascent === 3 ? 'success' : 'select');
          go('sep');
          return;
        }
      }
      updateParticles(dt);
      drawPopups(dt);
    },

    sep(dt) {
      ctx.fillStyle = C.black;
      ctx.fillRect(0, 0, W, H);
      drawStars(dt, 0, 40);
      const rx = W / 2;
      const ry = H - 6; // camera reframes on the upper part of the rocket
      if (!S.done) {
        S.p += dt / 1.7;
        drawRocket(rx, ry, 0.6);
        const r = timingRing(rx, ry - 24 * U, clamp(S.p, 0, 1), 10, C.yellow);
        if (input.pressed || S.p > 1.3) {
          const j = input.pressed ? judge(r, 10, 4) : { stars: 1, label: 'SEPARACIÓN AUTOMÁTICA', color: C.orange };
          result.sep = j.stars;
          S.done = true;
          popup(j.label, rx, 24, j.color, input.pressed ? 16 : 8);
          setAction('¡Etapa separada! Sigue subiendo…');
          flash();
          sfxNoise(0.4, 0.15, 900);
          sfx('select');
          burst(rx, ry - 24 * U, 30, [C.white, C.yellow, C.grey], 50, 0.8);
        }
      } else {
        S.doneT += dt;
        const k = S.doneT;
        // first stage falls away
        const fall = k * k * 50;
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, ry - 24 * U + fall, W, H);
        ctx.clip();
        drawRocket(rx, ry + fall, 0, { stage1: true, fairing: false });
        ctx.restore();
        // upper stage climbs
        const up = Math.min(k * 22, 20);
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, W, ry - 24 * U - up + 1);
        ctx.clip();
        drawRocket(rx, ry - up, 0, { stage1: false, fairing: k < 0.9 });
        ctx.restore();
        flame(rx, ry - 24 * U - up + 1, 10 + Math.floor(Math.random() * 6), 5);
        if (k > 0.9) {
          // fairing halves fly off, your ship appears on top
          const o = (k - 0.9) * 50;
          px(rx - 6 * U - o, ry - 43 * U - up + o * 0.4, C.grey, 3 * U, 9 * U);
          px(rx + 3 * U + o, ry - 43 * U - up + o * 0.4, C.grey, 3 * U, 9 * U);
          drawYourShip(rx, ry - 34 * U - up - 18, 36, true);
          if (!S.reveal) {
            S.reveal = true;
            sfx('objective');
          }
          text('¡TU NAVE!', rx + 34, ry - 34 * U - up - 22, C.yellow, 8, 'left');
        }
        // Earth horizon rises from below: we reached space
        drawEarth(H + 30 - Math.min(1, k / 2.2) * 70, k * 8);
        if (k > 2.6) {
          particles = [];
          go('orbit');
          return;
        }
      }
      updateParticles(dt);
      drawPopups(dt);
    },

    orbit(dt) {
      ctx.fillStyle = C.black;
      ctx.fillRect(0, 0, W, H);
      S.rot += dt * (S.done ? 26 : 14);
      drawStars(dt, S.done ? 24 : 10, 0);
      drawEarth(H - 44, S.rot);
      const sx = W / 2 - 10;
      const sy = H * 0.42 + Math.sin(t * 2) * 1.5;
      // upper stage drifting away
      if (t < 3) {
        const o = t * 14;
        px(sx - 40 - o, sy + 6 + o * 0.3, C.grey, 14, 7);
        px(sx - 40 - o, sy + 6 + o * 0.3, C.white, 14, 2);
      }
      if (!S.done) {
        // dotted path: falling back if you don't burn
        for (let i = 0; i < 26; i++) {
          const x = sx + 24 + i * 7;
          const y = sy + (i * i) * 0.12;
          if (y < H - 30) px(x, y, i % 2 ? C.red : C.dgrey);
        }
        S.p += dt / 1.6;
        if (S.p > 1.25) {
          S.p = 0;
          S.loops++;
        }
        drawYourShip(sx, sy, 50);
        const target = 12;
        const r = timingRing(sx, sy, clamp(S.p, 0, 1), target, C.blue);
        if (input.pressed || S.loops >= 3) {
          const j = input.pressed ? judge(S.p > 1 ? 99 : r, target, tune.ringTol) : { stars: 1, label: 'ENCENDIDO AUTOMÁTICO', color: C.orange };
          result.orbit = j.stars;
          S.done = true;
          popup(j.label, sx, sy - 44, j.color, input.pressed ? 16 : 8);
          sfx(j.stars >= 2 ? 'success' : 'select');
          setAction('¡Motor encendido!');
        }
      } else {
        S.doneT += dt;
        if (S.doneT < 1.2) drawBurn(sx - 26, sy);
        // orbit line: follows the curve of the Earth
        const cy = H - 44 + EARTH_R;
        const R = cy - sy;
        const prog = clamp(S.doneT / 1.2, 0, 1);
        for (let x = 0; x < W * prog; x += 3) {
          const dx = x - W / 2;
          const y = cy - Math.sqrt(R * R - dx * dx);
          px(x, y, C.yellow);
        }
        drawYourShip(sx, sy, 50);
        if (S.doneT > 1.2) text('¡EN ÓRBITA!', sx, Math.max(8, sy - 52), C.green, 16);
        if (S.doneT > 2.4 && !S.ended) {
          S.ended = true;
          showEnd();
        }
      }
      updateParticles(dt);
      drawPopups(dt);
    }
  };
  function drawBurn(x, y) {
    // horizontal flame pointing left
    const len = 10 + Math.floor(Math.random() * 6);
    for (let i = 0; i < len; i++) {
      const hgt = Math.max(1, 5 - Math.floor(i / 3));
      const c = i < 3 ? C.white : i < 7 ? C.yellow : i < 10 ? C.orange : C.red;
      px(x - i, y - Math.floor(hgt / 2), c, 1, hgt);
    }
  }

  // ---------- results ----------
  function computeLaunchInfo(skipped = false) {
    const r = skipped ? { ascent: 2, sep: 2, orbit: 2 } : result;
    let damage = (r.ascent === 1 ? 8 : r.ascent === 2 ? 3 : 0) + (r.sep === 1 ? 4 : 0) + (r.orbit === 1 ? 5 : r.orbit === 2 ? 2 : 0);
    const raw = damage;
    if (shield > 0) damage = Math.round(damage * (shield >= 2 ? 0.5 : 0.75));
    return {
      anomalyDamage: damage,
      flight: { stars: { ...r }, total: r.ascent + r.sep + r.orbit, shieldSaved: raw - damage, skipped }
    };
  }
  const starRow = n => [1, 2, 3].map(i => `<span class="f-star ${i <= n ? 'on' : ''}">${icon('star', 18)}</span>`).join('');

  function showEnd() {
    const info = computeLaunchInfo();
    const f = info.flight;
    setAction(null);
    sfx(f.total >= 7 ? 'win' : 'objective');
    const card = $('f-card');
    card.classList.add('end');
    card.classList.remove('hidden');
    card.innerHTML = `
      <h2>${icon('orbit', 28)} ¡Llegaste a la órbita!</h2>
      <div class="f-rows">
        <div class="f-row"><span>${icon('rocket', 20)} Despegue</span><span>${starRow(f.stars.ascent)}</span></div>
        <div class="f-row"><span>${icon('box', 20)} Separación</span><span>${starRow(f.stars.sep)}</span></div>
        <div class="f-row"><span>${icon('orbit', 20)} Órbita</span><span>${starRow(f.stars.orbit)}</span></div>
      </div>
      <p class="f-note ${info.anomalyDamage ? 'warn' : 'good'}">
        ${info.anomalyDamage
          ? `${icon('heart', 18)} El viaje sacudió la nave: empieza con ${100 - info.anomalyDamage}% de vida.`
          : `${icon('heart', 18)} ¡Vuelo perfecto! La nave llega intacta.`}
        ${f.shieldSaved > 0 ? `<br>${icon('shield', 18)} Tu escudo la protegió un poco.` : ''}
      </p>
      <p class="f-how">Ahora sí: rumbo a ${esc(level.destinationName)}.</p>
      <button class="btn go" data-act="done">Empezar la misión ${icon('arrow-right', 18)}</button>`;
    card.querySelector('[data-act="done"]').focus();
  }

  function finish(skipped = false) {
    if (finished) return;
    finished = true;
    cancelAnimationFrame(raf);
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('blur', onUp);
    onDone(computeLaunchInfo(skipped));
  }

  root.onclick = e => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    if (b.dataset.act === 'start') start();
    if (b.dataset.act === 'skip') finish(true);
    if (b.dataset.act === 'done') finish(false);
  };

  raf = requestAnimationFrame(frame);
}
