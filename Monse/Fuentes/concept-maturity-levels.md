# Space Mission Concept Development Using Concept Maturity Levels (CML)

> Summary of the paper *"Space Mission Concept Development Using Concept Maturity Levels"*

## Document info

| Field | Value |
|---|---|
| Authors | Randii R. Wessen, Chester Borden, John Ziemer, Johnny Kwok (JPL, Caltech) |
| Event | AIAA SPACE 2013 Conference & Exposition, San Diego, CA, Sept. 10–12, 2013 |
| File | `13-3547_A1b.pdf` (1.4 MB) |
| Source | [JPL Dataverse, fileId 50237, v2.0](https://dataverse.jpl.nasa.gov/file.xhtml?fileId=50237&version=2.0) |
| Handle | https://hdl.handle.net/2014/44299 |
| License | CC0 1.0 (public domain) |

## Main idea

JPL created **Concept Maturity Levels (CML)**, a scale to measure and communicate how mature a space mission concept is **before** the formulation phase (Pre-Phase A, before NASA Phases A/B). The Chief Engineer of the Strategic Planning & Project Formulation Office proposed it in 2008.

Before CMLs, there was no way to:
1. know how much work had already gone into a mission concept;
2. know when exploring the design space (*trade space*) would help most;
3. tell which concepts had the same amount of work and could be compared fairly;
4. estimate how much work was left to reach the next level.

This paper was the first release of the **CML Matrix** outside JPL. It focuses on **CMLs 1–4**, because CMLs 5–6 are already well defined by NASA's AO and CSR guidelines and by NPR 7120.5E.

## The 9 CML levels

| CML | Name | Description |
|---|---|---|
| 1 | **Cocktail Napkin** | The science questions are well stated and the needed observations have been proposed. There is a rough sketch of the concept with high-level objectives, and what makes it unique is captured. |
| 2 | **Initial Feasibility** | The idea is tested for science, technical and programmatic feasibility. Lower-level objectives are set, key performance parameters are quantified, and first-order calculations show whether the concept is viable. |
| 3 | **Trade Space** | Science objectives and architecture trades (spacecraft, ground system and mission design) are explored to understand how science return, cost and risk relate. |
| 4 | **Point Design** | A specific design and cost that delivers the desired science is chosen within the trade space. It is defined down to major subsystems, with acceptable margins and reserves, and subsystem trades are done. |
| 5 | **Baseline Concept** | The implementation approach is defined: partners, contracting mode, integration and test, cost and schedule. This is the level needed for a NASA Step 1 proposal (competed missions) or a Mission Concept Review, MCR (assigned missions). |
| 6 | **Integrated Concept** | Technical, management, cost and other details are expanded and documented. This matches a Step 2 CSR. Assigned missions have no matching milestone. |
| 7 | **Preliminary Implementation Baseline** | Preliminary system and subsystem requirements and analyses, demonstrated margins, prototypes and technology demonstrations, and risk and mitigation plans are complete. This matches the PMSR (competed) or MDR (assigned). |
| 8 | **PDR (Integrated Baseline)** | Design and planning are at the level of a Preliminary Design Review. |
| 9 | **CDR** | Design and planning are at the level of a Critical Design Review. |

### Iterative nature (Figure 1, the CML "spine")
- The scale is sequential, but **there is a feedback loop between CMLs 2 and 4** (feasibility ↔ trade space ↔ point design). The authors see this as a strength.
- Teams often skip the trade space and go straight to point design, without knowing the *science partials*: how science return changes with parameters such as mass, data volume or orbital period. This leads to:
  1. lower science return;
  2. inefficient spacecraft and ground system designs;
  3. a less efficient mission overall.
- Exploring the trade space makes it more likely to find a **global optimum**.

### Alignment with NASA milestones (Figure 2)
- **Assigned projects:** must reach CML 5 by the MCR.
- **Competed projects:** must reach CML 5 by the Baseline Commitment Review (BCR).
- By the middle of Phase B, the two lifecycles merge into one.
- Official guidance comes from NPR 7120.5E (assigned) and the Announcements of Opportunity, AO (competed).
- Mission architects have the most impact on the system design **early** in Pre-Phase A. So all major components should be addressed at a high level and, ideally, in parallel.

## CML Matrix

- **7 columns** (CML 1 to 7) × **24 rows**, grouped the way NASA evaluates proposals (a science review first, then a **TMCO** review: Technical, Management, Cost, Other):

| Group | Rows | Focus |
|---|---|---|
| Science | 2 | Science objectives (*why* fly the mission) and science data products (*what* it will produce) |
| Technical | 13 | Concurrent mission design, with the spacecraft and ground system treated as one integrated system |
| Management | 5 | Programmatic areas that, if left out, force a redesign or raise lifecycle cost |
| Cost | 1 | Estimate, uncertainty, sensitivities across the trade space, validation and reserves |
| Other | 3 | Areas often handled too late, such as export compliance or coordination with other NASA organizations |

- The matrix has **two uses**:
  - **By column:** shows what a given review needs. For example, the CML 5 column lists what the MCR needs. This is the minimum required, not what wins a proposal.
  - **By row:** shows how one area evolves over time. For example, the Mission Assurance Manager reads the "Mission Assurance Management" row.
- It is a high-level guide and does not try to list every design attribute.

> ⚠️ The cell-by-cell content of the matrix (Figures 3–7) and the checklists (Figures 8a–c) is in images inside the PDF and could not be extracted as text. See the original PDF for it.

## CML Checklists

These are assessment tools based on each column of the matrix. Checklists were created for **CMLs 2–6**:
- **CML 1 has no checklist** because the concept is free-form at that stage. Only four things are considered: (1) the science objective, (2) the unique mission characteristics, (3) an approximate launch date and (4) the target cost class.
- **CML 7+ has no checklist** because from that level on (in practice, from CML 6) NPR 7120.5E applies.

**What the checklist had to do:**
1. measure maturity quickly;
2. be repeatable, giving the same score to concepts of equal maturity;
3. clearly show which areas need more work.

**Format** (CML 4 checklist example, Figures 8a–c): three columns with *functional area*, *criteria* and *status*. Status uses colors:
- 🟢 **G**: completed
- 🟡 **Y**: in progress
- 🔴 **R**: not started

**80% rule:** a concept is at a given CML when **80% of its attributes are green**. The threshold is applied with judgment:
- at 78%, the concept is probably at the level;
- at 90%, it is not if it is missing the *Science Traceability Matrix*, the Level 1 requirements or the *Master Equipment List* (MEL).

CML 4 does not require propellant, data storage or attitude control margins, because the AO does not ask for them.

**Limitations:**
1. It measures **completeness, not quality**.
2. It **does not weight** attributes: for example, it cannot tell a missing KPP from a missing telecom approach.
3. **Self-assessment is risky** because it tends to be optimistic. An independent assessor should hold a ~30-minute discussion with at least the Proposal Manager and the System Engineer.

With limited resources (time, funds and staff), the key team (PI, Capture Lead, Proposal Manager, Study Lead, System Engineer) decides which gaps to fix first.

## How JPL uses CMLs

| Team | CML | Role |
|---|---|---|
| **A-Team** | 1–3 | Open-ended, high-impact ideas: idea generation, feasibility, architecture trade space, science traceability, technology infusion and strategic evaluation. It runs facilitated collaborative sessions with a small team of experts. It uses engineering and cost tools matched to each CML; for example, the CML 2 cost tool has large uncertainty but is good enough to place a concept in a cost class (Explorer, Discovery, New Frontiers, Flagship). |
| **Team X** | 4 | Concurrent engineering team created in **1995**, with **over 1000 studies** done. It produces point designs for proposals (Discovery and New Frontiers AOs), usually in **3 sessions over one week**, and delivers mission design, spacecraft design, cost and risk. |

## Conclusions and future plans

- CMLs, the matrix and the checklists are not the whole answer. Mission **complexity** affects maturity, risk and cost, but it is hard to measure in Pre-Phase A. Work on attribute **weighting** and on measuring complexity is planned.
- The National Research Council's **Planetary Science Decadal Survey** panels used CML terms and found them useful for comparing concepts.
- The **JPL Innovation Foundry** adapted the tools so other NASA centers can use them and plans to publish them on an external website.
- The authors propose a working group with NASA PSD, ARC, JPL, GSFC, APL and Aerospace Corporation to turn CMLs into an industry-wide standard.
- The tools have been in use for over 5 years across Earth, Mars, Solar System and Astrophysics programs.

## Key acronyms

AO (Announcement of Opportunity) · BCR (Baseline Commitment Review) · CDR (Critical Design Review) · CSR (Concept Study Report) · KPP (Key Performance Parameters) · MCR (Mission Concept Review) · MDR (Mission Definition Review) · MEL (Master Equipment List) · NPR (NASA Procedural Requirements) · PDR (Preliminary Design Review) · PMSR (Preliminary Mission System Review; the paper's glossary calls it "Project Mission System Review") · TMCO (Technical, Management, Cost, Other) · TRL (Technology Readiness Level)

## References from the paper

1. NASA NPR 7120.5E, *NASA Space Flight Program and Project Management Requirements*, 2012.
2. NASA NPR 7120.8, Appendix J: *Technology Readiness Levels*, 2008.
3. Wessen, Adler, Leising, Sherwood, *Measuring the Maturity of Robotic Planetary Mission Concepts*, AIAA 2009.
4. Wessen, Adler, Leising, Sherwood, *Measuring the Maturity of Robotic Planetary Mission Concepts II*, SpaceOps 2010.
5. Sherwood, McCleese, *JPL Innovation Foundry*, Acta Astronautica, 2013, pp. 236–247.
