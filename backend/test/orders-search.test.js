// Búsqueda (?q=, ?status=) y estadísticas (GET /api/orders/stats) del panel
// de pedidos, del lado del servidor. Sin Mongo: se espía lo que llega al modelo.

const { describe, it, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const mongoose = require('mongoose');
const { app, setDbReady, tokenFor } = require('./setup');
const Order = require('../src/models/order');
const search = require('../src/services/orderSearch');

const admin = () => `Bearer ${tokenFor('admin')}`;
const OID = 'a'.repeat(24);

describe('orderSearch (puro)', () => {
  it('escapeRegex: los metacaracteres se buscan literales', () => {
    const rx = new RegExp(search.escapeRegex('a.b*(c)+[d]?^$|\\'));
    assert.ok(rx.test('a.b*(c)+[d]?^$|\\'));
    assert.ok(!new RegExp(search.escapeRegex('.*')).test('cualquier cosa'));
  });

  it('sin q ni status → {} (no filtra)', () => {
    assert.deepEqual(search.buildOrderFilter(), {});
    assert.deepEqual(search.buildOrderFilter({ q: '   ', status: 'todos' }), {});
    assert.deepEqual(search.buildOrderFilter({ status: 'inventado' }), {});
    assert.deepEqual(search.buildOrderFilter({ q: { $ne: null } }), {});
  });

  it('status solo → igualdad exacta sobre paymentStatus', () => {
    assert.deepEqual(search.buildOrderFilter({ status: 'proof_uploaded' }), { paymentStatus: 'proof_uploaded' });
  });

  it('q → regex escapada, sin mayúsculas, en los campos de contacto y producto', () => {
    const f = search.buildOrderFilter({ q: '  Ana.G  ' });
    assert.deepEqual(Object.keys(f), ['$or']);
    assert.deepEqual(f.$or.map((c) => Object.keys(c)[0]), search.SEARCH_FIELDS);
    for (const c of f.$or) assert.deepEqual(Object.values(c)[0], { $regex: 'Ana\\.G', $options: 'i' });
  });

  it('q con forma de ObjectId también busca por _id (convertido)', () => {
    const f = search.buildOrderFilter({ q: OID.toUpperCase() }, (id) => `oid:${id}`);
    assert.deepEqual(f.$or[0], { _id: `oid:${OID}` });
    assert.equal(f.$or.length, search.SEARCH_FIELDS.length + 1);
  });

  it('q + status → $and; q se corta en MAX_QUERY', () => {
    const f = search.buildOrderFilter({ q: 'x'.repeat(200), status: 'approved' });
    assert.deepEqual(f.$and[0], { paymentStatus: 'approved' });
    assert.equal(f.$and[1].$or[0].customerName.$regex.length, search.MAX_QUERY);
  });

  it('mergeFilters no pisa el $or del cursor con el de la búsqueda', () => {
    const a = { $or: [{ x: 1 }] };
    const b = { $or: [{ y: 2 }] };
    assert.deepEqual(search.mergeFilters(a, b), { $and: [a, b] });
    assert.deepEqual(search.mergeFilters({}, b), b);
    assert.deepEqual(search.mergeFilters(a, null), a);
    assert.deepEqual(search.mergeFilters({}, null), {});
  });

  it('statsPipeline: un solo $group, con $match solo si hay filtro', () => {
    const p = search.statsPipeline({});
    assert.equal(p.length, 1);
    assert.ok(p[0].$group);
    assert.deepEqual(Object.keys(p[0].$group).sort(), ['_id', ...Object.keys(search.EMPTY_STATS)].sort());
    const m = search.statsPipeline({ paymentStatus: 'pending' });
    assert.deepEqual(m[0], { $match: { paymentStatus: 'pending' } });
  });

  it('normalizeStats: sin pedidos → ceros; basura → 0; sobra _id', () => {
    assert.deepEqual(search.normalizeStats([]), search.EMPTY_STATS);
    assert.deepEqual(search.normalizeStats(undefined), search.EMPTY_STATS);
    const s = search.normalizeStats([{ _id: null, count: 3, total: 1500, approved: 'x', review: 1 }]);
    assert.deepEqual(s, { ...search.EMPTY_STATS, count: 3, total: 1500, review: 1 });
  });
});

describe('GET /api/orders?q=&status= (admin)', () => {
  afterEach(() => mock.restoreAll());

  function spyFind(calls) {
    return (filter) => {
      const call = { filter };
      calls.push(call);
      const q = {
        sort() { return q; },
        limit(n) { call.limit = n; return q; },
        lean: async () => [],
      };
      return q;
    };
  }

  it('q y status paginan y llegan como filtro a Mongo', async () => {
    setDbReady(true);
    const calls = [];
    mock.method(Order, 'find', spyFind(calls));
    const res = await request(app).get('/api/orders?q=ana&status=approved').set('Authorization', admin());
    assert.equal(res.status, 200);
    assert.equal(res.body.nextCursor, null);
    assert.equal(calls[0].limit, 51);
    assert.deepEqual(calls[0].filter.$and[0], { paymentStatus: 'approved' });
    assert.equal(calls[0].filter.$and[1].$or[0].customerName.$regex, 'ana');
  });

  it('búsqueda + cursor se combinan con $and', async () => {
    setDbReady(true);
    const calls = [];
    mock.method(Order, 'find', spyFind(calls));
    const res = await request(app)
      .get(`/api/orders?q=${OID}&cursor=1700000000000_${OID}`)
      .set('Authorization', admin());
    assert.equal(res.status, 200);
    const [byText, byCursor] = calls[0].filter.$and;
    assert.ok(byText.$or[0]._id instanceof mongoose.Types.ObjectId);
    assert.ok(byCursor.$or[1]._id.$lt instanceof mongoose.Types.ObjectId);
  });

  for (const qs of ['status=hackeado', `q=${'x'.repeat(81)}`, 'q=a&q=b']) {
    it(`?${qs.slice(0, 30)} → 400 sin tocar la base`, async () => {
      setDbReady(true);
      const find = mock.method(Order, 'find', () => { throw new Error('no debería consultar'); });
      const res = await request(app).get(`/api/orders?${qs}`).set('Authorization', admin());
      assert.equal(res.status, 400);
      assert.equal(find.mock.callCount(), 0);
    });
  }
});

describe('GET /api/orders/stats (admin)', () => {
  afterEach(() => mock.restoreAll());

  it('un aggregate sin $match y la respuesta normalizada', async () => {
    setDbReady(true);
    const agg = mock.method(Order, 'aggregate', async () => [
      { _id: null, count: 4, total: 98000, approved: 2, review: 1, pending: 1, shipped: 1, delivered: 0 },
    ]);
    const res = await request(app).get('/api/orders/stats').set('Authorization', admin());
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, {
      ok: true,
      data: { count: 4, total: 98000, approved: 2, review: 1, pending: 1, shipped: 1, delivered: 0 },
    });
    assert.equal(agg.mock.callCount(), 1);
    assert.equal(agg.mock.calls[0].arguments[0].length, 1);
  });

  it('sin pedidos → ceros (no 404 ni null)', async () => {
    setDbReady(true);
    mock.method(Order, 'aggregate', async () => []);
    const res = await request(app).get('/api/orders/stats').set('Authorization', admin());
    assert.deepEqual(res.body.data, search.EMPTY_STATS);
  });

  it('con q/status el aggregate arranca con el mismo $match del listado', async () => {
    setDbReady(true);
    const agg = mock.method(Order, 'aggregate', async () => []);
    await request(app).get('/api/orders/stats?q=lampara&status=pending').set('Authorization', admin());
    const [match] = agg.mock.calls[0].arguments[0];
    assert.deepEqual(match.$match, search.buildOrderFilter({ q: 'lampara', status: 'pending' }));
  });

  it('status inválido → 400; sin admin → 401/403', async () => {
    setDbReady(true);
    const agg = mock.method(Order, 'aggregate', async () => { throw new Error('no'); });
    const bad = await request(app).get('/api/orders/stats?status=x').set('Authorization', admin());
    assert.equal(bad.status, 400);
    assert.equal((await request(app).get('/api/orders/stats')).status, 401);
    const user = await request(app).get('/api/orders/stats').set('Authorization', `Bearer ${tokenFor('user')}`);
    assert.equal(user.status, 403);
    assert.equal(agg.mock.callCount(), 0);
  });
});
