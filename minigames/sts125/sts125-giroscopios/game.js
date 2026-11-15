/* Minijuego STS-125: "Giroscopios y baterías"
 * Datos reales (ver Fuentes):
 *  - 15 may 2009, 2.ª caminata (7 h 56 min): Mike Massimino y Michael Good cambiaron los 6 giroscopios
 *    del Hubble (en parejas, dentro de 3 cajas). La última caja nueva no encajaba y usaron una de repuesto.
 *  - Después cambiaron el primer módulo de baterías (bahía 2). El Hubble tiene 2 módulos con 3 baterías
 *    de níquel-hidrógeno de unos 57 kg (125 libras) cada una. El segundo módulo se cambió el 18 may.
 *  - La rueda de cada giroscopio gira a 19.200 vueltas por minuto. El Hubble apunta con una precisión
 *    comparable a mantener un láser sobre una moneda a 320 km (200 millas).
 *  - Quinteto de Stephan: una de las primeras fotos de la WFC3 tras la reparación (9 sep 2009).
 *  - Desde junio de 2024 el Hubble funciona con 1 solo giroscopio y guarda otro de reserva.
 * Pensado para niños: tocar, pulsar a tiempo y mantener pulsado.
 */
(() => {
  'use strict';
  const P = window.PX;
  const S = window.STS;
  const { px, text, ring, clamp, lerp, rand } = P;

  const SLOTS = [90, 160, 230];
  const SLOT_Y = 76;

  /** Panel del Hubble con los 3 huecos. state: 'old' | 'empty' | 'new' por hueco. */
  function drawBayPanel(states, current, t) {
    px(40, 34, '#c9ccd8', 240, 80);
    px(40, 34, '#e2e4ec', 240, 3);
    px(40, 111, '#8b8fb3', 240, 3);
    text('GIROSCOPIOS DEL HUBBLE', 160, 39, '#555a6e', 5, 'center');
    SLOTS.forEach((x, i) => {
      px(x - 22, SLOT_Y - 20, '#22243a', 44, 42);
      // muesca (arriba): aquí tiene que apuntar la flecha
      px(x - 3, SLOT_Y - 24, i === current ? '#ffcc33' : '#555a6e', 6, 4);
      if (states[i] === 'old') S.drawBox(x, SLOT_Y, 38, 36, '#ff8c8c', 'VIEJA', { labelColor: '#5a0a1a' });
      if (states[i] === 'new') S.drawBox(x, SLOT_Y, 38, 36, '#9ef0b8', 'NUEVA', { labelColor: '#0a5c2b', glow: true });
      if (i === current && states[i] === 'old') ring(x, SLOT_Y, 26 + Math.sin(t * 6) * 2, '#ff4d6d', 0.08);
    });
  }

  /** Caja nueva con su flecha que gira. ang = 0 apunta arriba. */
  function drawSpinningBox(x, y, ang, spare) {
    S.drawBox(x, y, 38, 36, spare ? '#9fc9ff' : '#9ef0b8', spare ? 'REPUESTO' : 'NUEVA', { labelColor: '#0b1d4a' });
    const ax = x + Math.sin(ang) * 14;
    const ay = y - Math.cos(ang) * 14;
    P.line(x, y + 6, ax, ay, '#22243a');
    px(ax - 2, ay - 2, '#ff4d6d', 5, 5);
  }

  function enterBox(st, i) {
    P.setStep(i);
    Object.assign(st, { i, phase: 'remove', oldX: SLOTS[i], oldY: SLOT_Y, oldSpin: 0, ang: 0.6, y: 20, tries: 0, spare: false, failedOnce: false, inT: 0, msgT: 0 });
    P.setAction('Toca la caja ROJA para sacarla');
  }

  const states = ['old', 'old', 'old'];
  const enter = {
    box1(st) {
      states.fill('old');
      P.setSong('action');
      enterBox(st, 0);
      P.setFact('Cada caja lleva 2 giroscopios. Tienes que meterla con la muesca hacia ARRIBA.');
    },
    box2(st) {
      enterBox(st, 1);
      P.setFact('Los giroscopios ayudan al Hubble a apuntar con precisión, sin moverse ni un poquito.');
    },
    box3(st) {
      enterBox(st, 2);
      P.setFact('Van en parejas dentro de cajas: 3 cajas = 6 giroscopios nuevos.');
    },
  };

  function boxScene(next) {
    return (dt, st, t) => {
      S.orbitBackdrop(dt, 640);
      drawBayPanel(states, st.i, t);
      const x = SLOTS[st.i];
      if (st.phase === 'remove') {
        S.drawAstronaut(x + 34, SLOT_Y + 4, 1.3, t, true);
        if (P.action()) {
          states[st.i] = 'empty';
          st.phase = 'floatOut';
          P.tone(300, 0.08, 'square', 0.05);
          P.noise(0.1, 0.08, 1500);
          P.burst(x, SLOT_Y, 12, ['#ff8c8c', '#ffffff'], 30, 0.5);
        }
      } else if (st.phase === 'floatOut') {
        st.oldY -= 60 * dt;
        st.oldX -= 25 * dt;
        st.oldSpin += dt;
        S.drawBox(st.oldX, st.oldY, 38, 36, '#ff8c8c', 'VIEJA', { labelColor: '#5a0a1a' });
        if (st.oldY < -30) {
          st.phase = 'spin';
          P.setAction('Pulsa cuando la flecha ROJA apunte ARRIBA');
        }
      } else if (st.phase === 'spin' || st.phase === 'nofit') {
        // la caja nueva gira despacio sobre el hueco
        st.ang = (st.ang + dt * 2.2) % (Math.PI * 2);
        const bx = x;
        const by = SLOT_Y - 4 + Math.sin(t * 2) * 2;
        drawSpinningBox(bx, by, st.ang, st.spare);
        const err = Math.min(st.ang, Math.PI * 2 - st.ang);
        if (err < 0.25) text('¡AHORA!', x, 22, '#5cff8a', 7, 'center');
        S.drawAstronaut(x + 34, SLOT_Y + 4, 1.3, t, true);
        if (st.msgT > 0) st.msgT -= dt;
        if (P.action() && st.phase === 'spin') {
          st.tries += 1;
          if (err < 0.42) {
            // En la caja 3 la primera "nueva" no encaja, como en la misión real
            if (st.i === 2 && !st.spare) {
              st.phase = 'nofit';
              st.msgT = 2.2;
              P.shake(0.25);
              P.tone(140, 0.25, 'square', 0.06);
              P.popup('¡NO ENCAJA!', x, 30, '#ff4d6d', 9);
              P.setAction('¡No encaja! Como en la misión real...');
              P.setFact('En la misión real, la última caja no encajaba. Los astronautas usaron una caja de repuesto.', 9);
            } else {
              st.phase = 'insert';
              st.quality = err < 0.18 ? 3 : 2;
              P.tone(500, 0.08, 'square', 0.06);
            }
          } else {
            P.popup('Todavía no: espera la flecha ARRIBA', x, 30, '#ff8c42', 5);
            P.tone(200, 0.08, 'square', 0.04);
          }
        }
        if (st.phase === 'nofit' && st.msgT <= 0) {
          st.phase = 'spin';
          st.spare = true;
          st.ang = 0.6;
          P.setAction('¡Caja de REPUESTO! Pulsa con la flecha ARRIBA');
          P.arp([392, 494, 587], 0.07, 'square', 0.05);
        }
      } else if (st.phase === 'insert') {
        st.inT += dt;
        const k = clamp(st.inT / 0.5, 0, 1);
        S.drawBox(x, lerp(SLOT_Y - 4, SLOT_Y, k), 38, 36, st.spare ? '#9fc9ff' : '#9ef0b8', st.spare ? 'REPUESTO' : 'NUEVA', { labelColor: '#0b1d4a' });
        if (k >= 1 && states[st.i] !== 'new') {
          states[st.i] = 'new';
          const s = st.tries <= 1 || (st.spare && st.tries <= 2) ? st.quality : Math.max(1, st.quality - 1);
          P.award(`box${st.i + 1}`, s, x, 26, s === 3 ? '¡CLIC PERFECTO!' : '¡DENTRO!');
          P.noise(0.15, 0.15, 700);
          P.tone(110, 0.2, 'square', 0.08);
          P.shake(0.15);
          P.burst(x, SLOT_Y, 24, ['#5cff8a', '#ffffff', '#ffcc33'], 45, 0.7);
          // los 2 giroscopios de la caja giran
          st.done = true;
          st.doneT = 0;
        }
        if (st.done) {
          st.doneT += dt;
          ring(x - 8, SLOT_Y + 6, 4, '#5cff8a', 0.3);
          ring(x + 8, SLOT_Y + 6, 4, '#5cff8a', 0.3);
          px(x - 8 + Math.cos(t * 12) * 4, SLOT_Y + 6 + Math.sin(t * 12) * 4, '#ffffff');
          px(x + 8 + Math.cos(-t * 12) * 4, SLOT_Y + 6 + Math.sin(-t * 12) * 4, '#ffffff');
          if (st.doneT > 1.4) P.go(next);
        }
      }
      P.setMeter(states.filter((s) => s === 'new').length / 3);
      P.updateParticles(dt);
      P.drawPopups(dt);
    };
  }

  const scenes = { box1: boxScene('box2'), box2: boxScene('box3'), box3: boxScene('b_batt') };

  // ---------- Módulo de baterías: empujar y soltar a tiempo (inercia) ----------
  const SLOT_X = 236;
  const MOD_Y = 74;
  function drawModule(x, y, lit = 0) {
    S.drawBox(x, y, 46, 30, '#c9ccd8', '', {});
    for (let i = 0; i < 3; i++) {
      px(x - 19 + i * 13, y - 9, '#22243a', 11, 18);
      px(x - 18 + i * 13, y - 8, i < lit ? '#5cff8a' : '#555a6e', 9, 16);
    }
    text('BATERÍAS', x, y + 17, '#c9ccd8', 5, 'center');
  }
  enter.battery = (st) => {
    P.setStep(3);
    P.setSong('action');
    Object.assign(st, { x: 70, v: 0, hits: 0, done: false, dT: 0 });
    P.setAction('Mantén para empujar y suelta ANTES de llegar', true);
    P.setFact('En el espacio las cosas no pesan, pero cuesta frenarlas: si empujas mucho, ¡siguen y siguen!', 9);
  };
  scenes.battery = (dt, st, t) => {
    S.orbitBackdrop(dt, 640);
    // costado del Hubble con la bahía abierta
    px(196, 34, '#c9ccd8', 110, 80);
    px(196, 34, '#e2e4ec', 110, 3);
    text('BAHÍA 2', 251, 38, '#555a6e', 5, 'center');
    px(SLOT_X - 26, MOD_Y - 19, '#14172a', 52, 38);
    const lim = SLOT_X;
    if (!st.done) {
      const holding = P.input.held;
      if (holding) {
        st.v = Math.min(60, st.v + 34 * dt);
        if (Math.random() < 0.4) P.burst(st.x - 30, MOD_Y + rand(-8, 8), 1, ['#ffffff', '#c9d4ff'], 20, 0.3, 0, 1, Math.PI, 0.6);
      } else st.v = Math.max(0, st.v - 7 * dt);
      st.x += st.v * dt;
      if (st.x >= lim) {
        if (st.v < 20) {
          st.done = true;
          st.x = lim;
          const s = st.hits === 0 && st.v < 13 ? 3 : st.hits <= 1 ? 2 : 1;
          P.award('battery', s, 160, 28, s === 3 ? '¡SUAVECITO!' : '¡CONECTADO!');
          P.noise(0.15, 0.15, 700);
          P.tone(110, 0.2, 'square', 0.08);
          P.setAction('¡Baterías conectadas!');
        } else {
          st.hits += 1;
          st.x = lim - 2;
          st.v = -st.v * 0.35;
          P.shake(0.35);
          P.noise(0.2, 0.2, 1500);
          P.tone(130, 0.2, 'square', 0.06);
          P.popup('¡CLONK! Muy rápido: suelta antes', 160, 28, '#ff4d6d', 7);
        }
      }
      if (st.v < 0) st.v = Math.min(0, st.v + 20 * dt);
      st.x = Math.max(50, st.x);
      // guía punteada hasta la bahía
      for (let x = st.x + 26; x < SLOT_X - 26; x += 6) px(x, MOD_Y, '#3a4a7a', 3, 1);
    } else st.dT += dt;
    const lit = st.done ? Math.min(3, Math.floor(st.dT * 3)) : 0;
    drawModule(st.x, MOD_Y, lit);
    if (!st.done) S.drawAstronaut(st.x - 34, MOD_Y + 2, 1.4, t);
    else if (lit >= 3 && st.dT < 1.2) P.burst(SLOT_X, MOD_Y, 3, ['#5cff8a', '#ffffff'], 30, 0.5);
    // velocímetro
    const g = clamp(Math.abs(st.v) / 60, 0, 1);
    text('VELOCIDAD', 40, 26, '#4cc9f0', 5);
    px(40, 34, '#22243a', 80, 6);
    px(40, 34, '#1f7a3a', 80 * (20 / 60), 6);
    px(40, 34, Math.abs(st.v) < 20 ? '#5cff8a' : '#ff4d6d', 80 * g, 6);
    text(Math.abs(st.v) < 20 ? 'LENTO = BIEN' : '¡MUY RÁPIDO!', 40, 43, Math.abs(st.v) < 20 ? '#5cff8a' : '#ff4d6d', 5);
    P.setMeter(clamp((st.x - 70) / (lim - 70), 0, 1));
    if (st.done && st.dT > 1.8) P.go('photo');
    P.updateParticles(dt);
    P.drawPopups(dt);
  };

  // ---------- Prueba de puntería: foto con el Hubble ya arreglado ----------
  S.img('quinteto-stephan.jpg');
  S.add(scenes, enter, {
    photo: S.photoPhase({
      phase: 'photo',
      step: 4,
      next: 'b_photo',
      start: { x: 90, y: 66 },
      song: 'calm',
      action: 'Centra las galaxias y pulsa cuando estén NÍTIDAS',
      fact: 'Con giroscopios nuevos, el Hubble apunta tan firme como un láser sobre una moneda a 320 km.',
      label: 'CENTRA LAS GALAXIAS',
      world(dt, st, t) {
        P.clear('#03040a');
        P.drawStars(dt, 0.6);
        const x = 196 + Math.sin(t * 0.4) * 60;
        const y = 66 + Math.sin(t * 0.63) * 12;
        if (!S.drawPix('quinteto-stephan.jpg', x - 22, y - 24, 44, 49)) P.ring(x, y, 10, '#c9d4ff');
        return { x, y };
      },
    }),
  });

  // ---------- Fichas NASA y pregunta ----------
  S.add(scenes, enter, {
    b_intro: S.brief({
      step: 0,
      img: 'eva2-giroscopios.jpg',
      cap: 'Mike Massimino trabaja en el Hubble dentro de la bodega del Atlantis, 15 may 2009 (NASA, S125-E-007537).',
      alt: 'Un astronauta trabaja entre paneles dorados del Hubble',
      kicker: '15 may 2009 · 2.ª caminata espacial',
      title: 'Giroscopios nuevos para apuntar',
      rows: [
        ['Astronautas', 'Mike Massimino y Michael Good'],
        ['Duración', '7 h 56 min fuera de la nave'],
        ['Tarea 1', '6 giroscopios nuevos, en 3 cajas'],
        ['Tarea 2', 'un módulo de baterías nuevo'],
      ],
      note: '<b>¿Qué es un giroscopio?</b> Una rueda que gira a 19.200 vueltas por minuto y nota el más mínimo movimiento. Así el Hubble sabe hacia dónde apunta.',
      btn: '¡A cambiarlos!',
      next: 'box1',
      draw(dt, st, t) {
        S.orbitBackdrop(dt, 640);
        drawBayPanel(['old', 'old', 'old'], -1, t);
      },
    }),
    b_batt: S.brief({
      step: 3,
      img: 'eva2-brazo.jpg',
      cap: 'Michael Good, sobre el brazo robótico, trabaja en el Hubble, 15 may 2009 (NASA, S125-E-007742).',
      alt: 'Astronauta sujeto al extremo del brazo robótico frente al Hubble',
      kicker: 'Misma caminata · ¡aún no termina!',
      title: 'Ahora, las baterías',
      rows: [
        ['Baterías del Hubble', '6, en 2 módulos de 3'],
        ['Cada batería', 'unos 57 kg (125 libras)'],
        ['Hoy cambias', 'el módulo 1 (el 2 se cambió el 18 de mayo)'],
      ],
      note: 'Las baterías guardan la energía de los paneles solares para cuando el Hubble pasa por la sombra de la Tierra.',
      btn: '¡A empujar!',
      next: 'battery',
      draw(dt, st, t) {
        S.orbitBackdrop(dt, 640);
        drawBayPanel(['new', 'new', 'new'], -1, t);
      },
    }),
    b_photo: S.brief({
      step: 5,
      mine: true,
      img: 'quinteto-stephan.jpg',
      cap: 'Quinteto de Stephan, foto de la WFC3 publicada el 9 sep 2009 (NASA, ESA y equipo Hubble SM4 ERO).',
      alt: 'Cinco galaxias juntas; algunas se deforman al chocar',
      kicker: 'Prueba superada · Tu foto y la foto real',
      title: '¡El Quinteto de Stephan!',
      rows: [
        ['Qué es', 'un grupo de galaxias que chocan entre sí'],
        ['Tomada', 'después de esta reparación (2009)'],
        ['Puntería', 'como un láser sobre una moneda a 320 km'],
      ],
      note: 'Para una foto así, el Hubble debe quedarse quieto mucho rato. Sin giroscopios, ¡saldría movida!',
      btn: 'Última pregunta',
      next: 'quiz',
      draw(dt) {
        P.clear('#03040a');
        P.drawStars(dt, 0.6);
      },
    }),
    quiz: S.quiz({
      phase: 'quiz',
      step: 5,
      q: '¿Para qué sirven los giroscopios del Hubble?',
      options: ['Para darle energía', 'Para saber hacia dónde apunta y quedarse quieto', 'Para enfriar la cámara'],
      correct: 1,
      explain: '¡Eso es! Sin ellos, el Hubble no podría apuntar a una estrella ni sacar fotos nítidas.',
      next: 'result',
    }),
  });


  S.makeGame({
    first: 'b_intro',
    phases: ['box1', 'box2', 'box3', 'battery', 'photo', 'quiz'],
    key: 'sts125_gyro_best',
    stat: (r) => `Hubble listo en ${r.secs} s`,
    today: '<b>Hoy:</b> desde junio de 2024, el Hubble funciona con <b>1 solo giroscopio</b> y guarda otro de reserva, para seguir trabajando muchos años.',
    scenes,
    enter,
    titleDraw(dt, st, t) {
      S.orbitBackdrop(dt, 600);
      S.drawShuttleBay(150);
      S.drawHubble(240, 92, 0.9, t);
      S.drawAstronaut(200 + Math.sin(t) * 3, 78, 1.3, t);
      S.drawBox(196, 104 + Math.sin(t * 1.5) * 2, 22, 18, '#9ef0b8');
      ring(196, 104 + Math.sin(t * 1.5) * 2, 5, '#0a5c2b', 0.3);
      px(196 + Math.cos(t * 10) * 5, 104 + Math.sin(t * 10) * 5 + Math.sin(t * 1.5) * 2, '#ffffff');
    },
    resultDraw(dt, st, t) {
      S.orbitBackdrop(dt, 640);
      drawBayPanel(['new', 'new', 'new'], -1, t);
    },
  });
})();
