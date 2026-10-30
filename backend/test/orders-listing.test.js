// Listado admin de pedidos: paginación por cursor opcional (sin params = todo,
// como hoy), validación del query e índices declarados en el modelo.

const { describe, it, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const mongoose = require('mongoose');
const { app, setDbReady, tokenFor } = require('./setup');
const Order = require('../src/models/order');
const listing = require('../src/services/orderListing');

const oid = (n) => n.toString(16).padStart(24, '0');
// 5 pedidos, del más nuevo al más viejo; los dos primeros en el mismo ms.
const T = Date.parse('2026-10-20T15:00:00Z');
const ORDERS = [
  { _id: oid(5), createdAt: new Date(T) },
  { _id: oid(4), createdAt: new Date(T) },
  { _id: oid(3), createdAt: new Date(T - 1000) },
  { _id: oid(2), createdAt: new Date(T - 2000) },
  { _id: oid(1), createdAt: new Date(T - 3000) },
];

describe('orderListing (puro)', () => {
  it('encode/decode ida y vuelta; basura → null', () => {
    const c = listing.encodeCursor(ORDERS[1]);
    assert.equal(c, `${T}_${oid(4)}`);
    assert.deepEqual(listing.decodeCursor(c), { createdAt: new Date(T), id: oid(4) });
    for (const bad of [null, '', 'abc', `${T}_xyz`, `${T}`, { $ne: null }, `${T}_${oid(4)}_x`]) {
      assert.equal(listing.decodeCursor(bad), null, String(bad));
    }
    assert.equal(listing.encodeCursor({ _id: 'no-es-oid', createdAt: new Date() }), null);
    assert.equal(listing.encodeCursor({ _id: oid(1), createdAt: 'nunca' }), null);
  });

  it('el filtro desempata por _id cuando dos pedidos comparten createdAt', () => {
    const f = listing.beforeCursorFilter({ createdAt: new Date(T), id: oid(5) });
    assert.deepEqual(f, {
      $or: [
        { createdAt: { $lt: new Date(T) } },
        { createdAt: new Date(T), _id: { $lt: oid(5) } },
      ],
    });
  });

  it('buildPage: con limit+1 docs hay más y el cursor es el último devuelto', () => {
    const p = listing.buildPage(ORDERS.slice(0, 3), 2);
    assert.equal(p.data.length, 2);
    assert.equal(p.nextCursor, `${T}_${oid(4)}`);
    assert.deepEqual(listing.buildPage(ORDERS.slice(0, 2), 2), { data: ORDERS.slice(0, 2), nextCursor: null });
    assert.deepEqual(listing.buildPage(undefined, 2), { data: [], nextCursor: null });
  });
});

// Simula Order.find(...).sort(...).limit(...).lean() aplicando el filtro de
// verdad sobre ORDERS, para recorrer páginas de punta a punta.
function fakeFind(calls) {
  return (filter = {}) => {
    const call = { filter, sort: null, limit: null };
    calls.push(call);
    const matches = (o) => {
      if (!filter.$or) return true;
      const [lt, tie] = filter.$or;
      const t = o.createdAt.getTime();
      return t < lt.createdAt.$lt.getTime()
        || (t === tie.createdAt.getTime() && String(o._id) < String(tie._id.$lt));
    };
    const q = {
      sort(s) { call.sort = s; return q; },
      limit(n) { call.limit = n; return q; },
      lean: async () => {
        const rows = ORDERS.filter(matches);
        return call.limit ? rows.slice(0, call.limit) : rows;
      },
    };
    return q;
  };
}

describe('GET /api/orders (admin)', () => {
  afterEach(() => mock.restoreAll());
  const admin = () => `Bearer ${tokenFor('admin')}`;

  it('sin query devuelve todos, sin límite ni nextCursor (contrato actual)', async () => {
    setDbReady(true);
    const calls = [];
    mock.method(Order, 'find', fakeFind(calls));
    const res = await request(app).get('/api/orders').set('Authorization', admin());
    assert.equal(res.status, 200);
    assert.equal(res.body.data.length, 5);
    assert.equal('nextCursor' in res.body, false);
    assert.equal(calls[0].limit, null);
    assert.deepEqual(calls[0].sort, { createdAt: -1, _id: -1 });
  });

  it('recorre todas las páginas sin repetir ni saltear (empate en createdAt incluido)', async () => {
    setDbReady(true);
    const calls = [];
    mock.method(Order, 'find', fakeFind(calls));
    const seen = [];
    let url = '/api/orders?limit=2';
    for (let i = 0; i < 5 && url; i++) {
      const res = await request(app).get(url).set('Authorization', admin());
      assert.equal(res.status, 200);
      seen.push(...res.body.data.map((o) => o._id));
      url = res.body.nextCursor ? `/api/orders?limit=2&cursor=${res.body.nextCursor}` : null;
    }
    assert.deepEqual(seen, ORDERS.map((o) => o._id));
    assert.equal(calls.length, 3);
    assert.equal(calls[0].limit, 3); // limit + 1 para saber si hay más
    // el cursor se convierte a ObjectId antes de llegar a la query
    assert.ok(calls[1].filter.$or[1]._id.$lt instanceof mongoose.Types.ObjectId);
  });

  it('solo cursor → página de 50 por defecto', async () => {
    setDbReady(true);
    const calls = [];
    mock.method(Order, 'find', fakeFind(calls));
    const res = await request(app).get(`/api/orders?cursor=${T}_${oid(5)}`).set('Authorization', admin());
    assert.equal(res.status, 200);
    assert.equal(calls[0].limit, 51);
    assert.equal(res.body.data.length, 4);
    assert.equal(res.body.nextCursor, null);
  });

  for (const [qs, field] of [
    ['limit=0', 'limit'], ['limit=101', 'limit'], ['limit=abc', 'limit'], ['limit=1&limit=2', 'limit'],
    ['cursor=hola', 'cursor'], [`cursor=${T}_${oid(4)}&cursor=${T}_${oid(3)}`, 'cursor'],
  ]) {
    it(`?${qs} → 400 sin tocar la base`, async () => {
      setDbReady(true);
      const find = mock.method(Order, 'find', () => { throw new Error('no debería consultar'); });
      const res = await request(app).get(`/api/orders?${qs}`).set('Authorization', admin());
      assert.equal(res.status, 400);
      assert.equal(res.body.ok, false);
      assert.ok(res.body.fields[field], JSON.stringify(res.body));
      assert.equal(find.mock.callCount(), 0);
    });
  }

  it('cursor[$ne]=x no llega como operador: Express 5 no arma objetos del query y la clave se ignora', async () => {
    setDbReady(true);
    const calls = [];
    mock.method(Order, 'find', fakeFind(calls));
    const res = await request(app).get('/api/orders?cursor[$ne]=x').set('Authorization', admin());
    assert.equal(res.status, 200);
    assert.deepEqual(calls[0].filter, {});
    assert.equal(res.body.data.length, 5);
  });

  it('sin sesión de admin sigue siendo 401/403', async () => {
    setDbReady(true);
    assert.equal((await request(app).get('/api/orders?limit=2')).status, 401);
    const res = await request(app).get('/api/orders?limit=2').set('Authorization', `Bearer ${tokenFor('user')}`);
    assert.equal(res.status, 403);
  });
});

describe('índices de Order', () => {
  it('declara los índices de listado, "Mis pedidos" y estado de pago', () => {
    const keys = Order.schema.indexes().map(([k]) => JSON.stringify(k));
    for (const k of [
      { createdAt: -1, _id: -1 },
      { customerEmail: 1, createdAt: -1 },
      { paymentStatus: 1, createdAt: -1 },
    ]) assert.ok(keys.includes(JSON.stringify(k)), `falta ${JSON.stringify(k)}`);
  });
});
