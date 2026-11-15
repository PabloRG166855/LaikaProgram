#LAIKA PROGRAM — Space Mission Design Game

An 8-bit browser-based space mission design and astronaut operations game created for the **NASA Space Apps Challenge** (*Space Mission Design Game / Mission Astronaut*). Built with pure **HTML5, CSS3, and ES Module JavaScript**—zero runtime dependencies or build tools, with all game content driven by `data/*.json`.

You play as **Laika**, Flight Director of the program, guiding a crew of **17 cartoon animal astronauts** across **8 roles** and **9 species** inspired by real spaceflight pioneers (Belka, Zvezdochka, Ham, Enos, Strelka, Albert II, Héctor, Félicette, Marfusha, Miss Baker, Arabella, Gordo, Veterok, Zondy/Zond 5 tortoises, Ugolyok, Able, and Chernushka). Portraits are procedurally drawn in SVG (`js/views/animals.js`) and quantized into 40×40 PICO-8 sprites at startup.

> **Bilingual (`EN | ES`):** Defaults to **English** (`js/i18n.js`, `js/i18n-en.js`) with an instant in-game `EN | ES` toggle shared across the main app and embedded STS-125 minigames.

---

## How to Run & Deploy

The game loads JSON datasets via `fetch()`, so it must be served over HTTP (double-clicking `index.html` via `file://` will fail due to CORS):

```bash
# Option 1 (Node.js)
npx serve .

# Option 2 (Python)
python3 -m http.server 8000

# Option 3: VS Code "Live Server" extension
```

To publish online, upload the repository as-is to **GitHub Pages** or as an HTML5 project on **itch.io**.

---

## Playable Missions (`data/levels.json`)

| Mission | Destination | Status | Assigned Rocket | Payload Cap | Duration | Crew Slots | Science Goal |
|---|---|---|---|---|---|---|---|
| **1. Save the Hubble (STS-125)** | Low Earth Orbit (`LEO`) | **Playable** | **Cóndor L** | 8,000 kg | 150 s | Commander, Pilot, Specialist (EVAs) | 500 |
| **2. Lunar Expedition (Artemis)** | Lunar South Pole (`MOON`) | **Playable** | **Jaguar H** | 18,000 kg | 150 s | Commander, Pilot, Science | 600 |
| **3. Crewed Mission to Mars** | Mars (`MARS`) | **Coming Soon** | **Titán SH** | 30,000 kg | 270 s | Commander, Pilot, Engineering, Medical, Science | 1,200 |

---

## Gameplay Loop (5 Phases)

1. **Hangar — Spacecraft Design (`js/views/hangarView.js`, `js/ship.js`):**
   - Assemble your ship visually across **6 manual categories** (Structure/Cabin, Propulsion, Power, Communications, Shielding, Instruments) while 4 internal subsystems (Batteries, Life Support, Flight Computer, Attitude Control) auto-configure.
   - **Weight & Power constraints (no money/budgets):** Keep combined ship + crew mass under the assigned rocket's payload limit (`kg`), generate enough solar power (`kW`), meet destination propulsion and shielding minimums, and pair instruments with an antenna strong enough to transmit collected data back to Earth.
2. **Crew Selection (`js/views/crewView.js`):**
   - Assign animal astronauts to each mission slot using skill bars (**Speed, Analysis, Tech, Calm**), historical bios, and a live team radar chart.
3. **Launch & Orbital Insertion (`js/views/flightView.js`):**
   - One-button ascent minigame (`Space` / click / tap, plus **Skip**) coupled directly to your build: heavier ships narrow the **Max Q** throttle window and climb slower, stronger engines enlarge the orbital burn target, and fairing separation reveals **your custom spacecraft**.
