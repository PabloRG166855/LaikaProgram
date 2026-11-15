import { esc, avatar } from '../ui.js';
import { icon } from '../icons.js';

export function renderMenu(root, { data, onPick }) {
  const playable = data.levels.filter(l => l.playable);
  const locked = data.levels.filter(l => !l.playable);
  root.innerHTML = `
    <div class="kid-menu">
      <div class="km-hero">
        ${avatar(data.crew.director, 'km-laika')}
        <div>
          <span class="kicker">LAIKA PROGRAM</span>
          <h1>¡Hola! Soy Laika,<br>tu directora de vuelo.</h1>
          <p>Arma una nave, elige a tu tripulación de animales astronautas y llévala a su destino.</p>
          <div class="km-steps">
            <span>${icon('wrench', 18)} Arma la nave</span>
            <span>${icon('users', 18)} Elige tripulación</span>
            <span>${icon('rocket', 18)} ¡Despega!</span>
            <span>${icon('trophy', 18)} Gana</span>
          </div>
        </div>
      </div>
      ${playable.map(l => `
        <button class="km-mission" data-level="${l.id}" style="background-image:linear-gradient(90deg, rgba(5,9,20,.95) 25%, rgba(5,9,20,.2)), url('${l.image}')">
          <span class="lvl-tag ${l.id}">MISIÓN</span>
          <h2>${esc(l.title)}</h2>
          <p>${esc(l.description)}</p>
          <span class="btn go big km-play">${icon('play', 20)} Jugar</span>
        </button>`).join('')}
      <div class="km-locked">
        ${locked.map(l => `
          <div class="km-lock" style="background-image:linear-gradient(rgba(5,9,20,.75), rgba(5,9,20,.9)), url('${l.image}')">
            ${icon('lock', 22)}<b>${esc(l.title)}</b><small>Próximamente</small>
          </div>`).join('')}
      </div>
    </div>`;
  root.onclick = e => {
    const card = e.target.closest('[data-level]');
    if (card) onPick(data.levels.find(l => l.id === card.dataset.level));
  };
}
