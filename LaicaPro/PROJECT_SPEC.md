# 🚀 NASA Space Apps Challenge 2026: Space Mission Design Game
## Documento Maestro de Especificación Técnica, Diseño de Juego (GDD) y Secuencia de Prompts para Antigravity

---

## 1. Visión General del Proyecto
* **Nombre tentativo:** MDL Dispatch: Space Mission Control
* **Reto oficial:** NASA Space Apps 2026 — *Space Mission Design Game*
* **Plataforma:** Aplicación Web Interactiva 2D (SPA - Single Page Application).
* **Concepto central:** Un juego táctico de estrategia y simulación en 2D inspirado en la mecánica de **Dispatch** (gestión de centro de control aeroespacial, asignación de operadores bajo presión y atención a incidentes en tiempo real), combinado con la **ingeniería de sistemas espaciales de la NASA**.
* **Propósito educativo:** Enseñar de forma práctica cómo el diseño de una misión espacial depende de equilibrios (*trade-offs*) constantes entre ciencia, hardware, presupuesto y capital humano, explicando exactamente **por qué** una misión triunfa o fracasa.

---

## 2. Requisitos Obligatorios del Reto (Checklist para Jueces)
El sistema **debe** incluir de forma visible e interconectada los siguientes 5 pilares exigidos por la NASA:

1. **Flujo de diseño *End-to-End* (Los 4 Segmentos Oficiales de Misión):**
   * **User Segment:** Selección del escenario histórico y objetivos científicos.
   * **Space Segment:** Configuración del chasis de la nave, instrumentos científicos (*payload*), energía y sistemas térmicos/estructurales.
   * **Launch Segment:** Selección del cohete propulsor y trayectoria orbital compatible con la masa total.
   * **Ground Segment:** Contratación de los 4 operadores del *Mission Design Lab (MDL)*, elección de red de antenas terrestres y ejecución de operaciones en tiempo real.
2. **Gestión de las 6 Variables Críticas (Trade-offs en tiempo real):**
   * **Mass (Masa - kg):** Peso acumulado de chasis + subsistemas + instrumentos. No puede superar la capacidad máxima del cohete hacia la órbita elegida.
   * **Power (Energía - W / Batería %):** Generación eléctrica (paneles/RTG) vs. consumo de los instrumentos y antenas.
   * **Budget (Presupuesto - $M USD):** Fondo único compartido entre la **contratación de los 4 miembros del Crew** y la **compra de hardware/cohete**.
   * **Data (Datos - GB / Ciencia):** Información recolectada al completar Misiones Objetivo; genera el puntaje principal.
   * **Communications (Comunicaciones - kbps):** Capacidad de transmitir los datos acumulados a la Tierra antes de saturar el almacenamiento a bordo.
   * **Time (Tiempo - s):** Ventana operativa de la misión y tiempos de respuesta ante eventos críticos.
3. **Sistema de Causa y Efecto (*Trade-offs*):**
   * Invertir más presupuesto en un *Crew* de élite deja menos dinero para hardware (obligando a usar componentes más propensos a emergencias), y viceversa.
   * Instrumentos que generan más *Datos* consumen más *Energía* y agregan más *Masa*.
4. **Reporte Post-Misión Educativo (El "Porqué"):**
   * Al finalizar la partida, el juego no solo dice "Victoria" o "Derrota", sino que entrega un diagnóstico técnico detallando qué decisiones de diseño o despacho causaron el resultado, junto con una tarjeta comparativa de una **misión real de la NASA**.
5. **Integración explícita de los 9 Recursos Oficiales del Reto** (detallados en la Sección 8).

---

## 3. Mecánica Principal: El Sistema "MDL Crew" + Hardware
El jugador recibe un **Presupuesto Total ($ Budget)** según la dificultad elegida y debe dividirlo estratégicamente antes del lanzamiento en dos áreas:

### A. Contratación del Crew (4 Asientos Obligatorios)
El jugador debe contratar a **4 especialistas** para su consola de despacho. Todos los candidatos tienen capacidades generales en las 4 áreas, pero **cada candidato destaca fuertemente en una cualidad principal**:

1. **Matemático (Navegación y Trayectorias - Basado en *GMAT*):**
   * **Rol en consola:** Calcula correcciones de trayectoria, inserciones orbitales y maniobras de evasión.
   * **Impacto:** Resuelve más rápido eventos de asteroides/basura espacial, desvíos orbitales y ventanas de encendido (*burns*), ahorrando propelente (*Masa*).
