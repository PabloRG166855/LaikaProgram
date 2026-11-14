import { computeShipStats } from '../ship.js';
import { esc } from '../ui.js';

export function renderLaunch(root, { data, level, design, onDone }) {
  const st = computeShipStats(design, level, data);
  const anomaly = Math.random() > st.rocket.reliability;
  const launchInfo = { anomalyDamage: anomaly ? 15 : 0 };

  root.innerHTML = `
    <div class="launch">
      <h2>${esc(st.rocket.name)} rumbo a ${esc(level.destinationName)}</h2>
      <div class="count" id="l-count">T−3</div>
      <div class="rocket">🚀</div>
      <p id="l-msg" class="info" style="margin-top:24px"></p>
      <button class="btn ghost" data-act="skip" style="margin-top:12px">Saltar ▶</button>
    </div>`;

  const steps = ['T−3', 'T−2', 'T−1', '¡Despegue!'];
  let i = 0;
  let finished = false;
  const count = root.querySelector('#l-count');
  const msg = root.querySelector('#l-msg');
  const timer = setInterval(() => {
    i++;
    if (i < steps.length) count.textContent = steps[i];
    if (i === steps.length) {
      msg.innerHTML = anomaly
        ? '⚠️ <b>Anomalía:</b> vibraciones fuertes durante el ascenso. La nave empieza la misión con daños (−15 integridad).'
        : '✅ Lanzamiento nominal. La nave va en camino.';
    }
    if (i >= steps.length + 2) finish();
  }, 700);

  function finish() {
    if (finished) return;
    finished = true;
    clearInterval(timer);
    onDone(launchInfo);
  }

  root.onclick = e => {
    if (e.target.closest('[data-act="skip"]')) finish();
  };
}
