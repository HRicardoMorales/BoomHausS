// src/landings/nebulizador-mesh.js
// ─────────────────────────────────────────────────────────────
// Config de marketing para el Nebulizador Recargable Portatil Mesh
// URL: /lp/nebulizador-mesh
// Producto en admin -> slug: nebulizador-mesh
// ─────────────────────────────────────────────────────────────

const nebulizadorMeshConfig = {
  // ── Slug real del producto en el admin ───────────────────
  productSlug: "nebulizador-mesh",

  // ── SEO ───────────────────────────────────────────────────
  pageTitle: "Nebulizador Recargable Mesh | BoomHausS",
  checkoutName: "Nebulizador Recargable Portatil Mesh",

  // ── Hero ─────────────────────────────────────────────────
  heroSubtitle: "",
  trustBullets: [
    "🤫 Ultra silencioso",
    "⚡ Recargable USB-C",
    "💪 Mejor respiración, mejor sueño",
  ],

  // ── Textos personalizados del CTA / sticky ──────────────
  ctaLine1: "QUIERO VIVIR MEJOR",
  ctaLine2: "LO QUIERO 🚚",
  stockAlertText: "⚠️ Quedan pocas unidades al precio actual",
  stickyBtnText: "QUIERO VIVIR MEJOR 🚚",

  // ── Líneas de confianza debajo del CTA ──────────────────

  // ── Descripcion corta ────────────────────────────────────
  miniDescription:
    "Nebulizador portátil con tecnología Mesh de última generación. Genera partículas ultrafinas (menos de 5 micrones) que penetran profundamente en las vías respiratorias. Silencioso, recargable por USB-C, liviano (solo 120g) y se puede usar en cualquier posición. Ideal para adultos, chicos y bebés.",

  // ── Story blocks ─────────────────────────────────────────
  storyBlocks: [
    {
      title: "El cansancio no avisa — vos sí podés estar listo",
      text: "120 gramos que cambian tu día.\nEn la cartera, en el trabajo, de viaje.\nPecho cargado a la mañana →\nalivio antes de que arranque el día.\nSin enchufes. Sin excusas.",
      img: "https://pbs.twimg.com/media/HC_GBrGWgAAr3EW?format=jpg&name=360x360",
    },
    {
      title: "Que no te despierte el remedio que te ayuda a descansar",
      text: "Silencio absoluto mientras actúa.\nPartículas ultrafinas directo a pulmones.\nTu cuerpo descansa. Tu respiración mejora.\nTe levantás con otra energía.",
      img: "https://pbs.twimg.com/media/HC_HYuSWYAEt3ra?format=jpg&name=medium",
    },
    {
      title: "Cargalo de noche. Respirá mejor mañana.",
      text: "Enchufalo con el celular antes de dormir.\n2 horas = 3 a 4 sesiones listas.\nSin pilas. Sin cables. Sin perder tiempo\ncuando ya estás agotado.",
      img: "https://pbs.twimg.com/media/HC_IgU9XwAA5LcE?format=jpg&name=medium",
    },
  ],

  // ── Compra con confianza ──────────────────────────────────
  certificate: {
    title: "COMPRA CON CONFIANZA",
    logoUrl:
      "https://static.vecteezy.com/system/resources/thumbnails/024/097/948/small/certification-of-authenticity-badge-100-percentoriginal-product-stamp-logo-sticker-patch-round-emblem-retro-vintage-hipster-illustration-vector.jpg",
    items: [
      { icon: "🔒", text: "Pago seguro (Mercado Pago)" },
      { icon: "✅", text: "Compra protegida" },
      { icon: "📦", text: "Seguimiento de envío en tiempo real" },
      { icon: "🤝", text: "Soporte por WhatsApp" },
    ],
  },

  // ── Tabla comparativa ─────────────────────────────────────
  comparison: {
    title: "NEBULIZADOR MESH VS NEBULIZADOR DE PISTÓN",
    cols: ["PISTÓN TRADICIONAL", "NEBULIZADOR MESH"],
    rows: [
      { k: "Ruido",           a: "Ruidoso — asusta a bebés y chicos",          b: "Prácticamente silencioso (< 30 dB)"         },
      { k: "Tamaño",          a: "Grande, ocupa lugar y necesita enchufe",     b: "Cabe en la mano — 120g, portátil"           },
      { k: "Partículas",      a: "Gruesas (> 10 micrones) — menos efectivas",  b: "Ultrafinas (< 5 micrones) — mejor absorción"},
      { k: "Velocidad",       a: "Sesiones de 15-20 minutos",                  b: "Sesiones de 5-10 minutos"                   },
      { k: "Energía",         a: "Cable + enchufe permanente",                 b: "Batería recargable USB-C"                   },
      { k: "Posición de uso", a: "Solo vertical — el líquido se cae",         b: "Funciona en cualquier ángulo"               },
    ],
  },

  // ── Cómo se usa ──────────────────────────────────────────
  howTo: {
    title: "CÓMO SE USA",
    image: {
      url: "https://pbs.twimg.com/media/HC_K60AXkAASNnq?format=jpg&name=medium",
      alt: "Cómo usar el nebulizador mesh portátil",
    },
  },

  // ── Tarjeta de autoridad ──────────────────────────────────
  authority: {
    show: true,
    photo: "https://pbs.twimg.com/media/HDAf8mAXAAAcVzl?format=jpg&name=small",
    name: "Dra. Sofia Sosa",
    role: "Neumonóloga — M.N. 142.387",
    quote: "La tecnología Mesh genera partículas menores a 5 micrones que llegan directo a las vías respiratorias. Sesiones más cortas, mayor absorción y al ser silencioso, ideal para chicos.",
    disclaimer: "Opinión profesional con fines informativos. Consultá siempre a tu médico antes de iniciar cualquier tratamiento.",
  },

  // ── FAQ ──────────────────────────────────────────────────
  faqTitle: "PREGUNTAS FRECUENTES",
  faq: [
    { q: "¿Es apto para bebés y chicos?",               a: "Sí, es seguro para todas las edades. Al ser silencioso, es especialmente útil para nebulizar bebés y chicos sin que se asusten. Las partículas ultrafinas son más suaves para las vías respiratorias." },
    { q: "¿Qué medicamentos se pueden usar?",           a: "Es compatible con solución fisiológica, salbutamol, budesonida, ipratropio y la mayoría de medicamentos para nebulización. No usar medicamentos oleosos ni suspensiones muy espesas. Siempre consultá con tu médico." },
    { q: "¿Cuánto dura la batería?",                    a: "Una carga completa rinde entre 3 y 4 sesiones de nebulización (dependiendo del volumen de líquido). Se carga completamente en menos de 2 horas por USB-C." },
    { q: "¿Es realmente silencioso?",                   a: "Sí, opera a menos de 30 dB — más silencioso que un susurro. Es ideal para usarlo de noche sin despertar a nadie o para nebulizar chicos que le tienen miedo al ruido del pistón." },
    { q: "¿Cómo se limpia?",                            a: "El vaso de medicación y la tapa se separan y se lavan con agua tibia después de cada uso. La malla se puede limpiar suavemente con un cepillo fino (incluido). No sumergir el cuerpo del equipo." },
    { q: "¿Se puede usar acostado?",                    a: "Sí, la tecnología Mesh permite usarlo en cualquier posición: sentado, acostado, inclinado. Esto es una ventaja enorme para nebulizar bebés dormidos o personas con movilidad reducida." },
    { q: "¿Cuánto líquido entra en el depósito?",       a: "El depósito tiene capacidad de 8 ml, suficiente para la mayoría de tratamientos estándar. Se puede recargar y hacer varias sesiones seguidas si fuera necesario." },
    { q: "¿Qué incluye la caja?",                       a: "1 nebulizador Mesh portátil, 1 cable USB-C de carga, 1 máscara para adultos, 1 máscara para niños, 1 boquilla, 1 cepillo de limpieza y manual de instrucciones." },
  ],

  // ── Mini reseñas (carrusel compacto) ─────────────────────
  miniReviews: [
    { rating: 5, short: "Llevaba semanas sin dormir bien por la congestión. Desde que uso el nebulizador antes de acostarme duermo de un tirón y me levanto con otra energía.", name: "Carolina M." },
    { rating: 5, short: "No lo compré para dormir mejor... pero ese fue el mayor cambio. La nariz libre cambia todo el día.", name: "Rodrigo T." },
    { rating: 5, short: "Mi hijo dejó de despertarse de noche. Nosotros también. Dormimos todos mejor y el día rinde el doble.", name: "Valentina R." },
    { rating: 5, short: "Soy asmático. Tener un nebulizador que entra en la mochila y no depende de enchufe es un cambio de vida.", name: "Fernando L." },
    { rating: 5, short: "Lo uso con solución fisiológica para la congestión. En 5 minutos ya se destapó la nariz.", name: "Mariana G." },
    { rating: 4, short: "Muy buena calidad por el precio. Viene con las dos máscaras y el cable. Nada que envidiarle a uno de farmacia.", name: "Sebastián T." },
  ],

  // ── Testimonios ──────────────────────────────────────────
  reviewsTitle: "TESTIMONIOS",
  reviewsSubtitle: "Lo que dicen quienes ya lo usan",
  reviewsCarousel: [
    { title: "DORMÍ TODA LA NOCHE POR PRIMERA VEZ",  rating: 5, text: "Llevaba semanas sin dormir bien por la congestión. Desde que uso el nebulizador antes de acostarme duermo de un tirón y me levanto con otra energía. Un antes y un después.",                                                     name: "Carolina M.",        img: "https://http2.mlstatic.com/D_NQ_NP_2X_636231-MLA75580765321_042024-O.webp" },
    { title: "LA NARIZ LIBRE CAMBIA TODO",            rating: 5, text: "No lo compré para dormir mejor... pero ese fue el mayor cambio. La nariz libre cambia todo el día. Rindo más en el trabajo y no ando con esa pesadez constante.",                                                                   name: "Rodrigo T.",         img: "https://http2.mlstatic.com/D_NQ_NP_2X_613997-MLA77680834995_072024-O.webp" },
    { title: "TODA LA FAMILIA DUERME MEJOR",          rating: 5, text: "Mi hijo dejó de despertarse de noche. Nosotros también. Dormimos todos mejor y el día rinde el doble. Es silencioso, lo nebulizo dormido y ni se entera.",                                                                         name: "Valentina R.",       img: "https://http2.mlstatic.com/D_NQ_NP_2X_944973-MLA82774857070_032025-O.webp" },
    { title: "SOY ASMÁTICO Y ES MI ALIADO",           rating: 5, text: "Tengo asma desde chico. Siempre dependí del nebulizador de mesa en casa. Ahora llevo este en la mochila del laburo. Si me agarra una crisis, me nebulizo en 5 minutos sin depender de nadie.",                                      name: "Fernando L.",        img: "https://http2.mlstatic.com/D_NQ_NP_2X_966592-MLA107393087635_022026-O.webp" },
    { title: "FUNCIONA MEJOR QUE EL DE PISTÓN",       rating: 5, text: "Soy kinesióloga respiratoria y lo probé con pacientes. La niebla es más fina que la de un compresor, las sesiones son más cortas y los pacientes lo toleran mucho mejor. Lo recomiendo sin dudas.",                                name: "Mariana G.",         img: "https://http2.mlstatic.com/D_NQ_NP_2X_728374-MLA106062370398_022026-O.webp" },
    { title: "IDEAL PARA CONGESTIÓN",                 rating: 5, text: "No tengo nada crónico, pero en invierno me congestion seguido. Cargo solución fisiológica, 5 minutos de nebulización y se me destapa la nariz al instante. Lo uso casi todos los días en época de frío.",                            name: "Sebastián T.",       img: "https://http2.mlstatic.com/D_NQ_NP_2X_858731-MLA100590488060_122025-O.webp" },
    { title: "SE LO REGALÉ A MI MAMÁ",                rating: 5, text: "Mi mamá tiene EPOC y necesita nebulizarse varias veces al día. Este le cambió la vida porque puede usarlo acostada, cosa que con el pistón no podía. Silencioso, liviano, perfecto para ella.",                                     name: "Josefina P.",        img: "https://http2.mlstatic.com/D_NQ_NP_2X_615822-MLA99843960019_112025-O.webp" },
    { title: "EXCELENTE POR EL PRECIO",               rating: 4, text: "No esperaba mucho por el precio pero me sorprendió para bien. Hace buena niebla, se carga rápido, viene con todo lo necesario. Lo único es que el cepillito de limpieza es medio chico, pero funcional.",                          name: "Renata B.",          img: "https://m.media-amazon.com/images/I/51zTfnSPLjL._AC_UC154,154_CACC,154,154_QL85_.jpg?aicid=community-reviews" },
  ],

  // ── Quiénes somos ─────────────────────────────────────────
  about: {
    title: "QUIÉNES SOMOS",
    img: "https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=1200",
    text: "En BoomHausS nos enfocamos en traer productos que realmente solucionen problemas del día a día, con envío rápido, atención humana y una experiencia de compra simple. Nuestro objetivo es que compres con confianza y recibas exactamente lo que ves.",
    bullets: [
      "✅ Atención por WhatsApp",
      "📦 Envíos a todo el país",
      "🔒 Pagos seguros",
      "⭐ Enfoque en calidad y experiencia",
    ],
  },

  // ── Social proof ──────────────────────────────────────────
  soldCount: 1847,
  reviewCount: 234,
  reviewScore: 4.8,

  // ── Precio tachado fallback ───────────────────────────────
  compareAtPriceFallback: 0,

  // ── Garantia visible (debajo del CTA) ────────────────────
  guarantee: {
    text: "No te convence? Devolvelo sin drama.",
    subtext: "Compra protegida con Mercado Pago",
  },

  // ── WhatsApp flotante ────────────────────────────────────
  whatsapp: {
    show: true,
    number: "5491112345678",  // CAMBIAR por el numero real
    message: "Hola! Tengo una consulta sobre el Nebulizador Mesh",
  },

  // ── Stock limitado (urgencia) ────────────────────────────
  stockAlert: {
    show: true,
    remaining: 11,
  },

  // ── Upsell — productos complementarios ───────────────────
  // Desactivado por ahora. Descomentar para reactivar.
  // upsell: {
  //   title: "Complementá tu nebulizador",
  //   subtitle: "Agregá accesorios y pagás un solo envío",
  //   items: [
  //     {
  //       slug: "solucion-fisiologica-x10",
  //       name: "Solución Fisiológica x10 ampollas",
  //       badge: "MAS VENDIDO",
  //       fallbackPrice: 3200,
  //       fallbackCompareAt: 4800,
  //       fallbackImage: "https://m.media-amazon.com/images/I/61JKnXarVgL._AC_SL1500_.jpg",
  //     },
  //     {
  //       slug: "mascaras-repuesto",
  //       name: "Set Máscaras de Repuesto (adulto + niño)",
  //       badge: "REPUESTO",
  //       fallbackPrice: 4500,
  //       fallbackCompareAt: 6900,
  //       fallbackImage: "https://m.media-amazon.com/images/I/61oKBiAUpTL._AC_SL1500_.jpg",
  //     },
  //     {
  //       slug: "estuche-nebulizador",
  //       name: "Estuche Rígido de Transporte",
  //       badge: "NUEVO",
  //       fallbackPrice: 5800,
  //       fallbackCompareAt: 8500,
  //       fallbackImage: "https://m.media-amazon.com/images/I/71fmrxJ9GPL._AC_SL1500_.jpg",
  //     },
  //   ],
  // },
};

export default nebulizadorMeshConfig;
