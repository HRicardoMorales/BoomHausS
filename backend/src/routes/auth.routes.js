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

// --- DEFINICIÓN DE RUTAS ---

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/register
router.post('/register', register);

// Ejemplo: PUT /api/auth/make-admin/:id (solo admins)
router.put('/make-admin/:id', authRequired, adminRequired, makeAdmin);

// Rutas de recuperación de contraseña
// Ahora usamos las variables directas, ya no "authController.forgotPassword"
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

module.exports = router;