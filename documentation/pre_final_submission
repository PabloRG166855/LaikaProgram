# Final Submission Copy — NASA Space Apps Portal

Ready-to-paste English copy mapped directly to the **NASA Space Apps Project Submission Guide** (`spaceappschallenge.org/resources/project-submission-guide/`). Replace bracketed placeholders (`[...]`) before submitting.

---

## 1. Project Name
`Laika Program`

*(Short tagline: `8-bit space mission design game: build your craft, launch through Max Q, and save the Hubble!`)*

---

## 2. High-Level Project Summary
*(Answers **What**, **How**, and **Why**)*

We built **Laika Program**, a zero-install 8-bit browser game where players act as Flight Director alongside Laika and 17 historical animal space pioneers to design, launch, and operate NASA space missions.

It addresses the space mission design and astronaut operations challenge across five connected phases: assembling a spacecraft within rocket mass and solar power limits, matching crew skills to mission roles, piloting a multi-stage rocket through *Max Q*, handling real-time orbital emergencies, and playing five interactive EVA minigames recreating **NASA's STS-125 Hubble Space Telescope Servicing Mission 4** alongside an **Artemis-inspired Lunar South Pole expedition**.

This matters because traditional simulators intimidate newcomers with spreadsheets. By combining real NASA open data, authentic mission photography, visual gauges, and live `EN | ES` language switching, **Laika Program** makes spacecraft systems engineering accessible to students, families, and the public.

---

## 3. Submission Links

- **Link to Project Demo (`<= 30s` video or `<= 7` slides):** `[INSERT PUBLIC / UNLISTED VIDEO OR SLIDES URL]`
- **Link to Final Project (Live Web App):** `[INSERT GITHUB PAGES OR ITCH.IO URL]`
- **Public Source Code Repository:** `[INSERT PUBLIC GITHUB REPO URL]`

---

## 4. Detailed Project Description (Project Details)

### Problem & Solution
Planning a space mission requires balancing coupled trade-offs: more instruments add mass and power draw; weak antennas lose collected science; heavier payloads shrink launch margins. **Laika Program** turns these engineering constraints into immediate visual gameplay without sacrificing real cause-and-effect.

### Five Gameplay Phases
1. **Hangar (`hangarView.js`, `ship.js`):** Players configure 6 visible subsystems (**Structure/Cabin, Propulsion, Power, Communications, Shielding, Instruments**) while 4 internal subsystems auto-configure. Real-time checks enforce rocket payload capacity (*Cóndor L* 8,000 kg, *Jaguar H* 18,000 kg, *Titán SH* 30,000 kg), power balance (`kW`), destination propulsion/shielding minimums, and antenna telemetry throughput (`sentFraction`).
2. **Crew Roster (`crewView.js`, `crew.json`):** Fill mission seats from **17 animal pioneers** across 9 species (Belka, Ham, Félicette, Arabella, Zond 5 tortoises, etc.), procedurally rendered from SVG (`animals.js`) with **Speed, Analysis, Tech, and Calm** skill bars and a live team radar.
3. **Launch & Orbit (`flightView.js`):** Your design changes flight physics—higher mass ratio narrows the **Max Q** safe throttle zone and slows ascent; stronger engines widen the orbital burn target. Fairing separation reveals the exact spacecraft you built.
4. **Mission Operations & STS-125 EVAs (`missionView.js`, `missionEngine.js`, `repairGame.js`, `minigames/sts125/`):**
   - **Mission 1 — Save the Hubble (STS-125, May 2009):** Features an *Atlantis* briefing and 5 embedded EVA minigames (`sts125-captura`, `sts125-camara`, `sts125-giroscopios`, `sts125-espectrografo`, `sts125-adios`) via `iframe` + `postMessage`.
   - **Mission 2 — Lunar Expedition (Artemis):** TLI burn, lunar orbit, landing, moonwalk EVA, and ascent (*Mission 3: Mars* shown as upcoming).
   - **Crises & Repairs:** Hardware failures launch 4 one-button repair games (`aim`, `charge`, `tap`, `patch`); orbital emergencies use a *Dispatch* skill radar (1–2 crew, fatigue, temporary `blackout`, `commsDown`, `sensorsDown`, and `crewOut` states).
