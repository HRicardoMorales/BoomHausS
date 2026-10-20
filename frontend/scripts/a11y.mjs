#!/usr/bin/env node
/**
 * Auditoría de accesibilidad con axe-core sobre el build de producción.
 *
 *   npm run build && npm run a11y
 *   npm run a11y -- --routes=/,/cart --width=1280 --all
 *
 * - Sirve `dist/` con `vite preview` en un puerto libre.
 * - Mockea la API (no toca el backend real) y bloquea hosts externos
 *   (píxeles, CDNs de video) para que el resultado sea determinista.
 * - Corre axe con las reglas WCAG 2.0/2.1 A + AA y lista las violaciones.
 * - Sale con código 1 si hay violaciones `serious` o `critical`
 *   (con `--all`, cualquier impacto), para poder usarlo en CI.
 *
 * Variables opcionales: CHROMIUM_PATH (binario de Chromium a usar).
 */
import { chromium } from 'playwright-core';
import { AxeBuilder } from '@axe-core/playwright';
import { makeFixtures, parseArgs, routeRequests, startPreview } from './lib/harness.mjs';

const args = parseArgs();

const DEFAULT_ROUTES = [
  '/',
  '/products',
  '/products/mock-producto',
  '/cart',
  '/checkout',
  '/ruta-que-no-existe',
  '/lp/sillon-puff-inflable',
  '/lp/masajeador-ems-eyes',
  '/lp/depiladora-ipl',
  '/lp/parches-detox',
  '/lp/mundial-revendedores',
  '/lp/kit-belleza-6en1',
  '/lp/masajeador-facial-iones-lambo',
  '/lp/escultor-led',
  '/lp/antimoho-pisos',
];
const ROUTES = args.routes ? String(args.routes).split(',') : DEFAULT_ROUTES;
const WIDTH = Number(args.width) || 390;
const PORT = Number(args.port) || 4179;
const FAIL_ON = args.all ? null : new Set(['serious', 'critical']);
// axe no mira el contenido de las imágenes: el pixel liso alcanza.
const FIXTURES = makeFixtures();
const BASE = `http://localhost:${PORT}`;

// ── Auditoría ────────────────────────────────────────────────────────────
async function audit(browser, route) {
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: 844 },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  });
  await context.addInitScript((cart) => {
    // Carrito con un producto para que /cart y /checkout no queden vacíos.
    try { localStorage.setItem('cartItems', JSON.stringify(cart)); } catch { /* sin storage */ }
  }, FIXTURES.cart);
  const page = await context.newPage();
  const runtimeErrors = [];
  page.on('pageerror', (e) => runtimeErrors.push(e.message));

  await routeRequests(page, { base: BASE, fixtures: FIXTURES });

  await page.goto(BASE + route, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  const landmarks = await page.evaluate(() => ({
    main: document.querySelectorAll('main, [role="main"]').length,
    h1: document.querySelectorAll('h1').length,
    title: document.title,
  }));

  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
    .analyze();

  await context.close();
  return { route, violations, landmarks, runtimeErrors };
}

const { proc: preview } = await startPreview(PORT);
const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
);

let failing = 0;
const summary = {};
try {
  for (const route of ROUTES) {
    const { violations, landmarks, runtimeErrors } = await audit(browser, route);
    console.log(`\n■ ${route}  ·  ${WIDTH}px  ·  main=${landmarks.main} h1=${landmarks.h1}  ·  "${landmarks.title}"`);
    if (runtimeErrors.length) console.log(`  ⚠ errores de runtime: ${runtimeErrors.join(' | ')}`);
    if (!violations.length) console.log('  ✓ sin violaciones');
    for (const v of violations) {
      const blocks = !FAIL_ON || FAIL_ON.has(v.impact);
      if (blocks) failing += 1;
      summary[v.id] = (summary[v.id] || 0) + v.nodes.length;
      console.log(`  ${blocks ? '✗' : '·'} [${v.impact}] ${v.id} (${v.nodes.length}) — ${v.help}`);
      for (const n of v.nodes.slice(0, args.verbose ? 50 : 3)) {
        // En contraste, axe trae colores y ratio: sirve para corregir sin abrir DevTools.
        const c = v.id === 'color-contrast' ? n.any?.[0]?.data : null;
        const detail = c ? `  (${c.fgColor} sobre ${c.bgColor} = ${c.contrastRatio}:1, pide ${c.expectedContrastRatio})` : '';
        console.log(`      ${n.target.join(' ')}${detail}`);
      }
    }
  }
} finally {
  await browser.close();
  preview.kill();
}

console.log('\nResumen por regla (nodos):', summary);
if (failing) {
  console.log(`\n${failing} violación(es) bloqueantes.`);
  process.exit(1);
}
console.log('\nOK: sin violaciones bloqueantes.');
