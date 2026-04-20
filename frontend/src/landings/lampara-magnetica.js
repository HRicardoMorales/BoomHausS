// src/landings/lampara-magnetica.js
// ─────────────────────────────────────────────────────────────
// Config de marketing para la Lámpara Magnética 3 en 1
// URL: /lp/lampara-magnetica
// Producto en admin -> slug (default): lampara-magnetica-negro-kit
// Cada variante tiene su propio productSlug — el fetch se hace por la variante activa.
// ─────────────────────────────────────────────────────────────

const lamparaMagneticaConfig = {
  // ── Slug real del producto en el admin (fallback si no hay variante) ───
  productSlug: "lampara-magnetica-negro-kit",

  // ── SEO ───────────────────────────────────────────────────
  pageTitle: "Lámpara Magnética 3 en 1 | Luz inalámbrica para tu escritorio | BoomHausS",
  checkoutName: "Lámpara Magnética 3 en 1",

  // ── Hero ─────────────────────────────────────────────────
  hideMiniReviews: true,
  heroSubtitle: "Luz perfecta. Cero cables. Click y listo.",

  // Bullets de beneficios compartidos por ambas variantes (se combinan con los kitBullets de cada variante)
  sharedBenefits: [
    "🔄 Rotación 360° — enfocá la luz donde la necesites",
    "🔋 Batería recargable 1200mAh USB-C — hasta 10h de autonomía",
    "🎨 Tecnología CCT — blanco cálido, neutro y frío en un toque",
    "🚫 100% inalámbrica — sin cables, sin enchufes, sin vueltas",
  ],

  // Fallback del config: se usa cuando el producto no se encuentra en el admin
  trustBullets: [
    "🧲 Sistema magnético — se acopla y desmonta con un click",
    "🔄 Rotación 360° y tecnología CCT",
    "🔋 USB-C 1200mAh — hasta 10h de luz",
    "🚚 Envío gratis a todo el país",
  ],

  // ── Textos del CTA / sticky ──────────────
  ctaLine1: "LA QUIERO EN MI ESCRITORIO",
  ctaLine2: "ENVÍO GRATIS 🚚",
  stockAlertText: "⚠️ Quedan pocas unidades al precio actual",
  stickyBtnText: "LA QUIERO 🚚",

  // ── Descripción corta (fallback — la variante activa la sobreescribe) ──
  miniDescription:
    "Lámpara LED magnética inalámbrica con sistema de acople instantáneo. Se desmonta con un click para usarla como linterna en la mano. Rotación 360°, batería recargable USB-C 1200mAh y tecnología CCT para ajustar la temperatura de color. Un solo producto reemplaza la lámpara de escritorio, la linterna y la luz de lectura.",

  // ────────────────────────────────────────────────────────────────
  // VARIANTES DEL PRODUCTO
  // ────────────────────────────────────────────────────────────────
  variants: [
    {
      id: "kit-completo",
      productSlug: "lampara-magnetica-negro-kit",
      name: "Kit Completo",
      shortDesc: "Cabezal + base + pinza + soporte pared + brazo flexible",
      badge: "KIT PRO",
      startingAtLabel: "Desde",
      // Imagen que se muestra en la card del selector de variantes (distinta a la galería principal)
      thumbImg: "https://http2.mlstatic.com/D_Q_NP_2X_995016-MLA91899758620_092025-F.webp",
      // Fallback images (si el admin no tiene el producto cargado)
      images: [
        "https://pbs.twimg.com/media/HGTuioNXYAAK30b?format=jpg&name=small",
        "https://pbs.twimg.com/media/HGUaZ9nWkAAdyCB?format=png&name=small",
        "https://pbs.twimg.com/media/HGUacDVaQAAExSw?format=png&name=small",
      ],
      miniDescription:
        "Kit completo en negro mate con cinco piezas: cabezal LED magnético que se desmonta con un click, base de pie estable, pinza para escritorio o borde de mesa, soporte adhesivo de pared y brazo flexible articulado. Es la variante más versátil — la adaptás a cualquier rincón del home office, la usás como linterna portátil o la montás en la pared del cuarto.",
      // Bullets específicos de qué incluye el kit
      kitBullets: [
        "🧲 Cabezal LED magnético — se desmonta con un click",
        "🦾 Base de pie estable — para escritorio o mesada",
        "🗜️ Pinza para escritorio o borde de mesa",
        "🧱 Soporte adhesivo de pared — sin taladro ni tornillos",
        "🐍 Brazo flexible articulado — enfoque preciso",
      ],
      // Tres opciones de compra
      bundles: [
        {
          label: "1 unidad",
          qty: 1,
          price: 74900,
          compareAt: 104900,
          badge: "29% OFF",
          popular: false,
          benefit: "🚚 Envío Gratis incluido",
        },
        {
          label: "Llevá 2 — ahorrás más",
          qty: 2,
          price: 139900,
          compareAt: 195900,
          badge: "MÁS ELEGIDO",
          popular: true,
          benefit: "📦 Una para el escritorio y otra para el cuarto",
        },
        {
          label: "Llevá 3 — pack familia / oficina",
          qty: 3,
          price: 194900,
          compareAt: 272900,
          badge: "MEJOR VALOR",
          popular: false,
          benefit: "📦 Ideal para equipar varios espacios",
        },
      ],
    },
    {
      id: "solo-lampara",
      productSlug: "lampara-magnetica-madera",
      name: "Solo Lámpara",
      shortDesc: "Cabezal LED magnético + adhesivo de pared",
      badge: "BÁSICA",
      startingAtLabel: "Desde",
      // Imagen por defecto de la card del selector (se sobreescribe con el color activo)
      thumbImg: "https://pbs.twimg.com/media/HGTxO_XXQAA-Pjx?format=jpg&name=small",
      images: [
        "https://pbs.twimg.com/media/HGTxGgzWIAEpI6b?format=jpg&name=small",
        "https://cdn.v2.tiendanegocio.com/gallery/31544/img_31544_dpku19hmkmj81xrd9.jpeg?class=xl",
        "https://http2.mlstatic.com/D_NQ_NP_2X_875148-MLA92302425103_092025-F.webp",
      ],
      miniDescription:
        "Variante básica: solo el cabezal LED magnético y un adhesivo para pared. Lo montás donde quieras sin clavos, sin taladros. Disponible en color madera (estética cálida) o negro mate. Pensada para el setup limpio — la luz que necesitás, sin accesorios de más.",
      kitBullets: [
        "🧲 Cabezal LED magnético — se desmonta con un click",
        "🧱 Adhesivo de pared incluido — sin clavos ni taladros",
        "🎨 Disponible en Madera o Negro Mate",
      ],
      bundles: [
        {
          label: "1 unidad",
          qty: 1,
          price: 59900,
          compareAt: 83900,
          badge: "29% OFF",
          popular: false,
          benefit: "🚚 Envío Gratis incluido",
        },
        {
          label: "Llevá 2 — ahorrás más",
          qty: 2,
          price: 109900,
          compareAt: 153900,
          badge: "MÁS ELEGIDO",
          popular: true,
          benefit: "📦 Una para el escritorio y otra para la mesa de luz",
        },
        {
          label: "Llevá 3 — pack completo",
          qty: 3,
          price: 154900,
          compareAt: 216900,
          badge: "MEJOR VALOR",
          popular: false,
          benefit: "📦 Setup minimalista para toda la casa",
        },
      ],
      // Segundo nivel: selector de color. Solo cambia la imagen, los precios son los mismos.
      colorVariants: [
        {
          id: "madera",
          name: "Madera",
          thumbImg: "https://pbs.twimg.com/media/HGTxO_XXQAA-Pjx?format=jpg&name=small",
          images: [
            "https://pbs.twimg.com/media/HGTxGgzWIAEpI6b?format=jpg&name=small",
            "https://cdn.v2.tiendanegocio.com/gallery/31544/img_31544_dpku19hmkmj81xrd9.jpeg?class=xl",
        "https://http2.mlstatic.com/D_NQ_NP_2X_875148-MLA92302425103_092025-F.webp",
          ],
        },
        {
          id: "negro",
          name: "Negro",
          thumbImg: "https://http2.mlstatic.com/D_Q_NP_2X_995016-MLA91899758620_092025-F.webp",
          images: [
            "https://pbs.twimg.com/media/HGTuioNXYAAK30b?format=jpg&name=small",
            "https://acdn-us.mitiendanube.com/stores/005/324/474/products/178935713068e12604a067c1-78026557-c419c227466dbfd98317766358229151-640-0.webp",
            "https://acdn-us.mitiendanube.com/stores/005/324/474/products/204878835368e12605385b59-97646045-91b73686bb5f9ea28717766358468222-640-0.webp",
          ],
        },
      ],
    },
  ],

  // ── Bundles fallback (se ignora cuando hay variantes) ──
  bundles: [
    {
      label: "1 unidad",
      qty: 1,
      price: 74900,
      compareAt: 104900,
      badge: "29% OFF",
      popular: false,
      benefit: "🚚 Envío Gratis incluido",
    },
    {
      label: "Llevá 2 — ahorrás más",
      qty: 2,
      price: 139900,
      compareAt: 195900,
      badge: "MÁS ELEGIDO",
      popular: true,
      benefit: "📦 Una para el escritorio y otra para el cuarto",
    },
    {
      label: "Llevá 3 — pack familia / oficina",
      qty: 3,
      price: 194900,
      compareAt: 272900,
      badge: "MEJOR VALOR",
      popular: false,
      benefit: "📦 Ideal para equipar varios espacios",
    },
  ],

  // ── Sección de tres fotos de uso (mismo componente que soporte-nasal) ──────
  proofVideosKicker: "✦ UN PRODUCTO, TRES AMBIENTES",
  proofVideosTitle: "La luz que se adapta a tu espacio",
  proofVideosSubtitle: "En la pared, en el escritorio o en la mesita — siempre en su lugar",
  proofVideos: [
    {
      // FOTO: Lámpara montada en pared — cabezal sobre adhesivo, encendida, fondo claro/minimalista.
      // Plano vertical que muestre el cabezal en contexto de pared real.
      imgUrl: "https://pbs.twimg.com/media/HGT9aC7XUAANG3l?format=jpg&name=medium",
      label: "EN LA PARED",
    },
    {
      // FOTO: Lámpara en escritorio — base de pie sobre mesa, setup de trabajo limpio,
      // cable USB-C desconectado visible para reforzar el aspecto inalámbrico.
      imgUrl: "https://pbs.twimg.com/media/HGT-KtcWsAAtont?format=jpg&name=small",
      label: "EN EL ESCRITORIO",
    },
    {
      // FOTO: Lámpara en mesita de noche — luz cálida encendida, ambiente de lectura/descanso,
      // libro o celular en primer plano para contextualizar el uso nocturno.
      imgUrl: "https://pbs.twimg.com/media/HGUATdcWgAAbTjR?format=jpg&name=small",
      label: "EN LA MESITA DE NOCHE",
    },
  ],

  // ── Story blocks ─────────────────────────────────────────
  storyBlocks: [
    {
      title: "El escritorio que querés no tiene ese cable colgando",
      img: "https://pbs.twimg.com/media/HGUBTnWW0AA31SR?format=jpg&name=medium",
      text: "Lámpara con cable que siempre está de más. Enchufe lejos de donde trabajás. Luz general que te hace entrecerrar los ojos. No es culpa tuya — es el diseño viejo del escritorio.",
      textHtml: `Lámpara con cable <strong>que siempre está de más</strong>.<br>Enchufe lejos de donde trabajás.<br><strong>Luz general que te hace entrecerrar los ojos</strong>.<br>No es culpa tuya.<br><strong>Es el diseño viejo del escritorio.</strong>`,
    },
    {
      title: "Una base, un click, luz donde la necesites",
      img: "https://pbs.twimg.com/media/HGUN2seXIAAIHJn?format=jpg&name=medium",
      text: "El cabezal se acopla magnéticamente a la base. Click y queda firme. Otro click y te la llevás en la mano como linterna para buscar algo en el placard, para leer en la cama, para moverte de cuarto sin prender la luz general.",
      textHtml: `El cabezal <strong>se acopla magnéticamente a la base</strong>.<br>Click y queda firme.<br><strong>Otro click y te la llevás en la mano como linterna</strong>.<br>Para buscar algo en el placard, para leer en la cama,<br>para moverte de cuarto sin prender la luz general.`,
    },
    {
      title: "Luz que se adapta a lo que hagas",
      img: "https://pbs.twimg.com/media/HGUPnzDWUAAx1mv?format=jpg&name=medium",
      text: "Un toque te cambia entre blanco cálido para leer de noche, neutro para trabajar y frío para las tareas que necesitan precisión. Sin apps, sin configuraciones, sin buscar el control. La tecnología CCT hace todo en un botón.",
      textHtml: `Un toque te cambia entre <strong>blanco cálido para leer de noche</strong>,<br>neutro para trabajar y <strong>frío para las tareas que necesitan precisión</strong>.<br>Sin apps, sin configuraciones, sin buscar el control.<br><strong>La tecnología CCT hace todo en un botón.</strong>`,
    },
    {
      title: "La cargás una vez, dura toda la semana",
      img: "https://pbs.twimg.com/media/HGURPvYWIAAskK4?format=jpg&name=medium",
      text: "Batería de 1200mAh que carga con el mismo cable USB-C del celular. Una carga completa rinde varios días de uso real. Se queda sin energía mientras dormís y a la mañana la tenés lista, sin que te lo tengas que acordar.",
      textHtml: `Batería de <strong>1200mAh que carga con el mismo cable USB-C del celular</strong>.<br>Una carga completa <strong>rinde varios días de uso real</strong>.<br>Se queda sin energía mientras dormís y a la mañana la tenés lista,<br>sin que te lo tengas que acordar.`,
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
    title: "LÁMPARA 3 EN 1 VS OTRAS OPCIONES",
    cols: ["LÁMPARA CLÁSICA", "LÁMPARA MAGNÉTICA 3 EN 1"],
    rows: [
      { k: "Cables",              a: "Cable permanente que ocupa lugar",         b: "100% inalámbrica — cero cables a la vista"  },
      { k: "Portabilidad",        a: "Fija a un enchufe — no la movés",          b: "La sacás de la base y la usás en la mano"   },
      { k: "Temperatura de luz",  a: "Una sola tonalidad fija",                  b: "CCT: cálido, neutro y frío en un toque"     },
      { k: "Montaje",             a: "Base rígida — sin alternativas",           b: "Base, pinza, pared o brazo flexible"        },
      { k: "Carga",               a: "Enchufe permanente todo el día",           b: "USB-C — hasta 10h por carga"                },
      { k: "Estética",            a: "Accesorios colgando y cables a la vista", b: "Setup limpio, minimalista, profesional"     },
    ],
  },

  // ── Cómo se usa ──────────────────────────────────────────
  howTo: {
    title: "CÓMO SE USA",
    image: {
      url: "https://images.pexels.com/photos/4050291/pexels-photo-4050291.jpeg?auto=compress&cs=tinysrgb&w=900",
      alt: "Cómo usar la lámpara magnética 3 en 1",
    },
  },

  authority: { show: false },

  // ── FAQ ──────────────────────────────────────────────────
  faqTitle: "PREGUNTAS FRECUENTES",
  faq: [
    { q: "¿Cuánto dura la batería por carga?",              a: "La batería de 1200mAh rinde entre 6 y 10 horas de uso continuo según el modo de intensidad que elijas. En uso real de escritorio (encender/apagar durante el día) una carga completa te puede durar varios días." },
    { q: "¿Se carga con cualquier cable USB-C?",             a: "Sí. El puerto es USB-C estándar, así que podés usar el mismo cargador de tu celular Android o el de tu notebook. En la caja viene el cable incluido, pero no es exclusivo." },
    { q: "¿Qué diferencia hay entre las dos variantes?",     a: "La Negro Kit Completo incluye cinco piezas (cabezal, base, pinza, soporte de pared y brazo flexible) para que la uses en cualquier configuración. La Madera Básica trae solo el cabezal y un adhesivo de pared, pensada para un setup minimalista y discreto." },
    { q: "¿Se puede montar en la pared sin taladrar?",        a: "Sí. Las dos variantes incluyen un soporte adhesivo 3M de alta adhesión que se pega a la pared sin tornillos ni taladro. Aguanta el peso de la lámpara y no deja marca al retirarla." },
    { q: "¿El cabezal es el mismo en las dos variantes?",    a: "Sí, el cabezal LED con rotación 360° y tecnología CCT es el mismo en ambas. La diferencia está en los accesorios de montaje que trae cada kit y en la terminación estética (negro mate o color madera)." },
    { q: "¿Sirve para leer en la cama sin molestar a otro?",  a: "Sí. Al ser inalámbrica y con luz dirigida, podés apuntarla solo al libro o al celular. El modo cálido es especialmente suave para leer de noche sin molestar a quien duerme al lado." },
    { q: "¿Se puede usar como linterna en la mano?",          a: "Sí. Ese es uno de los principales usos. El cabezal se desmonta de la base con un click y lo agarrás como linterna para buscar algo en el placard, revisar atrás de un mueble o moverte por la casa sin prender la luz general." },
    { q: "¿Trae garantía?",                                   a: "Sí, 30 días de garantía por cualquier defecto de fábrica. Ante cualquier problema te lo cambiamos sin vueltas. El soporte es por WhatsApp directo con nuestro equipo." },
  ],

  // ── Mini reseñas ─────────────────────
  miniReviews: [
    { rating: 5, short: "La compré para el home office y no vuelvo atrás. Escritorio sin cables, luz exacta donde la necesito y la uso también para leer de noche.", name: "Federico B." },
    { rating: 5, short: "Pedí la madera para el cuarto y queda hermosa. El acople magnético es mucho mejor de lo que esperaba — firme y rápido.", name: "Victoria L." },
    { rating: 5, short: "El kit completo vale cada peso. La pinza la uso en el escritorio y el brazo flexible me sirve para dibujar. Muy versátil.", name: "Matías R." },
    { rating: 5, short: "Carga una vez por semana y listo. La luz cálida es perfecta para no forzar la vista después de las 9 de la noche.", name: "Camila N." },
    { rating: 5, short: "La desenchufás de la base y te la llevás como linterna. Le busqué el pelo al huevo y no le encontré nada malo.", name: "Joaquín T." },
    { rating: 4, short: "Muy buen producto. La batería dura lo que dicen y se ve premium en persona. Le pongo 4 porque tardó un par de días más de lo prometido.", name: "Agustina S." },
  ],

  // ── Testimonios ──────────────────────────────────────────
  reviewsTitle: "TESTIMONIOS",
  reviewsSubtitle: "Lo que dicen los que ya tienen su escritorio sin cables",
  reviewsCarousel: [
    { title: "MI ESCRITORIO POR FIN QUEDÓ LIMPIO",      rating: 5, text: "Tenía tres cables compitiendo por el mismo enchufe: monitor, notebook y lámpara. La magnética me sacó uno del medio y el cambio visual fue mucho más grande de lo que pensaba. Ahora trabajo con la mente más despejada.",                                             name: "Federico B.",     img: "https://images.pexels.com/photos/4050290/pexels-photo-4050290.jpeg?auto=compress&cs=tinysrgb&w=400" },
    { title: "LA LUZ EXACTA PARA LEER DE NOCHE",        rating: 5, text: "Soy lector pesado. Dos horas mínimo antes de dormir. El modo cálido es una diferencia enorme comparado con la lámpara blanca que tenía. Ya no me duelen los ojos y mi pareja sigue durmiendo tranquila al lado.",                                                name: "Victoria L.",     img: "https://images.pexels.com/photos/1123262/pexels-photo-1123262.jpeg?auto=compress&cs=tinysrgb&w=400" },
    { title: "EL BRAZO FLEXIBLE ES UN GOLAZO",          rating: 5, text: "Soy diseñador industrial y el brazo flexible del kit completo cambió mi día a día. Puedo apuntar la luz al ángulo exacto donde estoy trabajando, sin cables tirando, sin ajustes raros. Un accesorio que no sabía que necesitaba.",                              name: "Matías R.",       img: "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=400" },
    { title: "USB-C COMO EL CELULAR — MUY PRÁCTICO",    rating: 5, text: "Lo mejor es no tener que acordarse de un cargador especial. Cargo la lámpara con el mismo cable del celular. Una carga me dura toda la semana con uso real de escritorio. Práctica total.",                                                                        name: "Camila N.",       img: "https://images.pexels.com/photos/3760613/pexels-photo-3760613.jpeg?auto=compress&cs=tinysrgb&w=400" },
    { title: "LA USO DE LINTERNA EN TODA LA CASA",      rating: 5, text: "La desacoplo de la base y me la llevo para buscar cosas atrás del sillón, al placard del pasillo, a revisar el medidor. Reemplazó la linterna del celular porque tiene mucho mejor ángulo y no me cansa el brazo.",                                               name: "Joaquín T.",      img: "https://images.pexels.com/photos/4050291/pexels-photo-4050291.jpeg?auto=compress&cs=tinysrgb&w=400" },
    { title: "LLEGÓ COMO EN LA FOTO",                   rating: 4, text: "Empaque prolijo, se ve premium en mano. La terminación madera es tal cual la foto, muy linda en el cuarto. Le pongo 4 porque la entrega tardó dos días más de lo prometido, pero el producto en sí es excelente.",                                                name: "Agustina S.",     img: "https://images.pexels.com/photos/1112598/pexels-photo-1112598.jpeg?auto=compress&cs=tinysrgb&w=400" },
    { title: "SETUP MINIMALISTA POR FIN",               rating: 5, text: "Soy medio obsesivo con el escritorio ordenado. La variante madera con el adhesivo de pared me dejó el setup que siempre quise: cero cables visibles, luz cálida, estética limpia. Pasé años buscando algo así.",                                                   name: "Tomás A.",        img: "https://images.pexels.com/photos/1166643/pexels-photo-1166643.jpeg?auto=compress&cs=tinysrgb&w=400" },
    { title: "IDEAL PARA ESTUDIAR DE NOCHE",            rating: 5, text: "Estudio medicina y hago muchas horas frente al apunte por la noche. La tecnología CCT me deja cambiar a luz fría cuando necesito concentración máxima y a cálida cuando empiezo a relajarme. Se nota en la fatiga visual.",                                         name: "Lara V.",         img: "https://images.pexels.com/photos/1181534/pexels-photo-1181534.jpeg?auto=compress&cs=tinysrgb&w=400" },
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
  soldCount: 968,
  reviewCount: 147,
  reviewScore: 4.8,

  // ── Estadísticas circulares ───────────────────────────────
  statsTitle: "Resultados que se notan desde el primer día",
  statsFooterNote: "*Basado en compras verificadas de BoomHausS",
  statsCircles: [
    { target: 94, text: `Dicen que <strong>mejoraron el orden de su escritorio</strong> al cambiar la lámpara con cable.` },
    { target: 91, text: `Reportan <strong>menos fatiga visual al usar el modo cálido</strong> por la noche.` },
    { target: 88, text: `La usan también <strong>como linterna portátil</strong> en otras partes de la casa.` },
    { target: 93, text: `Recomiendan el producto <strong>a alguien con home office</strong>.` },
  ],

  // ── Precio tachado fallback ───────────────────────────────
  compareAtPriceFallback: 0,

  // ── Acordeones en el bloque de compra ──────
  heroAccordions: [
    {
      icon: "⭐",
      title: "Regalos por tiempo limitado",
      html: `<strong>⭐ Tu compra incluye:</strong><br>• 🚚 Envío gratis a todo el país<br>• 🔌 Cable USB-C incluido<br>• 📘 Guía rápida de montaje`,
    },
    {
      icon: "🛡️",
      title: "Probala 30 días sin riesgo",
      html: `Comprá con confianza. Probala durante <strong>30 días sin riesgo</strong>. Si no te convence, te devolvemos el dinero.`,
    },
  ],

  // ── WhatsApp flotante ────────────────────────────────────
  whatsapp: {
    show: true,
    number: "5491112345678",
    message: "Hola! Tengo una consulta sobre la Lámpara Magnética 3 en 1",
  },

  // ── Stock limitado ────────────────────────────────────────
  stockAlert: {
    show: true,
    remaining: 8,
  },

  // ── Comentarios estilo Facebook ──────────────────────────
  facebookComments: {
    title: "Comentarios recientes",
    pages: [
      [
        {
          type: "thread",
          comments: [
            {
              name: "Lucía Herrera",
              avatar: "https://randomuser.me/api/portraits/women/23.jpg",
              text: "Me llamó mucho la atención. ¿Alguien tiene la variante madera? Quiero algo minimalista para el escritorio y no sé si el kit completo no queda de más.",
              meta: "38m", likes: 14,
            },
            {
              name: "Mariano Díaz",
              avatar: "https://randomuser.me/api/portraits/men/51.jpg",
              text: "Lucía, yo tengo la madera hace dos meses. Si querés minimalismo, esa es. El cabezal + el adhesivo de pared es todo lo que necesitás, el resto del kit para mí era accesorio de más. Le quedó hermosa al escritorio.",
              meta: "22m", likes: 27, reply: true,
            },
          ],
        },
        {
          name: "Rodrigo Peña",
          avatar: "https://randomuser.me/api/portraits/men/31.jpg",
          text: "Compré el kit completo negro mate. La pinza la uso en el escritorio y tengo la base en la mesa de luz del cuarto. Una sola lámpara cubre dos lugares. Muy versátil.",
          meta: "1h", likes: 22,
        },
        {
          name: "Paula Giménez",
          avatar: "https://randomuser.me/api/portraits/women/42.jpg",
          text: "La batería realmente dura lo que dicen. La cargo los domingos a la noche y me llega hasta el viernes usándola todos los días.",
          meta: "2h", likes: 19,
        },
        {
          name: "Santiago Morales",
          avatar: "https://randomuser.me/api/portraits/men/28.jpg",
          text: "El detalle del acople magnético es muy bueno. No es uno de esos imanes débiles que se te cae al menor movimiento. Queda firme.",
          meta: "3h", likes: 16,
        },
        {
          type: "thread",
          comments: [
            {
              name: "Julieta Ruiz",
              avatar: "https://randomuser.me/api/portraits/women/67.jpg",
              text: "¿Sirve para leer en la cama? Mi pareja se queja cuando prendo la velador general.",
              meta: "4h", likes: 11,
            },
            {
              name: "Nicolás Araya",
              avatar: "https://randomuser.me/api/portraits/men/19.jpg",
              text: "Julieta, sí. El modo cálido es suave, dirigido, no molesta al que duerme al lado. Yo lo uso exactamente para eso y funcionó de diez.",
              meta: "5h", likes: 18, reply: true,
            },
          ],
        },
        {
          name: "Carolina Flores",
          avatar: "https://randomuser.me/api/portraits/women/12.jpg",
          text: "La mejor inversión para el home office. Me la pusieron a prueba seis meses y sigue como el primer día. Calidad real.",
          meta: "7h", likes: 24,
        },
      ],
      [
        {
          name: "Emiliano Castro",
          avatar: "https://randomuser.me/api/portraits/men/45.jpg",
          text: "Cambio drástico en el escritorio. No me había dado cuenta de cuánto me molestaba visualmente el cable colgando de la lámpara anterior.",
          meta: "8h", likes: 21,
        },
        {
          name: "Renata Soto",
          avatar: "https://randomuser.me/api/portraits/women/34.jpg",
          text: "Estudio en la universidad y la uso todos los días. La luz blanca fría me mantiene despierta en sesiones largas de apuntes. Muy recomendable.",
          meta: "10h", likes: 17,
        },
        {
          name: "Ignacio Vera",
          avatar: "https://randomuser.me/api/portraits/men/62.jpg",
          text: "La terminación se ve premium en mano. Esperaba algo más plástico por el precio pero se siente sólida, pesa lo justo.",
          meta: "12h", likes: 20,
        },
        {
          name: "Florencia Reyes",
          avatar: "https://randomuser.me/api/portraits/women/55.jpg",
          text: "El soporte adhesivo de pared es fuerte de verdad. Lo puse en un placard y aguanta sin moverse hace un mes. Sin clavos, sin agujeros.",
          meta: "14h", likes: 23,
        },
        {
          name: "Gabriel Núñez",
          avatar: "https://randomuser.me/api/portraits/men/73.jpg",
          text: "Pedí dos: una para el escritorio y otra para la cocina (uso la pinza en el estante). Me resolvió dos problemas de luz con el mismo producto.",
          meta: "16h", likes: 25,
        },
        {
          name: "Belén Ortiz",
          avatar: "https://randomuser.me/api/portraits/women/39.jpg",
          text: "Llegó en dos días. Empaque prolijo, instructivo claro, a los cinco minutos ya la tenía cargando. Cero vueltas con esta compra.",
          meta: "18h", likes: 14,
        },
      ],
    ],
  },
};

export default lamparaMagneticaConfig;
