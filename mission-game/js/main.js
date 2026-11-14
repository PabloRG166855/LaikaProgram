import { loadData } from './data.js';
import { createDesign } from './ship.js';
import { renderMenu } from './views/menuView.js';
import { renderDesign } from './views/designView.js';
import { renderLaunch } from './views/launchView.js';
import { startMission } from './views/missionView.js';
import { renderReport } from './views/reportView.js';

const app = { data: null, level: null, designs: {} };
const screen = id => document.getElementById(`screen-${id}`);

function show(id) {
  document.querySelectorAll('.screen').forEach(el => el.classList.toggle('hidden', el.id !== `screen-${id}`));
  window.scrollTo(0, 0);
}

const nav = {
  menu() {
    show('menu');
    renderMenu(screen('menu'), { data: app.data, onPick: level => nav.design(level) });
  },
  design(level) {
    app.level = level;
    if (!app.designs[level.id]) app.designs[level.id] = createDesign(level, app.data);
    show('design');
    renderDesign(screen('design'), {
      data: app.data, level, design: app.designs[level.id],
      onBack: () => nav.menu(),
      onLaunch: () => nav.launch()
    });
  },
  launch() {
    show('launch');
    renderLaunch(screen('launch'), {
      data: app.data, level: app.level, design: app.designs[app.level.id],
      onDone: launchInfo => nav.mission(launchInfo)
    });
  },
  mission(launchInfo) {
    show('mission');
    startMission(screen('mission'), {
      data: app.data, level: app.level, design: app.designs[app.level.id], launchInfo,
      onEnd: state => nav.report(state)
    });
  },
  report(state) {
    show('report');
    renderReport(screen('report'), {
      state,
      onRedesign: () => nav.design(app.level),
      onMenu: () => nav.menu()
    });
  }
};

loadData()
  .then(data => {
    app.data = data;
    nav.menu();
  })
  .catch(err => {
    screen('menu').innerHTML = `
      <div class="card" style="max-width:640px;margin:60px auto">
        <h2>No se pudieron cargar los datos del juego</h2>
        <p>${err.message}</p>
        <p class="info">El juego carga archivos JSON, así que necesita un servidor local (no funciona abriendo el archivo con doble clic).
        En la carpeta del juego ejecuta <code>npx serve</code> o <code>python -m http.server</code> y abre la dirección que te indique.</p>
      </div>`;
  });
