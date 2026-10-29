import { createServer as createHttpServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize as normalizePath, resolve } from 'node:path';
import { getKindergartens, getMeta, getRegions } from '@kg/database';
import { SOURCE_PAGE_URL } from './config.js';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

function sendJson(res, status, body, cacheSeconds = 0) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': cacheSeconds ? `public, max-age=${cacheSeconds}` : 'no-store',
  });
  res.end(JSON.stringify(body));
}

function serveStatic(req, res, staticDir) {
  if (!staticDir || !existsSync(staticDir)) return false;
  const root = resolve(staticDir);
  const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let file = resolve(join(root, normalizePath(urlPath)));
  if (!file.startsWith(root)) return false; // path traversal guard

  if (!existsSync(file) || statSync(file).isDirectory()) {
    file = join(root, 'index.html'); // SPA fallback
    if (!existsSync(file)) return false;
  }
  const isAsset = file.includes(`${join(root, 'assets')}`);
  res.writeHead(200, {
    'Content-Type': MIME[extname(file)] ?? 'application/octet-stream',
    'Cache-Control': isAsset ? 'public, max-age=31536000, immutable' : 'no-cache',
  });
  createReadStream(file).pipe(res);
  return true;
}

/** Builds the HTTP server. Kept separate from listen() so tests can use it. */
export function createServer(db, { staticDir } = {}) {
  return createHttpServer((req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');

      if (req.method !== 'GET' && req.method !== 'HEAD') {
        return sendJson(res, 405, { error: 'Method not allowed' });
      }

      if (url.pathname.startsWith('/api/')) {
        switch (url.pathname) {
          case '/api/health':
            return sendJson(res, 200, { status: 'ok' });
          case '/api/regions':
            return sendJson(res, 200, getRegions(db), 300);
          case '/api/kindergartens': {
            const regionId = url.searchParams.get('region') || undefined;
            return sendJson(res, 200, getKindergartens(db, { regionId }), 300);
          }
          case '/api/meta':
            return sendJson(res, 200, {
              lastSyncedAt: getMeta(db, 'lastSyncedAt'),
              source: SOURCE_PAGE_URL,
              rankingsPublished: false,
            });
          default:
            return sendJson(res, 404, { error: 'Not found' });
        }
      }

      if (serveStatic(req, res, staticDir)) return;
      return sendJson(res, 404, { error: 'Not found' });
    } catch (err) {
      console.error(err);
      return sendJson(res, 500, { error: 'Internal server error' });
    }
  });
}
