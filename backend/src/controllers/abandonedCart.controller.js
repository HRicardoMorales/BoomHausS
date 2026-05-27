// backend/src/controllers/abandonedCart.controller.js
const AbandonedCart = require('../models/AbandonedCart');
const { sendAbandonedCartEmail } = require('../services/emailService');

async function saveAbandonedCart(req, res) {
  try {
    const { email, phone, name, items, total, totalItems, step, landingSource, paymentMethod } = req.body;

    if (!email && !phone) return res.status(400).json({ ok: false });
    if (!items || items.length === 0) return res.status(400).json({ ok: false });

    // Upsert: si ya existe un carrito abandonado con ese email/phone, actualizar
    const filter = email ? { email } : { phone };
    const update = {
      email: email || null,
      phone: phone || null,
      name: name || null,
      items,
      totalAmount: total,
      totalItems,
      step,
      landingSource,
      paymentMethod,
      recovered: false,
      updatedAt: new Date(),
    };

    const doc = await AbandonedCart.findOneAndUpdate(filter, update, { upsert: true, new: true });

    // Enviar email de recuperación si tiene email y no se envió aún
    if (email && !doc.recoveryEmailSent) {
      const sent = await sendAbandonedCartEmail(doc);
      if (sent) {
        doc.recoveryEmailSent = true;
        await doc.save();
      }
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error('❌ Error abandoned cart:', err);
    return res.status(500).json({ ok: false });
  }
}

module.exports = { saveAbandonedCart };