2. **Científico (Carga Útil y Análisis - Basado en *User Segment & Telescopes Game*):**
   * **Rol en consola:** Opera los instrumentos científicos, calibra sensores ópticos/espectrómetros y analiza muestras.
   * **Impacto:** Completa más rápido las **Misiones Objetivo** y maximiza la recolección de **Datos** y puntos de ciencia.
3. **Tecnología (Sistemas y Hardware - Basado en *MDL & CubeSat 101*):**
   * **Rol en consola:** Administra los subsistemas de la nave (*Power, Thermal, Avionics, Comms*).
   * **Impacto:** Resuelve rápidamente emergencias de sobrecarga de sistemas, cambio de baterías en eclipse, despliegues atascados y cuellos de botella de transmisión.
4. **Calma (Resiliencia Operativa y Manejo de Fatiga - Basado en *MDL Risk & Reliability*):**
   * **Rol en consola:** Determina la capacidad de resistencia al estrés y recuperación de fatiga del especialista.
   * **Impacto:** Mientras un especialista trabaja en una tarea o emergencia, su barra de **Fatiga** aumenta. Una mayor **Calma** reduce drásticamente la acumulación de fatiga y evita el colapso (*burnout*) en momentos de múltiples emergencias simultáneas.

#### Niveles salariales de candidatos (Trade-off de Presupuesto):
* **Tier 1 - Junior ($5M - $8M):** Estadística principal ~65, secundarias ~35-45. Baratos (permiten comprar el mejor cohete y nave), pero lentos en emergencias.
* **Tier 2 - Senior ($12M - $16M):** Estadística principal ~80, secundarias ~50-60. Balanceados.
* **Tier 3 - Veterano / Élite ($22M - $28M):** Estadística principal ~95, secundarias ~65-75. Resuelven crisis en segundos, pero contratar a varios deja al jugador con presupuesto mínimo para el satélite.

### B. Armado de la Nave y Lanzamiento (Hardware)
Con el presupuesto restante tras contratar al Crew, el jugador configura:
1. **Chasis / Plataforma (*CubeSat 101 & MDL*):** Define el límite de espacios de módulos, masa base y resistencia estructural (CubeSat 3U, CubeSat 6U, SmallSat Orbiter, Deep Space Bus).
2. **Instrumentos Científicos (*Payload*):** Otorgan multiplicadores de ciencia y desbloquean Misiones Objetivo compatibles.
3. **Subsistemas de Energía y Comunicaciones:** Paneles solares / Baterías (definen el margen de *Power*) y Antenas Banda S / Banda X / Ka (definen la tasa de *Comms*).
4. **Vehículo de Lanzamiento (Cohete):** Define la **Masa máxima permitida** para la órbita del escenario.

---

## 4. Gameplay en Vivo: Consola 2D Estilo "Dispatch"
Una vez validado el diseño ($\text{Masa} \le \text{Capacidad del Cohete}$, $\text{Energía Generada} \ge \text{Consumo Base}$, $\text{Presupuesto} \ge 0$), inicia la simulación en tiempo real (duración sugerida por partida: 120 a 180 segundos).

### Tipos de Tickets en el Mapa Orbital 2D:

#### 1. Misiones Objetivo (Tickets Azules / Verdes — Suman Puntos)
* Aparecen periódicamente a lo largo de la trayectoria orbital de la nave.
* **Objetivo:** Mientras más misiones objetivo cumpla el jugador antes de que acabe el tiempo, mayor será su **Puntuación Científica** y su calificación final (CML 1 a CML 4).
* **Ejemplos:**
  * *Calibración de Magnetómetro Orbital* (Requiere: **Científico**).
  * *Ventana de Transmisión al Deep Space Network* (Requiere: **Tecnología** $\rightarrow$ Convierte *Datos* acumulados en puntos asegurados).
  * *Ajuste de Perigeo / Maniobra de Observación* (Requiere: **Matemático**).

