// src/landings/mochila-transparente.js
// ─────────────────────────────────────────────────────────────
// Config de marketing para la Mochila Transparente PT-4133
// URL: /lp/mochila-transparente
// Producto en admin → slug: mochila-transparente-pt4133
// ─────────────────────────────────────────────────────────────

const mochilaTransparenteConfig = {
  // ── Slug real del producto en el admin ───────────────────
  // Permite que la URL /lp/mochila-transparente use un producto
  // con slug distinto (mochila-transparente-pt4133) en el admin.
  productSlug: "mochila-transparente-pt4133",

  // ── SEO ───────────────────────────────────────────────────
  pageTitle: "Mochila Transparente para Mascotas PT-4133 | BoomHausS",

  // ── Hero ─────────────────────────────────────────────────
  heroSubtitle: "Llevá a tu mascota a todos lados con estilo y comodidad",
  trustBullets: [
    "🐱 Cúpula panorámica 360° — tu mascota ve todo",
    "✈️ Ventilación superior e inferior — nunca se ahoga",
    "🎒 Ergonómica y manos libres — cómoda para vos",
    "🚚 Envío gratis a todo el país",
  ],

  // ── Descripción corta ────────────────────────────────────
  miniDescription:
    "La Mochila Transparente PT-4133 tiene una cúpula panorámica de policarbonato que le permite a tu gato o perro pequeño ver el mundo a su alrededor sin sentirse encerrado. Ventilación superior e inferior garantiza flujo de aire constante. Interior lavable, correas acolchadas y base antideslizante para que viajen seguros.",

  // ── Story blocks ─────────────────────────────────────────
  storyBlocks: [
    {
      title: "TU MASCOTA MERECE VER EL MUNDO",
      text: "Con la cúpula panorámica 360°, tu gato o perro pequeño puede mirar a todos lados sin sentirse encerrado. La experiencia de salir a caminar se convierte en una aventura compartida: ellos exploran con la vista, vos los llevás cómodo.",
      img: "https://www.gatufy.com/cdn/shop/products/mochila-de-viaje-transparente-asteroid-para-gatos-154366_1024x1024@2x.jpg?v=1639610893",
    },
    {
      title: "DISEÑADA PARA LA COMODIDAD DE AMBOS",
      text: "Correas acolchadas anchas, espalda ventilada y distribución de peso ergonómica para que no te canse ni en caminatas largas. Para tu mascota: interior antideslizante, ventilación cruzada y espacio justo para mantenerse tranquila.",
      img: "https://img.kwcdn.com/product/open/2024-09-13/1726260845910-a894ce1045654bc6a75ed4fda3b788a5-goods.jpeg?imageMogr2/auto-orient%7CimageView2/2/w/800/q/70/format/webp",
    },
    {
      title: "PARA CADA AVENTURA: PASEO, VETERINARIO O VIAJE",
      text: "Es la mochila para mascota más versátil del mercado. Liviana para el día a día, resistente para viajes largos. Limpiala en minutos con un paño húmedo y volvé a usarla de inmediato.",
      img: "https://image.made-in-china.com/202f0j00qLSkbvrPatgu/Manufacturer-Directly-Supplies-Cat-Bags-Pet-Backpacks-Carrier-Portable-and-Transparent-Space-Capsules-Cat-Supplies-Breathable-Backpack.webp",
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
      { icon: "📦", text: "Seguimiento de envío" },
      { icon: "🤝", text: "Soporte por WhatsApp" },
    ],
  },

  // ── Tabla comparativa ─────────────────────────────────────
  comparison: {
    title: "PT-4133 VS TRANSPORTINES COMUNES",
    cols: ["TRANSPORTÍN COMÚN", "MOCHILA PT-4133"],
    rows: [
      { k: "Visibilidad",       a: "Tu mascota no ve nada — estrés y maullidos", b: "Cúpula 360° — ve todo, está tranquila"         },
      { k: "Ventilación",       a: "Mínima o nula — riesgo de calor",            b: "Ventilación superior e inferior cruzada"       },
      { k: "Comodidad para vos",a: "Lo llevás colgado de una mano — te cansa",   b: "En la espalda, manos libres, ergonómica"       },
      { k: "Traslado",          a: "Solo auto o taxi — difícil de llevar a pie",  b: "A pie, bici, colectivo, avión — todo"          },
      { k: "Higiene",           a: "Interior difícil de limpiar",                 b: "Interior removible y lavable en minutos"       },
    ],
  },

  // ── Cómo se usa ──────────────────────────────────────────
  howTo: {
    title: "CÓMO SE USA",
    image: {
      url: "https://pbs.twimg.com/media/HCtFxW5WIAAByZQ?format=jpg&name=small",
      alt: "Cómo usar la mochila transparente para mascotas",
    },
  },

  // ── Tarjeta de autoridad ──────────────────────────────────
  authority: {
    show: false,
  },

  // ── FAQ ──────────────────────────────────────────────────
  faqTitle: "PREGUNTAS FRECUENTES",
  faq: [
    { q: "¿Para qué tamaño de mascota es?",    a: "Ideal para gatos y perros de hasta 6-7 kg. La capacidad interior es de aproximadamente 42×26×28 cm. Revisá las medidas de tu mascota antes de comprar." },
    { q: "¿La cúpula es resistente?",           a: "Sí, es de policarbonato resistente a impactos. No se raya fácil y mantiene la visibilidad con el tiempo. Evitá superficies abrasivas." },
    { q: "¿Cómo se ventila?",                   a: "Tiene ventilación superior (por la cúpula) e inferior (por rejillas en la base). El flujo de aire es constante para que tu mascota esté cómoda incluso en climas cálidos." },
    { q: "¿Se puede abrir para que la mascota entre sola?", a: "Sí, la cúpula se abre y tiene compuerta frontal. Podés entrenar a tu mascota para que entre sola. Viene con clic de seguridad para que no pueda abrir desde adentro." },
    { q: "¿Es cómoda para la espalda?",         a: "Sí, tiene correas acolchadas de 5 cm y espalda ventilada. Para trayectos largos (más de 1 hora) recomendamos usarla con mascotas livianas (hasta 5 kg) para mayor comodidad." },
    { q: "¿Se puede usar en avión?",            a: "Sí, es compatible con los requisitos de cabina en la mayoría de aerolíneas para mascotas pequeñas. Igual, verificá las reglas específicas de tu aerolínea antes de viajar." },
    { q: "¿Cómo se limpia?",                    a: "Interior desmontable y lavable con agua y jabón neutro. La cúpula se limpia con paño húmedo. Secá bien antes de guardarla." },
    { q: "¿Qué incluye la caja?",               a: "1 mochila transparente PT-4133, 1 alfombra interior antideslizante, 1 bolsa de transporte, instrucciones de uso." },
  ],

  // ── Testimonios ──────────────────────────────────────────
  reviewsTitle: "TESTIMONIOS",
  reviewsSubtitle: "Lo que dicen quienes ya la tienen",
  reviewsCarousel: [
    { title: "MI GATO AMA ASOMARSE",     rating: 5, text: "Antes se desesperaba en el transportín. Con esta mochila se asoma por la cúpula y mira todo. Llegamos al veterinario sin un solo maullido.",     name: "Valentina Ríos",  img: "https://m.media-amazon.com/images/I/81cCMKCcROL._AC_UC154,154_CACC,154,154_QL85_.jpg?aicid=community-reviews" },
    { title: "MANOS LIBRES POR FIN",     rating: 5, text: "Antes cargaba el transportín de mano y llegaba con el brazo destruido. Ahora va en la mochila y puedo ir en bici o subir escaleras sin problema.", name: "Facundo Leal",   img: "https://m.media-amazon.com/images/I/61do0ALHlCL._AC_UC154,154_CACC,154,154_QL85_.jpg?aicid=community-reviews" },
    { title: "CÓMODA PARA LOS DOS",      rating: 5, text: "Mi gata de 4 kg viaja muy tranquila. Yo la llevo cómodo con las correas. La cúpula es un plus enorme — ella va mirando todo el tiempo.",          name: "Camila Ossa",   img: "https://m.media-amazon.com/images/I/71iIrIxMYPL._AC_UC154,154_CACC,154,154_QL85_.jpg?aicid=community-reviews" },
    { title: "IDEAL PARA EL VETERINARIO",rating: 5, text: "Antes mi gato se asustaba apenas veía el transportín. Con la mochila se subió solo el segundo día. Ahora lo llevo al vet sin drama.",             name: "Santiago Ruiz", img: "https://m.media-amazon.com/images/I/51Nz8qzvZcL._AC_UC154,154_CACC,154,154_QL85_.jpg?aicid=community-reviews" },
    { title: "LLEGÓ PERFECTA",           rating: 5, text: "Pedí el lunes, llegó el miércoles. Bien embalada, todo impecable. Armé la mochila fácil y mi perrita entró sola a curiosear.",                    name: "Josefina Ayala", img: "https://http2.mlstatic.com/D_NQ_NP_2X_633482-MLA107410545338_032026-O.webp" },
    { title: "PERFECTA EN COLECTIVO",   rating: 5, text: "Vivo en CABA y viajo seguido con mi gato. Con esta mochila no hay drama: entra bajo el asiento, mi gato ve por la cúpula y nadie se queja.",       name: "Martín Ponce",  img: "https://m.media-amazon.com/images/I/71V4OK0k9UL._AC_UC154,154_CACC,154,154_QL85_.jpg?aicid=community-reviews" },
    { title: "CALIDAD MUY BUENA",       rating: 5, text: "Los materiales son sólidos, los cierres funcionan bien y la cúpula no se raya. Para el precio, es una muy buena compra.",                          name: "Luciana Vera",  img: "https://m.media-amazon.com/images/I/71TJuLB413L._AC_UC154,154_CACC,154,154_QL85_.jpg?aicid=community-reviews" },
    { title: "SE DUERME ADENTRO",       rating: 4, text: "Compramos para salir a hacer trámites. Mi perrita chihuahua entra perfecta y se duerme en el camino. La cúpula le da tranquilidad.",               name: "Renata Gómez",  img: "https://m.media-amazon.com/images/I/61+2HuJIV7L._AC_UC154,154_CACC,154,154_QL85_.jpg?aicid=community-reviews" },
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
  soldCount: 634,
  reviewCount: 89,
  reviewScore: 4.8,
  viewingNow: 11,

  // ── Precio tachado fallback ───────────────────────────────
  compareAtPriceFallback: 0,

  // ── Upsell — productos complementarios ───────────────────
  // IMPORTANTE: los slugs deben coincidir con los slugs de los
  // productos creados en Admin → Productos → campo "Slug".
  // Si el producto no se encuentra por slug, se muestran los
  // precios fallback del config y el botón queda deshabilitado.
  upsell: {
    title: "Completá el kit de grooming",
    subtitle: "Agregá uno o más accesorios y pagás un solo envío",
    items: [
      {
        slug: "cepillo-removedor-pelo",         // ← slug en el admin
        name: "Cepillo Removedor de Pelo",
        badge: "MAS VENDIDO",
        fallbackPrice: 9700,
        fallbackCompareAt: 14500,
        fallbackImage: "https://www.petmarket.com.ar/wp-content/uploads/2025/05/D_755648-MLA78360195846_082024-O.jpg",
      },
      {
        slug: "cepillo-spray-electrico",        // ← slug en el admin
        name: "Cepillo con Spray Electrico",
        badge: "NUEVO",
        fallbackPrice: 8900,
        fallbackCompareAt: 13500,
        fallbackImage: "https://http2.mlstatic.com/D_NQ_NP_717011-MLA85823244102_062025-O.webp",
      },
      {
        slug: "guante-quita-pelos",             // ← slug en el admin
        name: "Guante Quita Pelos",
        badge: "OFERTA",
        fallbackPrice: 5800,
        fallbackCompareAt: 8900,
        fallbackImage: "https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcSw1Wt66UwPcXRDLXhlvKw0dtEO3fBMfOP07yCIzhJfURkE3EzYJYxPGpfqCW8CC1TNQkvYDBLeXtcQYwzH8s8RZHm7rwUPXsPBD5HJg-zg&usqp=CAc",
      },
    ],
  },
};

export default mochilaTransparenteConfig;
