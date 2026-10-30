/* Datos de la landing de los Parches Detox (sin JSX). Los textos y URLs se
   editan acá; las secciones en sections/ solo los renderizan. */
import mc from '../parches-detox';

/* ── Constantes ─────────────────────────────────────────────── */
export const PRODUCT_SLUG  = 'parches-detox';
export const CHECKOUT_NAME = 'Parches Plantares Detox Kinoki';
export const DEFAULT_PRICE   = 58000;
export const DEFAULT_COMPARE = 96700;

/* Announcement bar */
export const annMsgs = [
  '🌙 ¡OFERTA ESPECIAL DE LANZAMIENTO!',
  '🚚 ENVÍO GRATIS A TODO EL PAÍS',
  '⭐ +10.000 NOCHES TRANSFORMADAS',
  '🔒 GARANTÍA 90 DÍAS O DEVOLUCIÓN',
];

/* Hero benefits */
export const BENEFITS = [
  { icon: '✨', text: 'Elimina dolores y tensión acumulada en el cuerpo' },
  { icon: '✅', text: 'Desintoxica y mejora tu energía desde la primera noche' },
  { icon: '💆‍♀️', text: 'Reduce inflamaciones y piernas pesadas' },
  { icon: '🌿', text: 'Ingredientes 100% naturales ' },
  { icon: '😴', text: 'Sueño más profundo y descanso reparador' },
];

/* Product accordion tabs */
export const PRODUCT_TABS = [
  {
    key: 'detalles',
    title: 'Detalles del producto',
    content: [
      'Los Parches Plantares Detox Kinoki están formulados con ingredientes herbales naturales que actúan durante la noche, cuando el cuerpo entra en modo de recuperación.',
      'Cada parche contiene extracto de bambú, vinagre de madera, chitosán y hojas de moxa, entre otros ingredientes de origen natural. Su mecanismo de acción se basa en la termogénesis plantar: el calor natural del pie activa los ingredientes.',
      'Cada kit incluye parches individuales herméticamente sellados para garantizar frescura y efectividad hasta el momento de uso.',
    ],
  },
  {
    key: 'resultados',
    title: '¿Cuándo veo resultados?',
    content: [
      'La primera señal visible ocurre desde la primera noche: el parche amanece oscuro y húmedo. Eso indica que está absorbiendo lo que el cuerpo libera durante el descanso.',
      'Para sentir diferencia real — más energía, piernas más livianas, sueño más profundo — la mayoría nota cambios en 3 a 7 noches de uso continuo.',
      'Para mejores resultados, usarlo todas las noches durante al menos 2 semanas. Muchas personas lo incorporan como ritual nocturno permanente.',
    ],
  },
  {
    key: 'seguro',
    title: '¿Es seguro?',
    content: [
      'Sí. Los parches se aplican en la planta del pie (uso externo), sin contacto con mucosas ni ingestión. Los ingredientes son de origen herbal y natural.',
      'No recomendado para personas con heridas abiertas en los pies. Si estás embarazada o tenés condiciones médicas específicas, consultá con tu médico antes del primer uso.',
    ],
  },
  {
    key: 'garantia',
    title: 'Garantía y envíos',
    content: [
      'Garantía de devolución 90 días. Si el parche no amanece oscuro la primera noche, o no notás ningún beneficio, te devolvemos el 100% del dinero sin preguntas.',
      'Envío gratis a todo el país. CABA y GBA: 24 a 72hs hábiles. Interior: 3 a 7 días hábiles con seguimiento incluido.',
    ],
  },
];

/* Hero inline reviews */
export const heroReviews = [
  { name: 'Valentina C.', avatar: 'https://i.pravatar.cc/80?img=47', stars: 5, text: 'Primera noche y el parche amaneció oscuro. Me desperté sin el peso de siempre — algo funcionó.' },
  { name: 'Luciana P.',   avatar: 'https://i.pravatar.cc/80?img=49', stars: 5, text: 'Llevaba meses con las piernas pesadas. Dos semanas de uso y ya no siento esa hinchazón.' },
  { name: 'Sabrina S..',    avatar: 'https://www.luxcove.co/cdn/shop/files/4_6d5fe2b7-5b21-42f1-86a6-d13fd0a1a092.png?v=1741425640', stars: 5, text: 'Ver el parche negro en la mano al despertar me convenció. No hice nada, solo dormí.' },
];

/* Video strip — placeholder hasta tener videos reales */
export const VSTRIP_VIDEOS = [
  { src: "https://cdn.shopify.com/s/files/1/0778/4303/8517/files/gempages_508979000853398631-547c1f82-51e8-41d6-a511-3f54ad4a0a00.gif", benefit: '' },
  { src: "https://cdn.shopify.com/s/files/1/0778/4303/8517/files/gempages_508979000853398631-aaad44f2-d927-4ca4-afd1-df3058de82a4.gif", benefit: '' },
  { src: "https://cdn.shopify.com/s/files/1/0778/4303/8517/files/gempages_508979000853398631-1e1e15b6-6aaf-4796-b6be-a214e99db702.gif", benefit: '' },
];