4. **Mission Operations & Historical EVAs (`js/views/missionView.js`, `js/missionEngine.js`, `minigames/sts125/`):**
   - **Mission 1 (STS-125, May 2009):** Includes a historical *Atlantis* briefing and **5 embedded STS-125 minigames** (`sts125-captura`, `sts125-camara`, `sts125-giroscopios`, `sts125-espectrografo`, `sts125-adios`) covering Canadarm capture, WFC3 camera swap, 6 gyroscopes & batteries, STIS 111-screw repair, release, and Edwards AFB landing.
   - **Hardware Repairs (`js/views/repairGame.js`):** 10 technical failures solved via 4 one-button mechanics (`aim`, `charge`, `tap`, `patch`).
   - **Dispatch Radar Crises (`missionView.js`):** Match 1–2 crew members' cyan skill polygon to the yellow requirement polygon while managing fatigue and temporary states (`blackout`, `commsDown`, `sensorsDown`, `crewOut`, `fatigueAll`).
5. **Post-Mission Report (`js/report.js`, `js/views/reportView.js`):**
   - 100-point grading (`A–F`: **Main Objectives 35 · Science 25 · Ship Integrity 15 · Random Events 25**), root-cause breakdown, Laika's engineering tip, real NASA mission comparison card, and **Redesign & Relaunch**.

---

## Architecture, 8-Bit Craft & Balance Testing

- **Decoupled Simulation:** Pure DOM-free logic modules (`js/ship.js`, `js/missionEngine.js`, `js/report.js`) power the views (`js/views/*`) and can be tested headless.
- **True 8-Bit Rendering & Audio:** 16-color PICO-8 theme (`css/retro.css`), 1/3-resolution pixelated canvas (`PX = 3` in `hangarView.js` and `orbitMap.js`), bundled *Press Start 2P* & *VT323* fonts (SIL OFL 1.1), *Pixelarticons* (MIT) + 6 custom icons (`js/icons.js`), and procedural Web Audio API chiptune SFX (`js/sfx.js`).
- **Monte Carlo Balance Simulator (`tools/simulate.mjs`):**
  ```bash
  node tools/simulate.mjs 200
  REACTION=5 node tools/simulate.mjs 300
  ```

---

## NASA & Space Agency Partner Open Data Used

- **NASA STS-125 & Hubble Servicing Mission 4 (SM4):** Real *Atlantis* crew roster, EVA logs, WFC3/STIS/gyroscope procedures, and Hubble 35th Anniversary / one-gyro documentation ([STS-125](https://www.nasa.gov/mission/sts-125/), [SM4](https://science.nasa.gov/mission/hubble/observatory/missions-to-hubble/servicing-mission-4/), [NASA Goddard SM4 Archive](https://asd.gsfc.nasa.gov/archive/sm4/multimedia/gallery10_space-day3.html)).
- **NASA Image and Video Library (`images.nasa.gov`):** Public-domain mission photography (`S125-E`, `STS125-S`, `KSC-2009-3264`) bundled in `assets/hubble/` and `minigames/sts125/shared/img/`.
- **NASA Artemis & Moon to Mars Architecture:** Mission trade-offs and south pole exploration structure for Mission 2 (Moon) and the upcoming Mars level.
- **Space Agency Partners:** **ESA / Hubble** post-SM4 first-light observations ([heic0910](https://esahubble.org/news/heic0910/)) and **Canadian Space Agency (CSA)** 15 m Canadarm grapple/release operations.

---

## Project Documentation (`Documentos/`)

Full project analysis, demo scripts, submission copy, and deep technical specs are stored in [`Documentos/`](Documentos/):

- [`Documentos/01-Analisis-del-Proyecto.md`](Documentos/01-Analisis-del-Proyecto.md) — Evaluation against the 5 NASA Space Apps judging criteria & codebase verification matrix.
- [`Documentos/02-Guion-Trailer-30s.md`](Documentos/02-Guion-Trailer-30s.md) — 30-second video demo script & 7-slide deck blueprint.
- [`Documentos/03-Entrega-Final-NASA-Space-Apps.md`](Documentos/03-Entrega-Final-NASA-Space-Apps.md) — Copy-paste-ready form fields for the NASA Space Apps submission portal.
- [`Documentos/04-Documentacion-Tecnica-y-Juego.md`](Documentos/04-Documentacion-Tecnica-y-Juego.md) — Complete technical documentation, formulas, repository tree, and JSON authoring guide.
