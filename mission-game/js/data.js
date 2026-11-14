const FILES = ['levels', 'crew', 'components', 'rockets', 'events'];

export async function loadData() {
  const entries = await Promise.all(
    FILES.map(async name => {
      const res = await fetch(`data/${name}.json`);
      if (!res.ok) throw new Error(`No se pudo cargar data/${name}.json (${res.status})`);
      return [name, await res.json()];
    })
  );
  return prepareData(Object.fromEntries(entries));
}

// Derived fields shared by the browser and the Node balance tester.
export function prepareData(data) {
  for (const level of data.levels) {
    level.crewSlots = level.crewSlots || [];
    level.crewSize = level.crewSlots.length;
    level.script = level.script || [];
  }
  return data;
}