#### 2. Eventos de Emergencia (Tickets Rojos / Ámbar — Supervivencia)
* Son crisis imprevistas con un temporizador de cuenta regresiva. Si no se resuelven a tiempo, dañan la integridad de la nave o penalizan severamente las 6 variables.
* **Ejemplos obligatorios a implementar:**
  * **Asteroide / Micrometeoroide en trayectoria:** Requiere **Matemático** alto para calcular vector de evasión. *Fallo:* Daño crítico al casco y pérdida de propelente (*Masa*).
  * **Sobrecarga de sistema / Alarma de aviónica:** Requiere **Tecnología** alta. *Fallo:* Corrupción de memoria (pérdida de *Datos*) y caída temporal de *Comunicaciones*.
  * **Cambio de banco de batería (Entrada a eclipse):** Requiere **Tecnología** + **Calma**. *Fallo:* Apagón total (*Power* cae a $0\%$) congelando todas las misiones objetivo durante 10 segundos (*Tiempo* perdido).
  * **Reparación de despliegue / Sobrecalentamiento térmico:** Requiere **Tecnología**. *Fallo:* Desactivación de un instrumento científico.
  * **Anomalía en muestra / Tormenta de radiación solar:** Requiere **Científico** + **Calma**. *Fallo:* Pérdida de puntos de ciencia y aumento masivo de fatiga en el Crew.

---

## 5. Los 3 Niveles de Dificultad (Escenarios Históricos No-Canon)
Cada nivel sitúa al jugador en una época icónica de la exploración espacial. Los eventos y configuraciones son tipo *sandbox* (no estrictamente canon), diseñados para recrear la atmósfera y los retos técnicos de ese momento histórico.

### Nivel 1: FÁCIL — "El Amanecer Orbital" (Inspirado en Explorer 1 / Primeros Satélites)
* **Contexto histórico:** Fines de los años 50 / Era CubeSat moderna. El objetivo es colocar un satélite ligero en **Órbita Baja Terrestre (LEO)** para confirmar y medir los cinturones de radiación de Van Allen.
* **Parámetros del escenario:**
  * **Órbita (GMAT):** LEO (baja latencia de comunicación, bajo requerimiento de cohete).
  * **Presupuesto Inicial:** $90M USD (Holgado para aprender las mecánicas).
  * **Frecuencia de Emergencias:** Baja (1 emergencia a la vez, tiempos de respuesta amplios).
  * **Misión Real de Referencia (Debriefing):** *Explorer 1 / CubeSat CSLI Missions*.

### Nivel 2: MEDIO — "Operación Alunizaje" (Inspirado en Apollo / Lunar Reconnaissance Orbiter)
* **Contexto histórico:** La carrera por la Luna. El jugador debe diseñar y despachar una misión hacia **Órbita de Transferencia Lunar (LTO / LLO)** para mapear zonas de alunizaje, sortear campos de rocas y sobrevivir a los eclipses en el lado oculto de la Luna.
* **Parámetros del escenario:**
  * **Órbita (GMAT):** Lunar Transfer & Low Lunar Orbit. Exige cohete mediano/pesado y antenas de mayor alcance.
  * **Presupuesto Inicial:** $120M USD (Ajustado: exige decidir entre mejor *Crew* o mejor batería/antena).
  * **Frecuencia de Emergencias:** Media (pueden solaparse 1 Misión Objetivo y 2 Emergencias como *Sobrecarga de Computadora 1202*, *Cambio de Batería en Lado Oculto* y *Escombros en Trayectoria*).
  * **Misión Real de Referencia (Debriefing):** *Apollo 11 / Lunar Reconnaissance Orbiter (LRO) / CAPSTONE*.

### Nivel 3: DIFÍCIL — "El Ojo del Espacio Profundo" (Inspirado en Voyager / James Webb en L2)
* **Contexto histórico:** Exploración del espacio profundo en el **Punto de Libración Sol-Tierra L2** (a $1.5 \times 10^6\text{ km}$). Sin posibilidad de rescate físico, con alta latencia de señal y exposición continua a micrometeoroides y tormentas solares.
* **Parámetros del escenario:**
  * **Órbita (GMAT):** Libration Point L2 / Deep Space. Requiere vehículo de lanzamiento pesado, control térmico estricto y antena compatible con *Deep Space Network*.
  * **Presupuesto Inicial:** $150M USD (Altamente restrictivo por el alto costo de las piezas de espacio profundo).
  * **Frecuencia de Emergencias:** Alta (múltiples emergencias simultáneas que ponen al límite la **Calma/Fatiga** de los 4 operadores).
  * **Misión Real de Referencia (Debriefing):** *James Webb Space Telescope (JWST) / Voyager*.

---

## 6. Fórmulas Matemáticas del Motor de Simulación

### 1. Validación Pre-Lanzamiento (Fase Hangar)
Para habilitar el botón `LAUNCH & DISPATCH`, se deben cumplir 4 condiciones:
$$\text{CrewContratado} == 4$$
$$\text{CostoTotal} = \sum \text{CostoCrew} + \sum \text{CostoHardware} \le \text{PresupuestoNivel}$$
$$\text{MasaTotal} = \text{MasaChasis} + \sum \text{MasaModulos} \le \text{CapacidadCohete}(\text{Orbita})$$
$$\text{EnergiaGenerada} \ge \text{ConsumoBaseNave}$$

