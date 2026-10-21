// src/landings/generic.js
// ─────────────────────────────────────────────────────────────
// Config de la ficha genérica: la usa /products/:id para cualquier producto
// que no tenga una landing propia en `src/landings/index.js`.
//
// Solo lleva contenido válido para TODA la tienda (envío, pago, garantía,
// quiénes somos). Nada específico de un producto ni prueba social inventada:
// el subtítulo y los bullets salen del producto (`subtitle` / `highlights`,
// editables desde el admin) y la descripción de `description`.
// ─────────────────────────────────────────────────────────────

/** Bullets neutros si el producto no tiene `highlights` cargados. */
export const GENERIC_TRUST_BULLETS = [
  "🚚 Envíos a todo el país",
  "🔒 Pago seguro con Mercado Pago",
  "🛡️ Garantía de 30 días",
  "💬 Atención por WhatsApp",
];

const genericProductConfig = {
  trustBullets: GENERIC_TRUST_BULLETS,

  about: {
    title: "QUIÉNES SOMOS",
    img: "https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=1200",
    text: "En Amelor nos enfocamos en traer productos que realmente solucionen problemas del día a día, con envío rápido, atención humana y una experiencia de compra simple.",
    bullets: [
      "✅ Atención por WhatsApp",
      "📦 Envíos a todo el país",
      "🔒 Pagos seguros",
    ],
  },
};

export default genericProductConfig;
