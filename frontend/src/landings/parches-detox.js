// src/landings/parches-detox.js
// ─────────────────────────────────────────────────────────────
// Config de marketing para Parches Plantares Detox (Kinoki)
// URL: /lp/parches-detox
// Producto en admin -> slug: parches-detox
// Renderizado por: src/pages/ParchesDetoxLanding.jsx (componente dedicado)
// ─────────────────────────────────────────────────────────────

const parchesDetoxConfig = {
  productSlug: "parches-detox",

  pageTitle: "Parches Plantares Detox Kinoki | Ritual nocturno para despertar más liviano | BoomHausS",
  checkoutName: "Parches Plantares Detox Kinoki 2x1 + Ebook",

  heroSubtitle: "",

  trustBullets: [
    "🌿 2x1 — llevás 2 unidades al precio de 1",
    "📖 Ebook de bienestar incluido gratis",
    "🚚 Envío gratis a todo el país",
    "💵 CABA: pagás al recibirlo",
  ],

  ctaLine1: "QUIERO MI KIT 2x1",
  ctaLine2: "LO QUIERO 🌿",
  stockAlertText: "⚠️ Stock limitado al precio actual",
  stickyBtnText: "QUIERO MI KIT DETOX 🚚",

  miniDescription:
    "Parches adhesivos herbales de origen oriental. Se colocan en la planta del pie antes de dormir y actúan durante la noche como un ritual de bienestar. Al despertar, el parche oscuro es la señal visible de que algo pasó mientras dormías.",

  // Sección antes/después (para referencia — el componente lo renderiza con diseño propio)
  beforeAfterTitle: "La prueba está en el parche",
  beforeAfterSubtitle: "El parche entra blanco. Al despertar, amanece oscuro. Algo claramente está pasando mientras dormís.",
  beforeLabel: "Antes de dormir",
  afterLabel: "Al despertar",

  // Stats de social proof
  soldCount: 847,
  reviewCount: 124,
  reviewScore: 4.8,

  stockAlert: { show: true, remaining: 12 },

  // Garantía
  guarantee: {
    title: "PROBALO SIN RIESGO",
    sub: "Si no notás ninguna diferencia en cómo te despertás durante los primeros 7 días, te devolvemos el dinero. Sin preguntas, sin trámites.",
    cta: "QUIERO MI KIT DETOX →",
  },

  // WhatsApp
  whatsapp: {
    show: true,
    number: "5491112345678", // TODO: reemplazar con número real
    message: "Hola! Tengo una consulta sobre los Parches Plantares Detox Kinoki",
  },

  // FAQ (compartido con el componente)
  faq: [
    {
      q: "¿Cómo sé que está funcionando?",
      a: "El indicador más visible es el cambio de color: el parche entra blanco y amanece oscuro/manchado. Muchos usuarios también reportan sentirse más descansados y livianos con el uso regular."
    },
    {
      q: "¿Cuántas noches debo usarlo?",
      a: "Recomendamos al menos una semana de uso continuo para notar resultados sostenidos. Muchos lo incorporan como ritual permanente: lo ponen antes de acostarse y listo."
    },
    {
      q: "¿Para quién está recomendado?",
      a: "Para adultos que se sienten cansados, pesados, o con sueño poco reparador. Si tenés alguna condición médica específica, embarazo u otra situación de salud, consultá con tu médico antes."
    },
    {
      q: "¿Tiene algún efecto secundario?",
      a: "Los parches usan ingredientes naturales y generalmente son bien tolerados. Algunas personas con piel muy sensible pueden notar leve enrojecimiento en la planta del pie. En ese caso, suspendé el uso. No recomendados para menores de 12 años."
    },
    {
      q: "¿Cómo llega y cuánto tarda el envío?",
      a: "El envío es gratis a todo el país. CABA y GBA: 24 a 72hs hábiles con opción de pago contra entrega. Interior del país: 3 a 7 días hábiles con Correo Argentino, abonando con MercadoPago al comprar."
    },
  ],

  about: {
    title: "QUIÉNES SOMOS",
    img: "https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=1200",
    text: "En BoomHausS buscamos productos que realmente hagan una diferencia en el día a día, con envío rápido, atención humana y una experiencia de compra simple. Nuestro objetivo es que comprés con confianza y recibas exactamente lo que ves.",
    bullets: [
      "✅ Atención por WhatsApp",
      "📦 Envíos a todo el país",
      "🔒 Pagos seguros",
      "⭐ Enfoque en calidad y experiencia",
    ],
  },

  // ── Bundles / Paquetes ───────────────────────────────────────
  // Editá precio y tachado desde el panel admin → Productos → Parches Detox → Paquetes.
  // Estos valores son el FALLBACK si el admin no tiene el producto cargado.
  bundles: [
    {
      label:     "6 Parches + 4 de Regalo · Edición Básica",
      qty:       2,
      price:     48900,
      compareAt: 86000,
      badge:     "OFERTA ESPECIAL",
      popular:   false,
      benefit:   "🌿 10 parches + Ebook · Envío gratis a todo el país",
    },
    {
      label:     "12 Parches + 8 de Regalo · Kit Familiar",
      qty:       3,
      price:     58000,
      compareAt: 119200,
      badge:     "MÁS ELEGIDO",
      popular:   true,
      benefit:   "📦 20 parches + Ebook · Envío gratis · Ideal para compartir",
    },
    {
      label:     "30 Parches + 10 de Regalo · Kit Premium",
      qty:       5,
      price:     98800,
      compareAt: 194900,
      badge:     "MEJOR VALOR",
      popular:   false,
      benefit:   "💎 40 parches + Ebook + Pack sorpresa · Envío gratis",
    },
  ],
};

export default parchesDetoxConfig;
