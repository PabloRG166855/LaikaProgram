/* Motor pixel compartido por todos los minijuegos espaciales.
 * Expone window.PX con: lienzo, dibujo pixel, esferas, estrellas, partículas,
 * textos flotantes, sonido y música 8-bit, entrada (teclado/ratón/táctil),
 * interfaz (instrucción, medidor, dato NASA, fases, puntuación, resultado) y bucle de escenas.
 * Cada minijuego llama a PX.start({ scenes, enter, ... }).
 */
(() => {
  'use strict';

  const W = 320;
  const H = 180;
  const canvas = document.getElementById('screen');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const $ = (id) => document.getElementById(id);

  // ---------- Utilidades ----------
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const rand = (a, b) => a + Math.random() * (b - a);
  const BAYER = [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1, 9],
    [15, 7, 13, 5],
  ];
  function hash(x, y, s) {
    let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
    h = (h ^ (h >>> 13)) * 1274126177;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
  }
  function vnoise(x, y, s) {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;
    const u = xf * xf * (3 - 2 * xf);
    const v = yf * yf * (3 - 2 * yf);
    return lerp(lerp(hash(xi, yi, s), hash(xi + 1, yi, s), u), lerp(hash(xi, yi + 1, s), hash(xi + 1, yi + 1, s), u), v);
  }
  const fbm = (x, y, s) => vnoise(x, y, s) * 0.6 + vnoise(x * 2.1, y * 2.1, s + 7) * 0.3 + vnoise(x * 4.3, y * 4.3, s + 13) * 0.1;

  // ---------- Sonido y música ----------
  let audio = null;
  let master = null;
  let muted = false;
  function initAudio() {
    if (audio) {
      if (audio.state === 'suspended') audio.resume();
      return;
    }
    try {
      audio = new (window.AudioContext || window.webkitAudioContext)();
      master = audio.createGain();
      master.connect(audio.destination);
      startMusic();
    } catch {
      audio = null;
    }
  }
  function tone(freq, dur = 0.1, type = 'square', vol = 0.06, slideTo = null, delay = 0) {
    if (!audio || muted) return;
    const t0 = audio.currentTime + delay;
    const o = audio.createOscillator();
    const g = audio.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(master);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  }
  function noise(dur = 0.3, vol = 0.15, freq = 800) {
    if (!audio || muted) return;
    const len = Math.floor(audio.sampleRate * dur);
    const buf = audio.createBuffer(1, len, audio.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = audio.createBufferSource();
    src.buffer = buf;
    const f = audio.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = freq;
    const g = audio.createGain();
    g.gain.value = vol;
    src.connect(f).connect(g).connect(master);
    src.start();
  }
  const arp = (notes, step = 0.09, type = 'square', vol = 0.05) => notes.forEach((n, i) => tone(n, step * 1.6, type, vol, null, i * step));
  const NOTE = (n) => 440 * Math.pow(2, (n - 69) / 12);
  const SONGS = {
    calm: { bpm: 96, bass: [45, 45, 41, 41, 43, 43, 40, 40], lead: [69, 72, 76, 72, 65, 69, 72, 69, 67, 71, 74, 71, 64, 67, 71, 67] },
    action: { bpm: 138, bass: [45, 45, 45, 45, 41, 41, 43, 43], lead: [69, 76, 72, 76, 69, 76, 72, 76, 65, 72, 69, 72, 67, 74, 71, 74] },
    tense: { bpm: 120, bass: [40, 40, 40, 40, 41, 41, 41, 41], lead: [64, 0, 67, 0, 64, 0, 70, 0, 65, 0, 68, 0, 65, 0, 71, 0] },
  };
  let song = 'calm';
  let musicOn = true;
  let nextBeat = 0;
  let beatIdx = 0;
  function startMusic() {
    nextBeat = audio.currentTime + 0.1;
    setInterval(() => {
      if (!audio || muted || !musicOn) {
        if (audio) nextBeat = audio.currentTime + 0.05;
        return;
      }
      const s = SONGS[song];
      const step = 60 / s.bpm / 2;
      while (nextBeat < audio.currentTime + 0.2) {
        const i = beatIdx++;
        const delay = nextBeat - audio.currentTime;
        const lead = s.lead[i % s.lead.length];
        if (lead) tone(NOTE(lead), step * 0.9, 'square', 0.018, null, delay);
        if (i % 2 === 0) tone(NOTE(s.bass[(i / 2) % s.bass.length]), step * 1.8, 'triangle', 0.05, null, delay);
        if (song !== 'calm' && i % 4 === 2) setTimeout(() => noise(0.04, 0.03, 6000), Math.max(0, delay * 1000));
        nextBeat += step;
      }
    }, 50);
  }
  const setSong = (name, on = true) => {
    song = name;
    musicOn = on;
  };

  // ---------- Dibujo pixel ----------
  function px(x, y, c, w = 1, h = 1) {
    ctx.fillStyle = c;
    ctx.fillRect(Math.round(x), Math.round(y), w, h);
  }
  function text(str, x, y, c = '#f4f1de', size = 8, align = 'left') {
    if (window.T) str = window.T(str);
    ctx.font = `${size}px "Press Start 2P", monospace`;
    ctx.textAlign = align;
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#000';
    ctx.fillText(str, Math.round(x) + 1, Math.round(y) + 1);
    ctx.fillStyle = c;
    ctx.fillText(str, Math.round(x), Math.round(y));
  }
  function ring(cx, cy, r, c, step = 0.12) {
    if (r <= 0) return;
    for (let a = 0; a < Math.PI * 2; a += step / Math.max(1, r / 10)) px(cx + Math.cos(a) * r, cy + Math.sin(a) * r, c);
  }
  function line(x0, y0, x1, y1, c) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let i = 0; i <= n; i++) px(lerp(x0, x1, i / n), lerp(y0, y1, i / n), c);
  }
  function clear(c = '#05060f') {
    ctx.fillStyle = c;
    ctx.fillRect(0, 0, W, H);
  }
  function scanlines(alpha = 0.18) {
    ctx.fillStyle = `rgba(0,0,0,${alpha})`;
    for (let y = 0; y < H; y += 2) ctx.fillRect(0, y, W, 1);
  }
  function flame(x, y, len, w0 = 5, dir = 1) {
    for (let i = 0; i < len; i++) {
      const w = Math.max(1, w0 - Math.floor(i / 3));
      const c = i < 3 ? '#fff3b0' : i < 7 ? '#ffcc33' : i < 10 ? '#ff8c42' : '#ff4d6d';
      px(x - Math.floor(w / 2), y + i * dir, c, w, 1);
    }
  }

  // Esferas pixeladas con sombreado y tramado
  const PAL = {
    ocean: ['#0b1340', '#1b3a8a', '#2f6fd6', '#5fa8ff'],
    land: ['#0f2a12', '#1f5c2a', '#3a9a3e', '#7fd16b'],
    cloud: ['#4a5170', '#8f98bd', '#dfe6ff', '#ffffff'],
    rock: ['#120f0c', '#2e2721', '#51463b', '#7a6b5a', '#a8977f', '#cfc0a6'],
    rock2: ['#0e0d0c', '#2a2724', '#4b4640', '#706960', '#9a9184', '#c4bbad'],
    moon: ['#1a1a20', '#3a3a44', '#62626e', '#8e8e9a', '#b9b9c4', '#e2e2ea'],
  };
  const LIGHT = (() => {
    const l = [-0.6, -0.45, 0.66];
    const m = Math.hypot(...l);
    return l.map((v) => v / m);
  })();
  const sphereCache = new Map();
  function sphere(kind, r, rot = 0, seed = 1) {
    const key = `${kind}|${r}|${Math.round(rot * 20)}|${seed}`;
    if (sphereCache.has(key)) return sphereCache.get(key);
    const size = r * 2 + 1;
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    const g = c.getContext('2d');
    const img = g.createImageData(size, size);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = (x - r) / r;
        const dy = (y - r) / r;
        const round = kind === 'earth' || kind === 'moon';
        const wob = round ? 0 : (fbm(Math.atan2(dy, dx) * 1.3 + 5, seed, seed) - 0.5) * 0.22;
        const d2 = dx * dx + dy * dy;
        if (d2 > (1 + wob) * (1 + wob) * 0.98) continue;
        const nz = Math.sqrt(Math.max(0, 1 - Math.min(1, d2)));
        let lam = clamp(dx * LIGHT[0] + dy * LIGHT[1] + nz * LIGHT[2], 0, 1);
        const u = Math.atan2(dx, nz) + rot;
        const v = dy;
        const th = BAYER[y & 3][x & 3] / 16 - 0.5;
        let col;
        if (kind === 'earth') {
          const n = fbm(u * 2.2 + 10, v * 2.2 + 3, 3);
          const cl = fbm(u * 3 + 40 + rot, v * 4, 9);
          let pal = n > 0.55 ? PAL.land : PAL.ocean;
          if (Math.abs(v) > 0.82 || cl > 0.66) pal = PAL.cloud;
          col = pal[clamp(Math.floor(lam * pal.length * 1.05 + th), 0, pal.length - 1)];
        } else {
          const pal = PAL[kind] || PAL.rock;
          const n = fbm(u * 3 + seed, v * 3 + seed, seed);
          const crater = fbm(u * 6 + seed * 3, v * 6, seed + 5);
          lam = lam * (0.75 + n * 0.45) - (crater > 0.7 ? 0.25 : 0) + (crater > 0.66 && crater < 0.7 ? 0.15 : 0);
          col = pal[clamp(Math.floor(lam * pal.length + th), 0, pal.length - 1)];
        }
        const i = (y * size + x) * 4;
        img.data[i] = parseInt(col.slice(1, 3), 16);
        img.data[i + 1] = parseInt(col.slice(3, 5), 16);
        img.data[i + 2] = parseInt(col.slice(5, 7), 16);
        img.data[i + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
    if (sphereCache.size > 500) sphereCache.clear();
    sphereCache.set(key, c);
    return c;
  }
  function drawSphere(kind, x, y, r, rot = 0, seed = 1) {
    if (r < 1) return px(x, y, '#a8977f');
    if (x + r < -4 || x - r > W + 4 || y + r < -4 || y - r > H + 4) return;
    const rr = Math.min(64, Math.round(r));
    const img = sphere(kind, rr, rot, seed);
    const s = Math.round(img.width * (r / rr));
    ctx.drawImage(img, Math.round(x - s / 2), Math.round(y - s / 2), s, s);
  }

  /** Tierra vista desde órbita baja (curva en la parte inferior), con día o noche. */
  function earthLimb(scroll, { cy = 520, r = 420, day = 1 } = {}) {
    const cx = 160;
    for (let x = 0; x < W; x += 2) {
      const yTop = cy - Math.sqrt(Math.max(0, r * r - (x - cx) * (x - cx)));
      if (yTop > H) continue;
      for (let y = Math.max(0, Math.floor(yTop)); y < H; y += 2) {
        const u = (x + scroll) * 0.025;
        const v = (y - yTop) * 0.05;
        const n = fbm(u, v, 3);
        const cl = fbm(u * 1.6 + 20, v * 2, 9);
        let c;
        if (day) c = cl > 0.64 ? '#e8eeff' : n > 0.56 ? '#3a8a3e' : '#2a5fc0';
        else c = cl > 0.64 ? '#1a1f3a' : n > 0.56 ? (hash(Math.floor(u * 9), Math.floor(v * 9), 4) > 0.93 ? '#ffd27a' : '#0d1a10') : '#06102a';
        if (y - yTop < 4) c = day ? '#9fd4ff' : '#13204a';
        px(x, y, c, 2, 2);
      }
      px(x, yTop - 2, day ? '#4cc9f0' : '#1d3480', 2, 2);
    }
  }

  // Estrellas con paralaje
  const stars = Array.from({ length: 130 }, () => ({ x: Math.random() * W, y: Math.random() * H, z: Math.random() < 0.6 ? 1 : Math.random() < 0.7 ? 2 : 3, tw: Math.random() * 6 }));
  function drawStars(dt, speed = 4, streak = 0, vy = 0) {
    for (const s of stars) {
      s.x -= speed * s.z * dt;
      s.y -= vy * s.z * dt;
      s.tw += dt * 3;
      if (s.x < -20) {
        s.x = W + rand(0, 20);
        s.y = Math.random() * H;
      }
      if (s.x > W + 20) {
        s.x = -rand(0, 20);
        s.y = Math.random() * H;
      }
      if (s.y < -4) s.y = H + 2;
      if (s.y > H + 4) s.y = -2;
      const c = s.z === 3 ? '#ffffff' : s.z === 2 ? '#c9d4ff' : '#6e76a8';
      if (streak > 0) px(s.x, s.y, c, Math.max(1, Math.round(streak * s.z)), 1);
      else if (s.z !== 3 || Math.sin(s.tw) > -0.6) px(s.x, s.y, c);
    }
  }

  // Partículas y textos flotantes
  let particles = [];
  function burst(x, y, n, colors, spd = 40, life = 0.8, gravity = 0, size = 1, dir = null, spread = Math.PI * 2) {
    for (let i = 0; i < n; i++) {
      const a = dir === null ? Math.random() * Math.PI * 2 : dir + rand(-spread / 2, spread / 2);
      const v = rand(0.3, 1) * spd;
      particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: rand(life * 0.5, life), c: colors[(Math.random() * colors.length) | 0], g: gravity, s: size });
    }
  }
  function updateParticles(dt) {
    for (const p of particles) {
      p.life -= dt;
      p.vy += p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    particles = particles.filter((p) => p.life > 0);
    for (const p of particles) px(p.x, p.y, p.c, p.s, p.s);
  }
  let popups = [];
  const popup = (str, x, y, c = '#ffcc33', size = 10) => popups.push({ str, x, y, c, size, age: 0 });
  function drawPopups(dt) {
    for (const p of popups) {
      p.age += dt;
      const s = p.age < 0.15 ? p.size * (0.5 + p.age * 4) : p.size;
      text(p.str, p.x, p.y - p.age * 18, p.c, Math.max(4, Math.round(s)), 'center');
    }
    popups = popups.filter((p) => p.age < 1.2);
  }

  /** Anillo que se cierra sobre el círculo verde (juego de ritmo). */
  function drawTimingRing(cx, cy, p, color = '#ffcc33') {
    const r = lerp(46, 0, p);
    ring(cx, cy, 8, '#5cff8a');
    ring(cx, cy, 9, '#5cff8a');
    ring(cx, cy, r, color, 0.08);
    ring(cx, cy, r + 1, color, 0.08);
    return r;
  }
  function judgeRing(r) {
    const d = Math.abs(r - 8.5);
    if (d <= 3.5) return { stars: 3, label: '¡PERFECTO!', color: '#5cff8a' };
    if (d <= 9) return { stars: 2, label: '¡BIEN!', color: '#ffcc33' };
    return { stars: 1, label: 'UFF...', color: '#ff8c42' };
  }

  // ---------- Entrada ----------
  const stage = $('stage');
  const input = { held: false, key: false, tap: null, keys: new Set(), pointer: null, pointerDown: false };
  const toCanvas = (e) => {
    const r = canvas.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
  };
  const GAME_KEYS = ['Space', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyA', 'KeyD', 'KeyW', 'KeyS'];
  window.addEventListener('keydown', (e) => {
    if (!GAME_KEYS.includes(e.code)) return;
    if (document.activeElement?.tagName === 'BUTTON' && e.code === 'Enter') return;
    e.preventDefault();
    initAudio();
    if (e.code === 'Space' || e.code === 'Enter') {
      if (!e.repeat) input.key = true;
      input.held = true;
    } else input.keys.add({ KeyA: 'ArrowLeft', KeyD: 'ArrowRight', KeyW: 'ArrowUp', KeyS: 'ArrowDown' }[e.code] || e.code);
  });
  window.addEventListener('keyup', (e) => {
    if (e.code === 'Space' || e.code === 'Enter') input.held = false;
    input.keys.delete({ KeyA: 'ArrowLeft', KeyD: 'ArrowRight', KeyW: 'ArrowUp', KeyS: 'ArrowDown' }[e.code] || e.code);
  });
  stage.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button, a, .panel')) return;
    initAudio();
    input.tap = toCanvas(e);
    input.pointer = input.tap;
    input.held = true;
    input.pointerDown = true;
  });
  window.addEventListener('pointermove', (e) => (input.pointer = toCanvas(e)));
  window.addEventListener('pointerup', () => {
    input.held = false;
    input.pointerDown = false;
  });
  window.addEventListener('blur', () => {
    input.held = false;
    input.keys.clear();
  });
  const action = () => input.key || !!input.tap;
  /** Dirección -1..1 de las flechas (o WASD). */
  const axis = () => ({
    x: (input.keys.has('ArrowRight') ? 1 : 0) - (input.keys.has('ArrowLeft') ? 1 : 0),
    y: (input.keys.has('ArrowDown') ? 1 : 0) - (input.keys.has('ArrowUp') ? 1 : 0),
  });

  // ---------- Interfaz ----------
  const ui = {
    title: $('title'),
    action: $('action'),
    actionText: $('action-text'),
    meter: $('meter'),
    meterFill: $('meter-fill'),
    fact: $('fact'),
    factText: $('fact-text'),
    result: $('result'),
    sources: $('sources'),
    flash: $('flash'),
    mute: $('mute'),
    score: $('score'),
    scoreVal: $('score-val'),
    steps: [...document.querySelectorAll('#steps li')],
  };
  function setAction(str, showMeter = false) {
    if (!str) return ui.action.classList.add('hidden');
    ui.action.classList.remove('hidden');
    if (ui.actionText.textContent !== str) {
      ui.actionText.textContent = str;
      ui.actionText.style.animation = 'none';
      void ui.actionText.offsetWidth;
      ui.actionText.style.animation = '';
    }
    ui.meter.classList.toggle('hidden', !showMeter);
  }
  const setMeter = (v) => (ui.meterFill.style.width = `${clamp(v, 0, 1) * 100}%`);
  let factTimer = 0;
  /** Muestra un dato NASA; se oculta solo a los `secs` segundos para dejar ver el juego. */
  function setFact(str, secs = 7) {
    clearTimeout(factTimer);
    if (!str) return ui.fact.classList.add('hidden');
    if (secs) factTimer = setTimeout(() => ui.fact.classList.add('hidden'), secs * 1000);
    if (ui.factText.textContent === str && !ui.fact.classList.contains('hidden')) return;
    ui.factText.textContent = str;
    ui.fact.classList.remove('hidden');
    ui.fact.style.animation = 'none';
    void ui.fact.offsetWidth;
    ui.fact.style.animation = '';
  }
  function setStep(k) {
    ui.steps.forEach((li, i) => {
      li.classList.toggle('active', i === k);
      li.classList.toggle('done', i < k);
    });
  }
  function flash(color = '#fff') {
    ui.flash.style.background = color;
    ui.flash.classList.remove('on');
    void ui.flash.offsetWidth;
    ui.flash.classList.add('on');
  }
  let muteHandlers = [];
  ui.mute?.addEventListener('click', () => {
    initAudio();
    muted = !muted;
    if (window.PXI) window.PXI.set(ui.mute, muted ? 'mute' : 'sound');
    ui.mute.setAttribute('aria-label', muted ? 'Activar sonido' : 'Silenciar sonido');
    muteHandlers.forEach((f) => f(muted));
  });
  $('sources-btn')?.addEventListener('click', () => ui.sources.classList.remove('hidden'));
  $('sources-close')?.addEventListener('click', () => ui.sources.classList.add('hidden'));

  // ---------- Puntuación ----------
  const game = { score: 0, stars: {}, startTime: 0 };
  function addScore(pts) {
    game.score += pts;
    if (ui.scoreVal) ui.scoreVal.textContent = game.score;
    ui.score?.classList.remove('bump');
    void ui.score?.offsetWidth;
    ui.score?.classList.add('bump');
  }
  function award(phase, stars, x = 160, y = 70, label) {
    game.stars[phase] = stars;
    addScore(stars * 100);
    if (label) popup(label, x, y, stars === 3 ? '#5cff8a' : stars === 2 ? '#ffcc33' : '#ff8c42', 11);
    popup(`+${stars * 100}`, x, y + 16, '#f4f1de', 7);
    if (stars === 3) arp([784, 988, 1175], 0.06, 'square', 0.05);
    else tone(660, 0.12, 'square', 0.05);
  }
  function resetGame() {
    game.score = 0;
    game.stars = {};
    game.startTime = performance.now();
    if (ui.scoreVal) ui.scoreVal.textContent = '0';
    particles = [];
    popups = [];
  }
  /** Rellena el panel de resultado estándar (#result-stars, #result-rank). */
  function fillResult(phases, storageKey) {
    const total = phases.reduce((s, p) => s + (game.stars[p] || 0), 0);
    const max = phases.length * 3;
    const starsEl = $('result-stars');
    if (starsEl)
      starsEl.innerHTML = phases
        .map((p) => {
          const n = game.stars[p] || 0;
          const ic = (k) => (window.PXI ? window.PXI.svg(k) : '*');
          return `<span class="grp">${ic('star').repeat(n)}${ic('staroff').repeat(3 - n)}</span>`;
        })
        .join('');
    let best = game.score;
    try {
      best = Math.max(+localStorage.getItem(storageKey) || 0, game.score);
      localStorage.setItem(storageKey, String(best));
    } catch {}
    const secs = Math.round((performance.now() - game.startTime) / 1000);
    const rank = total >= max * 0.85 ? 'Élite' : total >= max * 0.6 ? 'Equipo de misión' : 'Cadete del espacio';
    const rankEl = $('result-rank');
    if (rankEl) rankEl.textContent = `Rango: ${rank} · ${game.score} pts · récord ${best} · ${secs} s`;
    arp([523, 659, 784, 1046, 784, 1046], 0.11, 'square', 0.05);
    return { total, max, best, secs, rank };
  }

  // ---------- Bucle de escenas ----------
  const state = { scene: null, t: 0, shake: 0, st: {} };
  let def = null;
  function go(name) {
    state.scene = name;
    state.t = 0;
    state.st = {};
    def.enter?.[name]?.(state.st);
  }
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    state.t += dt;
    state.shake = Math.max(0, state.shake - dt);
    ctx.save();
    if (state.shake > 0) {
      const m = Math.min(1, state.shake * 3) * 3;
      ctx.translate(Math.round(rand(-m, m)), Math.round(rand(-m, m)));
    }
    def.scenes[state.scene]?.(dt, state.st, state.t);
    ctx.restore();
    input.key = false;
    input.tap = null;
    requestAnimationFrame(frame);
  }
  function start(definition) {
    def = definition;
    const boot = () => {
      go(def.first || 'title');
      requestAnimationFrame(frame);
    };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(boot);
    else boot();
    if (new URLSearchParams(location.search).has('debug')) window.__px = () => ({ scene: state.scene, st: state.st, t: state.t, game });
  }

  window.PX = {
    W, H, canvas, ctx, ui, input, game, state, PAL,
    clamp, lerp, rand, hash, fbm,
    px, text, ring, line, clear, scanlines, flame, drawSphere, drawStars, earthLimb,
    burst, updateParticles, popup, drawPopups, drawTimingRing, judgeRing,
    initAudio, tone, noise, arp, setSong,
    action, axis,
    setAction, setMeter, setFact, setStep, flash,
    addScore, award, resetGame, fillResult,
    go, start,
    shake: (v) => (state.shake = Math.max(state.shake, v)),
    get particles() { return particles; },
    set particles(v) { particles = v; },
    onMute: (f) => muteHandlers.push(f),
  };
})();
