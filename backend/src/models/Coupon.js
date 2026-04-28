// backend/src/models/Coupon.js
const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    // 'percent' = porcentaje (ej: 15 = 15%), 'fixed' = monto fijo ARS
    type: {
      type: String,
      enum: ['percent', 'fixed'],
      required: true,
      default: 'percent',
    },
    // Para percent: 1-100. Para fixed: monto en ARS.
    value: {
      type: Number,
      required: true,
      min: 0,
    },
    // Monto mínimo del carrito para que aplique (0 = sin mínimo)
    minOrderAmount: {
      type: Number,
      default: 0,
    },
    // Límite de usos (null = ilimitado)
    maxUses: {
      type: Number,
      default: null,
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Fecha de vencimiento (null = sin vencimiento)
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Coupon', couponSchema);
