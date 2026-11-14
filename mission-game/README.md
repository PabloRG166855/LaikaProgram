# 🚀 Director de Misión — Space Mission Design Game

Prototipo funcional para el NASA Space Apps Challenge 2026 (reto *Space Mission Design Game*).
HTML + CSS + JavaScript puro (módulos ES). Todo el contenido vive en `data/*.json`.

> ⚠️ Los números (masas, costos, stats) son **inventados para que el juego funcione**. Falta reemplazarlos por valores basados en fuentes de NASA (CubeSat 101, MDL, etc.).

## Cómo correrlo

El juego carga JSON con `fetch`, así que **necesita un servidor local** (no funciona con doble clic en `index.html`):

```bash
# opción 1
npx serve .
# opción 2
python -m http.server 8000
# opción 3: extensión "Live Server" de VS Code
```

Para publicarlo: súbelo tal cual a GitHub Pages o itch.io (proyecto HTML).

## Loop del juego

1. **Menú**: 3 niveles.
   | Nivel | Destino | Presupuesto | Tripulación | Particularidades |
   |---|---|---|---|---|
   | Fácil | Órbita baja | $1,000 M | Comandante, Ingeniero(a) de vuelo | 4 objetivos; el tiempo se pausa al decidir |
   | Medio | Luna | $1,200 M | Comandante, Piloto, Científico(a) | 5 objetivos; propulsión 2 y blindaje 1 |
   | Difícil | Marte | $2,300 M | Comandante, Piloto, Oficial médico, Ingeniero(a), Científico(a) | 6 objetivos; propulsión 3, blindaje 2, comunicaciones lentas |
2. **Diseño**: eliges los componentes de la nave (estructura, propulsión, energía, baterías, soporte vital, comunicaciones, computadora, orientación, blindaje e instrumentos) y el cohete. **Cada pieza se dibuja en la nave** (`js/shipArt.js`) y aparece con una animación al instalarla; al pasar el mouse sobre una tarjeta se ilumina su pieza.
   **Tripulación por puestos**: cada nivel pide puestos concretos (`crewSlots`). Los astronautas están divididos por rol (pestañas) y hay 3 por rol: novato(a), experimentado(a) y veterano(a), con precios distintos para decidir según el presupuesto. Sus stats se ven como barras con descripción.
   Las stats se actualizan en vivo y el botón de lanzar se bloquea con explicaciones si algo no cuadra (masa, energía, presupuesto, puestos vacíos, plazas, soporte vital, empuje o blindaje).
3. **Lanzamiento**: animación corta. Un cohete poco confiable puede causar una anomalía (−15 integridad).
4. **Misión**: hay dos tipos de eventos:
   - **Objetivos principales** (guion del nivel, `script` en `levels.json`): aparecen siempre a su hora y se ven en la línea de tiempo de arriba. Valen 30 pts de la calificación repartidos entre ellos.
   - **Imprevistos aleatorios**: fallas, asteroides, señales desconocidas, etc. Suman o restan puntos (éxito +3/+4, falla −2, sin atender −4/−1 por defecto).

   Cada evento aparece **donde ocurre**: sobre la pieza dañada de la nave (`location: "ship"` + `part`), en el espacio (`"space"`, las amenazas con `threat` se acercan a la nave), en el planeta (`"planet"`) o junto a la Tierra (`"earth"`). La nave orbita despacio para que sea fácil tocar sus eventos.
   Tocas el evento, Tocas el evento, eliges **cómo** resolverlo (2 opciones que usan habilidades distintas) y **quién** lo hace (ves su % de éxito con el desglose). El tripulante queda ocupado y se cansa. Al terminar recibes retroalimentación: qué pasó, efectos y por qué (y consejos si fallaste).
5. **Barra de integridad**: si llega a 0, la misión se aborta, regresas a la Tierra y sacas **F**.
6. **Reporte**: calificación A–F, desglose del puntaje, análisis de causas, consejos, misión real parecida y botón **Rediseñar y relanzar** (conserva tu diseño).

### Cálculo del % de éxito
`50 + (stat − dificultad) × 8 + 20 si es especialista − fatiga × 0.25 + bonos de componentes`, limitado entre 5 % y 95 %.
La dificultad sube +1 en Medio y +2 en Difícil.

