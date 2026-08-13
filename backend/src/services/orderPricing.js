// backend/src/services/orderPricing.js
//
// Fuente autoritativa de precios server-side.
// El frontend calcula el total para UX (mostrar en la sheet) pero NO se le
// puede creer: cualquier valor que llega en req.body puede haber sido tocado
// con devtools. Este servicio recalcula el total desde la BD (Product + Coupon)
// más una tabla de envíos hardcoded que espeja SHIP_OPTS del checkout.
//
// Uso desde orders.controller.createOrder:
//   const { expectedTotal, breakdown, discrepancies } = await computeExpectedTotal({ items, shippingMethod, couponCode });
//   → shadow: si frontendTotal !== expectedTotal, loguear discrepancia y usar frontendTotal.
//   → enforce: usar expectedTotal siempre.
//
// Modo: process.env.PRICE_ENFORCEMENT ∈ { 'shadow', 'enforce' }. Default 'shadow'.
//
// Contract del logger: en shadow mode los WARN muestran orden, frontend, server,
// diff y detalle por item (bundle/price/subtotal). Ver README-price-enforcement
// en el commit para la guía de interpretación.

const mongoose = require('mongoose');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');

// Tabla espeja SHIP_OPTS del frontend (CheckoutSheet.jsx:106). Si cambian ahí,
// cambiar acá también. `val` (frontend) === `method` (backend key).
const SHIPPING_COSTS = {
  sucursal:    0,
  domicilio:   2980,
  prioritario: 4890,
  caba_cod:    0,
};

function getShippingCost(method) {
  const key = String(method || '').trim();
  if (Object.prototype.hasOwnProperty.call(SHIPPING_COSTS, key)) return SHIPPING_COSTS[key];
  // Backwards compat: valores legacy que el modelo Order admite como default.
  if (key === 'correo_argentino') return 0;
  return null; // desconocido → discrepancia
}

// Detecta si `id` parece un ObjectId Mongo. Los productos también pueden
// referenciarse por slug (string arbitrario); Order.items.productId es Mixed.
function isObjectIdLike(id) {
  return typeof id === 'string' && /^[a-f0-9]{24}$/i.test(id);
}

// Trae todos los productos que corresponden a los items del carrito.
// Devuelve dos mapas para lookup rápido: por _id (ObjectId string) y por slug.
async function loadProductsForItems(items) {
  const ids = new Set();
  const slugs = new Set();
  for (const it of items) {
    const pid = it?.productId;
    if (pid == null) continue;
    const str = String(pid);
    if (isObjectIdLike(str)) ids.add(str);
    else slugs.add(str);
  }

  const query = [];
  if (ids.size) query.push({ _id: { $in: [...ids].map(s => new mongoose.Types.ObjectId(s)) } });
  if (slugs.size) query.push({ slug: { $in: [...slugs] } });

  const products = query.length
    ? await Product.find({ $or: query }).lean()
    : [];

  const byId = new Map();
  const bySlug = new Map();
  for (const p of products) {
    byId.set(String(p._id), p);
    if (p.slug) bySlug.set(p.slug, p);
  }
  return { byId, bySlug };
}

function resolveProduct({ byId, bySlug }, productId) {
  if (productId == null) return null;
  const str = String(productId);
  if (isObjectIdLike(str) && byId.has(str)) return byId.get(str);
  if (bySlug.has(str)) return bySlug.get(str);
  // Fallback: alguien mandó un ObjectId string que coincide con un slug
  if (byId.has(str)) return byId.get(str);
  return null;
}

