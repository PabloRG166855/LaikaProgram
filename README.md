# 🐕‍🚀 LAIKA PROGRAM — Space Mission Design Game

Prototipo funcional para el NASA Space Apps Challenge 2026 (reto *Space Mission Design Game*).
HTML + CSS + JavaScript puro (módulos ES). Todo el contenido vive en `data/*.json`.

> ⚠️ Los números (masas, costos, stats) son **inventados para que el juego funcione**. Falta reemplazarlos por valores basados en fuentes de NASA (CubeSat 101, MDL, etc.).

Eres **Laika**, directora de vuelo. Tu tripulación son **animales astronautas caricaturescos** inspirados en los animales reales que abrieron el camino al espacio (Belka, Strelka, Ham, Enos, Albert II, Héctor, Félicette, Marfusha, Miss Baker, Able, Gordo, Arabella, Veterok, Ugolyok, Chernushka, Zvezdochka y las tortugas del Zond 5). Los retratos se dibujan en SVG (`js/views/animals.js`) a partir de `species` y `look` en `crew.json`.

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

## Estilo 8 bits
- **Paleta PICO-8** (16 colores), bordes gruesos sin esquinas redondas, sombras duras y botones con bisel. Todo el tema está en `css/retro.css` (se carga después de `style.css`).
- **Fuentes pixeladas incluidas** (funcionan sin internet): *Press Start 2P* para títulos/botones y *VT323* para texto, en `assets/fonts/` (SIL Open Font License).
- **Íconos pixel art:** [Pixelarticons](https://pixelarticons.com) (MIT, `assets/LICENSE-pixelarticons.txt`) + 6 íconos propios (cohete, satélite, órbita, montaña, antena y telescopio) en `js/icons.js`.
- **Pixelado real:** el mapa y el hangar se dibujan a 1/3 de resolución y se agrandan sin suavizado; los animales se convierten en sprites de 40×40 con la paleta PICO-8 al iniciar (`prepareSprites` en `js/views/animals.js`); las imágenes de misión tienen versión `*-8bit.png`.
- **Medidores por bloques** en el HUD (8 bloques) y barras segmentadas.
- **Sonido chiptune** con Web Audio (`js/sfx.js`), sin archivos de audio. Botón de silencio en la esquina superior derecha.

## Versión demo (UX para todo público)
- **Una misión jugable:** Expedición a la Luna (2:30 min, 5 objetivos). Las otras dos aparecen como "Próximamente" (`"playable"` en `levels.json`).
- **Pocos números y poco texto:** barras y medidores que se llenan, íconos pixel art, sin emojis en la interfaz.
- **Hangar a pantalla completa** (`js/views/hangarView.js`): la nave se ve al centro (tamaño ajustado para no tapar paneles); tocas una parte (botones sobre la nave) o una pestaña de abajo y eliges la pieza.
- **Laika te guía:** a la izquierda, Laika explica en un globo de diálogo para qué sirve cada parte de la nave (al tocar una pestaña) y qué te da cada pieza (al pasar el mouse o elegirla). Los textos están en `components.json` (`laika` por categoría y `guide`).
- **Presupuesto simple:** no hay cifras de dinero. Cada pieza muestra un ícono de precio con 1 a 4 barritas, y arriba a la izquierda hay un medidor de presupuesto de 12 bloques que baja al comprar. Las piezas que ya no alcanzas salen grises con "Muy caro". La tripulación es gratis: el presupuesto solo sirve para construir la nave (Luna: 1300). Las piezas internas (baterías, aire, computadora, orientación) se eligen solas (`"auto": true` en la categoría). Cada barra tiene un "?" que la explica al tocarlo.
- **Tripulación** (`js/views/crewView.js`): un asiento por puesto, retratos grandes, barras de habilidad sin números y gráfica radar del equipo.
- **Misión a pantalla completa** (`js/views/missionView.js`): el mapa ocupa todo; arriba, anillos (nave, energía, aire, ciencia) y la barra del viaje con los objetivos; abajo, la tripulación con anillo de cansancio.
- **Ventana de evento:** forma amarilla (lo que pide) vs. forma azul (tu equipo), posibilidad de éxito en palabras (Alta / Media / Baja).

## Loop del juego

1. **Menú**: 3 niveles.
   | Nivel | Destino | Presupuesto | Puestos de tripulación | Objetivos principales |
   |---|---|---|---|---|
   | Fácil | Órbita baja | $1,000 M | Comandante, Ingeniería | Acoplamiento → Experimento → Caminata espacial → Reentrada |
   | Medio | Luna | $1,200 M | Comandante, Piloto, Ciencia | Encendido → Órbita lunar → Descenso → Caminata lunar → Despegue |
   | Difícil | Marte | $2,300 M | Comandante, Piloto, Ingeniería, Médico, Ciencia | Inyección → Corrección → Entrada → Aterrizaje → Exploración → Regreso |
2. **Diseño**: eliges los componentes de la nave (estructura, propulsión, energía, baterías, soporte vital, comunicaciones, computadora, orientación, blindaje e instrumentos), el cohete y la tripulación. **La nave se dibuja en vivo**: cada componente tiene su propio aspecto y destella al instalarse. Las stats se actualizan en vivo y el botón de lanzar se bloquea con explicaciones si algo no cuadra.
   - **Tripulación por puestos**: cada nivel define puestos (`crewSlots` en `levels.json`) y los candidatos se muestran agrupados por rol, con barras de habilidades, en qué destacan y en qué eventos son clave.
3. **Vuelo a la órbita** (`js/views/flightView.js`): minijuego de un botón, adaptado del prototipo DART del equipo. Flujo: armas la nave → la vuelas → llegas al espacio → entras en órbita → empieza la misión.
   - **Despegue:** cuenta regresiva; mantén ESPACIO o el clic para dar potencia y deja la aguja en la zona verde. En **Max Q** hay que bajar la potencia.
   - **Separación:** suelta la primera etapa cuando el anillo toque el círculo verde. Se abre la cofia y aparece **tu nave tal como la armaste**.
   - **Órbita:** sobre la Tierra, enciende tu motor cuando el anillo toque el verde para quedarte en órbita.
   - **La construcción importa:** si la nave pesa mucho para el cohete, la zona verde es más chica y sube más lento; un mejor motor agranda el blanco de la órbita; el escudo reduce el daño de un vuelo movido.
   - Cada fase da 1–3 estrellas. Un mal vuelo hace que la misión empiece con menos vida (máx. −17, menos con escudo). El reporte final muestra la barra "Despegue". Hay botón "Saltar".
4. **Misión**: hay tres tipos de eventos:
   - **Reparaciones con minijuego** (`js/views/repairGame.js`, campo `minigame` en `events.json`): cuando falla una parte de la nave (antena, energía, filtro de CO₂, computadora, casco, válvula…), la reparas tú con un minijuego de un botón, adaptado de los minijuegos STS-125 del equipo. En el mapa salen con una llave y la etiqueta "¡REPARA!". Si fallas, bajan los stats (vida de la nave, energía, aire, señal…).
     | Mecánica | Fallas | Cómo se juega |
     |---|---|---|
     | `aim` | Pérdida de señal, Estrella guía, Error en la computadora | Toca cuando la antena/cámara/flecha esté sobre el verde (gana 2 de 3) |
     | `charge` | Falla eléctrica, Baterías en eclipse, Sobrecalentamiento | Mantén presionado y suelta en la zona verde (gana 2 de 3) |
     | `tap` | Filtro de CO₂, Instrumento atascado, Fuga de combustible | Toca muy rápido antes de que se acabe el tiempo |
     | `patch` | Micrometeorito | Suelta el parche justo encima del agujero (gana 2 de 3) |
   - Al elegir tripulante, cada animal muestra sus 4 stats como **números** (verde = alcanza, rojo = le falta).
   - **Objetivos principales** (scripteados en `mainEvents.json`, programados por nivel en `levels.json`): son la columna vertebral de la misión y valen más.
   - **Eventos aleatorios** (`events.json`): fallas, asteroides, señales inesperadas, oportunidades científicas… suman o restan ⭐ puntos.
   - Cada evento aparece **donde ocurre** (`location`): sobre la parte de la nave que falló (`ship` + `part`), en el espacio (`space`, con trayectoria o en un punto como `sun`, `earth`, `station`) o en la superficie (`planet`). La nave orbita lento para que sea fácil tocar los eventos.
   Los eventos tienen temporizador. Tocas el evento, eliges **cómo** resolverlo (2 opciones que usan habilidades distintas) y **quién** lo hace (ves su % de éxito con el desglose). El tripulante queda ocupado y se cansa. Al terminar recibes retroalimentación: qué pasó, efectos y por qué (y consejos si fallaste).
5. **Barra de integridad**: si llega a 0, la misión se aborta, regresas a la Tierra y sacas **F**.
6. **Reporte**: calificación A–F, desglose del puntaje, análisis de causas, consejos, misión real parecida y botón **Rediseñar y relanzar** (conserva tu diseño).

### Fallas con estados temporales (idea tomada del prototipo LaicaPro)
Algunas fallas, si se fallan o se ignoran, dejan a la nave en un estado temporal (efectos en `events.json`):
| Efecto | Qué pasa |
|---|---|
| `"blackout": 10` | ⚫ **Apagón**: energía 0, la consola se bloquea (nadie puede ser asignado), el trabajo en curso se congela y no hay ciencia. |
| `"commsDown": 8` | 📡 **Sin comunicaciones**: los datos generados no llegan a la Tierra (baja el % de datos enviados). |
| `"sensorsDown": 10` | 🔬 **Sensores degradados**: no se genera ciencia ni datos. |
| `"crewOut": 15` | 🤕 Un tripulante al azar queda **fuera de servicio** esos segundos. |
| `"fatigueAll": 22` | Fatiga extra a todo el equipo. |

**Calma y fatiga:** la Calma reduce la fatiga que acumula cada tarea y acelera la recuperación. Con fatiga ≥ 80 % el tripulante queda **Agotado** y sus tareas tardan 50 % más.

### Ventana de evento (estilo Dispatch)
Al tocar un evento se abre una ventana a pantalla completa:
- **Izquierda:** el problema, qué pasa si nadie lo atiende y los **REQUISITOS** (verbos resaltados en el color de cada habilidad + nivel que pide en cada una).
- **Centro:** gráfica radar. La forma **amarilla punteada** es lo que pide el problema; la **cian** es tu equipo. Las puntas en rojo son habilidades que no alcanzan. Debajo, los 2 lugares del equipo, la probabilidad de éxito y los botones CERRAR / ENVIAR A MISIÓN (Esc / Enter).
- **Derecha:** la tripulación. Cada barra de habilidad tiene una **marca amarilla** con lo que pide el problema y en **rojo** lo que le falta. Pasar el mouse muestra su forma en la gráfica; tocar la agrega al equipo (máx. 2).

**Requisitos:** todo problema pide las 4 habilidades. La del primer enfoque es la principal (dificultad + 1), la del segundo la secundaria, una tercera (Calma en emergencias y objetivos, Análisis en oportunidades) pide 4–5 y el resto 2. Medio suma +1 y Difícil +2 a las habilidades que sí pide. Se puede fijar a mano con `"req": {"speed": 7, "analysis": 5, "tech": 3, "calm": 6}`.

**Equipo de 2:** usa la mejor habilidad de cada uno y trabaja 20 % más rápido, pero ambos quedan ocupados. El equipo elige solo su **enfoque** (la opción donde más le sobra habilidad); ese enfoque decide los textos y efectos.

**% de éxito** = `78 − 8 × (puntos de habilidad que faltan) + 1 por cada 2 de sobra (máx. 6) + 8 si hay especialista − fatiga × 0.25 + bonos de componentes`, entre 5 % y 95 %. Constantes en `TUNING` de `js/missionEngine.js`.

### Calificación (100 pts)
Objetivos principales 35 · Ciencia vs. meta 25 · Integridad final 15 · Eventos aleatorios 15 · Presupuesto ahorrado 10.
Los ⭐ puntos de misión (objetivo +100/−40/−80, evento +25/−15/−30, oportunidad +40) son el marcador visible; se pueden sobrescribir con `"points"` en cada resultado.
A ≥ 85, B ≥ 70, C ≥ 55, D ≥ 40, F < 40 **o misión abortada**.

## Arte y estilo
- **Tripulación:** animales astronautas caricaturescos dibujados en SVG por código (`js/views/animals.js`), con escafandra y traje. Especies: perro, chimpancé, mono rhesus, mono ardilla, gata, rata, coneja, araña y tortuga. Para cambiar el aspecto de un personaje edita `species` y `look` (`fur`, `fur2`, `face`, `ears`, `patch`, `eyes`) en `crew.json`. Laika, la jugadora, está en `crew.director`.
- **Fondos de misión** (`assets/mission-leo.jpg`, `mission-lunar.jpg`) tomados del prototipo de nuestro compañero (LaicaPro), comprimidos para web. `assets/mission-mars.jpg` es un placeholder generado: reemplázalo con el mismo nombre.
- Estilo visual (paleta, cuadrícula de telemetría, tipografía monoespaciada) adaptado del mismo prototipo.
- Gráficas de habilidades: RAP ⚡ cian, ANA 🧠 verde, TEC 🔧 ámbar, CAL 🧘 índigo.

## Estructura

```
index.html
css/style.css
data/
  levels.json      niveles: destino, presupuesto, tamaño de tripulación, requisitos, meta científica, ritmo de eventos
  crew.json        roles de astronauta + 10 candidatos (stats tech/analysis/speed/calm, costo)
  components.json  categorías (con texto educativo) y componentes
  rockets.json     cohetes: capacidad por destino, costo, confiabilidad
  events.json      eventos aleatorios: 2 opciones c/u, ubicación, especialidades, efectos, dato curioso
  mainEvents.json  objetivos principales scripteados (mismo formato + "objective")
js/
  main.js          navegación entre pantallas
  data.js          carga de JSON
  ship.js          LÓGICA: stats de la nave y validaciones (sin DOM)
  missionEngine.js LÓGICA: simulación de la misión (sin DOM)
  report.js        LÓGICA: calificación y análisis de causas (sin DOM)
  util.js, ui.js   utilidades
  views/           pantallas (menú, diseño, lanzamiento, misión, mapa orbital, reporte)
  views/shipRenderer.js  dibuja la nave a partir de sus componentes (se usa en diseño y en el mapa)
tools/simulate.mjs bot que juega cada nivel N veces para revisar el balance
assets/          fondos de misión
```

**Regla de arquitectura:** la lógica (`ship.js`, `missionEngine.js`, `report.js`) no toca el DOM. Las vistas solo leen el estado. Así se puede agregar la vista 3D o el modo cooperativo sin reescribir la lógica.

## Agregar o cambiar contenido (sin tocar código)

- **Componente nuevo**: agrégalo en `components.json` con `category`, `mass`, `cost` y lo que aplique: `powerGen`, `powerUse`, `crewMax`, `propulsion`, `lifeSupport`, `comms`, `shielding`, `science`, `data`, `batteryMult`, `drainMult`, `destinations` (si solo sirve en ciertos destinos), `eventMods` (bono de % contra un evento) y `eventWeights` (hace un evento más o menos frecuente).
- **Evento nuevo**: copia uno de `events.json` (o de `mainEvents.json` y agrégalo a `mainEvents` del nivel con su segundo `at`). Ubicación: `"location": {"type": "ship", "part": "power|battery|comms|computer|engine|hull|cabin|life_support|instruments"}`, `{"type": "space", "trajectory": true}`, `{"type": "space", "spot": "sun|earth|station"}` o `{"type": "planet"}`. Efectos posibles: `integrity`, `power`, `life`, `science`, `data`, `fatigueAll`. Opcionales: `destinations`, `destWeight`, `maxPerMission`, `positive`, `destDifficulty`.
- **Astronauta nuevo**: agrégalo en `crew.json` usando uno de los roles existentes.
- **Componente con aspecto nuevo**: además del JSON, agrega su dibujo en `js/views/shipRenderer.js` (si no, se verá como la versión básica de su categoría).

## Probar el balance

```bash
node tools/simulate.mjs 300            # bot rápido
REACTION=5 node tools/simulate.mjs 300 # bot más lento (más parecido a una persona)
```

## Siguientes pasos (nice to have)

- **Modo cooperativo local** (de 1 a 4 jugadores): cada jugador toma un segmento en el diseño y controla a sus tripulantes en la misión.
- **Vista 3D** opcional con Three.js, alternando con el mapa 2D.
- Reemplazar los datos inventados por valores reales de NASA.
- Arte (Kenney), sonidos y tutorial guiado.

## Misión 1: Salva el Hubble (STS-125, mayo de 2009)

Vuelas alrededor de la Tierra hasta el Hubble. **Los 5 objetivos principales son los minijuegos STS-125 del equipo, tal cual**, con sus fotos reales, fichas NASA, preguntas, álbum y fuentes. Se juegan dentro de la misión (la misión se pausa mientras juegas):

| Objetivo | Minijuego del equipo (`minigames/sts125/`) |
|---|---|
| Atrapa el Hubble | `sts125-captura` |
| Cámara nueva (1.ª caminata) | `sts125-camara` |
| Giroscopios (2.ª caminata) | `sts125-giroscopios` |
| Reparar el STIS (4.ª caminata) | `sts125-espectrografo` |
| Suelta el Hubble | `sts125-adios` |

- Se cargan en un iframe con `?embed=1`. El único cambio a su código está en `shared/sts125.js` (`makeGame`): al terminar, el juego le avisa a la misión su resultado (estrellas) y el enlace "Menú" se convierte en **"Volver a la misión"**. Fuera de la misión funcionan exactamente igual que antes (`minigames/sts125/index.html`).
- Terminar el minijuego cumple el objetivo; con muchas estrellas ganas puntos extra. El botón "Salir (seguir después)" deja el objetivo pendiente en el mapa.
- Las **fallas de la nave** (antena, energía, filtro de CO₂, etc.) siguen siendo minijuegos cortos de reparación (`js/views/repairGame.js`); las emergencias de tripulación se resuelven enviando astronautas.

## Sin presupuesto: peso y energía

- Ya no hay dinero ni precios. Cada misión trae su propio cohete (`rocketId` en `levels.json`: Hubble → Cóndor L, 8,000 kg; Luna → Jaguar H; Marte → Titán SH).
- Armas la nave cuidando dos cosas: que **no pese más de lo que levanta el cohete** y que tenga **energía suficiente**. El peso además cambia la dificultad del despegue.

## Pantalla

- Sin barra superior: solo el botón de sonido en la esquina superior izquierda.
- En la misión, la barra de objetivos va arriba a lo largo (delgada) y los indicadores (Nave, Energía, Aire, Ciencia) van chicos en una columna a la derecha, fuera del mapa.

## Despegue con Laika

En la pantalla de despegue, Laika explica cada paso en la esquina inferior derecha (peso, motor, escudo, Max Q, separación, órbita), y el botón **¡Despegar!** queda en el centro.
