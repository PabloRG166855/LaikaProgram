/* Minijuego STS-125: "Reparar el espectrógrafo" (STIS)
 * Datos reales: 17 may 2009, 4.ª caminata (8 h 2 min). El STIS estaba apagado desde 2004 (falló su fuente de energía).
 * Para abrir la tapa había que quitar 111 tornillos; un plato transparente (tipo Lexan) los atrapaba.
 * Un tornillo del pasamanos del STIS no se soltaba;
 * Mike Massimino lo arrancó a la fuerza (indicación de Control de Misión). Luego cambiaron una tarjeta
 * de alimentación dañada: un reemplazo nunca antes intentado dentro de un instrumento en el espacio.
 * Un espectrógrafo separa la luz en colores para estudiar de qué están hechas las estrellas.
 * Líneas reales: hidrógeno 410, 434, 486 y 656 nm; sodio 589,0 y 589,6 nm.
 * Pensado para niños: tocar rápido, mantener/soltar, arrastrar, pulsar a tiempo.
 */
(() => {
  'use strict';
  const P = window.PX;
  const S = window.STS;
  const { px, text, ring, clamp, lerp, rand } = P;

  /** Panel del instrumento STIS. */
  function drawStisPanel(open) {
    px(50, 30, '#c9ccd8', 220, 86);
    px(50, 30, '#e2e4ec', 220, 3);
    text('STIS', 160, 37, '#555a6e', 6, 'center');
    if (open) {
      px(110, 48, '#22243a', 100, 60);
      for (let i = 0; i < 6; i++) px(116 + i * 16, 52, '#3a3d5c', 10, 52); // otras tarjetas
    } else {
      px(110, 48, '#a9adbd', 100, 60);
      for (let i = 0; i < 4; i++) px(112 + (i % 2) * 92, 50 + Math.floor(i / 2) * 54, '#555a6e', 4, 4);
    }
  }

  const enter = {
    rail(st) {
      P.setStep(0);
      Object.assign(st, { pull: 0, bend: 0, done: false, dT: 0, t: 0 });
      P.setSong('action');
      P.setAction('¡Pasamanos atascado! Toca MUY rápido', true);
      P.setFact('Un tornillo del pasamanos no se soltaba. Control de Misión le dijo a Massimino: ¡arráncalo a la fuerza!');
    },
    board(st) {
      P.setStep(2);
      Object.assign(st, { phase: 'open', oldY: 78, b: { x: 60, y: 40 }, snapped: false, sT: 0, done: false, dT: 0, t: 0 });
      P.setAction('Toca la tapa para abrirla');
      P.setFact('Dentro había una tarjeta electrónica rota. Cambiarla en el espacio... ¡nunca se había hecho!');
    },
    power(st) {
      P.setStep(3);
      Object.assign(st, { on: false, onT: 0 });
      P.setAction('¡Enciéndelo! Pulsa el botón verde');
      P.setFact('Un espectrógrafo separa la luz de las estrellas en colores, como un arcoíris, para saber de qué están hechas.');
    },
  };

  const scenes = {
    // 1) Arrancar el pasamanos: aquí SÍ hay que usar fuerza (al revés que el tornillo de la cámara)
    rail(dt, st, t) {
      S.orbitBackdrop(dt, 640);
      drawStisPanel(false);
      st.t += dt;
      if (!st.done) {
        if (P.action()) {
          st.pull = Math.min(1.2, st.pull + 0.16);
          P.tone(120 + st.pull * 200, 0.05, 'square', 0.05);
          P.shake(0.06);
          P.burst(160 + rand(-30, 30), 50, 2, ['#ffcc33', '#ffffff'], 25, 0.3);
        }
        st.pull = Math.max(0, st.pull - 0.3 * dt);
        st.bend = Math.min(1, st.bend + (st.pull > 0.55 ? (st.pull - 0.55) * 1.4 * dt : 0));
        P.setMeter(st.bend);
        if (st.bend >= 1) {
          st.done = true;
          const s = st.t < 6 ? 3 : st.t < 11 ? 2 : 1;
          P.award('rail', s, 160, 26, s === 3 ? '¡FUERZA DE ASTRONAUTA!' : '¡ARRANCADO!');
          P.noise(0.4, 0.25, 2500);
          P.shake(0.4);
          P.flash('#ffcc33');
          P.burst(160, 48, 40, ['#ffcc33', '#ffffff', '#ff8c42'], 70, 0.9);
          P.setAction('¡El pasamanos salió!');
        }
      } else st.dT += dt;
      // pasamanos (se dobla y luego sale volando)
      const fly = st.dT * 60;
      const bendPx = st.bend * 10 + Math.sin(t * 40) * st.pull * 1.5;
      const y0 = 46 - fly;
      px(80 - fly * 0.3, y0, '#ffcc33', 4, 6);
      px(236 + fly * 0.3, y0, '#ffcc33', 4, 6);
      for (let x = 80; x <= 240; x += 2) {
        const k = (x - 80) / 160;
        px(x + (st.done ? -fly * 0.1 : 0), y0 - Math.sin(k * Math.PI) * bendPx, '#ffcc33', 2, 3);
      }
      // tornillo atascado (izquierda)
      px(79, 50, st.done ? '#5cff8a' : '#ff4d6d', 6, 3);
      // astronauta tirando
      S.drawAstronaut(160, 70 + (st.done ? 0 : -st.pull * 4), 1.6, t);
      P.line(166, 62, 160, y0 - bendPx + 2, '#f2f3f7');
      if (st.dT > 1.8) P.go('screws');
      P.updateParticles(dt);
      P.drawPopups(dt);
    },

    // 2) Abrir, sacar la tarjeta rota y poner la nueva (arrastrar a su silueta)
    board(dt, st, t) {
      S.orbitBackdrop(dt, 640);
      st.t += dt;
      drawStisPanel(st.phase !== 'open');
      const SLOT = { x: 160, y: 78 };
      if (st.phase === 'open') {
        ring(160, 78, 34 + Math.sin(t * 6) * 2, '#ffcc33', 0.06);
        text('TOCA LA TAPA', 160, 74, '#22243a', 5, 'center');
        if (P.action()) {
          st.phase = 'old';
          P.noise(0.15, 0.1, 1200);
          P.burst(160, 78, 16, ['#ffffff', '#c9ccd8'], 40, 0.6);
          P.setAction('Toca la tarjeta ROJA para sacarla');
        }
      } else if (st.phase === 'old') {
        S.drawBox(SLOT.x, st.oldY, 12, 50, '#ff6b6b', '', {});
        text('ROTA', SLOT.x, st.oldY - 34, '#ff4d6d', 5, 'center');
        ring(SLOT.x, st.oldY, 30 + Math.sin(t * 6) * 2, '#ff4d6d', 0.08);
        if (P.action()) {
          st.phase = 'oldOut';
          P.tone(300, 0.08, 'square', 0.05);
        }
      } else if (st.phase === 'oldOut') {
        st.oldY -= 80 * dt;
        S.drawBox(SLOT.x + (78 - st.oldY) * 0.5, st.oldY, 12, 50, '#ff6b6b');
        if (st.oldY < -30) {
          st.phase = 'new';
          P.setAction('Lleva la tarjeta VERDE a su silueta');
        }
      } else if (st.phase === 'new') {
        // silueta donde va la tarjeta
        const glow = Math.floor(t * 4) % 2 ? '#5cff8a' : '#ffffff';
        px(SLOT.x - 8, SLOT.y - 27, glow, 16, 2);
        px(SLOT.x - 8, SLOT.y + 25, glow, 16, 2);
        px(SLOT.x - 8, SLOT.y - 27, glow, 2, 54);
        px(SLOT.x + 6, SLOT.y - 27, glow, 2, 54);
        text('AQUÍ', SLOT.x, SLOT.y - 38, '#5cff8a', 6, 'center');
        S.steer(st.b, dt, 70, { x0: 20, x1: 300, y0: 20, y1: 130 });
        const near = Math.hypot(st.b.x - SLOT.x, st.b.y - SLOT.y);
        if (near < 9) {
          st.phase = 'snap';
          st.sT = 0;
          const s = st.t < 12 ? 3 : st.t < 20 ? 2 : 1;
          P.award('board', s, 160, 22, s === 3 ? '¡CONEXIÓN PERFECTA!' : '¡CONECTADA!');
          P.noise(0.12, 0.15, 700);
          P.tone(110, 0.2, 'square', 0.08);
          P.burst(SLOT.x, SLOT.y, 26, ['#5cff8a', '#ffffff', '#ffcc33'], 45, 0.7);
          P.setAction('¡Encajó!');
        }
        S.drawBox(st.b.x, st.b.y, 12, 50, '#9ef0b8', '', { glow: true });
        if (near < 40) text('¡CASI!', st.b.x, st.b.y - 36, '#5cff8a', 5, 'center');
      } else if (st.phase === 'snap') {
        st.sT += dt;
        st.b.x = lerp(st.b.x, SLOT.x, Math.min(1, dt * 12));
        st.b.y = lerp(st.b.y, SLOT.y, Math.min(1, dt * 12));
        S.drawBox(st.b.x, st.b.y, 12, 50, '#9ef0b8', '', { glow: true });
        if (st.sT > 1.5) P.go('power');
      }
      P.updateParticles(dt);
      P.drawPopups(dt);
    },

    // 3) Encender: aparece el "arcoíris" del espectrógrafo
    power(dt, st, t) {
      P.clear('#04050a');
      if (!st.on) {
        const pulse = 1 + Math.sin(t * 5) * 0.08;
        for (let r = 22 * pulse; r > 0; r -= 1) ring(160, 66, r, r > 18 * pulse ? '#1f7a3a' : '#5cff8a', 0.08);
        text('ON', 160, 62, '#0a5c2b', 8, 'center');
        text('STIS', 160, 98, '#4cc9f0', 7, 'center');
        if (P.action()) {
          st.on = true;
          P.award('power', 3, 160, 24, '¡STIS FUNCIONA!');
          P.arp([523, 659, 784, 1046], 0.08, 'square', 0.06);
          P.flash('#5cff8a');
          P.setAction('¡La luz de una estrella, separada en colores!');
        }
      } else {
        st.onT += dt;
        // estrella a la izquierda, rayo de luz, prisma y arcoíris
        px(40, 62, '#fff3b0', 6, 6);
        P.ring(43, 65, 6 + Math.sin(t * 6), '#fff3b0', 0.3);
        const k = clamp(st.onT / 1.2, 0, 1);
        P.line(46, 65, lerp(46, 140, k), 65, '#ffffff');
        if (k >= 1) {
          // prisma
          for (let i = 0; i < 20; i++) px(140 + i / 2, 75 - i, '#c9d4ff', 20 - i, 1);
          const cols = ['#ff4d6d', '#ff8c42', '#ffcc33', '#5cff8a', '#4cc9f0', '#3a55b8', '#9b5de5'];
          const k2 = clamp((st.onT - 1.2) / 1.2, 0, 1);
          cols.forEach((c, i) => px(160, 58 + i * 3, c, Math.round(140 * k2), 3));
          if (k2 >= 1) {
            // líneas oscuras: "huellas" de los elementos químicos
            for (const lx of [196, 222, 251, 270]) px(lx, 58, '#04050a', 2, 21);
            if (!st.noted) {
              st.noted = true;
              P.setFact('Cada línea oscura del arcoíris es la "huella" de un elemento químico de la estrella.', 9);
            }
          }
        }
        if (st.onT > 4.2) P.go('lines');
      }
      P.updateParticles(dt);
      P.drawPopups(dt);
    },
  };

  // ================= Plato atrapa-tornillos y 111 tornillos =================
  const SCREWS = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) SCREWS.push({ x: 122 + c * 19, y: 58 + r * 20 });
  enter.screws = (st) => {
    P.setStep(1);
    P.setSong('tense');
    Object.assign(st, { phase: 'plate', ph: 0, plateX: 120, misses: 0, count: 0, heat: 0, over: 0, cool: 0, done: false, dT: 0, caught: [] });
    P.setAction('Pulsa cuando el plato cubra los tornillos');
    P.setFact('La tapa tenía 111 tornillos. Un plato transparente los atrapaba para que no se fueran flotando.', 9);
  };
  scenes.screws = (dt, st, t) => {
    S.orbitBackdrop(dt, 640);
    drawStisPanel(false);
    const left = Math.ceil(SCREWS.length * (1 - st.count / 111));
    SCREWS.forEach((s, i) => {
      if (i < left) {
        px(s.x - 2, s.y - 2, '#555a6e', 5, 5);
        px(s.x - 1, s.y, '#22243a', 3, 1);
      }
    });
    if (st.phase === 'plate') {
      st.ph += dt * 1.3;
      st.plateX = 160 + Math.sin(st.ph) * 40;
    }
    const off = st.plateX - 160;
    const ok = Math.abs(off) < 6;
    // plato transparente (Lexan) con agujeros
    P.ctx.fillStyle = st.phase === 'plate' ? 'rgba(76,201,240,0.28)' : 'rgba(92,255,138,0.22)';
    P.ctx.fillRect(Math.round(110 + off), 46, 100, 64);
    const edge = st.phase === 'plate' ? (ok ? '#5cff8a' : '#4cc9f0') : '#5cff8a';
    px(110 + off, 46, edge, 100, 1);
    px(110 + off, 109, edge, 100, 1);
    px(110 + off, 46, edge, 1, 64);
    px(209 + off, 46, edge, 1, 64);
    SCREWS.forEach((s) => P.ring(s.x + off, s.y, 4, edge, 0.4));
    // tornillos atrapados dentro del plato
    st.caught.forEach((c) => px(c.x + off, c.y, '#a9adbd', 2, 2));
    if (st.phase === 'plate') {
      text(ok ? '¡ENCIMA! ¡PULSA!' : 'ESPERA AL CENTRO', 160, 22, ok ? '#5cff8a' : '#ffcc33', 5, 'center');
      if (P.action()) {
        if (ok) {
          st.phase = 'drill';
          st.plateX = 160;
          P.tone(500, 0.1, 'square', 0.06);
          P.noise(0.08, 0.1, 2000);
          P.popup('¡PLATO PUESTO!', 160, 26, '#5cff8a', 8);
          P.setAction('Mantén para desatornillar. ¡Suelta si se calienta!', true);
        } else {
          st.misses += 1;
          P.shake(0.15);
          P.tone(160, 0.12, 'square', 0.05);
          P.popup('Así no cubre los tornillos', 160, 26, '#ff8c42', 6);
        }
      }
    } else if (!st.done) {
      st.cool = Math.max(0, st.cool - dt);
      const drilling = P.input.held && st.cool <= 0;
      const target = SCREWS[Math.max(0, left - 1)];
      if (drilling) {
        const before = left;
        st.count = Math.min(111, st.count + dt * 26);
        st.heat += dt * 0.42;
        if (Math.random() < 0.6) P.tone(700 + Math.random() * 200, 0.03, 'sawtooth', 0.02);
        P.burst(target.x, target.y, 1, ['#ffcc33', '#ffffff'], 25, 0.2);
        const nowLeft = Math.ceil(SCREWS.length * (1 - st.count / 111));
        if (nowLeft < before) st.caught.push({ x: target.x + rand(-6, 6), y: 48 + rand(0, 4) });
        if (st.heat >= 1) {
          st.over += 1;
          st.heat = 0.6;
          st.cool = 1.4;
          P.shake(0.3);
          P.noise(0.3, 0.15, 900);
          P.popup('¡MUY CALIENTE! Espera...', 160, 26, '#ff4d6d', 7);
        }
      } else st.heat = Math.max(0, st.heat - dt * 0.55);
      if (st.cool > 0) P.burst(target.x, target.y - 4, 1, ['#8b8fb3', '#555a6e'], 12, 0.8, -20);
      // herramienta (atornillador eléctrico) y guante
      const tx = target.x + 4;
      const ty = target.y - 6;
      px(tx, ty - 2, '#555a6e', 14, 5);
      px(tx + 10, ty + 3, '#555a6e', 5, 9);
      px(tx + 8, ty + 10, '#f2f3f7', 9, 8);
      if (drilling) px(tx - 2, ty - 1 + (Math.floor(t * 30) % 2), '#ffcc33', 2, 2);
      // contador y calor
      text(`TORNILLOS ${Math.floor(st.count)}/111`, 160, 22, '#ffffff', 6, 'center');
      text('CALOR', 236, 44, '#ff8c42', 5);
      px(236, 52, '#22243a', 8, 50);
      px(236, 52 + 50 * (1 - st.heat), st.heat > 0.75 ? '#ff4d6d' : '#ffcc33', 8, 50 * st.heat);
      px(236, 52 + 50 * 0.2, '#ff4d6d', 8, 1);
      P.setMeter(st.count / 111);
      if (st.count >= 111) {
        st.done = true;
        const errs = st.misses + st.over;
        const s = errs === 0 ? 3 : errs <= 2 ? 2 : 1;
        P.award('screws', s, 160, 26, s === 3 ? '¡111 TORNILLOS!' : '¡TODOS FUERA!');
        P.arp([392, 523, 659, 784], 0.07, 'square', 0.06);
        P.setAction('¡Ni un tornillo se escapó!');
      }
    } else {
      st.dT += dt;
      text('TORNILLOS 111/111', 160, 22, '#5cff8a', 6, 'center');
      if (st.dT > 1.6) P.go('board');
    }
    P.updateParticles(dt);
    P.drawPopups(dt);
  };

  // ================= Código de barras de la luz =================
  const BAR_X = 60;
  const BAR_W = 200;
  const nmX = (nm) => BAR_X + ((nm - 400) / 300) * BAR_W;
  /** Color aproximado de cada longitud de onda (400–700 nm). */
  function nmColor(nm) {
    let r = 0;
    let g = 0;
    let b = 0;
    if (nm < 440) [r, g, b] = [(440 - nm) / 40 * 0.6, 0, 1];
    else if (nm < 490) [r, g, b] = [0, (nm - 440) / 50, 1];
    else if (nm < 510) [r, g, b] = [0, 1, (510 - nm) / 20];
    else if (nm < 580) [r, g, b] = [(nm - 510) / 70, 1, 0];
    else if (nm < 645) [r, g, b] = [1, (645 - nm) / 65, 0];
    else [r, g, b] = [1, 0, 0];
    const k = nm < 420 ? 0.4 + (0.6 * (nm - 400)) / 20 : nm > 680 ? 0.4 + (0.6 * (700 - nm)) / 20 : 1;
    const h = (v) => Math.round(255 * Math.max(0, Math.min(1, v * k))).toString(16).padStart(2, '0');
    return `#${h(r)}${h(g)}${h(b)}`;
  }
  const ELEMENTS = [
    { name: 'HIDRÓGENO', lines: [410.2, 434.0, 486.1, 656.3], say: '¡Esta estrella tiene HIDRÓGENO!' },
    { name: 'SODIO', lines: [589.0, 589.6], say: '¡Y SODIO, como la sal de la cocina!' },
  ];
  const STAR_LINES = [...ELEMENTS[0].lines, ...ELEMENTS[1].lines];
  enter.lines = (st) => {
    P.setStep(4);
    P.setSong('calm');
    Object.assign(st, { round: 0, ph: 0, off: 0, misses: 0, matched: [], done: false, dT: 0, mT: 0 });
    P.setAction('Pulsa cuando las líneas coincidan con las oscuras');
    P.setFact('Cada elemento químico deja sus propias líneas en la luz, como un código de barras.', 9);
  };
  scenes.lines = (dt, st, t) => {
    P.clear('#04050a');
    P.drawStars(dt, 0.5);
    // estrella y su luz
    px(28, 44, '#fff3b0', 8, 8);
    P.ring(32, 48, 7 + Math.sin(t * 5), '#fff3b0', 0.3);
    for (let x = 40; x < BAR_X; x += 3) px(x, 48, '#ffffff');
    text('LUZ DE UNA ESTRELLA', 160, 26, '#4cc9f0', 5, 'center');
    // espectro con líneas oscuras
    for (let x = 0; x < BAR_W; x++) px(BAR_X + x, 40, nmColor(400 + (x / BAR_W) * 300), 1, 16);
    STAR_LINES.forEach((nm) => px(nmX(nm), 40, '#04050a', 1, 16));
    for (const nm of [400, 500, 600, 700]) {
      px(nmX(nm), 57, '#8b8fb3', 1, 3);
      text(`${nm}`, Math.min(nmX(nm), 252), 61, '#8b8fb3', 5, 'center');
    }
    text('nm', 274, 61, '#8b8fb3', 5);
    // elementos ya identificados
    st.matched.forEach((m, i) => {
      ELEMENTS[m].lines.forEach((nm) => px(nmX(nm), 32, '#5cff8a', 1, 6));
      S.drawCheck(62 + i * 100, 99);
      text(ELEMENTS[m].name, 72 + i * 100, 100, '#5cff8a', 5);
    });
    if (!st.done) {
      const el = ELEMENTS[st.round];
      if (st.mT > 0) st.mT -= dt;
      else {
        st.ph += dt * (1.1 + st.round * 0.3);
        st.off = Math.sin(st.ph) * 40;
      }
      const TOL = 9; // ventana para acertar (más ancha = más fácil)
      const ok = Math.abs(st.off) < TOL;
      // tarjeta del elemento (líneas brillantes) que se desliza
      px(BAR_X - 4, 70, '#14172a', BAR_W + 8, 18);
      // ventanas: dónde tienen que caer las líneas (se ponen verdes al acertar)
      el.lines.forEach((nm) => {
        const wx = nmX(nm) - TOL;
        P.ctx.fillStyle = ok ? 'rgba(92,255,138,0.35)' : 'rgba(255,255,255,0.12)';
        P.ctx.fillRect(Math.round(wx), 70, TOL * 2, 18);
      });
      el.lines.forEach((nm) => px(nmX(nm) + st.off, 72, nmColor(nm), 2, 14));
      text(el.name, 160, 90, ok ? '#5cff8a' : '#ffffff', 6, 'center');
      if (ok) el.lines.forEach((nm) => {
        for (let y = 57; y < 70; y += 3) px(nmX(nm), y, '#5cff8a');
      });
      if (P.action() && st.mT <= 0) {
        if (ok) {
          st.matched.push(st.round);
          P.award(`l${st.round}`, 3, 160, 30, `¡${el.name}!`);
          P.flash('#5cff8a55');
          P.burst(160, 48, 24, ['#5cff8a', '#ffffff', '#ffcc33'], 50, 0.7);
          P.setAction(el.say);
          st.round += 1;
          st.mT = 1.2;
          st.ph = Math.PI / 2;
          st.off = 40; // la siguiente tarjeta empieza desalineada
          if (st.round >= ELEMENTS.length) {
            st.done = true;
            const s = st.misses === 0 ? 3 : st.misses <= 2 ? 2 : 1;
            delete P.game.stars.l0;
            delete P.game.stars.l1;
            P.game.stars.lines = s;
          }
        } else {
          st.misses += 1;
          P.tone(160, 0.12, 'square', 0.05);
          P.shake(0.12);
          P.popup('No coinciden: espera', 160, 30, '#ff8c42', 6);
        }
      }
    } else {
      st.dT += dt;
      if (st.dT > 2.4) P.go('b_end');
    }
    P.updateParticles(dt);
    P.drawPopups(dt);
  };

  // ================= Fichas NASA y pregunta =================
  S.add(scenes, enter, {
    b_intro: S.brief({
      step: 0,
      img: 'eva4-stis.jpg',
      cap: 'Mike Massimino durante la 4.ª caminata, reparando el espectrógrafo STIS, 17 may 2009 (NASA, S125-E-008728).',
      alt: 'Astronauta con traje blanco trabajando dentro del Hubble',
      kicker: '17 may 2009 · 4.ª caminata espacial',
      title: 'Reparar el espectrógrafo STIS',
      rows: [
        ['Astronautas', 'Mike Massimino y Michael Good'],
        ['Duración', '8 h 2 min fuera de la nave'],
        ['Problema', 'el STIS estaba apagado desde 2004 (falló su fuente de energía)'],
        ['Reto', '111 tornillos con guantes gruesos'],
      ],
      note: '<b>Nunca se había hecho:</b> abrir un instrumento del Hubble en el espacio para cambiarle una tarjeta electrónica.',
      btn: '¡A reparar!',
      next: 'rail',
      draw(dt) {
        S.orbitBackdrop(dt, 640);
        drawStisPanel(false);
      },
    }),
    b_end: S.brief({
      step: 5,
      img: 'carina-wfc3.jpg',
      cap: 'Nebulosa de Carina vista por la WFC3, publicada el 9 sep 2009 (NASA, ESA y equipo Hubble SM4 ERO).',
      alt: 'Columna de gas y polvo anaranjado entre estrellas brillantes',
      kicker: 'Lo que aprendiste',
      title: 'La luz es el código de barras de las estrellas',
      rows: [
        ['Hidrógeno', 'líneas en 410, 434, 486 y 656 nm'],
        ['Sodio', 'una línea doble en 589 nm'],
        ['En esta foto', 'nubes de hidrógeno donde nacen estrellas'],
      ],
      note: 'Sin viajar a una estrella, los científicos saben de qué está hecha. ¡Para eso sirve el STIS!',
      btn: 'Última pregunta',
      next: 'quiz',
      draw(dt) {
        P.clear('#04050a');
        P.drawStars(dt, 0.5);
      },
    }),
    quiz: S.quiz({
      phase: 'quiz',
      step: 5,
      q: '¿Qué hace un espectrógrafo como el STIS?',
      options: ['Separa la luz en colores para saber de qué están hechas las estrellas', 'Hace zoom en las fotos', 'Mide la temperatura del astronauta'],
      correct: 0,
      explain: '¡Correcto! Cada elemento deja sus líneas en la luz, como un código de barras.',
      next: 'result',
    }),
  });

  S.makeGame({
    first: 'b_intro',
    phases: ['rail', 'screws', 'board', 'power', 'lines', 'quiz'],
    key: 'sts125_stis_best',
    stat: (r) => `STIS reparado en ${r.secs} s`,
    today: '<b>Hoy:</b> el STIS reparado sigue funcionando en el Hubble: estudia estrellas, galaxias y hasta el aire de planetas que giran alrededor de otras estrellas.',
    scenes,
    enter,
    titleDraw(dt, st, t) {
      S.orbitBackdrop(dt, 600);
      S.drawShuttleBay(150);
      S.drawHubble(240, 92, 0.9, t);
      S.drawAstronaut(200 + Math.sin(t) * 3, 80, 1.3, t);
      const cols = ['#ff4d6d', '#ffcc33', '#5cff8a', '#4cc9f0', '#9b5de5'];
      cols.forEach((c, i) => px(262, 40 + i * 3, c, 40, 3));
    },
    resultDraw(dt, st, t) {
      S.orbitBackdrop(dt, 640);
      drawStisPanel(true);
      S.drawBox(160, 78, 12, 50, '#9ef0b8', '', { glow: true });
    },
  });
})();