### 2. Velocidad de Resolución de Tareas y Emergencias (Fase Dispatch)
Cuando un miembro del Crew es asignado a un ticket (Misión Objetivo o Emergencia) cuya cualidad principal requerida es $S_{\text{req}} \in \{\text{Matematico}, \text{Cientifico}, \text{Tecnologia}\}$:

$$\text{ProgresoPorSegundo} = B_{\text{base}} \times \left(1 + \frac{\text{ValorCualidad}(S_{\text{req}})}{50}\right) \times \text{BonoEspecialidad} \times \text{PenalizacionFatiga}$$

* Donde $B_{\text{base}} = 10$ puntos/seg.
* Si $S_{\text{req}}$ es la cualidad más alta del operador, $\text{BonoEspecialidad} = 1.25$ (de lo contrario $1.0$).
* Si el operador tiene $\text{Fatiga} < 80\%$, $\text{PenalizacionFatiga} = 1.0$.
* Si $\text{Fatiga} \ge 80\%$ (Estado *Exhausted*), $\text{PenalizacionFatiga} = 0.4$ (trabaja al $40\%$ de velocidad).

### 3. Acumulación y Recuperación de Fatiga (Cualidad: Calma)
Mientras el operador está asignado a un evento activo:
$$\Delta \text{Fatiga}_{\text{activa}} = +\frac{120}{\text{Calma}} \text{ por segundo}$$
Mientras el operador está libre (en descanso en la consola):
$$\Delta \text{Fatiga}_{\text{descanso}} = -\left(3 + \frac{\text{Calma}}{25}\right) \text{ por segundo}$$

### 4. Puntuación Final y Nivel CML (Concept Maturity Level)
$$\text{ScoreFinal} = (\text{MisionesObjetivoCompletadas} \times 250) + (\text{DatosTransmitidosGB} \times 10) + (\text{IntegridadNave\%} \times 5) - (\text{EmergenciasFalladas} \times 150)$$

* **CML 4 (Point Design / Excelencia):** $\text{Score} \ge 1500$ y $\text{Integridad} > 70\%$.
* **CML 3 (Trade Study Validated / Éxito):** $\text{Score } 900 - 1499$.
* **CML 2 (Concept Feasibility / Éxito Parcial):** $\text{Score } 400 - 899$.
* **CML 1 (Initial Concept / Falla de Misión):** $\text{Score} < 400$ o $\text{Integridad de la nave} = 0\%$.

---

## 7. Arquitectura UI/UX y Flujo de Pantallas (2D Web)

1. **Pantalla 1: Selección de Expediente Histórico (`ScenarioSelectScreen`)**
   * Tarjetas interactivas de los 3 niveles (Fácil: *Amanecer Orbital*, Medio: *Operación Alunizaje*, Difícil: *Ojo del Espacio Profundo*).
   * Muestra el objetivo del **User Segment**, la órbita destino y el presupuesto asignado.
2. **Pantalla 2: Laboratorio MDL - Contratación y Ensamblaje (`MdlSetupScreen`)**
   * **Barra superior fija:** Indicadores en tiempo real de las 6 variables (*Budget, Mass, Power, Data Rate, Comms Bandwidth, Mission Time*) con alertas en rojo si hay exceso de masa o déficit de energía.
   * **Columna Izquierda (Ground/Crew Segment):** Catálogo de candidatos con barras de sus 4 cualidades (*Calma, Matemático, Científico, Tecnología*) y sus 4 asientos activos.
   * **Columna Derecha (Space & Launch Segments):** Selector de Chasis, Instrumentos, Batería/Paneles, Antena y Cohete.
3. **Pantalla 3: Centro de Control Táctico 2D (`DispatchConsoleScreen`)**
   * **Panel Superior:** Telemetría viva de la nave (Integridad %, Batería %, Memoria de Datos ocupada, Puntos de Ciencia y Cronómetro).
   * **Lienzo Central (Mapa Orbital 2D):** Representación vectorial estilo radar de la Tierra/Luna/L2 con la nave moviéndose por su trayectoria. Sobre el mapa aparecen los nodos interactivos:
     * **Nodos Azules/Verdes:** Misiones Objetivo (clic para abrir y asignar un operador).
     * **Nodos Rojos Parpadeantes:** Emergencias (con barra de tiempo agotándose).
   * **Dock Inferior (Los 4 Operadores del Crew):** Las 4 tarjetas de tus especialistas contratados mostrando su retrato 2D, sus 4 estadísticas, su estado actual (*Disponible* u *Ocupado en [Tarea]*) y su barra de **Fatiga**.
