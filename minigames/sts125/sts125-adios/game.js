/* Minijuego STS-125: "Adiós, Hubble"
 * Datos reales: 19 may 2009, Megan McArthur levantó el Hubble de la bodega con el brazo robótico y lo soltó.
 * John Grunsfeld lo fotografió desde una ventana de la cabina trasera (S125-E-011919).
 * El Atlantis aterrizó el 24 may 2009 en la pista 22 de la Base Edwards (California): el mal tiempo en
 * Florida obligó a cancelar los intentos del 22, 23 y 24 de mayo. Misión: 12 d 21 h 37 min 9 s, 5,3 millones de millas.
 * 5 caminatas espaciales (36 h 56 min). Fue la última visita de astronautas al Hubble.
 * Pensado para niños: mantener pulsado, pulsar en el momento justo, centrar y soltar.
 */
(() => {
  'use strict';
  const P = window.PX;
  const S = window.STS;
  const { px, text, ring, clamp, lerp, rand } = P;

  const SH = { x: 52, y: 122 };
  const BAY_Y = 128;
  const CRADLE_TOP = BAY_Y - 6;
  const HS = 0.8;
  const PIN = { dx: 13 * HS, dy: -1 * HS };
  const REST_Y = CRADLE_TOP - 46 * HS; // centro del Hubble apoyado
  const GOAL_Y = 52; // altura para soltarlo

  const enter = {
    lift(st) {
      P.setStep(0);
      Object.assign(st, { y: REST_Y, v: 0, done: false, dT: 0, over: 0, wasHeld: false });
      P.setSong('calm');
      P.setAction('Mantén para subirlo. ¡Suelta en la zona VERDE!', true);
      P.setFact('19 may 2009: el Hubble ya estaba reparado. Megan McArthur lo levantó con el brazo robótico.');
    },
    release(st) {
      P.setStep(1);
      Object.assign(st, { p: 0, free: false, fT: 0, hx: 160, hy: GOAL_Y });
      P.setAction('Suéltalo cuando el anillo toque el círculo verde');
      P.setFact('Hay que soltarlo con mucha suavidad para que no empiece a girar.');
    },
    away(st) {
      P.setStep(2);
      Object.assign(st, { dist: 0, done: false, dT: 0, hx: 160, hy: GOAL_Y });
      P.setSong('action');
      P.setAction('Mantén pulsado para alejar el Atlantis despacio', true);
      P.setFact('El Atlantis se alejó despacio con sus motores pequeños, para no empujar al Hubble.');
    },
  };

  const scenes = {
    // 1) Levantar: mantener pulsado y soltar en la zona verde
    lift(dt, st, t) {
      S.orbitBackdrop(dt, 640);
      S.drawShuttleBay(BAY_Y, { cradle: true });
      const zoneTop = GOAL_Y - 8;
      const zoneBot = GOAL_Y + 8;
      // zona verde
      for (let x = 196; x < 300; x += 4) {
        px(x, zoneTop, '#5cff8a');
        px(x, zoneBot, '#5cff8a');
      }
      text('SOLTAR AQUÍ', 248, zoneTop - 8, '#5cff8a', 5, 'center');
      if (!st.done) {
        const holding = P.input.held;
        st.v = holding ? Math.min(28, st.v + 30 * dt) : Math.max(0, st.v - 60 * dt);
        st.y = Math.max(14, st.y - st.v * dt);
        if (holding && Math.random() < 0.3) P.tone(220 + (REST_Y - st.y) * 3, 0.03, 'triangle', 0.03);
        if (st.wasHeld && !holding && st.v < 1) {
          if (st.y >= zoneTop && st.y <= zoneBot) {
            st.done = true;
            const s = Math.abs(st.y - GOAL_Y) < 3 ? 3 : 2;
            P.award('lift', s, 160, 26, s === 3 ? '¡ALTURA PERFECTA!' : '¡BIEN!');
          } else if (st.y < zoneTop) {
            st.over += 1;
            P.popup('¡Muy alto! Bájalo un poco', 160, 26, '#ff8c42', 6);
            st.y += 14;
          }
        }
        st.wasHeld = holding || (st.wasHeld && st.v > 1);
        P.setMeter((REST_Y - st.y) / (REST_Y - GOAL_Y));
      } else {
        st.dT += dt;
        if (st.dT > 1.2) P.go('release');
      }
      const inZone = st.y >= zoneTop && st.y <= zoneBot;
      S.drawHubble(160, st.y, HS, t, { pin: true, pinColor: inZone ? '#5cff8a' : '#ffcc33', armsOpen: true });
      S.drawArm(SH.x, SH.y, 160 + PIN.dx, st.y + PIN.dy, false);
      P.updateParticles(dt);
      P.drawPopups(dt);
    },

    // 2) Soltar en el momento justo
    release(dt, st, t) {
      S.orbitBackdrop(dt, 640);
      S.drawShuttleBay(BAY_Y, { cradle: true });
      const pin = { x: 160 + PIN.dx, y: GOAL_Y + PIN.dy };
      if (!st.free) {
        st.p = (st.p + dt / 1.5) % 1.25;
        S.drawHubble(160, GOAL_Y, HS, t, { pin: true, pinColor: '#ffcc33' });
        S.drawArm(SH.x, SH.y, pin.x, pin.y, false);
        const r = P.drawTimingRing(pin.x, pin.y, clamp(st.p, 0, 1), '#4cc9f0');
        if (P.action()) {
          const j = P.judgeRing(st.p > 1 ? 99 : r);
          st.free = true;
          st.spin = j.stars === 3 ? 0 : j.stars === 2 ? 0.4 : 1;
          P.award('release', j.stars, 160, 22, j.stars === 3 ? '¡SUELTO SIN GIRAR!' : j.label);
          P.tone(880, 0.15, 'square', 0.05, 1320);
          P.burst(pin.x, pin.y, 20, ['#ffffff', '#ffcc33', '#4cc9f0'], 40, 0.7);
        }
      } else {
        st.fT += dt;
        st.hy -= 6 * dt;
        S.drawHubble(160 + Math.sin(st.fT * st.spin * 3) * st.spin * 3, st.hy, HS, t, { armsOpen: true });
        // el brazo se retira
        S.drawArm(SH.x, SH.y, lerp(pin.x, 110, clamp(st.fT, 0, 1)), lerp(pin.y, 96, clamp(st.fT, 0, 1)), true);
        if (st.fT > 1.8) P.go('away');
      }
      P.updateParticles(dt);
      P.drawPopups(dt);
    },

    // 3) Alejarse despacio: mantener pulsado
    away(dt, st, t) {
      P.clear();
      P.drawStars(dt, 1 + st.dist * 3);
      P.earthLimb(t * 25, { cy: 640 + st.dist * 80 });
      if (!st.done) {
        if (P.input.held) {
          st.dist = Math.min(1, st.dist + dt * 0.22);
          // propulsores del Atlantis
          P.burst(rand(60, 260), 150 - st.dist * 30, 1, ['#ffffff', '#c9d4ff'], 30, 0.4);
          if (Math.random() < 0.3) P.noise(0.05, 0.03, 900);
        }
        P.setMeter(st.dist);
        if (st.dist >= 1) {
          st.done = true;
          P.award('away', 3, 160, 22, '¡HASTA PRONTO, HUBBLE!');
          P.arp([523, 659, 784, 1046, 1318], 0.1, 'square', 0.06);
          P.setAction('¡Gracias, Hubble!');
          P.setFact('Fue la última vez que unos astronautas visitaron el Hubble. ¡Y siguió mirando el universo!', 6);
        }
      } else {
        st.dT += dt;
        if (st.dT > 3) P.go('photo');
      }
      // el Hubble se hace pequeño y brilla con el Sol
      const s = lerp(HS, 0.25, st.dist);
      S.drawHubble(160, lerp(GOAL_Y, 60, st.dist), s, t, { armsOpen: true });
      if (Math.floor(t * 2) % 2 === 0) px(160 - 2, lerp(GOAL_Y, 60, st.dist) - 46 * s, '#ffffff', 4, 4);
      // la bodega del Atlantis se aleja hacia abajo
      const by = lerp(BAY_Y, 200, st.dist);
      if (by < 190) S.drawShuttleBay(by);
      P.updateParticles(dt);
      P.drawPopups(dt);
    },
  };

  // ================= Foto de despedida =================
  function aftWindow() {
    const c = '#14172a';
    px(0, 0, c, 320, 18);
    px(0, 0, c, 34, 180);
    px(286, 0, c, 34, 180);
    px(34, 18, '#2c2f4a', 252, 2);
    px(32, 18, '#2c2f4a', 2, 162);
    px(286, 18, '#2c2f4a', 2, 162);
  }
  S.add(scenes, enter, {
    photo: S.photoPhase({
      phase: 'photo',
      step: 3,
      next: 'b_photo',
      start: { x: 110, y: 64 },
      song: 'calm',
      action: 'Foto de despedida: céntralo y pulsa en NÍTIDO',
      fact: 'John Grunsfeld fotografió el Hubble desde una ventana del Atlantis, justo después de soltarlo.',
      label: 'CENTRA EL HUBBLE',
      world(dt, st, t) {
        P.clear();
        P.drawStars(dt, 0.6);
        P.earthLimb(t * 25, { cy: 520 });
        const x = 180 + Math.sin(t * 0.45) * 55;
        const y = 62 + Math.sin(t * 0.7) * 9;
        S.drawHubble(x, y + 2, 0.42, t);
        aftWindow();
        return { x, y };
      },
    }),
  });

  // ================= Aterrizaje en la Base Edwards (California) =================
  const GROUND = 100;
  // [Laika Program] ?part=release (soltar el Hubble) o ?part=land (aterrizar al final de la misión)
  const PART = new URLSearchParams(location.search).get('part');

  const shuttleSprite = (() => {
    const c = document.createElement('canvas');
    c.width = 44;
    c.height = 18;
    const g = c.getContext('2d');
    const r = (x, y, w, h, col) => {
      g.fillStyle = col;
      g.fillRect(x, y, w, h);
    };
    r(4, 8, 34, 6, '#f2f3f7'); // fuselaje
    r(38, 9, 3, 4, '#f2f3f7'); // morro
    r(41, 10, 2, 2, '#22243a');
    r(4, 13, 37, 2, '#22243a'); // panza negra
    r(30, 8, 6, 2, '#22243a'); // ventanas
    r(2, 1, 6, 8, '#f2f3f7'); // cola
    r(2, 1, 2, 7, '#c9ccd8');
    r(12, 12, 20, 3, '#c9ccd8'); // ala
    r(0, 9, 4, 4, '#555a6e'); // motores
    return c;
  })();
  function drawShuttleSide(x, y, ang, gear) {
    const ctx = P.ctx;
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    ctx.rotate(ang);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(shuttleSprite, -22, -9);
    if (gear) {
      ctx.fillStyle = '#22243a';
      ctx.fillRect(-4, 6, 2, 4);
      ctx.fillRect(14, 6, 2, 4);
    }
    ctx.restore();
  }
  const pathY = (p) => (p < 0.82 ? lerp(34, GROUND - 22, p / 0.82) : lerp(GROUND - 22, GROUND - 6, Math.sin(((p - 0.82) / 0.18) * Math.PI / 2)));
  enter.land = (st) => {
    P.setStep(4);
    P.setSong('action');
    Object.assign(st, { p: 0, y: 34, vy: 0, inT: 0, allT: 0, low: 0, phase: 'glide', ring: 0, rollV: 0, scroll: 0, dT: 0, chute: false });
    P.setAction('Mantén para subir. Sigue la línea VERDE', true);
    P.setFact('24 may 2009: por mal tiempo en Florida, el Atlantis aterrizó en la Base Edwards, California.', 7);
  };
  scenes.land = (dt, st, t) => {
    // cielo y desierto
    P.clear('#3d7fd0');
    px(0, 60, '#5d98dc', 320, 30);
    px(0, 90, '#8cbcef', 320, 30);
    st.scroll += (st.phase === 'stop' ? st.rollV : 70) * dt;
    for (let i = 0; i < 5; i++) {
      const cx = ((i * 97 - st.scroll * 0.3) % 380 + 380) % 380 - 30;
      px(cx, 30 + (i % 3) * 14, '#ffffff', 26, 4);
      px(cx + 5, 26 + (i % 3) * 14, '#ffffff', 14, 4);
    }
    for (let i = 0; i < 4; i++) {
      const mx = ((i * 110 - st.scroll * 0.5) % 440 + 440) % 440 - 60;
      for (let k = 0; k < 20; k++) px(mx + k * 2, GROUND - 6 + Math.abs(k - 10) * 0.6, '#a87b4f', 2, 8);
    }
    px(0, GROUND, '#d9b77a', 320, 68);
    for (let x = 0; x < 320; x += 8) px((x - st.scroll) % 320 < 0 ? x : x, GROUND + 4 + ((x * 7) % 5), '#c49a5a', 3, 1);
    // pista 22 (aparece al final)
    const runwayX = lerp(420, 40, clamp((st.p - 0.55) / 0.45, 0, 1)) - (st.phase !== 'glide' ? st.scroll - st.scrollAtTd : 0);
    px(runwayX, GROUND, '#555a6e', 600, 6);
    for (let x = 0; x < 600; x += 20) px(runwayX + x + 4, GROUND + 2, '#ffffff', 10, 1);
    text('22', runwayX + 10, GROUND + 7, '#ffffff', 5);
    const sx = 110;
    if (st.phase === 'glide') {
      st.p = Math.min(1, st.p + dt / 13);
      const holding = P.input.held;
      const target = holding ? -7 : 15;
      st.vy += (target - st.vy) * 3 * dt;
      st.y += (st.vy + Math.sin(t * 2.3) * 3) * dt;
      const py = pathY(st.p);
      // senda verde por delante
      for (let k = 0; k < 14; k++) {
        const q = st.p + k * 0.02;
        if (q > 1) break;
        px(sx + k * 14, pathY(q), '#5cff8a', 3, 1);
      }
      const inside = Math.abs(st.y - py) < 8;
      st.allT += dt;
      if (inside) st.inT += dt;
      text(inside ? 'EN LA SENDA' : st.y < py ? '¡MUY ALTO! SUELTA' : '¡MUY BAJO! MANTÉN', sx, 24, inside ? '#5cff8a' : '#ffcc33', 5, 'center');
      if (st.y > GROUND - 10 && st.p < 0.9) {
        st.low += 1;
        st.y = GROUND - 22;
        st.vy = -6;
        P.shake(0.2);
        P.popup('¡Demasiado bajo!', sx, 40, '#ff4d6d', 7);
      }
      st.y = clamp(st.y, 24, GROUND - 6);
      P.setMeter(st.p);
      drawShuttleSide(sx, st.y, clamp(-st.vy * 0.02, -0.25, 0.2), st.p > 0.8);
      if (st.p >= 1) {
        st.phase = 'chute';
        st.y = GROUND - 6;
        st.scrollAtTd = st.scroll;
        P.shake(0.3);
        P.noise(0.3, 0.2, 500);
        P.burst(sx - 8, GROUND, 18, ['#d9b77a', '#ffffff'], 40, 0.6, 30);
        const ratio = st.inT / st.allT;
        st.alignStars = Math.max(1, (ratio > 0.7 ? 3 : ratio > 0.45 ? 2 : 1) - (st.low > 1 ? 1 : 0));
        P.popup('¡RUEDAS EN TIERRA!', 160, 34, '#5cff8a', 8);
        P.setAction('¡Paracaídas! Pulsa cuando el anillo toque el verde');
      }
    } else if (st.phase === 'chute') {
      st.ring += dt / 1.4;
      drawShuttleSide(sx, GROUND - 6, 0, true);
      const r = P.drawTimingRing(sx - 26, GROUND - 14, clamp(st.ring, 0, 1), '#ffcc33');
      if (P.action() || st.ring > 1.3) {
        const j = P.judgeRing(st.ring > 1 ? 99 : r);
        const s = Math.round((st.alignStars + j.stars) / 2);
        P.award('land', s, 160, 34, s === 3 ? '¡ATERRIZAJE PERFECTO!' : '¡EN CASA!');
        st.phase = 'stop';
        st.rollV = 70;
        st.chute = true;
        P.noise(0.2, 0.15, 3000);
        P.setAction('¡Bienvenidos a casa!');
      }
    } else {
      st.dT += dt;
      st.rollV = Math.max(0, st.rollV - 45 * dt);
      drawShuttleSide(sx, GROUND - 6, 0, true);
      // paracaídas de frenado
      const cx = sx - 46 - Math.sin(t * 8);
      P.line(sx - 22, GROUND - 8, cx + 6, GROUND - 16, '#f4f1de');
      P.line(sx - 22, GROUND - 8, cx + 6, GROUND - 4, '#f4f1de');
      px(cx - 4, GROUND - 22, '#ff8c42', 10, 22);
      px(cx - 6, GROUND - 20, '#f4f1de', 2, 18);
      if (st.rollV > 5 && Math.random() < 0.5) P.burst(sx - 10, GROUND, 1, ['#d9b77a'], 20, 0.5, -10);
      if (st.dT > 2.6) P.go('b_home');
    }
    P.updateParticles(dt);
    P.drawPopups(dt);
  };

  // ================= Fichas NASA y pregunta =================
  S.add(scenes, enter, {
    b_intro: S.brief({
      step: 0,
      img: 'hst-ultima-mirada.jpg',
      cap: 'Última mirada al Hubble en la bodega antes de soltarlo, 19 may 2009 (NASA, S125-E-010160).',
      alt: 'El Hubble de pie en la bodega del Atlantis, con el espacio negro detrás',
      kicker: '19 may 2009 · ¡Trabajo terminado!',
      title: 'Hora de devolver el Hubble al espacio',
      rows: [
        ['Caminatas', '5, en total 36 h 56 min'],
        ['Instrumentos nuevos', 'cámara WFC3 y espectrógrafo COS'],
        ['Reparados', 'los instrumentos STIS y ACS'],
        ['Cambiados', '6 giroscopios y 6 baterías'],
      ],
      note: '<b>Era la última visita:</b> después de esta misión, ningún astronauta volvió a tocar el Hubble.',
      btn: '¡A soltarlo!',
      next: 'lift',
      draw(dt, st, t) {
        S.orbitBackdrop(dt, 640);
        S.drawShuttleBay(BAY_Y, { cradle: true });
        S.drawHubble(160, REST_Y, HS, t);
      },
    }),
    b_photo: S.brief({
      step: 4,
      mine: true,
      img: 'foto-despedida.jpg',
      cap: 'John Grunsfeld fotografía el Hubble desde una ventana del Atlantis tras soltarlo, 19 may 2009 (NASA, S125-E-011919).',
      alt: 'Un astronauta con una cámara grande mira por la ventana de la nave',
      kicker: '19 may 2009 · Tu foto y el fotógrafo real',
      title: 'La foto de despedida',
      rows: [
        ['Fotógrafo', 'John Grunsfeld'],
        ['Desde', 'una ventana de la cabina trasera'],
        ['Grunsfeld visitó el Hubble', '3 veces: 1999, 2002 y 2009'],
      ],
      note: 'Ahora, el regreso: cinco días después había que aterrizar el Atlantis.',
      btn: PART === 'release' ? 'Terminar' : '¡A aterrizar!',
      next: PART === 'release' ? 'result' : 'land',
      draw(dt, st, t) {
        P.clear();
        P.drawStars(dt, 0.6);
        P.earthLimb(t * 25, { cy: 520 });
      },
    }),
    b_home: S.brief({
      step: 5,
      img: 'aterrizaje.jpg',
      cap: 'El Atlantis toca tierra en la pista 22 de la Base Edwards, California, 24 may 2009 (NASA, STS125-S-062).',
      alt: 'El transbordador Atlantis aterriza sobre una pista en el desierto',
      kicker: '24 may 2009 · Misión cumplida',
      title: '¡En casa!',
      rows: [
        ['Aterrizaje', 'Base Edwards, California (pista 22)'],
        ['¿Por qué ahí?', 'mal tiempo en Florida del 22 al 24 de mayo'],
        ['Duración', '12 días, 21 h y 37 min'],
        ['Recorrido', '8,5 millones de km (5,3 millones de millas)'],
      ],
      note: 'El Atlantis volvió a Florida días después, ¡a lomos de un avión Boeing 747!',
      btn: 'Última pregunta',
      next: 'quiz',
      draw(dt) {
        P.clear('#3d7fd0');
        px(0, 100, '#d9b77a', 320, 80);
        P.drawStars(dt, 0);
      },
    }),
    quiz: S.quiz({
      phase: 'quiz',
      step: 5,
      q: '¿Por qué el Atlantis aterrizó en California y no en Florida?',
      options: ['Se quedó sin combustible', 'Había mal tiempo en Florida', 'Para visitar a sus familias'],
      correct: 1,
      explain: '¡Sí! El tiempo en Florida fue malo tres días seguidos, así que eligieron la Base Edwards.',
      next: 'result',
    }),
  });

  // ficha antes del aterrizaje (solo cuando se juega como misión final)
  S.add(scenes, enter, {
    b_land: S.brief({
      step: 4,
      img: 'aterrizaje.jpg',
      cap: 'El Atlantis aterriza en la pista 22 de la Base Edwards, California, 24 may 2009 (NASA, STS125-S-062).',
      alt: 'El transbordador Atlantis aterriza sobre una pista en el desierto',
      kicker: 'Última tarea · ¡Volver a casa!',
      title: 'Aterriza el Atlantis',
      rows: [
        ['En la misión real', 'Florida tenía mal tiempo del 22 al 24 de mayo'],
        ['Por eso', 'el Atlantis aterrizó en la Base Edwards, California'],
        ['Cómo', 'planeando, sin motores, y frenando con un paracaídas'],
      ],
      note: 'Mantén pulsado para subir el morro y suelta para bajar. Sigue la línea VERDE y suelta el paracaídas al tocar tierra.',
      btn: '¡A aterrizar!',
      next: 'land',
      draw(dt) {
        P.clear('#3d7fd0');
        px(0, 100, '#d9b77a', 320, 80);
        P.drawStars(dt, 0);
      },
    }),
  });

  S.makeGame({
    first: PART === 'land' ? 'b_land' : 'b_intro',
    phases: PART === 'land' ? ['land', 'quiz'] : PART === 'release' ? ['lift', 'release', 'away', 'photo'] : ['lift', 'release', 'away', 'photo', 'land', 'quiz'],
    key: 'sts125_adios_best',
    stat: (r) => `Misión cumplida en ${r.secs} s`,
    today: '<b>Hoy:</b> el Hubble cumplió 35 años en el espacio en 2025 y sigue enviando fotos del universo, gracias a esta última reparación.',
    scenes,
    enter,
    titleDraw(dt, st, t) {
      S.orbitBackdrop(dt, 640);
      S.drawShuttleBay(BAY_Y, { cradle: true });
      S.drawHubble(240, 60 + Math.sin(t) * 3, HS, t);
      ring(240, 60, 46 + Math.sin(t * 2) * 2, '#3a4a7a', 0.06);
    },
    resultDraw(dt, st, t) {
      P.clear();
      P.drawStars(dt, 1);
      P.earthLimb(t * 25, { cy: 600 });
      S.drawHubble(160, 70, 0.6, t);
    },
  });
})();