5. **Telemetry Report (`report.js`, `reportView.js`):** Grades missions `A–F` across 100 points (**Main Objectives 35 · Science 25 · Integrity 15 · Random Events 25**), diagnoses root causes, shows Laika's tip + real NASA mission card, and lets players **Redesign & Relaunch**.

### Architecture Highlights
- **Pure Vanilla Web Stack:** HTML5 + CSS3 + ES Modules driven by `data/*.json` (zero build steps).
- **Decoupled Simulation:** `ship.js`, `missionEngine.js`, and `report.js` contain zero DOM code.
- **8-Bit Craft & QA:** `PX = 3` pixelated canvas, Web Audio API chiptune SFX (`sfx.js`), live `EN | ES` translation (`i18n.js`), and a Node.js Monte Carlo balance runner (`tools/simulate.mjs`).

---

## 5. NASA Data

- **NASA STS-125 & Hubble Servicing Mission 4 (SM4):** Real *Atlantis* crew roster, EVA logs, WFC3/gyroscope/STIS procedures, and Edwards AFB landing ([STS-125](https://www.nasa.gov/mission/sts-125/), [SM4](https://science.nasa.gov/mission/hubble/observatory/missions-to-hubble/servicing-mission-4/)).
- **NASA Goddard SM4 Archive:** Daily mission logs for Flight Days 3, 4, and 9 ([Day 3](https://asd.gsfc.nasa.gov/archive/sm4/multimedia/gallery10_space-day3.html), [Day 4](https://asd.gsfc.nasa.gov/archive/sm4/multimedia/gallery10_space-day4.html), [Day 9](https://asd.gsfc.nasa.gov/archive/sm4/multimedia/gallery10_space-day9.html)).
- **NASA Hubble Science:** [Hubble 35th Anniversary](https://science.nasa.gov/mission/hubble/overview/hubbles-35th-anniversary) & [One-Gyro Mode](https://science.nasa.gov/mission/hubble/observatory/design/hubble-one-gyro-mode/).
- **NASA Image and Video Library (`images.nasa.gov`):** Public-domain photos (`S125-E`, `STS125-S`, `KSC-2009-3264`) used in briefings, albums, and reports.
- **NASA Artemis & Moon to Mars:** South pole mission architecture, radiation shielding, and deep-space comms constraints.

---

## 6. Space Agency Partner Data & Other References

- **ESA / Hubble:** Post-SM4 astronomical imagery (`heic0910`, Sept 2009 — Butterfly Nebula, Carina Nebula, Stephan's Quintet) via [esahubble.org](https://esahubble.org/news/heic0910/).
- **Canadian Space Agency (CSA):** 15 m Canadarm robotic grapple and release operations during STS-125.
- **Open-Source Assets & Tools:** *Press Start 2P* & *VT323* fonts (SIL OFL 1.1), *Pixelarticons* (MIT, `assets/LICENSE-pixelarticons.txt`), Web Audio API, Node.js.
- **Historical Citations (in `minigames/sts125/`):** Smithsonian NASM (`WFPC2` record `nasm_A20140124000`), Spaceflight Now, Space.com, NBC News, The Register.

---

## 7. Use of Artificial Intelligence (AI) Disclosure

> **[Edit to match the exact AI tools your team used, or state none if unused:]**
>
> "Our team used AI coding assistants (**[insert tool name(s), e.g., Google Antigravity / Gemini]**) to support code refactoring, English/Spanish localization (`js/i18n-en.js`), and drafting documentation/submission text. All game design, simulation logic, pixel rendering, historical STS-125 integration, and balance testing were created and verified by our team."

---

## 8. Pre-Submit Checklist

- [ ] All form text, links, and subtitles are in **English**.
- [ ] Demo is **<= 30 seconds** (video) or **<= 7 slides** (deck).
- [ ] All URLs open publicly in Incognito without login prompts.
- [ ] Original work & AI/Terms checkboxes confirmed on the portal.