4. **Pantalla 4: Expediente Post-Misión (`DebriefScreen`)**
   * Nivel alcanzado (**CML 1 a CML 4**).
   * **Análisis de Causa y Efecto:** Explicación generada dinámicamente de por qué funcionó o falló la misión según el balance entre Crew y Hardware.
   * **Comparativa Real NASA:** Tarjeta informativa de la misión histórica equivalente (*Explorer 1, Apollo/LRO, JWST*).

---

## 8. Mapeo de los 9 Recursos Oficiales de la NASA (Para Documentación y UI)
El código y la interfaz deben incluir etiquetas y referencias visibles a estos 9 recursos oficiales del reto:

1. **Design and Develop Science Missions:** Estructura el juego en los 4 segmentos oficiales (*User, Space, Launch, Ground*).
2. **General Mission Analysis Tool (GMAT):** Define los parámetros de las 3 órbitas (*LEO, Lunar Transfer, Libration Point L2*).
3. **Concept Maturity Levels (CMLs):** Sistema de calificación y progresión del diseño de **CML 1 a CML 4**.
4. **Mission Design Lab (MDL):** Da nombre al centro de control y define las disciplinas de subsistemas y riesgos.
5. **NASA Mission Viz:** Inspiración directa del visualizador orbital 2D y la barra de línea de tiempo (*Mission Timeline*).
6. **A Learning Game About Telescopes:** Inspira la compatibilidad de instrumentos científicos y la comparativa final con misiones reales de la NASA.
7. **CubeSat 101:** Provee las especificaciones de masa (kg) y potencia (W) de las plataformas ligeras (3U, 6U, 12U).
8. **Visualize a Space Mission Using VR:** Aporta la estructura de presentar Concepto + Trayectoria + Línea de Tiempo.
9. **CSA (Canadian Space Agency) Digital Games:** Inspiración de accesibilidad educativa e inclusión de módulos de tecnología espacial colaborativa.

---

## 9. Secuencia Completa de Prompts para Antigravity (6 Pasos)

> **Instrucciones:** Guarda este documento como `PROJECT_SPEC.md` en la raíz del proyecto. Copia y pega cada uno de los siguientes 6 prompts en orden dentro del chat de Antigravity, verificando que compile entre cada paso.

---

### PROMPT 1 DE 6: Inicializar arquitectura, tipos y base de datos estática

> **Copia y pega en Antigravity:**
>
> Lee el archivo `@PROJECT_SPEC.md` para entender todo el contexto del reto NASA Space Apps "Space Mission Design Game" (estilo Dispatch 2D).
>
> Ejecuta únicamente la Fase 1 de arquitectura y datos:
> 1. Inicializa o configura la estructura del proyecto en React + TypeScript + Tailwind CSS (con `lucide-react` para íconos).
> 2. Crea `src/types/game.ts` con todas las interfaces estrictas:
>    - `DifficultyLevel` (`'easy' | 'medium' | 'hard'`) con escenarios históricos (LEO Explorer, Lunar Apollo/LRO, Deep Space Webb/Voyager), órbita GMAT y presupuesto inicial ($90M, $120M, $150M).
>    - `CrewMember` con `id`, `name`, `role`, `tier` (`'Junior' | 'Senior' | 'Elite'`), `cost`, `fatigue` (0-100), `assignedEventId` y las 4 cualidades (`calma`, `matematico`, `cientifico`, `tecnologia`), además de `primarySpecialty`.
>    - `SpacecraftComponent` separado por los segmentos oficiales de NASA (`'Space Segment' | 'Launch Segment' | 'Ground Segment'`) y subcategorías (`'chassis' | 'instrument' | 'power' | 'comms' | 'rocket' | 'ground_station'`) con `cost`, `mass`, `maxMassCapacity` (para cohetes), `power` (positivo si genera, negativo si consume), `dataRate`, `commBonus`, `reliabilityBonus` y `compatibleDifficulties`.
>    - `GameEvent` dividido en `'objective'` (Misiones Objetivo que dan puntos de ciencia y generan Datos) y `'emergency'` (Eventos de Emergencia como asteroides en trayectoria, cambio de batería en eclipse, sobrecarga de sistema, reparaciones de panel, tormenta solar) con `requiredStat` (`'matematico' | 'cientifico' | 'tecnologia'`), `difficultyPoints`, `progress` (0-100), `timeRemaining`, `stressFactor` y penalizaciones sobre los 6 recursos obligatorios (`massFuelPenalty`, `powerPenalty`, `budgetPenalty`, `dataPenalty`, `commsPenalty`, `hullDamage`).
> 3. Crea `src/data/nasaGameData.ts` poblando el catálogo completo con:
>    - Los 3 niveles históricos completos (Fácil $90M, Medio $120M, Difícil $150M).
>    - 12 candidatos de Crew (4 Junior, 4 Senior y 4 Élite) donde cada uno destaque claramente en una de las 4 cualidades (`calma`, `matematico`, `cientifico`, `tecnologia`).
>    - Catálogo de al menos 18 piezas basadas en CubeSat 101, GMAT y MDL (chasis CubeSat 3U/6U/Lunar Orbiter/Deep Space Bus, paneles solares, baterías, instrumentos científicos, cohetes y antenas DSN).
>    - Pool de al menos 6 Misiones Objetivo y 8 Eventos de Emergencia variados, más las fichas de misiones reales de la NASA equivalentes (Explorer 1, Apollo 11 / LRO, James Webb / Voyager) para el debriefing final.
>
> No construyas las pantallas todavía; asegúrate de que los tipos y datos compilen sin errores.

