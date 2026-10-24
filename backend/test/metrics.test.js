// Métricas del dashboard: rangos en hora argentina, pipelines de agregación,
// armado de respuestas (mismo contrato que antes) y las rutas con validación.

const { describe, it, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { app, setDbReady, tokenFor } = require('./setup');
const Order = require('../src/models/order');
const m = require('../src/services/metrics');

// Viernes 23/10/2026 01:30 en Buenos Aires (04:30 UTC).
const NOW = new Date('2026-10-23T04:30:00Z');

describe('getRange (hora argentina)', () => {
  it('"hoy" arranca a las 00:00 de Buenos Aires (03:00 UTC), no a medianoche UTC', () => {
    const r = m.getRange('hoy', NOW);
    assert.equal(r.start.toISOString(), '2026-10-23T03:00:00.000Z');
    assert.equal(r.end.getTime(), NOW.getTime());
  });

  it('a las 22:00 AR el día sigue siendo el mismo aunque en UTC ya sea mañana', () => {
    const r = m.getRange('hoy', new Date('2026-10-24T01:00:00Z')); // 23/10 22:00 AR
    assert.equal(r.start.toISOString(), '2026-10-23T03:00:00.000Z');
  });

  it('7d = hoy + 6 días; 30d = hoy + 29; mes = día 1 (cruza meses bien)', () => {
    assert.equal(m.getRange('7d', NOW).start.toISOString(), '2026-10-17T03:00:00.000Z');
    assert.equal(m.getRange('30d', NOW).start.toISOString(), '2026-09-24T03:00:00.000Z');
    assert.equal(m.getRange('mes', NOW).start.toISOString(), '2026-10-01T03:00:00.000Z');
    assert.equal(m.getRange('7d', new Date('2026-03-03T15:00:00Z')).startKey, '2026-02-25');
  });

  it('el período anterior dura lo mismo y termina donde empieza el actual', () => {
    const r = m.getRange('7d', NOW);
    assert.equal(r.prevEnd.getTime(), r.start.getTime());
    assert.equal(r.start.getTime() - r.prevStart.getTime(), r.end.getTime() - r.start.getTime());
  });
});

describe('pipelines (puros)', () => {
  it('kpis: un solo $match que cubre los dos períodos y un $group por período', () => {
    const r = m.getRange('7d', NOW);
    const [match, group] = m.kpisPipeline(r);
    assert.deepEqual(match.$match.createdAt, { $gte: r.prevStart, $lte: r.end });
    assert.deepEqual(group.$group._id, { $cond: [{ $gte: ['$createdAt', r.start] }, 'cur', 'prev'] });
    assert.deepEqual(Object.keys(group.$group).sort(),
      ['_id', 'completados', 'iniciados', 'pending', 'review', 'shipped', 'ventas']);
  });

  it('chart: agrupa por hora o por día con la zona horaria de la tienda', () => {
    const r = m.getRange('hoy', NOW);
    const [match, group] = m.chartPipeline(r, 'hoy');
    assert.deepEqual(match.$match.createdAt, { $gte: r.start, $lte: r.end });
    assert.equal(group.$group._id.$dateToString.format, '%H');
    assert.equal(group.$group._id.$dateToString.timezone, 'America/Argentina/Buenos_Aires');
    assert.equal(m.chartPipeline(r, '7d')[1].$group._id.$dateToString.format, '%Y-%m-%d');
  });
});

describe('buildKpis', () => {
  it('mismo contrato que antes: totales, variaciones, conversión y conteos', () => {
    const k = m.buildKpis([
      { _id: 'cur', iniciados: 8, completados: 3, ventas: 45000.4, review: 2, pending: 3, shipped: 1 },
      { _id: 'prev', iniciados: 4, completados: 3, ventas: 30000, review: 0, pending: 1, shipped: 0 },
    ]);
    assert.deepEqual(k, {
      ventas: 45000, ventas_change: 50,
      pagos_iniciados: 8, pagos_iniciados_change: 100,
      pagos_completados: 3, pagos_completados_change: 0,
      conversion: 37.5,
      review_count: 2, pending_count: 3, shipped_count: 1,
    });
  });

  it('sin pedidos (o sin período anterior) no divide por cero', () => {
    const empty = m.buildKpis([]);
    assert.equal(empty.conversion, 0);
    assert.equal(empty.ventas_change, 0);
    assert.equal(m.buildKpis([{ _id: 'cur', iniciados: 2, completados: 1, ventas: 100 }]).ventas_change, 100);
  });
});

describe('buildChart', () => {
  it('hoy: una barra por hora hasta la actual (hora argentina)', () => {
    const now = new Date('2026-10-23T05:10:00Z'); // 02:10 AR
    const c = m.buildChart([{ _id: '01', iniciados: 2, completados: 1 }], 'hoy', m.getRange('hoy', now));
    assert.deepEqual(c, { labels: ['0h', '1h', '2h'], serie_iniciados: [0, 2, 0], serie_completados: [0, 1, 0] });
  });

  it('7d: 7 días terminando hoy, con nombre del día', () => {
    const c = m.buildChart(
      [{ _id: '2026-10-17', iniciados: 1, completados: 0 }, { _id: '2026-10-23', iniciados: 4, completados: 2 }],
      '7d', m.getRange('7d', NOW),
    );
    assert.deepEqual(c.labels, ['Sáb', 'Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie']);
    assert.deepEqual(c.serie_iniciados, [1, 0, 0, 0, 0, 0, 4]);
    assert.deepEqual(c.serie_completados, [0, 0, 0, 0, 0, 0, 2]);
  });

  it('30d: 4 semanas, la última absorbe los días que sobran', () => {
    const c = m.buildChart(
      [
        { _id: '2026-09-24', iniciados: 1, completados: 1 }, // día 0 → S1
        { _id: '2026-10-01', iniciados: 2, completados: 0 }, // día 7 → S2
        { _id: '2026-10-23', iniciados: 5, completados: 3 }, // día 29 → S4
      ],
      '30d', m.getRange('30d', NOW),
    );
    assert.deepEqual(c, { labels: ['S1', 'S2', 'S3', 'S4'], serie_iniciados: [1, 2, 0, 5], serie_completados: [1, 0, 0, 3] });
  });
});

describe('toPaymentRow', () => {
  it('nombre + inicial, producto sin variante y método legible', () => {
    const row = m.toPaymentRow({
      _id: '64b7f0c2a1b2c3d4e5f6abcd', customerName: '  Ana  María Pérez ',
      items: [{ name: 'Lámpara — Pack x2' }], paymentMethod: 'mercadopago',
      totalAmount: 25990, paymentStatus: 'approved',
    });
    assert.equal(row.id, 'F6ABCD');
    assert.equal(row.name, 'Ana P.');
    assert.equal(row.meta, 'Lámpara · MercadoPago');
    assert.match(row.amount, /^\$\s?25\.990$/);
    assert.deepEqual([row.status, row.label], ['success', 'Aprobado']);
  });
});

describe('rutas /api/metrics', () => {
  afterEach(() => mock.restoreAll());
  const admin = () => `Bearer ${tokenFor('admin')}`;

  it('kpis usa aggregate (no trae pedidos a memoria) y responde el contrato', async () => {
    setDbReady(true);
    const agg = mock.method(Order, 'aggregate', async () => [{ _id: 'cur', iniciados: 2, completados: 1, ventas: 1000 }]);
    const find = mock.method(Order, 'find', () => { throw new Error('no debería usar find'); });
    const res = await request(app).get('/api/metrics/kpis?range=30d').set('Authorization', admin());
    assert.equal(res.status, 200);
    assert.equal(res.body.pagos_iniciados, 2);
    assert.equal(res.body.conversion, 50);
    assert.equal(agg.mock.callCount(), 1);
    assert.equal(find.mock.callCount(), 0);
  });

  it('sin range usa 7 días', async () => {
    setDbReady(true);
    mock.method(Order, 'aggregate', async () => []);
    const res = await request(app).get('/api/metrics/chart').set('Authorization', admin());
    assert.equal(res.status, 200);
    assert.equal(res.body.labels.length, 7);
  });

  it('range inválido → 400 con el contrato de validación', async () => {
    setDbReady(true);
    const agg = mock.method(Order, 'aggregate', async () => []);
    const res = await request(app).get('/api/metrics/kpis?range=1y').set('Authorization', admin());
    assert.equal(res.status, 400);
    assert.equal(res.body.ok, false);
    assert.ok(res.body.fields.range);
    assert.equal(agg.mock.callCount(), 0);
  });

  it('payments pide solo 10 pedidos con proyección', async () => {
    setDbReady(true);
    const calls = {};
    const chain = {
      select(f) { calls.select = f; return chain; },
      sort(s) { calls.sort = s; return chain; },
      limit(n) { calls.limit = n; return chain; },
      lean: async () => [{ _id: 'abc123', customerName: 'Juan', items: [], totalAmount: 10, paymentStatus: 'pending' }],
    };
    mock.method(Order, 'find', () => chain);
    const res = await request(app).get('/api/metrics/payments?range=hoy').set('Authorization', admin());
    assert.equal(res.status, 200);
    assert.equal(res.body.payments[0].label, 'Pendiente');
    assert.deepEqual(calls.sort, { createdAt: -1 });
    assert.equal(calls.limit, 10);
    assert.match(calls.select, /totalAmount/);
  });

  it('si Mongo falla responde 500 sin filtrar el error', async () => {
    setDbReady(true);
    mock.method(Order, 'aggregate', async () => { throw new Error('boom secreto'); });
    const res = await request(app).get('/api/metrics/kpis').set('Authorization', admin());
    assert.equal(res.status, 500);
    assert.deepEqual(res.body, { ok: false, message: 'Error al obtener KPIs' });
  });

  it('sin sesión 401 y con usuario común 403; las rutas viejas sin uso ya no existen', async () => {
    setDbReady(true);
    assert.equal((await request(app).get('/api/metrics/kpis')).status, 401);
    const user = await request(app).get('/api/metrics/kpis').set('Authorization', `Bearer ${tokenFor('user')}`);
    assert.equal(user.status, 403);
    const pages = await request(app).get('/api/metrics/pages').set('Authorization', admin());
    assert.equal(pages.status, 404);
  });
});
