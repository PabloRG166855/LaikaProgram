// Cartoon animal astronauts drawn in SVG (100x100). Inspired by the real animals that flew to space.
// Each member in crew.json has "species" and an optional "look" with colors.

const ROLE_ACCENT = {
  commander: '#fbbf24', pilot: '#22d3ee', flight_engineer: '#fb923c', life_support_engineer: '#34d399',
  mission_specialist: '#a78bfa', payload_specialist: '#60a5fa', geologist: '#f59e0b', medical_officer: '#f472b6'
};

const cache = new Map();

const eye = (x, y, r = 2.7, sclera = false) =>
  `${sclera ? `<circle cx="${x}" cy="${y}" r="${r * 1.55}" fill="#fff"/>` : ''}<circle cx="${x}" cy="${y}" r="${r}" fill="#0f172a"/><circle cx="${x + r * 0.35}" cy="${y - r * 0.35}" r="${r * 0.36}" fill="#fff"/>`;
const isDark = hex => {
  const h = (hex || '#888888').replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 90;
};
const blush = (x, y) => `<ellipse cx="${x}" cy="${y}" rx="3" ry="2" fill="#fb7185" opacity=".45"/>`;
const whiskers = (y, c = '#e5e7eb') =>
  `<g stroke="${c}" stroke-width=".8" stroke-linecap="round" opacity=".85">
    <path d="M40 ${y} L29 ${y - 2}"/><path d="M40 ${y + 2} L29 ${y + 3}"/>
    <path d="M60 ${y} L71 ${y - 2}"/><path d="M60 ${y + 2} L71 ${y + 3}"/></g>`;

function dog(l) {
  const fur = l.fur || '#e7c9a0';
  const fur2 = l.fur2 || '#6b4423';
  const ears = l.ears === 'floppy'
    ? `<ellipse cx="31" cy="44" rx="6.5" ry="12.5" fill="${fur2}" transform="rotate(22 31 44)"/>
       <ellipse cx="69" cy="44" rx="6.5" ry="12.5" fill="${fur2}" transform="rotate(-22 69 44)"/>`
    : `<path d="M33 37 L29 15 L45 29 Z" fill="${fur2}"/><path d="M34 33 L32 20 L41 29 Z" fill="#fda4af" opacity=".7"/>
       <path d="M67 37 L71 15 L55 29 Z" fill="${fur2}"/><path d="M66 33 L68 20 L59 29 Z" fill="#fda4af" opacity=".7"/>`;
  const patch = l.patch ? `<ellipse cx="42.5" cy="41.5" rx="6.5" ry="5.5" fill="${fur2}" opacity=".9"/>` : '';
  return `${ears}
    <ellipse cx="50" cy="45" rx="19" ry="18" fill="${fur}"/>
    ${patch}
    <ellipse cx="50" cy="54" rx="10.5" ry="7.5" fill="#fff7ed" opacity=".95"/>
    ${eye(43, 42, 2.7, isDark(fur))}${eye(57, 42, 2.7, isDark(fur))}
    <ellipse cx="50" cy="50.5" rx="3.8" ry="2.7" fill="#0f172a"/>
    <path d="M46 55 Q50 58.5 54 55" stroke="#0f172a" stroke-width="1.2" fill="none" stroke-linecap="round"/>
    <ellipse cx="50" cy="58.3" rx="2.3" ry="2" fill="#f472b6"/>
    ${blush(38, 50)}${blush(62, 50)}`;
}

