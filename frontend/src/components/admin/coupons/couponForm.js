// frontend/src/components/admin/coupons/couponForm.js
// Lógica pura del admin de cupones: normalización y validación del formulario,
// payload para `POST /api/coupons`, estado de cada cupón y textos de la lista.
// Sin React ni API: todo se prueba en `couponForm.test.js`.
import { moneyARS } from '../../../utils/pricing.js';

const AR_TZ = 'America/Argentina/Buenos_Aires';
/** Argentina no tiene horario de verano desde 2009: el offset es fijo. */
const AR_OFFSET = '-03:00';

export const CODE_MAX = 30;
const CODE_MIN = 3;

export const EMPTY_FORM = Object.freeze({
  code: '', type: 'percent', value: '', minOrderAmount: '', maxUses: '', expiresAt: '',
});

/** "promo 10%" → "PROMO10": mayúsculas, solo letras, números, guion y guion bajo. */
export function normalizeCode(raw) {
  return String(raw ?? '')
    .toUpperCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Z0-9_-]/g, '')
    .slice(0, CODE_MAX);
}

/** Fecha de hoy en Argentina como `YYYY-MM-DD` (para el `min` del input date). */
export function todayAR(now = new Date()) {
  // en-CA formatea como YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', { timeZone: AR_TZ }).format(now);
}

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

function isRealDate(ymd) {
  const m = DATE_RE.exec(ymd);
  if (!m) return false;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
}

/**
 * "Vence el 1/11" significa que el cupón sirve **todo** el 1/11 en Argentina.
 * Antes se mandaba "2026-11-01" pelado: el servidor lo guardaba como 00:00 UTC
 * (= 31/10 21:00 en AR), así que el cupón moría tres horas antes de empezar el
 * día elegido y la lista mostraba "Vence: 31/10".
 */
export function expiryEndOfDay(ymd) {
  return `${ymd}T23:59:59.999${AR_OFFSET}`;
}

const toNumber = (v) => (typeof v === 'number' ? v : String(v ?? '').trim() === '' ? NaN : Number(v));

/**
 * Valida el formulario y arma el payload. Devuelve
 * `{ ok: true, payload }` o `{ ok: false, field, message }` con el primer error,
 * en el orden en que se ven los campos.
 */
export function validateCouponForm(form, now = new Date()) {
  const fail = (field, message) => ({ ok: false, field, message });

  const code = normalizeCode(form.code);
  if (!code) return fail('code', 'Ingresá un código.');
  if (code.length < CODE_MIN) return fail('code', `El código tiene que tener al menos ${CODE_MIN} caracteres.`);

  const type = form.type === 'fixed' ? 'fixed' : 'percent';
  const value = toNumber(form.value);
  if (!Number.isFinite(value) || value <= 0) return fail('value', 'Ingresá un descuento mayor a 0.');
  if (type === 'percent' && value > 100) return fail('value', 'Un porcentaje no puede superar el 100 %.');
  if (type === 'percent' && !Number.isInteger(value)) return fail('value', 'Usá un porcentaje entero (ej: 15).');
  if (type === 'fixed' && !Number.isInteger(value)) return fail('value', 'Usá un monto en pesos sin centavos.');

  let minOrderAmount = 0;
  if (String(form.minOrderAmount ?? '').trim() !== '') {
    minOrderAmount = toNumber(form.minOrderAmount);
    if (!Number.isFinite(minOrderAmount) || minOrderAmount < 0) return fail('minOrderAmount', 'El pedido mínimo no puede ser negativo.');
  }
  if (type === 'fixed' && minOrderAmount > 0 && value >= minOrderAmount) {
    return fail('value', `El descuento (${moneyARS(value)}) cubre todo el pedido mínimo (${moneyARS(minOrderAmount)}): el pedido saldría gratis.`);
  }

  let maxUses = null;
  if (String(form.maxUses ?? '').trim() !== '') {
    maxUses = toNumber(form.maxUses);
    if (!Number.isInteger(maxUses) || maxUses < 1) return fail('maxUses', 'Los usos máximos tienen que ser un número entero desde 1.');
  }

  let expiresAt = null;
  const ymd = String(form.expiresAt ?? '').trim();
  if (ymd) {
    if (!isRealDate(ymd)) return fail('expiresAt', 'La fecha de vencimiento no es válida.');
    if (ymd < todayAR(now)) return fail('expiresAt', 'La fecha de vencimiento ya pasó.');
    expiresAt = expiryEndOfDay(ymd);
  }

  return { ok: true, payload: { code, type, value, minOrderAmount, maxUses, expiresAt } };
}

/**
 * Estado del cupón en el checkout. `active` solo si está activado, no venció y
 * le quedan usos. Puede tener más de un motivo a la vez (desactivado y vencido).
 */
export function couponStatus(c, now = new Date()) {
  const expired = Boolean(c?.expiresAt) && now > new Date(c.expiresAt);
  const exhausted = c?.maxUses != null && Number(c.usedCount || 0) >= Number(c.maxUses);
  const disabled = !c?.isActive;
  const reasons = [];
  if (disabled) reasons.push('disabled');
  if (expired) reasons.push('expired');
  if (exhausted) reasons.push('exhausted');
  return { live: reasons.length === 0, reasons };
}

export const REASON_LABEL = Object.freeze({
  disabled: 'Desactivado',
  expired: 'Vencido',
  exhausted: 'Usos agotados',
});

export function describeDiscount(c) {
  return c?.type === 'fixed' ? `${moneyARS(c.value)} de descuento` : `${Number(c?.value) || 0} % de descuento`;
}

export function usesLabel(c) {
  const used = Number(c?.usedCount) || 0;
  return c?.maxUses != null ? `${used} de ${c.maxUses} usos` : `${used} usos · sin límite`;
}

/**
 * Fecha de vencimiento legible. Los cupones creados antes del arreglo quedaron a
 * las 00:00 UTC del día elegido: esos se muestran en UTC para que digan el día que
 * eligió el admin (y no el anterior); el resto, en hora de Argentina.
 */
export function formatExpiry(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const legacy = d.getUTCHours() === 0 && d.getUTCMinutes() === 0 && d.getUTCSeconds() === 0 && d.getUTCMilliseconds() === 0;
  return d.toLocaleDateString('es-AR', { timeZone: legacy ? 'UTC' : AR_TZ, day: 'numeric', month: 'short', year: 'numeric' });
}

/** Cuenta para el encabezado: total y cuántos funcionan hoy en el checkout. */
export function couponSummary(coupons, now = new Date()) {
  const list = Array.isArray(coupons) ? coupons : [];
  const live = list.filter((c) => couponStatus(c, now).live).length;
  return { total: list.length, live };
}
