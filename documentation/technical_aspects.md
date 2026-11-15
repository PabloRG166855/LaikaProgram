# Technical & Game Design Documentation

Technical reference for **Laika Program**, built with pure HTML5, CSS3, and ES module JavaScript (live at `https://laika-program.vercel.app`).

## 1. Running, Hosting & Architecture

The game loads JSON files under `data/` using `fetch()`, so local testing requires an HTTP server:

```bash
python3 -m http.server 8000    # then open http://localhost:8000 (or: npx serve .)
```

**Static Hosting:** Deploy the repository root as-is on **Vercel** (Framework Preset: *Other*, no build command), **GitHub Pages**, or **itch.io** (HTML project).

Code layout:
- `data/*.json`: Mission definitions, rockets, components, crew, random events, and main mission objectives.
- `js/ship.js`, `js/missionEngine.js`, `js/report.js`: Pure simulation logic with zero DOM access.
- `js/views/*`: Screen views, SVG/sprite animals (`animals.js`), custom pixel-art spacecraft & Hubble (`pixelShip.js`, `shipRenderer.js`), rotating Natural Earth sphere (`pixelEarth.js` + `earthMap.js`), orbital map (`orbitMap.js`, `PX = 3`), launch flight game (`flightView.js`), and repair minigames (`repairGame.js`).
- `minigames/sts125/*`: 5 standalone/embedded STS-125 Hubble minigames connected to Mission 1 via `iframe` and `postMessage`.
- `js/i18n.js`, `js/i18n-en.js`, `js/sfx.js`, `css/retro.css`, `css/fixes.css`: Default-English Spanish -> English dictionary translation across the main app and STS-125 minigames, Web Audio chiptune sound effects, and 16-color PICO-8 theme.

## 2. Missions & Rockets (`data/levels.json`, `data/rockets.json`)

| Mission | Destination | Status | Rocket | Payload Cap (`kg`) | Minimum to Launch | Duration | Crew Seats | Science Goal |
|---|---|---|---|---|---|---|---|---|
| **1. Save the Hubble (STS-125)** | `LEO` | **Playable** | Cóndor L | 8,000 | Engine 1 · Shield 1 · Science 50% | 150 s | Commander, Pilot, Specialist | 500 |
| **2. Expedition to the Moon** | `MOON` | Coming soon | Jaguar H | 18,000 | Engine 2 · Shield 1 · Science 50% | 150 s | Commander, Pilot, Science | 600 |
| **3. Crewed mission to Mars** | `MARS` | Coming soon | Titán SH | 30,000 | Engine 3 · Shield 2 · Science 50% | 270 s | Commander, Pilot, Eng, Med, Sci | 1,200 |

*(Additional rocket in `data/rockets.json`: Quetzal M with 22,000 kg LEO / 10,000 kg MOON capacity).*

## 3. Game Rules & Formulas

### Hangar Validation (`js/ship.js`, `js/views/hangarView.js`)
- **Parts Catalog:** 30 components across 10 categories (`data/components.json`): 6 manual categories (**Cabin, Engine, Power, Antenna, Shield, Science instruments**) and 4 automatic internal systems (**Batteries, Life Support, Flight Computer, Attitude Control**).
- **Five Status Bars (`MIN / MAX` Markers):** Launch unlocks once every bar satisfies its threshold:
  1. **Weight (`MAX`):** `totalMass = componentMass + (crewCount * crewMassPerPersonKg) <= rocketCapacity`
  2. **Power (`MIN`):** `powerUse <= powerGen`
  3. **Engine (`MIN`):** `propulsionLevel >= level.minPropulsion`
  4. **Protection (`MIN`):** `shielding >= level.minShielding`
  5. **Science (`MIN`):** `instruments.length >= 1` and `projectedScience >= scienceGoal * minScience`
- **Data Transmission:** `sentFraction = Math.min(1, (comms / level.commsFactor) / dataRate)`. Weak antennas lose un-transmitted science.

### Crew, Briefing & Launch Coupling (`crewView.js`, `flightView.js`)
- **Crew Roster:** 17 selectable animal astronauts across 8 roles and 9 species (`data/crew.json`), converted to 40x40 PICO-8 sprites (`js/views/animals.js`) with **Speed, Analysis, Technical, and Calm** bars and a radar chart on one screen.
- **Mission Briefing Card:** Shows a real NASA photo of the STS-125 *Atlantis* crew (`S125-E-012154`) and May 11, 2009 flight facts before launch.
- **Ascent Physics (`js/views/flightView.js`):**
  - Weight ratio `load = totalMass / rocketCapacity` narrows the Max Q safe throttle band (`qHalf = 0.17 - 0.07 * load`) and reduces climb speed (`climb = 1.15 - 0.4 * load`).
  - Propulsion tier (`1..3`) widens the orbital burn target (`ringTol = 3 | 4.5 | 6`); shielding reduces hull damage from a rough ascent.
  - Live **speed and altitude** HUD tracks ~1,000 km/h at Max Q, ~8,000 km/h at stage separation, and ~27,000 km/h entering orbit.

