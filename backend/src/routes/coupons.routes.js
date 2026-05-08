// backend/src/routes/coupons.routes.js
const express = require('express');
const {
  validateCoupon,
  listCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} = require('../controllers/coupons.controller');
const { authRequired, adminRequired } = require('../middlewares/authMiddleware');

const router = express.Router();

// POST /api/coupons/validate  — público (lo llama el checkout sin login)
router.post('/validate', validateCoupon);

// GET    /api/coupons          — admin: listar todos los cupones
// POST   /api/coupons          — admin: crear cupón
// PATCH  /api/coupons/:id      — admin: editar / toggle isActive
// DELETE /api/coupons/:id      — admin: eliminar cupón
router.get   ('/',    authRequired, adminRequired, listCoupons);
router.post  ('/',    authRequired, adminRequired, createCoupon);
router.patch ('/:id', authRequired, adminRequired, updateCoupon);
router.delete('/:id', authRequired, adminRequired, deleteCoupon);

module.exports = router;
