// backend/src/middlewares/authMiddleware.js

const jwt = require('jsonwebtoken');
const User = require('../models/User');

function getTokenFromRequest(req) {
    const header = req.headers.authorization || '';
    if (header.startsWith('Bearer ')) return header.slice(7);

    // fallback: cookie (si algún día lo sumás)
    if (req.cookies?.token) return req.cookies.token;

    return null;
}

async function authRequired(req, res, next) {
    try {
        const token = getTokenFromRequest(req);

        if (!token) {
            return res.status(401).json({ ok: false, message: 'No autorizado (sin token).' });
        }

        const payload = jwt.verify(token, process.env.JWT_SECRET);

        // payload típico: { id, role, email }
        req.user = payload;

        // opcional (más fuerte): traer usuario real de DB
        // const user = await User.findById(payload.id).lean();
        // if (!user) return res.status(401).json({ ok:false, message:'Usuario no válido.' });
        // req.user = { ...payload, role: user.role };

        next();
    } catch (err) {
        return res.status(401).json({ ok: false, message: 'Token inválido o expirado.' });
    }
}

function adminOnly(req, res, next) {
    const role = req.user?.role;
    if (role !== 'admin') {
        return res.status(403).json({ ok: false, message: 'Acceso denegado (solo admin).' });
    }
    next();
}

// ✅ Alias por compatibilidad con tu código previo
const adminRequired = adminOnly;

module.exports = {
    authRequired,
    adminOnly,
    adminRequired
};


