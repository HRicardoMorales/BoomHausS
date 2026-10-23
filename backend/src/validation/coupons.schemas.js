// backend/src/validation/coupons.schemas.js
//
// Contrato de entrada de POST /api/coupons/validate (público, sin login).
// Solo acota la forma del input; la lógica del cupón (vigencia, usos,
// mínimo, descuento) sigue en el controller sin cambios.

const { z } = require('zod');

const validateCouponBody = z.object({
  code: z
    .string({ error: 'Ingresá un código de cupón.' })
    .trim()
    .toUpperCase()
    .min(1, 'Ingresá un código de cupón.')
    // Sin regex de charset: el admin puede crear códigos con cualquier
    // carácter y no queremos invalidar cupones existentes. Con exigir
    // string ya no puede llegar un operador de Mongo a `findOne`.
    .max(40, 'Código inválido o expirado.'),
  // Solo se usa para el mínimo de compra; el controller hace Number(x) || 0.
  cartTotal: z
    .union([z.number(), z.string()], { error: 'Total del carrito inválido.' })
    .nullish(),
});

module.exports = { validateCouponBody };
