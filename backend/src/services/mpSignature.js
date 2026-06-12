// backend/src/services/mpSignature.js
//
// Verificación HMAC SHA256 de webhooks de Mercado Pago.
//
// Esquema oficial (https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks):
//   - Headers que manda MP:
//       x-signature:  "ts=<unix_ts>,v1=<hmac_sha256_hex>"
//       x-request-id: "<uuid>"
//   - El manifest a firmar tiene la forma EXACTA (incluyendo ; final):
//       id:<data.id>;request-id:<x-request-id>;ts:<ts>;
//     donde <data.id> sale del query param ?data.id=... (o del body)
//     y se normaliza a lowercase si es alfanumérico.
//   - v1 = HMAC_SHA256(secret = MP_WEBHOOK_SECRET, manifest).hex()
//
// MP_WEBHOOK_SECRET se obtiene en el panel de Mercado Pago:
//   Tus integraciones → tu integración → Webhooks → "Clave secreta"
// y se carga como env var del backend (NO commitear).

const crypto = require('crypto');

/**
 * Parsea el header x-signature ("ts=123,v1=abc...") a { ts, v1 }.
 */
function parseSignatureHeader(header) {
  if (!header || typeof header !== 'string') return null;
  const parts = header.split(',');
  const out = {};
  for (const part of parts) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key && val) out[key] = val;
  }
  if (!out.ts || !out.v1) return null;
  return out;
}

/**
 * Verifica la firma del webhook MP.
 *
 * @param {object} opts
 * @param {string} opts.xSignature  - header "x-signature"
 * @param {string} opts.xRequestId  - header "x-request-id"
 * @param {string|number} opts.dataId - id del recurso (query param data.id o body.data.id)
 * @param {string} opts.secret      - process.env.MP_WEBHOOK_SECRET
 * @returns {{ ok: boolean, reason?: string }}
 */
function verifyMpWebhookSignature({ xSignature, xRequestId, dataId, secret }) {
  if (!secret) {
    return { ok: false, reason: 'MP_WEBHOOK_SECRET no configurada' };
  }
  if (!xSignature || !xRequestId) {
    return { ok: false, reason: 'headers x-signature o x-request-id ausentes' };
  }
  if (dataId == null || dataId === '') {
    return { ok: false, reason: 'data.id ausente' };
  }

  const parsed = parseSignatureHeader(xSignature);
  if (!parsed) {
    return { ok: false, reason: 'x-signature mal formado' };
  }

  // MP indica normalizar a lowercase si es alfanumérico (los IDs numéricos
  // no cambian; los IDs string sí). String(...).toLowerCase() es seguro.
  const normalizedDataId = String(dataId).toLowerCase();
  const manifest = `id:${normalizedDataId};request-id:${xRequestId};ts:${parsed.ts};`;

  const expected = crypto
    .createHmac('sha256', secret)
    .update(manifest)
    .digest('hex');

  let match = false;
  try {
    const a = Buffer.from(expected, 'hex');
    const b = Buffer.from(parsed.v1, 'hex');
    if (a.length !== b.length) return { ok: false, reason: 'firma inválida (longitud)' };
    match = crypto.timingSafeEqual(a, b);
  } catch (e) {
    return { ok: false, reason: 'firma inválida (formato hex)' };
  }

  if (!match) return { ok: false, reason: 'firma inválida' };
  return { ok: true };
}

module.exports = {
  verifyMpWebhookSignature,
  parseSignatureHeader,
};
