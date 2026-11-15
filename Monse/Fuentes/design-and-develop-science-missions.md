# Design and Develop Science Missions (NASA)

| | |
|---|---|
| **Title** | Design and Develop Science Missions |
| **Series** | Access to Space for All — Systems Engineering Webinar Series |
| **Author** | Julie Levri, Flight Systems Engineer, NASA |
| **Organization** | NASA Small Spacecraft Systems Virtual Institute (www.nasa.gov/smallsat-institute) |
| **Date** | March 26, 2025 |
| **Format** | Slide deck (PDF, 25 slides) |
| **Link** | https://www.nasa.gov/wp-content/uploads/2025/04/250323-design-and-develop-science-mission.pdf |

**Purpose:** To give attendees the information and knowledge needed to design and develop science missions.

> Note: some slides (6, 15–17, 20–23) are mostly images or diagrams. Only their text is recorded here.

### 1. What is a science mission?

- At NASA, the **Science Mission Directorate (SMD)** manages science missions.
- Definition: a spaceflight mission focused mainly on **scientific research and exploration**, with the goal of advancing scientific understanding and possibly benefiting humanity.
- Disciplines:
  - Earth science
  - Heliophysics
  - Planetary science
  - Astrophysics
- Science missions usually follow **SMD strategic plans**. Exploration missions may follow a **Presidential directive**.

### 2. Mission segments

A NASA science mission has four segments:

| Segment | Description |
|---|---|
| **Launch** | The launch vehicle and related services that get the spacecraft into space |
| **Space** | The spacecraft and its parts (orbiters, landers, rovers, instruments) that collect data |
| **Ground** | Ground stations and mission control centers that talk to the spacecraft, receive data and manage the mission |
| **User** | Scientists and the public who use the mission's data for research and education |

### 3. Big-picture design process

```
Identify Need & Goals → Define Concept → Define Requirements → Design → Build & Verify → Implement
```

**Concept of Operations (ConOps)**, as described in NPR 7123.1:
- Describes at a high level how the system will be used to meet stakeholder expectations, usually as a sequence over time.
- Describes the system from an operational point of view and helps people understand its goals.
- Drives the development of requirements and architecture.
- Is the basis for later definition documents and for long-range operational planning.
- Gives the criteria for validating the system.

**Key principle: "Begin with the End in Mind."** Start from what the user segment needs, then work backward.

**Key principle:** When you identify requirements, also plan how you will **verify** that the design meets them, before implementation.
*Example: the requirement "< 250 g sample container" is verified by weighing an empty sample container.*

### 4. Worked example: BioNutrients-2

**Background (BioNutrients):** Foods and supplements stored for a long time, such as on human missions to Mars, lose nutrients. Research question: can genetically modified yeast that resists degradation in spore form produce nutrients as it grows?
More info: https://www.nasa.gov/general/what-is-bionutrients/

**Need:** Produce dietary nutrients in place, quickly, safely and reliably, with minimal mass, power and volume, for long-duration missions.

**Goals:**
1. Enable growth of yeast organisms
2. Produce targeted beta carotene on the International Space Station (ISS)
3. Reduce mass and volume compared to the BioNutrients-1 payload

**Segments:**

| Segment | BioNutrients-2 |
|---|---|
| Launch | NG-18 to the ISS. Samples soft-stowed at room (ambient) temperature and protected from oxygen and moisture |
| Space | Experiment runs on the ISS. Samples are hydrated, incubated, then frozen and returned to Earth |
| Ground | Scientists and engineers watch the experiment start in real time, then monitor temperature from the ground |
| User | Scientists receive the frozen samples, process and analyze them, and publish the research |

**User-segment sample process:** 1. Delivery → 2. Thaw → 3. Empty and Wash → 4. Centrifuge → 5. Analyze

**Requirements: science data (end product = publication)**

Guiding questions:
- What type and amount of data is needed to answer the research questions?
- To get that data from sample processing, what quantity, repetition and quality of samples are needed?

Requirements:
- ≥ 12 replicate samples
- ≥ 30 mL volume per sample
- ≥ 3 µg beta carotene per mL of returned sample
- ≥ 1 mg dry cell weight per sample
- No microbial contamination

**Requirements: lower resource use (end product = demonstration)**

For the same starting sample size as BioNutrients-1:
- < 250 g sample container
- < 300 mL total occupied volume

**Design (experiment) steps:** Sample hydration and agitation → Sample incubation → Sample freezing

**Build & verify:** The hardware is built and sterilized, then loaded with the organism and growth media. Assembly is finished after loading.

**Implement:** Scientists and engineers stay on-console during experiment operations in case the crew has questions or something goes wrong.

### 5. Other example science missions

| Mission | Summary | Link |
|---|---|---|
| **PUNCH** (Polarimeter to Unify the Corona and Heliosphere) | 4 small satellites in low Earth orbit make global 3D observations of the Sun's corona, to understand how its mass and energy become the solar wind | https://science.nasa.gov/mission/punch/ |
| **PILOT** (Plasma Imaging, LOcal measurement, and Tomographic experiment) | A fleet of 34 satellites in 2 different orbits that measures cold, dense plasma flowing into and out of Earth's magnetosphere | https://advancedspace.com/pilot-magnetosphere-science-mission-design/ |
| **Dawn** | First spacecraft to orbit two small bodies: asteroid Vesta and dwarf planet Ceres | https://exploreintrosems.stanford.edu/news/aa-118n-how-design-space-mission-concept-execution |
| **Mars Moon Sampler** (Phobos/Deimos lander) | New Frontiers–class mission to find the origins of Mars's moons by returning samples to Earth | https://www1.grc.nasa.gov/facilities/compass-lab/designs-by-type/ |
| **Space Launch System (SLS)** | Heavy-lift launch vehicle: shorter mission times, larger mass margins, more payload volume | https://ntrs.nasa.gov/api/citations/20130013034/downloads/20130013034.pdf |
| **Artemis Program** | A series of missions to deliver lunar surface logistics and support long astronaut stays on the Moon | https://en.wikipedia.org/wiki/Artemis_program |

### 6. Useful references (from the deck)

1. NASA Systems Engineering Handbook, NASA SP-2016-6105 (Rev 2): https://www.nasa.gov/reference/systems-engineering-handbook/
2. Concept of Operations Outline, Appendix S: https://www.nasa.gov/reference/appendix-s-concept-of-operations-annotated-outline/
3. NASA Systems Engineering Processes and Requirements, NPR 7123.1 (D): https://nodis3.gsfc.nasa.gov/displayDir.cfm?Internal_ID=N_PR_7123_001D_&page_name=main
4. NASA Space Flight Program and Project Management Requirements, NPR 7120.5 (F): https://nodis3.gsfc.nasa.gov/displayDir.cfm?t=NPR&c=7120&s=5E
5. NASA Research and Technology Program and Project Management Requirements, NPR 7120.8 (A): https://nodis3.gsfc.nasa.gov/displayDir.cfm?Internal_ID=N_PR_7120_008A_&page_name=main
6. Risk Classification for NASA Payloads, NPR 8705.4 (B): https://nodis3.gsfc.nasa.gov/displayDir.cfm?t=NPR&c=8705&s=4B
7. NASA Science Mission Directorate: https://science.nasa.gov/learn/
8. System Engineering Curriculum Intro (NTRS 20210021839): https://ntrs.nasa.gov/citations/20210021839
9. About NASA Science (SMD): https://science.nasa.gov/about-us/
