// backend/src/controllers/coupons.controller.js
const Coupon = require('../models/Coupon');

// POST /api/coupons/validate
async function validateCoupon(req, res, next) {
  try {
    const { code, cartTotal } = req.body || {};

    const cleanCode = String(code || '').trim().toUpperCase();
    if (!cleanCode) {
      return res.status(400).json({ ok: false, message: 'Ingresá un código de cupón.' });
    }

    const coupon = await Coupon.findOne({ code: cleanCode, isActive: true });
    if (!coupon) {
      return res.status(404).json({ ok: false, message: 'Código inválido o expirado.' });
    }

    // Verificar vencimiento
    if (coupon.expiresAt && new Date() > coupon.expiresAt) {
      return res.status(400).json({ ok: false, message: 'Este cupón ya expiró.' });
    }

    // Verificar usos disponibles
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      return res.status(400).json({ ok: false, message: 'Este cupón ya no tiene usos disponibles.' });
    }

    // Verificar monto mínimo
    const total = Number(cartTotal) || 0;
    if (coupon.minOrderAmount > 0 && total < coupon.minOrderAmount) {
      const fmt = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(coupon.minOrderAmount);
      return res.status(400).json({ ok: false, message: `Este cupón requiere un pedido mínimo de ${fmt}.` });
    }

    return res.json({
      ok: true,
      data: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { validateCoupon };
