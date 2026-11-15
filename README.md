# LAIKA PROGRAM — Space Mission Design Game

An 8-bit space mission design and astronaut operations game built for the **NASA Space Apps Challenge** (*Space Mission Design Game / Mission Astronaut*). Written in pure **HTML5, CSS3, and JavaScript (ES modules)** with no external libraries or build steps. All missions, rockets, components, crew, and events live in `data/*.json`.

You play as **Laika**, Flight Director, guiding **17 cartoon animal astronauts** across **8 roles** and **9 species** inspired by the real animals that flew to space (Belka, Zvezdochka, Ham, Enos, Strelka, Albert II, Héctor, Félicette, Marfusha, Miss Baker, Arabella, Gordo, Veterok, Zondy/Zond 5 tortoises, Ugolyok, Able, and Chernushka). Crew portraits are drawn in SVG (`js/views/animals.js`) and converted to 40x40 PICO-8 sprites at startup.

> **Language (`EN | ES`):** Starts in **English** by default (`js/i18n.js`, `js/i18n-en.js`) with an `EN | ES` switch shared across the main app and the embedded STS-125 minigames.

---

## How to Run & Publish

The game loads `data/*.json` with `fetch()`, so it needs a local HTTP server (opening `index.html` directly from disk will not work):

```bash
# Option 1 (Node.js)
npx serve .

# Option 2 (Python)
python3 -m http.server 8000

# Option 3: VS Code "Live Server" extension
```

To host it online, upload the repository as-is to **GitHub Pages** or **itch.io** (HTML project).

---

## Missions (`data/levels.json`)

| Mission | Destination | Status | Rocket | Payload Cap | Duration | Crew Slots | Science Goal |
|---|---|---|---|---|---|---|---|
| **1. Save the Hubble (STS-125)** | Low Earth Orbit (`LEO`) | Playable | Cóndor L | 8,000 kg | 150 s | Commander, Pilot, Specialist (EVAs) | 500 |
| **2. Lunar Expedition (Artemis)** | Lunar South Pole (`MOON`) | Playable | Jaguar H | 18,000 kg | 150 s | Commander, Pilot, Science | 600 |
| **3. Crewed Mission to Mars** | Mars (`MARS`) | Coming Soon | Titán SH | 30,000 kg | 270 s | Commander, Pilot, Engineering, Medical, Science | 1,200 |

---

## Gameplay Loop

1. **Hangar (`js/views/hangarView.js`, `js/ship.js`):**
   - Pick parts across **6 manual categories** (Structure/Cabin, Propulsion, Solar Power, Communications, Shielding, Instruments) while 4 internal systems (Batteries, Life Support, Flight Computer, Attitude Control) configure automatically.
   - **Weight & Power (no monetary budget):** Keep total ship + crew mass under your rocket's capacity (`kg`), generate enough power (`kW`), meet minimum propulsion and shielding for the destination, and match your instruments with an antenna strong enough to send the data home.
2. **Crew Selection (`js/views/crewView.js`):**
   - Fill each mission seat using skill bars (**Speed, Analysis, Tech, Calm**), short bios, and a team radar chart.
3. **Launch & Orbit (`js/views/flightView.js`):**
   - One-button ascent minigame (`Space` / click / tap, plus **Skip**). Heavier ships narrow the **Max Q** safe throttle zone and climb slower, stronger engines widen the orbital burn target, and fairing separation shows the exact ship you built.
4. **Mission Operations & STS-125 EVAs (`js/views/missionView.js`, `js/missionEngine.js`, `minigames/sts125/`):**
   - **Mission 1 (STS-125, May 2009):** Includes a real *Atlantis* crew briefing and **5 embedded STS-125 minigames** (`sts125-captura`, `sts125-camara`, `sts125-giroscopios`, `sts125-espectrografo`, `sts125-adios`) for Canadarm capture, WFC3 camera installation, 6 gyroscopes and batteries, STIS repair (111 screws), release, and Edwards AFB landing.
   - **Hardware Repairs (`js/views/repairGame.js`):** 10 ship failures fixed through 4 one-button mechanics (`aim`, `charge`, `tap`, `patch`).
   - **Dispatch Crises (`missionView.js`):** Match 1-2 crew members' cyan skill polygon to the yellow problem profile while managing fatigue and temporary states (`blackout`, `commsDown`, `sensorsDown`, `crewOut`, `fatigueAll`).
5. **Final Report (`js/report.js`, `js/views/reportView.js`):**
   - Graded `A-F` out of 100 points (**Main Objectives 35, Science 25, Ship Integrity 15, Random Events 25**), with root-cause feedback, a tip from Laika, a real NASA mission comparison card, and **Redesign & Relaunch**.

---

## Architecture, 8-Bit Style & Balance Testing

- **Separated Logic & Views:** `js/ship.js`, `js/missionEngine.js`, and `js/report.js` do not touch the DOM; views under `js/views/` read state and draw the UI.
- **8-Bit Rendering & Sound:** 16-color PICO-8 theme (`css/retro.css`), 1/3-resolution pixelated canvas (`PX = 3`), bundled *Press Start 2P* and *VT323* fonts (SIL OFL 1.1), *Pixelarticons* (MIT) + 6 custom icons (`js/icons.js`), and Web Audio chiptune sound effects (`js/sfx.js`).
- **Balance Simulator (`tools/simulate.mjs`):**
  ```bash
  node tools/simulate.mjs 200
  REACTION=5 node tools/simulate.mjs 300
  ```

---

## NASA & Partner Open Data Used

- **NASA STS-125 & Hubble Servicing Mission 4 (SM4):** Real *Atlantis* crew roster, EVA logs, WFC3/STIS/gyroscope tasks, and Hubble 35th Anniversary / one-gyro docs ([STS-125](https://www.nasa.gov/mission/sts-125/), [SM4](https://science.nasa.gov/mission/hubble/observatory/missions-to-hubble/servicing-mission-4/), [NASA Goddard SM4 Archive](https://asd.gsfc.nasa.gov/archive/sm4/multimedia/gallery10_space-day3.html)).
- **NASA Image and Video Library (`images.nasa.gov`):** Public-domain photos (`S125-E`, `STS125-S`, `KSC-2009-3264`) included in `assets/hubble/` and `minigames/sts125/shared/img/`.
- **NASA Artemis & Moon to Mars:** Mission constraints and lunar south pole structure for Mission 2 (Moon) and the upcoming Mars level.
- **Space Agency Partners:** **ESA / Hubble** post-SM4 imagery ([heic0910](https://esahubble.org/news/heic0910/)) and **Canadian Space Agency (CSA)** 15 m Canadarm grapple/release operations.

---

## Project Documentation (`Documentos/`)

- [`Documentos/01-Analisis-del-Proyecto.md`](Documentos/01-Analisis-del-Proyecto.md): Challenge alignment and core system modules.
- [`Documentos/02-Guion-Trailer-30s.md`](Documentos/02-Guion-Trailer-30s.md): 30-second demo video script and 7-slide presentation outline.
- [`Documentos/03-Entrega-Final-NASA-Space-Apps.md`](Documentos/03-Entrega-Final-NASA-Space-Apps.md): NASA Space Apps summary, detailed description, and open-data credits.
- [`Documentos/04-Documentacion-Tecnica-y-Juego.md`](Documentos/04-Documentacion-Tecnica-y-Juego.md): Technical specs, formulas, file tree, and balance simulator guide.
