/**
 * Resume las corridas de Lighthouse CI (`.lighthouseci/lhr-*.json`) en una
 * tabla Markdown: mediana por URL de puntajes, Web Vitals de laboratorio y
 * pesos transferidos. En CI se agrega al job summary; local se imprime.
 *
 *   node scripts/lhci-summary.mjs >> "$GITHUB_STEP_SUMMARY"
 */
import { readdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const DIR = resolve(import.meta.dirname, '../.lighthouseci');

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const kb = (bytes) => `${(bytes / 1024).toFixed(1)}`;
const ms = (v) => (v >= 1000 ? `${(v / 1000).toFixed(2)} s` : `${Math.round(v)} ms`);

function metrics(lhr) {
  const a = lhr.audits;
  const items = a['resource-summary']?.details?.items ?? [];
  const size = (t) => items.find((i) => i.resourceType === t)?.transferSize ?? 0;
  const score = (k) => Math.round((lhr.categories[k]?.score ?? 0) * 100);
  return {
    perf: score('performance'),
    a11y: score('accessibility'),
    bp: score('best-practices'),
    seo: score('seo'),
    fcp: a['first-contentful-paint'].numericValue,
    lcp: a['largest-contentful-paint'].numericValue,
    tbt: a['total-blocking-time'].numericValue,
    cls: a['cumulative-layout-shift'].numericValue,
    js: size('script'),
    css: size('stylesheet'),
    total: size('total'),
  };
}

const files = (await readdir(DIR)).filter((f) => /^lhr-.*\.json$/.test(f));
if (!files.length) {
  console.error('No hay corridas en .lighthouseci/ (¿corriste npm run lhci?)');
  process.exit(1);
}

const byUrl = new Map();
for (const f of files) {
  const lhr = JSON.parse(await readFile(join(DIR, f), 'utf8'));
  if (lhr.runtimeError) continue;
  const path = new URL(lhr.requestedUrl).pathname;
  if (!byUrl.has(path)) byUrl.set(path, []);
  byUrl.get(path).push(metrics(lhr));
}

const rows = [...byUrl].map(([path, runs]) => {
  const m = (k) => median(runs.map((r) => r[k]));
  return `| \`${path}\` | ${m('perf')} | ${m('a11y')} | ${m('bp')} | ${m('seo')} | ${ms(m('fcp'))} | ${ms(m('lcp'))} | ${ms(m('tbt'))} | ${m('cls').toFixed(3)} | ${kb(m('js'))} | ${kb(m('css'))} | ${kb(m('total'))} |`;
});

console.log(`### Lighthouse (mobile simulado, mediana de ${Math.max(...[...byUrl.values()].map((r) => r.length))} corridas)

| Ruta | Perf | A11y | BP | SEO | FCP | LCP | TBT | CLS | JS KB | CSS KB | Total KB |
|---|---|---|---|---|---|---|---|---|---|---|---|
${rows.join('\n')}

Pesos transferidos (gzip). API mockeada en el mismo origen y hosts externos bloqueados: mide el código, no la red ni los CDNs.`);
