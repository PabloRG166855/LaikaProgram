// Balance tester: a bot plays each level N times with a sample design.
// Usage: node tools/simulate.mjs [runs]
import { readFileSync } from 'node:fs';
import { createMission, tick, assign, calcChance, unavailableReason, resolveRepair } from '../js/missionEngine.js';
import { computeShipStats } from '../js/ship.js';
import { computeReport } from '../js/report.js';

const load = name => JSON.parse(readFileSync(new URL(`../data/${name}.json`, import.meta.url), 'utf8'));
const data = { levels: load('levels'), crew: load('crew'), components: load('components'), rockets: load('rockets'), events: load('events'), mainEvents: load('mainEvents') };

const SAMPLE_DESIGNS = {
  easy: {
    selections: { structure: 'str_basic', propulsion: 'prop_basic', power: 'pwr_high', battery: 'bat_basic', life_support: 'ls_std', comms: 'com_hga', computer: 'cpu_basic', attitude: 'att_basic', shielding: null },
    instruments: ['ins_camera', 'ins_spectro', 'ins_bio'], rocketId: 'condor', crew: { cmd: 'belka', plt: 'ham', spc: 'missbaker' }
  },
  medium: {
    selections: { structure: 'str_basic', propulsion: 'prop_medium', power: 'pwr_high', battery: 'bat_basic', life_support: 'ls_std', comms: 'com_hga', computer: 'cpu_basic', attitude: 'att_basic', shielding: 'shd_thermal' },
    instruments: ['ins_geo', 'ins_camera', 'ins_spectro'], rocketId: 'jaguar', crew: { cmd: 'zvezdochka', plt: 'ham', sci: 'zondy' }
  },
  hard: {
    selections: { structure: 'str_large', propulsion: 'prop_advanced', power: 'pwr_high', battery: 'bat_basic', life_support: 'ls_regen', comms: 'com_laser', computer: 'cpu_basic', attitude: 'att_basic', shielding: 'shd_thermal' },
    instruments: ['ins_geo', 'ins_spectro', 'ins_camera'], rocketId: 'titan', crew: { cmd: 'zvezdochka', plt: 'enos', eng: 'strelka', med: 'chernushka', sci: 'zondy' }
  }
};

const runs = Number(process.argv[2] || 200);
const DT = 0.1;
const REACTION = Number(process.env.REACTION || 1.5); // seconds the bot waits before acting on an event
const REPAIR = Number(process.env.REPAIR || 0.75); // chance the player wins a repair minigame

for (const level of data.levels) {
  const design = { levelId: level.id, ...structuredClone(SAMPLE_DESIGNS[level.id]) };
  const stats = computeShipStats(design, level, data);
  console.log(`\n=== ${level.name} (${level.destination}) ===`);
  console.log(`valid=${stats.valid} cost=${stats.totalCost}/${level.budget} mass=${stats.totalMass}/${stats.rocketCapacity} power=${stats.powerUse.toFixed(1)}/${stats.powerGen} projSci=${stats.projectedScience.toFixed(0)}/${level.scienceGoal} sent=${(stats.sentFraction * 100).toFixed(0)}%`);
  if (!stats.valid) { console.log(stats.errors); continue; }

  const grades = {};
  let sumScore = 0, aborts = 0, sumSci = 0, sumMain = 0, sumPts = 0;
  for (let r = 0; r < runs; r++) {
    const s = createMission(level, design, data, { anomalyDamage: Math.random() > stats.rocket.reliability ? 15 : 0 });
    while (!s.over) {
      tick(s, DT);
      for (const ev of s.events.filter(e => e.status === 'pending' && s.time - e.spawnedAt > REACTION)) {
        if (ev.def.minigame || ev.def.sts125) { resolveRepair(s, ev.uid, { success: Math.random() < REPAIR }); continue; }
        let best = null;
        const free = s.crew.filter(x => !unavailableReason(s, x));
        for (const m of free) {
          const { chance } = calcChance(s, ev, [m]);
          if (!best || chance > best.chance) best = { chance, ids: [m.id] };
        }
        // send a pair when one alone is weak and there are spare hands
        if (best && best.chance < 60 && free.length >= 3) {
          for (const a of free) for (const b of free) {
            if (a.id >= b.id) continue;
            const { chance } = calcChance(s, ev, [a, b]);
            if (chance > best.chance + 10) best = { chance, ids: [a.id, b.id] };
          }
        }
        if (best) assign(s, ev.uid, best.ids);
      }
    }
    const rep = computeReport(s);
    grades[rep.grade] = (grades[rep.grade] || 0) + 1;
    sumScore += rep.score; sumSci += rep.science; sumMain += rep.mainDone; sumPts += rep.points;
    if (rep.aborted) aborts++;
  }
  console.log(`avgMain=${(sumMain / runs).toFixed(2)} avgPts=${(sumPts / runs).toFixed(0)} avgScore=${(sumScore / runs).toFixed(1)} avgScience=${(sumSci / runs).toFixed(0)} aborts=${aborts} grades=${JSON.stringify(grades)}`);
}
