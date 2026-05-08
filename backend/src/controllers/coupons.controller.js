// backend/src/controllers/coupons.controller.js
const Coupon = require('../models/Coupon');

// POST /api/coupons/validate  — público (lo llama el checkout sin login)
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

// GET /api/coupons  — admin
async function listCoupons(req, res, next) {
  try {
    const coupons = await Coupon.find({}).sort({ createdAt: -1 });
    return res.json({ ok: true, data: coupons });
  } catch (error) {
    next(error);
  }
}

// POST /api/coupons  — admin
// Cómo crear cupones:
//   code        → string, se convierte a mayúsculas automáticamente (ej: "PROMO10")
//   type        → "percent" (porcentaje) | "fixed" (monto fijo en ARS)
//   value       → número. Para percent: 1-100. Para fixed: monto ARS (ej: 5000)
//   minOrderAmount → monto mínimo del carrito para que aplique (0 = sin mínimo)
//   maxUses     → cantidad de usos permitidos (omitir o null = ilimitado)
//   expiresAt   → fecha de vencimiento ISO 8601 (omitir o null = sin vencimiento)
async function createCoupon(req, res, next) {
  try {
    const { code, type, value, minOrderAmount, maxUses, expiresAt } = req.body || {};

    if (!code || !value) {
      return res.status(400).json({ ok: false, message: 'código y valor son obligatorios.' });
    }

    const coupon = await Coupon.create({
      code: String(code).trim().toUpperCase(),
      type: type || 'percent',
      value: Number(value),
      minOrderAmount: Number(minOrderAmount) || 0,
      maxUses: maxUses != null && maxUses !== '' ? Number(maxUses) : null,
      expiresAt: expiresAt || null,
    });

    return res.status(201).json({ ok: true, data: coupon });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ ok: false, message: 'Ya existe un cupón con ese código.' });
    }
    next(error);
  }
}

// PATCH /api/coupons/:id  — admin (toggle isActive, editar campos)
async function updateCoupon(req, res, next) {
  try {
    const allowed = ['isActive', 'value', 'type', 'minOrderAmount', 'maxUses', 'expiresAt', 'code'];
    const patch = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) patch[k] = req.body[k]; });
    if (patch.code) patch.code = String(patch.code).trim().toUpperCase();

    const coupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      { $set: patch },
      { new: true, runValidators: true },
    );
    if (!coupon) return res.status(404).json({ ok: false, message: 'Cupón no encontrado.' });
    return res.json({ ok: true, data: coupon });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/coupons/:id  — admin
async function deleteCoupon(req, res, next) {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) return res.status(404).json({ ok: false, message: 'Cupón no encontrado.' });
    return res.json({ ok: true });
  } catch (error) {
    next(error);
  }
}

module.exports = { validateCoupon, listCoupons, createCoupon, updateCoupon, deleteCoupon };
