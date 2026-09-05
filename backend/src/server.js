// backend/src/server.js
//
// Bootstrap del server + graceful shutdown.
//
// Render envia SIGTERM en cada deploy. Sin handler:
//   - Requests en vuelo se cortan brutalmente (posibles ordenes a medio
//     crear en la BD).
//   - Mongoose no cierra su pool (Atlas ve la conexion caida solo por
//     timeout, unos segundos despues).
//   - El proceso muere sucio.
//
// Con handler:
//   1. Dejamos de aceptar conexiones nuevas (server.close()).
//   2. Damos hasta SHUTDOWN_TIMEOUT_MS para que las requests en vuelo
//      terminen.
//   3. Cerramos mongoose.
//   4. Exit clean (0). Si algo se cuelga, force exit a los timeout ms.

const mongoose = require('mongoose');
const app = require('./app');

const PORT = process.env.PORT || 4000;
const SHUTDOWN_TIMEOUT_MS = 10_000; // 10s para drenar requests en vuelo

const server = app.listen(PORT, () => {
    console.log(`🚀 API escuchando en http://localhost:${PORT}`);
});

let shuttingDown = false;

async function shutdown(signal) {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`\n🛑 ${signal} recibido. Iniciando graceful shutdown...`);

    // Force exit si algo se cuelga (mongo drainage, http keep-alive largo, etc)
    const forceExit = setTimeout(() => {
        console.error(`⏱️ Shutdown timeout (${SHUTDOWN_TIMEOUT_MS}ms). Force exit.`);
        process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
    // Evita que este timer bloquee el exit natural cuando todo termine bien.
    forceExit.unref();

    server.close(async (err) => {
        if (err) {
            console.error('❌ Error cerrando HTTP server:', err.message);
        } else {
            console.log('✅ HTTP server cerrado — no acepta conexiones nuevas');
        }
        try {
            await mongoose.connection.close(false); // false = no force
            console.log('✅ MongoDB desconectado ordenadamente');
        } catch (e) {
            console.error('❌ Error cerrando MongoDB:', e?.message || e);
        }
        clearTimeout(forceExit);
        process.exit(0);
    });
}

// Render manda SIGTERM en cada deploy y en spin-down.
process.on('SIGTERM', () => shutdown('SIGTERM'));
// Ctrl+C en dev local.
process.on('SIGINT', () => shutdown('SIGINT'));

// Ultima red de seguridad — no matamos el proceso, solo loggeamos.
// Un unhandledRejection que tumbaba antes proceso ahora queda registrado
// pero el server sigue vivo para atender otras requests.
process.on('unhandledRejection', (reason) => {
    console.error('⚠️ unhandledRejection:', reason);
});
process.on('uncaughtException', (err) => {
    console.error('⚠️ uncaughtException:', err?.message || err);
});
