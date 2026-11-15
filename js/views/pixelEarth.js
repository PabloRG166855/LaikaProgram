// Tierra en pixel art: una esfera que gira con los continentes reales (Natural Earth),
// hielo en los polos, desiertos, nubes y el lado de noche con tramado (dithering), como en los juegos de 8 bits.
import { EARTH_ROWS, EARTH_W, EARTH_H } from '../earthMap.js';

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => v / 16 - 0.5);
const COL = {
  ocean: ['#29ADFF', '#1D2B53'],
  land: ['#00E436', '#008751'],
  desert: ['#FFCCAA', '#AB5236'],
  ice: ['#FFF1E8', '#C2C3C7'],
  cloud: ['#FFF1E8', '#83769C']
};
const hex = c => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
const RGB = Object.fromEntries(Object.entries(COL).map(([k, v]) => [k, v.map(hex)]));
const RIM = [hex('#29ADFF'), hex('#1D2B53')];

const isLand = (i, j) => EARTH_ROWS[Math.max(0, Math.min(EARTH_H - 1, j))][((i % EARTH_W) + EARTH_W) % EARTH_W] === '#';

// desiertos grandes (Sahara, Arabia, Australia, Atacama, Kalahari, Gobi), aproximados por zonas
function isDesert(lon, lat) {
  return (lat > 14 && lat < 32 && lon > -16 && lon < 58) ||
    (lat > -30 && lat < -19 && lon > 118 && lon < 142) ||
    (lat > -28 && lat < -18 && lon > 15 && lon < 25) ||
    (lat > 38 && lat < 46 && lon > 92 && lon < 112);
}

function hash(x, y) {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
function noise(x, y) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const a = hash(xi, yi);
  const b = hash(xi + 1, yi);
  const c = hash(xi, yi + 1);
  const d = hash(xi + 1, yi + 1);
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

const cache = new Map();

/**
 * Devuelve un lienzo pequeño (2r+3 px) con la Tierra. r = radio en píxeles "gordos".
 * spin = giro en radianes; light = dirección del Sol en pantalla (x derecha, y abajo, z hacia ti).
 */
export function earthSprite(r, spin, light = [0.62, -0.42, 0.66]) {
  const step = Math.round((spin / (Math.PI * 2)) * EARTH_W * 2);
  const key = `${r}|${step}|${light.join()}`;
  if (cache.has(key)) return cache.get(key);
  const lon0 = (step / (EARTH_W * 2)) * Math.PI * 2;
  const size = r * 2 + 3;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const g = c.getContext('2d');
  const img = g.createImageData(size, size);
  const L = Math.hypot(...light);
  const [lx, ly, lz] = light.map(v => v / L);
  const cloudShift = lon0 * 0.6;
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const dx = (px - r - 1 + 0.5) / r;
      const dy = (py - r - 1 + 0.5) / r;
      const d2 = dx * dx + dy * dy;
      let rgb = null;
      const bay = BAYER[(py & 3) * 4 + (px & 3)];
      if (d2 <= 1) {
        const dz = Math.sqrt(1 - d2);
        const lat = Math.asin(-dy);
        const lon = Math.atan2(dx, dz) + lon0;
        const latD = (lat * 180) / Math.PI;
        let lonD = ((((lon * 180) / Math.PI + 180) % 360) + 360) % 360 - 180;
        const mi = Math.floor(((lonD + 180) / 360) * EARTH_W);
        const mj = Math.floor(((90 - latD) / 180) * EARTH_H);
        let kind = isLand(mi, mj) ? (Math.abs(latD) > 62 ? 'ice' : isDesert(lonD, latD) ? 'desert' : 'land') : Math.abs(latD) > 72 ? 'ice' : 'ocean';
        const cl = noise((lonD + 180) / 14 + cloudShift * 3, (latD + 90) / 9) * 0.65 + noise((lonD + 180) / 6, (latD + 90) / 5) * 0.35;
        if (cl > 0.7 && Math.abs(latD) < 70) kind = 'cloud';
        const lit = dx * lx + dy * ly + dz * lz;
        const shade = lit + bay * 0.5 > 0.08 ? 0 : 1;
        rgb = RGB[kind][shade];
        // lado de noche: más oscuro
        if (lit + bay * 0.4 < -0.35) rgb = kind === 'ocean' ? [0, 0, 0] : RGB[kind][1].map(v => v >> 1);
      } else if (d2 <= (1 + 1.6 / r) ** 2) {
        // atmósfera: un borde fino azul del lado iluminado
        const lit = dx * lx + dy * ly;
        if (lit > -0.2) rgb = RIM[lit > 0.25 ? 0 : 1];
      }
      if (!rgb) continue;
      const i = (py * size + px) * 4;
      img.data[i] = rgb[0];
      img.data[i + 1] = rgb[1];
      img.data[i + 2] = rgb[2];
      img.data[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  if (cache.size > 400) cache.clear();
  cache.set(key, c);
  return c;
}

/** Dibuja la Tierra centrada en (cx, cy) con radio R en píxeles de pantalla, sobre un lienzo de "píxeles gordos" de tamaño PX. */
export function drawPixelEarth(ctx, cx, cy, R, PX, spin, light) {
  const r = Math.max(3, Math.round(R / PX));
  const spr = earthSprite(r, spin, light);
  const s = spr.width * PX;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(spr, Math.round((cx - s / 2) / PX) * PX, Math.round((cy - s / 2) / PX) * PX, s, s);
}
