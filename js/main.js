import { loadData } from './data.js';
import { createDesign } from './ship.js';
import { renderMenu } from './views/menuView.js';
import { renderHangar } from './views/hangarView.js';
import { renderCrew } from './views/crewView.js';
import { renderFlight } from './views/flightView.js';
import { startMission } from './views/missionView.js';
import { renderReport } from './views/reportView.js';
import { prepareSprites } from './views/animals.js';
import { initSfx } from './sfx.js';

const app = { data: null, level: null, designs: {} };
const screen = id => document.getElementById(`screen-${id}`);

const STEP_ORDER = ['menu', 'design', 'mission', 'report'];

function show(id) {
  document.querySelectorAll('.screen').forEach(el => el.classList.toggle('hidden', el.id !== `screen-${id}`));
  const current = STEP_ORDER.indexOf(id === 'launch' ? 'mission' : id === 'crew' ? 'design' : id);
  document.querySelectorAll('#steps .step').forEach(el => {
    const i = STEP_ORDER.indexOf(el.dataset.step);
    el.classList.toggle('active', i === current);
    el.classList.toggle('done', i < current);
  });
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
    renderHangar(screen('design'), {
      data: app.data, level, design: app.designs[level.id],
      onBack: () => nav.menu(),
      onNext: () => nav.crew()
    });
  },
  crew() {
    show('crew');
    renderCrew(screen('crew'), {
      data: app.data, level: app.level, design: app.designs[app.level.id],
      onBack: () => nav.design(app.level),
      onLaunch: () => nav.launch()
    });
  },
  launch() {
    show('launch');
    renderFlight(screen('launch'), {
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
  .then(async data => {
    app.data = data;
    await prepareSprites([data.crew.director, ...data.crew.members]);
    initSfx();
    window.LAIKA_I18N?.addToggle();
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
