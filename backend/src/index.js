import { openDatabase } from '@kg/database';
import { DB_PATH, MAX_DATA_AGE_MS, PORT, STATIC_DIR } from './config.js';
import { createServer } from './server.js';
import { syncIfStale } from './sync.js';

const db = openDatabase(DB_PATH);

async function refresh() {
  try {
    const result = await syncIfStale(db);
    if (result.synced) console.log(`Synced ${result.count} kindergartens from kg.sofia.bg.`);
    if (result.error) console.warn(`Source unavailable, serving cached data: ${result.error.message}`);
  } catch (err) {
    console.error(`Initial sync failed: ${err.message}`);
  }
}

await refresh();
setInterval(refresh, MAX_DATA_AGE_MS).unref();

createServer(db, { staticDir: STATIC_DIR }).listen(PORT, () => {
  console.log(`API ready at http://localhost:${PORT}/api`);
});
