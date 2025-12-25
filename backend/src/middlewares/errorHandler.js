// backend/src/middlewares/errorHandler.js

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
    console.error('❌ API Error:', {
        status,
        message: err.message,
        path: req.originalUrl,
        method: req.method
    });

    // Si ya se enviaron headers, delegamos
    if (res.headersSent) return next(err);

    return res.status(status).json({
        ok: false,
        message
    });
}

module.exports = errorHandler;
