// Naves y Hubble en pixel art (mismo estilo que la Tierra): paleta PICO-8 de 16 colores,
// luz desde arriba a la derecha, bordes iluminados, sombras y tramado (dithering).
import { drawShip, shipSize } from './shipRenderer.js';

const PAL = ['#000000', '#1D2B53', '#7E2553', '#008751', '#AB5236', '#5F574F', '#C2C3C7', '#FFF1E8',
  '#FF004D', '#FFA300', '#FFEC27', '#00E436', '#29ADFF', '#83769C', '#FF77A8', '#FFCCAA'];
const RGB = PAL.map(h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);
// rampas de luz de PICO-8: el color un paso más oscuro y uno más claro
const DARK = [0, 0, 1, 1, 2, 1, 13, 6, 2, 4, 9, 3, 1, 5, 2, 4];
const LIGHT = [1, 13, 8, 11, 9, 13, 7, 7, 14, 10, 7, 10, 7, 6, 15, 7];
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => v / 16 - 0.5);

const nearCache = new Map();
function nearest(r, g, b) {
  const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
  let best = nearCache.get(key);
  if (best != null) return best;
  let bd = Infinity;
  for (let i = 0; i < 16; i++) {
    const [R, G, B] = RGB[i];
    // distancia ponderada (el ojo ve más el verde)
    const d = (r - R) ** 2 * 0.3 + (g - G) ** 2 * 0.59 + (b - B) ** 2 * 0.11;
    if (d < bd) { bd = d; best = i; }
  }
  nearCache.set(key, best);
  return best;
}

/** Convierte un dibujo en pixel art sombreado (in situ). */
export function pixelize(canvas) {
  const w = canvas.width;
  const h = canvas.height;
  const g = canvas.getContext('2d');
  const im = g.getImageData(0, 0, w, h);
  const d = im.data;
  const idx = new Int8Array(w * h).fill(-1);
  let x0 = w, x1 = 0, y0 = h, y1 = 0;
  for (let p = 0, i = 0; p < w * h; p++, i += 4) {
    if (d[i + 3] < 110) continue;
    // el color se mezcla con el fondo transparente: se recupera dividiendo por alfa
    const a = d[i + 3] / 255;
    idx[p] = nearest(Math.min(255, d[i] / a), Math.min(255, d[i + 1] / a), Math.min(255, d[i + 2] / a));
    const x = p % w;
    const y = (p / w) | 0;
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const hw = Math.max(1, (x1 - x0) / 2);
  const hh = Math.max(1, (y1 - y0) / 2);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = y * w + x;
      const i = p * 4;
      let k = idx[p];
      if (k < 0) { d[i + 3] = 0; continue; }
      const up = y > 0 && idx[p - w] >= 0;
      const down = y < h - 1 && idx[p + w] >= 0;
      const left = x > 0 && idx[p - 1] >= 0;
      const right = x < w - 1 && idx[p + 1] >= 0;
      // luz general (arriba-derecha) + bordes que miran a la luz: 3 tonos con tramado, como la Tierra
      let v = ((cy - y) / hh) * 0.95 + ((x - cx) / hw) * 0.45;
      if (!up) v += 0.9;
      if (!right) v += 0.45;
      if (!down) v -= 0.8;
      if (!left) v -= 0.4;
      const t = v + BAYER[(y & 3) * 4 + (x & 3)] * 0.8;
      if (t > 0.45) k = LIGHT[k];
      else if (t < -0.45) k = DARK[k];
      if (t < -1.3) k = DARK[k];
      const [R, G, B] = RGB[k];
      d[i] = R; d[i + 1] = G; d[i + 2] = B; d[i + 3] = 255;
    }
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = y * w + x;
      if (idx[p] >= 0) continue;
      const above = y > 0 && idx[p - w] >= 0;
      const right = x < w - 1 && idx[p + 1] >= 0;
      if (above || right) {
        const i = p * 4;
        d[i] = 0x1d; d[i + 1] = 0x2b; d[i + 2] = 0x53; d[i + 3] = 255;
      }
    }
  }
  g.putImageData(im, 0, 0);
}

const off = document.createElement('canvas');
const offCtx = off.getContext('2d', { willReadFrequently: true });

/**
 * Dibuja la nave en pixel art en el lienzo `ctx` (respeta su escala actual).
 * Mismas opciones que drawShip; devuelve los anclajes en coordenadas de `ctx`.
 */
export function drawShipPixel(ctx, model, o = {}) {
  const T = ctx.getTransform();
  const unit = Math.abs(T.a) || 1; // píxeles reales por unidad del lienzo
  const k = (o.scale || 1) * unit; // píxeles reales por unidad del modelo
  const sz = shipSize(model);
  const W = Math.ceil(Math.min(1600, sz.w * k + 60));
  const H = Math.ceil(Math.min(1600, sz.h * k + 60));
  if (off.width !== W || off.height !== H) { off.width = W; off.height = H; }
  offCtx.setTransform(1, 0, 0, 1, 0, 0);
  offCtx.clearRect(0, 0, W, H);
  const ox = Math.round(W / 2);
  const oy = Math.round(H / 2);
  const a = drawShip(offCtx, model, { ...o, x: ox, y: oy, scale: k });
  pixelize(off);
  // pegar alineado a la rejilla de píxeles
  const gx = Math.round(o.x * unit - ox) / unit;
  const gy = Math.round(o.y * unit - oy) / unit;
  const smooth = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(off, gx, gy, W / unit, H / unit);
  ctx.imageSmoothingEnabled = smooth;
  const anchors = {};
  for (const [key, p] of Object.entries(a)) anchors[key] = { x: gx + p.x / unit, y: gy + p.y / unit };
  return anchors;
}

