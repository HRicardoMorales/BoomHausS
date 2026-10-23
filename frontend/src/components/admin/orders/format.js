// frontend/src/components/admin/orders/format.js
// Lógica pura del panel de ventas (pedidos y carritos abandonados):
// formatos, links de WhatsApp, textos para copiar, estadísticas y filtros.
// Sin React ni red, así se testea con datos de ejemplo.

export const PAYMENT_LABELS = { pending: 'Pendiente', proof_uploaded: 'Comprobante', approved: 'Aprobado', confirmed: 'Confirmado', rejected: 'Rechazado', cancelled: 'Cancelado' };
export const SHIPPING_LABELS = { pending: 'Pendiente', shipped: 'En camino', delivered: 'Entregado', cancelled: 'Cancelado' };
export const PAYMENT_OPTS = Object.keys(PAYMENT_LABELS);
export const SHIPPING_OPTS = Object.keys(SHIPPING_LABELS);

export const METHOD_MAP = {
  mercadopago: { label: 'Mercado Pago', ico: 'ao-met--mp' },
  cod: { label: 'Contra entrega', ico: 'ao-met--cod' },
  transfer: { label: 'Transferencia', ico: 'ao-met--tf' },
};

export const SHIP_METHOD_MAP = {
  caba_cod: 'CABA · pago al recibir',
  correo_argentino: 'Correo Argentino',
  retiro_oficina: 'Retiro en oficina',
};

const CART_STEP_LABELS = {
  cart: 'Carrito',
  info: 'Datos personales',
  shipping: 'Envío',
  payment: 'Pago',
  checkout_form: 'Checkout',
  checkout_page: 'Checkout',
};

const moneyFmt = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

export function money(n) {
  const num = Number(n);
  if (Number.isNaN(num)) return '$0';
  return moneyFmt.format(num);
}

export function formatDate(d) {
  if (!d) return '—';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
}

/** Minutos desde `d` hasta `now`; null si la fecha no sirve o es futura. */
function minutesSince(d, now = Date.now()) {
  if (!d) return null;
  const mins = Math.round((now - new Date(d).getTime()) / 60000);
  return Number.isNaN(mins) || mins < 0 ? null : mins;
}

export function relativeTime(d, now = Date.now()) {
  const mins = minutesSince(d, now);
  if (mins === null) return '';
  if (mins < 60) return `hace ${mins}m`;
  if (mins < 1440) return `hace ${Math.round(mins / 60)}h`;
  return `hace ${Math.round(mins / 1440)}d`;
}

/** Un carrito es "hot" si se tocó hace menos de una hora: es cuando más conviene escribir. */
export function isHotCart(cart, now = Date.now()) {
  const mins = minutesSince(cart?.updatedAt || cart?.createdAt, now);
  return mins !== null && mins < 60;
}

export function cartStepLabel(step) {
  return CART_STEP_LABELS[step] || step || '—';
}

export function cartItemCount(cart) {
  if (cart?.totalItems) return cart.totalItems;
  return (cart?.items || []).reduce((a, it) => a + (Number(it.quantity) || 0), 0);
}

/**
 * Teléfono argentino → formato de wa.me (549 + área + número).
 * "+54 9 11 …" queda igual; "11 …" y "011 …" pasan a 54911… (el 0 de
 * larga distancia no va en el formato internacional). null si no hay dígitos.
 */
export function waPhone(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('54')) return digits;
  return '549' + digits.replace(/^0+/, '');
}

function waUrl(phone, msg) {
  const ph = waPhone(phone);
  return ph ? `https://wa.me/${ph}?text=${encodeURIComponent(msg)}` : null;
}

const itemsSummary = (items) => (items || []).map((it) => `${it.quantity}x ${it.name}`).join(', ');

export function orderWaLink(order, store = 'Amelor') {
  if (!order?.customerPhone) return null;
  const msg = `Hola ${order.customerName || ''}! Te escribo de ${store} sobre tu pedido del ${formatDate(order.createdAt)}. ${itemsSummary(order.items)}. Total: ${money(order.totalAmount)}`;
  return waUrl(order.customerPhone, msg);
}

