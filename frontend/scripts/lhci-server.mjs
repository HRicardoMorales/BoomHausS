/**
 * Servidor para Lighthouse CI: sirve `dist/` y la API mockeada desde el
 * MISMO origen, sin tocar el backend real.
 *
 * Por qué no `vite preview` + `page.route` como en a11y/smoke: Lighthouse
 * abre su propia pestaña y no hay forma de interceptar sus pedidos. Entonces
 * el servidor reescribe, solo en lo que sirve, la URL absoluta del backend
 * (`services/api.js`) por `/api`, y contesta `/api/*` con los mismos
 * fixtures del arnés. El `dist/` en disco no se modifica.
 *
 * Comprime con gzip como lo haría el CDN, para que los pesos que mide
 * Lighthouse (transfer size) sean comparables con producción.
 *
 *   node scripts/lhci-server.mjs [--port=4180]
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
import { makeFixtures, mockApi, parseArgs } from './lib/harness.mjs';

const args = parseArgs();
const PORT = Number(args.port ?? 4180);
const DIST = resolve(import.meta.dirname, '../dist');
const BACKEND = 'https://boomhauss.onrender.com/api';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
  '.webmanifest': 'application/manifest+json',
};
const COMPRESSIBLE = new Set(['.html', '.js', '.css', '.json', '.svg', '.txt', '.xml', '.webmanifest']);

const fixtures = makeFixtures({ realistic: true });
const cache = new Map();

async function load(file) {
  if (cache.has(file)) return cache.get(file);
  let body = await readFile(file);
  const ext = extname(file);
  if (ext === '.js' && body.includes(BACKEND)) {
    body = Buffer.from(body.toString('utf8').replaceAll(BACKEND, '/api'));
  }
  const entry = { body, gz: COMPRESSIBLE.has(ext) ? gzipSync(body, { level: 9 }) : null, ext };
  cache.set(file, entry);
  return entry;
}

async function resolveFile(pathname) {
  const file = normalize(join(DIST, decodeURIComponent(pathname)));
  if (!file.startsWith(DIST)) return null;
  try {
    if ((await stat(file)).isFile()) return file;
  } catch { /* no existe: SPA */ }
  // Rutas de la SPA (sin extensión) → index.html; un asset que falta → 404.
  return extname(pathname) ? null : join(DIST, 'index.html');
}

function send(req, res, status, { body, gz, ext }, headers = {}) {
  const useGz = gz && /\bgzip\b/.test(req.headers['accept-encoding'] ?? '');
  res.writeHead(status, {
    'content-type': TYPES[ext] ?? 'application/octet-stream',
    // Assets con hash: caché larga, como en Vercel. El HTML siempre fresco.
    'cache-control': req.url.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache',
    ...(useGz ? { 'content-encoding': 'gzip', vary: 'accept-encoding' } : {}),
    ...headers,
  });
  res.end(useGz ? gz : body);
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (url.pathname.startsWith('/api/')) {
    const body = Buffer.from(JSON.stringify(mockApi(url.href, fixtures)));
    return send(req, res, 200, { body, gz: gzipSync(body), ext: '.json' }, { 'cache-control': 'no-store' });
  }
  const file = await resolveFile(url.pathname);
  if (!file) {
    res.writeHead(404).end('not found');
    return;
  }
  try {
    send(req, res, 200, await load(file));
  } catch {
    res.writeHead(500).end('error');
  }
});

server.listen(PORT, () => {
  // LHCI espera este texto (`startServerReadyPattern`) antes de medir.
  console.log(`lhci-server listo en http://localhost:${PORT}`);
});
