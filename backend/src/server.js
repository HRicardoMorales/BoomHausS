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

// `exitCode` param permite distinguir shutdown limpio (SIGTERM/SIGINT → 0)
// de shutdown por bug (uncaughtException → 1). Render trata ambos igual
// (levanta instancia nueva), pero el exit code queda en logs para diagnostico.
async function shutdown(signal, exitCode = 0) {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`\n🛑 ${signal} recibido. Iniciando graceful shutdown (exit=${exitCode})...`);

    // Force exit si algo se cuelga (mongo drainage, http keep-alive largo, etc)
    const forceExit = setTimeout(() => {
        console.error(`⏱️ Shutdown timeout (${SHUTDOWN_TIMEOUT_MS}ms). Force exit.`);
        process.exit(exitCode || 1);
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
        process.exit(exitCode);
    });
}

// Render manda SIGTERM en cada deploy y en spin-down.
process.on('SIGTERM', () => shutdown('SIGTERM', 0));
// Ctrl+C en dev local.
process.on('SIGINT', () => shutdown('SIGINT', 0));

// ── unhandledRejection: loguear detalle, NO matar ───────────────────────
// Promise rejected sin .catch(). Usualmente es un bug puntual que no deja
// el proceso en estado inconsistente — la operacion fallo pero el resto
// del server sigue sano. Loggeamos con stack (si viene) para diagnostico
// y seguimos atendiendo requests.
process.on('unhandledRejection', (reason) => {
    console.error('⚠️ unhandledRejection:', reason?.stack || reason);
});

// ── uncaughtException: loguear stack completo, SHUTDOWN ORDENADO ────────
// Una excepcion sincrona no capturada implica que el stack trepo hasta
// arriba sin nadie que la maneje. El proceso puede quedar en estado
// corrupto: variables medio-seteadas, locks colgados, mongoose en estado
// raro, hooks a medio ejecutar. Servir respuestas desde ese estado es
// peor que un reinicio de ~5s — en una tienda con pagos, corrupcion
// silenciosa es catastrofica.
//
// Diferencia clave vs el process.exit(1) que sacamos de db.js:
//   - db.js: fallo TRANSITORIO y ESPERABLE (Atlas momentaneamente lento,
//     network flap). Matar el proceso era desproporcionado — el retry
//     con backoff resuelve solo, sin dropear ninguna request en vuelo.
//   - Aca: BUG REAL con proceso en estado indeterminado. El único
//     camino seguro es shutdown ordenado + salida con exit 1. Render
//     levanta instancia limpia inmediatamente.
process.on('uncaughtException', (err) => {
    console.error('💥 uncaughtException — proceso en estado inconsistente:');
    console.error(err?.stack || err?.message || err);
    shutdown('uncaughtException', 1);
});
