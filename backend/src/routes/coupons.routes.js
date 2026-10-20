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
const validateObjectId = require('../middlewares/validateObjectId');
const { validate } = require('../middlewares/validate');
const { validateCouponBody } = require('../validation/coupons.schemas');

const router = express.Router();

// POST /api/coupons/validate  — público (lo llama el checkout sin login)
router.post('/validate', validate({ body: validateCouponBody }), validateCoupon);

// GET    /api/coupons          — admin: listar todos los cupones
// POST   /api/coupons          — admin: crear cupón
// PATCH  /api/coupons/:id      — admin: editar / toggle isActive
// DELETE /api/coupons/:id      — admin: eliminar cupón
router.get   ('/',    authRequired, adminRequired, listCoupons);
router.post  ('/',    authRequired, adminRequired, createCoupon);
router.patch ('/:id', authRequired, adminRequired, validateObjectId(), updateCoupon);
router.delete('/:id', authRequired, adminRequired, validateObjectId(), deleteCoupon);

module.exports = router;
