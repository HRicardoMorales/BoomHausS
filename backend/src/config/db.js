// backend/src/config/db.js
//
// Conexion a MongoDB Atlas con resiliencia:
//   - Timeout corto (5s) para no colgar requests eternamente.
//   - Retry con backoff exponencial capado (1s → 30s), loop infinito.
//     Una caida momentanea de Atlas NO mata el proceso — el server sigue
//     vivo para responder /api/health con 503, y en cuanto Atlas vuelve
//     reconecta automaticamente.
//   - Listeners de eventos mongoose para logs claros del estado.
//   - Expone isDbReady() para middleware de gate en app.js.
//
// Nota: mongoose auto-reconecta despues de que la primera conexion sea
// exitosa (retry manejado internamente). La logica de retry de este archivo
// cubre principalmente el bootstrap y catastrofes donde mongoose necesita
// re-conectar desde cero (ej. Atlas cambia credenciales, DNS temporal, etc).

const mongoose = require('mongoose');

// Estado observable para el middleware de gate y para /api/health.
function isDbReady() {
    return mongoose.connection.readyState === 1;
}

// Listeners: se registran UNA sola vez al importar el modulo.
mongoose.connection.on('connected', () => {
    console.log('✅ MongoDB conectado');
});
mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ MongoDB desconectado');
});
mongoose.connection.on('reconnected', () => {
    console.log('✅ MongoDB reconectado');
});
mongoose.connection.on('error', (err) => {
    // No hacemos throw ni exit — solo loggeamos. Mongoose maneja reconexion
    // internamente. Si el error es persistente, isDbReady() devuelve false
    // y el middleware de app.js gatea con 503.
    console.error('❌ MongoDB error:', err?.message || err);
});

// Backoff exponencial capado. Delays: 1s, 2s, 4s, 8s, 16s, 30s, 30s, 30s, ...
function nextDelay(attempt) {
    const exp = Math.min(attempt - 1, 5); // cap del exponente en 5 → 2^5 = 32
    return Math.min(1000 * Math.pow(2, exp), 30_000);
}

async function connectWithRetry() {
    const uri = process.env.MONGO_URI;
    if (!uri) {
        console.error('❌ FALTA MONGO_URI en env. El server arranco pero no puede servir datos.');
        return;
    }

    let attempt = 0;
    // Loop infinito: si Atlas esta caido 5 minutos, seguimos reintentando.
    // Cuando vuelve, conectamos automaticamente sin necesidad de redeploy.
    while (true) {
        attempt++;
        try {
            await mongoose.connect(uri, {
                serverSelectionTimeoutMS: 5000, // 5s en vez del default 30s
            });
            // Exito — el listener 'connected' loguea. Salimos del loop.
            return;
        } catch (err) {
            const delay = nextDelay(attempt);
            console.warn(
                `⚠️ MongoDB conexion intento ${attempt} fallido: ${err?.message || err}. Reintentando en ${Math.round(delay / 1000)}s.`
            );
            await new Promise((r) => setTimeout(r, delay));
        }
    }
}

// Fire-and-forget: el caller (app.js) no espera. Requests que lleguen
// antes de conectar son gateadas por el middleware con 503.
function connectDB() {
    // No await, no throw. Kick off el loop y devolver.
    connectWithRetry().catch((err) => {
        // Guard defensivo — connectWithRetry no deberia rechazar (loop infinito
        // tiene su try/catch interno), pero por si acaso.
        console.error('❌ connectWithRetry rejected (no deberia pasar):', err);
    });
}

module.exports = connectDB;
module.exports.isDbReady = isDbReady;
