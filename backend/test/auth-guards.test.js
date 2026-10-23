// Orden de las defensas en rutas privadas: sin token → 401, token de
// cliente → 403, admin con id mal formado → 400 (antes era CastError = 500).

const { describe, it, before, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { app, setDbReady, tokenFor, VALID_ID } = require('./setup');
const AbandonedCart = require('../src/models/AbandonedCart');

before(() => setDbReady(true));
afterEach(() => mock.restoreAll());

const ADMIN_ROUTES = [
  ['patch', '/api/orders/:id'],
  ['patch', '/api/orders/:id/verify'],
  ['patch', '/api/orders/:id/reject'],
  ['patch', '/api/coupons/:id'],
  ['delete', '/api/coupons/:id'],
  ['put', '/api/auth/make-admin/:id'],
  ['post', '/api/abandoned-carts/:id/recover'],
  ['delete', '/api/abandoned-carts/:id'],
];

const at = (path, id) => path.replace(':id', id);

describe('Rutas de admin', () => {
  for (const [method, path] of ADMIN_ROUTES) {
    describe(`${method.toUpperCase()} ${path}`, () => {
      it('sin token → 401', async () => {
        const res = await request(app)[method](at(path, VALID_ID));
        assert.equal(res.status, 401);
        assert.equal(res.body.ok, false);
      });

      it('token de cliente → 403', async () => {
        const res = await request(app)[method](at(path, VALID_ID))
          .set('Authorization', `Bearer ${tokenFor('user')}`);
        assert.equal(res.status, 403);
      });

      it('admin con id mal formado → 400 "Identificador inválido."', async () => {
        const res = await request(app)[method](at(path, 'no-es-un-id'))
          .set('Authorization', `Bearer ${tokenFor('admin')}`);
        assert.equal(res.status, 400);
        assert.deepEqual(res.body, { ok: false, message: 'Identificador inválido.' });
      });
    });
  }
});

describe('Tokens', () => {
  it('firmado con otro secreto → 401', async () => {
    const jwt = require('jsonwebtoken');
    const forged = jwt.sign({ id: VALID_ID, role: 'admin' }, 'otro-secreto');
    const res = await request(app).get('/api/orders').set('Authorization', `Bearer ${forged}`);
    assert.equal(res.status, 401);
  });

  it('vencido → 401', async () => {
    const jwt = require('jsonwebtoken');
    const expired = jwt.sign(
      { id: VALID_ID, role: 'admin', exp: Math.floor(Date.now() / 1000) - 60 },
      process.env.JWT_SECRET
    );
    const res = await request(app).get('/api/orders').set('Authorization', `Bearer ${expired}`);
    assert.equal(res.status, 401);
  });

  it('acepta el token por cookie además del header', async () => {
    const res = await request(app)
      .get('/api/orders')
      .set('Cookie', `token=${tokenFor('user')}`);
    assert.equal(res.status, 403); // autenticado, pero no admin
  });
});

describe('Carritos abandonados (admin)', () => {
  it('id válido inexistente → 404 (no 200 vacío)', async () => {
    mock.method(AbandonedCart, 'findByIdAndUpdate', async () => null);
    const res = await request(app)
      .post(`/api/abandoned-carts/${VALID_ID}/recover`)
      .set('Authorization', `Bearer ${tokenFor('admin')}`);
    assert.equal(res.status, 404);
  });

  it('un error de la base llega al errorHandler como 500 genérico, sin filtrar detalles', async () => {
    mock.method(AbandonedCart, 'findByIdAndDelete', async () => {
      throw new Error('detalle interno de Mongo que no debe salir');
    });
    const res = await request(app)
      .delete(`/api/abandoned-carts/${VALID_ID}`)
      .set('Authorization', `Bearer ${tokenFor('admin')}`);
    assert.equal(res.status, 500);
    assert.deepEqual(res.body, { ok: false, message: 'Error interno del servidor.' });
  });
});
