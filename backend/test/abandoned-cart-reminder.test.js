// Job de mails de carrito abandonado: filtro, reserva atómica, "ya compró"
// y reintento si el mail falla. Modelos en memoria, sin Mongo.

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
require('./setup');
const {
  reminderQuery,
  runAbandonedCartReminders,
  MIN_AGE_MS,
  MAX_AGE_MS,
} = require('../src/jobs/abandonedCartReminder');
const { escapeHtml } = require('../src/services/emailService');

const NOW = new Date('2026-10-22T12:00:00Z');
const hoursAgo = (h) => new Date(NOW.getTime() - h * 3600 * 1000);

function lean(value) {
  return { sort() { return this; }, limit() { return this; }, select() { return this; }, lean: async () => value };
}

// Modelo mínimo que entiende justo lo que usa el job.
function fakeCartModel(carts) {
  const db = carts.map((c) => ({ reminderSentAt: null, recovered: false, ...c }));
  return {
    db,
    find(q) {
      const lo = q.updatedAt.$gte.getTime();
      const hi = q.updatedAt.$lte.getTime();
      return lean(db.filter((c) =>
        c.email && !c.recovered && c.reminderSentAt == null &&
        c.updatedAt.getTime() >= lo && c.updatedAt.getTime() <= hi
      ).map((c) => ({ _id: c._id })));
    },
    findOneAndUpdate(filter, update) {
      const c = db.find((x) => x._id === filter._id && x.reminderSentAt == null);
      if (c) Object.assign(c, update.$set);
      return lean(c ? { ...c } : null);
    },
    async updateOne(filter, update) {
      Object.assign(db.find((x) => x._id === filter._id), update.$set);
    },
  };
}

function fakeOrderModel(orders) {
  return {
    findOne(q) {
      const hit = orders.find((o) => o.customerEmail === q.customerEmail && o.createdAt >= q.createdAt.$gte);
      return lean(hit ? { _id: 'o1' } : null);
    },
  };
}

describe('reminderQuery (pura)', () => {
  it('ventana entre MIN_AGE y MAX_AGE, con email, sin recuperar y sin recordatorio', () => {
    const q = reminderQuery(NOW);
    assert.equal(q.updatedAt.$lte.getTime(), NOW.getTime() - MIN_AGE_MS);
    assert.equal(q.updatedAt.$gte.getTime(), NOW.getTime() - MAX_AGE_MS);
    assert.equal(q.reminderSentAt, null);
    assert.deepEqual(q.recovered, { $ne: true });
  });
});

describe('runAbandonedCartReminders', () => {
  it('manda solo a los carritos que corresponde y los marca', async () => {
    const CartModel = fakeCartModel([
      { _id: 'a', email: 'a@x.co', updatedAt: hoursAgo(5) },          // sí
      { _id: 'b', email: 'b@x.co', updatedAt: hoursAgo(1) },          // muy reciente
      { _id: 'c', email: 'c@x.co', updatedAt: hoursAgo(72) },         // muy viejo
      { _id: 'd', email: '', updatedAt: hoursAgo(5) },                // sin email
      { _id: 'e', email: 'e@x.co', updatedAt: hoursAgo(5), recovered: true },
    ]);
    const sent = [];
    const r = await runAbandonedCartReminders({
      now: NOW, CartModel, OrderModel: fakeOrderModel([]), send: async (c) => { sent.push(c.email); return true; },
    });
    assert.deepEqual(sent, ['a@x.co']);
    assert.deepEqual(r, { checked: 1, sent: 1, skippedOrdered: 0, failed: 0 });
    assert.equal(CartModel.db.find((c) => c._id === 'a').reminderSentAt, NOW);

    // Segunda corrida: ya tiene recordatorio, no se repite.
    const again = await runAbandonedCartReminders({
      now: NOW, CartModel, OrderModel: fakeOrderModel([]), send: async () => { throw new Error('no debería mandar'); },
    });
    assert.equal(again.sent, 0);
  });

  it('si ya compró después de abandonar, no manda y lo marca recuperado', async () => {
    const CartModel = fakeCartModel([{ _id: 'a', email: 'a@x.co', updatedAt: hoursAgo(5) }]);
    const OrderModel = fakeOrderModel([{ customerEmail: 'a@x.co', createdAt: hoursAgo(3) }]);
    const r = await runAbandonedCartReminders({ now: NOW, CartModel, OrderModel, send: async () => { throw new Error('no'); } });
    assert.equal(r.skippedOrdered, 1);
    assert.equal(CartModel.db[0].recovered, true);
  });

  it('si el mail falla, libera el carrito para el próximo ciclo', async () => {
    const CartModel = fakeCartModel([{ _id: 'a', email: 'a@x.co', updatedAt: hoursAgo(5) }]);
    const r = await runAbandonedCartReminders({ now: NOW, CartModel, OrderModel: fakeOrderModel([]), send: async () => false });
    assert.equal(r.failed, 1);
    assert.equal(CartModel.db[0].reminderSentAt, null);
  });
});

describe('escapeHtml', () => {
  it('neutraliza HTML que llega en el nombre del carrito', () => {
    assert.equal(escapeHtml('<img src=x onerror="a">'), '&lt;img src=x onerror=&quot;a&quot;&gt;');
    assert.equal(escapeHtml(undefined), '');
  });
});
