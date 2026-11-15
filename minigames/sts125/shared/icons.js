/* Iconos pixel (10×10) para la interfaz, en lugar de emojis.
 * Uso en HTML: <span data-icon="rocket"></span>  →  se convierte en un SVG nítido.
 * Uso en JS: PXI.svg('star'), PXI.set(elemento, 'sound').
 * Letras = colores; "." = transparente; "c" = color del texto (currentColor).
 */
(() => {
  'use strict';
  const PAL = {
    w: '#f4f1de', y: '#ffcc33', g: '#5cff8a', b: '#4cc9f0', r: '#ff4d6d', k: '#22243a',
    d: '#8b8fb3', o: '#ff8c42', p: '#9b5de5', n: '#3a55b8', m: '#3a3d5c', c: 'currentColor',
  };
  const ICONS = {
    rocket: ['....ww....', '...wwww...', '...wbbw...', '...wbbw...', '...wwww...', '..rwwwwr..', '.rrwwwwrr.', '.r.wkkw.r.', '....oo....', '....yy....'],
    camera: ['..........', '...ddd....', '.dddddddd.', '.dwwwwwyd.', '.dwwkkwwd.', '.dwkbbkwd.', '.dwkbbkwd.', '.dwwkkwwd.', '.dddddddd.', '..........'],
    arm: ['......y..y', '......yyyy', '.......ww.', '......ww..', '.wwwwww...', '.ww.......', '.ww.......', '.ww.......', 'dddd......', 'dddd......'],
    down: ['....gg....', '....gg....', '....gg....', '....gg....', '.gggggggg.', '..gggggg..', '...gggg...', '....gg....', '..........', '.dddddddd.'],
    up: ['.dddddddd.', '..........', '....gg....', '...gggg...', '..gggggg..', '.gggggggg.', '....gg....', '....gg....', '....gg....', '....gg....'],
    question: ['...yyyy...', '..yy..yy..', '......yy..', '.....yy...', '....yy....', '....yy....', '..........', '....yy....', '....yy....', '..........'],
    screw: ['..........', '...dddd...', '..dwwwwd..', '.dwwwwwwd.', '.dkkkkkkd.', '.dwwwwwwd.', '..dwwwwd..', '...dddd...', '..........', '..........'],
    out: ['.......y..', '.......yy.', '.yyyyyyyyy', '.......yy.', '.ddddd.y..', '.dwwwd....', '.dwwwd....', '.dwwwd....', '.ddddd....', '..........'],
    target: ['..rrrrrr..', '.r......r.', 'r..wwww..r', 'r.w....w.r', 'r.w.rr.w.r', 'r.w.rr.w.r', 'r.w....w.r', 'r..wwww..r', '.r......r.', '..rrrrrr..'],
    rainbow: ['..........', '..........', '...rrrr...', '.rroooorr.', 'rooyyyyoor', 'roygggyyor', 'oyg....gyo', 'yg......gy', 'gb......bg', '..........'],
    one: ['dddddddddd', 'd........d', 'd...ww...d', 'd..www...d', 'd...ww...d', 'd...ww...d', 'd...ww...d', 'd..wwww..d', 'd........d', 'dddddddddd'],
    two: ['dddddddddd', 'd........d', 'd..www...d', 'd.....w..d', 'd....w...d', 'd...w....d', 'd..w.....d', 'd..wwww..d', 'd........d', 'dddddddddd'],
    three: ['dddddddddd', 'd........d', 'd..www...d', 'd.....w..d', 'd...ww...d', 'd.....w..d', 'd.....w..d', 'd..www...d', 'd........d', 'dddddddddd'],
    battery: ['....kk....', '..wwwwww..', '..wggggw..', '..wggggw..', '..w....w..', '..wggggw..', '..wggggw..', '..w....w..', '..wggggw..', '..wwwwww..'],
    wrench: ['......dd..', '.....d..d.', '.....d.dd.', '....ddd...', '...ddd....', '..ddd.....', '.ddd......', 'ddd.......', 'dd........', '..........'],
    chip: ['..........', '.gggggggg.', '.gkkgggkg.', '.gkkgggkg.', '.gggggggg.', '.ggkkkggg.', '.gggggggg.', '.y.y.y.y..', '.y.y.y.y..', '..........'],
    bulb: ['...yyyy...', '..yyyyyy..', '.yyywwyyy.', '.yyywyyyy.', '.yyyyyyyy.', '..yyyyyy..', '...yyyy...', '...dddd...', '...dddd...', '....dd....'],
    search: ['.bbbb.....', 'b....b....', 'b.ww.b....', 'b.w..b....', 'b....b....', '.bbbbd....', '.....dd...', '......dd..', '.......dd.', '........d.'],
    hand: ['.w.w.w....', '.w.w.w.w..', '.w.w.w.w..', '.wwwwwww..', 'ww.wwwww..', '.wwwwwww..', '..wwwwww..', '..wwwww...', '...www....', '..........'],
    land: ['..........', '..........', 'w.........', 'ww........', 'wwwwwwwww.', 'kkkkkkkkkw', '..k....k..', '..........', 'oooooooooo', '..........'],
    gyro: ['....ww....', '..bbwwbb..', '.b..ww..b.', 'b...ww...b', 'bwwwwwwwwb', 'b...ww...b', '.b..ww..b.', '..bbwwbb..', '....ww....', '..........'],
    sound: ['..........', '....w..b..', '...ww...b.', 'wwwww.b..b', 'wwwww..b.b', 'wwwww..b.b', 'wwwww.b..b', '...ww...b.', '....w..b..', '..........'],
    mute: ['..........', '....w.....', '...ww.....', 'wwwww.r..r', 'wwwww..rr.', 'wwwww..rr.', 'wwwww.r..r', '...ww.....', '....w.....', '..........'],
    star: ['....yy....', '....yy....', '...yyyy...', 'yyyyyyyyyy', '.yyyyyyyy.', '..yyyyyy..', '..yyyyyy..', '.yyy..yyy.', '.yy....yy.', '..........'],
    staroff: ['....mm....', '....mm....', '...mmmm...', 'mmmmmmmmmm', '.mmmmmmmm.', '..mmmmmm..', '..mmmmmm..', '.mmm..mmm.', '.mm....mm.', '..........'],
    album: ['..........', 'cccccccccc', 'c........c', 'c.....cc.c', 'c.....cc.c', 'c..c.....c', 'c.ccc....c', 'cccccc.c.c', 'cccccccccc', '..........'],
    retry: ['...cccc...', '..c....c..', '.c......c.', '.c....cccc', '.c.....cc.', '.c......c.', '.c........', '..c....c..', '...cccc...', '..........'],
    play: ['..........', '..c.......', '..cc......', '..ccc.....', '..cccc....', '..cccc....', '..ccc.....', '..cc......', '..c.......', '..........'],
    back: ['..........', '..........', '...c......', '..cc......', '.cccccccc.', '.cccccccc.', '..cc......', '...c......', '..........', '..........'],
    check: ['..........', '.........g', '........gg', '.......gg.', 'g.....gg..', 'gg...gg...', '.gg.gg....', '..ggg.....', '...g......', '..........'],
    phone: ['..cccccc..', '..c....c..', '..c....c..', '..c....c..', '..c....c..', '..c....c..', '..c....c..', '..cccccc..', '....cc....', '..........'],
    flag: ['.r........', '.rwwwww...', '.rwbbbww..', '.rwbbbww..', '.rwwwww...', '.r........', '.r........', '.r........', '.r........', 'ddd.......'],
  };
  const cache = {};
  /** SVG de un icono (los píxeles iguales seguidos se unen en un rectángulo). */
  function svg(name) {
    if (cache[name]) return cache[name];
    const rows = ICONS[name];
    if (!rows) return '';
    let rects = '';
    rows.forEach((row, y) => {
      let x = 0;
      while (x < row.length) {
        const ch = row[x];
        let w = 1;
        while (x + w < row.length && row[x + w] === ch) w++;
        if (ch !== '.') rects += `<rect x="${x}" y="${y}" width="${w}" height="1" fill="${PAL[ch]}"/>`;
        x += w;
      }
    });
    cache[name] = `<svg class="pxi" viewBox="0 0 10 10" shape-rendering="crispEdges" aria-hidden="true" focusable="false">${rects}</svg>`;
    return cache[name];
  }
  function set(el, name) {
    if (!el) return;
    el.dataset.icon = name;
    el.innerHTML = svg(name);
  }
  function hydrate(root = document) {
    root.querySelectorAll('[data-icon]').forEach((el) => {
      if (!el.firstElementChild) el.innerHTML = svg(el.dataset.icon);
    });
  }
  window.PXI = { svg, set, hydrate, names: Object.keys(ICONS) };
  hydrate();
})();
