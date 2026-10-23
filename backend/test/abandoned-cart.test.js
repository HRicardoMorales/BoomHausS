// Captura de carritos abandonados: la función pura que arma el documento y
// la ruta pública que la usa (con el modelo stubbeado, sin Mongo).

const { describe, it, before, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { app, setDbReady } = require('./setup');
const AbandonedCart = require('../src/models/AbandonedCart');
const { buildCaptureFields, sanitizeItem } = require('../src/controllers/abandonedCart.controller');

describe('buildCaptureFields (pura)', () => {
  it('sin email ni teléfono devuelve null', () => {
    assert.equal(buildCaptureFields({ name: 'Ana' }), null);
    assert.equal(buildCaptureFields(), null);
  });

  it('un operador de Mongo como email no sobrevive', () => {
    assert.equal(buildCaptureFields({ email: { $ne: null } }), null);
    const fields = buildCaptureFields({ email: { $gt: '' }, phone: '11 5555-5555' });
    assert.equal(fields.email, undefined);
    assert.equal(fields.phone, '1155555555');
  });

  it('normaliza email y teléfono y solo incluye los campos que llegaron', () => {
    const fields = buildCaptureFields({ email: '  Ana@Mail.COM ', phone: '+54 (11) 5555-5555', city: 'CABA' });
    assert.deepEqual(fields, {
      email: 'ana@mail.com',
      phone: '+541155555555',
      city: 'CABA',
      recovered: false,
    });
  });

  it('ítems: lista blanca de campos, tope de 50 y totales calculados', () => {
    const items = Array.from({ length: 60 }, (_, i) => ({
      productId: `p${i}`, name: `Producto ${i}`, price: '1000', quantity: 2, hack: { $set: 1 },
    }));
    const fields = buildCaptureFields({ email: 'a@b.co', items, total: '120000' });

    assert.equal(fields.items.length, 50);
    assert.deepEqual(Object.keys(fields.items[0]).sort(), ['imageUrl', 'name', 'price', 'productId', 'quantity']);
    assert.equal(fields.items[0].price, 1000);
    assert.equal(fields.totalItems, 100);
    assert.equal(fields.totalAmount, 120000);
  });

  it('acota textos largos a 300 caracteres', () => {
    const fields = buildCaptureFields({ email: 'a@b.co', address: 'x'.repeat(5000) });
    assert.equal(fields.address.length, 300);
  });
});

describe('sanitizeItem (pura)', () => {
  it('descarta basura y ítems sin nombre ni id', () => {
    assert.equal(sanitizeItem(null), null);
    assert.equal(sanitizeItem('texto'), null);
    assert.equal(sanitizeItem({ price: 10 }), null);
  });

  it('cantidad mínima 1 y entera; precio no numérico → 0', () => {
    assert.deepEqual(sanitizeItem({ name: 'A', quantity: -3, price: 'abc' }), {
      productId: null, name: 'A', price: 0, quantity: 1, imageUrl: null,
    });
    assert.equal(sanitizeItem({ name: 'A', quantity: 2.9 }).quantity, 2);
  });
});

describe('POST /api/abandoned-cart', () => {
  before(() => setDbReady(true));
  afterEach(() => mock.restoreAll());

  const chain = (value) => ({ select: async () => value });

  it('sin dato de contacto → 400 y no escribe', async () => {
    const create = mock.method(AbandonedCart, 'create', async () => ({}));
    const res = await request(app).post('/api/abandoned-cart').send({ name: 'Ana' });
    assert.equal(res.status, 400);
    assert.equal(create.mock.callCount(), 0);
  });

  it('cliente nuevo → create con los campos saneados', async () => {
    mock.method(AbandonedCart, 'findOne', () => chain(null));
    const create = mock.method(AbandonedCart, 'create', async (doc) => doc);
    const res = await request(app)
      .post('/api/abandoned-cart')
      .send({ email: 'Ana@Mail.com', step: 'shipping', role: 'admin' });

    assert.deepEqual(res.body, { ok: true });
    assert.equal(create.mock.callCount(), 1);
    assert.deepEqual(create.mock.calls[0].arguments[0], {
      email: 'ana@mail.com', step: 'shipping', recovered: false,
    });
  });

  it('mismo teléfono → actualiza el registro existente en vez de duplicarlo', async () => {
    const findOne = mock.method(AbandonedCart, 'findOne', () => chain({ _id: 'abc' }));
    const updateOne = mock.method(AbandonedCart, 'updateOne', async () => ({}));
    const create = mock.method(AbandonedCart, 'create', async () => ({}));

    const res = await request(app).post('/api/abandoned-cart').send({ phone: '11 4444 4444', name: 'Ana' });

    assert.equal(res.status, 200);
    assert.deepEqual(findOne.mock.calls[0].arguments[0], { phone: '1144444444' });
    assert.equal(updateOne.mock.callCount(), 1);
    assert.deepEqual(updateOne.mock.calls[0].arguments[0], { _id: 'abc' });
    assert.equal(create.mock.callCount(), 0);
  });
});
