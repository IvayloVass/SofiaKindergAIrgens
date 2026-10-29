async function getJson(path) {
  const res = await fetch(path, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Заявката към ${path} не успя (HTTP ${res.status}).`);
  return res.json();
}

export const api = {
  kindergartens: () => getJson('/api/kindergartens'),
  regions: () => getJson('/api/regions'),
  meta: () => getJson('/api/meta'),
};