export function cartWaLink(cart, store = 'Amelor') {
  if (!cart?.phone) return null;
  const firstName = (cart.name || '').trim().split(/\s+/)[0];
  const productList = itemsSummary(cart.items) || 'tu pedido';
  const total = cart.totalAmount ? ` por ${money(cart.totalAmount)}` : '';
  const msg =
    `Hola${firstName ? ' ' + firstName : ''}! 👋 Te escribo de ${store}.\n\n` +
    `Vi que estabas cerrando tu compra de ${productList}${total} y quedó pendiente. ` +
    `¿Tuviste algún inconveniente con el pago o el envío?\n\n` +
    `Si querés, te ayudo a finalizarlo por acá mismo. 🙌`;
  return waUrl(cart.phone, msg);
}

const lineTotal = (it) => money((Number(it.price) || 0) * (Number(it.quantity) || 0));

export function orderClipboardText(order) {
  return [
    `Pedido: ${order._id}`,
    `Cliente: ${order.customerName || '—'}`,
    order.customerPhone ? `Tel: ${order.customerPhone}` : '',
    order.customerEmail ? `Email: ${order.customerEmail}` : '',
    order.customerDni ? `DNI: ${order.customerDni}` : '',
    `Dirección: ${order.shippingAddress || '—'}`,
    `Envío: ${SHIP_METHOD_MAP[order.shippingMethod] || order.shippingMethod || '—'}`,
    `Método pago: ${METHOD_MAP[order.paymentMethod]?.label || order.paymentMethod || '—'}`,
    '',
    ...(order.items || []).map((it) => `  ${it.quantity}x ${it.name} — ${lineTotal(it)}`),
    '',
    `Total: ${money(order.totalAmount)}`,
    order.notes ? `Notas: ${order.notes}` : '',
  ].filter(Boolean).join('\n');
}

export function cartClipboardText(cart) {
  return [
    `— CARRITO ABANDONADO —`,
    `Cliente: ${cart.name || '—'}`,
    cart.phone ? `Tel: ${cart.phone}` : '',
    cart.email ? `Email: ${cart.email}` : '',
    cart.address ? `Dirección: ${cart.address}` : '',
    [cart.city, cart.province, cart.postalCode].filter(Boolean).join(', '),
    cart.step ? `Paso: ${cart.step}` : '',
    cart.paymentMethod ? `Método pago: ${cart.paymentMethod}` : '',
    cart.landingSource ? `Landing: ${cart.landingSource}` : '',
    '',
    ...(cart.items || []).map((it) => `  ${it.quantity}x ${it.name} — ${lineTotal(it)}`),
    '',
    `Total: ${money(cart.totalAmount)}`,
  ].filter(Boolean).join('\n');
}

/** Total de una línea de pedido: el precio del pack si lo hay; si no, precio × cantidad (mínimo 1). */
export function orderItemTotal(it) {
  return it?.bundleTotal ? Number(it.bundleTotal) : (Number(it?.price) || 0) * (Number(it?.quantity) || 1);
}

const matches = (fields, q) => fields.some((f) => String(f ?? '').toLowerCase().includes(q));

export function computeCartStats(carts, now = Date.now()) {
  const pending = carts.filter((c) => !c.recovered);
  return {
    pendingCount: pending.length,
    totalValue: pending.reduce((a, c) => a + (Number(c.totalAmount) || 0), 0),
    hot: pending.filter((c) => isHotCart(c, now)).length,
    withPhone: pending.filter((c) => !!c.phone).length,
    recovered: carts.length - pending.length,
  };
}

export function filterCarts(carts, query = '') {
  const q = query.trim().toLowerCase();
  if (!q) return carts;
  return carts.filter((c) => matches([
    c.name, c.phone, c.email, c.address, c.city, c.province,
    c.landingSource, c.step, c.paymentMethod,
    ...(c.items || []).map((i) => i.name),
  ], q));
}
