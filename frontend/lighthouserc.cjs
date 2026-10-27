/**
 * Lighthouse CI: presupuesto de performance del recorrido de compra.
 *
 * Mide el build de producción (`dist/`) servido por `scripts/lhci-server.mjs`
 * (API mockeada en el mismo origen, gzip). Perfil mobile por defecto de
 * Lighthouse (Moto G Power, 4G lenta simulada, CPU ×4): es el tráfico real,
 * que llega desde Instagram/Facebook en el celular.
 *
 * Cualquier host externo se resuelve a "no encontrado" para que la medición
 * no dependa de la red ni de CDNs de terceros: lo que se mide es el código.
 *
 *   npm run build && npm run lhci
 */
const PORT = 4180;
const BASE = `http://localhost:${PORT}`;

module.exports = {
  ci: {
    collect: {
      startServerCommand: `node scripts/lhci-server.mjs --port=${PORT}`,
      startServerReadyPattern: 'lhci-server listo',
      url: [
        `${BASE}/`,
        `${BASE}/products/mock-producto`,
        `${BASE}/lp/escultor-led`,
        `${BASE}/cart`,
      ],
      // Mediana de 3 corridas por URL: suficiente para que el ruido del
      // runner no haga fallar el job.
      numberOfRuns: 3,
      settings: {
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        // Un solo string: Lighthouse lo parsea respetando las comillas.
        chromeFlags:
          '--headless=new --no-sandbox ' +
          '--host-resolver-rules="MAP * ~NOTFOUND, EXCLUDE localhost, EXCLUDE 127.0.0.1"',
      },
    },
    assert: {
      // Techos de regresión, no objetivos: están un ~15 % por encima de lo
      // medido el 2026-10-27 (tabla en el README). `error` = falla el job;
      // `warn` = se ve en el log. Lo determinista (pesos, CLS, LCP simulado)
      // es error; lo que depende de la CPU del runner (TBT, score) es warn.
      assertMatrix: [
        {
          matchingUrlPattern: '.*',
          assertions: {
            'resource-summary:script:size': ['error', { maxNumericValue: 280 * 1024, aggregationMethod: 'median' }],
            'resource-summary:stylesheet:size': ['error', { maxNumericValue: 50 * 1024, aggregationMethod: 'median' }],
            'resource-summary:total:size': ['error', { maxNumericValue: 550 * 1024, aggregationMethod: 'median' }],
            'largest-contentful-paint': ['error', { maxNumericValue: 5000, aggregationMethod: 'median' }],
            'total-blocking-time': ['warn', { maxNumericValue: 600, aggregationMethod: 'median' }],
            'categories:performance': ['warn', { minScore: 0.6, aggregationMethod: 'median' }],
            'categories:accessibility': ['error', { minScore: 0.9, aggregationMethod: 'median' }],
            'categories:best-practices': ['warn', { minScore: 0.9, aggregationMethod: 'median' }],
          },
        },
        {
          // El carrito es noindex a propósito (RouteSeo): SEO no aplica.
          matchingUrlPattern: '^(?!.*/cart$).*',
          assertions: {
            'categories:seo': ['error', { minScore: 0.9, aggregationMethod: 'median' }],
          },
        },
        {
          // Las entradas que coinciden se suman (no se pisan): por eso el CLS
          // de error excluye la ficha en vez de bajarlo a warn más abajo.
          matchingUrlPattern: '^(?!.*/products/).*',
          assertions: {
            'cumulative-layout-shift': ['error', { maxNumericValue: 0.1, aggregationMethod: 'median' }],
          },
        },
        {
          // CLS 1,3 conocido en la ficha (el footer se ve mientras carga el
          // producto y después baja): tarea en NIGHTLY.md. Al arreglarlo,
          // borrar este bloque y la exclusión de arriba.
          matchingUrlPattern: '/products/',
          assertions: {
            'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1, aggregationMethod: 'median' }],
          },
        },
      ],
    },
    upload: {
      // Reportes HTML en .lighthouseci/ (en CI se suben como artifact).
      target: 'filesystem',
      outputDir: '.lighthouseci/reports',
    },
  },
};
