// src/landings/mochila-fashion.js
// ─────────────────────────────────────────────────────────────
// Config de marketing para la Mochila Fashion para Mascotas
// URL: /lp/mochila-fashion
// Producto en admin → slug: mochila-fashion
// ─────────────────────────────────────────────────────────────

const mochilaFashionConfig = {
  // ── Slug real del producto en el admin ───────────────────
  productSlug: "mochila-fashion",

  // ── SEO ───────────────────────────────────────────────────
  pageTitle: "Mochila Fashion para Mascotas | BoomHausS",
  checkoutName: "Mochila Fashion para Mascotas",

  // ── Hero ─────────────────────────────────────────────────
  heroSubtitle: "La mochila que tu mascota merece — estilo y comodidad en una sola pieza",
  trustBullets: [
    "🎀 Diseño fashion — salís a la calle con estilo",
    "🐾 Interior acolchado — tu mascota viaja cómoda",
    "🎒 Ergonómica y manos libres — cómoda para vos",
    "🚚 Envío gratis a todo el país",
  ],

  // ── Descripción corta ────────────────────────────────────
  miniDescription:
    "La Mochila Fashion combina estética moderna con funcionalidad real. Diseñada para mascotas de hasta 6 kg, tiene interior acolchado, ventilación lateral, ventana de malla y cierre de seguridad. Strap ergonómico y espalda ventilada para que vos llegues cómodo a destino. Disponible en varios colores.",

  // ── Story blocks ─────────────────────────────────────────
  storyBlocks: [
    {
      title: "SALIR CON TU MASCOTA NUNCA FUE TAN ESTILOSO",
      text: "Ya no tenés que elegir entre comodidad y estética. La Mochila Fashion está diseñada para que combines con tu look sin sacrificar nada. Tu perro o gato viaja seguro mientras vos llegás a destino con onda.",
      img: "https://images.pexels.com/photos/6568501/pexels-photo-6568501.jpeg?auto=compress&cs=tinysrgb&w=800",
    },
    {
      title: "PENSADA PARA EL CONFORT DE LOS DOS",
      text: "Interior completamente acolchado para que tu mascota esté tranquila durante todo el trayecto. Ventana de malla lateral para que respire y pueda asomarse. Strap ancho de 5 cm con relleno ergonómico para que vos no sientas el peso.",
      img: "https://images.pexels.com/photos/6568941/pexels-photo-6568941.jpeg?auto=compress&cs=tinysrgb&w=800",
    },
    {
      title: "PARA CADA SALIDA: PASEO, VET O CAFÉ PET-FRIENDLY",
      text: "Liviana y compacta para el día a día, resistente para viajes más largos. La tela es impermeable y fácil de limpiar. Entra perfectamente bajo el asiento en colectivo y en la mayoría de aerolíneas para cabina.",
      img: "https://images.pexels.com/photos/1254140/pexels-photo-1254140.jpeg?auto=compress&cs=tinysrgb&w=800",
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
    title: "MOCHILA FASHION VS BOLSOS COMUNES",
    cols: ["BOLSO COMÚN", "MOCHILA FASHION"],
    rows: [
      { k: "Estética",          a: "Genérico, sin diseño — pasa desapercibido",      b: "Diseño fashion — se nota que elegiste bien"     },
      { k: "Comodidad",         a: "Colgado de una mano — te cansa el brazo",        b: "En la espalda, manos libres, strap ergonómico"  },
      { k: "Ventilación",       a: "Interior cerrado — tu mascota se ahoga de calor",b: "Malla lateral + ventilación cruzada"            },
      { k: "Seguridad",         a: "Cierre simple — tu mascota puede escaparse",     b: "Doble cierre + clip de seguridad interno"       },
      { k: "Limpieza",          a: "Tela que absorbe olores — difícil de limpiar",   b: "Tela impermeable — se limpia con un paño"       },
    ],
  },

  // ── Cómo se usa ──────────────────────────────────────────
  howTo: {
    title: "CÓMO SE USA",
    image: {
      url: "https://images.pexels.com/photos/6568946/pexels-photo-6568946.jpeg?auto=compress&cs=tinysrgb&w=800",
      alt: "Cómo usar la mochila fashion para mascotas",
    },
  },

  // ── Tarjeta de autoridad ──────────────────────────────────
  authority: {
    show: false,
  },

  // ── FAQ ──────────────────────────────────────────────────
  faqTitle: "PREGUNTAS FRECUENTES",
  faq: [
    { q: "¿Para qué tamaño de mascota es?",          a: "Ideal para gatos y perros de hasta 6 kg. Dimensiones internas: aprox. 38×24×26 cm. Medí a tu mascota antes de comprar para asegurarte que entra cómoda." },
    { q: "¿Qué colores hay disponibles?",            a: "Disponible en varios colores. El color exacto disponible se muestra en la página del producto. Si querés consultar stock de un color específico, escribinos por WhatsApp." },
    { q: "¿La tela es resistente?",                  a: "Sí, está fabricada en tela Oxford 600D impermeable y costuras reforzadas. Resiste el uso diario y no se deforma con el peso de la mascota." },
    { q: "¿Cómo se ventila el interior?",            a: "Tiene malla lateral de ventilación y la ventana frontal también permite circulación de aire. El interior acolchado retiene la temperatura pero no genera calor excesivo." },
    { q: "¿La mascota puede asomarse?",              a: "Sí, la ventana frontal con malla permite que tu mascota mire hacia afuera. También tiene apertura superior para que meta la cabeza si quiere." },
    { q: "¿Es cómoda para la espalda?",              a: "Las correas están acolchadas con 5 cm de ancho y la espalda tiene panel ventilado. Para trayectos largos con mascotas de más de 4 kg, recomendamos hacer pausas." },
    { q: "¿Se puede usar en colectivo o avión?",     a: "Sí, el tamaño es compatible con la mayoría de medios de transporte. Para vuelos, verificá las dimensiones permitidas por tu aerolínea específica." },
    { q: "¿Qué incluye?",                            a: "1 mochila fashion para mascotas, 1 almohadilla interior desmontable y lavable, 1 correa de seguridad interna, instrucciones de uso." },
  ],

  // ── Mini reseñas (carrusel compacto) ─────────────────────
  miniReviews: [
    { rating: 5, short: "Todos en el parque me preguntaron dónde la compré. Mi gato va tranquilo y yo llego con estilo.", name: "Luciana M." },
    { rating: 5, short: "Llegó rápido y la calidad es muy buena. Las costuras son sólidas y el cierre funciona perfecto.", name: "Tomás R." },
    { rating: 5, short: "Mi perrita chihuahua entra perfecta. Se asoma por la ventana y la gente se derrite de ternura.", name: "Agustina V." },
    { rating: 5, short: "La uso para ir al vet y para salir a caminar. Cómoda para mí y mi gato no protesta nada.", name: "Nicolás F." },
    { rating: 5, short: "Muchísimo mejor que el transportín viejo. Se limpia fácil y el diseño es muy lindo.", name: "Camila S." },
    { rating: 4, short: "Buena calidad y linda presentación. El interior acolchado es un detalle que se nota.", name: "Martín G." },
  ],

  // ── Testimonios ──────────────────────────────────────────
  reviewsTitle: "TESTIMONIOS",
  reviewsSubtitle: "Lo que dicen quienes ya la tienen",
  reviewsCarousel: [
    { title: "UNA JOYA DE MOCHILA",         rating: 5, text: "No esperaba que fuera tan linda en persona. Las fotos ya la hacían bien, pero cuando la abrí me sorprendió la calidad del interior. Mi gato entró solo a investigarla.",                              name: "Luciana Medina",   img: "https://m.media-amazon.com/images/I/81cCMKCcROL._AC_UC154,154_CACC,154,154_QL85_.jpg?aicid=community-reviews" },
    { title: "LLEGÓ EN DOS DÍAS",           rating: 5, text: "Pedí el martes y llegó el jueves. Bien embalada, sin ningún problema. La armé en minutos y mi perrita entró sola a curiosear el interior acolchado.",                                                   name: "Tomás Ríos",       img: "https://m.media-amazon.com/images/I/61do0ALHlCL._AC_UC154,154_CACC,154,154_QL85_.jpg?aicid=community-reviews" },
    { title: "PERFECTA PARA EL DÍA A DÍA", rating: 5, text: "La uso tres veces por semana para ir al parque con mi perro. Es liviana, no me cansa la espalda y mi perro va tranquilo. Ya me preguntaron varios dónde la compré.",                                   name: "Agustina Varela",  img: "https://m.media-amazon.com/images/I/71iIrIxMYPL._AC_UC154,154_CACC,154,154_QL85_.jpg?aicid=community-reviews" },
    { title: "MI GATO DEJÓ DE ESTRESARSE", rating: 5, text: "Antes el vet era un drama. Con esta mochila se queda quieto durante todo el viaje. La ventana de malla le gusta porque puede ver hacia afuera sin que nadie lo toque.",                               name: "Nicolás Ferreyra", img: "https://m.media-amazon.com/images/I/51Nz8qzvZcL._AC_UC154,154_CACC,154,154_QL85_.jpg?aicid=community-reviews" },
    { title: "CALIDAD MUY POR ENCIMA",      rating: 5, text: "Para el precio que tiene, la calidad es excelente. Las costuras están bien hechas, el cierre desliza suave y el interior es más acolchado de lo que esperaba.",                                          name: "Camila Suárez",    img: "https://m.media-amazon.com/images/I/71TJuLB413L._AC_UC154,154_CACC,154,154_QL85_.jpg?aicid=community-reviews" },
    { title: "SE LA RECOMENDÉ A TODOS",     rating: 5, text: "En el grupo de dueños de mascotas de mi barrio la recomendé apenas la recibí. Ya compraron dos personas más. Diseño copado y funciona de verdad.",                                                       name: "Josefina Paz",     img: "https://http2.mlstatic.com/D_NQ_NP_2X_633482-MLA107410545338_032026-O.webp" },
    { title: "IDEAL PARA COLECTIVO",        rating: 5, text: "Viajo seguido en transporte público con mi gata. Entra bajo el asiento sin problema, ella va cómoda y nadie se da cuenta que la llevo. Sin drama en ningún viaje.",                                      name: "Martín González",  img: "https://m.media-amazon.com/images/I/71V4OK0k9UL._AC_UC154,154_CACC,154,154_QL85_.jpg?aicid=community-reviews" },
    { title: "MUY BUENA COMPRA",            rating: 4, text: "Estaba dudando si comprarla pero me decidí y no me arrepiento. El diseño es lindo, la tela se ve resistente y la almohadilla se saca fácil para lavar.",                                                name: "Renata Blanco",    img: "https://m.media-amazon.com/images/I/61+2HuJIV7L._AC_UC154,154_CACC,154,154_QL85_.jpg?aicid=community-reviews" },
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
  soldCount: 412,
  reviewCount: 67,
  reviewScore: 4.9,
  stockAlert: { show: true, remaining: 7 },

  // ── Garantía 30 días ─────────────────────────────────────
  guarantee: {
    title: "30 DÍAS SIN RIESGO",
    sub: "Llevá a tu mascota 30 días con la mochila. Si no quedás conforme con la comodidad, el diseño o los materiales, te devolvemos el dinero completo.",
    cta: "QUIERO LA MOCHILA →",
  },

  // ── Precio tachado fallback ───────────────────────────────
  compareAtPriceFallback: 0,

  // ── Upsell — productos complementarios ───────────────────
  upsell: {
    title: "Completá el kit de tu mascota",
    subtitle: "Agregá uno o más accesorios y pagás un solo envío",
    items: [
      {
        slug: "cepillo-removedor-pelo",
        name: "Cepillo Removedor de Pelo",
        badge: "MAS VENDIDO",
        fallbackPrice: 9700,
        fallbackCompareAt: 14500,
        fallbackImage: "https://m.media-amazon.com/images/I/61oKBiAUpTL._AC_SL1500_.jpg",
      },
      {
        slug: "guante-quita-pelos",
        name: "Guante Quita Pelos",
        badge: "OFERTA",
        fallbackPrice: 5800,
        fallbackCompareAt: 8900,
        fallbackImage: "https://http2.mlstatic.com/D_NQ_NP_871033-MLA88006639688_072025-O.webp",
      },
      {
        slug: "cepillo-spray-electrico",
        name: "Cepillo con Spray Eléctrico",
        badge: "NUEVO",
        fallbackPrice: 8900,
        fallbackCompareAt: 13500,
        fallbackImage: "https://http2.mlstatic.com/D_NQ_NP_717011-MLA85823244102_062025-O.webp",
      },
    ],
  },
};

export default mochilaFashionConfig;
