// backend/src/validation/orders.schemas.js
//
// Contrato de entrada de POST /api/orders — SOLO datos de contacto y envío.
//
// Alcance deliberado: ítems, precios, total, cupón y método de pago NO se
// validan acá. Pasan intactos (looseObject conserva las claves desconocidas)
// y los sigue resolviendo el controller, que es quien tiene la lógica de
// negocio y pagos. Este schema solo garantiza que los campos de texto lleguen
// como texto: un `{ "clientOrderId": { "$ne": null } }` antes llegaba directo
// a `Order.findOne` (idempotencia) y devolvía el pedido de otra persona.

const { z } = require('zod');

// Acepta string o número (DNI/teléfono a veces llegan numéricos) y
// devuelve string recortado. Objetos y arrays → 400.
const text = (requiredMsg, max, maxMsg) =>
  z
    .union([z.string(), z.number()], { error: requiredMsg })
    .transform((v) => String(v).trim())
    .pipe(z.string().min(1, requiredMsg).max(max, maxMsg));

// Opcional: null/undefined/'' → undefined; si viene, mismo tratamiento.
const optionalText = (max, maxMsg, typeMsg) =>
  z
    .union([z.string(), z.number()], { error: typeMsg })
    .nullish()
    .transform((v) => (v == null ? undefined : String(v).trim() || undefined))
    .pipe(z.string().max(max, maxMsg).optional());

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const createOrderBody = z.looseObject({
  // Clave de idempotencia generada por el front (randomUUID o `co_<ts>_<hex>`).
  clientOrderId: z
    .string({ error: 'clientOrderId inválido.' })
    .trim()
    .max(100, 'clientOrderId inválido.')
    .regex(/^[A-Za-z0-9_-]*$/, 'clientOrderId inválido.')
    .nullish()
    .transform((v) => v || undefined),

  customerName: text('Ingresá tu nombre.', 120, 'El nombre puede tener hasta 120 caracteres.'),

  // El email es opcional en el checkout, pero si viene tiene que ser válido.
  customerEmail: z
    .string({ error: 'Ingresá un email válido.' })
    .trim()
    .toLowerCase()
    .max(254, 'El email es demasiado largo.')
    .refine((v) => v === '' || EMAIL_RE.test(v), 'Ingresá un email válido.')
    .nullish()
    .transform((v) => v ?? ''),

  customerDni: text('Ingresá tu DNI.', 20, 'El DNI es demasiado largo.'),

  customerPhone: optionalText(40, 'El teléfono es demasiado largo.', 'Teléfono inválido.'),

  shippingAddress: text('Ingresá la dirección de envío.', 300, 'La dirección puede tener hasta 300 caracteres.'),

  shippingMethod: optionalText(60, 'Método de envío inválido.', 'Método de envío inválido.'),

  notes: optionalText(1000, 'Las notas pueden tener hasta 1000 caracteres.', 'Notas inválidas.'),
});

module.exports = { createOrderBody };