// Calcula el subtotal de items usando precio autoritativo de BD.
// Si el item trae bundleTotal, se busca un bundle del producto que matchee
// (qty + price). Si no matchea ningún bundle, es una discrepancia.
function computeItemsSubtotal(items, productMaps) {
  const itemDetails = [];
  let subtotal = 0;

  for (const it of items) {
    const product = resolveProduct(productMaps, it.productId);
    const detail = {
      productId: String(it.productId ?? ''),
      name: it.name,
      quantity: it.quantity,
      clientPrice: it.price,
      clientBundle: it.bundleTotal || null,
      serverLineTotal: null,
      status: 'ok',
      note: null,
    };

    if (!product) {
      detail.status = 'discrepancy';
      detail.note = 'product_not_found';
      // Fallback conservador: creer el precio del cliente para no bloquear
      // el shadow. En enforce, esto igual se rechaza porque expectedTotal
      // será distinto — pero al menos loguea algo útil.
      detail.serverLineTotal = (Number(it.price) || 0) * (Number(it.quantity) || 0);
      subtotal += detail.serverLineTotal;
      itemDetails.push(detail);
      continue;
    }

    if (it.bundleTotal != null && Number(it.bundleTotal) > 0) {
      const bundle = (product.bundles || []).find(
        b => Number(b.qty) === Number(it.quantity) && Number(b.price) === Number(it.bundleTotal)
      );
      if (bundle) {
        detail.serverLineTotal = Number(bundle.price);
      } else {
        detail.status = 'discrepancy';
        detail.note = 'bundle_no_match';
        detail.serverLineTotal = Number(it.bundleTotal); // conservador para el shadow
      }
    } else {
      detail.serverLineTotal = Number(product.price) * Number(it.quantity);
      if (Number(it.price) !== Number(product.price)) {
        detail.status = 'discrepancy';
        detail.note = `price_mismatch (server=${product.price})`;
      }
    }

    subtotal += detail.serverLineTotal;
    itemDetails.push(detail);
  }

  return { subtotal, itemDetails };
}

// Replica la lógica del frontend (CheckoutSheet:174-178): percent redondea a
// entero, fixed clampeado a subtotal. Devuelve descuento en ARS.
function computeCouponDiscount(coupon, subtotal) {
  if (!coupon) return 0;
  if (coupon.type === 'percent') return Math.round(subtotal * Number(coupon.value) / 100);
  return Math.min(Number(coupon.value), subtotal);
}

// Trae el cupón por código si es válido (activo + no expirado + usos disponibles).
// Devuelve null si no aplica — el discount queda en 0 y el shadow flaggea la diff.
async function loadValidCoupon(code) {
  const cleanCode = String(code || '').trim().toUpperCase();
  if (!cleanCode) return null;
  const coupon = await Coupon.findOne({ code: cleanCode, isActive: true }).lean();
  if (!coupon) return null;
  if (coupon.expiresAt && new Date() > coupon.expiresAt) return null;
  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) return null;
  return coupon;
}

// Entrada principal usada por createOrder.
async function computeExpectedTotal({ items, shippingMethod, couponCode }) {
  const productMaps = await loadProductsForItems(items || []);
  const { subtotal, itemDetails } = computeItemsSubtotal(items || [], productMaps);

  const shipping = getShippingCost(shippingMethod);
  const shippingResolved = shipping == null ? 0 : shipping;

  const coupon = couponCode ? await loadValidCoupon(couponCode) : null;
  const discount = computeCouponDiscount(coupon, subtotal);

  const expectedTotal = Math.max(0, Math.round(subtotal - discount + shippingResolved));

  const discrepancies = itemDetails.filter(d => d.status === 'discrepancy');
  if (shipping == null) discrepancies.push({ field: 'shipping', note: `unknown_method(${shippingMethod})` });
  if (couponCode && !coupon) discrepancies.push({ field: 'coupon', note: `invalid_or_missing(${couponCode})` });

  return {
    expectedTotal,
    breakdown: {
      itemsSubtotal: subtotal,
      discount,
      shipping: shippingResolved,
      shippingMethod: String(shippingMethod || ''),
      couponApplied: coupon ? { code: coupon.code, type: coupon.type, value: coupon.value } : null,
    },
    itemDetails,
    discrepancies,
  };
}

// Incremento atómico de Coupon.usedCount con guard: solo suma 1 si el cupón
// sigue activo, no expiró, y hay slots disponibles (o maxUses es null).
// Devuelve el cupón actualizado, o null si la condición no matcheó (race,
// expiración, agotamiento). Los callers logean pero no rompen la orden — el
// costo de perder un incremento es menor que rechazar una compra buena.
async function incrementCouponUsage(code) {
  const cleanCode = String(code || '').trim().toUpperCase();
  if (!cleanCode) return null;
  const now = new Date();
  return Coupon.findOneAndUpdate(
    {
      code: cleanCode,
      isActive: true,
      $and: [
        { $or: [{ maxUses: null }, { $expr: { $lt: ['$usedCount', '$maxUses'] } }] },
        { $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] },
      ],
    },
    { $inc: { usedCount: 1 } },
    { new: true }
  );
}

function getEnforcementMode() {
  const mode = String(process.env.PRICE_ENFORCEMENT || 'shadow').toLowerCase();
  return mode === 'enforce' ? 'enforce' : 'shadow';
}

module.exports = {
  computeExpectedTotal,
  incrementCouponUsage,
  getEnforcementMode,
  SHIPPING_COSTS, // exportado para tests / debugging
};
