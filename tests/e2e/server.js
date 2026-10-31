// Offline full-stack server for the Playwright tests: the built SPA plus the API,
// with kg.sofia.bg replaced by the captured fixtures in tests/fixtures/.
import { readFileSync } from 'node:fs';
import { openDatabase } from '@kg/database';
import { createServer } from '../../backend/src/server.js';
import { syncNow } from '../../backend/src/sync.js';

const fixture = (name) => readFileSync(new URL(`../fixtures/${name}`, import.meta.url), 'utf8');
const source = JSON.parse(fixture('source.json'));
const detail171 = JSON.parse(fixture('detail-171.json'));
const waiting9006 = JSON.parse(fixture('waiting-9006.json'));

const json = (body) => ({ ok: true, status: 200, json: async () => structuredClone(body) });
const notFound = { ok: false, status: 404, json: async () => ({}) };

const routes = {
  '/nomenclature/regions': source.regions,
  '/public/0/dz/171': { items: detail171 },
  '/stat-rating/waiting/9006': { items: waiting9006 },
  '/stat-rating/entry/446/9006': { content: fixture('rating-entry-446-9006.html') },
  '/stat-rating/rated/446/9006': { content: fixture('rating-rated-446-6059.html') },
  '/stat-rating/not-rated/446/9006': { content: fixture('rating-notrated-446-9006.html') },
};

// Fake kg.sofia.bg: answers from the fixtures, everything else is a 404. Never touches the network.
async function fakeFetch(url) {
  const path = new URL(url).pathname.replace(/^\/api/, '');
  if (routes[path]) return json(routes[path]);
  const list = /^\/public\/kg\/type\/kinderGarden\/(\w+)$/.exec(path)?.[1];
  if (list) return json({ items: { kinderGardens: source.groups[list] ?? [] } });
  return notFound;
}

const db = openDatabase(':memory:');
await syncNow(db, { fetchImpl: fakeFetch });

const port = Number(process.env.PORT) || 4173;
createServer(db, { staticDir: 'frontend/dist', fetchImpl: fakeFetch }).listen(port, () => {
  console.log(`E2E server ready at http://localhost:${port}`);
});
