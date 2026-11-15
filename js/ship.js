// Pure logic: ship stats and design validation. No DOM here.
import { indexById, fmt } from './util.js';

export function isAvailable(component, level) {
  return !component.destinations || component.destinations.includes(level.destination);
}

export function createDesign(level, data) {
  const selections = {};
  for (const cat of data.components.categories) {
    if (cat.multi) continue;
    if (!cat.required) {
      selections[cat.id] = null;
      continue;
    }
    const cheapest = data.components.components
      .filter(c => c.category === cat.id && isAvailable(c, level))
      .filter(c => cat.id !== 'life_support' || (c.lifeSupport || 0) >= level.crewSlots.length)
      .sort((a, b) => a.cost - b.cost)[0];
    selections[cat.id] = cheapest ? cheapest.id : null;
  }
  const crew = Object.fromEntries(level.crewSlots.map(slot => [slot.id, null]));
  return { levelId: level.id, selections, instruments: [], rocketId: level.rocketId || null, crew }; // the mission sets the rocket
}

export const crewIdsOf = design => Object.values(design.crew).filter(Boolean);

export function getSelectedComponents(design, data) {
  const byId = indexById(data.components.components);
  const ids = [...Object.values(design.selections), ...design.instruments].filter(Boolean);
  return ids.map(id => byId[id]).filter(Boolean);
}

export function getSelectedCrew(design, data) {
  const byId = indexById(data.crew.members);
  return crewIdsOf(design).map(id => byId[id]).filter(Boolean);
}

export function computeShipStats(design, level, data) {
  const comps = getSelectedComponents(design, data);
  const crew = getSelectedCrew(design, data);
  const rocket = data.rockets.find(r => r.id === design.rocketId) || null;
  const sum = (list, key) => list.reduce((acc, c) => acc + (c[key] || 0), 0);
  const byCat = cat => comps.find(c => c.category === cat) || null;

  const structure = byCat('structure');
  const lifeSupport = byCat('life_support');
  const propulsion = byCat('propulsion');
  const battery = byCat('battery');
  const comms = byCat('comms');
  const instruments = comps.filter(c => c.category === 'instruments');

  const componentMass = sum(comps, 'mass');
  const crewMass = crew.length * level.crewMassPerPersonKg;
  const totalMass = componentMass + crewMass;
  const rocketCapacity = rocket ? rocket.capacityKg[level.destination] || 0 : 0;

  const componentCost = sum(comps, 'cost');
  const crewCost = level.crewCosts ? sum(crew, 'cost') : 0; // crew is free in the kid-friendly version
  const rocketCost = rocket ? rocket.cost : 0;
  const totalCost = componentCost + crewCost + rocketCost;
  const budgetLeft = level.budget - totalCost;

  const powerGen = sum(comps, 'powerGen');
  const powerUse = sum(comps, 'powerUse');
  const scienceRate = sum(instruments, 'science');
  const dataRate = sum(instruments, 'data');
  const sendRate = sum(comps, 'comms') / level.commsFactor;
  const sentFraction = dataRate > 0 ? Math.min(1, sendRate / dataRate) : 1;
  const shielding = sum(comps, 'shielding');
  const lifeCapacity = lifeSupport ? lifeSupport.lifeSupport : 0;
  const crewMax = structure ? structure.crewMax : 0;
  const propulsionLevel = propulsion ? propulsion.propulsion : 0;
  const batteryMult = battery ? battery.batteryMult || 1 : 1;
  const lifeDrainMult = lifeSupport ? lifeSupport.drainMult || 1 : 1;
  const projectedScience = scienceRate * level.durationSec * sentFraction;

  const errors = [];
  const warnings = [];

  for (const cat of data.components.categories) {
    if (cat.required && !cat.multi && !design.selections[cat.id]) errors.push(`Falta elegir: ${cat.name}.`);
  }
  if (instruments.length === 0) errors.push('Agrega al menos un instrumento científico: sin instrumentos no hay ciencia.');

  if (!rocket) errors.push('Elige un cohete.');
  else if (rocketCapacity <= 0) errors.push(`${rocket.name} no puede llegar a ${level.destinationName}.`);
  else if (totalMass > rocketCapacity)
    errors.push(`La nave pesa ${fmt(totalMass)} kg y ${rocket.name} solo lleva ${fmt(rocketCapacity)} kg a ${level.destinationName}. Quita masa o usa un cohete más potente.`);

  if (powerUse > powerGen)
    errors.push(`Consumes ${fmt(powerUse, 1)} kW pero solo generas ${fmt(powerGen, 1)} kW. Mejora la energía o quita equipos.`);

  for (const slot of level.crewSlots) {
    if (!design.crew[slot.id]) {
      errors.push(`Puesto vacío: ${slot.label} (${slot.roles.map(r => data.crew.roles[r].name).join(' o ')}).`);
    }
  }
  if (structure && crew.length > crewMax) errors.push(`${structure.name} solo tiene espacio para ${crewMax} tripulantes.`);
  if (lifeSupport && crew.length > lifeCapacity) errors.push(`${lifeSupport.name} solo alcanza para ${lifeCapacity} personas.`);
  if (propulsion && propulsionLevel < level.minPropulsion)
    errors.push(`${propulsion.name} no tiene empuje suficiente para llegar a ${level.destinationName}.`);
  if (shielding < level.minShielding)
    errors.push(`Ir a ${level.destinationName} requiere blindaje nivel ${level.minShielding} (tienes ${shielding}). Lejos de la Tierra hay más radiación.`);

  if (instruments.length > 0 && projectedScience < level.scienceGoal * (level.minScience || 0))
    errors.push('Tu nave hace muy poca ciencia: agrega instrumentos o una antena más fuerte.');
  if (instruments.length > 0 && sentFraction < 1)
    warnings.push(`Tu antena (${comms ? comms.name : 'ninguna'}) solo podrá enviar el ${Math.round(sentFraction * 100)} % de los datos. La ciencia que no se transmite se pierde.`);
  if (instruments.length > 0 && projectedScience < level.scienceGoal)
    warnings.push(`Ciencia proyectada: ${fmt(projectedScience)} de ${fmt(level.scienceGoal)}. Necesitarás aprovechar los eventos científicos o llevar más instrumentos.`);
  if (powerGen >= powerUse && powerGen - powerUse < 0.5)
    warnings.push('Margen de energía muy pequeño: las baterías se recargarán lento después de una falla.');

  return {
    comps, crew, rocket, structure, lifeSupport, propulsion, battery, comms, instruments,
    componentMass, crewMass, totalMass, rocketCapacity,
    componentCost, crewCost, rocketCost, totalCost, budgetLeft,
    powerGen, powerUse, scienceRate, dataRate, sendRate, sentFraction,
    shielding, lifeCapacity, crewMax, propulsionLevel, batteryMult, lifeDrainMult, projectedScience,
    errors, warnings, valid: errors.length === 0
  };
}
