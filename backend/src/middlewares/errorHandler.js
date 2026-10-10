// backend/src/middlewares/errorHandler.js

const logger = require('../utils/logger').child('http');
function errorHandler(err, req, res, next) {
    const status = err.statusCode || err.status || 500;

    // ✅ Mensaje seguro (no filtramos stack ni detalles internos al cliente)
    const message =
        status >= 500
            ? 'Error interno del servidor.'
            : err.message || 'Error.';

    // ✅ Log estructurado (sin datos sensibles)
    // No logueamos req.body completo (puede contener email, teléfono, etc.)
    // Solo la ruta y método.
    // 5xx → error con stack; 4xx → warn (errores esperables del cliente).
    const level = status >= 500 ? 'error' : 'warn';
    logger[level]('API Error', {
        status,
        path: req.originalUrl.split('?')[0],
        method: req.method,
        reqId: req.id,
    }, status >= 500 ? err : { message: err.message });

    // Si ya se enviaron headers, delegamos
    if (res.headersSent) return next(err);

    return res.status(status).json({
        ok: false,
        message
    });
}

module.exports = errorHandler;
