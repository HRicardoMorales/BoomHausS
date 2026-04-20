// src/landings/soporte-nasal-sn300.js
// ─────────────────────────────────────────────────────────────
// Config de marketing para el Soporte Nasal SN-300
// URL: /lp/soporte-nasal-sn300
// Producto en admin -> slug: soporte-nasal-sn300
// ─────────────────────────────────────────────────────────────

const soporteNasalSN300Config = {
  // ── Slug real del producto en el admin ───────────────────
  productSlug: "soporte-nasal-sn300",

  // ── SEO ───────────────────────────────────────────────────
  pageTitle: "Soporte Nasal SN-300 | Dormí mejor desde la primera noche | BoomHausS",
  checkoutName: "Soporte Nasal SN-300 Starter Kit",

  // ── Hero ─────────────────────────────────────────────────
  hideMiniReviews: true,
  heroSubtitle: "Respirá mejor. Roncás menos. Dormís de un tirón.",
  trustBullets: [
    "😴 Menos ronquidos desde la primera noche",
    "👃 Nariz más abierta sin remedios",
    "🩹 Kit completo: 15 tiras + 5 dilatadores internos",
    "🚚 Envío gratis a todo el país",
  ],

  // ── Textos personalizados del CTA / sticky ──────────────
  ctaLine1: "QUIERO DORMIR MEJOR",
  ctaLine2: "LO QUIERO 🚚",
  stockAlertText: "⚠️ Quedan pocas unidades al precio actual",
  stickyBtnText: "QUIERO DORMIR MEJOR 🚚",

  // ── Descripcion corta ────────────────────────────────────
  miniDescription:
    "Kit completo de soporte nasal con tecnología dual: tiras adhesivas externas de alta adhesión + dilatadores nasales internos de silicona médica. Amplían el conducto nasal hasta un 58%, reducen los ronquidos y mejoran la calidad del sueño desde la primera noche. Cómodos, sin sabor y sin medicación.",

  // ── Story blocks ─────────────────────────────────────────
  // media: videoUrl toma prioridad sobre gifUrl, que toma prioridad sobre img (fallback).
  // Cuando tengas el material real, reemplazá videoUrl/gifUrl y dejá img como poster/fallback.
  storyBlocks: [
    {
      title: "Cuando el cansancio no te deja descansar",

      // 🎬 VIDEO RECOMENDADO: Plano cercano de persona en cama dando vueltas.
      // Habitación oscura, expresión de agotamiento, boca abierta al respirar.
      // Alternativa GIF: nariz tapada con efecto visual de congestión. 5-7s loop.
      videoUrl: "https://www.pexels.com/download/video/7597954/",
      gifUrl:   null,
      img: null,

      text: "Te acostás cansado pero te levantás peor. Nariz tapada, boca seca, ronquidos que no te dejan dormir. No es mala suerte. Es falta de flujo de aire nasal.",

      textHtml: `Te acostás cansado pero <strong>te levantás peor</strong>.<br>Nariz tapada, boca seca y <strong>ronquidos que no te dejan dormir</strong>.<br>No es mala suerte.<br><strong>Es falta de flujo de aire nasal.</strong>`,
    },
    {
      title: "Dos capas que abren la nariz toda la noche",


      // 🎬 VIDEO RECOMENDADO: Manos aplicando tira nasal en el puente de la nariz,
      // luego insertando suavemente el dilatador de silicona. Plano detalle,
      // buena iluminación, movimientos lentos y claros. 6-8s loop.
      // Alternativa GIF: antes y después de abrir la fosa nasal (diagrama simple).
      videoUrl: "https://res.cloudinary.com/duyth9azk/video/upload/v1776406983/0417_khfdzx.mp4",
      gifUrl:   null,
      img: null,

      text: "La tira adhesiva abre el puente nasal desde afuera. El dilatador de silicona mantiene las fosas abiertas toda la noche. Juntos amplían el paso de aire hasta un 58% más.",

      textHtml: `La tira adhesiva <strong>abre el puente nasal desde afuera</strong>.<br>El dilatador de silicona <strong>mantiene las fosas abiertas toda la noche</strong>.<br>Juntos amplían el paso de aire <strong>hasta un 58% más</strong>.<br>Sin pastillas, sin remedios, sin efectos secundarios.`,
    },
    {
      title: "Despertarte descansado sí existe",


      // 🎬 VIDEO RECOMENDADO: Persona despertándose con luz de mañana,
      // estirándose y sonriendo. Expresión de descanso real, tranquila.
      // Opcional: pareja durmiendo en paz en la misma cama. 5-7s loop.
      // Alternativa GIF: sol entrando por ventana, persona bien descansada.
      videoUrl: "https://www.pexels.com/download/video/7592151/",
      gifUrl:   null,
      img: null,

      text: "Primer día: la nariz se siente más libre. Primera semana: dormís de un tirón y sin interrupciones. Primer mes: tu pareja te lo agradece.",

      textHtml: `<strong>Primer día:</strong> la nariz se siente más libre.<br><strong>Primera semana:</strong> dormís de un tirón, sin interrupciones.<br><strong>Primer mes:</strong> tu pareja te lo agradece.<br>Sin hábito, sin dependencia y sin efectos secundarios.`,
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
    title: "SN-300 VS OTRAS SOLUCIONES",
    cols: ["OTRAS OPCIONES", "SOPORTE NASAL SN-300"],
    rows: [
      { k: "Velocidad de efecto",  a: "Pastillas: 30-45 min para hacer efecto",          b: "Efecto inmediato — ponélo y respirá"              },
      { k: "Dependencia",          a: "Sprays nasales: crean dependencia en días",        b: "Sin medicación, sin hábito, sin rebote"           },
      { k: "Comodidad",            a: "Protectores bucales: incómodos, caen de noche",   b: "Ultra-liviano — no se siente al dormir"           },
      { k: "Ronquidos",            a: "Solo tratan síntomas momentáneamente",            b: "Ataca la causa: falta de flujo de aire nasal"     },
      { k: "Kit incluido",         a: "Un solo tipo de producto",                        b: "Tiras externas + dilatadores internos (dual)"     },
      { k: "Precio a largo plazo", a: "Sprays y pastillas: gasto mensual continuo",      b: "Pago único — los dilatadores son reutilizables"   },
    ],
  },

  // ── Cómo se usa ──────────────────────────────────────────
  howTo: {
    title: "CÓMO SE USA",
    image: {
      url: "https://images.pexels.com/photos/8942991/pexels-photo-8942991.jpeg?auto=compress&cs=tinysrgb&w=900",
      alt: "Cómo usar el soporte nasal SN-300",
    },
  },

  // ── Antes / Después (slider interactivo) ─────────────────
  authority: { show: false },
  beforeAfter: {
    title: "ANTES Y DESPUÉS",
    subtitle: "El cambio que notan los que ya lo usan",
    beforeImg: "https://pbs.twimg.com/media/HGFlVldXwAEpFxY?format=jpg&name=small",
    afterImg:  "https://pbs.twimg.com/media/HGFmF_qWwAAhi2J?format=jpg&name=small",
    beforeLabel: "Sin el SN-300",
    afterLabel:  "Con el SN-300",
  },

  // ── FAQ ──────────────────────────────────────────────────
  faqTitle: "PREGUNTAS FRECUENTES",
  faq: [
    { q: "¿Funciona si ronco mucho?",                    a: "El SN-300 está diseñado para ronquidos causados por obstrucción nasal parcial, que es la causa más frecuente. Si los ronquidos son muy intensos o hay apneas diagnosticadas, recomendamos combinarlo con consulta médica." },
    { q: "¿Las tiras adhesivas dañan la piel?",          a: "No. Las tiras están fabricadas con adhesivo médico hipoalergénico, el mismo tipo que se usa en vendajes post-quirúrgicos. No dejan marcas ni irritan. Si tenés piel muy sensible, probá primero en el dorso de la mano." },
    { q: "¿Los dilatadores internos son cómodos?",       a: "Sí. Son de silicona médica flexible, no generan presión y la mayoría de los usuarios deja de notarlos a los pocos minutos. Vienen en el kit y son reutilizables — lavables con agua tibia y jabón neutro." },
    { q: "¿Cuántas tiras trae el starter kit?",          a: "El kit incluye 15 tiras adhesivas externas de uso individual más el par de dilatadores internos de silicona reutilizables. Alcanza para comenzar el hábito y notar los resultados durante las primeras semanas." },
    { q: "¿Se puede usar si tengo desvío de tabique?",  a: "En desvíos leves a moderados, el SN-300 sí ayuda a ampliar el paso de aire disponible. En desvíos severos con obstrucción casi total, el efecto es parcial — en esos casos lo ideal es consultarlo con un otorrino." },
    { q: "¿Sirve también durante el día?",               a: "Sí. Muchos usuarios lo usan cuando hacen deporte, trabajan frente a la computadora por horas o viajan en avión. Cualquier situación donde respirar mejor por la nariz marca diferencia." },
    { q: "¿A partir de qué edad se puede usar?",         a: "Está recomendado para mayores de 12 años. Para uso en niños menores, consultar con el pediatra antes." },
    { q: "¿Cómo limpio los dilatadores?",                a: "Lavá con agua tibia y jabón neutro después de cada uso. Secá bien antes de guardar. No usar alcohol ni productos abrasivos. Con buen cuidado duran varios meses." },
  ],

  // ── Mini reseñas (carrusel compacto) ─────────────────────
  miniReviews: [
    { rating: 5, short: "Tres años con ronquidos. Mi pareja ya dormía en otra habitación. Dos semanas con el SN-300 y dormimos juntos de nuevo.", name: "Lucas P." },
    { rating: 5, short: "Soy corredor y usarlo en los entrenos fue un descubrimiento. Respiro más fácil y rindo más. No lo cambiaría por nada.", name: "Sofía D." },
    { rating: 5, short: "Tengo rinitis crónica. La nariz tapada de noche era mi pesadilla. Las tiras cambiaron todo sin ningún medicamento.", name: "Pablo G." },
    { rating: 5, short: "Lo compré con dudas. A la tercera noche mi señora me dijo que ya no la despertaba. No necesité más convencimiento.", name: "Ariel M." },
    { rating: 5, short: "Dormí 8 horas de corrido por primera vez en meses. Me levanto con energía y sin dolor de cabeza. Vale cada peso.", name: "Carla F." },
    { rating: 4, short: "Muy buena calidad. Las tiras se adhieren bien y no se caen en toda la noche. Los dilatadores son cómodos y fáciles de limpiar.", name: "Tomás R." },
  ],

  // ── Testimonios ──────────────────────────────────────────
  reviewsTitle: "TESTIMONIOS",
  reviewsSubtitle: "Lo que dicen quienes ya duermen mejor",
  reviewsCarousel: [
    { title: "MI PAREJA VOLVIÓ A DORMIR CONMIGO",       rating: 5, text: "Tres años con ronquidos que fueron empeorando. Mi pareja empezó a dormir en el cuarto de huéspedes. Dos semanas con el SN-300 y dormimos juntos de nuevo. No lo puedo creer todavía.",                                            name: "Lucas P.",    img: "https://judgeme.imgix.net/brth-argentina/1773836738__d_nq_np_2x_619122-mla107057544880_022026__original.webp?auto=format&w=160" },
    { title: "LO USO PARA ENTRENAR Y PARA DORMIR",      rating: 5, text: "Soy maratonista y lo empecé a usar en los entrenamientos para mejorar la respiración nasal. Los resultados me sorprendieron tanto que empecé a usarlo también de noche. Duerme mejor y entrena mejor.",                              name: "Sofía D.",    img: "https://images.pexels.com/photos/3786091/pexels-photo-3786091.jpeg?auto=compress&cs=tinysrgb&w=400" },
    { title: "FIN A TRES AÑOS DE RINITIS NOCTURNA",     rating: 5, text: "Tengo rinitis alérgica y de noche la nariz se me tapaba por completo. Usaba sprays pero me generaron dependencia. Con el SN-300 duermo con la nariz libre, sin remedios y sin rebote al día siguiente.",                             name: "Pablo G.",    img: "https://images.pexels.com/photos/8942991/pexels-photo-8942991.jpeg?auto=compress&cs=tinysrgb&w=400" },
    { title: "MI SEÑORA SE LO REGALÓ A SU HERMANO",     rating: 5, text: "Lo compré con muchas dudas. A la tercera noche mi señora me dijo que ya no la despertaba con los ronquidos. Ella sola se encargó de comprar otro para regalárselo a su hermano. Eso dice todo.",                                     name: "Ariel M.",    img: "https://images.pexels.com/photos/5327585/pexels-photo-5327585.jpeg?auto=compress&cs=tinysrgb&w=400" },
    { title: "8 HORAS DE CORRIDO — PRIMERA VEZ EN MESES", rating: 5, text: "Dormí 8 horas seguidas por primera vez en meses. Me despertaba constantemente por la congestión y me levantaba con dolor de cabeza. Desde el SN-300 me levanto con energía real.",                                              name: "Carla F.",    img: "https://images.pexels.com/photos/3807640/pexels-photo-3807640.jpeg?auto=compress&cs=tinysrgb&w=400" },
    { title: "CALIDAD QUE NO ESPERABA POR EL PRECIO",   rating: 4, text: "Las tiras tienen muy buena adhesión, no se caen en toda la noche ni con movimiento. Los dilatadores de silicona son blandos, cómodos y fáciles de lavar. Todo el kit tiene mejor calidad de lo que esperaba.",                      name: "Tomás R.",    img: "https://images.pexels.com/photos/3807530/pexels-photo-3807530.jpeg?auto=compress&cs=tinysrgb&w=400" },
    { title: "MI MARIDO DEJÓ DE RONCAR",                rating: 5, text: "Se lo compré a mi marido porque yo ya no podía dormir. Llevamos un mes usándolo y los ronquidos bajaron un 90%. El otro 10% ya no me molesta porque me acostumbré a dormir tranquila.",                                             name: "Romina T.",   img: "https://images.pexels.com/photos/3807534/pexels-photo-3807534.jpeg?auto=compress&cs=tinysrgb&w=400" },
    { title: "PERFECTO PARA VIAJAR EN AVIÓN",           rating: 5, text: "Tengo la nariz muy sensible a la presurización del avión. Siempre llegaba con dolor de cabeza por la nariz tapada. Desde que uso el SN-300 en los vuelos llego fresco y sin molestias. Un descubrimiento.",                        name: "Germán V.",   img: "https://images.pexels.com/photos/3807524/pexels-photo-3807524.jpeg?auto=compress&cs=tinysrgb&w=400" },
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
  soldCount: 1243,
  reviewCount: 189,
  reviewScore: 4.9,

  // ── Estadísticas circulares ───────────────────────────────
  statsTitle: "Resultados que se sienten de inmediato",
  statsFooterNote: "*Basado en compras verificadas de BoomHausS",
  statsCircles: [
    { target: 95, text: `Notaron <strong>mejoría en la respiración nasal</strong> desde la primera noche.` },
    { target: 92, text: `Reportaron <strong>reducción de ronquidos</strong> en la primera semana de uso.` },
    { target: 90, text: `Recomiendan el SN-300 <strong>a su pareja o a un familiar</strong>.` },
    { target: 90, text: `Siguen usándolo al mes <strong>sin necesitar ningún recordatorio</strong>.` },
  ],

  // ── Garantía 30 días ─────────────────────────────────────
  guarantee: {
    title: "30 NOCHES PARA PROBARLO SIN RIESGO",
    sub: "Dormí con el SN-300 durante 30 noches. Si no notás la diferencia en cómo respirás y descansás, te devolvemos todo el dinero. Sin preguntas, sin trámites.",
    cta: "QUIERO DORMIR MEJOR →",
  },

  // ── Precio tachado fallback ───────────────────────────────
  compareAtPriceFallback: 0,

  // ── Opciones de compra por cantidad (bundle picker) ─────
  bundles: [
    {
      label: "1 unidad",
      qty: 1,
      price: 34800,
      compareAt: 54800,
      badge: "30% OFF",
      popular: false,
      benefit: "🚚 Envío Gratis incluido",
    },
    {
      label: "Llevá 2 + 1 gratis",
      qty: 3,
      price: 44800,
      compareAt: 109600,
      badge: "MÁS VENDIDO",
      popular: true,
      benefit: "📦 Llevás 3 unidades en total",
    },
    {
      label: "Llevá 3 + 2 gratis",
      qty: 5,
      price: 54800,
      compareAt: 174000,
      badge: "MEJOR VALOR",
      popular: false,
      benefit: "📦 Llevás 5 unidades en total",
    },
  ],

  // ── Acordeones en el bloque de compra (estilo Calmora) ──────
  heroAccordions: [
    {
      icon: "⭐",
      title: "Regalos solo por la oferta vigente",
      html: `<strong>⭐ Por tiempo limitado. Tu compra incluye:</strong><br>• 🚚 Envío gratis a todo el país`,
    },
    {
      icon: "🛡️",
      title: "Probalo por 30 Días Sin Riesgo",
      html: `¡Comprá con confianza! Probalo durante <strong>30 días sin riesgo</strong> y sin compromiso.`,
    },
  ],

  // ── Videos verticales estilo story (antes de story blocks) ──
  proofVideosTitle: "Únete a miles de personas que ya duermen mejor",
  proofVideosSubtitle: "Resultados reales desde la primera noche",
  proofVideos: [
    {
      // VIDEO: Persona en cama dando vueltas, nariz tapada, boca abierta.
      // Habitación oscura. Primer plano cara con expresión de agotamiento.
      // Formato: vertical 9:16, 5-8s, sin sonido, loop.
      videoUrl: "https://res.cloudinary.com/duyth9azk/video/upload/v1776405149/S%C3%83SO_Bolucompras_Regalos_home_sasopy__Reel_de_Instagram_nfeiu5.mp4", // ← REEMPLAZAR: ej. "/videos/sn300-insomnio.mp4"
      label: "SATISFECHA",
    },
    {
      // VIDEO: Manos aplicando tira nasal + insertando dilatador de silicona.
      // Plano detalle, buena iluminación, movimientos lentos y claros.
      // Formato: vertical 9:16, 6-10s, sin sonido, loop.
      videoUrl: "https://res.cloudinary.com/duyth9azk/video/upload/v1776405156/Dilatador_Nasal_Anti_Ronquido_Tiras_Magnetico_-_60_Uds_fteire.mp4", // ← REEMPLAZAR: ej. "/videos/sn300-aplicacion.mp4"
      label: "SATISFECHA",
    },
    {
      // VIDEO: Persona despertándose natural, estirándose, sonriendo.
      // Luz de mañana. Expresión de descanso real. O pareja durmiendo juntos.
      // Formato: vertical 9:16, 5-8s, sin sonido, loop.
      videoUrl: "https://res.cloudinary.com/duyth9azk/video/upload/v1776470607/saesi_en_TikTok_alad72.mp4", // ← REEMPLAZAR: ej. "/videos/sn300-resultado.mp4"
      label: "SATISFECHO",
    },
  ],

  // ── Garantia visible (debajo del CTA) ────────────────────


  // ── WhatsApp flotante ────────────────────────────────────
  whatsapp: {
    show: true,
    number: "5491112345678",  // CAMBIAR por el número real
    message: "Hola! Tengo una consulta sobre el Soporte Nasal SN-300",
  },

  // ── Stock limitado (urgencia) ────────────────────────────
  stockAlert: {
    show: true,
    remaining: 9,
  },

  // ── Comentarios estilo Facebook ──────────────────────────
  facebookComments: {
    title: "Comentarios recientes",
    pages: [
      // Página 1
      [
        {
          type: "thread",
          comments: [
            {
              name: "María González",
              avatar: "https://randomuser.me/api/portraits/women/32.jpg",
              text: "Acabo de ver el anuncio, ¿alguien lo usa de verdad? Llevo años con la nariz tapada al dormir y mi pareja ya no aguanta los ronquidos...",
              meta: "42m", likes: 16,
            },
            {
              name: "Claudia Reyes",
              avatar: "https://randomuser.me/api/portraits/women/65.jpg",
              text: "¡María, sí! Mi novio roncaba tanto que yo no dormía nada. Empezó con el SN-300 hace 6 semanas y el cambio es increíble. Desde la primera noche ya notamos diferencia. De verdad probalo.",
              meta: "24m", likes: 31, reply: true,
            },
          ],
        },
        {
          name: "Roberto Díaz",
          avatar: "https://randomuser.me/api/portraits/men/42.jpg",
          text: "Pagué precio completo y no me arrepiento para nada. Lo que ahorro en sprays nasales y pastillas para dormir ya superó el costo en el primer mes.",
          meta: "1h", likes: 23,
        },
        {
          name: "Paola Méndez",
          avatar: "https://randomuser.me/api/portraits/women/28.jpg",
          text: "¿Cuánto tardaron en notar resultados? Mi médico me quiere recetar un spray con corticoides y quiero evitarlo si puedo.",
          meta: "1h", likes: 11,
        },
        {
          name: "Fernando Torres",
          avatar: "https://randomuser.me/api/portraits/men/75.jpg",
          text: "Yo noté diferencia desde la primera semana. Para la tercera semana ya no roncaba nada. Y lo mejor es que no te das cuenta de que lo llevás puesto.",
          meta: "38m", likes: 19,
        },
        {
          name: "Lucía Fernández",
          avatar: "https://randomuser.me/api/portraits/women/54.jpg",
          text: "Mi marido roncaba tan fuerte que yo me despertaba 4 o 5 veces por noche. Desde que usa el SN-300 duermo de corrido toda la noche.",
          meta: "2h", likes: 27,
        },
        {
          type: "thread",
          comments: [
            {
              name: "Diego Sosa",
              avatar: "https://randomuser.me/api/portraits/men/36.jpg",
              text: "Probé bandas nasales, sprays, humidificador, de todo. El SN-300 es el único que funcionó. La combinación de tira externa + dilatador interno es lo que marca la diferencia.",
              meta: "3h", likes: 22,
            },
            {
              name: "Valentina Cruz",
              avatar: "https://randomuser.me/api/portraits/women/18.jpg",
              text: "Exactamente. Solo la tira adhesiva no me alcanzaba. Con el dilatador interno también la cosa cambia por completo. Son los dos juntos.",
              meta: "4h", likes: 14, reply: true,
            },
          ],
        },
        {
          name: "Sebastián Morales",
          avatar: "https://randomuser.me/api/portraits/men/25.jpg",
          text: "Mis ronquidos desaparecieron en los primeros días. Mi pareja dice que ahora respiro tan tranquilo que ni se da cuenta de que estoy durmiendo.",
          meta: "5h", likes: 35,
        },
      ],
      // Página 2
      [
        {
          name: "Camila Herrera",
          avatar: "https://randomuser.me/api/portraits/women/10.jpg",
          text: "Vengo a confirmar que funciona. Tenía la nariz casi siempre tapada y me levantaba cansada. Desde la primera noche ya noté diferencia. No lo esperaba tan rápido.",
          meta: "6h", likes: 18,
        },
        {
          name: "Martín López",
          avatar: "https://randomuser.me/api/portraits/men/11.jpg",
          text: "Pensé que sería otro producto que no funciona. Me equivoqué completamente. La calidad del sueño mejoró muchísimo y mi pareja por fin también descansa.",
          meta: "7h", likes: 21,
        },
        {
          name: "Andrea Ruiz",
          avatar: "https://randomuser.me/api/portraits/women/59.jpg",
          text: "Mi médico se sorprendió con los resultados. Nariz abierta toda la noche, sin medicación y sin efectos secundarios. Imposible pedirle más a un producto así.",
          meta: "9h", likes: 26,
        },
        {
          name: "Pablo Gómez",
          avatar: "https://randomuser.me/api/portraits/men/13.jpg",
          text: "En nuestro caso tardó dos semanas en notarse el cambio completo, pero desde la primera noche ya algo mejoró. Ahora ya no ronco y mi pareja está feliz.",
          meta: "11h", likes: 15,
        },
        {
          name: "Natalia Vega",
          avatar: "https://randomuser.me/api/portraits/women/44.jpg",
          text: "Lo mejor es que dejé de necesitar el spray nasal que usaba todas las noches desde hace años. Ya no dependo de nada para respirar bien al dormir.",
          meta: "13h", likes: 29,
        },
        {
          name: "Gonzalo Pereira",
          avatar: "https://randomuser.me/api/portraits/men/60.jpg",
          text: "La inversión se paga sola. Entre sprays, pastillas y consultas gastaba una fortuna cada mes. El SN-300 es un pago único y funciona mejor que todo lo anterior junto.",
          meta: "15h", likes: 33,
        },
      ],
    ],
  },
};

export default soporteNasalSN300Config;
