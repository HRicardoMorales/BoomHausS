// backend/src/routes/auth.routes.js

const { Router } = require('express');
const {
    login,
    register,
    makeAdmin
} = require('../controllers/auth.controller');
const {
    authRequired,
    adminRequired
} = require('../middlewares/authMiddleware');

const router = Router();

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/register
router.post('/register', register);

// Ejemplo: PUT /api/auth/make-admin/:id (solo admins)
router.put('/make-admin/:id', authRequired, adminRequired, makeAdmin);

module.exports = router;
