// src/landings/mundial-revendedores.js
// ─────────────────────────────────────────────────────────────
// Landing B2B para REVENDEDORES de productos del Mundial Argentina
// URL: /lp/mundial-revendedores
// Cada producto tiene su propio slug en el admin (ver "products" abajo).
// ─────────────────────────────────────────────────────────────

const MUNDIAL_BLUE = "https://placehold.co/600x600/1B4D7E/FFFFFF/png?text=";

const mundialRevendedoresConfig = {
  // ── SEO ──────────────────────────────────────────────────────
  pageTitle: "Mundial Argentina x10 — Pack Revendedor | BoomHausS",
  metaDescription:
    "Comprá productos del mundial Argentina por mayor en packs de 10. Margen del 100%, envío a todo el país, atención por WhatsApp.",

  // ── Hero ─────────────────────────────────────────────────────
  hero: {
    badge: "MAYORISTA · REVENDEDORES",
    title: "Comprá por 10,",
    titleAccent: "vendé al doble",
    subtitle:
      "Packs del mundial a precio mayorista. Por cada $1 que invertís, ganás $2. Envío gratis desde $50.000.",
    giftPill: "🎁 Kit Completo: llevate +20 unidades GRATIS",
    primaryCta: "Ver el Kit Completo",
    secondaryCta: "Hablar por WhatsApp",
    stats: [
      { value: "x2", label: "tu inversión" },
      { value: "24/48h", label: "en tu casa" },
      { value: "$50k", label: "pedido mínimo" },
      { value: "+20", label: "gratis con el kit" },
    ],
  },

  // ── Mínimo de compra + envío gratis ──────────────────────────
  minOrder: {
    amount: 50000,
    label: "Mínimo $50.000 · envío gratis incluido",
    shortLabel: "Mín. $50.000",
  },

  // ── Strip de confianza B2B ───────────────────────────────────
  trustStrip: [
    { icon: "📦", label: "Stock real",     value: "Sale hoy mismo" },
    { icon: "🚚", label: "Envío gratis",   value: "Desde $50.000" },
    { icon: "💬", label: "WhatsApp",       value: "Respuesta directa" },
    { icon: "🔄", label: "Garantía",       value: "Reponemos daños" },
  ],

  // ── PRODUCTOS — el corazón del catálogo ──────────────────────
  // unitsPerPack: cuántas unidades vienen en cada pack
  // suggestedResale: precio sugerido por UNIDAD para revender
  // Las imágenes son placeholders azules — reemplazalas en el admin.
  products: [
    {
      slug: "kit-revendedor-mundial",
      name: "Kit Completo Revendedor",
      checkoutName: "Kit Completo Revendedor — Mundial Argentina",
      shortName: "Kit Completo",
      price: 238100,
      compareAtPrice: 338140,
      unitsPerPack: 70, // 7 productos × 10
      suggestedResale: 5300, // promedio realista (no se usa en cálculo)
      image: "https://pbs.twimg.com/media/HFv1lUtWcAIqclN?format=jpg&name=small",
      description:
        "Los 7 productos juntos + 20 unidades de regalo. Invertís $170.100 y podés facturar $477.000.",
      tagline: "EL MÁS PEDIDO",
      isKit: true,
      featured: true,
      includes: [
        "10 × Bandera para Auto",
        "10 × Corneta 16cm",
        "10 × Gorro 3 Pelotas",
        "10 × Gorro Arlequín",
        "10 × Set Inflables (2 piezas)",
        "10 × Peluca Afro",
        "10 × Pulseras Silicon",
      ],
      gifts: [
        "🎁 +10 Pulseras Silicon EXTRA",
        "🎁 +10 Banderas para Auto EXTRA",
      ],
      kitProfit: {
        ifSellAll: 477000,    // si vende los 70 + los 20 de regalo a precios sugeridos
        netProfit: 306900,    // 477.000 - 170.100
        marginPct: 180,
      },
    },
    {
      slug: "gorro-3-pelotas-x10",
      name: "Gorro 3 Pelotas Argentina x10",
      checkoutName: "Gorro 3 Pelotas Argentina (Pack x10)",
      shortName: "Gorro 3 Pelotas",
      price: 78300,
      compareAtPrice: 124420,
      unitsPerPack: 10,
      suggestedResale: 13800,
      image:"https://api.distribuidoraorion.com.ar/images/zRScay6N9k2IhlGLUcu9zWVOCeStvLu6LVoY3tbd.jpg",
      description:
        "Gorro divertido con 3 pelotas de fútbol arriba. Súper llamativo, se vende solo.",
      tagline: "ALTA ROTACIÓN",
      group: "cabeza",
    },
    {
      slug: "gorro-arlequin-x10",
      name: "Gorro Arlequín Argentina x10",
      checkoutName: "Gorro Arlequín Argentina (Pack x10)",
      shortName: "Gorro Arlequín",
      price: 69400,
      compareAtPrice: 99160,
      unitsPerPack: 10,
      suggestedResale: 11800,
      image: "https://api.distribuidoraorion.com.ar/images/hV7a9zuPKgTo6yOmsoccIGX9Qpc8MGnUump3Fz3n.jpg",
      description:
        "Clásico gorro de arlequín celeste y blanco. Tela suave, ajuste universal.",
      group: "cabeza",
    },
    {
      slug: "peluca-afro-x10",
      name: "Peluca Afro Argentina x10",
      checkoutName: "Peluca Afro Argentina (Pack x10)",
      shortName: "Peluca Afro",
      price: 48700,
      compareAtPrice: 82980,
      unitsPerPack: 10,
      suggestedResale: 7400,
      image: "https://api.distribuidoraorion.com.ar/images/svqUmF8hN0DwmdRiCfEhJtk7MdwpaMpeTiakSyag.jpg",
      description:
        "Peluca afro celeste y blanca, fibra suave. Un clásico que nunca falla.",
      tagline: "TOP HINCHADAS",
      group: "cabeza",
    },
    {
      slug: "bandera-auto-x10",
      name: "Bandera para Auto Argentina x10",
      checkoutName: "Bandera para Auto Argentina (Pack x10)",
      shortName: "Bandera p/Auto",
      price: 19900,
      compareAtPrice: 38780,
      unitsPerPack: 10,
      suggestedResale: 2800,
      image: "https://api.distribuidoraorion.com.ar/images/8Vg5x5rYqohOOHR7fS1GuKLhtvhDGzXINEDNtdpp.jpg",
      description:
        "Bandera Argentina para la ventanilla del auto. Tela liviana, colores vivos.",
      tagline: "MÁS VENDIDO",
      hot: true,
      group: "accesorios",
    },
    {
      slug: "pulseras-silicon-x10",
      name: "Pulseras Silicon Argentina x10",
      checkoutName: "Pulseras Silicon Argentina (Pack x10)",
      shortName: "Pulseras Silicon",
      price: 9900,
      compareAtPrice: 18620,
      unitsPerPack: 10,
      suggestedResale: 1500,
      image: "https://api.distribuidoraorion.com.ar/images/mxz6RKHEfMKSmNm8AKoHcr8m0DBbxy9GN9IqGI7g.jpg",
      description:
        "Pulseras de silicona Argentina. Livianas, regalables, alta rotación.",
      tagline: "ENTRADA DE GAMA",
      group: "accesorios",
    },
    {
      slug: "corneta-x10",
      name: "Corneta 16cm Argentina x10",
      checkoutName: "Corneta Argentina 16cm (Pack x10)",
      shortName: "Corneta 16cm",
      price: 24000,
      compareAtPrice: 45400,
      unitsPerPack: 10,
      suggestedResale: 3300,
      image:"https://api.distribuidoraorion.com.ar/images/Pkz2KHLJpahYJZJF4iS9YFqRFmUqkFY7iTrDOI1y.jpg",
      description:
        "Corneta plástica de 16cm, celeste y blanco. Sonido fuerte, ideal para alentar.",
      group: "ruido",
    },
    {
      slug: "inflables-x10",
      name: "Inflables 2 Piezas Argentina x10",
      checkoutName: "Inflables Argentina 2 Piezas (Pack x10)",
      shortName: "Inflables 2pzas",
      price: 7700,
      compareAtPrice: 10780,
      unitsPerPack: 10,
      suggestedResale: 2800,
      image: "https://api.distribuidoraorion.com.ar/images/yGXMLzDxo8Qx38fUXnd9wnbEIlA0GqyNXXXYIyJ0.jpg",
      description:
        "Set de 2 inflables grandes (mano + martillo) en colores Argentina.",
      group: "ruido",
    },
  ],

  // ── Grupos para carousels ────────────────────────────────────
  productGroups: [
    {
      key: "cabeza",
      kicker: "GORROS Y PELUCAS",
      title: "PARA LA CABEZA",
      subtitle: "Los más vistosos. Se venden solos.",
    },
    {
      key: "accesorios",
      kicker: "ACCESORIOS",
      title: "BANDERAS Y PULSERAS",
      subtitle: "Baratos de comprar, alto margen.",
    },
    {
      key: "ruido",
      kicker: "RUIDO Y ALIENTO",
      title: "PARA HACER FIESTA",
      subtitle: "Lo que la gente compra entrando al estadio.",
    },
  ],

  // ── How it works (4 pasos) ───────────────────────────────────
  howItWorks: {
    title: "ASÍ DE SIMPLE",
    subtitle: "4 pasos y empezás a vender",
    steps: [
      {
        icon: "🧮",
        title: "1. Elegís tus packs",
        text: "Usá la calculadora y armá tu pedido.",
      },
      {
        icon: "💳",
        title: "2. Pagás seguro",
        text: "Con Mercado Pago, transferencia o contra entrega.",
      },
      {
        icon: "📦",
        title: "3. Te llega en 48hs",
        text: "Envío gratis a todo el país, despachamos hoy.",
      },
      {
        icon: "💰",
        title: "4. Vendés y ganás",
        text: "Marcás tu precio y empezás a facturar.",
      },
    ],
  },

  // ── Reviews de revendedores (mismo formato que ProductDetail) ──
  // img: reemplazá los placeholders por fotos reales después
  reviews: [
    {
      name: "Marcos D.",
      city: "Quilmes, BA",
      stars: 5,
      rating: 5,
      title: "Vendí los 10 gorros en una tarde",
      text: "Compré el pack de gorros 3 pelotas y los vendí enteros a la salida de la cancha. Ya pedí dos packs más.",
      short: "Vendí los 10 gorros en una tarde. Ya pedí más.",
      img: "https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=600",
    },
    {
      name: "Carolina R.",
      city: "Rosario, SF",
      stars: 5,
      rating: 5,
      title: "Compré el kit completo",
      text: "Nunca había encontrado un proveedor tan ordenado. Pedí el kit completo, llegó en 2 días, y los regalitos extras me cerraron el negocio.",
      short: "El kit llegó en 2 días y los regalos me cerraron el negocio.",
      img: "https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg?auto=compress&cs=tinysrgb&w=600",
    },
    {
      name: "Diego L.",
      city: "Córdoba Capital",
      stars: 5,
      rating: 5,
      title: "Atención por WhatsApp impecable",
      text: "Pregunté por stock un domingo y me contestaron en 10 minutos. El martes ya lo tenía en mi local.",
      short: "Pregunté un domingo, el martes ya lo tenía en el local.",
      img: "https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=600",
    },
    {
      name: "Sofía M.",
      city: "La Plata, BA",
      stars: 5,
      rating: 5,
      title: "Las pulseras se vendieron solas",
      text: "Empecé con pulseras para probar y se terminaron en 3 horas en una feria. Ahora vuelvo por 5 packs más.",
      short: "Vendí 10 pulseras en 3 horas. Vuelvo por 5 packs más.",
      img: "https://images.pexels.com/photos/3184405/pexels-photo-3184405.jpeg?auto=compress&cs=tinysrgb&w=600",
    },
    {
      name: "Federico A.",
      city: "Mar del Plata, BA",
      stars: 5,
      rating: 5,
      title: "Recuperé la inversión el primer día",
      text: "Llevé el kit a la peatonal el día del partido. Antes del primer tiempo ya había recuperado todo.",
      short: "Recuperé toda la inversión antes del primer tiempo.",
      img: "https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=600",
    },
    {
      name: "Lucía B.",
      city: "Mendoza Capital",
      stars: 5,
      rating: 5,
      title: "Calidad real, no cualquier cosa",
      text: "Me sorprendió la calidad. Las cornetas suenan, los gorros son cómodos. Por eso vuelven los clientes.",
      short: "Calidad real — por eso vuelven los clientes.",
      img: "https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=600",
    },
  ],

  // ── FAQ orientado al revendedor ──────────────────────────────
  faqTitle: "PREGUNTAS FRECUENTES",
  faq: [
    {
      q: "¿Cuánto es lo mínimo que puedo comprar?",
      a: "El pedido mínimo es de $50.000. Podés combinar los packs que quieras para llegar a ese monto y el envío te sale gratis.",
    },
    {
      q: "¿Cómo pago?",
      a: "Mercado Pago (tarjeta, débito, saldo), transferencia bancaria o contra entrega en CABA.",
    },
    {
      q: "¿Cuándo me llega?",
      a: "En 24 a 48hs. Si pagás antes de las 16hs, sale el mismo día.",
    },
    {
      q: "¿Hacen factura?",
      a: "Sí, factura A o B. Pedila al hacer el pedido y te la mandamos por mail.",
    },
    {
      q: "¿Qué pasa si llega algo dañado?",
      a: "Te lo reponemos gratis. Sacale foto, mandala por WhatsApp y en el próximo envío va.",
    },
    {
      q: "¿El precio sugerido es real?",
      a: "Sí. Es el promedio al que venden nuestros revendedores en ferias, peatonales y online.",
    },
    {
      q: "¿Puedo pedir más cantidad o productos a medida?",
      a: "Sí. Para pedidos grandes (50+ packs) escribinos por WhatsApp y armamos precio especial.",
    },
    {
      q: "¿Qué pasa si me sobra stock del mundial?",
      a: "Estos productos se venden todo el año: partidos de la selección, fiestas patrias, eventos.",
    },
  ],

  // ── About B2B ────────────────────────────────────────────────
  about: {
    title: "SOMOS MAYORISTA DIRECTO",
    text: "Trabajamos con stock real en Argentina, no dropshipping. Despachamos todos los días y te atendemos vos a vos por WhatsApp.",
    bullets: [
      "✅ Stock real, sale hoy",
      "📦 Envío a todo el país",
      "💬 WhatsApp humano",
      "🧾 Factura A o B",
      "🔄 Reponemos daños gratis",
      "🤝 Sin intermediarios",
    ],
    img: "https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=1200",
  },

  // ── WhatsApp ─────────────────────────────────────────────────
  whatsapp: {
    show: true,
    number: "5491112345678", // CAMBIAR por número real
    message:
      "Hola! Quiero info sobre los packs revendedor del mundial Argentina",
  },

  // ── Stock alert ──────────────────────────────────────────────
  stockAlert: {
    show: true,
    text: "Stock limitado — pedí ahora",
  },

  // ── Marquee items personalizados (los va a leer la landing) ──
  marqueeItems: [
    "🇦🇷 Mundial Argentina · precio mayorista",
    "🚚 Envío gratis a todo el país",
    "💬 WhatsApp directo",
    "💰 Ganás x2 sobre tu inversión",
    "📦 Stock real · sale hoy",
  ],
};

export default mundialRevendedoresConfig;
