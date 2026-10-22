// "Más vendidos": pipeline de agregación (puro), caché y la ruta pública.

const { describe, it, beforeEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { app, setDbReady } = require('./setup');
const Order = require('../src/models/order');
const { bestsellersPipeline, getBestsellerIds, resetBestsellersCache } = require('../src/services/bestsellers');

const NOW = new Date('2026-10-22T12:00:00Z');

describe('bestsellersPipeline (pura)', () => {
  it('solo pedidos pagos de los últimos 90 días, agrupados por producto y ordenados por unidades', () => {
    const [match, unwind, nonEmpty, group, sort, limit] = bestsellersPipeline(NOW);
    assert.deepEqual(match.$match.paymentStatus, { $in: ['approved', 'confirmed'] });
    assert.equal(match.$match.createdAt.$gte.getTime(), NOW.getTime() - 90 * 86400000);
    assert.deepEqual(unwind, { $unwind: '$items' });
    assert.ok(nonEmpty.$match['items.productId']);
    assert.deepEqual(group.$group._id, { $toString: '$items.productId' });
    assert.deepEqual(sort.$sort, { units: -1, orders: -1, _id: 1 });
    assert.equal(limit.$limit, 12);
  });
});

describe('getBestsellerIds', () => {
  beforeEach(() => resetBestsellersCache());

  it('devuelve solo los ids, en orden, y cachea 10 minutos', async () => {
    let calls = 0;
    const OrderModel = { aggregate: async () => { calls += 1; return [{ _id: 'a', units: 9 }, { _id: 'b', units: 3 }]; } };
    assert.deepEqual(await getBestsellerIds({ now: NOW, OrderModel }), ['a', 'b']);
    await getBestsellerIds({ now: new Date(NOW.getTime() + 5 * 60000), OrderModel });
    assert.equal(calls, 1);
    await getBestsellerIds({ now: new Date(NOW.getTime() + 11 * 60000), OrderModel });
    assert.equal(calls, 2);
  });
});

describe('GET /api/products/bestsellers', () => {
  beforeEach(() => resetBestsellersCache());

  it('responde los ids sin unidades y no choca con /:id', async () => {
    setDbReady(true);
    const agg = mock.method(Order, 'aggregate', async () => [{ _id: 'lampara-magnetica', units: 4, orders: 3 }]);
    const res = await request(app).get('/api/products/bestsellers');
    agg.mock.restore();
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { ok: true, data: ['lampara-magnetica'] });
  });
});
