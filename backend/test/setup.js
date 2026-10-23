// backend/test/setup.js
//
// Arranca la app de Express real (app.js) SIN MongoDB ni red:
//
// - MONGO_URI vacío → connectDB() loguea y vuelve sin intentar conectar
//   (dotenv no pisa variables ya definidas, así que un .env local no se cuela).
// - LOG_LEVEL=silent para que la salida de los tests sea solo la del runner.
// - JWT_SECRET de prueba para firmar tokens de usuario/admin.
// - `setDbReady(bool)` controla mongoose.connection.readyState, que es lo que
//   leen el DB gate de app.js y /api/health. Así se prueban los dos mundos
//   (Atlas caído / conectado) sin levantar una base.
//
// Cada archivo de test corre en su propio proceso (node:test), así que los
// rate limiters en memoria arrancan de cero en cada uno.

process.env.NODE_ENV = 'test';
process.env.DOTENV_CONFIG_QUIET = 'true';
process.env.LOG_LEVEL = 'silent';
process.env.MONGO_URI = '';
process.env.JWT_SECRET = 'test-secret-no-es-real';

const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

let dbReady = false;
Object.defineProperty(mongoose.connection, 'readyState', {
  configurable: true,
  get: () => (dbReady ? 1 : 0),
});

function setDbReady(value) {
  dbReady = Boolean(value);
}

const app = require('../src/app');

function tokenFor(role = 'user', extra = {}) {
  return jwt.sign(
    { id: '64b7f0c2a1b2c3d4e5f60718', email: `${role}@test.dev`, role, ...extra },
    process.env.JWT_SECRET,
    { expiresIn: '5m' }
  );
}

const VALID_ID = '64b7f0c2a1b2c3d4e5f60718';

module.exports = { app, setDbReady, tokenFor, VALID_ID };
