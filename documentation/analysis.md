# Project Overview: Laika Program

Summary of **Laika Program**, how it fits the **NASA Space Apps Challenge** (*Space Mission Design Game / Mission Astronaut*), and how the repository is organized.

## What It Is

**Laika Program** is a browser-based 8-bit space mission game written in pure HTML5, CSS3, and JavaScript (ES modules) with no external libraries or build step, live at `https://laika-program.vercel.app`. You play as **Laika**, Flight Director, guiding **17 animal astronauts** across **8 roles** and **9 species** through **Mission 1: Save the Hubble (STS-125)**, while expeditions to the **Moon** and **Mars** appear on the start menu as **Coming soon**.

Game flow:
`Briefing Card -> Hangar (6 Categories, 5 MIN/MAX Bars) -> Crew (17 Pioneers) -> Launch (Max Q, Live Speed/Alt) -> Mission Operations (6 STS-125 Objectives, Repairs & Dispatch) -> Final Report (A-F)`

## Challenge Alignment

| Criterion | How the Game Addresses It |
|---|---|
| **Relevance** | Focuses directly on mission planning and astronaut operations: payload mass vs. the Cóndor L rocket capacity (8,000 kg), power generation vs. draw, minimum Engine 1 and Shield 1 requirements, 50% minimum science, and antenna throughput (`js/ship.js`). |
| **Creativity** | Laika guides the player at every step alongside 17 historical animal astronauts rendered from SVG to 40x40 PICO-8 sprites (`js/views/animals.js`), using `MIN / MAX` status bars, skill radar charts, and custom pixel-art spacecraft (`js/views/pixelShip.js`). |
| **Scientific & Historical Validity** | **Save the Hubble (STS-125)** embeds 5 interactive EVA minigames (`minigames/sts125/`) with real *Atlantis* crew info, May 2009 dates, 3-star ratings, quizzes, and NASA/ESA photos over a rotating Earth built from Natural Earth contours (`js/earthMap.js`). Launch physics couple ship weight, engine tier, and shielding to Max Q and orbital insertion (`js/views/flightView.js`). |
| **Accessibility & Impact** | Runs on any modern browser (`https://laika-program.vercel.app`), starts in English by default with live `EN | ES` switching (`js/i18n.js`, `js/i18n-en.js`), bundles offline pixel fonts (`assets/fonts/`), uses photosensitivity-safe alerts respecting *reduced motion*, and generates Web Audio chiptune sound effects (`js/sfx.js`). |
| **Code & Presentation** | Keeps simulation logic (`js/ship.js`, `js/missionEngine.js`, `js/report.js`) separate from DOM/canvas views (`js/views/*`), rendered at 1/3 resolution (`PX = 3`) in a 16-color PICO-8 palette. |

## Main Modules

| Layer | Files | Responsibility |
|---|---|---|
| **Game Data** | `data/*.json` | 1 playable mission (`Save the Hubble / STS-125`) + 2 *Coming soon* missions (Moon, Mars), 4 rockets, 30 components (10 categories), 17 crew members + Laika, 20 random events, and main mission objectives. |
| **Simulation Logic** | `js/ship.js`, `js/missionEngine.js`, `js/report.js` | Pure JS validation, real-time mission ticks, Dispatch success math, and 100-point final grading. |
| **Launch & Repairs** | `js/views/flightView.js`, `js/views/repairGame.js` | One-button launch sequence (live speed/altitude readout, Max Q, staging, fairing reveal) and 4 repair mechanics (`aim`, `charge`, `tap`, `patch`). |
| **Orbital Map & Pixel Art** | `js/views/orbitMap.js`, `js/views/pixelEarth.js`, `js/earthMap.js`, `js/views/pixelShip.js`, `js/views/shipRenderer.js` | Rotating pixel Earth (Natural Earth), shaded pixel-art player ship and Hubble, white orbit path, and live orbital speed (~27,300 km/h in LEO). |
| **STS-125 Minigames** | `minigames/sts125/*` | 5 historical Hubble servicing minigames embedded inside Mission 1 via `iframe` and `postMessage` (3-star ratings + quizzes), ending with landing *Atlantis* at Edwards AFB. |
| **Balance Testing** | `tools/simulate.mjs` | Node.js Monte Carlo simulator for mission win rates and grades (`REACTION=5 node tools/simulate.mjs 300`). |
