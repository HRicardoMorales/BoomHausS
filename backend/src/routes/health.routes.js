// backend/src/routes/health.routes.js
//
// GET /api/health
//
// Health check REAL — no un "estoy vivo" ficticio. Refleja si la app
// puede realmente servir requests de datos, no si el proceso Node esta
// corriendo. Render usa este endpoint para health checks de deploy y
// para dashboards de uptime; un 200 falso durante Mongo caido genera
// falsa sensacion de servicio saludable.
//
// Codigos:
//   200 → mongoose.connection.readyState === 1 (connected). Todo sano.
//   503 → cualquier otro estado (0 disconnected, 2 connecting,
//         3 disconnecting, 99 uninitialized). Incluye header Retry-After.
//
// Body (mismo shape en ambos codigos):
//   {
//     status:    "ok" | "degraded",
//     db:        "connected" | "disconnected" | "connecting" | ...
//     uptime_s:  <segundos desde start del proceso>,
//     version:   <sha corto del commit, o "dev" si no hay Render env>,
//     timestamp: <ISO 8601>,
//   }
//
// Este endpoint BYPASSA el DB gate del middleware en app.js — a proposito.
// Necesita responder siempre para que Render sepa el estado real.

const { Router } = require('express');
const mongoose = require('mongoose');
const pkg = require('../../package.json');

const router = Router();

const READY_STATES = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
    99: 'uninitialized',
};

// Version: preferir el SHA del commit que Render inyecta al deploy.
// En dev local, cae a la version de package.json. En ningun caso rompe.
function getVersion() {
    if (process.env.RENDER_GIT_COMMIT) {
        return process.env.RENDER_GIT_COMMIT.slice(0, 7);
    }
    return pkg?.version ? `v${pkg.version}` : 'dev';
}

router.get('/', (req, res) => {
    const state = mongoose.connection.readyState;
    const dbLabel = READY_STATES[state] || String(state);
    const dbHealthy = state === 1;

    const body = {
        status: dbHealthy ? 'ok' : 'degraded',
        db: dbLabel,
        uptime_s: Math.round(process.uptime()),
        version: getVersion(),
        timestamp: new Date().toISOString(),
    };

    if (!dbHealthy) {
        res.set('Retry-After', '5');
        return res.status(503).json(body);
    }
    return res.json(body);
});

module.exports = router;
