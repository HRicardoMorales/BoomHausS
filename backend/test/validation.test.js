// Contratos de entrada con zod (middlewares/validate.js + validation/*).
// Lo importante: los operadores de Mongo nunca llegan a una query y los
// errores salen como 400 con { ok, message, fields } en vez de 500.

const { describe, it, before, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { app, setDbReady } = require('./setup');
const User = require('../src/models/User');
const Order = require('../src/models/order');
const Coupon = require('../src/models/Coupon');

before(() => setDbReady(true));
afterEach(() => mock.restoreAll());

function assert400(res, field) {
  assert.equal(res.status, 400, JSON.stringify(res.body));
  assert.equal(res.body.ok, false);
  assert.equal(typeof res.body.message, 'string');
  if (field) assert.ok(field in res.body.fields, `falta fields.${field} en ${JSON.stringify(res.body.fields)}`);
}

describe('POST /api/auth/login', () => {
  it('corta la inyección NoSQL { $ne: null } con 400 antes de tocar la base', async () => {
    const findOne = mock.method(User, 'findOne', async () => null);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: { $ne: null }, password: { $ne: null } });

    assert400(res, 'email');
    assert.ok('password' in res.body.fields);
    assert.equal(findOne.mock.callCount(), 0);
  });

  it('pasa al controller un email normalizado y sin claves extra', async () => {
    const findOne = mock.method(User, 'findOne', async () => null);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: '  Rick@Example.COM ', password: 'secreto', role: 'admin' });

    // Usuario inexistente → 401 del controller (no 400 ni 500).
    assert.equal(res.status, 401);
    assert.equal(findOne.mock.callCount(), 1);
    assert.deepEqual(findOne.mock.calls[0].arguments[0], { email: 'rick@example.com' });
  });

  it('rechaza contraseñas de más de 72 caracteres (límite de bcrypt)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'a@b.co', password: 'x'.repeat(73) });
    assert400(res, 'password');
  });
});

describe('POST /api/auth/register', () => {
  it('devuelve todos los campos inválidos juntos con mensajes en español', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'R', email: 'no-es-mail', password: '123' });

    assert400(res);
    assert.deepEqual(Object.keys(res.body.fields).sort(), ['email', 'name', 'password']);
    assert.match(res.body.fields.password, /al menos 6/);
    assert.equal(res.body.message, res.body.fields.name);
  });
});

describe('POST /api/auth/forgot-password y reset-password', () => {
  it('forgot: un objeto como email → 400', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({ email: { $gt: '' } });
    assert400(res, 'email');
  });

  it('reset: token con formato inválido → 400 en params', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password/no-es-un-token')
      .send({ password: 'nueva-clave' });
    assert400(res, 'token');
  });
});

describe('POST /api/orders (contacto y envío)', () => {
  const validOrder = {
    customerName: 'Ana Pérez',
    customerEmail: 'ana@example.com',
    customerDni: 30123456,
    customerPhone: '+54 9 11 5555-5555',
    shippingAddress: 'Av. Siempre Viva 742, CABA',
    items: [{ productId: 'x', quantity: 1 }],
  };

  it('clientOrderId como operador de Mongo → 400 y nunca llega a Order.findOne', async () => {
    const findOne = mock.method(Order, 'findOne', async () => {
      throw new Error('no debería consultarse');
    });
    const res = await request(app)
      .post('/api/orders')
      .send({ ...validOrder, clientOrderId: { $ne: null } });

    assert400(res, 'clientOrderId');
    assert.equal(findOne.mock.callCount(), 0);
  });

  it('faltan nombre, DNI y dirección → 400 con los tres campos', async () => {
    const res = await request(app).post('/api/orders').send({ items: [] });
    assert400(res);
    for (const f of ['customerName', 'customerDni', 'shippingAddress']) {
      assert.ok(f in res.body.fields, `falta ${f}`);
    }
  });

  it('email opcional, pero si viene tiene que ser válido', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({ ...validOrder, customerEmail: 'ana@' });
    assert400(res, 'customerEmail');
  });

  it('textos con tope: notas de más de 1000 caracteres → 400', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({ ...validOrder, notes: 'n'.repeat(1001) });
    assert400(res, 'notes');
  });
});

describe('POST /api/coupons/validate', () => {
  it('código como objeto → 400 sin consultar cupones', async () => {
    const findOne = mock.method(Coupon, 'findOne', async () => null);
    const res = await request(app).post('/api/coupons/validate').send({ code: { $regex: '.*' } });
    assert400(res, 'code');
    assert.equal(findOne.mock.callCount(), 0);
  });

  it('normaliza el código (trim + mayúsculas) antes de buscarlo', async () => {
    const findOne = mock.method(Coupon, 'findOne', async () => null);
    const res = await request(app)
      .post('/api/coupons/validate')
      .send({ code: '  bienvenida10 ', cartTotal: '15000' });

    assert.notEqual(res.status, 400);
    assert.equal(findOne.mock.callCount(), 1);
    assert.equal(JSON.stringify(findOne.mock.calls[0].arguments[0]).includes('BIENVENIDA10'), true);
  });
});