function primate(l, kind) {
  const fur = l.fur || '#3f2a1d';
  const face = l.face || '#e8c4a0';
  const earR = kind === 'chimp' ? 7 : 5.5;
  let faceShape;
  if (kind === 'squirrel') {
    faceShape = `
      <ellipse cx="43" cy="42" rx="6.5" ry="6" fill="${face}"/><ellipse cx="57" cy="42" rx="6.5" ry="6" fill="${face}"/>
      <ellipse cx="50" cy="54" rx="7" ry="5.5" fill="#1f2937"/>`;
  } else {
    faceShape = `
      <ellipse cx="50" cy="51" rx="13" ry="11" fill="${face}"/>
      <ellipse cx="50" cy="41" rx="13" ry="6.5" fill="${face}"/>`;
  }
  const mouth = kind === 'squirrel'
    ? '<path d="M47 55.5 Q50 57.5 53 55.5" stroke="#fef3c7" stroke-width="1" fill="none" stroke-linecap="round"/>'
    : '<path d="M43.5 55 Q50 60 56.5 55" stroke="#3b2416" stroke-width="1.3" fill="none" stroke-linecap="round"/>';
  return `
    <circle cx="${50 - 19}" cy="46" r="${earR}" fill="${fur}"/><circle cx="${50 - 19}" cy="46" r="${earR * 0.55}" fill="${face}"/>
    <circle cx="${50 + 19}" cy="46" r="${earR}" fill="${fur}"/><circle cx="${50 + 19}" cy="46" r="${earR * 0.55}" fill="${face}"/>
    <circle cx="50" cy="45" r="19" fill="${fur}"/>
    ${faceShape}
    ${eye(44, 42)}${eye(56, 42)}
    <circle cx="48" cy="50" r=".9" fill="#3b2416"/><circle cx="52" cy="50" r=".9" fill="#3b2416"/>
    ${mouth}
    ${kind === 'chimp' ? '' : blush(39, 51) + blush(61, 51)}`;
}

function cat(l) {
  const fur = l.fur || '#1f2937';
  const fur2 = l.fur2 || '#f8fafc';
  const eyes = l.eyes || '#a3e635';
  const catEye = x => `<circle cx="${x}" cy="42" r="3.2" fill="${eyes}"/><ellipse cx="${x}" cy="42" rx="1" ry="2.6" fill="#0f172a"/><circle cx="${x + 1}" cy="40.8" r=".7" fill="#fff"/>`;
  return `
    <path d="M32 38 L31 16 L47 29 Z" fill="${fur}"/><path d="M34 33 L34 21 L43 29 Z" fill="#f9a8d4"/>
    <path d="M68 38 L69 16 L53 29 Z" fill="${fur}"/><path d="M66 33 L66 21 L57 29 Z" fill="#f9a8d4"/>
    <ellipse cx="50" cy="45" rx="19.5" ry="17.5" fill="${fur}"/>
    <ellipse cx="50" cy="53" rx="9" ry="6.5" fill="${fur2}"/>
    ${catEye(43)}${catEye(57)}
    <path d="M48 49.5 L52 49.5 L50 52 Z" fill="#f472b6"/>
    <path d="M46.5 54 Q48.3 56 50 54 Q51.7 56 53.5 54" stroke="#0f172a" stroke-width="1" fill="none" stroke-linecap="round"/>
    ${whiskers(51)}`;
}

function rodent(l, kind) {
  const fur = l.fur || '#9ca3af';
  const fur2 = l.fur2 || '#e5e7eb';
  const ears = kind === 'rabbit'
    ? `<ellipse cx="42" cy="25" rx="5" ry="10.5" fill="${fur}"/><ellipse cx="42" cy="26" rx="2.6" ry="7.5" fill="${fur2}"/>
       <ellipse cx="58" cy="25" rx="5" ry="10.5" fill="${fur}"/><ellipse cx="58" cy="26" rx="2.6" ry="7.5" fill="${fur2}"/>`
    : `<circle cx="33" cy="31" r="8.5" fill="${fur}"/><circle cx="33" cy="31" r="5.2" fill="#fbcfe8"/>
       <circle cx="67" cy="31" r="8.5" fill="${fur}"/><circle cx="67" cy="31" r="5.2" fill="#fbcfe8"/>`;
  const teeth = kind === 'rabbit' ? '<rect x="48.2" y="55" width="3.6" height="3.6" rx=".6" fill="#fff" stroke="#cbd5e1" stroke-width=".5"/>' : '';
  return `${ears}
    <ellipse cx="50" cy="46" rx="17.5" ry="17" fill="${fur}"/>
    <ellipse cx="50" cy="53" rx="8" ry="6" fill="${kind === 'rabbit' ? '#fff' : fur2}"/>
    ${eye(43.5, 43, 2.5)}${eye(56.5, 43, 2.5)}
    <circle cx="50" cy="51" r="2" fill="#f472b6"/>
    <path d="M47 54.5 Q50 56.5 53 54.5" stroke="#0f172a" stroke-width="1" fill="none" stroke-linecap="round"/>
    ${teeth}${whiskers(52, '#64748b')}${blush(39, 50)}${blush(61, 50)}`;
}

