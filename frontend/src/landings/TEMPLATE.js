// src/landings/TEMPLATE.js
// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE PARA NUEVA LANDING PAGE
//
// Pasos:
//   1. Copiá este archivo → src/landings/mi-producto.js
//   2. Reemplazá todos los valores con los de tu producto
//   3. Registralo en src/landings/index.js:
//         import miProducto from './mi-producto';
//         export const LANDING_CONFIGS = { ..., 'mi-producto': miProducto };
//   4. Agregar entrada en LANDING_META (mismo archivo index.js)
//   5. Crear el producto en el admin con el mismo slug
//
// URL resultante: https://tudominio.com/lp/mi-producto
// ─────────────────────────────────────────────────────────────────────────────

const miProductoConfig = {
  pageTitle: "Nombre del Producto | BoomHausS",

  heroSubtitle: "El subtítulo que aparece debajo del título del producto",

  trustBullets: [
    "✅ Beneficio clave 1",
    "⚡ Beneficio clave 2",
    "🔋 Beneficio clave 3",
    "🚚 Envío gratis a todo el país",
  ],

  miniDescription:
    "Descripción corta del producto que aparece en el accordion de ficha técnica.",

  storyBlocks: [
    {
      title: "TÍTULO DEL BLOQUE 1",
      text: "Texto del bloque 1. Contá la historia del problema que resuelve el producto.",
      img: "URL_DE_IMAGEN_1",
      badge: "Opcional: texto del badge",
    },
    {
      title: "TÍTULO DEL BLOQUE 2",
      text: "Texto del bloque 2. Mostrá el producto en uso real.",
      img: "URL_DE_IMAGEN_2",
      badge: "",
    },
  ],

  certificate: {
    title: "COMPRA CON CONFIANZA",
    logoUrl: "URL_DEL_LOGO_DE_CERTIFICACIÓN",  // o null para ocultarlo
    items: [
      { icon: "🔒", text: "Pago seguro (Mercado Pago)" },
      { icon: "✅", text: "Compra protegida" },
      { icon: "📦", text: "Seguimiento de envío" },
      { icon: "🤝", text: "Soporte por WhatsApp" },
    ],
  },

  comparison: {
    title: "ANTES VS DESPUÉS",
    cols: ["SIN EL PRODUCTO", "CON EL PRODUCTO"],
    rows: [
      { k: "Aspecto 1", a: "Situación antes", b: "Situación después" },
      { k: "Aspecto 2", a: "Problema antes", b: "Solución después" },
    ],
  },

  howTo: {
    title: "CÓMO SE USA",
    image: {
      url: "URL_IMAGEN_INSTRUCTIVO",
      alt: "Cómo se usa el producto",
    },
  },

  // ⚠️ Si no querés tarjeta de autoridad, ponés show: false
  authority: {
    show: false,  // ← cambiar a true y completar datos si querés mostrarlo
    photo: "URL_FOTO_PROFESIONAL",
    name: "Nombre del Profesional",
    role: "Cargo / Especialidad",
    quote: "La recomendación o frase del profesional.",
    disclaimer: "Aclaración / disclaimer opcional.",
  },

  faqTitle: "PREGUNTAS FRECUENTES",
  faq: [
    { q: "¿Pregunta 1?", a: "Respuesta 1." },
    { q: "¿Pregunta 2?", a: "Respuesta 2." },
    { q: "¿Pregunta 3?", a: "Respuesta 3." },
  ],

  reviewsTitle: "TESTIMONIOS",
  reviewsSubtitle: "Esto dicen nuestros clientes",
  reviewsCarousel: [
    {
      title: "TÍTULO DEL REVIEW",
      rating: 5,         // 1 a 5
      text: "Texto del testimonio.",
      name: "Nombre Cliente",
      img: "URL_IMAGEN_PRODUCTO_O_AVATAR",
    },
    // ... más reviews
  ],

  about: {
    title: "QUIÉNES SOMOS",
    img: "https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=1200",
    text: "En BoomHausS nos enfocamos en traer productos que realmente solucionen problemas del día a día, con envío rápido, atención humana y una experiencia de compra simple.",
    bullets: [
      "✅ Atención por WhatsApp",
      "📦 Envíos a todo el país",
      "🔒 Pagos seguros",
      "⭐ Enfoque en calidad y experiencia",
    ],
  },

  // Números de social proof
  soldCount: 0,           // cuántos vendidos a mostrar
  reviewCount: 0,         // cantidad de reseñas
  reviewScore: 4.8,       // score (ej: 4.8)
  stockAlert: { show: true, remaining: 10 },  // alerta de stock limitado

  // Precio tachado fallback (si el producto no tiene compareAtPrice en el API)
  compareAtPriceFallback: 0,
};

export default miProductoConfig;