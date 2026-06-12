// backend/src/services/orderPricing.js
//
// Calcula el total de una orden SERVER-SIDE.
// El total que manda el frontend NUNCA se usa como autoridad: se compara
// contra el cálculo del backend y, si difiere, se loguea un warning pero
// se persiste el del servidor.
//
// Fuentes de precio (en orden):
//   1. MongoDB: Product.findById(productId) o Product.findOne({ slug })
//   2. Fallback: backend/src/config/productPrices.js
//   3. Ninguna → 400

const mongoose = require('mongoose');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const PRICE_CONFIG = require('../config/productPrices');

// Costos de envío fijos (espejan los SHIP_OPTS del frontend).
// Si en el futuro varían por zona, mover a una colección con admin.
const SHIPPING_COSTS = {
  sucursal:    0,
  domicilio:   2980,
  prioritario: 4890,
  // legacy / aliases tolerados:
  correo_argentino: 0,
  caba_cod:         0,
};

function isObjectId(v) {
  return typeof v === 'string' && mongoose.Types.ObjectId.isValid(v) && /^[a-f0-9]{24}$/i.test(v);
}

/**
 * Resuelve el precio real de una línea (producto + cantidad).
 * Returns: { ok: true, lineTotal, unitPrice, source } | { ok: false, error }
 */
async function resolveLinePrice(productIdRaw, qty) {
  if (!productIdRaw) return { ok: false, error: 'productId vacío' };
  if (!Number.isFinite(qty) || qty <= 0) return { ok: false, error: 'quantity inválida' };

  let product = null;

  // 1) Buscar en BD por ObjectId
  if (isObjectId(productIdRaw)) {
    product = await Product.findById(productIdRaw).lean();
  }

  // 2) Buscar en BD por slug
  if (!product) {
    product = await Product.findOne({ slug: String(productIdRaw) }).lean();
  }

  if (product) {
    // ¿Hay un bundle con esta qty?
    const bundle = Array.isArray(product.bundles)
      ? product.bundles.find((b) => Number(b.qty) === Number(qty))
      : null;

    if (bundle && Number.isFinite(Number(bundle.price)) && Number(bundle.price) > 0) {
      const lineTotal = Math.round(Number(bundle.price));
      return {
        ok: true,
        lineTotal,
        unitPrice: Math.round(lineTotal / qty),
        source: 'db-bundle',
      };
    }

    // Sin bundle: precio unitario × cantidad
    if (Number.isFinite(Number(product.price)) && Number(product.price) > 0) {
      const unitPrice = Math.round(Number(product.price));
      return {
        ok: true,
        lineTotal: unitPrice * qty,
        unitPrice,
        source: 'db-unit',
      };
    }
  }

  // 3) Fallback: tabla de config
  const cfg = PRICE_CONFIG[String(productIdRaw)];
  if (cfg) {
    if (cfg.bundles && cfg.bundles[qty] != null) {
      const lineTotal = Math.round(Number(cfg.bundles[qty]));
      return {
        ok: true,
        lineTotal,
        unitPrice: Math.round(lineTotal / qty),
        source: 'config-bundle',
      };
    }
    if (Number.isFinite(Number(cfg.price)) && Number(cfg.price) > 0) {
      const unitPrice = Math.round(Number(cfg.price));
      return {
        ok: true,
        lineTotal: unitPrice * qty,
        unitPrice,
        source: 'config-unit',
      };
    }
  }

  return {
    ok: false,
    error: `producto desconocido o sin precio válido: "${productIdRaw}" (qty=${qty})`,
  };
}

/**
 * Valida un código de cupón contra la BD y devuelve el monto a descontar.
 * Returns: { ok: true, code, discount, coupon } | { ok: false, error }
 *          { ok: true, discount: 0, coupon: null } si no se mandó código.
 */
async function resolveCoupon(couponCode, subtotal) {
  if (!couponCode) return { ok: true, discount: 0, coupon: null };

  const code = String(couponCode).trim().toUpperCase();
  if (!code) return { ok: true, discount: 0, coupon: null };

  const coupon = await Coupon.findOne({ code });
  if (!coupon) return { ok: false, error: `Cupón "${code}" no existe.` };
  if (!coupon.isActive) return { ok: false, error: `Cupón "${code}" está inactivo.` };
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    return { ok: false, error: `Cupón "${code}" venció.` };
  }
  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
    return { ok: false, error: `Cupón "${code}" alcanzó el máximo de usos.` };
  }
  if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
    return { ok: false, error: `El cupón requiere un mínimo de $${coupon.minOrderAmount}.` };
  }

  let discount = 0;
  if (coupon.type === 'percent') {
    discount = Math.round((subtotal * Number(coupon.value)) / 100);
  } else if (coupon.type === 'fixed') {
    discount = Math.min(subtotal, Math.round(Number(coupon.value)));
  }

  return { ok: true, code, discount, coupon };
}

function getShippingCost(method) {
  const key = String(method || '').trim();
  return SHIPPING_COSTS[key] ?? 0;
}

/**
 * Calcula el total final de una orden.
 * Returns:
 *   { ok: true, subtotal, shippingCost, discount, total, items, coupon, warnings }
 *   { ok: false, error }
 *
 * - items: array de { productId, quantity, unitPrice, lineTotal, source }
 *          en el MISMO orden que `inputItems`.
 * - warnings: incluye un mensaje si `frontendTotal` (opcional) difiere
 *             del total calculado server-side por más de $1.
 */
async function calculateOrderPricing({
  items: inputItems,
  shippingMethod,
  couponCode,
  frontendTotal,
}) {
  if (!Array.isArray(inputItems) || inputItems.length === 0) {
    return { ok: false, error: 'El carrito no puede estar vacío.' };
  }

  const items = [];
  let subtotal = 0;

  for (let i = 0; i < inputItems.length; i++) {
    const it = inputItems[i];
    const productIdRaw = it.productId || it._id || it.id;
    const qty = Number(it.quantity);

    const resolved = await resolveLinePrice(productIdRaw, qty);
    if (!resolved.ok) {
      return { ok: false, error: `Item #${i + 1}: ${resolved.error}` };
    }

    subtotal += resolved.lineTotal;
    items.push({
      productId: productIdRaw,
      quantity: qty,
      unitPrice: resolved.unitPrice,
      lineTotal: resolved.lineTotal,
      source: resolved.source,
    });
  }

  const shippingCost = getShippingCost(shippingMethod);

  const couponRes = await resolveCoupon(couponCode, subtotal);
  if (!couponRes.ok) return { ok: false, error: couponRes.error };

  const total = Math.max(0, subtotal - couponRes.discount + shippingCost);

  const warnings = [];
  if (
    frontendTotal != null &&
    Number.isFinite(Number(frontendTotal)) &&
    Math.abs(Number(frontendTotal) - total) > 1
  ) {
    warnings.push(
      `frontendTotal=${frontendTotal} difiere del serverTotal=${total} (delta=${Number(frontendTotal) - total})`,
    );
  }

  return {
    ok: true,
    subtotal,
    shippingCost,
    discount: couponRes.discount,
    couponCode: couponRes.code || null,
    coupon: couponRes.coupon,
    total,
    items,
    warnings,
  };
}

module.exports = {
  calculateOrderPricing,
  resolveLinePrice,
  resolveCoupon,
  getShippingCost,
  SHIPPING_COSTS,
};
