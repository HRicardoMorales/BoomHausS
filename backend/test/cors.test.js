// CORS: qué orígenes pueden llamar a la API con credenciales.
// Cubre el dominio actual (amelor.com.ar), las previews de Vercel del
// proyecto y que un vercel.app ajeno con el mismo prefijo quede afuera.

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { app, setDbReady } = require('./setup');

async function allowOriginFor(origin) {
  setDbReady(true);
  const res = await request(app).get('/api/health').set('Origin', origin);
  return res.headers['access-control-allow-origin'];
}

describe('CORS', () => {
  for (const origin of [
    'https://amelor.com.ar',
    'https://www.amelor.com.ar',
    'http://localhost:5173',
    'https://boom-haus-s-git-nightly-portfolio-ricardo-morales-projects.vercel.app',
    'https://boom-haus-s.vercel.app',
  ]) {
    it(`permite ${origin}`, async () => {
      assert.equal(await allowOriginFor(origin), origin);
    });
  }

  for (const origin of [
    'https://evil.example.com',
    'https://boom-haus-falso.vercel.app',
    'http://boom-haus-s-git-x-ricardo-morales-projects.vercel.app',
    'http://boom-haus-s.vercel.app',
  ]) {
    it(`bloquea ${origin}`, async () => {
      assert.equal(await allowOriginFor(origin), undefined);
    });
  }
});
