/**
 * Arnés compartido por los scripts de navegador (a11y, screenshots):
 * levanta `vite preview` sobre `dist/`, mockea la API y decide qué hacer
 * con los pedidos externos. Nada de esto toca el backend real.
 */
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

export function parseArgs(argv = process.argv.slice(2)) {
  return Object.fromEntries(
    argv.map((a) => {
      // Solo el primer "=" separa: las rutas pueden traer query (?a=1&b=2).
      const [k, ...rest] = a.replace(/^--/, '').split('=');
      return [k, rest.length ? rest.join('=') : true];
    }),
  );
}

// ── Imágenes de ejemplo ──────────────────────────────────────────────────
const svgUri = (svg) => 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);

/** Pixel liso: alcanza para axe, que no mira el contenido de las imágenes. */
const PIXEL = svgUri(
  '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><rect width="600" height="600" fill="#e8dcd4"/></svg>',
);

const PALETTES = [
  ['#f3e7df', '#d9b8a6', '#8a5a44'],
  ['#e9eef0', '#b9c9cf', '#3f5d68'],
  ['#f1ece4', '#d8c7a8', '#7a6542'],
  ['#efe6ee', '#cfb3cc', '#6b4466'],
  ['#e8efe8', '#b5ccb6', '#3e6043'],
  ['#f4e9e4', '#e2b7a8', '#9b4f3a'],
];

/**
 * "Foto de producto" vectorial: fondo de estudio, sombra y un frasco o
 * dispositivo estilizado. Determinista por índice, sin depender de CDNs.
 */
