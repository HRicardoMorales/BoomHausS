// backend/src/middlewares/requestLogger.js
//
// Access log por request + request id para correlacionar.
//
// - Respeta un `X-Request-Id` entrante (proxy/CDN) si es razonable; si no,
//   genera uno con crypto.randomUUID(). Lo devuelve en la respuesta y lo
//   deja en `req.id` para que los handlers lo incluyan en sus logs.
// - Loguea método, ruta (sin query string: puede traer tokens o emails),
//   status y duración. Nivel según status: 5xx → error, 4xx → warn,
//   resto → info. Health checks y preflight van a debug para no ensuciar.
// - No loguea body, headers ni cookies.

const { randomUUID } = require('crypto');
const logger = require('../utils/logger').child('http');

const VALID_ID = /^[\w.-]{8,128}$/;

function requestLogger(req, res, next) {
    const incoming = req.get('x-request-id');
    req.id = incoming && VALID_ID.test(incoming) ? incoming : randomUUID();
    res.setHeader('X-Request-Id', req.id);

    const start = process.hrtime.bigint();

    res.on('finish', () => {
        const ms = Number(process.hrtime.bigint() - start) / 1e6;
        const path = req.originalUrl.split('?')[0];
        const status = res.statusCode;
        const quiet = req.method === 'OPTIONS' || path.startsWith('/api/health');
        const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : quiet ? 'debug' : 'info';

        logger[level](`${req.method} ${path} ${status}`, {
            reqId: req.id,
            ms: Math.round(ms * 10) / 10,
        });
    });

    next();
}

module.exports = requestLogger;
