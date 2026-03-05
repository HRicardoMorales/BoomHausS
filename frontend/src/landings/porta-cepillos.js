// src/landings/porta-cepillos.js
// ─────────────────────────────────────────────────────────────
// Config de marketing para la landing del Porta Cepillos.
// Para crear una nueva landing, copiá este archivo, cambiá los
// valores y registralo en src/landings/index.js
// ─────────────────────────────────────────────────────────────

const portaCepillosConfig = {
  // ── Datos para el head/SEO ────────────────────────────────
  pageTitle: "Porta Cepillo Esterilizador | BoomHausS",

  // ── Hero ─────────────────────────────────────────────────
  heroSubtitle: "Más higiene y orden todos los días",
  trustBullets: [
    "🦷 Reduce bacterias, gérmenes y humedad",
    "⚡ Dispenser automático sin contacto",
    "🔋 Recargable",
    "🚚 Envío gratis a todo el país",
  ],

  // ── Descripción corta (accordion "ficha técnica") ────────
  miniDescription:
    "Tu cepillo queda al aire… y eso es un imán de gérmenes. Con el Porta Cepillo Dispenser Esterilizador mantenés los cepillos protegidos y más limpios entre usos. Además, te deja la pasta lista con un solo toque: más orden, más higiene y cero complicaciones.",

  // ── Story blocks (imagen + texto alternados) ─────────────
  storyBlocks: [
    {
      title: "CUIDA A LOS MAS IMPORTANTES PARA VOS",
      text: "Para los que querés de verdad, querés soluciones simples que sumen todos los días. Este porta cepillo ayuda a mantener los cepillos más protegidos, ordenados y listos para usar, sin complicaciones. Ideal para hijos, pareja o familiares que comparten baño: más higiene, más tranquilidad.",
      img: "https://http2.mlstatic.com/D_NQ_NP_2X_950983-MLA104372170273_012026-F.webp",
      badge: "",
    },
    {
      title: "Tu cepillo no debería quedar expuesto",
      text: "Nada peor que dejar el cepillo al aire, juntando polvo y salpicaduras sin darte cuenta. Con el esterilizador, el cabezal queda más protegido y más higiénico para el próximo uso. Es tranquilidad diaria, sin pensarla.",
      img: "https://http2.mlstatic.com/D_NQ_NP_2X_605052-MLA92075696569_092025-F.webp",
      badge: "",
    },
    {
      title: "Orden en el baño, rutina más simple",
      text: "Cuando cada cosa tiene su lugar, todo fluye: cepillos colgados, pasta integrada y baño más prolijo. Ideal para casa, depto, familia o compartir baño: queda bien, ocupa poco y te simplifica la mañana y la noche.",
      img: "https://http2.mlstatic.com/D_NQ_NP_2X_918000-MLA92075728129_092025-F.webp",
      badge: "",
    },
  ],

  // ── Sección "Compra con confianza" ───────────────────────
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
    title: "ANTES VS DESPUÉS",
    cols: ["ANTES (SIN EL 3 EN 1)", "DESPUÉS (CON EL 3 EN 1)"],
    rows: [
      { k: "Orden en el baño", a: "Cepillos y pasta sueltos / desorden", b: "Todo en un solo lugar, prolijo" },
      { k: "Uso diario", a: "Apretás el tubo con la mano (se ensucia)", b: "Presionás el cepillo y sale la pasta" },
      { k: "Limpieza", a: "Salpicaduras / restos alrededor", b: "Menos mugre, más fácil de limpiar" },
      { k: "Ahorro de pasta", a: "Sale de más y se desperdicia", b: "Dosificación más pareja" },
      { k: "Espacio", a: "Ocupa lugar en la mesada", b: "Liberás espacio (todo compacto)" },
    ],
  },

  // ── Cómo se usa ──────────────────────────────────────────
  howTo: {
    title: "CÓMO SE USA",
    image: {
      url: "https://http2.mlstatic.com/D_NQ_NP_2X_730119-MLA92075368185_092025-F.webp",
      alt: "Cómo se usa el porta cepillos en 3 pasos",
    },
  },

  // ── Tarjeta de autoridad (profesional) ───────────────────
  authority: {
    show: true,
    photo: "https://images.pexels.com/photos/5327585/pexels-photo-5327585.jpeg?auto=compress&cs=tinysrgb&w=600",
    name: "Dra. Laura Martínez",
    role: "Odontóloga · Higiene oral",
    quote:
      "Un porta cepillos con esterilización UV puede ayudar a reducir la carga bacteriana del cepillo entre usos, especialmente en baños húmedos. Si además mantiene los cepillos separados y secos, mejora la higiene diaria y ayuda a evitar malos olores.",
    disclaimer:
      "Recomendación general de higiene. No reemplaza el cepillado correcto ni controles odontológicos.",
  },

  // ── FAQ ──────────────────────────────────────────────────
  faqTitle: "PREGUNTAS FRECUENTES",
  faq: [
    { q: "¿Cómo se instala?", a: "Se pega a la pared con adhesivo (sin perforar). Limpiá bien la superficie, pegalo, presioná unos segundos y dejalo asentar antes de usar." },
    { q: "¿Sirve para cualquier cepillo dental?", a: "Sí, es compatible con la mayoría de cepillos manuales y muchos eléctricos (según tamaño del mango)." },
    { q: "¿Cómo funciona la esterilización?", a: "El esterilizador ayuda a mantener el cabezal del cepillo más protegido del ambiente. En algunos modelos se activa automáticamente al cerrar la tapa." },
    { q: "¿Hay que cargarlo? ¿Cuánto dura la batería?", a: "Depende del modelo: algunos son recargables por USB y otros usan pilas. En uso normal suele durar varios días/semanas antes de necesitar carga/cambio." },
    { q: "¿Incluye la pasta dental o el cepillo?", a: "No, el producto es el porta cepillos con dispenser/esterilizador. La pasta y los cepillos se venden por separado." },
    { q: "¿El dispenser sirve para cualquier pasta?", a: "Funciona con la mayoría de pastas en tubo estándar. Solo colocás el pico del tubo en el adaptador y presionás el cepillo para dosificar." },
    { q: "¿Se puede usar en baño con humedad?", a: "Sí, está pensado para baño. Igual, para que el adhesivo quede firme, instalalo sobre una superficie lisa y bien seca." },
    { q: "¿Cómo se limpia?", a: "Pasale un paño húmedo por fuera y, cada tanto, retirás los accesorios lavables para enjuagar y secar antes de volver a colocar." },
  ],

  // ── Testimonios ──────────────────────────────────────────
  reviewsTitle: "TESTIMONIOS",
  reviewsSubtitle: "Esto dicen nuestros clientes",
  reviewsCarousel: [
    { title: "MÁS HIGIÉNICO", rating: 5, text: "Antes los cepillos quedaban expuestos todo el día. Con esto quedan más protegidos y el baño se siente más limpio en general.", name: "Carla Benítez", img: "https://http2.mlstatic.com/D_NQ_NP_2X_847065-MLA93209847143_092025-F.webp" },
    { title: "SE NOTA EL CAMBIO", rating: 5, text: "Me daba cosa tener los cepillos a la intemperie. Ahora quedan guardados y siento que ayuda a mantener mejor la higiene diaria.", name: "Julián Rivas", img: "https://http2.mlstatic.com/D_NQ_NP_2X_827742-MLA97357658814_112025-F.webp" },
    { title: "CEPILLOS MÁS PROTEGIDOS", rating: 5, text: "Lo compré por un tema de higiene. Quedó todo más ordenado pero lo principal es que los cepillos no quedan expuestos.", name: "Romina Sosa", img: "https://http2.mlstatic.com/D_NQ_NP_2X_914883-MLA104359225539_012026-F.webp" },
    { title: "ME DEJÓ TRANQUILO", rating: 5, text: "Soy bastante obsesivo con la limpieza del baño. Tener los cepillos resguardados me deja mucho más tranquilo con la higiene.", name: "Nicolás Ferreira", img: "https://http2.mlstatic.com/D_NQ_NP_2X_991593-MLA97567338889_112025-F.webp" },
    { title: "AYUDA EN CASA", rating: 4, text: "En casa somos varios y los cepillos quedaban todos juntos. Ahora están separados y más protegidos. Eso era lo que buscaba.", name: "Micaela Páez", img: "https://http2.mlstatic.com/D_NQ_NP_2X_681590-MLA97122685113_112025-F.webp" },
    { title: "BAÑO MÁS LIMPIO", rating: 5, text: "Me gustó porque mantiene los cepillos lejos de salpicaduras. No es magia, pero claramente ayuda a mantener mejor la higiene.", name: "Sergio Ledesma", img: "https://http2.mlstatic.com/D_NQ_NP_2X_604768-MLA105021350975_012026-F.webp" },
    { title: "BUENA IDEA", rating: 5, text: "No quería seguir dejando los cepillos en un vaso. Con esto quedan guardados y siento que es una mejora real para la higiene.", name: "Lucía Giménez", img: "https://http2.mlstatic.com/D_NQ_NP_2X_615857-MLA104463732564_012026-F.webp" },
    { title: "PARA LA FAMILIA", rating: 5, text: "Lo puse pensando en mis hijos. Que cada cepillo quede en su lugar y más protegido me parece lo más importante.", name: "Federico Albornoz", img: "https://http2.mlstatic.com/D_NQ_NP_2X_735168-MLA104575340271_012026-F.webp" },
    { title: "SE NOTA PROTEGIDO", rating: 4, text: "Los cepillos quedan más resguardados y eso se siente. Me gusta porque el baño queda más 'sanitario' sin exagerar.", name: "Mariana Quiroga", img: "https://http2.mlstatic.com/D_NQ_NP_2X_612380-MLA103990675067_012026-F.webp" },
    { title: "MEJOR PARA HIGIENE", rating: 5, text: "Desde que lo tengo, dejé de dejar los cepillos expuestos. Es un cambio simple, pero para higiene diaria suma un montón.", name: "Gustavo Molina", img: "https://http2.mlstatic.com/D_NQ_NP_2X_901052-MLA104463601083_012026-F.webp" },
    { title: "MÁS TRANQUILIDAD", rating: 5, text: "A mí me importaba la parte higiénica. Los cepillos quedan protegidos y siento más tranquilidad con lo que uso todos los días.", name: "Valentina Ortiz", img: "https://http2.mlstatic.com/D_NQ_NP_2X_850550-MLA98741967278_112025-F.webp" },
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

  // ── Social proof numbers ──────────────────────────────────
  soldCount: 2105,
  reviewCount: 274,
  reviewScore: 4.7,
  viewingNow: 13,

  // ── Precio fallback (si el API no trae compareAtPrice) ───
  compareAtPriceFallback: 60350,
};

export default portaCepillosConfig;