### Mission Operations, Repairs & STS-125 (`missionEngine.js`, `missionView.js`, `orbitMap.js`)
- **8-Bit Orbital Map (`PX = 3`):** Rotating Earth from Natural Earth (`ne_110m_land`, `pixelEarth.js` + `earthMap.js`), shaded pixel-art player ship and Hubble (`pixelShip.js`), and live orbital speed (~27,300 km/h in LEO).
- **6 Main Objectives via 5 STS-125 Minigames (`?embed=1`):** Each awards a 3-star rating (average of its steps) and quizzes; mission ends on home landing:
  - `hubble_capture` -> `sts125-captura` (chase, photo, Canadarm grapple & bay stow)
  - `hubble_camera` -> `sts125-camara` (stuck bolt, WFPC2 -> WFC3, RGB Butterfly Nebula filters)
  - `hubble_gyros` -> `sts125-giroscopios` (3 gyroscope boxes, battery module inertia, pointing test)
  - `hubble_stis` -> `sts125-espectrografo` (stuck handrail, 111 screws, board swap, H/Na spectral lines)
  - `hubble_release` -> `sts125-adios?part=release` (release & farewell photo)
  - `hubble_landing` -> `sts125-adios?part=land` (*Atlantis* runway landing at Edwards AFB with drag chute)
- **Ship Repairs (`js/views/repairGame.js`):** 10 failure events in `data/events.json` trigger 4 one-button games (`aim`, `charge`, `tap`, `patch`).
- **Crew Dispatch (`calcChance` in `js/missionEngine.js`):**
  - `chance = clamp(78 - 8*deficit + min(6, floor(excess/2)) + 8*specialist - round(avgFatigue*0.25) + componentMods, 5, 95)`
  - Teams of 2 (`MAX_TEAM = 2`) use the best stat per axis and finish 20% faster (`0.8x`); crew at `>= 80%` fatigue work 50% slower (`1.5x`).
  - Temporary states: `blackout` (console locked, 0 power, work frozen), `commsDown`, `sensorsDown`, `crewOut`, and `fatigueAll`. Failure alerts use photosensitivity-safe slow red screen-edge pulses (respecting *reduced motion*).
  - Reaching `0` ship integrity aborts the mission immediately with grade `F`.

### Final Report Scoring (`js/report.js`)
- **100-Point Breakdown:** Main Objectives **35**, Science vs. Goal **25**, Final Integrity **15**, Random Events **25**.
- **Grades:** `A >= 85` (3 stars), `B >= 70` (2 stars), `C >= 55` (2 stars), `D >= 40` (1 star), `F < 40` or aborted (0 stars). Displays on one screen with Laika's tip, a real NASA photo card, and *Improve my ship and try again*.

## 4. Repository Structure & Balance Bot

```text
LaikaProgram/
├── index.html & css/{style,retro,fixes}.css
├── data/{levels,rockets,components,crew,events,mainEvents}.json
├── js/{main,data,ship,missionEngine,report,i18n,i18n-en,icons,sfx,ui,util,earthMap}.js
├── js/views/{menuView,hangarView,crewView,flightView,missionView,orbitMap,pixelEarth,pixelShip,repairGame,reportView,shipRenderer,animals}.js
├── minigames/sts125/{index.html, shared/, sts125-captura/, sts125-camara/, sts125-giroscopios/, sts125-espectrografo/, sts125-adios/}
├── assets/{fonts/, hubble/, readme/, LICENSE-pixelarticons.txt, mission-*.png/.jpg, stars-8bit.png}
├── tools/simulate.mjs
├── documentation/{analysis,technical_aspects,pre_final_submission}.md
└── Documentos/{01-Analisis-del-Proyecto,02-Guion-Trailer-30s,03-Entrega-Final-NASA-Space-Apps,04-Documentacion-Tecnica-y-Juego}.md
```

- **Run balance simulations:** `node tools/simulate.mjs 200` (or `REACTION=5 node tools/simulate.mjs 300`).
- **Add new content:** Edit `data/*.json` for new components, events, crew members, or missions, and add matching strings to `js/i18n-en.js`.
