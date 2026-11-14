// Balance tester: a bot plays each level N times with a sample design.
// Usage: node tools/simulate.mjs [runs]
import { readFileSync } from 'node:fs';
import { prepareData } from '../js/data.js';
import { createMission, tick, assign, calcChance } from '../js/missionEngine.js';
import { computeShipStats } from '../js/ship.js';
import { computeReport } from '../js/report.js';

const load = name => JSON.parse(readFileSync(new URL(`../data/${name}.json`, import.meta.url), 'utf8'));
const data = prepareData({ levels: load('levels'), crew: load('crew'), components: load('components'), rockets: load('rockets'), events: load('events') });

// crewSlots follow the order of each level's "crewSlots" in levels.json
const SAMPLE_DESIGNS = {
  easy: {
    selections: { structure: 'str_basic', propulsion: 'prop_basic', power: 'pwr_high', battery: 'bat_basic', life_support: 'ls_basic', comms: 'com_hga', computer: 'cpu_basic', attitude: 'att_basic', shielding: null },
    instruments: ['ins_camera', 'ins_spectro', 'ins_bio'], rocketId: 'quetzal', crewSlots: ['cmd_rios', 'fe_kim']
  },
  medium: {
    selections: { structure: 'str_basic', propulsion: 'prop_medium', power: 'pwr_high', battery: 'bat_basic', life_support: 'ls_std', comms: 'com_hga', computer: 'cpu_basic', attitude: 'att_basic', shielding: 'shd_thermal' },
    instruments: ['ins_geo', 'ins_camera', 'ins_spectro'], rocketId: 'jaguar', crewSlots: ['cmd_nwosu', 'plt_ferreira', 'geo_haddad']
  },
  hard: {
    selections: { structure: 'str_large', propulsion: 'prop_advanced', power: 'pwr_high', battery: 'bat_basic', life_support: 'ls_regen', comms: 'com_laser', computer: 'cpu_basic', attitude: 'att_basic', shielding: 'shd_thermal' },
    instruments: ['ins_geo', 'ins_spectro', 'ins_camera'], rocketId: 'titan', crewSlots: ['cmd_ortega', 'plt_lee', 'med_silva', 'fe_kim', 'geo_haddad']
  }
};

const runs = Number(process.argv[2] || 200);
const DT = 0.1;
const REACTION = Number(process.env.REACTION || 1.5); // seconds the bot waits before acting on an event

for (const level of data.levels) {
  const design = { levelId: level.id, ...structuredClone(SAMPLE_DESIGNS[level.id]) };
  const stats = computeShipStats(design, level, data);
  console.log(`\n=== ${level.name} (${level.destination}) ===`);
  console.log(`valid=${stats.valid} cost=${stats.totalCost}/${level.budget} mass=${stats.totalMass}/${stats.rocketCapacity} power=${stats.powerUse.toFixed(1)}/${stats.powerGen} projSci=${stats.projectedScience.toFixed(0)}/${level.scienceGoal} sent=${(stats.sentFraction * 100).toFixed(0)}%`);
  if (!stats.valid) { console.log(stats.errors); continue; }

  const grades = {};
  let sumScore = 0, aborts = 0, sumSci = 0, sumMain = 0, sumPts = 0, sumRandom = 0;
  for (let r = 0; r < runs; r++) {
    const s = createMission(level, design, data, { anomalyDamage: Math.random() > stats.rocket.reliability ? 15 : 0 });
    while (!s.over) {
      tick(s, DT);
      // main objectives first, then random events
      const pending = s.events.filter(e => e.status === 'pending' && s.time - e.spawnedAt > REACTION).sort((a, b) => b.main - a.main);
      for (const ev of pending) {
        let best = null;
        for (const m of s.crew.filter(x => !x.taskUid)) {
          ev.def.options.forEach((_, i) => {
            const { chance } = calcChance(s, ev, i, m);
            if (!best || chance > best.chance) best = { chance, i, id: m.id };
          });
        }
        if (best) assign(s, ev.uid, best.i, best.id);
      }
    }
    const rep = computeReport(s);
    grades[rep.grade] = (grades[rep.grade] || 0) + 1;
    sumScore += rep.score; sumSci += rep.science; sumMain += rep.mainOk; sumPts += s.points;
    sumRandom += s.counters.randomSuccess + s.counters.randomFail + s.counters.randomIgnored;
    if (rep.aborted) aborts++;
  }
  console.log(`avgScore=${(sumScore / runs).toFixed(1)} avgScience=${(sumSci / runs).toFixed(0)} main=${(sumMain / runs).toFixed(2)}/${level.script.length} randomEvents=${(sumRandom / runs).toFixed(1)} netPts=${(sumPts / runs).toFixed(1)} aborts=${aborts} grades=${JSON.stringify(grades)}`);
}
