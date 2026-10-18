/* Lectura de estados de un pedido para la vista del cliente.
   Funciones puras: la página y la tarjeta comparten la misma verdad y se
   pueden testear sin montar nada. */

import { formatARS } from "../product/format.js";

export const money = (n) => formatARS(Number(n) || 0);

const DATE_FMT = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", year: "numeric" });
const TIME_FMT = new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit" });

export function formatOrderDate(d) {
  const date = d ? new Date(d) : null;
  if (!date || Number.isNaN(date.getTime())) return { date: "—", time: "" };
  return { date: DATE_FMT.format(date), time: TIME_FMT.format(date) };
}

/** Referencia corta y legible para hablar con soporte (#3F9A21C0). */
export const shortRef = (id = "") => `#${String(id).slice(-8).toUpperCase()}`;

/** Misma regla que bloquea la subida de comprobante (no cambiar sin el backend). */
export const isProofVerified = (o) =>
  Boolean(o?.paymentProofVerified) || String(o?.paymentStatus || "").toLowerCase() === "confirmed";

const SHIPPING_METHODS = {
  sucursal: "Envío a sucursal",
  domicilio: "Envío a domicilio",
  prioritario: "Domicilio prioritario",
  correo_argentino: "Correo Argentino",
};
export const shippingMethodLabel = (m) =>
  SHIPPING_METHODS[m] || (m ? String(m).replace(/_/g, " ") : "A coordinar");

/**
 * Tres hitos: pedido → pago → envío. Cada uno "done", "current", "waiting"
 * o "stopped" (cancelado/rechazado), con un texto corto para el cliente.
 */
export function orderSteps(o) {
  const pay = String(o?.paymentStatus || "pending").toLowerCase();
  const ship = String(o?.shippingStatus || "pending").toLowerCase();
  const paid = isProofVerified(o) || pay === "approved";

  let payment;
  if (paid) payment = { state: "done", hint: "Pago confirmado" };
  else if (pay === "rejected") payment = { state: "stopped", hint: "Pago rechazado" };
  else if (pay === "cancelled") payment = { state: "stopped", hint: "Pago cancelado" };
  else if (pay === "proof_uploaded" || o?.paymentProofUrl) payment = { state: "current", hint: "Revisando comprobante" };
  else payment = { state: "current", hint: "Esperando pago" };

  let shipping;
  if (ship === "cancelled") shipping = { state: "stopped", hint: "Envío cancelado" };
  else if (ship === "delivered") shipping = { state: "done", hint: "Entregado" };
  else if (ship === "shipped") shipping = { state: "current", hint: "En camino" };
  else shipping = { state: paid ? "current" : "waiting", hint: paid ? "Preparando tu pedido" : "Después del pago" };

  return [
    { key: "order", label: "Pedido", state: "done", hint: "Recibido" },
    { key: "payment", label: "Pago", ...payment },
    { key: "shipping", label: "Envío", ...shipping },
  ];
}

/** El hito que resume el pedido en una línea (el primero que no está hecho). */
export function headlineStep(steps) {
  return steps.find((s) => s.state === "stopped") || steps.find((s) => s.state !== "done") || steps[steps.length - 1];
}

export function itemTotal(it) {
  return it.bundleTotal ? Number(it.bundleTotal) : (Number(it.price) || 0) * (Number(it.quantity) || 1);
}
