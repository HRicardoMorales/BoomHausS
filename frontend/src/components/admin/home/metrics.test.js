import { describe, expect, it } from 'vitest';
import { axisLabels, describeChange, describeSeries, kpiCards, money, normalizeMetrics, sparklineGeometry, statusCards } from './metrics.js';

describe('normalizeMetrics', () => {
  it('convierte las respuestas peladas en números y arrays seguros', () => {
    const d = normalizeMetrics(
      { ventas: '1500', ventas_change: 12.5, pagos_iniciados: 4, pagos_completados: '3', conversion: 75, review_count: -2 },
      { labels: ['a', 'b'], serie_completados: [1, '2', 3] },
      { payments: [{ id: 7, name: 'Ana', status: 'raro' }, null] },
    );
    expect(d.kpis).toMatchObject({ ventas: 1500, ventasChange: 12.5, iniciados: 4, completados: 3, conversion: 75, review: 0, iniciadosChange: null });
    expect(d.chart).toEqual({ labels: ['a', 'b'], serie: [1, 2] });
    expect(d.payments).toEqual([{ id: '7', name: 'Ana', meta: '', amount: '', status: 'pending', label: 'Pendiente' }]);
  });

  it('respuestas vacías o basura → ceros, sin tirar', () => {
    const d = normalizeMetrics(undefined, 'x', { payments: 'no' });
    expect(d.kpis.ventas).toBe(0);
    expect(d.chart).toEqual({ labels: [], serie: [] });
    expect(d.payments).toEqual([]);
    expect(kpiCards(d.kpis).map((c) => c.value)).toEqual([money(0), '0', '0', '0%']);
    expect(statusCards(d.kpis)).toHaveLength(4);
  });
});

describe('describeChange', () => {
  it('oculta 0 / null y describe la dirección para lectores de pantalla', () => {
    expect(describeChange(0)).toBeNull();
    expect(describeChange(null)).toBeNull();
    expect(describeChange(-5.04)).toEqual({ direction: 'down', text: '5%', srText: 'Bajó 5% respecto del período anterior' });
    expect(describeChange(12.46).text).toBe('12.5%');
  });
});

describe('sparkline', () => {
  it('necesita 2 puntos y normaliza al máximo', () => {
    expect(sparklineGeometry([3])).toBeNull();
    const g = sparklineGeometry([0, 10], { width: 100, height: 50, pad: 0 });
    expect(g.line).toBe('0,50 100,0');
    expect(g.area).toBe('M0,50 L0,50 L100,0 L100,50 Z');
  });
  it('serie toda en 0 no divide por cero', () => {
    const g = sparklineGeometry([0, 0, 0], { height: 50, pad: 0 });
    expect(g.line).not.toMatch(/NaN|Infinity/);
  });
  it('eje: primero, medio (si hay más de 4) y último', () => {
    expect(axisLabels([])).toEqual([]);
    expect(axisLabels(['a', 'b', 'c'])).toEqual(['a', 'c']);
    expect(axisLabels(['1', '2', '3', '4', '5', '6', '7'])).toEqual(['1', '4', '7']);
  });
  it('resume la serie en palabras', () => {
    expect(describeSeries([], [])).toBe('Sin datos en el período');
    expect(describeSeries(['lun', 'mar'], [1, 4])).toBe('5 pedidos completados en el período; el pico fue 4 en mar');
  });
});
