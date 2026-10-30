#!/usr/bin/env node
/**
 * Smoke test E2E sobre el build de producción: recorre cada ruta en mobile
 * y desktop, scrollea hasta el final y falla si algo se rompe de forma visible.
 *
 *   npm run build && npm run smoke
 *   npm run smoke -- --routes=/,/cart --widths=390
 *
 * Por ruta y ancho chequea:
 * - React montó (`<main>` presente) y no hubo excepciones sin atrapar (`pageerror`);
 * - sin scroll horizontal (`scrollWidth > innerWidth`), antes y después de
 *   scrollear (las secciones diferidas y los reveals entran al bajar);
 * - sin `id` duplicados (SVGs copiados, `useId` mal usado): rompen `aria-*` y `<label for>`;
 * - exactamente un `<h1>` (solo aviso: no corta el job).
 *
 * Usa el mismo arnés que `npm run a11y`: `vite preview` + API mockeada +
 * hosts externos abortados, así que no toca el backend real.
 * Variables opcionales: CHROMIUM_PATH (binario de Chromium a usar).
 */
import { chromium } from 'playwright-core';
import { makeFixtures, parseArgs, routeRequests, startPreview } from './lib/harness.mjs';

const args = parseArgs();

const STORE_ROUTES = [
  '/',
  '/products',
  '/products/mock-producto',
  '/cart',
  '/checkout',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password/token-de-prueba',
  '/my-orders',
  '/terms',
  '/privacy',
  '/returns',
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
// Las rutas del admin se abren con una sesión falsa (solo en localStorage):
// el guard del frontend la acepta y la API mockeada responde vacío.
const ADMIN_ROUTES = ['/admin', '/admin/orders', '/admin/products', '/admin/coupons'];

const ROUTES = args.routes ? String(args.routes).split(',') : [...STORE_ROUTES, ...ADMIN_ROUTES];
const WIDTHS = String(args.widths || '390,1280').split(',').map(Number);
const PORT = Number(args.port) || 4180;
const BASE = `http://localhost:${PORT}`;
const FIXTURES = makeFixtures();

async function scrollToBottom(page) {
  // `mouse.wheel` y no `scrollTo`: en algunas páginas el que scrollea es el body.
  for (let i = 0; i < 40; i++) {
    const done = await page.evaluate(() => {
      const el = document.scrollingElement || document.documentElement;
      return Math.max(el.scrollTop, document.body.scrollTop) + innerHeight >= Math.max(el.scrollHeight, document.body.scrollHeight) - 4;
    });
    if (done) break;
    await page.mouse.wheel(0, 900);
    await page.waitForTimeout(80);
  }
  await page.waitForTimeout(400);
}

/**
 * Desborde horizontal. `#root` tiene `overflow-x: clip` (ver index.css), así que
 * `scrollWidth` solo ve lo que queda fuera de él (portales, modales); por eso
 * además se buscan elementos que se salen del viewport y que nadie recorta
 * salvo `#root`: eso es contenido cortado en el celular, aunque no haya scroll.
 * Se ignora lo que está dentro de un carrusel/contenedor con overflow propio
 * y lo oculto (drawers fuera de pantalla con `visibility: hidden`, `inert`).
 */
const overflowX = (page) =>
  page.evaluate(() => {
    const vw = innerWidth;
    const root = document.getElementById('root');
    const scroll = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - vw;
    const clippedByAncestor = (el) => {
      for (let p = el.parentElement; p && p !== root; p = p.parentElement) {
        const cs = getComputedStyle(p);
        if (cs.overflowX !== 'visible' || cs.position === 'fixed') return true;
      }
      return false;
    };
    const cut = [];
    for (const el of root?.querySelectorAll('*') ?? []) {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height || (r.right <= vw + 1 && r.left >= -1)) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.position === 'fixed' || el.closest('[inert],[aria-hidden="true"]')) continue;
      if (clippedByAncestor(el)) continue;
      // Solo el más externo: sus hijos se salen por arrastre.
      if (cut.some((c) => c.el.contains(el))) continue;
      const tag = el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/)[0] : '');
      cut.push({ el, desc: `${tag} (${Math.round(r.left)}→${Math.round(r.right)})` });
    }
    return { scroll: scroll > 1 ? scroll : 0, cut: cut.map((c) => c.desc) };
  });

async function check(browser, route, width) {
  const context = await browser.newContext({
    viewport: { width, height: width < 600 ? 844 : 900 },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  });
  const admin = route.startsWith('/admin');
  await context.addInitScript(
    ({ cart, admin }) => {
      try {
        localStorage.setItem('cartItems', JSON.stringify(cart));
        if (admin) localStorage.setItem('auth', JSON.stringify({ token: 'smoke', user: { role: 'admin', name: 'Smoke' } }));
      } catch { /* sin storage */ }
    },
    { cart: FIXTURES.cart, admin },
  );
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  await routeRequests(page, { base: BASE, fixtures: FIXTURES });

  try {
    await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 20_000 });
    await page.waitForTimeout(300);

    const before = await overflowX(page);
    await scrollToBottom(page);
    const after = await overflowX(page);
    const dom = await page.evaluate(() => {
      const seen = new Map();
      for (const el of document.querySelectorAll('[id]')) seen.set(el.id, (seen.get(el.id) || 0) + 1);
      return {
        main: !!document.querySelector('main, [role="main"]'),
        h1: document.querySelectorAll('h1').length,
        dupIds: [...seen].filter(([, n]) => n > 1).map(([id, n]) => `${id}×${n}`),
      };
    });

    if (!dom.main) errors.push('no se montó <main> (¿React no arrancó?)');
    const scroll = Math.max(before.scroll, after.scroll);
    if (scroll) errors.push(`scroll horizontal de ${scroll}px${before.scroll ? '' : ' (aparece al scrollear)'}`);
    const cut = [...new Set([...before.cut, ...after.cut])];
    if (cut.length) errors.push(`contenido cortado por el borde: ${cut.slice(0, 4).join(', ')}`);
    if (dom.dupIds.length) errors.push(`ids duplicados: ${dom.dupIds.slice(0, 6).join(', ')}`);
    const warnings = dom.h1 === 1 ? [] : [`${dom.h1} <h1>`];
    return { errors, warnings };
  } catch (e) {
    return { errors: [...errors, `no cargó: ${e.message.split('\n')[0]}`], warnings: [] };
  } finally {
    await context.close();
  }
}

const { proc: preview } = await startPreview(PORT);
const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
);

let failing = 0;
const t0 = Date.now();
try {
  for (const route of ROUTES) {
    for (const width of WIDTHS) {
      const { errors, warnings } = await check(browser, route, width);
      if (errors.length) failing += 1;
      const mark = errors.length ? '✗' : '✓';
      const note = warnings.length ? `  · aviso: ${warnings.join(', ')}` : '';
      console.log(`${mark} ${route.padEnd(38)} ${String(width).padStart(4)}px${note}`);
      for (const e of errors) console.log(`    ${e}`);
    }
  }
} finally {
  await browser.close();
  preview.kill();
}

const total = ROUTES.length * WIDTHS.length;
console.log(`\n${total - failing}/${total} OK en ${((Date.now() - t0) / 1000).toFixed(1)} s`);
if (failing) process.exit(1);
