# Technical & Game Design Documentation

Technical reference for **Laika Program**, built with HTML5, CSS3, and ES module JavaScript.

## 1. Running the Project & Architecture

The game loads JSON files under `data/` using `fetch()`, so it requires an HTTP server:

```bash
npx serve .                  # or: python3 -m http.server 8000
```

Code layout:
- `data/*.json`: All levels, rockets, components, crew, random events, and main mission objectives.
- `js/ship.js`, `js/missionEngine.js`, `js/report.js`: Pure simulation logic with no DOM access.
- `js/views/*`: Screen views, SVG/sprite animals, ship drawing, orbital map (`PX = 3`), launch flight game, and repair minigames.
- `minigames/sts125/*`: 5 standalone/embedded STS-125 Hubble minigames connected to the main mission via `iframe` and `postMessage`.
- `js/i18n.js`, `js/i18n-en.js`, `js/sfx.js`, `css/retro.css`: Live `EN | ES` translation, Web Audio chiptune sound effects, and PICO-8 theme.

## 2. Missions & Rockets (`data/levels.json`, `data/rockets.json`)

| Level | Mission | Destination | Status | Rocket | Capacity (`kg`) | Duration | Crew Slots | Science Goal |
|---|---|---|---|---|---|---|---|---|
| `easy` | **Save the Hubble (STS-125)** | `LEO` | Playable | Cóndor L | 8,000 | 150 s | Cmd, Pilot, Specialist | 500 |
| `medium` | **Lunar Expedition (Artemis)** | `MOON` | Playable | Jaguar H | 18,000 | 150 s | Cmd, Pilot, Science | 600 |
| `hard` | **Crewed Mission to Mars** | `MARS` | Coming Soon | Titán SH | 30,000 | 270 s | Cmd, Pilot, Eng, Med, Sci | 1,200 |

*(Additional rocket in `data/rockets.json`: Quetzal M with 22,000 kg LEO / 10,000 kg MOON capacity).*

## 3. Game Rules & Formulas

### Hangar Validation (`js/ship.js`)
- **Parts Catalog:** 30 components across 10 categories (6 picked by the player: `structure`, `propulsion`, `power`, `comms`, `shielding`, `instruments`; 4 picked automatically: `battery`, `life_support`, `computer`, `attitude`).
- **Launch Requirements (Weight & Power, no monetary budget):**
  1. `totalMass = componentMass + (crewCount * crewMassPerPersonKg) <= rocketCapacity`
  2. `powerUse <= powerGen`
  3. `propulsionLevel >= level.minPropulsion` and `shielding >= level.minShielding`
  4. `instruments.length >= 1` and `projectedScience >= scienceGoal * minScience`
- **Data Transmission:** `sentFraction = Math.min(1, (comms / level.commsFactor) / dataRate)`. Weak antennas lose un-transmitted science.

### Crew & Launch Coupling (`crewView.js`, `flightView.js`)
- **Crew Roster:** 17 selectable animal astronauts across 8 roles and 9 species (`data/crew.json`), converted to 40x40 PICO-8 sprites (`js/views/animals.js`).
- **How Ship Stats Affect Launch (`js/views/flightView.js`):**
  - Weight ratio `load = totalMass / rocketCapacity` narrows the Max Q green zone (`qHalf = 0.17 - 0.07 * load`) and reduces climb speed (`climb = 1.15 - 0.4 * load`).
  - Propulsion tier (`1..3`) widens the orbital burn target (`ringTol = 3 | 4.5 | 6`); shielding lowers hull damage from a rough launch.

### Mission Events, Repairs & STS-125 (`missionEngine.js`, `missionView.js`)
- **STS-125 Objectives (Mission 1):** 6 scheduled objectives open 5 embedded minigames (`?embed=1`):
  - `hubble_capture` -> `sts125-captura`
  - `hubble_camera` -> `sts125-camara`
  - `hubble_gyros` -> `sts125-giroscopios`
  - `hubble_stis` -> `sts125-espectrografo`
  - `hubble_release` -> `sts125-adios?part=release`
  - `hubble_landing` -> `sts125-adios?part=land`
- **Ship Repairs (`js/views/repairGame.js`):** 10 failure events in `data/events.json` trigger 4 one-button games (`aim`, `charge`, `tap`, `patch`).
- **Dispatch Events (`calcChance` in `js/missionEngine.js`):**
  - `chance = clamp(78 - 8*deficit + min(6, floor(excess/2)) + 8*specialist - round(avgFatigue*0.25) + componentMods, 5, 95)`
  - Teams of 2 (`MAX_TEAM = 2`) use the best stat per axis and finish 20% faster (`0.8x`). Crew at `>= 80%` fatigue work 50% slower (`1.5x`).
  - Temporary failure states: `blackout` (console locked, 0 power, work frozen), `commsDown`, `sensorsDown`, `crewOut`, and `fatigueAll`.
  - Reaching `0` ship integrity aborts the mission immediately with grade `F`.

### Final Report Scoring (`js/report.js`)
- **100-Point Breakdown:** Main Objectives **35**, Science vs. Goal **25**, Final Integrity **15**, Random Events **25**.
- **Grades:** `A >= 85` (3 stars), `B >= 70` (2 stars), `C >= 55` (2 stars), `D >= 40` (1 star), `F < 40` or aborted (0 stars).

## 4. Repository Structure & Balance Bot

```text
LaikaProgram/
├── index.html & css/{style,retro,fixes}.css
├── data/{levels,rockets,components,crew,events,mainEvents}.json
├── js/{main,data,ship,missionEngine,report,i18n,i18n-en,icons,sfx,ui,util,earthMap}.js
├── js/views/{menuView,hangarView,crewView,flightView,missionView,orbitMap,pixelEarth,repairGame,reportView,shipRenderer,animals}.js
├── minigames/sts125/{index.html, shared/, sts125-captura/, sts125-camara/, sts125-giroscopios/, sts125-espectrografo/, sts125-adios/}
├── assets/{fonts/, hubble/, LICENSE-pixelarticons.txt, mission-*.png/.jpg}
├── tools/simulate.mjs
└── Documentos/{01-Analisis-del-Proyecto,02-Guion-Trailer-30s,03-Entrega-Final-NASA-Space-Apps,04-Documentacion-Tecnica-y-Juego}.md
```

- **Run balance simulations:** `node tools/simulate.mjs 200` (or `REACTION=5 node tools/simulate.mjs 300`).
- **Add new content:** Edit `data/*.json` for new components, events, crew members, or levels, and add English translations to `js/i18n-en.js`.