---

### PROMPT 2 DE 6: Crear el estado global y Pantalla 1 (Selección de Expediente Histórico)

> **Copia y pega en Antigravity:**
>
> Siguiendo `@PROJECT_SPEC.md` y usando `src/types/game.ts` y `src/data/nasaGameData.ts`, implementa el estado global del juego y la Pantalla 1 (Selección de Expediente Histórico):
>
> 1. Crea `src/context/GameContext.tsx` que controle:
>    - La fase actual de la aplicación: `'SCENARIO_SELECT' | 'MDL_SETUP' | 'DISPATCH_CONSOLE' | 'DEBRIEF'`.
>    - El escenario/dificultad seleccionado, el `budget` restante, los 4 slots de `selectedCrew` y el `spacecraftLoadout` (Chasis, Instrumentos, Sistema de Energía, Cohete y Estación Terrena).
>    - Cálculos derivados en tiempo real para las 6 variables obligatorias: `totalCost`, `remainingBudget`, `totalMass`, `maxRocketMass`, `netPower`, `totalDataRate`, `totalCommsBandwidth`.
>    - Funciones para contratar/despedir miembros del Crew y equipar/desequipar componentes validando el presupuesto y límites en tiempo real.
> 2. Construye `src/components/ScenarioSelectScreen.tsx` con estética de terminal táctica de la NASA (modo oscuro espacial, bordes técnicos cian/ámbar, tipografía monoespaciada para telemetría):
>    - Encabezado con insignias de los recursos oficiales de NASA Space Apps (MDL, GMAT, CubeSat 101, CML 1-4).
>    - Muestra las 3 carpetas de dificultad interactivas:
>      * Nivel 1 (Fácil - "El Amanecer Orbital" / LEO - Explorer 1).
>      * Nivel 2 (Medio - "Operación Alunizaje" / Transferencia Lunar - Apollo/LRO).
>      * Nivel 3 (Difícil - "El Ojo del Espacio Profundo" / Punto L2 - James Webb/Voyager).
>    - Muestra en cada tarjeta el objetivo científico (`User Segment`), la órbita GMAT, el presupuesto inicial y las amenazas principales.
>    - Al elegir un nivel, inicializa el presupuesto correspondiente y navega a `'MDL_SETUP'`.

---

### PROMPT 3 DE 6: Construir Pantalla 2 (Hangar MDL — Contratación de Crew y Armado de Nave)

