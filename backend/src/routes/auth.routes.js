// backend/src/routes/auth.routes.js
const express = require('express');
const router = express.Router();

// Importamos TODAS las funciones del controlador aquí
// Asegúrate de que la ruta '../controllers/auth.controller' sea correcta
const {
    login,
    register,
    makeAdmin,
    forgotPassword, // 👈 Agregamos esto
    resetPassword   // 👈 Y esto
} = require('../controllers/auth.controller');

const {
    authRequired,
    adminRequired
} = require('../middlewares/authMiddleware');
const { validate } = require('../middlewares/validate');
const validateObjectId = require('../middlewares/validateObjectId');
const {
    loginBody,
    registerBody,
    forgotPasswordBody,
    resetPasswordParams,
    resetPasswordBody
} = require('../validation/auth.schemas');

// --- DEFINICIÓN DE RUTAS ---

// POST /api/auth/login
router.post('/login', validate({ body: loginBody }), login);

// POST /api/auth/register
router.post('/register', validate({ body: registerBody }), register);

// Ejemplo: PUT /api/auth/make-admin/:id (solo admins)
router.put('/make-admin/:id', authRequired, adminRequired, validateObjectId(), makeAdmin);

// Rutas de recuperación de contraseña
// Ahora usamos las variables directas, ya no "authController.forgotPassword"
router.post('/forgot-password', validate({ body: forgotPasswordBody }), forgotPassword);
router.post(
    '/reset-password/:token',
    validate({ params: resetPasswordParams, body: resetPasswordBody }),
    resetPassword
);

module.exports = router;