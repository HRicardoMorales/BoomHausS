#!/usr/bin/env node
/**
 * Capturas del build de producción para el README.
 *
 *   npm run build && npm run screenshots
 *   npm run screenshots -- --images=live      # fotos reales (necesita red)
 *   npm run screenshots -- --only=home,ficha --full
 *
 * - Mismo arnés que `a11y.mjs`: `vite preview`, API mockeada, sin backend.
 * - Productos y pedidos de ejemplo con "fotos" vectoriales deterministas;
 *   las imágenes externas de las landings se reemplazan por fixtures
 *   (`--images=fixture`, por defecto) o se bajan de verdad (`--images=live`).
 * - Sesión de cliente falsa en localStorage para mostrar Mis pedidos.
 * - Codifica a WebP dentro del propio Chromium (canvas.toDataURL), sin
 *   sumar dependencias de imágenes al proyecto.
 *
 * Salida: docs/screenshots/<nombre>-<mobile|desktop>.webp
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { makeFixtures, parseArgs, routeRequests, startPreview } from './lib/harness.mjs';

const args = parseArgs();
const PORT = Number(args.port) || 4180;
const IMAGES = ['live', 'fixture', 'abort'].includes(args.images) ? args.images : 'fixture';
const FULL = Boolean(args.full);
const QUALITY = Number(args.quality) || 0.82;
const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../../docs/screenshots');

const SHOTS = [
  { name: 'home', route: '/' },
  { name: 'ficha', route: '/products/mock-producto' },
  { name: 'landing', route: '/lp/escultor-led' },
  { name: 'checkout', route: '/checkout' },
  { name: 'mis-pedidos', route: '/my-orders' },
];
const VIEWPORTS = {
  mobile: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  desktop: { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 },
};

const only = args.only ? new Set(String(args.only).split(',')) : null;
const fixtures = makeFixtures({ realistic: true });

async function shoot(browser, base, shot, device) {
  const context = await browser.newContext({ ...VIEWPORTS[device], reducedMotion: 'reduce', locale: 'es-AR' });
  await context.addInitScript(({ cart }) => {
    try {
      localStorage.setItem('cartItems', JSON.stringify(cart));
      // Sesión de cliente de mentira: solo destraba la ruta privada en el
      // front; la API está mockeada, ningún token llega a un servidor.
      localStorage.setItem('auth', JSON.stringify({
        token: 'demo-token',
        user: { _id: 'demo', name: 'Valentina', email: 'valentina@example.com', role: 'user' },
      }));
    } catch { /* sin storage */ }
  }, { cart: fixtures.cart });

  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await routeRequests(page, { base, fixtures, externalImages: IMAGES });

  await page.goto(base + shot.route, { waitUntil: 'networkidle' });
  // Ocultar overlays flotantes que tapan contenido en una captura estática.
  await page.addStyleTag({ content: '[class*="whatsapp" i],[aria-label*="WhatsApp" i]{display:none!important}' });
  await page.waitForTimeout(800);

  const png = await page.screenshot({ fullPage: FULL, type: 'png' });
  const webp = await page.evaluate(async ({ b64, q }) => {
    const img = new Image();
    img.src = `data:image/png;base64,${b64}`;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    c.getContext('2d').drawImage(img, 0, 0);
    return c.toDataURL('image/webp', q).split(',')[1];
  }, { b64: png.toString('base64'), q: QUALITY });

  const file = resolve(OUT, `${shot.name}-${device}.webp`);
  const buf = Buffer.from(webp, 'base64');
  await writeFile(file, buf);
  await context.close();
  return { file, kb: Math.round(buf.length / 1024), errors };
}

await mkdir(OUT, { recursive: true });
const { proc, base } = await startPreview(PORT);
const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
);

let failed = 0;
try {
  for (const shot of SHOTS.filter((s) => !only || only.has(s.name))) {
    for (const device of Object.keys(VIEWPORTS)) {
      const { file, kb, errors } = await shoot(browser, base, shot, device);
      if (errors.length) failed += 1;
      console.log(`${errors.length ? '✗' : '✓'} ${shot.route} · ${device} → ${file.split('/docs/')[1]} (${kb} KB)`);
      for (const e of errors) console.log(`    error de runtime: ${e}`);
    }
  }
} finally {
  await browser.close();
  proc.kill();
}
process.exit(failed ? 1 : 0);