### Calificación (100 pts)
Objetivos principales 30 · Ciencia vs. meta 30 · Integridad final 20 · Imprevistos ±10 (puntos netos, pueden restar) · Presupuesto ahorrado 10.
El puntaje se ve en vivo durante la misión.
A ≥ 85, B ≥ 70, C ≥ 55, D ≥ 40, F < 40 **o misión abortada**.

## Estructura

```
index.html
css/style.css
data/
  levels.json      niveles: destino, presupuesto, puestos de tripulación (crewSlots), guion de objetivos (script), meta científica, ritmo de eventos
  crew.json        roles de astronauta + 24 candidatos (3 por rol: tier rookie/regular/veteran, stats tech/analysis/speed/calm, costo)
  components.json  categorías (con texto educativo) y componentes
  rockets.json     cohetes: capacidad por destino, costo, confiabilidad
  events.json      eventos: principales ("main": true) y aleatorios; 2 opciones c/u, ubicación, efectos, puntos, dato curioso
js/
  main.js          navegación entre pantallas
  data.js          carga de JSON
  ship.js          LÓGICA: stats de la nave y validaciones (sin DOM)
  shipArt.js       dibujo SVG de la nave a partir de sus componentes (sin DOM; se usa en el diseño y en el mapa)
  missionEngine.js LÓGICA: simulación de la misión (sin DOM)
  report.js        LÓGICA: calificación y análisis de causas (sin DOM)
  util.js, ui.js   utilidades
  views/           pantallas (menú, diseño, lanzamiento, misión, mapa orbital, reporte)
tools/simulate.mjs bot que juega cada nivel N veces para revisar el balance
```

**Regla de arquitectura:** la lógica (`ship.js`, `missionEngine.js`, `report.js`) no toca el DOM. Las vistas solo leen el estado. Así se puede agregar la vista 3D o el modo cooperativo sin reescribir la lógica.

## Agregar o cambiar contenido (sin tocar código)

- **Componente nuevo**: agrégalo en `components.json` con `category`, `mass`, `cost`, `art` (cómo se dibuja: p. ej. `panels-small`, `rtg`, `dish`, `laser`, `camera`, `drill`…) y lo que aplique: `powerGen`, `powerUse`, `crewMax`, `propulsion`, `lifeSupport`, `comms`, `shielding`, `science`, `data`, `batteryMult`, `drainMult`, `destinations` (si solo sirve en ciertos destinos), `eventMods` (bono de % contra un evento) y `eventWeights` (hace un evento más o menos frecuente).
- **Evento nuevo**: copia uno de `events.json`. Efectos posibles: `integrity`, `power`, `life`, `science`, `data`, `fatigueAll`. Ubicación: `location` (`ship`/`space`/`planet`/`earth`) y `part` (categoría de la pieza, si es en la nave). Opcionales: `destinations`, `destWeight`, `maxPerMission`, `positive`, `threat`, `points` (`{ success, fail, ignored }`), `destDifficulty`.
- **Objetivo principal nuevo**: crea el evento con `"main": true` y un `short` (nombre corto para la línea de tiempo), y agrégalo al `script` del nivel con su segundo `at`.
- **Astronauta nuevo**: agrégalo en `crew.json` usando uno de los roles existentes y un `tier`.
- **Puestos de un nivel**: en `crewSlots`, cada puesto es `{ "roles": [...] }` (opcional `label`, p. ej. "Científico(a)" para aceptar varios roles).

## Probar el balance

```bash
node tools/simulate.mjs 300            # bot rápido (atiende primero los objetivos principales)
REACTION=5 node tools/simulate.mjs 300 # bot más lento (más parecido a una persona)
```

## Siguientes pasos (nice to have)

- **Modo cooperativo local** (de 1 a 4 jugadores): cada jugador toma un segmento en el diseño y controla a sus tripulantes en la misión.
- **Vista 3D** opcional con Three.js, alternando con el mapa 2D.
- Reemplazar los datos inventados por valores reales de NASA.
- Arte (Kenney), sonidos y tutorial guiado.
