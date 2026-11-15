// Tiny chiptune sound effects with the Web Audio API (square/triangle waves, no audio files).
import { icon } from './icons.js';

let ctx = null;
let muted = false;
try { muted = localStorage.getItem('laika-muted') === '1'; } catch { /* storage unavailable */ }

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, start, dur, { type = 'square', vol = 0.06, slide = 0 } = {}) {
  const a = ac();
  if (!a || muted) return;
  const t0 = a.currentTime + start;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (slide) o.frequency.linearRampToValueAtTime(freq + slide, t0 + dur);
  g.gain.setValueAtTime(vol, t0);
  g.gain.setValueAtTime(vol, t0 + dur * 0.7);
  g.gain.linearRampToValueAtTime(0, t0 + dur);
  o.connect(g).connect(a.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

const SOUNDS = {
  click: () => tone(880, 0, 0.04, { vol: 0.035 }),
  tick: () => tone(1320, 0, 0.025, { vol: 0.04 }),
  select: () => { tone(660, 0, 0.05); tone(990, 0.05, 0.06); },
  success: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.07, 0.08)),
  fail: () => { tone(330, 0, 0.12); tone(247, 0.12, 0.12); tone(165, 0.24, 0.2, { slide: -40 }); },
  alert: () => { tone(988, 0, 0.07, { vol: 0.05 }); tone(988, 0.12, 0.07, { vol: 0.05 }); },
  objective: () => { tone(784, 0, 0.08); tone(1175, 0.09, 0.14); },
  blip: () => tone(440, 0, 0.06, { type: 'triangle', vol: 0.08 }),
  launch: () => tone(110, 0, 1.4, { type: 'sawtooth', vol: 0.05, slide: 600 }),
  win: () => [523, 659, 784, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.11, 0.12)),
  lose: () => [392, 330, 262, 196].forEach((f, i) => tone(f, i * 0.16, 0.18, { type: 'triangle', vol: 0.09 }))
};

/** Short filtered noise burst (engine rumble, explosions). */
export function sfxNoise(dur = 0.1, vol = 0.05, freq = 400) {
  const a = ac();
  if (!a || muted) return;
  const len = Math.max(1, Math.floor(a.sampleRate * dur));
  const buf = a.createBuffer(1, len, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = a.createBufferSource();
  src.buffer = buf;
  const f = a.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = freq;
  const g = a.createGain();
  g.gain.value = vol;
  src.connect(f).connect(g).connect(a.destination);
  src.start();
}

export function sfx(name) {
  if (muted) return;
  try { SOUNDS[name]?.(); } catch { /* audio not available */ }
}

function renderToggle(btn) {
  btn.innerHTML = icon(muted ? 'volume-x' : 'volume', 20);
  btn.title = muted ? 'Activar sonido' : 'Silenciar';
}

export function initSfx() {
  if (!document.getElementById('sfx-toggle')) {
    const btn = document.createElement('button');
    btn.id = 'sfx-toggle';
    btn.className = 'btn ghost small sfx-toggle';
    renderToggle(btn);
    btn.addEventListener('click', () => {
      muted = !muted;
      try { localStorage.setItem('laika-muted', muted ? '1' : '0'); } catch { /* ignore */ }
      renderToggle(btn);
      if (!muted) sfx('select');
    });
    document.body.appendChild(btn); // fixed in the top-left corner
  }
  // Every button press makes a small blip
  document.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (b && !b.disabled && b.id !== 'sfx-toggle') sfx('click');
  }, true);
}
