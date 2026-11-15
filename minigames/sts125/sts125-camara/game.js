/* Minijuego STS-125: "Cámara nueva para el Hubble"
 * Datos reales (ver Fuentes):
 *  - 14 may 2009, 1.ª caminata (7 h 20 min): John Grunsfeld y Andrew Feustel sacaron la Wide Field
 *    Planetary Camera 2 (WFPC2, en el Hubble desde dic 1993) e instalaron la Wide Field Camera 3 (WFC3).
 *  - Un tornillo de la cámara vieja estaba atascado: si se rompía, no podían sacarla.
 *  - La WFPC2 tomó los "Pilares de la Creación" (1-2 abr 1995, 32 imágenes). Volvió a la Tierra y es parte
 *    de la colección del Museo Nacional del Aire y el Espacio (Smithsonian).
 *  - La WFC3 ve luz ultravioleta, visible e infrarroja cercana. Entre sus primeras fotos (publicadas el
 *    9 sep 2009) está la Nebulosa de la Mariposa (NGC 6302).
 *  - Las cámaras del Hubble toman fotos en blanco y negro a través de filtros; las fotos en color se combinan después.
 * Pensado para niños: un botón (o el dedo) y flechas. Fuerzas y tiempos simplificados.
 */
(() => {
  'use strict';
  const P = window.PX;
  const S = window.STS;
  const { W, H, px, text, ring, clamp, lerp, rand } = P;
  const { drawHubble, drawAstronaut, drawShuttleBay } = S;

  /** Una cámara (caja con radiador curvo, como las del Hubble). */
  function drawCamera(x, y, s, body = '#d9dce6', label = '', glow = false) {
    const R = (dx, dy, w, h, c) => px(x + dx * s, y + dy * s, c, Math.max(1, Math.round(w * s)), Math.max(1, Math.round(h * s)));
    R(-22, -14, 44, 28, body);
    R(-22, -14, 44, 3, '#f4f5fa');
    R(-22, 11, 44, 3, '#8b8fb3');
    // radiador
    R(-26, -12, 4, 24, '#f4f5fa');
    for (let i = -12; i < 12; i += 3) R(-26, i, 4, 1, '#c9ccd8');
    // asas
    R(-6, -18, 12, 2, '#ffcc33');
    R(-6, -18, 2, 4, '#ffcc33');
    R(4, -18, 2, 4, '#ffcc33');
    if (label) text(label, x, y - 3 * s, '#22243a', Math.max(5, Math.round(5 * s)), 'center');
    if (glow) for (let i = 0; i < 3; i++) px(x + rand(-22, 22) * s, y + rand(-14, 14) * s, '#5cff8a');
  }

  /** Cabeza de tornillo hexagonal que gira. */
  function drawBolt(cx, cy, r, ang, color) {
    for (let y = -r; y <= r; y++) {
      for (let x = -r; x <= r; x++) {
        // hexágono girado
        let inside = true;
        for (let k = 0; k < 6; k++) {
          const a = ang + (k * Math.PI) / 3;
          if (x * Math.cos(a) + y * Math.sin(a) > r * 0.87) inside = false;
        }
        if (inside) px(cx + x, cy + y, (x + y) % 5 === 0 ? '#ffffff' : color);
      }
    }
    ring(cx, cy, r * 0.35, '#555a6e', 0.15);
  }

  // ================= Filtros de color (foto real de la WFC3) =================
  const IW = 72;
  const IH = 84;
  const IX = 160 - IW / 2;
  const IY = 24;
  const FILTERS = [
    { name: 'FILTRO ROJO', c: '#ff0000', dim: '#5a0a1a', hint: 'Espera a que el ROJO pase por el centro' },
    { name: 'FILTRO VERDE', c: '#00ff00', dim: '#0a5c2b', hint: 'Espera a que el VERDE pase por el centro' },
    { name: 'FILTRO AZUL', c: '#0000ff', dim: '#0b1d4a', hint: 'Espera a que el AZUL pase por el centro' },
  ];
  let chans = null;
  /** Separa la foto real en 3 capas (rojo, verde, azul), como los filtros del Hubble. */
  function makeChans() {
    const base = S.pixImg('mariposa-wfc3.jpg', IW, IH);
    if (!base) return null;
    return FILTERS.map((f) => {
      const c = document.createElement('canvas');
      c.width = IW;
      c.height = IH;
      const g = c.getContext('2d');
      g.drawImage(base, 0, 0);
      g.globalCompositeOperation = 'multiply';
      g.fillStyle = f.c;
      g.fillRect(0, 0, IW, IH);
      return c;
    });
  }
  S.img('mariposa-wfc3.jpg');

  // ================= Escenas =================
  let earthScroll = 0;
  const enter = {
    bolt(st) {
      P.setStep(0);
      Object.assign(st, { torque: 0, prog: 0, cracks: 0, done: false, doneT: 0, beat: 0, crackCool: 0 });
      P.setSong('action');
      P.setAction('¡Tornillo atascado! Toca a ritmo: tun, tun, tun', true);
      P.setFact('Grunsfeld y Feustel encontraron un tornillo atascado. ¡Si se rompía, no podían sacar la cámara vieja!');
    },
    out(st) {
      P.setStep(1);
      Object.assign(st, { prog: 0, done: false, doneT: 0 });
      P.setAction('Mantén pulsado para sacar la cámara vieja', true);
      P.setFact('La cámara vieja (WFPC2) trabajó 16 años en el Hubble. Volvió a la Tierra en el Atlantis.');
    },
    align(st) {
      P.setStep(2);
      Object.assign(st, { x: 70, vx: 0, depth: 0, jams: 0, jammed: false, done: false, doneT: 0, t: 0 });
      P.setSong('action');
      P.setAction('Mueve la cámara (flechas) hasta ver las guías VERDES', true);
      P.setFact('La nueva Wide Field Camera 3 tiene que entrar justo en su lugar, como una pieza de puzle.');
    },
    color(st) {
      P.setStep(3);
      Object.assign(st, { layer: 0, ph: 0, off: 0, misses: 0, quality: [], done: false, dT: 0, shot: null });
      P.setSong('tense');
      P.setAction('Pulsa cuando el ROJO esté en el centro');
      P.setFact('Las cámaras del Hubble sacan fotos en blanco y negro con filtros de colores. ¡Alinéalos para ver la foto a color!', 9);
    },
  };

  const scenes = {
    // 1) Aflojar el tornillo atascado: tocar a ritmo, sin pasarse de fuerza
    bolt(dt, st, t) {
      P.clear('#0b0e1c');
      // panel del Hubble (primer plano)
      px(40, 30, '#c9ccd8', 240, 130);
      px(40, 30, '#e2e4ec', 240, 4);
      for (let i = 50; i < 280; i += 26) px(i, 38, '#a9adbd', 2, 118);
      for (let i = 0; i < 8; i++) px(56 + i * 30, 150, '#8b8fb3', 4, 4);
      text('PESTILLO A', 96, 36, '#555a6e', 6, 'center');
      const cx = 96;
      const cy = 80;
      // guía de ritmo (late 2 veces por segundo)
      st.beat += dt * 2;
      const pulse = 1 - (st.beat % 1);
      ring(cx, cy, 30 + pulse * 6, `rgba(76,201,240,${0.3 + pulse * 0.5})`, 0.06);
      const ang = st.prog * Math.PI * 6;
      const col = st.torque > 0.88 ? '#ff4d6d' : st.torque >= 0.3 ? '#5cff8a' : '#ffcc33';
      if (!st.done) {
        drawBolt(cx, cy, 14, ang, col);
        // llave (herramienta) unida al tornillo
        const wx = cx + Math.cos(ang) * 16;
        const wy = cy + Math.sin(ang) * 16;
        P.line(cx, cy, cx + Math.cos(ang) * 42, cy + Math.sin(ang) * 42, '#555a6e');
        px(wx - 2, wy - 2, '#8b8fb3', 5, 5);
        // guante del astronauta
        px(cx + Math.cos(ang) * 42 - 5, cy + Math.sin(ang) * 42 - 5, '#f2f3f7', 10, 10);
        px(cx + Math.cos(ang) * 42 - 5, cy + Math.sin(ang) * 42 + 3, '#d9dce6', 10, 2);
      } else {
        st.doneT += dt;
        drawBolt(cx + st.doneT * 60, cy - st.doneT * 40, 14, ang + st.doneT * 10, '#5cff8a');
        px(cx - 6, cy - 6, '#22243a', 12, 12);
      }
      // medidor de fuerza
      const gx = 220;
      const g0 = 40;
      const gh = 70;
      text('FUERZA', gx + 12, g0 - 12, '#22243a', 5, 'center');
      px(gx - 2, g0 - 2, '#22243a', 28, gh + 4);
      px(gx, g0, '#000', 24, gh);
      px(gx, g0 + gh * 0.15, '#5a0a1a', 24, gh * 0.1); // rojo arriba
      px(gx, g0 + gh * 0.15, '#ff4d6d', 24, 1);
      px(gx, g0 + gh * 0.15 + gh * 0.1, '#1f7a3a', 24, gh * 0.5);
      px(gx, g0 + gh * (1 - clamp(st.torque, 0, 1)), col, 24, gh * clamp(st.torque, 0, 1));
      text('¡NO!', gx + 12, g0 + gh * 0.17, '#ffffff', 5, 'center');
      // progreso
      text(`${Math.round(st.prog * 100)}% FUERA`, 96, 112, '#22243a', 6, 'center');

      if (!st.done) {
        st.crackCool = Math.max(0, st.crackCool - dt);
        if (P.action() && st.crackCool <= 0) {
          st.torque += 0.22;
          P.tone(160 + st.torque * 300, 0.05, 'square', 0.05);
          P.burst(cx + rand(-10, 10), cy + rand(-10, 10), 3, ['#ffcc33', '#ffffff'], 25, 0.3);
        }
        // la fuerza baja poco a poco: tocar ~2 veces por segundo la deja en verde; muy rápido llega al rojo
        st.torque = Math.max(0, st.torque - st.torque * 0.9 * dt);
        if (st.torque >= 0.3 && st.torque <= 0.88) st.prog = Math.min(1, st.prog + dt * 0.17);
        if (st.torque > 0.97) {
          st.cracks += 1;
          st.torque = 0.2;
          st.crackCool = 0.6;
          st.prog = Math.max(0, st.prog - 0.06);
          P.shake(0.35);
          P.noise(0.25, 0.2, 2500);
          P.popup('¡CRAC! Muy fuerte', 160, 60, '#ff4d6d', 9);
          P.setAction('¡Cuidado! Más suave: tun, tun, tun', true);
        }
        P.setMeter(st.prog);
        if (st.prog >= 1) {
          st.done = true;
          const s = st.cracks === 0 ? 3 : st.cracks <= 2 ? 2 : 1;
          P.award('bolt', s, 160, 60, s === 3 ? '¡SUELTO SIN ROMPERLO!' : '¡SUELTO!');
          P.arp([392, 523, 659], 0.07, 'square', 0.06);
          P.setAction('¡El tornillo salió!');
        }
      } else if (st.doneT > 1.8) P.go('out');
      P.updateParticles(dt);
      P.drawPopups(dt);
    },

    // 2) Sacar la cámara vieja: mantener pulsado
    out(dt, st, t) {
      P.clear();
      P.drawStars(dt, 1);
      earthScroll += dt * 25;
      P.earthLimb(earthScroll, { cy: 600 });
      // compartimento del Hubble (a la derecha)
      px(200, 30, '#c9ccd8', 120, 90);
      px(200, 30, '#e2e4ec', 120, 4);
      px(206, 46, '#22243a', 70, 52);
      if (!st.done) {
        if (P.input.held) {
          st.prog = Math.min(1, st.prog + dt * 0.4);
          if (Math.random() < 0.3) P.noise(0.05, 0.03, 900);
        }
        P.setMeter(st.prog);
        if (st.prog >= 1) {
          st.done = true;
          P.award('out', 3, 160, 50, '¡FUERA!');
          P.setAction('¡Cámara vieja fuera!');
        }
      } else st.doneT += dt;
      const camX = lerp(241, 120, st.prog) - st.doneT * 30;
      const camY = 72 - st.doneT * 12;
      drawCamera(camX, camY, 1, '#c9ccd8', 'WFPC2');
      drawAstronaut(camX - 34, camY + 4 + Math.sin(t * 2) * 1, 1.5, t);
      if (P.input.held && !st.done && Math.random() < 0.5) P.burst(camX + 24, camY, 1, ['#ffffff'], 15, 0.4);
      if (st.done && st.doneT > 1.6) P.go('b_old');
      P.updateParticles(dt);
      P.drawPopups(dt);
    },

    // 3) Meter la cámara nueva: alinear las guías y mantener pulsado
    align(dt, st, t) {
      P.clear();
      P.drawStars(dt, 1);
      earthScroll += dt * 25;
      P.earthLimb(earthScroll, { cy: 600 });
      st.t += dt;
      // ranura del Hubble abajo, en el centro
      const slotX = 160;
      px(60, 96, '#c9ccd8', 200, 70);
      px(60, 96, '#e2e4ec', 200, 3);
      px(slotX - 26, 98, '#22243a', 52, 66);
      const aligned = Math.abs(st.x - slotX) < 4;
      // guía de la ranura
      px(slotX - 2, 90, aligned ? '#5cff8a' : '#ffcc33', 4, 6);
      if (!st.done) {
        // la cámara flota y se desvía un poco
        const drift = Math.sin(st.t * 1.4) * 10 + Math.sin(st.t * 0.7) * 6;
        const ax = P.axis().x;
        let ctrl = ax;
        if (P.input.pointerDown && P.input.pointer) ctrl = clamp((P.input.pointer.x - st.x) / 20, -1, 1);
        st.vx += (ctrl * 70 + drift * (st.depth > 0 ? 0.3 : 1)) * dt;
        st.vx *= 1 - 3 * dt;
        st.x = clamp(st.x + st.vx * dt, 40, 280);
        if (ctrl) P.burst(st.x - ctrl * 26, 46, 1, ['#ffffff', '#c9d4ff'], 18, 0.3);
        // meter: mantener ESPACIO (o tocar fuera de la cámara)
        // Teclado: mantener ESPACIO. Táctil: al mantener el dedo, si está alineada, entra sola.
        const push = (P.input.held && !P.input.pointerDown) || (P.input.pointerDown && aligned);
        if (push) {
          if (aligned) {
            st.depth = Math.min(1, st.depth + dt * 0.45);
            st.jammed = false;
            if (Math.random() < 0.3) P.noise(0.05, 0.03, 1200);
          } else if (st.depth > 0.05 && !st.jammed) {
            st.jammed = true;
            st.jams += 1;
            P.shake(0.2);
            P.tone(150, 0.15, 'square', 0.05);
            P.popup('¡Se traba! Alinéala', st.x, 40, '#ff8c42', 7);
          }
        }
        P.setAction(aligned ? '¡VERDE! Mantén ESPACIO (o el dedo) para meterla' : 'Mueve la cámara hasta que las guías estén VERDES', true);
        P.setMeter(st.depth);
        if (st.depth >= 1) {
          st.done = true;
          st.x = slotX;
          const s = st.jams === 0 ? 3 : st.jams <= 2 ? 2 : 1;
          P.award('align', s, 160, 40, s === 3 ? '¡ENCAJE PERFECTO!' : '¡DENTRO!');
          P.noise(0.2, 0.2, 600);
          P.tone(110, 0.2, 'square', 0.08);
          P.shake(0.2);
          P.burst(slotX, 96, 30, ['#5cff8a', '#ffffff', '#ffcc33'], 50, 0.8);
          P.setAction('¡Clic! ¡Encajó!');
        }
      } else st.doneT += dt;
      const camY = lerp(44, 112, st.depth);
      // la cámara se recorta al entrar en la ranura
      P.ctx.save();
      P.ctx.beginPath();
      P.ctx.rect(0, 0, W, 96 + (st.depth > 0 ? 0 : 60));
      if (st.depth > 0) P.ctx.rect(slotX - 26, 96, 52, 70);
      P.ctx.clip();
      drawCamera(st.x, camY, 1, '#e8e8f0', 'WFC3', st.done);
      P.ctx.restore();
      // guía de la cámara
      px(st.x - 2, camY + 15, aligned ? '#5cff8a' : '#ffcc33', 4, 4);
      if (!st.done) drawAstronaut(st.x + 34, camY - 4, 1.4, t, true);
      if (aligned && !st.done) text('¡ALINEADA!', 160, 30, '#5cff8a', 7, 'center');
      if (st.done && st.doneT > 1.6) P.go('color');
      P.updateParticles(dt);
      P.drawPopups(dt);
    },


    // 4) Primera luz: alinear los 3 filtros de color de la foto
    color(dt, st, t) {
      P.clear('#04050a');
      P.drawStars(dt, 0.5);
      if (!chans) chans = makeChans();
      // marco de la "pantalla" de Control de Misión
      px(IX - 4, IY - 4, '#4cc9f0', IW + 8, IH + 8);
      px(IX - 2, IY - 2, '#000', IW + 4, IH + 4);
      text('FILTROS', 72, 26, '#4cc9f0', 5, 'center');
      text('WFC3', 248, 40, '#4cc9f0', 6, 'center');
      text('PRIMERA LUZ', 248, 52, '#4cc9f0', 5, 'center');
      const ctx = P.ctx;
      const cur = st.layer;
      if (!st.done) {
        st.ph += dt * (1.4 + cur * 0.3);
        st.off = Math.sin(st.ph) * 34;
      }
      if (chans) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(IX - 40, IY, IW + 80, IH);
        ctx.clip();
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 3; i++) {
          if (i < cur || st.done) ctx.drawImage(chans[i], IX, IY);
          else if (i === cur) ctx.drawImage(chans[i], Math.round(IX + st.off), IY);
        }
        ctx.restore();
        ctx.globalCompositeOperation = 'source-over';
      } else text('CARGANDO...', 160, 60, '#8b8fb3', 6, 'center');
      // ruedas de filtros a la izquierda
      FILTERS.forEach((f, i) => {
        const y = 36 + i * 22;
        const on = i < cur || st.done;
        px(40, y, '#22243a', 64, 16);
        px(42, y + 2, on ? f.c : i === cur ? f.dim : '#14172a', 12, 12);
        text(f.name.replace('FILTRO ', ''), 58, y + 5, i === cur && !st.done ? '#ffffff' : on ? '#5cff8a' : '#555a6e', 5);
        if (on) S.drawCheck(94, y + 5);
        if (i === cur && !st.done) px(36, y + 6, '#ffcc33', 3, 4);
      });
      if (!st.done) {
        // guía central fija y marca de la capa que se mueve
        const ok = Math.abs(st.off) < 7;
        px(159, IY - 6, ok ? '#5cff8a' : '#f4f1de', 3, 4);
        px(159, IY + IH + 2, ok ? '#5cff8a' : '#f4f1de', 3, 4);
        px(159 + st.off, IY + IH + 7, FILTERS[cur].c, 3, 3);
        if (ok) text('¡PULSA!', 160, IY + IH - 10, '#5cff8a', 6, 'center');
        if (P.action()) {
          const d = Math.abs(st.off);
          if (d < 7) {
            st.quality.push(d < 3 ? 3 : 2);
            P.flash(FILTERS[cur].c + '55');
            P.tone(400 + cur * 200, 0.12, 'square', 0.06);
            P.burst(160, IY + IH / 2, 20, [FILTERS[cur].c, '#ffffff'], 50, 0.6);
            P.popup(d < 3 ? '¡PERFECTO!' : '¡BIEN!', 160, IY + 10, '#5cff8a', 8);
            st.layer += 1;
            st.ph = Math.PI / 2;
            if (st.layer >= 3) {
              st.done = true;
              const avg = st.quality.reduce((a, b) => a + b, 0) / 3;
              const s = st.misses > 2 ? 1 : avg > 2.6 && st.misses === 0 ? 3 : 2;
              P.award('color', s, 160, IY + 26, '¡FOTO A COLOR!');
              P.arp([523, 659, 784, 1046, 1318], 0.08, 'square', 0.06);
              P.setAction('¡Primera foto a color!');
            } else P.setAction(`¡Ahora el ${FILTERS[st.layer].name.replace('FILTRO ', '')}!`);
          } else {
            st.misses += 1;
            P.shake(0.15);
            P.tone(160, 0.12, 'square', 0.05);
            P.popup('¡Desalineada! Espera el centro', 160, IY + 20, '#ff8c42', 6);
          }
        }
      } else {
        st.dT += dt;
        if (Math.random() < 0.3) P.burst(IX + rand(0, IW), IY + rand(0, IH), 1, ['#ffffff', '#ffcc33'], 10, 0.6);
        if (!st.shot && chans && st.dT > 0.4) {
          st.shot = S.snapshot(IX, IY, IW, IH);
          S.setShot(st.shot);
        }
        if (st.dT > 2.4) P.go('b_first');
      }
      P.updateParticles(dt);
      P.drawPopups(dt);
    },
  };

  // ================= Fichas NASA y pregunta =================
  S.add(scenes, enter, {
    b_intro: S.brief({
      step: 0,
      img: 'eva1-wfc3.jpg',
      cap: 'Andrew Feustel, sobre el brazo robótico, ayuda a instalar la Wide Field Camera 3, 14 may 2009 (NASA, S125-E-007372).',
      alt: 'Un astronauta con traje blanco trabaja sobre el brazo robótico junto al Hubble',
      kicker: '14 may 2009 · 1.ª caminata espacial',
      title: 'Cambia la cámara principal del Hubble',
      rows: [
        ['Astronautas', 'John Grunsfeld y Andrew Feustel'],
        ['Duración', '7 h 20 min fuera de la nave'],
        ['Sale', 'la cámara vieja WFPC2'],
        ['Entra', 'la nueva Wide Field Camera 3 (WFC3)'],
      ],
      note: '<b>Problema real:</b> un tornillo de la cámara vieja estaba atascado. Si se rompía, ¡no podían sacarla!',
      btn: '¡Al tornillo!',
      next: 'bolt',
      draw(dt, st, t) {
        P.clear();
        P.drawStars(dt, 1);
        P.earthLimb(t * 25, { cy: 560 });
      },
    }),
    b_old: S.brief({
      step: 2,
      img: 'pilares-1995.jpg',
      cap: 'Pilares de la Creación, nebulosa del Águila, abril de 1995 (NASA, Jeff Hester y Paul Scowen, Arizona State Univ.).',
      alt: 'Tres columnas de gas y polvo marrones sobre un fondo verde azulado',
      kicker: 'La cámara que acabas de sacar...',
      title: '...tomó esta foto famosa',
      rows: [
        ['Foto', 'Pilares de la Creación (1995)'],
        ['Cámara', 'WFPC2, en el Hubble de 1993 a 2009'],
        ['Hecha con', '32 imágenes de sus 4 sensores'],
        ['¿Y ahora?', 'Volvió a la Tierra: es parte del Museo Smithsonian'],
      ],
      note: 'Los pilares son nubes de gas y polvo donde nacen estrellas nuevas.',
      btn: 'Meter la cámara nueva',
      next: 'align',
      draw(dt, st, t) {
        P.clear();
        P.drawStars(dt, 1);
        P.earthLimb(t * 25, { cy: 600 });
      },
    }),
    b_first: S.brief({
      step: 4,
      mine: true,
      img: 'mariposa-wfc3.jpg',
      cap: 'Nebulosa de la Mariposa (NGC 6302), una de las primeras fotos de la WFC3, publicada el 9 sep 2009 (NASA, ESA y equipo Hubble SM4 ERO).',
      alt: 'Nube de gas con forma de alas de mariposa, en tonos rojos, blancos y azules',
      kicker: '¡Primera luz! · Tu foto y la foto real',
      title: '¡La Nebulosa de la Mariposa!',
      rows: [
        ['Qué es', 'gas que expulsa una estrella moribunda'],
        ['Tomada por', 'la WFC3 que acabas de instalar'],
        ['Publicada', '9 de septiembre de 2009'],
        ['La WFC3 ve', 'luz ultravioleta, visible e infrarroja'],
      ],
      note: '<b>¿Por qué filtros?</b> Las cámaras del Hubble sacan fotos en blanco y negro a través de filtros de colores. Luego se combinan, ¡como hiciste tú!',
      btn: 'Última pregunta',
      next: 'quiz',
      draw(dt) {
        P.clear('#04050a');
        P.drawStars(dt, 0.5);
      },
    }),
    quiz: S.quiz({
      phase: 'quiz',
      step: 4,
      q: '¿Cómo se hacen las fotos a color del Hubble?',
      options: ['Con una cámara de celular', 'Combinando fotos tomadas con filtros de colores', 'Pintándolas a mano'],
      correct: 1,
      explain: '¡Exacto! Se combinan fotos en blanco y negro tomadas con filtros rojo, verde, azul y otros.',
      next: 'result',
    }),
  });

  S.makeGame({
    first: 'b_intro',
    phases: ['bolt', 'out', 'align', 'color', 'quiz'],
    key: 'sts125_cam_best',
    stat: (r) => `Cámara cambiada en ${r.secs} s`,
    today: '<b>Hoy:</b> la WFC3 que se instaló en esta caminata sigue tomando fotos en el Hubble, más de 15 años después.',
    scenes,
    enter,
    titleDraw(dt, st, t) {
      P.clear();
      P.drawStars(dt, 2);
      earthScroll += dt * 25;
      P.earthLimb(earthScroll, { cy: 560 });
      drawShuttleBay(150);
      drawHubble(232, 96, 1, t);
      drawAstronaut(196 + Math.sin(t) * 3, 80 + Math.cos(t * 0.8) * 3, 1.3, t);
    },
    resultDraw(dt, st, t) {
      P.clear('#04050a');
      P.drawStars(dt, 1);
      if (chans) {
        P.ctx.globalCompositeOperation = 'lighter';
        for (const c of chans) P.ctx.drawImage(c, IX, IY - 6);
        P.ctx.globalCompositeOperation = 'source-over';
      }
    },
  });
})();