/** Imagen de la nave en pixel art (para usarla como sprite). */
export function shipSprite(model, scale = 1, crewCount = 0) {
  const c = document.createElement('canvas');
  c.width = Math.ceil(150 * scale);
  c.height = Math.ceil(130 * scale);
  const g = c.getContext('2d', { willReadFrequently: true });
  drawShip(g, model, { x: c.width / 2, y: c.height / 2, scale, crewCount });
  pixelize(c);
  return c;
}

// ---------------- Hubble ----------------
// Dibujado pixel a pixel (31×38): tubo plateado con anillos, puerta de apertura abierta arriba,
// sección de equipos, dos paneles solares azules y dos antenas de alta ganancia.
let hubbleCanvas = null;
function buildHubble() {
  const w = 33;
  const h = 40;
  const px = Array.from({ length: h }, () => new Array(w).fill(-1));
  const set = (x, y, c) => { if (x >= 0 && x < w && y >= 0 && y < h) px[y][x] = c; };
  const cx = 16;
  // tubo (cilindro): sombreado por columna, luz a la derecha-arriba
  const tubeShade = dx => (dx >= 3 ? 7 : dx >= 1 ? 6 : dx >= -2 ? 6 : dx >= -3 ? 13 : 5);
  for (let y = 6; y <= 26; y++) {
    for (let dx = -4; dx <= 4; dx++) {
      let c = tubeShade(dx);
      if ((y - 6) % 5 === 4) c = DARK[c]; // anillos del tubo
      if (dx === 4 && (y & 1)) c = 6; // brillo tramado
      set(cx + dx, y, c);
    }
  }
  // puerta de apertura abierta (inclinada hacia la izquierda) y borde del tubo
  for (let dx = -4; dx <= 4; dx++) set(cx + dx, 5, dx >= 2 ? 6 : 13);
  for (let i = 0; i < 6; i++) {
    set(cx - 4 - i, 4 - Math.floor(i / 2), i < 2 ? 6 : 13);
    set(cx - 4 - i, 5 - Math.floor(i / 2), 5);
  }
  set(cx - 2, 5, 1); set(cx - 1, 5, 1); set(cx, 5, 1); set(cx + 1, 5, 1); // boca oscura
  // sección de equipos (más ancha) con puertas de servicio
  for (let y = 27; y <= 33; y++) {
    for (let dx = -5; dx <= 5; dx++) {
      let c = dx >= 3 ? 7 : dx >= -2 ? 6 : dx >= -4 ? 13 : 5;
      if (y === 27 || dx === -1 || dx === 2) c = DARK[c];
      set(cx + dx, y, c);
    }
  }
  // mamparo trasero
  for (let dx = -4; dx <= 4; dx++) { set(cx + dx, 34, dx >= 2 ? 13 : 5); set(cx + dx, 35, 1); }
  set(cx - 1, 34, 0); set(cx, 34, 0);
  // paneles solares (a cada lado), con marco, celdas y reflejo
  const panel = (x0) => {
    for (let y = 12; y <= 23; y++) {
      for (let x = 0; x < 8; x++) {
        let c;
        if (x === 0 || x === 7 || y === 12 || y === 23) c = y === 12 ? 6 : 13; // marco
        else c = (x % 2 === 0 || (y - 12) % 3 === 0) ? 1 : 12; // celdas
        if (c === 12 && x >= 5 && y <= 15) c = 7; // reflejo del Sol
        set(x0 + x, y, c);
      }
    }
  };
  panel(cx - 15);
  panel(cx + 8);
  for (let x = cx - 7; x <= cx - 5; x++) set(x, 18, 5); // mástiles
  for (let x = cx + 5; x <= cx + 7; x++) set(x, 18, 6);
  // antenas de alta ganancia (platos) en brazos, a los lados de la sección de equipos
  const dish = (x0, dir) => {
    set(x0, 30, 5); set(x0 + dir, 30, 5); set(x0 + dir * 2, 30, 5);
    set(x0 + dir * 3, 29, 6); set(x0 + dir * 3, 30, 7); set(x0 + dir * 3, 31, 6);
    set(x0 + dir * 4, 28, 13); set(x0 + dir * 4, 32, 13);
  };
  dish(cx - 6, -1);
  dish(cx + 6, 1);
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (px[y][x] < 0) continue;
      g.fillStyle = PAL[px[y][x]];
      g.fillRect(x, y, 1, 1);
    }
  }
  return c;
}

/** Dibuja el Hubble centrado en (x, y); u = tamaño del píxel en el lienzo. */
export function drawHubblePixel(ctx, x, y, u, t = 0) {
  if (!hubbleCanvas) hubbleCanvas = buildHubble();
  const w = hubbleCanvas.width;
  const h = hubbleCanvas.height;
  const gx = Math.round(x / u - w / 2) * u;
  const gy = Math.round(y / u - h / 2) * u;
  const smooth = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(hubbleCanvas, gx, gy, w * u, h * u);
  // luz de posición que parpadea
  if (Math.floor(t * 2) % 2 === 0) {
    ctx.fillStyle = '#FF004D';
    ctx.fillRect(gx + 21 * u, gy + 33 * u, u, u);
  }
  ctx.imageSmoothingEnabled = smooth;
}