/* Bloques imagen + texto (S6–S7B). Los párrafos admiten <strong> y se
   renderizan con <RichText> (lista blanca, sin dangerouslySetInnerHTML). */
export const FEATURE_BLOCKS = [
  {
    tone: 'white',
    img: 'https://cdn.shopify.com/s/files/1/0698/1468/1858/files/KINOKI001.webp?v=1728712902',
    alt: 'Problemas que resuelven los Parches Detox',
    kicker: '⚠️ ¿TE IDENTIFICÁS CON ESTO?',
    title: 'Tu cuerpo te está mandando señales que no podés ignorar',
    paragraphs: [
      '¿<strong>Dolor de espalda</strong>, kilos que no bajan, <strong>estrés constante</strong> o ansiedad? No son problemas separados — son señales de <strong>acumulación de toxinas</strong> que tu cuerpo no puede eliminar solo. Los Parches Detox lo hacen por vos, <strong>noche a noche</strong>, sin cambiar nada de tu rutina.',
    ],
  },
  {
    tone: 'green',
    reverse: true,
    img: 'https://cdn.shopify.com/s/files/1/0698/1468/1858/files/PARCHE-BENEFICIOS_480x480_1_2abefb24-0283-4d39-9697-0ef9537237f2.webp?v=1727546498',
    alt: 'Beneficios de los Parches Detox',
    kicker: '✅ LA SOLUCIÓN',
    title: '5 beneficios que sentís desde la primera noche',
    paragraphs: [
      'Los Parches Detox <strong>mejoran tu inmunidad</strong>, <strong>alivian el dolor y el estrés</strong>, mejoran la <strong>circulación sanguínea</strong> y eliminan las <strong>toxinas acumuladas</strong> en tu cuerpo — todo mientras dormís, sin que hagas absolutamente nada.',
    ],
  },
  {
    tone: 'white',
    img: 'https://cdn.shopify.com/s/files/1/0778/4303/8517/files/508979000853398631-bf837f33-9e47-4290-8463-4662db21bf9f.gif',
    alt: 'Transformación nocturna con Parches Detox',
    kicker: '🌿 LO QUE PASA MIENTRAS DORMÍS',
    title: 'Despertás distinto. Ligero. Con energía real.',
    paragraphs: [
      'La <strong>cúrcuma, jengibre y hojas de moxa</strong> activan la termogénesis plantar — el calor natural del pie moviliza lo que se acumuló durante el día. El parche lo absorbe todo, vos solo descansás.',
      'Resultado: <strong>menos hinchazón</strong>, <strong>mejor circulación</strong>, noches más reparadoras y una mañana que se siente diferente desde el primer uso.',
    ],
  },
];

/* Reviews carousel */
export const REVIEWS = [
  {
    name: 'Carolina F.',
    stars: 5,
    reviewImg: 'https://nesimu.com/cdn/shop/files/imgi_43_D_NQ_NP_2X_676642-MLA97579090775_112025-F.jpg?v=1770705063&width=1420',
    text: 'Nunca creí que algo tan simple pudiera hacer tanta diferencia. Me despierto descansada de verdad. Lo que más me sorprendió es ver ese parche oscuro en la mano al despertar — claramente algo está pasando mientras dormís.',
  },
  {
    name: 'Rodrigo V.',
    stars: 5,
    reviewImg: 'https://nesimu.com/cdn/shop/files/imgi_33_713PY4u2yeL.jpg?v=1770705048&width=1420',
    text: 'Le compré a mi mamá porque le costaba dormir hace años. Al día siguiente me mandó un audio: "fue la mejor noche en mucho tiempo". El parche amaneció oscurísimo. Ya pedimos otro kit para mí.',
  },
  {
    name: 'Jimena S.',
    stars: 5,
    reviewImg: 'https://nesimu.com/cdn/shop/files/imgi_36_71_StcLeTHL.jpg?v=1770705063&width=1420',
    text: 'El resultado se ve, literal. El parche que sacás de la planta del pie al despertar es negro y húmedo. No necesitás creer en nada raro — el resultado está en tu mano. Y encima las piernas dejaron de pesarme.',
  },
  {
    name: 'Hernán B.',
    stars: 5,
    reviewImg: 'https://nesimu.com/cdn/shop/files/imgi_51_D_NQ_NP_2X_903416-MLA92304661828_092025-F.jpg?v=1770705073&width=1420',
    text: 'Llegó rápido a Capital. Primera noche, parche negro al despertar. Sencillo y sin complicaciones. Lo pegás, dormís, y el resultado lo tenés en la mano a la mañana.',
  },
  {
    name: 'Sofía M.',
    stars: 5,
    reviewImg: "https://pagaentucasachile.com/cdn/shop/files/A77196650d6a74804a5a7375c98bc645aj.webp?v=1738434565&width=550",
    text: 'Venía muy escéptica pero me convencieron las reseñas. Primer uso, parche oscurísimo. Segunda noche, igual. Empecé a notar que me levanto con más ganas. Lo voy a seguir usando sin dudas.',
  },
];

