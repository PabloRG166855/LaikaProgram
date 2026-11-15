const FILES = ['levels', 'crew', 'components', 'rockets', 'events', 'mainEvents'];

export async function loadData() {
  const entries = await Promise.all(
    FILES.map(async name => {
      const res = await fetch(`data/${name}.json`);
      if (!res.ok) throw new Error(`No se pudo cargar data/${name}.json (${res.status})`);
      return [name, await res.json()];
    })
  );
  return Object.fromEntries(entries);
}