function tortoise(l) {
  const skin = l.fur || '#84cc16';
  return `
    <ellipse cx="50" cy="46" rx="15" ry="16.5" fill="${skin}"/>
    <ellipse cx="50" cy="40" rx="11" ry="6" fill="#bef264" opacity=".5"/>
    ${eye(44, 43, 2.6)}${eye(56, 43, 2.6)}
    <path d="M44 53 Q50 57.5 56 53" stroke="#365314" stroke-width="1.4" fill="none" stroke-linecap="round"/>
    <circle cx="48.5" cy="49" r=".7" fill="#365314"/><circle cx="51.5" cy="49" r=".7" fill="#365314"/>
    ${blush(39, 50)}${blush(61, 50)}`;
}

function spider(l) {
  const body = l.fur || '#7c3aed';
  const mark = l.fur2 || '#facc15';
  const legs = [-1, 1].map(side => [0, 1, 2, 3].map(i => {
    const y = 38 + i * 6;
    const x1 = 50 + side * 13;
    const x2 = 50 + side * (26 + (i % 2) * 2);
    return `<path d="M${x1} ${y} Q${50 + side * 24} ${y - 9} ${x2} ${y + 4}" stroke="${body}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
  }).join('')).join('');
  return `${legs}
    <circle cx="50" cy="46" r="15" fill="${body}"/>
    <circle cx="46" cy="36.5" r="1.4" fill="#0f172a"/><circle cx="54" cy="36.5" r="1.4" fill="#0f172a"/>
    <circle cx="42" cy="39" r="1.2" fill="#0f172a"/><circle cx="58" cy="39" r="1.2" fill="#0f172a"/>
    <circle cx="45" cy="44" r="4.2" fill="#fff"/><circle cx="55" cy="44" r="4.2" fill="#fff"/>
    ${eye(45.5, 44.5, 2.4)}${eye(55.5, 44.5, 2.4)}
    <path d="M46 52 Q50 55 54 52" stroke="${mark}" stroke-width="1.3" fill="none" stroke-linecap="round"/>
    <path d="M47 57 L50 60 L53 57" stroke="${mark}" stroke-width="1.2" fill="none"/>`;
}

function head(species, look) {
  switch (species) {
    case 'dog': return dog(look);
    case 'chimp': return primate(look, 'chimp');
    case 'rhesus': return primate(look, 'rhesus');
    case 'squirrel': return primate(look, 'squirrel');
    case 'cat': return cat(look);
    case 'rat': return rodent(look, 'rat');
    case 'rabbit': return rodent(look, 'rabbit');
    case 'tortoise': return tortoise(look);
    case 'spider': return spider(look);
    default: return dog(look);
  }
}

/** Returns an SVG string for an animal astronaut portrait. */
export function animalSvg(member) {
  const key = member.id || member.name;
  if (cache.has(key)) return cache.get(key);
  const look = member.look || {};
  const accent = look.accent || ROLE_ACCENT[member.role] || '#22d3ee';
  const shell = member.species === 'tortoise'
    ? `<g fill="#a16207" stroke="#713f12" stroke-width="1"><path d="M20 98 L26 84 L38 82 L36 96 Z"/><path d="M80 98 L74 84 L62 82 L64 96 Z"/></g>`
    : '';
  const id = `g${String(key).replace(/[^a-z0-9]/gi, '')}`;
  const svg = `
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${member.name}">
    <defs>
      <radialGradient id="${id}" cx="50%" cy="38%" r="70%"><stop offset="0" stop-color="${accent}" stop-opacity=".35"/><stop offset="1" stop-color="#050914" stop-opacity="0"/></radialGradient>
    </defs>
    <rect width="100" height="100" rx="14" fill="#0b1426"/>
    <rect width="100" height="100" rx="14" fill="url(#${id})"/>
    <circle cx="14" cy="16" r=".9" fill="#fff" opacity=".7"/><circle cx="86" cy="22" r=".7" fill="#fff" opacity=".6"/><circle cx="80" cy="60" r=".6" fill="#fff" opacity=".5"/>
    <path d="M10 100 C12 81 29 72 50 72 C71 72 88 81 90 100 Z" fill="#e5e7eb" stroke="#94a3b8" stroke-width="1"/>
    <path d="M30 100 L32 86 M70 100 L68 86" stroke="#cbd5e1" stroke-width="1.2"/>
    ${shell}
    <rect x="41" y="84" width="18" height="9" rx="2" fill="#334155"/><circle cx="45" cy="88.5" r="1.4" fill="#ef4444"/><circle cx="50" cy="88.5" r="1.4" fill="#22c55e"/><circle cx="55" cy="88.5" r="1.4" fill="${accent}"/>
    <circle cx="74" cy="89" r="4.6" fill="${accent}" stroke="#0f172a" stroke-width="1"/><path d="M71.6 89 L76.4 89 M74 86.6 L74 91.4" stroke="#0f172a" stroke-width="1.1"/>
    <ellipse cx="50" cy="74.5" rx="23" ry="6" fill="${accent}" stroke="#0f172a" stroke-width="1"/>
    <circle cx="50" cy="44" r="33" fill="#0ea5e9" opacity=".08"/>
    <g transform="translate(50 46) scale(1.16) translate(-50 -46)">${head(member.species, look)}</g>
    <circle cx="50" cy="44" r="33" fill="none" stroke="#e0f2fe" stroke-opacity=".7" stroke-width="2"/>
    <path d="M26 34 A27 27 0 0 1 42 17" stroke="#fff" stroke-opacity=".75" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M71 58 A27 27 0 0 1 64 66" stroke="#fff" stroke-opacity=".35" stroke-width="2" fill="none" stroke-linecap="round"/>
  </svg>`;
  cache.set(key, svg);
  return svg;
}

// ---------- 8-bit sprites ----------
// Each SVG portrait is rasterized at low resolution, snapped to the PICO-8 palette
// and shown upscaled with `image-rendering: pixelated`.
export const PICO8 = ['#000000', '#1D2B53', '#7E2553', '#008751', '#AB5236', '#5F574F', '#C2C3C7', '#FFF1E8',
  '#FF004D', '#FFA300', '#FFEC27', '#00E436', '#29ADFF', '#83769C', '#FF77A8', '#FFCCAA'];
const PAL = PICO8.map(h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);
const sprites = new Map();

function nearest(r, g, b) {
  let best = PAL[0];
  let bd = Infinity;
  for (const p of PAL) {
    const d = (r - p[0]) ** 2 * 0.3 + (g - p[1]) ** 2 * 0.59 + (b - p[2]) ** 2 * 0.11;
    if (d < bd) { bd = d; best = p; }
  }
  return best;
}

function rasterize(member, size = 40) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = size;
      c.height = size;
      const x = c.getContext('2d');
      x.drawImage(img, 0, 0, size, size);
      const d = x.getImageData(0, 0, size, size);
      for (let i = 0; i < d.data.length; i += 4) {
        if (d.data[i + 3] < 128) { d.data[i + 3] = 0; continue; }
        const [r, g, b] = nearest(d.data[i], d.data[i + 1], d.data[i + 2]);
        d.data[i] = r; d.data[i + 1] = g; d.data[i + 2] = b; d.data[i + 3] = 255;
      }
      x.putImageData(d, 0, 0);
      resolve(c.toDataURL('image/png'));
    };
    img.onerror = () => resolve(null);
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(animalSvg(member))}`;
  });
}

/** Pre-renders 8-bit sprites for every member (call once at startup). */
export async function prepareSprites(members) {
  await Promise.all(members.map(async m => {
    const url = await rasterize(m);
    if (url) sprites.set(m.id, url);
  }));
}

export const spriteOf = member => sprites.get(member.id);
