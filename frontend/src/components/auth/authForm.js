// Lógica pura compartida por login y registro (sin React, testeable).
import { normalizeAuthResponse } from "../../utils/auth";

export const MIN_PASSWORD = 6;
export const DEFAULT_REDIRECT = "/my-orders";

/**
 * El backend responde {token,user} plano o envuelto en {data}/{payload}:
 * `normalizeAuthResponse` ya recorre esos niveles y siempre devuelve objeto
 * (el `|| normalizeAuthResponse(res.data?.data)` de antes era inalcanzable).
 */
export function authFromResponse(body) {
  return normalizeAuthResponse(body);
}

/** A dónde volver después de entrar: la ruta protegida que mandó al login. */
export function redirectTarget(locationState) {
  return locationState?.from?.pathname || DEFAULT_REDIRECT;
}

/**
 * Mensaje legible para un error de axios.
 * `byStatus` pisa al mensaje del servidor (p. ej. 409 en registro);
 * `fallbackByStatus` solo se usa si el servidor no mandó mensaje (401 en login).
 */
export function authErrorMessage(err, fallback, { byStatus = {}, fallbackByStatus = {} } = {}) {
  const status = err?.response?.status;
  if (status && byStatus[status]) return byStatus[status];
  const data = err?.response?.data;
  const server =
    (typeof data?.message === "string" && data.message) ||
    (typeof data?.error === "string" && data.error) ||
    "";
  return server || (status && fallbackByStatus[status]) || fallback;
}

/** Validación del registro antes de pegarle al backend. "" = válido. */
export function registerError({ password, confirm }) {
  if (String(password || "").length < MIN_PASSWORD) {
    return `La contraseña debe tener al menos ${MIN_PASSWORD} caracteres.`;
  }
  if (password !== confirm) return "Las contraseñas no coinciden.";
  return "";
}
