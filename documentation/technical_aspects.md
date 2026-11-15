# Technical & Game Documentation — LAIKA PROGRAM

Quick, accurate technical reference for **LAIKA PROGRAM** (*HTML5 + CSS3 + ES Modules*, zero runtime dependencies).

---

## 1. Quick Start & Architecture

Must run over HTTP because `js/data.js` loads `data/*.json` via `fetch()`:

```bash
npx serve .                  # or: python3 -m http.server 8000
```

```text
data/*.json ──▶ Pure Logic (no DOM)           ──▶ Views (DOM + Canvas PX=3)
                ├─ js/ship.js                     ├─ menuView / hangarView / crewView
                ├─ js/missionEngine.js            ├─ flightView / missionView / orbitMap
                └─ js/report.js                   ├─ repairGame / reportView / animals
                                                  └─ minigames/sts125/* (iframe + postMessage)
Cross-cutting: js/i18n.js + i18n-en.js (EN|ES) · js/sfx.js (Web Audio) · css/retro.css (PICO-8)
```

---

## 2. Missions & Launch Vehicles (`levels.json`, `rockets.json`)

| Level | Mission | Dest. | Status | Rocket | Cap (`kg`) | Duration | Crew Slots | Science Goal |
|---|---|---|---|---|---|---|---|---|
| `easy` | **Save the Hubble (STS-125)** | `LEO` | **Playable** | Cóndor L | 8,000 | 150 s | Cmd, Pilot, Specialist | 500 |
| `medium` | **Lunar Expedition (Artemis)** | `MOON` | **Playable** | Jaguar H | 18,000 | 150 s | Cmd, Pilot, Science | 600 |
| `hard` | **Crewed Mission to Mars** | `MARS` | Coming Soon | Titán SH | 30,000 | 270 s | Cmd, Pilot, Eng, Med, Sci | 1,200 |

*(Also defined in `rockets.json`: Quetzal M — 22,000 kg LEO / 10,000 kg MOON).*

---

## 3. Core Mechanics & Exact Formulas

### A. Hangar Validation (`js/ship.js` — Weight & Power, No Money)
- **Catalog:** 30 components across 10 categories (6 player-picked: `structure`, `propulsion`, `power`, `comms`, `shielding`, `instruments`; 4 auto-configured: `battery`, `life_support`, `computer`, `attitude`).
- **Launch Blockers:**
  1. `totalMass = componentMass + (crewCount * crewMassPerPersonKg) <= rocketCapacity`
  2. `powerUse <= powerGen`
  3. `propulsionLevel >= level.minPropulsion` and `shielding >= level.minShielding`
  4. `instruments.length >= 1` and `projectedScience >= scienceGoal * minScience`
- **Telemetry Efficiency:** `sentFraction = Math.min(1, (comms / level.commsFactor) / dataRate)`. Weak antennas lose un-transmitted science.

### B. Crew & Coupled Launch Physics (`crewView.js`, `flightView.js`)
- **Roster:** 17 selectable animal pioneers across 8 roles & 9 species (`crew.json`), rendered to 40×40 PICO-8 sprites (`animals.js`).
- **Build-to-Flight Coupling (`flightView.js`):**
  - Payload ratio `load = totalMass / rocketCapacity` shrinks Max Q window (`qHalf = 0.17 - 0.07 * load`) and climb rate (`climb = 1.15 - 0.4 * load`).
  - Engine tier (`1..3`) widens orbital capture target (`ringTol = 3 | 4.5 | 6`); shielding mitigates ascent anomaly damage.

### C. Mission Events, Repairs & STS-125 (`missionEngine.js`, `missionView.js`)
- **STS-125 Main Objectives (Mission 1):** 6 timeline milestones launch 5 embedded minigames via `?embed=1`:
  - `hubble_capture` → `sts125-captura` | `hubble_camera` → `sts125-camara` | `hubble_gyros` → `sts125-giroscopios`
  - `hubble_stis` → `sts125-espectrografo` | `hubble_release` → `sts125-adios?part=release` | `hubble_landing` → `sts125-adios?part=land`
- **Ship Repairs (`repairGame.js`):** 10 hardware events in `events.json` use 4 one-button games (`aim`, `charge`, `tap`, `patch`).
- **Dispatch Crises (`calcChance` in `missionEngine.js`):**
  - `chance = clamp(78 - 8*deficit + min(6, floor(excess/2)) + 8*specialist - round(avgFatigue*0.25) + componentMods, 5, 95)`
  - **Team of 2 (`MAX_TEAM = 2`):** Uses max stat per axis and finishes **20% faster** (`0.8x`). **Fatigue >= 80%** slows tasks by **50%** (`1.5x`).
  - **Temporary States:** `blackout` (console locked, 0 power, work frozen), `commsDown`, `sensorsDown`, `crewOut`, `fatigueAll`.
  - **Abort:** `integrity <= 0` ends the mission immediately with grade `F`.

### D. Final Report Scoring (`js/report.js`)
- **100-Point Split:** Main Objectives **35** · Science vs. Goal **25** · Final Integrity **15** · Random Events **25**.
- **Grades:** `A >= 85` (3★) · `B >= 70` (2★) · `C >= 55` (2★) · `D >= 40` (1★) · `F < 40` or aborted (0★).

---

## 4. Repository Map & Balance Simulator

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

- **Run Balance Bot:** `node tools/simulate.mjs 200` (or `REACTION=5 node tools/simulate.mjs 300`).
- **Extend Content (No Code):** Edit `data/*.json` for new components, events, crew, or levels, and add English strings to `js/i18n-en.js`.
