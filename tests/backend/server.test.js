import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openDatabase } from '@kg/database';
import { createServer } from '../../backend/src/server.js';
import { syncNow } from '../../backend/src/sync.js';
import { fakeSourceFetch } from '../helpers.js';

describe('HTTP API', () => {
  let server;
  let base;
  let staticDir;

  beforeAll(async () => {
    const db = openDatabase(':memory:');
    await syncNow(db, { fetchImpl: fakeSourceFetch() });

    staticDir = mkdtempSync(join(tmpdir(), 'kg-static-'));
    mkdirSync(join(staticDir, 'assets'));
    writeFileSync(join(staticDir, 'index.html'), '<!doctype html><title>app</title>');
    writeFileSync(join(staticDir, 'assets', 'app.js'), 'console.log(1)');

    server = createServer(db, { staticDir });
    await new Promise((resolve) => server.listen(0, resolve));
    base = `http://localhost:${server.address().port}`;
  });

  afterAll(() => {
    server?.close();
    rmSync(staticDir, { recursive: true, force: true });
  });

  const get = (path) => fetch(base + path);

  it('GET /api/kindergartens returns all records', async () => {
    const body = await (await get('/api/kindergartens')).json();
    expect(body).toHaveLength(9);
    expect(body[0]).toHaveProperty('regionName');
  });

  it('GET /api/kindergartens?region= filters by district', async () => {
    const body = await (await get('/api/kindergartens?region=19')).json();
    expect(body.length).toBe(3);
    expect(body.every((k) => k.regionName === 'Люлин')).toBe(true);
  });

  it('serves built frontend files with SPA fallback', async () => {
    const asset = await get('/assets/app.js');
    expect(asset.headers.get('content-type')).toMatch(/javascript/);

    const deepLink = await get('/some/page');
    expect(deepLink.status).toBe(200);
    expect(await deepLink.text()).toContain('<title>app</title>');
  });

  it('does not allow escaping the static folder', async () => {
    const res = await get('/..%2F..%2Fpackage.json');
    expect(await res.text()).not.toContain('"workspaces"');
  });
});