function productFixture(i = 0, { w = 800, h = 800 } = {}) {
  const [bg, mid, ink] = PALETTES[i % PALETTES.length];
  const cx = w / 2;
  const s = Math.min(w, h) / 800;
  const bottle = i % 2 === 0;
  const body = bottle
    ? `<rect x="${cx - 95 * s}" y="${h * 0.28}" width="${190 * s}" height="${h * 0.48}" rx="${46 * s}" fill="url(#g)"/>
       <rect x="${cx - 42 * s}" y="${h * 0.2}" width="${84 * s}" height="${h * 0.09}" rx="${12 * s}" fill="${ink}"/>
       <rect x="${cx - 60 * s}" y="${h * 0.44}" width="${120 * s}" height="${h * 0.14}" rx="${8 * s}" fill="${bg}" opacity=".85"/>`
    : `<rect x="${cx - 70 * s}" y="${h * 0.22}" width="${140 * s}" height="${h * 0.56}" rx="${70 * s}" fill="url(#g)"/>
       <circle cx="${cx}" cy="${h * 0.34}" r="${38 * s}" fill="${bg}" opacity=".9"/>
       <circle cx="${cx}" cy="${h * 0.34}" r="${18 * s}" fill="${ink}" opacity=".8"/>`;
  return svgUri(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs>
      <radialGradient id="bg" cx="50%" cy="38%" r="75%"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="${bg}"/></radialGradient>
      <linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="${mid}"/><stop offset=".55" stop-color="${ink}"/><stop offset="1" stop-color="${mid}"/></linearGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#bg)"/>
    <ellipse cx="${cx}" cy="${h * 0.79}" rx="${150 * s}" ry="${18 * s}" fill="${ink}" opacity=".18"/>
    ${body}
  </svg>`);
}

// ── API mockeada ─────────────────────────────────────────────────────────
const NAMES = [
  'Sérum facial con ácido hialurónico',
  'Masajeador facial de iones',
  'Kit de belleza 6 en 1',
  'Escultor LED de contorno',
  'Depiladora IPL',
  'Parches detox',
  'Masajeador EMS de ojos',
  'Crema reparadora nocturna',
];

function makeProduct(i, slug = `mock-producto-${i}`, { realistic = false } = {}) {
  const img = realistic ? [productFixture(i), productFixture(i + 1)] : [PIXEL, PIXEL];
  return {
    _id: `64b0000000000000000000${String(i).padStart(2, '0')}`,
    name: realistic ? NAMES[(i - 1) % NAMES.length] : `Producto de ejemplo ${i}`,
    slug,
    description: realistic
      ? 'Fórmula liviana de absorción rápida, pensada para el uso diario sin dejar sensación grasa.\n\n'
        + 'Qué incluye:\n- Frasco de 50 ml con dosificador\n- Guía de uso paso a paso\n- Garantía de 30 días\n\n'
        + 'Aplicar mañana y noche sobre la piel limpia y seca.'
      : 'Descripción de ejemplo para la auditoría de accesibilidad.',
    price: 19999 + i * 1000,
    compareAtPrice: 34999 + i * 1000,
    category: 'belleza',
    images: img,
    imageUrl: img[0],
    stock: 25,
    isActive: true,
    variants: [],
  };
}

export function makeFixtures({ realistic = false } = {}) {
  const products = Array.from({ length: 8 }, (_, i) => makeProduct(i + 1, undefined, { realistic }));
  const cart = [{ ...products[0], productId: products[0]._id, quantity: 1 }];
  const day = 864e5;
  const orders = [
    { id: 'a1f09c3e', days: 1, pay: 'pending', ship: 'pending', items: [0], qty: 1 },
    { id: 'b7d21e90', days: 6, pay: 'confirmed', ship: 'shipped', items: [1, 2], qty: 2 },
    { id: 'c3e88f14', days: 21, pay: 'confirmed', ship: 'delivered', items: [3], qty: 1 },
  ].map((o) => {
    const items = o.items.map((k) => ({
      productId: products[k]._id,
      name: products[k].name,
      price: products[k].price,
      compareAtPrice: products[k].compareAtPrice,
      imageUrl: products[k].images[0],
      quantity: o.qty,
    }));
    return {
      _id: `64c00000000000000000${o.id}`,
      createdAt: new Date(Date.now() - o.days * day).toISOString(),
      paymentStatus: o.pay,
      shippingStatus: o.ship,
      paymentMethod: 'transfer',
      shippingMethod: 'domicilio',
      shippingAddress: 'Av. Corrientes 1234, CABA',
      totalAmount: items.reduce((t, it) => t + it.price * it.quantity, 0),
      items,
    };
  });
  return { products, cart, orders };
}

function mockApi(url, fx = makeFixtures()) {
  const { pathname } = new URL(url);
  const path = pathname.replace(/^\/api/, '');
  const slug = path.match(/^\/products\/slug\/([^/]+)/)?.[1];
  const realistic = fx.products[0].images[0] !== PIXEL;
  if (slug) return { ok: true, data: makeProduct(1, slug, { realistic }) };
  if (/^\/products\/[^/]+$/.test(path) && !path.endsWith('/all')) {
    return { ok: true, data: makeProduct(1, 'mock-producto', { realistic }) };
  }
  if (path.startsWith('/products')) return { ok: true, data: fx.products };
  if (path === '/orders/my') return { ok: true, data: fx.orders };
  return { ok: true, data: [] };
}

/**
 * Enruta todos los pedidos de la página:
 * - mismo origen y data: → pasan;
 * - /api/ → JSON mockeado;
 * - imágenes externas → `externalImages`: 'abort' | 'fixture' | 'live';
 * - el resto (píxeles, CDNs de video) → abortado, salvo `live`.
 */
export async function routeRequests(page, { base, fixtures, externalImages = 'abort' }) {
  let n = 0;
  await page.route('**/*', async (r) => {
    const req = r.request();
    const url = req.url();
    if (url.startsWith(base) || url.startsWith('data:')) return r.continue();
    if (/\/api\//.test(url)) {
      return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockApi(url, fixtures)) });
    }
    if (req.resourceType() === 'image') {
      if (externalImages === 'live') return r.continue().catch(() => {});
      if (externalImages === 'fixture') {
        const svg = decodeURIComponent(productFixture(n++).split(',')[1]);
        return r.fulfill({ status: 200, contentType: 'image/svg+xml', body: svg });
      }
    }
    return r.abort();
  });
}

// ── Servidor ─────────────────────────────────────────────────────────────
export async function startPreview(port) {
  const base = `http://localhost:${port}`;
  // Grupo de procesos propio: `npx` lanza a vite como hijo, y matar solo a
  // npx dejaba el servidor vivo y al script colgado al terminar.
  const child = spawn('npx', ['vite', 'preview', '--port', String(port), '--strictPort'], {
    stdio: 'ignore',
    detached: true,
  });
  const proc = {
    kill() {
      try { process.kill(-child.pid, 'SIGTERM'); } catch { /* ya terminó */ }
    },
  };
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(base)).ok) return { proc, base };
    } catch { /* todavía no levantó */ }
    await sleep(250);
  }
  proc.kill();
  throw new Error(`vite preview no respondió en ${base} (¿corriste npm run build?)`);
}
