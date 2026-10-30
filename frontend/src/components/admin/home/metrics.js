// frontend/src/components/admin/home/metrics.js
// Lógica pura del dashboard del admin: formato, normalización de las tres
// respuestas de /api/metrics y geometría del sparkline. Sin React ni API.
import { moneyARS as money } from '../../../utils/pricing.js';

export const RANGES = [
  { key: 'hoy', label: 'Hoy' },
  { key: '7d', label: '7 días' },
  { key: '30d', label: '30 días' },
  { key: 'mes', label: 'Este mes' },
];

export { money };

const count = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
};
const pct = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const PAYMENT_STATUSES = new Set(['success', 'pending', 'failed']);

/**
 * Las rutas de métricas devuelven el objeto pelado (sin `{ok,data}`) y pueden
 * faltar campos; la vista recibe siempre números y arrays.
 */
export function normalizeMetrics(kpisBody, chartBody, paymentsBody) {
  const k = kpisBody && typeof kpisBody === 'object' ? kpisBody : {};
  const c = chartBody && typeof chartBody === 'object' ? chartBody : {};
  const labels = Array.isArray(c.labels) ? c.labels.map(String) : [];
  const serie = Array.isArray(c.serie_completados) ? c.serie_completados.map(count) : [];
  const list = Array.isArray(paymentsBody?.payments) ? paymentsBody.payments : [];
  return {
    kpis: {
      ventas: Number(k.ventas) || 0,
      ventasChange: pct(k.ventas_change),
      iniciados: count(k.pagos_iniciados),
      iniciadosChange: pct(k.pagos_iniciados_change),
      completados: count(k.pagos_completados),
      completadosChange: pct(k.pagos_completados_change),
      conversion: pct(k.conversion) ?? 0,
      review: count(k.review_count),
      pending: count(k.pending_count),
      shipped: count(k.shipped_count),
    },
    chart: { labels, serie: serie.slice(0, labels.length || serie.length) },
    payments: list
      .filter((p) => p && typeof p === 'object')
      .map((p, i) => ({
        id: String(p.id ?? i),
        name: String(p.name || 'Sin nombre'),
        meta: String(p.meta || ''),
        amount: String(p.amount ?? ''),
        status: PAYMENT_STATUSES.has(p.status) ? p.status : 'pending',
        label: String(p.label || 'Pendiente'),
      })),
  };
}

/** Variación vs. período anterior: null si no hay dato o es 0 (no se muestra). */
export function describeChange(value) {
  const n = pct(value);
  if (!n) return null;
  const abs = Math.abs(Math.round(n * 10) / 10);
  const up = n > 0;
  return {
    direction: up ? 'up' : 'down',
    text: `${abs}%`,
    srText: `${up ? 'Subió' : 'Bajó'} ${abs}% respecto del período anterior`,
  };
}

export function kpiCards(k) {
  return [
    { key: 'ventas', label: 'Ventas', value: money(k.ventas), change: k.ventasChange, tone: 'green', sub: 'Pagos aprobados' },
    { key: 'iniciados', label: 'Iniciados', value: String(k.iniciados), change: k.iniciadosChange, tone: 'blue', sub: 'Pedidos abiertos' },
    { key: 'completados', label: 'Completados', value: String(k.completados), change: k.completadosChange, tone: 'violet', sub: 'Pagos confirmados' },
    { key: 'conversion', label: 'Conversión', value: `${k.conversion}%`, change: null, tone: 'ink', sub: 'Iniciados → pagados' },
  ];
}

export function statusCards(k) {
  return [
    { key: 'approved', label: 'Aprobados', value: k.completados, tone: 'green' },
    { key: 'review', label: 'A revisar', value: k.review, tone: 'amber' },
    { key: 'pending', label: 'Pendientes', value: k.pending, tone: 'gray' },
    { key: 'shipped', label: 'En camino', value: k.shipped, tone: 'blue' },
  ];
}

/** Primer, medio (si hay más de 4) y último rótulo del eje. */
export function axisLabels(labels) {
  if (!labels?.length) return [];
  if (labels.length === 1) return [labels[0]];
  const out = [labels[0]];
  if (labels.length > 4) out.push(labels[Math.floor(labels.length / 2)]);
  out.push(labels[labels.length - 1]);
  return out;
}

/** Geometría del sparkline en un viewBox W×H. null si no hay al menos 2 puntos. */
export function sparklineGeometry(values, { width = 280, height = 72, pad = 4 } = {}) {
  const vals = (values || []).map(count);
  if (vals.length < 2) return null;
  const max = Math.max(...vals, 1);
  const n = vals.length;
  const r = (x) => Math.round(x * 100) / 100;
  const pts = vals.map((v, i) => ({
    x: r(pad + (i / (n - 1)) * (width - pad * 2)),
    y: r(height - pad - (v / max) * (height - pad * 2)),
  }));
  const line = pts.map((p) => `${p.x},${p.y}`).join(' ');
  const base = height - pad;
  const area = `M${pts[0].x},${base} ${pts.map((p) => `L${p.x},${p.y}`).join(' ')} L${pts[n - 1].x},${base} Z`;
  return { line, area, last: pts[n - 1], max };
}

/** Texto para lectores de pantalla: el gráfico como frase. */
export function describeSeries(labels, values) {
  const vals = (values || []).map(count);
  if (!vals.length) return 'Sin datos en el período';
  const total = vals.reduce((a, b) => a + b, 0);
  const peak = Math.max(...vals);
  const at = labels?.[vals.indexOf(peak)];
  return `${total} pedidos completados en el período${peak > 0 && at ? `; el pico fue ${peak} en ${at}` : ''}`;
}
