// src/landings/parches-detox.js
// ─────────────────────────────────────────────────────────────
// Config de marketing para Parches Plantares Detox (Kinoki)
// URL: /lp/parches-detox
// Producto en admin -> slug: parches-detox
// Renderizado por: src/landings/ParchesDetox/ParchesDetox.jsx (componente dedicado)
// ─────────────────────────────────────────────────────────────

const parchesDetoxConfig = {
  productSlug: "parches-detox",

  pageTitle: "Parches Plantares Detox Kinoki | Ritual nocturno para despertar más liviano | Amelor",
  checkoutName: "Parches Plantares Detox Kinoki 2x1 + Ebook",

  heroSubtitle: "",

  trustBullets: [
    "😴 Descanso profundo y más energía",
    "🦶 Adiós piernas pesadas",
    "🌿 Desintoxicación visible y sin esfuerzo",
  ],

  ctaLine1: "QUIERO PROBAR ESTA NOCHE",
  ctaLine2: "EMPEZAR ESTA NOCHE 🌙",
  stockAlertText: "⚠️ Últimas unidades al precio actual",
  stickyBtnText: "QUIERO PROBAR ESTA NOCHE 🌙",
  stickyGuaranteeShort: "🔒 Garantía 7 días",

  miniDescription:
    "Parches adhesivos herbales de origen oriental. Se colocan en la planta del pie antes de dormir y actúan durante la noche como un ritual de bienestar. Al despertar, el parche oscuro es la señal visible de que algo pasó mientras dormías.",

  // Sección antes/después (para referencia — el componente lo renderiza con diseño propio)
  beforeAfterTitle: "La prueba que tenés en la mano al despertar",
  beforeAfterSubtitle: "Entra blanco. Amanece negro. Eso no es casualidad — es lo que salió de tu cuerpo mientras dormías.",
  beforeLabel: "Antes de dormir",
  afterLabel: "Al despertar",

  // Stats de social proof
  soldCount: 847,
  reviewCount: 124,
  reviewScore: 4.8,

  stockAlert: { show: true, remaining: 12 },

  // Garantía
  guarantee: {
    title: "CERO RIESGO. CERO EXCUSAS.",
    sub: "Si mañana a la mañana el parche no amanece oscuro, te devolvemos todo el dinero. Sin preguntas, sin trámites, sin vuelta.",
    cta: "EMPEZAR ESTA NOCHE →",
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
      q: "¿Cómo sé que funcionó?",
      a: "El parche oscuro que tenés en la mano al despertar es la señal. Entra completamente blanco y amanece negro y húmedo. Sin haber hecho nada más que dormir. Aparte de eso, la mayoría de los clientes notan más energía y piernas más livianas desde la primera semana de uso continuo."
    },
    {
      q: "¿Cuántas noches necesito para ver resultados?",
      a: "El cambio de color en el parche se ve desde la primera noche. Para notar diferencia real en cómo te sentís — más descansado/a, piernas más livianas, más energía — lo ideal es una semana seguida. Muchos lo incorporan como ritual nocturno permanente."
    },
    {
      q: "¿Para quién es ideal?",
      a: "Para cualquier persona que se levante cansada, con piernas pesadas o sueño poco reparador. No requiere dieta, ni ejercicio, ni cambio de hábitos. Solo lo pegás en la planta del pie y dormís. Si tenés alguna condición médica o estás embarazada, consultá antes con tu médico."
    },
    {
      q: "¿Tengo que cambiar algo en mi rutina?",
      a: "No. Cero fricción. Lo único que hacés es pegarlo en la planta del pie limpia antes de acostarte. Sin pastillas, sin dietas, sin ejercicios. Funciona mientras dormís — eso es todo."
    },
    {
      q: "¿Cuándo llega y cómo puedo pagar?",
      a: "Envío gratis a todo el país. CABA y GBA: 24 a 72hs hábiles con opción de pago al recibirlo. Interior del país: 3 a 7 días hábiles por Correo Argentino, abonando con MercadoPago al comprar."
    },
  ],

  about: {
    title: "QUIÉNES SOMOS",
    img: "https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=1200",
    text: "En Amelor buscamos productos que realmente hagan una diferencia en el día a día, con envío rápido, atención humana y una experiencia de compra simple. Nuestro objetivo es que comprés con confianza y recibas exactamente lo que ves.",
    bullets: [
      "✅ Atención por WhatsApp",
      "📦 Envíos a todo el país",
      "🔒 Pagos seguros",
      "⭐ Enfoque en calidad y experiencia",
    ],
  },

  // ── Imágenes de la landing ─────────────────────────────────
  // Editables desde el admin → Productos → Parches Detox → Imágenes (una URL por línea).
  // El admin sobreescribe estos fallbacks en el mismo orden:
  //  [0-3]   Galería del hero (imagen principal + 3 miniaturas)
  //  [4]     Sección "¿Te sentís así?" — persona cansada
  //  [5]     Slider Antes/Después — imagen ANTES (parche blanco)
  //  [6]     Slider Antes/Después — imagen DESPUÉS (parche oscuro)
  //  [7-10]  Pasos "Cómo usarlo" (4 pasos en orden)
  //  [11]    Transformación nocturna (ancho completo)
  //  [12-14] Vstrip "Clientes Satisfechos" (3 fotos verticales)
  //  [15-18] Reseñas carousel (4 fotos, mismo orden que el carousel)
  images: [
    "https://nesimu.com/cdn/shop/files/imgi_43_D_NQ_NP_2X_676642-MLA97579090775_112025-F.jpg?v=1770705063&width=1420",
    "https://pbs.twimg.com/media/HHsZMmkXQAw-prn?format=jpg&name=small",
    "https://pbs.twimg.com/media/HHsZpv3WwAgO1ri?format=jpg&name=small",
    "https://nesimu.com/cdn/shop/files/imgi_51_D_NQ_NP_2X_903416-MLA92304661828_092025-F.jpg?v=1770705073&width=1420",
    "https://pbs.twimg.com/media/HHsW_2lWwAMRUNJ?format=jpg&name=small",
    "https://pbs.twimg.com/media/HHsZMmkXQAw-prn?format=jpg&name=small",
    "https://pbs.twimg.com/media/HHsZpv3WwAgO1ri?format=jpg&name=small",
    "https://pbs.twimg.com/media/HHsa-ZWWQAIV_ZY?format=jpg&name=large",
    "https://pbs.twimg.com/media/HHsbKf7WkAY87Hn?format=jpg&name=large",
    "https://pbs.twimg.com/media/HHsbWDzWEAUUoXf?format=jpg&name=large",
    "https://pbs.twimg.com/media/HHsbi1qWkAI7U6E?format=jpg&name=large",
    "https://nesimu.com/cdn/shop/files/imgi_253_Transformacion_Visible_Nocturna_-_Ad_1_1.webp?v=1770704798&width=1500",
    "https://pbs.twimg.com/media/HHsZ6enWYAg4BH5?format=jpg&name=large",
    "https://pbs.twimg.com/media/HHsaa7EXwAQUreX?format=jpg&name=large",
    "https://pbs.twimg.com/media/HHsan3XXoAIhfR9?format=jpg&name=large",
    "https://nesimu.com/cdn/shop/files/imgi_43_D_NQ_NP_2X_676642-MLA97579090775_112025-F.jpg?v=1770705063&width=1420",
    "https://nesimu.com/cdn/shop/files/imgi_33_713PY4u2yeL.jpg?v=1770705048&width=1420",
    "https://nesimu.com/cdn/shop/files/imgi_36_71_StcLeTHL.jpg?v=1770705063&width=1420",
    "https://nesimu.com/cdn/shop/files/imgi_51_D_NQ_NP_2X_903416-MLA92304661828_092025-F.jpg?v=1770705073&width=1420",
  ],

  // ── Bundles / Paquetes ───────────────────────────────────────
  // Formato "X + X de REGALO" simétrico: pagás la cantidad qty, recibís el doble.
  // Editá precio y tachado desde el panel admin → Productos → Parches Detox → Paquetes.
  // Estos valores son el FALLBACK si el admin no tiene el producto cargado.
  // qty: cantidad pagada (el regalo se muestra como bonus visual, no se cobra).
  bundles: [
    {
      label:     "Kit Inicio · 3 + 3 cajas de REGALO",
      qty:       3,
      price:     48900,
      compareAt: 86000,
      badge:     "OFERTA ESPECIAL",
      popular:   false,
      benefit:   "🌿 30 parches en total · Envío gratis a todo el país",
    },
    {
      label:     "Kit Familiar · 6 + 6 cajas de REGALO",
      qty:       6,
      price:     58000,
      compareAt: 119200,
      badge:     "MÁS ELEGIDO",
      popular:   true,
      benefit:   "📦 60 parches en total · Envío gratis · Ideal para compartir",
    },
    {
      label:     "Kit Premium · 10 + 10 cajas de REGALO",
      qty:       10,
      price:     78800,
      compareAt: 194900,
      badge:     "MEJOR VALOR",
      popular:   false,
      benefit:   "💎 100 parches en total · El mejor valor · Envío gratis",
    },
  ],
};

export default parchesDetoxConfig;