> **Copia y pega en Antigravity:**
>
> Implementa la Pantalla 2 (`src/components/MdlSetupScreen.tsx` - Hangar y Contratación del Mission Design Lab) conectada a `GameContext` y siguiendo `@PROJECT_SPEC.md`:
>
> 1. Barra superior fija de recursos pre-lanzamiento (Monitor de los 6 Recursos Críticos):
>    - `Budget`: Presupuesto Restante ($M) compartido entre Nómina de Crew y Hardware.
>    - `Mass`: Masa Total Actual (kg) vs. Capacidad Máxima del Cohete seleccionado (alerta en rojo si excede).
>    - `Power`: Balance Neto de Energía en Watts (Generación vs. Consumo; alerta en rojo si es menor o igual a 0).
>    - `Data` & `Comms`: Tasa de generación de datos científicos vs. Ancho de banda de transmisión.
>    - `Time`: Duración estimada de la ventana operativa.
> 2. Panel Izquierdo - Contratación de 4 Especialistas (`Ground/Crew Segment`):
>    - Muestra los 4 asientos obligatorios del equipo y el catálogo de los 12 candidatos disponibles.
>    - En cada candidato muestra su costo ($M), nivel (Junior/Senior/Élite) y barras visuales para sus 4 cualidades (`Calma`, `Matemático`, `Científico`, `Tecnología`), resaltando con un badge su especialidad principal.
> 3. Panel Derecho - Configuración de Hardware por Segmentos de la NASA:
>    - Pestañas claras para:
>      * `Space Segment` (Chasis CubeSat/Sonda, Instrumentos Científicos, Paneles/Baterías).
>      * `Launch Segment` (Vehículo de lanzamiento compatible con la órbita GMAT del nivel).
>      * `Ground Segment` (Red de antenas terrestres / Deep Space Network).
>    - Marca visualmente qué instrumentos otorgan bonos para el objetivo científico del nivel (inspirado en el recurso "A Learning Game About Telescopes").
> 4. Reglas de validación para el botón `"LAUNCH & DISPATCH MISSION"`:
>    - Muestra un checklist de validación que solo habilita el lanzamiento si: hay exactamente 4 miembros de Crew contratados, 1 chasis, al menos 1 instrumento científico, 1 sistema de energía, 1 cohete, 1 estación terrena, `remainingBudget >= 0`, `totalMass <= maxRocketMass` y `netPower >= 0`.

---

### PROMPT 4 DE 6: Programar el Motor de Simulación en Tiempo Real (Dispatch Loop)

> **Copia y pega en Antigravity:**
>
> Crea el motor de simulación en tiempo real en `src/hooks/useDispatchSimulation.ts` siguiendo todas las fórmulas matemáticas de `@PROJECT_SPEC.md`:
>
> 1. Estado en vivo de la misión y las 6 variables críticas:
>    - `missionTimeRemaining` (cuenta regresiva de 120s a 180s según nivel), `hullIntegrity` (0-100%), `batteryPower` (0-100%), `propellantMass` (0-100%), `dataBufferGB` (datos recolectados pendientes de transmitir), `transmittedDataGB` (datos enviados a Tierra según `Comms`), `scienceScore` y `activeEvents`.
> 2. Generador dinámico de Tickets (Spawner orbital):
>    - Periódicamente genera en la órbita tanto `Misiones Objetivo` (nodos azules/verdes que dan puntos de ciencia y llenan el buffer de `Data`) como `Eventos de Emergencia` (nodos rojos/ámbar con cuenta regresiva: asteroides en trayectoria, sobrecarga de sistema, cambio de batería en eclipse, reparaciones térmicas, tormentas solares).
>    - La confiabilidad del hardware equipado en el Hangar reduce la probabilidad o severidad de las emergencias (conectando el diseño pre-lanzamiento con la operación en vivo).
> 3. Sistema de Asignación y Resolución por Cualidades del Crew:
>    - Permite asignar cualquiera de los 4 miembros del Crew a un ticket activo o retirarlo a descansar.
>    - En cada tick (cada 250ms), calcula el avance del ticket asignado usando la fórmula:
>      `progreso = base * (1 + valorCualidadRequerida / 50) * bonoEspecialidad * penalizacionFatiga`.
> 4. Sistema de Fatiga gobernado por `Calma`:
>    - Mientras un operador trabaja en un ticket, su `fatigue` aumenta según `(120 / calma)` por segundo.
>    - Si un operador supera el 80% de fatiga, entra en estado `Exhausted` y su velocidad se reduce al 40%.
>    - Mientras el operador no tiene ticket asignado, descansa en la consola y recupera fatiga a razón de `3 + (calma / 25)` por segundo.
> 5. Consecuencias y Bitácora (`missionLog`):
>    - Si una `Misión Objetivo` llega al 100%, suma Puntos de Ciencia y `Data`, liberando al operador.
>    - Si un `Evento de Emergencia` llega a 0 segundos sin resolverse, aplica su penalización directa (drena `batteryPower`, gasta `propellantMass`, corrompe `dataBufferGB` o reduce `hullIntegrity`) y guarda la causa exacta en `missionLog` para explicar el "Porqué" en el reporte final.

---

### PROMPT 5 DE 6: Construir Pantalla 3 (Consola Central 2D Estilo Dispatch)

