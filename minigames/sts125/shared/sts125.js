/* Sprites compartidos de la misión STS-125 (Atlantis + Hubble, mayo 2009).
 * Expone window.STS con dibujos pixel reutilizables por todos los minijuegos de la misión.
 */
(() => {
  'use strict';
  const P = window.PX;
  const { px, text, ring, rand, clamp, lerp } = P;

  const scaled = (x, y, s, flip = false) => (dx, dy, w, h, c) =>
    px(x + (flip ? -dx - w : dx) * s, y + dy * s, c, Math.max(1, Math.round(w * s)), Math.max(1, Math.round(h * s)));

  /** Telescopio Hubble de pie. armsOpen = paneles solares desplegados. tilt en px de inclinación visual. */
  function drawHubble(x, y, s, t, { armsOpen = true, pin = false, pinColor = '#ffcc33' } = {}) {
    const R = scaled(x, y, s);
    if (armsOpen) {
      for (const side of [-1, 1]) {
        const ax = side < 0 ? -44 : 14;
        R(side < 0 ? -14 : 10, 8, 4, 2, '#8b8fb3');
        R(ax, -2, 30, 22, '#1b2a6b');
        for (let i = 0; i < 30; i += 3) R(ax + i, -2, 1, 22, '#3a55b8');
        for (let j = 0; j < 22; j += 4) R(ax, -2 + j, 30, 1, '#3a55b8');
      }
    }
    R(-10, -40, 20, 70, '#d9dce6');
    R(-10, -40, 4, 70, '#f4f5fa');
    R(6, -40, 4, 70, '#a9adbd');
    for (let i = -36; i < 30; i += 9) R(-10, i, 20, 1, '#9aa0b8');
    R(-10, -44, 20, 4, '#c9ccd8');
    R(-12, -52, 14, 2, '#c9ccd8');
    R(-12, 30, 24, 16, '#c9ccd8');
    R(-12, 30, 24, 1, '#8b8fb3');
    R(-6, 34, 8, 8, '#555a6e');
    if (Math.floor(t * 2) % 2 === 0) R(7, 33, 1, 1, '#ff4d6d');
    // punto de agarre para el brazo robótico
    if (pin) {
      R(10, -4, 6, 6, '#22243a');
      R(11, -3, 4, 4, pinColor);
    }
  }
  /** Posición (en pantalla) del punto de agarre del Hubble. */
  const hubblePin = (x, y, s) => ({ x: x + 13 * s, y: y - 1 * s });

  /** Astronauta flotando: traje blanco, visor dorado. */
  function drawAstronaut(x, y, s = 1, t = 0, flip = false, stripe = '#ff4d6d') {
    const R = scaled(x, y, s, flip);
    R(-4, -4, 8, 10, '#f2f3f7');
    R(-6, -3, 2, 8, '#d9dce6');
    R(-3, -10, 6, 6, '#f2f3f7');
    R(-2, -9, 4, 3, '#ffcc33');
    R(-1, -9, 1, 1, '#fff3b0');
    R(4, -2 + Math.sin(t * 3), 4, 2, '#f2f3f7');
    R(-3, 6, 2, 4, '#f2f3f7');
    R(1, 6, 2, 4, '#f2f3f7');
    R(-4, 0, 8, 1, stripe);
  }

  /** Bodega del transbordador Atlantis, con las puertas abiertas. */
  function drawShuttleBay(y, { cradle = false, cradleColor = '#8b8fb3' } = {}) {
    px(30, y, '#8b8fb3', 260, 18);
    px(30, y, '#c9ccd8', 260, 3);
    for (let i = 40; i < 290; i += 20) px(i, y + 3, '#555a6e', 2, 15);
    px(20, y - 10, '#f2f3f7', 14, 28);
    px(286, y - 10, '#f2f3f7', 14, 28);
    px(22, y - 8, '#9fb3d9', 10, 24);
    px(288, y - 8, '#9fb3d9', 10, 24);
    text('ATLANTIS', 160, y + 7, '#22243a', 5, 'center');
    if (cradle) {
      // soporte donde se apoya el Hubble
      px(144, y - 6, cradleColor, 32, 6);
      px(140, y - 10, cradleColor, 4, 10);
      px(176, y - 10, cradleColor, 4, 10);
    }
  }

  /** Brazo robótico de 2 tramos (cinemática inversa) desde el hombro hasta (tx, ty). */
  function drawArm(sx, sy, tx, ty, open = true, L1 = 80, L2 = 80) {
    const dx = tx - sx;
    const dy = ty - sy;
    const d = clamp(Math.hypot(dx, dy), 1, L1 + L2 - 1);
    const a = Math.atan2(dy, dx);
    const b = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
    const ex = sx + Math.cos(a - b) * L1;
    const ey = sy + Math.sin(a - b) * L1;
    const seg = (x0, y0, x1, y1) => {
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
      for (let i = 0; i <= n; i++) {
        const x = x0 + ((x1 - x0) * i) / n;
        const y = y0 + ((y1 - y0) * i) / n;
        px(x - 2, y - 2, '#f2f3f7', 4, 4);
        if (i % 6 === 0) px(x - 2, y - 2, '#c9ccd8', 4, 1);
      }
    };
    seg(sx, sy, ex, ey);
    seg(ex, ey, tx, ty);
    px(sx - 4, sy - 4, '#555a6e', 8, 8);
    px(ex - 3, ey - 3, '#555a6e', 6, 6);
    // efector final (pinza)
    px(tx - 4, ty - 4, '#22243a', 8, 8);
    px(tx - 5, ty - 5, open ? '#ffcc33' : '#5cff8a', 2, 10);
    px(tx + 3, ty - 5, open ? '#ffcc33' : '#5cff8a', 2, 10);
  }

  /** Caja electrónica genérica (giroscopios, tarjetas…). */
  function drawBox(x, y, w, h, body, label = '', { glow = false, border = '#22243a', labelColor = '#22243a' } = {}) {
    px(x - w / 2 - 1, y - h / 2 - 1, border, w + 2, h + 2);
    px(x - w / 2, y - h / 2, body, w, h);
    px(x - w / 2, y - h / 2, '#ffffff', w, 1);
    if (label) text(label, x, y - 2, labelColor, 5, 'center');
    if (glow) for (let i = 0; i < 2; i++) px(x + rand(-w / 2, w / 2), y + rand(-h / 2, h / 2), '#5cff8a');
  }

  /** Fondo estándar: estrellas + Tierra abajo. */
  let scroll = 0;
  function orbitBackdrop(dt, cy = 600) {
    P.clear();
    P.drawStars(dt, 1);
    scroll += dt * 25;
    P.earthLimb(scroll, { cy });
  }

  // ================= Fotos reales (NASA y ESA/Hubble) =================
  const IMG_BASE = '../shared/img/';
  const imgCache = {};
  /** Carga (una vez) una foto real de shared/img. */
  function img(name) {
    if (!imgCache[name]) {
      const i = new Image();
      i.src = IMG_BASE + name;
      imgCache[name] = i;
    }
    return imgCache[name];
  }
  const imgReady = (i) => i.complete && i.naturalWidth > 0;
  const pixCache = {};
  /** Versión pixel (baja resolución) de una foto real, para dibujarla dentro del juego. */
  function pixImg(name, w, h) {
    const key = `${name}|${w}|${h}`;
    if (pixCache[key]) return pixCache[key];
    const i = img(name);
    if (!imgReady(i)) return null;
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = true;
    // recorte centrado para llenar w×h sin deformar
    const ar = w / h;
    let sw = i.naturalWidth;
    let sh = sw / ar;
    if (sh > i.naturalHeight) {
      sh = i.naturalHeight;
      sw = sh * ar;
    }
    g.drawImage(i, (i.naturalWidth - sw) / 2, (i.naturalHeight - sh) / 2, sw, sh, 0, 0, w, h);
    pixCache[key] = c;
    return c;
  }
  /** Dibuja una foto real pixelada en el lienzo. Devuelve false si aún no cargó. */
  function drawPix(name, x, y, w, h, alpha = 1) {
    const c = pixImg(name, w, h);
    if (!c) return false;
    P.ctx.globalAlpha = alpha;
    P.ctx.drawImage(c, Math.round(x), Math.round(y));
    P.ctx.globalAlpha = 1;
    return true;
  }

  // Lienzos auxiliares para enfocar (pixelar) y para "sacar la foto"
  const tmp = document.createElement('canvas');
  const tctx = tmp.getContext('2d');
  /** Pixela una zona del lienzo: block = tamaño del píxel (1 = nítido). Simula una foto desenfocada. */
  function pixelate(x, y, w, h, block) {
    if (block <= 1) return;
    const tw = Math.max(1, Math.ceil(w / block));
    const th = Math.max(1, Math.ceil(h / block));
    tmp.width = tw;
    tmp.height = th;
    tctx.imageSmoothingEnabled = true;
    tctx.drawImage(P.canvas, x, y, w, h, 0, 0, tw, th);
    P.ctx.imageSmoothingEnabled = false;
    P.ctx.drawImage(tmp, 0, 0, tw, th, x, y, w, h);
  }
  /** Copia una zona del lienzo (la "foto" del jugador). */
  function snapshot(x, y, w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    c.getContext('2d').drawImage(P.canvas, x, y, w, h, 0, 0, w, h);
    return c;
  }
  /** Foto instantánea con marco blanco. */
  function drawPolaroid(shot, cx, cy, w, h) {
    px(cx - w / 2 - 3, cy - h / 2 - 3, '#000', w + 8, h + 14);
    px(cx - w / 2 - 4, cy - h / 2 - 4, '#f4f1de', w + 8, h + 14);
    P.ctx.imageSmoothingEnabled = false;
    P.ctx.drawImage(shot, Math.round(cx - w / 2), Math.round(cy - h / 2), Math.round(w), Math.round(h));
  }
  /** Marca de "hecho" en pixel (7×6). */
  function drawCheck(x, y, c = '#5cff8a') {
    const rows = ['......#', '.....##', '#...##.', '##.##..', '.###...', '..#....'];
    rows.forEach((r, j) => [...r].forEach((ch, i) => ch === '#' && px(x + i, y + j, c)));
  }
  /** Sonido de obturador. */
  function shutter() {
    P.noise(0.06, 0.2, 5000);
    P.tone(1800, 0.03, 'square', 0.05);
    P.tone(900, 0.05, 'square', 0.05, null, 0.06);
  }
  /** Marco del visor de cámara. ok = enfocado (verde). */
  function drawViewfinder(cx, cy, w, h, t, ok, f) {
    const c = ok ? '#5cff8a' : '#f4f1de';
    const x0 = cx - w / 2;
    const y0 = cy - h / 2;
    const L = 9;
    for (const [x, y, dx, dy] of [[x0, y0, 1, 1], [x0 + w, y0, -1, 1], [x0, y0 + h, 1, -1], [x0 + w, y0 + h, -1, -1]]) {
      px(dx > 0 ? x : x - L, y + (dy > 0 ? 0 : -1), c, L, 1);
      px(x + (dx > 0 ? 0 : -1), dy > 0 ? y : y - L, c, 1, L);
    }
    px(cx - 5, cy, c, 4, 1);
    px(cx + 2, cy, c, 4, 1);
    px(cx, cy - 5, c, 1, 4);
    px(cx, cy + 2, c, 1, 4);
    if (Math.floor(t * 2) % 2 === 0) px(x0 + 4, y0 + 4, '#ff4d6d', 3, 3);
    text('REC', x0 + 9, y0 + 3, '#ff4d6d', 4);
    // barra de enfoque a la derecha
    const bx = x0 + w + 4;
    px(bx, y0, '#22243a', 4, h);
    px(bx, y0, '#1f7a3a', 4, h * 0.22);
    px(bx, y0 + h * (1 - f), ok ? '#5cff8a' : '#ffcc33', 4, h * f);
  }

  /**
   * Fase de foto: mueve el visor (flechas o dedo), centra el objetivo y pulsa cuando esté NÍTIDO.
   * o: { phase, step, next, action, fact, world(dt, st, t) → {x, y}, fw, fh, start, label }
   */
  function photoPhase(o) {
    const fw = o.fw || 84;
    const fh = o.fh || 56;
    return {
      enter(st) {
        P.setStep(o.step);
        Object.assign(st, { v: { ...(o.start || { x: 100, y: 66 }) }, f: 0, ft: 0, misses: 0, done: false, dT: 0 });
        P.setAction(o.action || 'Centra el objetivo y pulsa cuando esté NÍTIDO');
        if (o.fact) P.setFact(o.fact, 8);
        if (o.song) P.setSong(o.song);
      },
      scene(dt, st, t) {
        const tg = o.world(dt, st, t);
        st.tg = tg;
        const v = st.v;
        if (!st.done) {
          steer(v, dt, 75, { x0: fw / 2 + 2, x1: 320 - fw / 2 - 8, y0: 24 + fh / 2, y1: 112 - fh / 2 });
          const dist = Math.hypot(tg.x - v.x, tg.y - v.y);
          const centered = dist < 9;
          if (centered) {
            st.ft += dt;
            // el enfoque va y viene: borroso → nítido → borroso
            st.f = 1 - Math.abs(((st.ft * 0.6) % 2) - 1);
          } else {
            st.ft = 0;
            st.f = Math.max(0, st.f - dt * 2);
          }
          const sharp = centered && st.f > 0.78;
          pixelate(v.x - fw / 2, v.y - fh / 2, fw, fh, Math.round(1 + (1 - st.f) * 6));
          const shoot = P.action();
          // la foto se copia antes de dibujar el visor encima
          if (shoot && sharp) st.shot = snapshot(Math.round(v.x - fw / 2), Math.round(v.y - fh / 2), fw, fh);
          // oscurecer fuera del visor
          P.ctx.fillStyle = 'rgba(0,0,0,0.45)';
          P.ctx.fillRect(0, 0, 320, v.y - fh / 2);
          P.ctx.fillRect(0, v.y + fh / 2, 320, 180);
          P.ctx.fillRect(0, v.y - fh / 2, v.x - fw / 2, fh);
          P.ctx.fillRect(v.x + fw / 2, v.y - fh / 2, 320, fh);
          drawViewfinder(v.x, v.y, fw, fh, t, sharp, st.f);
          if (!centered) P.ring(tg.x, tg.y, 6 + Math.sin(t * 6) * 2, '#ffcc33', 0.2);
          text(sharp ? '¡NÍTIDA! ¡PULSA!' : centered ? 'ENFOCANDO...' : o.label || 'CENTRA EL OBJETIVO', v.x, v.y + fh / 2 - 9, sharp ? '#5cff8a' : '#ffcc33', 5, 'center');
          P.setMeter(st.f);
          if (shoot) {
            if (sharp) {
              st.done = true;
              lastShot = st.shot;
              shutter();
              P.flash('#ffffff');
              const s = st.misses === 0 ? 3 : st.misses <= 2 ? 2 : 1;
              P.award(o.phase, s, 160, 28, s === 3 ? '¡FOTO PERFECTA!' : '¡BUENA FOTO!');
              P.setAction('¡Foto tomada!');
            } else {
              st.misses += 1;
              shutter();
              P.popup(centered ? '¡Salió borrosa! Espera el verde' : 'Primero céntralo', v.x, v.y - 10, '#ff8c42', 6);
            }
          }
        } else {
          st.dT += dt;
          const k = clamp(st.dT / 0.6, 0, 1);
          const w = lerp(fw, fw * 1.5, k);
          const h = lerp(fh, fh * 1.5, k);
          drawPolaroid(st.shot, lerp(v.x, 160, k), lerp(v.y, 70, k), w, h);
          if (st.dT > 1.6) P.go(o.next);
        }
        P.updateParticles(dt);
        P.drawPopups(dt);
      },
    };
  }
  let lastShot = null;

  // ================= Paneles: ficha NASA, pregunta y álbum =================
  const el = (tag, attrs = {}, html = '') => {
    const e = document.createElement(tag);
    Object.assign(e, attrs);
    if (html) e.innerHTML = html;
    return e;
  };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  let briefEl = null;
  let quizEl = null;
  let albumEl = null;
  function ensurePanels() {
    if (briefEl) return;
    const ui = document.getElementById('ui');
    briefEl = el('section', { id: 'brief', className: 'panel hidden' });
    briefEl.setAttribute('aria-live', 'polite');
    briefEl.innerHTML = `
      <div class="panel-head"><i></i><i></i><i></i><span>ARCHIVO DE MISIÓN · STS-125</span></div>
      <div class="brief-fig">
        <div class="brief-pair">
          <figure class="mine"><canvas id="brief-mine" width="84" height="56"></canvas><figcaption>TU FOTO</figcaption></figure>
          <figure class="real"><img id="brief-img" alt="" /><figcaption id="brief-tag">FOTO REAL</figcaption></figure>
        </div>
        <p class="cap" id="brief-cap"></p>
      </div>
      <div class="brief-body">
        <p class="kicker" id="brief-kicker"></p>
        <h2 id="brief-title"></h2>
        <dl id="brief-rows"></dl>
        <p class="small" id="brief-note"></p>
        <button id="brief-btn" type="button">¡Vamos!</button>
      </div>`;
    quizEl = el('section', { id: 'quiz', className: 'panel center hidden' });
    quizEl.innerHTML = `
      <div class="panel-head"><i></i><i></i><i></i><span>CONTROL DE MISIÓN · HOUSTON</span><b>PREGUNTA</b></div>
      <h3 id="quiz-q"></h3>
      <div id="quiz-opts"></div>
      <p class="small" id="quiz-fb"></p>
      <button id="quiz-next" type="button" class="hidden">Continuar <span class="ico" data-icon="play"></span></button>`;
    albumEl = el('section', { id: 'album', className: 'panel center hidden' });
    albumEl.innerHTML = `
      <h3><span class="ico" data-icon="album"></span> Álbum de la misión</h3>
      <p class="small dim">Fotos reales de la NASA y del Hubble que viste en esta misión.</p>
      <div id="album-grid"></div>
      <button id="album-close" type="button">Cerrar</button>`;
    window.PXI.hydrate(briefEl);
    window.PXI.hydrate(quizEl);
    window.PXI.hydrate(albumEl);
    ui.insertBefore(briefEl, document.getElementById('flash'));
    ui.insertBefore(quizEl, document.getElementById('flash'));
    ui.insertBefore(albumEl, document.getElementById('flash'));
    document.getElementById('brief-btn').addEventListener('click', () => (briefDone = true));
    document.getElementById('quiz-next').addEventListener('click', () => (quizDone = true));
    document.getElementById('album-close').addEventListener('click', () => albumEl.classList.add('hidden'));
    window.addEventListener('keydown', (e) => {
      if (quizEl.classList.contains('hidden')) return;
      const d = { ArrowDown: 1, ArrowRight: 1, KeyS: 1, KeyD: 1, ArrowUp: -1, ArrowLeft: -1, KeyW: -1, KeyA: -1 }[e.code];
      if (d) quizMove += d;
    });
  }
  let quizMove = 0;
  let briefDone = false;
  let quizDone = false;
  let album = [];

  /**
   * Ficha NASA entre fases (como las tarjetas de DART), con foto real.
   * o: { step, kicker, title, img, cap, rows: [[dato, valor]], note, btn, mine, next, draw(dt, st, t) }
   */
  function brief(o) {
    return {
      enter(st) {
        ensurePanels();
        P.setStep(o.step ?? -1);
        P.setAction(null);
        P.setFact(null);
        briefDone = false;
        st.t = 0;
        document.getElementById('brief-kicker').textContent = o.kicker || '';
        document.getElementById('brief-title').textContent = o.title || '';
        document.getElementById('brief-rows').innerHTML = (o.rows || []).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('');
        document.getElementById('brief-note').innerHTML = o.note || '';
        document.getElementById('brief-btn').innerHTML = `${esc((o.btn || '¡Vamos!').replace(/\s*▶\s*$/, ''))} <span class="ico">${window.PXI.svg('play')}</span>`;
        const im = document.getElementById('brief-img');
        im.src = IMG_BASE + o.img;
        im.alt = o.alt || o.cap || '';
        document.getElementById('brief-cap').textContent = o.cap || '';
        document.getElementById('brief-tag').textContent = 'FOTO REAL';
        const showMine = !!(o.mine && lastShot);
        briefEl.classList.toggle('with-mine', showMine);
        if (showMine) {
          const c = document.getElementById('brief-mine');
          c.width = lastShot.width;
          c.height = lastShot.height;
          c.getContext('2d').drawImage(lastShot, 0, 0);
        }
        if (o.img && !album.some((a) => a.img === o.img)) album.push({ img: o.img, cap: o.cap || '' });
        briefEl.classList.remove('hidden');
        if (o.sound !== false) P.arp([523, 784], 0.06, 'triangle', 0.04);
      },
      scene(dt, st, t) {
        st.t += dt;
        if (o.draw) o.draw(dt, st, t);
        else orbitBackdrop(dt, 640);
        P.updateParticles(dt);
        if ((st.t > 0.8 && P.input.key) || briefDone) {
          briefDone = false;
          briefEl.classList.add('hidden');
          P.tone(660, 0.06, 'square', 0.04);
          P.go(o.next);
        }
      },
    };
  }

  /**
   * Pregunta final de 3 opciones (flechas + ESPACIO, o tocar).
   * o: { phase, step, q, options: [..], correct, explain, next, draw }
   */
  function quiz(o) {
    let picked = null;
    return {
      enter(st) {
        ensurePanels();
        P.setStep(o.step);
        P.setAction(null);
        P.setFact(null);
        P.setSong('calm');
        quizDone = false;
        quizMove = 0;
        picked = null;
        Object.assign(st, { sel: 0, tries: 0, solved: false, t: 0, prevAx: 0 });
        document.getElementById('quiz-q').textContent = o.q;
        document.getElementById('quiz-fb').textContent = '';
        document.getElementById('quiz-next').classList.add('hidden');
        const box = document.getElementById('quiz-opts');
        box.innerHTML = '';
        o.options.forEach((txt, i) => {
          const b = el('button', { type: 'button', className: 'opt' }, `<span>${'ABC'[i]}</span> ${esc(txt)}`);
          b.addEventListener('click', () => (picked = i));
          box.appendChild(b);
        });
        quizEl.classList.remove('hidden');
      },
      scene(dt, st, t) {
        st.t += dt;
        if (o.draw) o.draw(dt, st, t);
        else orbitBackdrop(dt, 640);
        const btns = [...document.querySelectorAll('#quiz-opts .opt')];
        if (!st.solved) {
          if (quizMove) {
            st.sel = (((st.sel + quizMove) % btns.length) + btns.length) % btns.length;
            quizMove = 0;
            P.tone(500, 0.03, 'square', 0.03);
          }
          btns.forEach((b, i) => b.classList.toggle('sel', i === st.sel));
          if (st.t > 0.5 && P.input.key && !btns[st.sel].disabled) picked = st.sel;
          if (picked !== null) {
            const i = picked;
            picked = null;
            const b = btns[i];
            if (i === o.correct) {
              st.solved = true;
              b.classList.add('ok');
              const s = Math.max(1, 3 - st.tries);
              P.award(o.phase, s, 160, 30, s === 3 ? '¡CORRECTO!' : '¡BIEN!');
              P.burst(160, 40, 30, ['#5cff8a', '#ffcc33', '#ffffff'], 60, 1);
              document.getElementById('quiz-fb').innerHTML = `<span class="ico">${window.PXI.svg('check')}</span> ${esc(o.explain)}`;
              const nx = document.getElementById('quiz-next');
              nx.classList.remove('hidden');
              st.solvedT = st.t;
            } else if (!b.disabled) {
              st.tries += 1;
              b.classList.add('bad');
              b.disabled = true;
              P.shake(0.2);
              P.tone(150, 0.15, 'square', 0.05);
              document.getElementById('quiz-fb').textContent = o.hint || '¡Casi! Prueba otra.';
              const next = btns.findIndex((x) => !x.disabled);
              if (next >= 0) st.sel = next;
            }
          }
        } else if (quizDone || (st.t - st.solvedT > 0.8 && P.input.key)) {
          quizDone = false;
          quizEl.classList.add('hidden');
          P.go(o.next);
        }
        P.updateParticles(dt);
        P.drawPopups(dt);
      },
    };
  }

  function showAlbum() {
    ensurePanels();
    document.getElementById('album-grid').innerHTML = album
      .map((a) => `<figure><img src="${IMG_BASE + a.img}" alt="${esc(a.cap)}" /><figcaption>${esc(a.cap)}</figcaption></figure>`)
      .join('');
    albumEl.classList.remove('hidden');
  }

  /**
   * Esqueleto común de un minijuego STS-125: portada, botones START/Otra vez, resultado y álbum.
   * opts: { first, phases, key, stat(r), today, scenes, enter, titleDraw, resultDraw }
   */
  function makeGame(opts) {
    const { first, phases, key, stat, scenes, enter, titleDraw, resultDraw, today } = opts;
    ensurePanels();
    // [Laika Program] Inside the mission (?embed=1) the result goes back to the mission
    // and the "Menú" link becomes "Volver a la misión". Nothing else changes.
    const EMBED = new URLSearchParams(location.search).has('embed') && window.parent !== window;
    const toMission = (msg) => window.parent.postMessage({ source: 'sts125', ...msg }, '*');
    if (EMBED) {
      const menu = document.getElementById('menu-link');
      if (menu) {
        const back = document.createElement('button');
        back.type = 'button';
        back.id = 'menu-link';
        back.innerHTML = `<span class="ico">${window.PXI.svg('play')}</span> Volver a la misión`;
        back.addEventListener('click', () => toMission({ type: 'close' }));
        menu.replaceWith(back);
      }
      document.getElementById('again')?.classList.add('hidden');
    }
    const hideOverlays = () => [briefEl, quizEl, albumEl].forEach((e) => e.classList.add('hidden'));
    enter.title = () => {
      P.setStep(-1);
      hideOverlays();
      P.ui.title.classList.remove('hidden');
      P.ui.result.classList.add('hidden');
      P.ui.score.classList.add('hidden');
      P.setAction(null);
      P.setFact(null);
      P.setSong('calm');
    };
    enter.result = () => {
      hideOverlays();
      P.setStep(phases.length);
      P.setAction(null);
      P.setFact(null);
      const r = P.fillResult(phases, key);
      // Resumen simple: el promedio de las fases, en 3 estrellas (escala de 1 a 3)
      const avg = phases.reduce((a, ph) => a + Math.max(1, P.game.stars[ph] || 1), 0) / phases.length;
      const nStars = Math.max(1, Math.min(3, Math.round(avg)));
      const starsEl = document.getElementById('result-stars');
      if (starsEl) starsEl.innerHTML = `<span class="avg">${window.PXI.svg('star').repeat(nStars)}${window.PXI.svg('staroff').repeat(3 - nStars)}</span>`;
      if (EMBED) toMission({ type: 'result', key, total: r.total, max: r.max, score: P.game.score, secs: r.secs });
      document.getElementById('result-stat').textContent = stat(r);
      const td = document.getElementById('result-today');
      if (td) td.innerHTML = today || '';
      const ab = document.getElementById('album-btn');
      if (ab) ab.innerHTML = `<span class="ico">${window.PXI.svg('album')}</span> Álbum (${album.length})`;
      P.ui.result.classList.remove('hidden');
      P.setSong('calm');
    };
    scenes.title = (dt, st, t) => {
      titleDraw(dt, st, t);
      if (P.input.key) startGame();
    };
    scenes.result = (dt, st, t) => {
      resultDraw(dt, st, t);
      if (Math.random() < 0.08) P.burst(rand(40, 280), rand(20, 60), 6, ['#ffcc33', '#5cff8a', '#4cc9f0'], 30, 1);
      P.updateParticles(dt);
    };
    function startGame() {
      P.initAudio();
      P.resetGame();
      album = [];
      lastShot = null;
      hideOverlays();
      P.ui.title.classList.add('hidden');
      P.ui.result.classList.add('hidden');
      P.ui.score.classList.remove('hidden');
      P.go(first);
    }
    document.getElementById('start').addEventListener('click', startGame);
    document.getElementById('again').addEventListener('click', startGame);
    document.getElementById('album-btn')?.addEventListener('click', showAlbum);
    P.start({ first: 'title', scenes, enter });
  }

  /** Registra pares {enter, scene} en los objetos del juego. */
  function add(scenes, enter, defs) {
    for (const [name, d] of Object.entries(defs)) {
      scenes[name] = d.scene;
      enter[name] = d.enter;
    }
  }

  /** Movimiento de un punto con flechas o arrastrando el dedo/ratón. */
  function steer(pos, dt, speed = 70, bounds = { x0: 0, x1: 320, y0: 0, y1: 180 }) {
    const a = P.axis();
    pos.x += a.x * speed * dt;
    pos.y += a.y * speed * dt;
    if (P.input.pointerDown && P.input.pointer) {
      const dx = P.input.pointer.x - pos.x;
      const dy = P.input.pointer.y - pos.y;
      const d = Math.hypot(dx, dy);
      if (d > 1) {
        const step = Math.min(d, speed * 1.6 * dt);
        pos.x += (dx / d) * step;
        pos.y += (dy / d) * step;
      }
    }
    pos.x = clamp(pos.x, bounds.x0, bounds.x1);
    pos.y = clamp(pos.y, bounds.y0, bounds.y1);
    return a.x || a.y || P.input.pointerDown;
  }

  window.STS = {
    drawHubble, hubblePin, drawAstronaut, drawShuttleBay, drawArm, drawBox, orbitBackdrop, makeGame, steer, ring,
    img, pixImg, drawPix, drawCheck, pixelate, snapshot, drawPolaroid, shutter, drawViewfinder, photoPhase, brief, quiz, add,
    get lastShot() { return lastShot; },
    setShot: (c) => (lastShot = c),
  };
})();
