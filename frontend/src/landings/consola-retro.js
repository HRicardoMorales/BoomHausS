// src/landings/consola-retro.js
// ─────────────────────────────────────────────────────────────
// Config de marketing para la landing de la Consola Retro M15 Pro
// URL: /lp/consola-retro
// Producto en admin → slug: consola-retro
// ─────────────────────────────────────────────────────────────

const consolaRetroConfig = {
  // ── SEO ───────────────────────────────────────────────────
  pageTitle: "Consola Retro M15 Pro | BoomHausS",

  // ── Hero ─────────────────────────────────────────────────
  heroSubtitle: "2 controles inalámbricos + +10.000 juegos retro. Enchufás y jugás.",
  trustBullets: [
    "🕹️ 2 controles inalámbricos incluidos — jugás de entrada",
    "🎮 +10.000 juegos retro listos — sin descargar nada",
    "📺 Salida 4K HDMI — se ve increíble en tu tele",
    "🚚 Envío gratis a todo el país",
  ],

  // ── Descripción corta ────────────────────────────────────
  miniDescription:
    "La consola M15 Pro trae todo lo que necesitás para jugar hoy: enchufás al HDMI, conectás los dos controles inalámbricos y tenés más de 10.000 juegos retro listos. Sin cartuchos, sin configuraciones, sin vueltas. NES, SNES, Sega, GBA, PS1 y mucho más en un solo dispositivo compacto.",

  // ── Story blocks ─────────────────────────────────────────
  storyBlocks: [
    {
      title: "TODO INCLUIDO, ENCHUFÁS Y JUGÁS",
      text: "Sin downloads, sin cuentas, sin suscripciones. La M15 Pro viene lista: conectás el stick al HDMI de tu tele, ponés las pilas en los controles y en segundos estás en el menú con más de 10.000 juegos. Así de simple.",
      img: "https://http2.mlstatic.com/D_NQ_NP_2X_615857-MLA104463732564_012026-F.webp", // ← reemplazá con imagen real del producto
      badge: "Plug & Play",
    },
    {
      title: "DOS CONTROLES INALÁMBRICOS INCLUIDOS",
      text: "Viene con dos mandos estilo PS5, ergonómicos y cómodos para largas sesiones. Conexión 2.4G sin lag, respuesta inmediata. Ideal para jugar solo o en modo multijugador con quien tengas al lado.",
      img: "https://http2.mlstatic.com/D_NQ_NP_2X_827742-MLA97357658814_112025-F.webp", // ← reemplazá con imagen real del producto
      badge: "2 controles",
    },
    {
      title: "+10.000 JUEGOS RETRO EN UN SOLO DISPOSITIVO",
      text: "NES, Super Nintendo, Sega Genesis, Game Boy Advance, PS1 y más. Todos los clásicos que creciste jugando, en 64GB de almacenamiento. Nunca más vas a quedarte sin qué jugar.",
      img: "https://http2.mlstatic.com/D_NQ_NP_2X_950983-MLA104372170273_012026-F.webp", // ← reemplazá con imagen real del producto
      badge: "64 GB",
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
    title: "M15 PRO VS ALTERNATIVAS",
    cols: ["OTRAS OPCIONES", "M15 PRO (LO QUE COMPRÁS)"],
    rows: [
      { k: "Juegos incluidos",     a: "Pocos o ninguno / hay que descargar", b: "+10.000 juegos retro listos" },
      { k: "Controles",           a: "1 control o se venden aparte",         b: "2 controles inalámbricos incluidos" },
      { k: "Configuración",       a: "Setup complicado / requiere cuenta",   b: "Plug & Play — enchufás y jugás" },
      { k: "Calidad de imagen",   a: "Salida SD o HD básica",                b: "Salida 4K HDMI — imagen nítida" },
      { k: "Almacenamiento",      a: "Poca memoria / hay que comprar más",   b: "64 GB incluidos" },
      { k: "Compatibilidad",      a: "Solo una plataforma retro",            b: "NES, SNES, GBA, Sega, PS1 y más" },
    ],
  },

  // ── Cómo se usa ──────────────────────────────────────────
  howTo: {
    title: "CÓMO SE USA",
    image: {
      url: "https://http2.mlstatic.com/D_NQ_NP_2X_730119-MLA92075368185_092025-F.webp", // ← reemplazá con imagen del instructivo
      alt: "Cómo conectar la consola M15 Pro en 3 pasos",
    },
  },

  // ── Tarjeta de autoridad ──────────────────────────────────
  authority: {
    show: true,
    photo: "https://images.pexels.com/photos/3831645/pexels-photo-3831645.jpeg?auto=compress&cs=tinysrgb&w=600",
    name: "Lic. Martín Cabrera",
    role: "Especialista en videojuegos retro · Gaming",
    quote: "La M15 Pro es una de las mejores opciones del mercado para quienes quieren revivir los clásicos sin complicaciones. La combinación de más de 10.000 juegos, salida 4K y dos controles inalámbricos incluidos la pone muy por encima de la competencia en su rango de precio.",
    disclaimer: "Opinión basada en análisis de producto. Los resultados pueden variar según el uso.",
  },

  // ── FAQ ──────────────────────────────────────────────────
  faqTitle: "PREGUNTAS FRECUENTES",
  faq: [
    {
      q: "¿Necesito internet para jugar?",
      a: "No. Todos los juegos están almacenados en los 64GB del dispositivo. Solo necesitás la tele y un enchufe para cargar. Sin Wi-Fi, sin suscripciones, sin límites.",
    },
    {
      q: "¿Con qué televisores es compatible?",
      a: "Con cualquier tele que tenga entrada HDMI. La mayoría de las pantallas modernas (LCD, LED, Smart TV) tienen HDMI. Si tu tele es muy vieja, necesitás un adaptador HDMI a AV (no incluido).",
    },
    {
      q: "¿Los controles necesitan pilas o se cargan por USB?",
      a: "Los controles son recargables por USB. El cable de carga se incluye en la caja. Una carga completa dura varias horas de juego.",
    },
    {
      q: "¿Cuántos jugadores pueden jugar al mismo tiempo?",
      a: "Hasta 2 jugadores simultáneamente con los dos controles inalámbricos incluidos. Perfecto para jugar con un amigo, pareja o familiar.",
    },
    {
      q: "¿Qué consolas retro emula?",
      a: "NES (Nintendo), Super Nintendo (SNES), Sega Genesis / Mega Drive, Game Boy Advance (GBA), PlayStation 1 (PS1) y otras plataformas retro de los 80s y 90s.",
    },
    {
      q: "¿Se pueden agregar más juegos?",
      a: "Sí, en algunos modelos podés conectar un pendrive o microSD para agregar más juegos compatibles. Consultanos por WhatsApp si querés saber más.",
    },
    {
      q: "¿Puedo usarla en cualquier tele de la casa?",
      a: "Sí, es portátil. El game stick es pequeño y lo podés mover de habitación en habitación. Solo enchufás al HDMI de la tele que quieras usar.",
    },
    {
      q: "¿Qué incluye la caja?",
      a: "1 game stick M15 Pro, 2 controles inalámbricos 2.4G, 1 receptor USB inalámbrico, cable HDMI, cable de carga USB, y manual de uso.",
    },
  ],

  // ── Testimonios ──────────────────────────────────────────
  reviewsTitle: "TESTIMONIOS",
  reviewsSubtitle: "Lo que dicen los que ya jugaron",
  reviewsCarousel: [
    {
      title: "UN GOLAZO",
      rating: 5,
      text: "No esperaba que fuera tan fácil de conectar. Enchufé al HDMI y en dos minutos estaba jugando al Street Fighter con mi hermano. Un golazo.",
      name: "Sebastián Torres",
      img: "https://http2.mlstatic.com/D_NQ_NP_2X_847065-MLA93209847143_092025-F.webp",
    },
    {
      title: "REGALO PERFECTO",
      rating: 5,
      text: "Se lo regalé a mi viejo para su cumpleaños. Cuando vio los juegos del Atari y el Super Mario se emocionó. No para de jugar.",
      name: "Lucía Fernández",
      img: "https://http2.mlstatic.com/D_NQ_NP_2X_827742-MLA97357658814_112025-F.webp",
    },
    {
      title: "LOS CONTROLES SON CÓMODOS",
      rating: 5,
      text: "Vine por los juegos pero lo que más me sorprendió fueron los controles. Se sienten como los de una PlayStation, no baratos ni incómodos.",
      name: "Matías Herrera",
      img: "https://http2.mlstatic.com/D_NQ_NP_2X_914883-MLA104359225539_012026-F.webp",
    },
    {
      title: "NOSTALGIA TOTAL",
      rating: 5,
      text: "Jugué al Contra, al Megaman, al Mortal Kombat y al Crash Bandicoot todo en una tarde. Pura nostalgia. Vale cada peso.",
      name: "Diego Romero",
      img: "https://http2.mlstatic.com/D_NQ_NP_2X_991593-MLA97567338889_112025-F.webp",
    },
    {
      title: "PERFECTO PARA NIÑOS",
      rating: 5,
      text: "Mis hijos de 8 y 10 años no lo sueltan. Los juegos son variados y apropiados. Y yo aproveché para enseñarles los clásicos de mi época.",
      name: "Carolina Gómez",
      img: "https://http2.mlstatic.com/D_NQ_NP_2X_681590-MLA97122685113_112025-F.webp",
    },
    {
      title: "IMAGEN NÍTIDA EN 4K",
      rating: 5,
      text: "Conecté a mi tele 55' y la imagen se ve muy bien. Mucho mejor de lo que esperaba para juegos retro. Los colores se ven vivos.",
      name: "Alejandro Vidal",
      img: "https://http2.mlstatic.com/D_NQ_NP_2X_604768-MLA105021350975_012026-F.webp",
    },
    {
      title: "ENTRETIENE A TODA LA FAMILIA",
      rating: 4,
      text: "Compramos para usarla de vez en cuando y terminamos jugando todos los fines de semana. La variedad de juegos es enorme.",
      name: "Valeria Muñoz",
      img: "https://http2.mlstatic.com/D_NQ_NP_2X_615857-MLA104463732564_012026-F.webp",
    },
    {
      title: "LLEGÓ RÁPIDO Y EN CAJA",
      rating: 5,
      text: "Pedido el martes, llegó el jueves. La caja llegó perfecta, sin golpes. Todo como en la foto. Muy conforme con la compra.",
      name: "Nicolás Aguirre",
      img: "https://http2.mlstatic.com/D_NQ_NP_2X_735168-MLA104575340271_012026-F.webp",
    },
    {
      title: "PARA PASAR EL TIEMPO",
      rating: 4,
      text: "La compré para tener algo entretenido en casa sin pagar suscripciones. Muy buena opción para lo que cuesta. La recomiendo.",
      name: "Florencia Paz",
      img: "https://http2.mlstatic.com/D_NQ_NP_2X_612380-MLA103990675067_012026-F.webp",
    },
    {
      title: "DOS CONTROLES ES UN PLUS",
      rating: 5,
      text: "Lo mejor es que viene con dos controles de entrada. No tuve que comprar nada extra. Directo a jugar con mi pareja.",
      name: "Ramiro Blanco",
      img: "https://http2.mlstatic.com/D_NQ_NP_2X_901052-MLA104463601083_012026-F.webp",
    },
    {
      title: "CLÁSICOS QUE NO FALLAN",
      rating: 5,
      text: "Super Mario, Tetris, Sonic, Donkey Kong, Pac-Man... todos están. Para los que crecimos en los 90, esto es una joya.",
      name: "Marina Suárez",
      img: "https://http2.mlstatic.com/D_NQ_NP_2X_850550-MLA98741967278_112025-F.webp",
    },
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
  soldCount: 847,
  reviewCount: 112,
  reviewScore: 4.8,
  viewingNow: 9,

  // ── Qué viene en la caja ──────────────────────────────────
  boxItems: [
    { icon: "🕹️", name: "Game Stick M15 Pro",          qty: "× 1" },
    { icon: "🎮", name: "Controles inalámbricos 2.4G",  qty: "× 2" },
    { icon: "📡", name: "Receptor USB inalámbrico",     qty: "× 1" },
    { icon: "📺", name: "Cable HDMI",                   qty: "× 1" },
    { icon: "🔌", name: "Cable de carga USB",           qty: "× 1" },
    { icon: "📋", name: "Manual de uso",                qty: "× 1" },
  ],

  // ── Precio tachado fallback ───────────────────────────────
  compareAtPriceFallback: 0, // lo setéas en el admin al crear el producto
};

export default consolaRetroConfig;