> **Copia y pega en Antigravity:**
>
> Construye la Pantalla 3 (`src/components/DispatchConsoleScreen.tsx`) conectando `useDispatchSimulation.ts` con una interfaz 2D táctica estilo Dispatch / Centro de Control NASA:
>
> 1. HUD Superior de Telemetría (Monitoreo de los 6 Recursos Críticos):
>    - Barras e indicadores en tiempo real con alertas visuales para: Integridad de Nave, Energía (`Battery %`), Masa/Propelente (`Fuel %`), Buffer de Datos vs. Transmisión DSN (`Data` & `Comms`), Puntos de Ciencia y Cronómetro de Misión (`Time`), más controles de Pausa y Velocidad (`1x` / `2x`).
> 2. Visor Central 2D (Mapa Orbital estilo NASA Mission Viz):
>    - Un lienzo SVG interactivo en 2D con estética de radar espacial que dibuje el cuerpo celeste del escenario (Tierra en LEO, Sistema Tierra-Luna o Punto de Lagrange L2), la trayectoria orbital elíptica, el ícono de la nave moviéndose en tiempo real y nodos interactivos posicionados sobre la órbita.
>    - Nodos Azules/Cian para `Misiones Objetivo` y Nodos Rojos/Ámbar parpadeantes con anillo de cuenta regresiva para `Eventos de Emergencia`.
> 3. Panel Lateral de Despacho y Bitácora en Vivo:
>    - Muestra el detalle de los tickets activos: nombre del evento, qué cualidad exige (`Matemático`, `Científico`, `Tecnología`), barra de progreso (0-100%), tiempo restante, consecuencias si falla y botones rápidos para despachar a cualquiera de tus 4 operadores.
>    - Debajo, muestra la consola de telemetría (`Mission Telemetry Log`) narrando en vivo los eventos resueltos y las fallas sufridas.
> 4. Dock Inferior - Los 4 Operadores del MDL Crew:
>    - Muestra las 4 tarjetas de tu tripulación con su avatar/icono, sus 4 estadísticas (`Calma`, `Matemático`, `Científico`, `Tecnología`), su estado actual (`READY`, `WORKING ON [EVENT]` o `EXHAUSTED`) y su barra de **Fatiga** en tiempo real, permitiendo retirarlos a descansar con un clic.

---

### PROMPT 6 DE 6: Implementar Pantalla 4 (Reporte Post-Misión CML 1-4) y Integración Final

> **Copia y pega en Antigravity:**
>
> Implementa la Pantalla 4 (`src/components/DebriefScreen.tsx` - Expediente Post-Misión) y conecta todo el flujo completo de las 4 pantallas dentro de `src/App.tsx`:
>
> 1. Evaluación de Madurez y Nivel CML (`Concept Maturity Levels 1–4`):
>    - Calcula el puntaje final y asigna el nivel oficial de JPL (`CML 4: Point Design Excellence`, `CML 3: Trade Study Validated`, `CML 2: Concept Feasibility`, `CML 1: Mission Failure`) según las Misiones Objetivo completadas, los Datos transmitidos, las emergencias falladas y si la nave sobrevivió.
> 2. Diagnóstico Educativo de Ingeniería ("El Porqué" obligatorio del reto):
>    - Genera un reporte analítico dividido en:
>      * **Desempeño del Crew:** Qué emergencias y misiones se resolvieron a tiempo gracias a las cualidades contratadas (`Calma`, `Matemático`, `Científico`, `Tecnología`) y si hubo cuellos de botella por fatiga.
>      * **Análisis de Trade-offs de Sistemas:** Explica cómo las decisiones de presupuesto, masa, energía y comunicaciones tomadas en el Hangar afectaron la misión en vivo.
> 3. Comparación con una Misión Real de la NASA (basado en "A Learning Game About Telescopes"):
>    - Muestra una tarjeta comparativa vinculando el diseño del jugador con la misión histórica real de la NASA del escenario (*Explorer 1*, *Apollo 11 / LRO*, *James Webb Space Telescope / Voyager*).
>    - Incluye una sección o modal de **"NASA Data & Official Resources Used"** listando los 9 recursos oficiales del reto (*Design and Develop Science Missions, GMAT, CMLs, MDL, NASA Mission Viz, Telescopes Game, CubeSat 101, VR Mission Visualization, CSA Digital Games*) para que los jueces puedan verificarlos directamente en la demo.
> 4. Añade botones para `"Modificar Diseño en Hangar MDL (Mismo Nivel)"` y `"Seleccionar Otro Expediente Histórico"`, y verifica que toda la aplicación compile y funcione de principio a fin sin errores.