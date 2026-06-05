// src/landings/sillon-puff-inflable.js
// ─────────────────────────────────────────────────────────────
// Config de marketing para el Sillón Puff Inflable Sunfield
// URL: /lp/sillon-puff-inflable
// Producto en admin -> slug: sillon-puff-inflable
// Renderizado por: src/pages/SillonPuffLanding.jsx (componente dedicado)
// ─────────────────────────────────────────────────────────────

const sillonPuffInflableConfig = {
  productSlug: "sillon-puff-inflable",

  pageTitle: "Sillón Puff Inflable Sunfield | Relax instantáneo para tu living y dormitorio | Amelor",
  checkoutName: "Sillón Puff Inflable Sunfield",

  heroSubtitle: "Inflalo en minutos. Moderniza tu hogar.",

  trustBullets: [
    "🛋️ Material flocado premium",
    "⚡ Se infla en menos de 3 minutos con el inflador incluido",
    "🎁 Posapié a juego",
    "🚚 Envío gratis a todo el país",
  ],

  ctaLine1: "LO QUIERO EN MI LIVING",
  ctaLine2: "LO QUIERO 🚚",
  stockAlertText: "⚠️ Quedan pocas unidades al precio actual",
  stickyBtnText: "LO QUIERO 🚚",

  miniDescription:
    "Sillón puff inflable de la marca Sunfield con recubrimiento flocado premium. Incluye posapié a juego y se infla en menos de 3 minutos. Ideal para living y dormitorio. Liviano, fácil de guardar y con acabado suave al tacto.",

  // ── Bundles ──────────────────────────────────────────────────
  bundles: [
    {
      id: 1,
      label: "1 Sillón Sunfield",
      qty: 1,
      price: 69800,
      compareAt: 114800,
      badge: "MÁS POPULAR",
      popular: true,
      soldOut: false,
      benefit: "🎁 Posapié de regalo + Inflador de pie · 🚚 Envío gratis a todo el país",
      gifts: ["Posapié Sunfield", "Inflador de pie"],
    },
    {
      id: 2,
      label: "2 Sillones Sunfield",
      qty: 2,
      price: 131800,
      compareAt: 229600,
      badge: "MEJOR VALOR",
      popular: false,
      soldOut: false,
      benefit: "🎁 2 Posapíes de regalo + Compresor eléctrico · 🚚 Envío gratis",
      gifts: ["Posapié Sunfield x2", "Compresor eléctrico"],
    },
    {
      id: 3,
      label: "Pack Sunfield Triple — Edición Limitada",
      qty: 3,
      price: 0,
      compareAt: 0,
      badge: "",
      popular: false,
      soldOut: true,
      benefit: "",
    },
  ],

  // ── Imágenes placeholder ──────────────────────────────────────
  // src vacío — se reemplaza desde el admin → Productos → Sillón Puff Inflable → Imágenes
  // Índices del admin → producto.images[]:
  //   [0-3]   Galería del hero (imagen principal + 3 miniaturas)
  //   [4]     Bloque storytelling 1 — momento de relax en living
  //   [5]     Bloque storytelling 2 — espacio transformado en dormitorio
  //   [6]     Bloque storytelling 3 — sillón desinflado guardado en placard
  //   [7-13]  Imágenes de reseñas (7 fotos, mismo orden que el carousel)
  heroImages: [
    { src: "", alt: "Sillón puff inflable Sunfield en living moderno, con posapié, vista frontal completa" },
    { src: "", alt: "Detalle del material flocado premium del sillón puff Sunfield — textura suave al tacto" },
    { src: "", alt: "Sillón puff Sunfield con posapié, vista lateral — compacto y amplio a la vez" },
    { src: "", alt: "Persona recostada cómodamente en el sillón puff Sunfield leyendo en el living" },
  ],

  // ── Story blocks ─────────────────────────────────────────────
  storyBlocks: [
    {
      title: "Querés renovar tu living pero los muebles cuestan una fortuna",
      img: "https://pbs.twimg.com/media/HI-2g5HWQAAAhQ1?format=jpg&name=small",
      imgAlt: "Living con muebles viejos y desgastados — la frustración de querer cambiar y no poder",
      textHtml: `Mirás tu living y sentís que le falta algo.<br>Querés darle un toque moderno, que se vea distinto, que cuando lleguen visitas digan <strong>"qué lindo quedó"</strong>.<br>Pero los muebles nuevos son carísimos, pesan toneladas y encima necesitás que alguien te ayude a moverlos.<br><strong>Renovar tu espacio no debería ser un proyecto de obra.</strong>`,
    },
    {
      title: "El Sunfield transforma tu espacio en minutos, sin gastar una fortuna",
      img: "https://pbs.twimg.com/media/HI-43LyWgAAPfxi?format=jpg&name=medium",
      imgAlt: "Sillón puff Sunfield en living moderno — transformación instantánea sin muebles pesados",
      textHtml: `Con el Sunfield no necesitás obra, ni herramientas, ni pedir ayuda.<br><strong>Lo inflás en menos de tres minutos</strong>, lo ponés donde querés y tu living tiene otra cara.<br>¿Querés probarlo en el dormitorio? Lo movés solo. ¿No te convence el rincón? Lo cambiás en segundos.<br><strong>Tu espacio se adapta a vos, no al revés.</strong>`,
    },
    {
      title: "Un material que no parece inflable y eso lo cambia todo",
      img: "https://pbs.twimg.com/media/HI-5eV4XoAAjZbg?format=jpg&name=medium",
      imgAlt: "Detalle del material flocado premium del sillón puff Sunfield — textura suave y antideslizante",
      textHtml: `Lo primero que notás cuando lo tocás es que <strong>no parece inflable</strong>.<br>El recubrimiento flocado premium es suave al tacto, no transpira, no se resbala y no se marca.<br>Nada del vinilo frío y rígido de los inflatables baratos.<br><strong>Se siente como un mueble de verdad — porque en calidad, lo es.</strong>`,
    },
  ],

  // ── Mini videos / proof strip ─────────────────────────────────
  proofVideosKicker: "✦ EN TODOS LOS RINCONES DE TU HOGAR",
  proofVideosTitle: "Un sillón, mil lugares",
  proofVideosSubtitle: "En el living, el dormitorio o la terraza — listo en minutos",
  proofVideos: [
    {
      imgUrl: "https://pbs.twimg.com/media/HI-zIh7WQAA2uSk?format=jpg&name=4096x4096",
      label: "EN EL LIVING",
    },
    {
      imgUrl: "https://http2.mlstatic.com/D_NQ_NP_2X_750821-MLA109764212274_042026-F.webp",
      label: "EN EL DORMITORIO",
    },
    {
      imgUrl: "https://pbs.twimg.com/media/HI-0pxAXAAAMv3E?format=jpg&name=small",
      label: "EN EL JARDIN",
    },
  ],

  // ── Reseñas ──────────────────────────────────────────────────
  reviewsTitle: "LO QUE DICEN LOS QUE YA LO TIENEN",
  reviewsSubtitle: "Compradores verificados · Promedio 4.8 ⭐",

  reviews: [
    {
      name: "Valentina M.",
      rating: 5,
      title: "EL MEJOR RINCÓN DE MI LIVING",
      text: "Lo compré sin muchas expectativas y me sorprendió. El material flocado se siente premium de verdad — no ese plástico barato que venía esperando. Se infló en tres minutos y el posapié complementa perfecto. Es donde termino todas las noches.",
      img: "https://http2.mlstatic.com/D_NQ_NP_2X_617681-MLA89119471102_082025-F.webp",
      imgAlt: "Valentina M. — sillón puff Sunfield en living",
    },
    {
      name: "Lucas F.",
      rating: 5,
      title: "INFLADO EN DOS MINUTOS Y PICO",
      text: "Me vendió el inflador de pie incluido. Sin enchufar nada, sin esperar. Dos minutos y tenía el sillón listo. Probé en el living y en el cuarto de huéspedes. En los dos queda perfecto. El flocado no se resbala ni se marca.",
      img: "https://m.media-amazon.com/images/I/716c0UelObL.jpg",
      imgAlt: "Lucas F. — inflando el sillón puff Sunfield con inflador de pie",
    },
    {
      name: "Sofía R.",
      rating: 5,
      title: "EL MATERIAL ES LO QUE MÁS SORPRENDE",
      text: "Pensé que iba a ser ese vinilo frío y rugoso de los inflatables baratos. El flocado de Sunfield es completamente diferente: suave al tacto, no transpira, no se resbala. Mis visitas siempre lo terminan ocupando antes que yo.",
      img: "https://http2.mlstatic.com/D_NQ_NP_2X_767745-MLA106771854478_022026-F.webp",
      imgAlt: "Sofía R. — detalle del material flocado del sillón puff Sunfield",
    },
    {
      name: "Matías G.",
      rating: 5,
      title: "EN EL DORMITORIO QUEDA INCREÍBLE",
      text: "Lo pedí para el cuarto, en el rincón de la ventana. Armé un lugar de lectura que no tenía. Lo guardo cuando no lo uso y el cuarto recupera el espacio. No pierdo nada y cuando quiero relax lo tengo en dos minutos.",
      img: "https://http2.mlstatic.com/D_NQ_NP_2X_750821-MLA109764212274_042026-F.webp",
      imgAlt: "Matías G. — sillón puff Sunfield en rincón de dormitorio con luz natural",
    },
    {
      name: "Belén A.",
      rating: 4,
      title: "MUY CÓMODO, LLEGÓ BIEN EMPACADO",
      text: "El producto llegó bien embalado y el color es tal cual la foto. La comodidad es real — el posapié hace la diferencia para las piernas. Le pongo 4 porque tardó un día más de lo estimado, pero el producto en sí es excelente.",
      img: "https://m.media-amazon.com/images/I/81Dz3mv-pjL._SY500_.jpg",
      imgAlt: "Belén A. — unboxing del sillón puff Sunfield, empaque prolijo",
    },
    {
      name: "Rodrigo P.",
      rating: 5,
      title: "EL DÚO RELAX FUE LA MEJOR DECISIÓN",
      text: "Compré el dúo para el living y ahora tenemos un sillón por persona. El compresor eléctrico infla los dos en cinco minutos. Lo usamos de noche viendo series y los fines de semana con los chicos. Funcionó de diez.",
      img: "https://http2.mlstatic.com/D_NQ_NP_2X_839764-MLA106012443483_012026-F.webp",
      imgAlt: "Rodrigo P. — dos sillones puff Sunfield en living familiar",
    },
    {
      name: "Camila T.",
      rating: 5,
      title: "REEMPLAZÓ UN SILLÓN QUE NO CUPÍA",
      text: "Vivía en un departamento chico y el sillón de madera no cabía bien. Lo vendí y compré este. Cuando tengo visitas lo inflo, cuando estoy sola lo guardo. Recuperé espacio y gané comodidad. No lo cambiaría.",
      img: "https://http2.mlstatic.com/D_NQ_NP_2X_952816-MLA105117081172_012026-F.webp",
      imgAlt: "Camila T. — sillón puff Sunfield en departamento pequeño, espacio optimizado",
    },
  ],

  // Distribución de estrellas — Amazon-style
  ratingDistribution: [
    { stars: 5, pct: 78 },
    { stars: 4, pct: 15 },
    { stars: 3, pct: 5 },
    { stars: 2, pct: 2 },
    { stars: 1, pct: 0 },
  ],

  // ── FAQ ──────────────────────────────────────────────────────
  faqTitle: "PREGUNTAS FRECUENTES",
  faq: [
    {
      q: "¿Cuánto tarda en inflarse?",
      a: "Con el inflador de pie incluido en el Kit Completo, el sillón se infla completamente en 2 a 3 minutos. Con el compresor eléctrico del Dúo Relax, el tiempo baja a menos de 2 minutos por sillón. No requiere enchufes ni conexiones.",
    },
    {
      q: "¿Hasta qué peso aguanta?",
      a: "El sillón Sunfield soporta hasta 200 kg de peso. El material PVC de alta resistencia con recubrimiento flocado está diseñado para uso cotidiano intensivo tanto en adultos como en niños.",
    },
    {
      q: "¿Sirve para exterior?",
      a: "Puede usarse en exteriores protegidos como balcones cubiertos o patios bajo sombra, pero no está diseñado para exposición solar prolongada ni lluvia directa. Para uso exclusivo de interior, la durabilidad es máxima.",
    },
    {
      q: "¿Cómo se guarda?",
      a: "Una vez desinflado, el sillón se dobla compactamente y cabe en la bolsa de almacenamiento incluida. El espacio que ocupa es similar al de una manta gruesa doblada — ideal para departamentos y cuartos pequeños.",
    },
    {
      q: "¿Qué garantía tiene?",
      a: "30 días de garantía por cualquier defecto de fabricación. Si el sillón pierde aire anormalmente o el material presenta fallas, lo reemplazamos sin costo. El soporte es directo por WhatsApp con nuestro equipo.",
    },
    {
      q: "¿El compresor eléctrico también desinfla?",
      a: "Sí. El compresor eléctrico incluido en el Dúo Relax tiene función de inflado y desinflado. Podés deflarlo completamente en menos de 2 minutos sin esfuerzo.",
    },
  ],

  // ── Garantía ─────────────────────────────────────────────────
  guarantee: {
    title: "30 DÍAS PARA PROBARLO SIN RIESGO",
    sub: "Inflalo, usalo en el living, movelo al cuarto, probalo con toda la familia.\nSi en 30 días no es el rincón favorito de tu casa, te devolvemos el dinero entero. Sin preguntas, sin vuelta.",
    cta: "QUIERO MI SILLÓN →",
  },

  // ── WhatsApp ─────────────────────────────────────────────────
  whatsapp: {
    show: true,
    number: "5491112345678",
    message: "Hola! Tengo una consulta sobre el Sillón Puff Inflable Sunfield",
  },

  // ── Stats sociales ────────────────────────────────────────────
  soldCount: 742,
  reviewCount: 134,
  reviewScore: 4.8,

  // ── Quiénes somos ─────────────────────────────────────────────
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

  // ── Antes / Después slider ────────────────────────────────────
  // src vacío — agregar imágenes desde el admin o directamente aquí
  beforeAfter: {
    title: "¿QUÉ CAMBIA EN TU ESPACIO?",
    subtitle: "Arrastrá para comparar — con y sin el sillón",
    beforeImg: "https://pbs.twimg.com/media/HI--AJYXoAAC6Rm?format=jpg&name=medium",
    afterImg: "https://pbs.twimg.com/media/HI--B2IW4AAVNW8?format=jpg&name=medium",
    beforeLabel: "Sin el sillón",
    afterLabel: "Con el sillón",
  },

  // ── Estadísticas circulares ───────────────────────────────────
  statsTitle: "MÁS DE 700 FAMILIAS YA LO ELIGIERON",
  statsFooterNote: "*Basado en reseñas verificadas de compradores en Argentina.",
  statsCircles: [
    { target: 98, text: `Clientes que <strong>volvieron a comprarlo o lo recomendaron</strong> a alguien de su entorno.` },
    { target: 94, text: `Dicen que <strong>lo armaron en menos de 3 minutos</strong> la primera vez sin ayuda.` },
    { target: 91, text: `Lo usan <strong>como solución de relax fija</strong> en el living o el dormitorio.` },
    { target: 96, text: `Recomiendan el Sunfield <strong>a familia o amigos</strong> que buscan comodidad sin muebles pesados.` },
  ],

  // ── Cómo se usa ───────────────────────────────────────────────
  // Imágenes: src vacío → reemplazar desde el admin o directamente aquí
  howTo: {
    title: "¿CÓMO SE USA?",
    subtitle: "4 pasos · Sin herramientas · Listo en minutos",
    steps: [
      { num: "01", img: "", imgAlt: "Paso 1 — Sacar el sillón de la bolsa de almacenamiento compacta", text: "Sacá el sillón y el posapié de la bolsa de almacenamiento. No necesitás herramientas." },
      { num: "02", img: "", imgAlt: "Paso 2 — Conectar el inflador de pie a la válvula del sillón Sunfield", text: "Conectá el inflador de pie a la válvula. Entra fácil y queda firme." },
      { num: "03", img: "", imgAlt: "Paso 3 — Inflar el sillón puff con el inflador de pie incluido", text: "Inflá con el pie sin esfuerzo. En 2 a 3 minutos el sillón está completamente listo." },
      { num: "04", img: "", imgAlt: "Paso 4 — Disfrutar del sillón puff inflable Sunfield en el living", text: "¡Listo! Poné el sillón donde quieras y disfrutá tu nuevo espacio de relax." },
    ],
  },
};

export default sillonPuffInflableConfig;
