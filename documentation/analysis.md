# Project Overview: Laika Program

Summary of **Laika Program**, how it fits the **NASA Space Apps Challenge** (*Space Mission Design Game / Mission Astronaut*), and how the code is organized.

## What It Is

**Laika Program** is a browser-based 8-bit space mission game written in HTML, CSS, and vanilla JavaScript (ES modules), with all content stored in `data/*.json`. You play as Laika, the flight director, designing a spacecraft, picking a crew of historical animal astronauts, flying the launch through Max Q, and running missions based on **STS-125 (Hubble Servicing Mission 4)** and **Artemis**.

Game flow:
`Menu -> Hangar (Weight & Power) -> Crew (17 Pioneers) -> Launch (Max Q) -> Mission (EVAs & Events) -> Report (A-F)`

## Challenge Alignment

| Criterion | How the Game Addresses It |
|---|---|
| **Relevance** | Focuses directly on mission design and astronaut operations: payload mass vs. rocket capacity (`kg`), solar power (`kW`), propulsion tier, radiation shielding, and antenna throughput (`js/ship.js`). |
| **Creativity** | Laika guides the player through each step, paired with 17 animal astronauts across 9 species drawn in SVG (`js/views/animals.js`) and block meters / radar charts instead of dense tables. |
| **Scientific & Historical Validity** | Mission 1 (STS-125) embeds 5 Hubble EVA minigames with real *Atlantis* crew info, dates, and NASA/ESA photos (`minigames/sts125/`). Launch physics couple ship weight, engine tier, and shielding to Max Q and orbital insertion (`js/views/flightView.js`). |
| **Accessibility & Impact** | Runs in any modern browser with no install or build step, supports live `EN | ES` switching (`js/i18n.js`), bundles offline pixel fonts (`assets/fonts/`), and generates chiptune sound effects with Web Audio (`js/sfx.js`). |
| **Code & Presentation** | Keeps simulation logic (`ship.js`, `missionEngine.js`, `report.js`) separate from DOM/canvas views (`js/views/*`), rendered at 1/3 resolution (`PX = 3`) in a PICO-8 palette. |

## Main Modules

| Layer | Files | Responsibility |
|---|---|---|
| **Game Data** | `data/*.json` | 3 levels, 4 rockets, 30 components (10 categories), 17 crew members + Laika, 20 random events, and 21 main objectives. |
| **Simulation Logic** | `js/ship.js`, `js/missionEngine.js`, `js/report.js` | Pure JS validation, real-time mission ticks, success probability math, and 100-point final grading. |
| **Flight & Repairs** | `js/views/flightView.js`, `js/views/repairGame.js` | One-button launch sequence (Max Q, staging, fairing reveal) and 4 quick repair minigames (`aim`, `charge`, `tap`, `patch`). |
| **STS-125 Minigames** | `minigames/sts125/*` | 5 historical Hubble servicing minigames embedded inside Mission 1 via `iframe` and `postMessage`. |
| **Balance Testing** | `tools/simulate.mjs` | Node.js simulation script for testing mission win rates and grades (`REACTION=5 node tools/simulate.mjs 300`). |