/* Steps — imágenes placeholder hasta tener las reales */
export const STEPS = [
  { num: '1', title: 'Limpiá la planta del pie', desc: 'Antes de acostarte, asegurate de tener la planta limpia y seca para que el parche se adhiera correctamente.', img: "" },
  { num: '2', title: 'Pegá el parche',           desc: 'Sacá el film protector y aplicá el parche centrado en la planta del pie. La superficie blanca queda en contacto con la piel.', img: "" },
  { num: '3', title: 'Dormí toda la noche',      desc: 'Vas a la cama como siempre. El parche trabaja durante 6 a 8 horas mientras tu cuerpo descansa.', img: "" },
  { num: '4', title: 'Retiralo al despertar',    desc: 'A la mañana, despegalo con cuidado. Vas a ver el parche oscuro y húmedo: esa es la señal visible de que funcionó.', img: "" },
];

/* FAQ */
export const faqs = [
  { q: '¿Cómo sé que funcionó?', a: 'El parche oscuro que tenés en la mano al despertar es la señal. Entra completamente blanco y amanece negro y húmedo. Sin haber hecho nada más que dormir. Aparte de eso, la mayoría de los clientes notan más energía y piernas más livianas desde la primera semana de uso continuo.' },
  { q: '¿Cuántas noches necesito para ver resultados?', a: 'El cambio de color en el parche se ve desde la primera noche. Para notar diferencia real en cómo te sentís — más descansado/a, piernas más livianas, más energía — lo ideal es una semana seguida. Muchos lo incorporan como ritual nocturno permanente.' },
  { q: '¿Para quién es ideal?', a: 'Para cualquier persona que se levante cansada, con piernas pesadas o sueño poco reparador. No requiere dieta, ni ejercicio, ni cambio de hábitos. Solo lo pegás en la planta del pie y dormís. Si tenés alguna condición médica o estás embarazada, consultá antes con tu médico.' },
  { q: '¿Tengo que cambiar algo en mi rutina?', a: 'No. Cero fricción. Lo único que hacés es pegarlo en la planta del pie limpia antes de acostarte. Sin pastillas, sin dietas, sin ejercicios. Funciona mientras dormís — eso es todo.' },
  { q: '¿Cuántos parches uso por noche?', a: 'Se usa un parche por planta del pie, es decir, 2 por noche (uno en cada pie). Cada kit incluye múltiples parches para varias noches de uso.' },
  { q: '¿Puedo usarlo todas las noches?', a: 'Sí. Es apto para uso continuo. Muchas personas lo usan todas las noches indefinidamente como parte de su ritual de bienestar nocturno.' },
  { q: '¿Qué hago si el parche no se oscureció?', a: 'En casos de pies muy fríos o poco sudoración, el parche puede oscurecerse menos. Asegurate de que el pie esté caliente y limpio antes de aplicarlo. Si después de varias noches no hay cambio de color, te aplicamos la garantía 90 días sin preguntas.' },
  { q: '¿Cuándo llega y cómo puedo pagar?', a: 'Envío gratis a todo el país. CABA y GBA: 24 a 72hs hábiles con opción de pago al recibirlo. Interior del país: 3 a 7 días hábiles por Correo Argentino, abonando con MercadoPago al comprar.' },
];

/* Bundles desde config */
export const BUNDLES = (mc.bundles || []).map((b, i) => ({
  id: i,
  label: b.label,
  badge: b.badge,
  qty: b.qty,
  price: b.price ?? DEFAULT_PRICE,
  compareAt: b.compareAt ?? DEFAULT_COMPARE,
  benefit: b.benefit,
  popular: b.popular,
  cuotas: b.cuotas,
  bannerBelow: b.bannerBelow,
  img: b.img || null,
  nights: b.nights || null,
  giftQty: b.giftQty ?? null,
}));

/* Galería del hero */
export const FALLBACK_IMAGES = [
  { src: mc.images?.[0], alt: 'Parches Plantares Detox Kinoki — vista principal' },
  { src: mc.images?.[1], alt: 'Parche antes de usar — blanco' },
  { src: mc.images?.[2], alt: 'Parche al despertar — oscuro' },
  { src: mc.images?.[3], alt: 'Caja del producto' },
].filter(x => x.src);
