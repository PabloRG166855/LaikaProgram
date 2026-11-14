import { esc } from '../ui.js';
import { slotLabel } from '../ship.js';
import { fmt, fmtTime } from '../util.js';

export function renderMenu(root, { data, onPick }) {
  root.innerHTML = `
    <div class="menu-hero">
      <h1>🚀 Director de Misión</h1>
      <p>Diseña tu nave, elige a tu tripulación y dirige la misión. Cada decisión de ingeniería tiene consecuencias: no existe una sola solución perfecta.</p>
      <div class="loop"><span>1. Diseña la nave</span><span>2. Lanza</span><span>3. Cumple los objetivos y resuelve imprevistos</span><span>4. Recibe tu calificación</span><span>5. Rediseña y vuelve a intentar</span></div>
    </div>
    <div class="levels">
      ${data.levels.map(l => `
        <div class="card level-card" data-level="${l.id}" role="button" tabindex="0">
          <div class="planet" style="background:radial-gradient(circle at 35% 35%, ${l.bodyColor}, ${l.bodyColor2})"></div>
          <h3>${esc(l.name)}: ${esc(l.title)}</h3>
          <p class="info">${esc(l.description)}</p>
          <ul>
            <li>Presupuesto: <b>$${fmt(l.budget)} M</b></li>
            <li>Tripulación: <b>${l.crewSize} puestos</b> (${l.crewSlots.map(s => esc(slotLabel(s, data))).join(', ')})</li>
            <li>Objetivos principales: <b>${l.script.length}</b> + imprevistos aleatorios</li>
            <li>Duración: <b>${fmtTime(l.durationSec)}</b> de misión</li>
            <li>Meta científica: <b>${fmt(l.scienceGoal)} puntos</b></li>
            ${l.pauseOnDecision ? '<li>El tiempo se pausa mientras decides</li>' : '<li>El tiempo <b>no</b> se detiene mientras decides</li>'}
          </ul>
          <button class="btn">Elegir</button>
        </div>`).join('')}
    </div>`;
  root.onclick = e => {
    const card = e.target.closest('[data-level]');
    if (card) onPick(data.levels.find(l => l.id === card.dataset.level));
  };
}
