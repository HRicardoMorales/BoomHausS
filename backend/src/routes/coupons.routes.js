// backend/src/routes/coupons.routes.js
const express = require('express');
const { validateCoupon } = require('../controllers/coupons.controller');

const router = express.Router();

// POST /api/coupons/validate  — público (lo llama el checkout sin login)
router.post('/validate', validateCoupon);

module.exports = router;
