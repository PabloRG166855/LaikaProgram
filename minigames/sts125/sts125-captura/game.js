/* Minijuego STS-125: "Atrapa el Hubble"
 * Datos reales (ver Fuentes):
 *  - 11 may 2009, 2:01 p. m. (EDT): despega el Atlantis desde la plataforma 39A con 7 astronautas.
 *  - 13 may 2009: el Atlantis alcanza al Hubble; la tripulación lo fotografía al acercarse (S125-E-006928).
 *  - Megan McArthur lo atrapa con el brazo robótico canadiense (15 m) y lo baja a la bodega (S125-E-006948).
 *  - El Hubble mide 13,2 m, viaja a unos 27.000 km/h y da una vuelta a la Tierra cada ~95 min. Lanzado el 24 abr 1990.
 *  - Feb 2025: casi 1,7 millones de observaciones de unos 55.000 objetos.
 * Pensado para niños: flechas o dedo para mover, ESPACIO o tocar para la acción.
 */
(() => {
  'use strict';
  const P = window.PX;
  const S = window.STS;
  const { px, text, clamp, lerp, rand } = P;

  const SH = { x: 52, y: 122 }; // hombro del brazo
  const BAY_Y = 128;
  const CRADLE_TOP = BAY_Y - 6;
  const HS = 0.8; // escala del Hubble
  const PIN = { dx: 13 * HS, dy: -1 * HS };
  const REACH = 154;

  function limitReach(p) {
    const dx = p.x - SH.x;
    const dy = p.y - SH.y;
    const d = Math.hypot(dx, dy);
    if (d > REACH) {
      p.x = SH.x + (dx / d) * REACH;
      p.y = SH.y + (dy / d) * REACH;
    }
  }

  /** Marco de la ventana de la cabina del Atlantis. */
  function cockpitFrame() {
    const c = '#14172a';
    for (let y = 0; y < 180; y++) {
      const w = Math.max(0, 26 - y * 0.12);
      px(0, y, c, w, 1);
      px(320 - w, y, c, w, 1);
    }
    px(0, 0, c, 320, 16);
    px(0, 16, '#2c2f4a', 320, 2);
    px(150, 0, c, 20, 20);
  }

  const scenes = {};
  const enter = {};

  // ---------- 0) Ficha: la tripulación ----------
  S.add(scenes, enter, {
    b_intro: S.brief({
      step: 0,
      img: 'tripulacion.jpg',
      cap: 'La tripulación de la STS-125 a bordo del Atlantis, 20 may 2009 (NASA, S125-E-012154).',
      alt: 'Siete astronautas con camisetas azules posan dentro del transbordador',
      kicker: '11 may 2009 · Despegue desde Florida',
      title: '7 astronautas van a salvar el Hubble',
      rows: [
        ['Nave', 'Transbordador Atlantis'],
        ['Comandante', 'Scott Altman'],
        ['Piloto', 'Gregory C. Johnson'],
        ['Especialistas', 'M. McArthur, J. Grunsfeld, M. Massimino, A. Feustel y M. Good'],
      ],
      note: 'Dos días después del despegue alcanzaron al telescopio. <b>Tu trabajo:</b> acercarte, fotografiarlo y atraparlo.',
      btn: '¡A por el Hubble!',
      next: 'chase',
      draw: (dt) => S.orbitBackdrop(dt, 600),
    }),
  });

  // ---------- 1) Acercamiento: mantén el Hubble dentro del círculo ----------
  enter.chase = (st) => {
    P.setStep(0);
    P.setSong('action');
    Object.assign(st, { r: { x: 160, y: 66 }, prog: 0, inT: 0, allT: 0, done: false, dT: 0, t: 0 });
    P.setAction('Sigue al Hubble con el círculo (flechas o dedo)', true);
    P.setFact('El Hubble da una vuelta a la Tierra cada 95 minutos, a unos 27.000 km/h. ¡Hay que ir igual de rápido!', 8);
  };
  scenes.chase = (dt, st, t) => {
    P.clear();
    P.drawStars(dt, 2 + st.prog * 4);
    P.earthLimb(t * 30, { cy: 640 });
    st.t += dt;
    // el Hubble se mueve por la ventana y crece al acercarnos
    const hx = 160 + Math.sin(st.t * 0.55) * 70 + Math.sin(st.t * 1.3) * 18 * st.prog;
    const hy = 64 + Math.sin(st.t * 0.8 + 1) * 22;
    const s = lerp(0.18, 0.55, st.prog);
    st.h = { x: hx, y: hy };
    S.drawHubble(hx, hy, s, t);
    // destello del sol en el Hubble
    if (Math.floor(t * 3) % 3 === 0) px(hx - 1, hy - 40 * s, '#ffffff', 2, 2);
    const R = 16;
    if (!st.done) {
      S.steer(st.r, dt, 90, { x0: 30, x1: 290, y0: 26, y1: 108 });
      const inside = Math.hypot(hx - st.r.x, hy - st.r.y) < R;
      st.allT += dt;
      if (inside) {
        st.inT += dt;
        st.prog = Math.min(1, st.prog + dt / 11);
        if (Math.random() < 0.15) P.tone(880, 0.03, 'triangle', 0.02);
      }
      const c = inside ? '#5cff8a' : '#ffcc33';
      P.ring(st.r.x, st.r.y, R, c, 0.1);
      P.ring(st.r.x, st.r.y, R + 1, c, 0.1);
      px(st.r.x - 22, st.r.y, c, 5, 1);
      px(st.r.x + 18, st.r.y, c, 5, 1);
      px(st.r.x, st.r.y - 22, c, 1, 5);
      px(st.r.x, st.r.y + 18, c, 1, 5);
      text(inside ? 'SIGUIENDO' : '¡SE ESCAPA!', st.r.x, st.r.y + R + 4, c, 5, 'center');
      // propulsores al moverse
      const a = P.axis();
      if (a.x || a.y || P.input.pointerDown) P.burst(a.x > 0 ? 30 : 290, rand(40, 120), 1, ['#ffffff', '#c9d4ff'], 40, 0.3, 0, 1, a.x > 0 ? Math.PI : 0, 0.5);
      P.setMeter(st.prog);
      if (st.prog >= 1) {
        st.done = true;
        const ratio = st.inT / st.allT;
        const stars = ratio > 0.8 ? 3 : ratio > 0.55 ? 2 : 1;
        P.award('chase', stars, 160, 30, stars === 3 ? '¡PILOTAJE PERFECTO!' : '¡LLEGASTE!');
        P.setAction('¡Ya estás junto al Hubble!');
      }
    } else {
      st.dT += dt;
      if (st.dT > 1.6) P.go('photo');
    }
    cockpitFrame();
    text('DISTANCIA', 40, 22, '#4cc9f0', 5);
    px(40, 30, '#22243a', 60, 4);
    px(40, 30, '#4cc9f0', 60 * (1 - st.prog), 4);
    P.updateParticles(dt);
    P.drawPopups(dt);
  };

  // ---------- 2) Foto del Hubble al acercarse ----------
  S.add(scenes, enter, {
    photo: S.photoPhase({
      phase: 'photo',
      step: 1,
      next: 'b_photo',
      start: { x: 90, y: 66 },
      fact: 'Al acercarse, la tripulación sacó una serie de fotos del Hubble. ¡Saca la tuya!',
      label: 'CENTRA EL HUBBLE',
      world(dt, st, t) {
        P.clear();
        P.drawStars(dt, 1);
        P.earthLimb(t * 30, { cy: 620 });
        const x = 190 + Math.sin(t * 0.5) * 50;
        const y = 66 + Math.sin(t * 0.7) * 10;
        S.drawHubble(x, y + 2, 0.5, t);
        cockpitFrame();
        return { x, y };
      },
    }),
    b_photo: S.brief({
      step: 1,
      mine: true,
      img: 'hst-acercamiento.jpg',
      cap: 'El Hubble visto desde el Atlantis antes de atraparlo, 13 may 2009 (NASA, S125-E-006928).',
      alt: 'El telescopio Hubble brilla con el Sol sobre el fondo negro del espacio',
      kicker: '13 may 2009 · Tu foto y la foto real',
      title: '¡Así lo vio la tripulación!',
      rows: [
        ['Largo', '13,2 m: como un autobús escolar'],
        ['Velocidad', 'unos 27.000 km/h'],
        ['Una vuelta a la Tierra', 'unos 95 minutos'],
        ['En el espacio desde', '24 de abril de 1990'],
      ],
      note: 'El Hubble no tiene astronautas dentro: es un telescopio robot. Por eso necesitaba visitas para repararlo.',
      btn: '¡A atraparlo!',
      next: 'grab',
    }),
  });

  // ---------- 3) Agarrar con el brazo robótico ----------
  enter.grab = (st) => {
    P.setStep(2);
    Object.assign(st, { e: { x: 110, y: 96 }, t: 0, grabbed: false, gT: 0 });
    P.setSong('action');
    P.setAction('Lleva la pinza al punto AMARILLO y pulsa');
    P.setFact('13 may 2009: Megan McArthur atrapó el Hubble con el brazo robótico del Atlantis.');
  };
  scenes.grab = (dt, st, t) => {
    S.orbitBackdrop(dt, 640);
    S.drawShuttleBay(BAY_Y, { cradle: true });
    st.t += dt;
    const hx = 180 + Math.sin(st.t * 0.7) * 10;
    const hy = 54 + Math.cos(st.t * 0.9) * 6;
    const pin = S.hubblePin(hx, hy, HS);
    const close = Math.hypot(st.e.x - pin.x, st.e.y - pin.y) < 7;
    S.drawHubble(hx, hy, HS, t, { pin: true, pinColor: close ? '#5cff8a' : '#ffcc33' });
    if (!st.grabbed) {
      S.steer(st.e, dt, 60, { x0: 20, x1: 300, y0: 24, y1: 120 });
      limitReach(st.e);
      P.ring(pin.x, pin.y, 8 + Math.sin(t * 6) * 2, close ? '#5cff8a' : '#ffcc33', 0.2);
      if (close) text('¡AHORA!', pin.x, pin.y - 18, '#5cff8a', 7, 'center');
      S.drawArm(SH.x, SH.y, st.e.x, st.e.y, true);
      if ((P.input.key || P.input.pointerDown) && close) {
        st.grabbed = true;
        const s = st.t < 8 ? 3 : st.t < 15 ? 2 : 1;
        P.award('grab', s, 160, 40, s === 3 ? '¡ATRAPADO!' : '¡LO TIENES!');
        P.tone(140, 0.2, 'square', 0.08);
        P.noise(0.15, 0.15, 900);
        P.shake(0.2);
        P.burst(pin.x, pin.y, 20, ['#5cff8a', '#ffffff'], 40, 0.6);
      } else if (P.input.key && !close) {
        P.popup('Aún no: acércate al punto amarillo', 160, 40, '#ff8c42', 6);
        P.tone(200, 0.08, 'square', 0.04);
      }
    } else {
      st.gT += dt;
      S.drawArm(SH.x, SH.y, pin.x, pin.y, false);
      if (st.gT > 1.2) {
        P.go('lower');
        P.state.st.e = { x: pin.x, y: pin.y };
      }
    }
    P.updateParticles(dt);
    P.drawPopups(dt);
  };

  // ---------- 4) Bajarlo a la bodega ----------
  enter.lower = (st) => {
    P.setStep(3);
    Object.assign(st, { bumps: 0, done: false, dT: 0 });
    P.setAction('Baja el Hubble justo encima del soporte VERDE');
    P.setFact('El brazo robótico del Atlantis mide 15 m y fue construido en Canadá.');
  };
  scenes.lower = (dt, st, t) => {
    if (!st.e) st.e = { x: 230, y: 54 };
    S.orbitBackdrop(dt, 640);
    const hx = st.e.x - PIN.dx;
    const aligned = Math.abs(hx - 160) < 5;
    S.drawShuttleBay(BAY_Y, { cradle: true, cradleColor: aligned ? '#5cff8a' : '#ffcc33' });
    for (let y = 30; y < CRADLE_TOP - 4; y += 6) px(160, y, aligned ? '#5cff8a' : '#3a4a7a', 1, 3);
    if (!st.done) {
      S.steer(st.e, dt, 45, { x0: 60, x1: 290, y0: 30, y1: 140 });
      limitReach(st.e);
      const base = st.e.y - PIN.dy + 46 * HS;
      if (base >= CRADLE_TOP) {
        if (aligned) {
          st.done = true;
          st.e.y = CRADLE_TOP - 46 * HS + PIN.dy;
          st.e.x = 160 + PIN.dx;
          const s = st.bumps === 0 ? 3 : st.bumps <= 2 ? 2 : 1;
          P.award('lower', s, 160, 30, s === 3 ? '¡ATERRIZAJE SUAVE!' : '¡ASEGURADO!');
          P.noise(0.25, 0.2, 600);
          P.tone(110, 0.25, 'square', 0.08);
          P.shake(0.25);
          P.burst(160, CRADLE_TOP, 30, ['#5cff8a', '#ffffff', '#ffcc33'], 50, 0.8);
          P.setAction('¡El Hubble está en la bodega!');
        } else {
          st.bumps += 1;
          st.e.y -= 14;
          P.shake(0.2);
          P.tone(150, 0.15, 'square', 0.05);
          P.popup('¡Alinéalo con la línea verde!', 160, 36, '#ff8c42', 6);
        }
      }
      if (aligned && !st.done) text('¡ALINEADO! ¡BAJA!', 160, 26, '#5cff8a', 6, 'center');
    } else {
      st.dT += dt;
      // pestillos que se cierran
      const k = clamp(st.dT / 0.6, 0, 1);
      px(lerp(132, 140, k), CRADLE_TOP - 8, '#5cff8a', 4, 8);
      px(lerp(184, 176, k), CRADLE_TOP - 8, '#5cff8a', 4, 8);
      if (st.dT > 1.8) P.go('b_arm');
    }
    S.drawHubble(st.e.x - PIN.dx, st.e.y - PIN.dy, HS, t, { pin: true, pinColor: '#5cff8a' });
    S.drawArm(SH.x, SH.y, st.e.x, st.e.y, false);
    P.updateParticles(dt);
    P.drawPopups(dt);
  };

  // ---------- 5) Ficha + pregunta ----------
  S.add(scenes, enter, {
    b_arm: S.brief({
      step: 4,
      img: 'hst-atrapado.jpg',
      cap: 'El Hubble sujeto por el brazo robótico del Atlantis, 13 may 2009 (NASA, S125-E-006948).',
      alt: 'El Hubble con sus paneles solares, sujeto junto al transbordador sobre la Tierra',
      kicker: '13 may 2009 · Foto real del momento',
      title: '¡Hubble atrapado!',
      rows: [
        ['Lo atrapó', 'Megan McArthur'],
        ['Con', 'el brazo robótico (15 m, hecho en Canadá)'],
        ['Acercó la nave', 'el comandante Scott Altman'],
      ],
      note: 'Con el Hubble bien sujeto en la bodega, al día siguiente empezaron <b>5 caminatas espaciales</b> para repararlo.',
      btn: 'Última pregunta',
      next: 'quiz',
      draw(dt, st, t) {
        S.orbitBackdrop(dt, 640);
        S.drawShuttleBay(BAY_Y, { cradle: true, cradleColor: '#5cff8a' });
        S.drawHubble(160, CRADLE_TOP - 46 * HS, HS, t);
      },
    }),
    quiz: S.quiz({
      phase: 'quiz',
      step: 4,
      q: '¿Con qué atrapó Megan McArthur al Hubble?',
      options: ['Con una red gigante', 'Con el brazo robótico del Atlantis', 'Con un imán muy fuerte'],
      correct: 1,
      explain: '¡Sí! Con el brazo robótico de 15 m que construyó Canadá.',
      next: 'result',
    }),
  });

  S.makeGame({
    // dentro de Laika Program la ficha de la tripulación ya se vio antes del despegue
    first: new URLSearchParams(location.search).has('embed') ? 'chase' : 'b_intro',
    phases: ['chase', 'photo', 'grab', 'lower', 'quiz'],
    key: 'sts125_captura_best',
    stat: (r) => `Hubble atrapado en ${r.secs} s`,
    today: '<b>Hoy:</b> el Hubble sigue en órbita. En febrero de 2025 llevaba casi <b>1,7 millones</b> de observaciones de unos 55.000 objetos del espacio.',
    scenes,
    enter,
    titleDraw(dt, st, t) {
      S.orbitBackdrop(dt, 640);
      S.drawShuttleBay(BAY_Y, { cradle: true });
      S.drawHubble(240 + Math.sin(t * 0.6) * 6, 58 + Math.cos(t * 0.8) * 4, HS, t);
      S.drawArm(SH.x, SH.y, 150 + Math.sin(t) * 10, 70, true);
    },
    resultDraw(dt, st, t) {
      S.orbitBackdrop(dt, 640);
      S.drawShuttleBay(BAY_Y, { cradle: true, cradleColor: '#5cff8a' });
      S.drawHubble(160, CRADLE_TOP - 46 * HS, HS, t);
    },
  });
})();
