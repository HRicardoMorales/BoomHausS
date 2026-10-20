// /api/health y el DB gate: el contrato que usa Render para saber si el
// servicio puede atender, y el 503 rápido en vez de colgar 30 s.

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { app, setDbReady } = require('./setup');

describe('GET /api/health', () => {
  it('con la base caída responde 503 + Retry-After y status "degraded"', async () => {
    setDbReady(false);
    const res = await request(app).get('/api/health');

    assert.equal(res.status, 503);
    assert.equal(res.headers['retry-after'], '5');
    assert.equal(res.body.status, 'degraded');
    assert.equal(res.body.db, 'disconnected');
    assert.ok(Number.isInteger(res.body.uptime_s));
    assert.ok(!Number.isNaN(Date.parse(res.body.timestamp)));
  });

  it('con la base conectada responde 200 y status "ok"', async () => {
    setDbReady(true);
    const res = await request(app).get('/api/health');

    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'ok');
    assert.equal(res.body.db, 'connected');
    assert.match(res.body.version, /^(v\d|dev|[0-9a-f]{7}$)/);
  });
});

describe('DB gate', () => {
  beforeEach(() => setDbReady(false));

  for (const [method, path] of [
    ['get', '/api/products'],
    ['post', '/api/orders'],
    ['post', '/api/auth/login'],
    ['post', '/api/webhooks/mercadopago'],
  ]) {
    it(`${method.toUpperCase()} ${path} sin base → 503 inmediato con Retry-After`, async () => {
      const started = Date.now();
      const res = await request(app)[method](path).send({});

      assert.equal(res.status, 503);
      assert.equal(res.headers['retry-after'], '5');
      assert.deepEqual(
        { ok: res.body.ok, retry_after: res.body.retry_after },
        { ok: false, retry_after: 5 }
      );
      // El punto del gate es no esperar el server selection de Mongoose.
      assert.ok(Date.now() - started < 1000, 'el gate tiene que cortar en el acto');
    });
  }

  it('el gate corre antes que la validación (no filtra 400 con la base caída)', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: { $ne: null } });
    assert.equal(res.status, 503);
  });
});

describe('Cabeceras transversales', () => {
  it('devuelve X-Request-Id generado y respeta uno entrante válido', async () => {
    const generated = await request(app).get('/api/health');
    assert.match(generated.headers['x-request-id'], /^[0-9a-f-]{36}$/);

    const echoed = await request(app).get('/api/health').set('X-Request-Id', 'req-abc-12345');
    assert.equal(echoed.headers['x-request-id'], 'req-abc-12345');

    const rejected = await request(app).get('/api/health').set('X-Request-Id', 'no<valido>');
    assert.notEqual(rejected.headers['x-request-id'], 'no<valido>');
  });

  it('no expone X-Powered-By y aplica helmet', async () => {
    const res = await request(app).get('/api/health');
    assert.equal(res.headers['x-powered-by'], undefined);
    assert.equal(res.headers['x-content-type-options'], 'nosniff');
  });

  it('una ruta inexistente bajo /api responde 404, no 500', async () => {
    setDbReady(true);
    const res = await request(app).get('/api/no-existe');
    assert.equal(res.status, 404);
  });
});
