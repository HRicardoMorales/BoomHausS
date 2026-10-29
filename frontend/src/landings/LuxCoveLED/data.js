/* Datos de la landing del Escultor LED (sin JSX). Los textos y URLs se
   editan acá; las secciones en sections/ solo los renderizan. */
/* ── Constantes ───────────────────────────────────────────── */
// Nombre del producto: la fuente de verdad es la BD (product.name).
// mc.checkoutName es solo fallback si el fetch falla. NO hardcodear
// "X en 1" aca — se cambia desde admin → productos → escultor-led.
export const PRODUCT_SLUG = 'escultor-led';
export const DEFAULT_PRICE = 39900;
export const DEFAULT_COMPARE = 115000;

// 🖼 Imágenes del bundle — reemplazá con tus URLs
export const BUNDLE_PRODUCT_IMG  = "https://pbs.twimg.com/media/HKF3r-fWwAAD87X?format=jpg&name=small";
export const EBOOK_IMG           = "https://pbs.twimg.com/media/HKF3ODKWEAAqpdo?format=jpg&name=small";

// ✏️ Textos debajo de cada imagen del bundle
export const BUNDLE_PRODUCT_NAME = "Escultor LED";
export const BUNDLE_EBOOK_NAME   = "eBook de rutinas";

// 🎁 Configuraciones de campaña — una entrada por campaña de publicidad
// Uso: /lp/escultor-led?regalo=masajeador  /lp/escultor-led?regalo=espatula  etc.
// - img:     imagen del producto de regalo en el bundle
// - name:    nombre del producto de regalo
// - heroImg: (opcional) reemplaza la imagen principal del hero para esa campaña. null = imagen por defecto
export const GIFT_CONFIGS = {
  masajeador: {
    img:     "https://acdn-us.mitiendanube.com/stores/006/731/084/products/whatsapp-image-2026-02-12-at-15-27-30-48665eed9d1957f81017709208734547-1024-1024.webp",
    name:    "Masajeador MicroCorrientes",
    heroImg: null,
  },
  espatula: {
    img:     "https://nextcell.com.ar/wp-content/uploads/2026/04/D_NQ_NP_671862-MLA93554403855_092025-O.webp",
    name:    "Espatula Limpieza facial",
    heroImg: "https://pbs.twimg.com/media/HLEGhEBXAAA794j?format=jpg&name=small",
  },
  // Agregá más campañas acá:
  // rodillo: {
  //   img:     "https://TU_URL_REGALO.jpg",
  //   name:    "Rodillo de Cuarzo",
  //   heroImg: "https://TU_URL_HERO.jpg",
  // },
};

/* C1 — Announcement bar messages */
export const annMsgs = [
  '🔴 ¡OFERTA RELÁMPAGO ACTIVA!',
  '🚚 ENVÍO GRATIS EN TODOS LOS PEDIDOS',
  '⭐ +10.000 CLIENTES SATISFECHOS',
  '💰 GARANTÍA DE DEVOLUCIÓN 90 DÍAS',
];

export const FOR_WHOM = [
  'Querés reducir la papada o la flaccidez sin gastar en clínicas',
  'Usás sérums y cremas pero no ves resultados reales',
  'Tenés acné, poros grandes o piel sin brillo',
  'Querés redefinir tu rostro y verte mejor sin depender de nadie',
];

/* C4 — Accordion tabs con key para matching de íconos */
export const PRODUCT_TABS = [
  {
    key: 'detalles',
    title: 'Detalles del producto',
    content: [
      'El Escultor Facial LED 3 en 1 es la solución definitiva para el cuidado de tu piel en casa. Nuestro dispositivo ofrece masajes focalizados que afilan el cuello y el rostro, dándote un efecto lifting visible y promoviendo la simetría facial.',
      'Elegí entre 3 luces LED distintas, con eficacia clínica comprobada para mejorar la textura de la piel, reducir arrugas, combatir el acné y mucho más.',
      '3 modos incluidos: Modo Limpieza (desbloquea poros), Modo EMS (tonifica y tensa con corrientes de baja intensidad), Modo Calor (estimula colágeno y mejora elasticidad).',
    ],
  },
  {
    key: 'resultados',
    title: '¿Cuándo veo resultados?',
    content: [
      'Muchos usuarios notan mejoras visibles — piel más firme, efecto lifting y brillo natural — dentro de las primeras 2–3 semanas de uso constante.',
      'Los cambios más notorios en líneas de expresión, textura, manchas y firmeza general aparecen entre las 6 y 8 semanas.',
      'Para mejores resultados, recomendamos usarlo regularmente como parte de tu rutina de skincare.',
    ],
  },
  {
    key: 'seguro',
    title: '¿Es seguro?',
    content: [
      'Sí. Cuando se usa según las instrucciones, el Escultor Facial LED es seguro para uso domiciliario regular. Está diseñado con tecnología no invasiva y suave con la piel. Recomendamos leer el manual completo antes del primer uso.',
    ],
  },
  {
    key: 'garantia',
    title: 'Garantía y envíos',
    content: [
      'Ofrecemos devoluciones por 90 días y garantía de 1 año. Si por algún motivo no quedás satisfecha/o, te devolvemos el dinero sin preguntas.',
      'Hacemos envíos a todo el territorio argentino con seguimiento incluido. Tiempo estimado: 3 a 7 días hábiles.',
    ],
  },
];

/* C5 — Hero inline reviews */
export const heroReviews = [
  { name: 'Verónica C.', avatar: '//www.luxcove.co/cdn/shop/files/the-face-of-a-40-year-old-woman.png?v=1739893013', stars: 5, text: 'No estaba segura de este aparato, pero después de usarlo unas pocas veces, mi rostro y mandíbula se ven más definidos. ¡Mi piel se siente más firme!' },
  { name: 'Romina S.', avatar: '//www.luxcove.co/cdn/shop/files/feeling-cute-today-25-v0-wiakf8p.png?v=1739893136', stars: 5, text: '¡Los resultados son increíbles! Mi piel se ve más luminosa y firme desde la primera semana.' },
  { name: 'Jesica K.', avatar: '//www.luxcove.co/cdn/shop/files/8713e5a4996b69964a57527507ac53ed.png?v=1739892933', stars: 5, text: 'Tenía mis dudas, pero mis líneas de expresión se suavizaron y mi mandíbula luce más definida. ¡Recibo muchísimos cumplidos!' },
];

/* Features — reemplazá cada src con la URL de tu ícono */
export const FEATURES = [
  { src: '//www.luxcove.co/cdn/shop/files/1_c3ca10bf-3c36-44dc-b12e-e9188af4728e.png?v=1723298248', title: 'Nivel profesional', desc: 'Resultados de clínica, desde tu casa.' },
  { src: '//www.luxcove.co/cdn/shop/files/2_8fe3211c-e4d9-487b-bd6a-5315d7204b5e.png?v=1723298321', title: 'Resultados duraderos', desc: 'Más colágeno, piel más firme y renovada con el uso continuo.' },
  { src: '//www.luxcove.co/cdn/shop/files/3_5f51b942-e250-4831-8c25-d2a8108af37a.png?v=1723298339', title: 'Solo 10-15 min por día', desc: 'Sin complicaciones. Usalo mientras ves la tele o antes de dormir.' },
  { src: '//www.luxcove.co/cdn/shop/files/Untitled_design_-_2024-08-10T150022.576.png?v=1723298445', title: 'Garantía 90 días', desc: 'Si no quedás satisfecha/o, te devolvemos el dinero. Sin preguntas.' },
];

/* C7 — Mini reviews data */
export const reviewsData = [
  { title: '¡No lo podía creer!', name: 'Claudia V., 54', avatar: '//www.luxcove.co/cdn/shop/files/2_227e3980-11a4-4119-9ed4-d0963676a467.png?v=1741425800', stars: 5, text: 'A las dos semanas mi marido me preguntó si me había hecho algo en la cara. La papada se redujo y el cuello está mucho más firme. No esperaba estos resultados.' },
  { title: '¡Resultados increíbles!', name: 'Mariana R.', avatar: '//www.luxcove.co/cdn/shop/files/2_227e3980-11a4-4119-9ed4-d0963676a467.png?v=1741425800', stars: 5, text: 'Tenía mis dudas, pero mis líneas de expresión se suavizaron y mi mandíbula luce más definida. ¡Recibo muchísimos cumplidos!' },
  { title: 'Mi rutina nocturna cambió', name: 'Luciana M., 31', avatar: '//www.luxcove.co/cdn/shop/files/4_6d5fe2b7-5b21-42f1-86a6-d13fd0a1a092.png?v=1741425640', stars: 5, text: 'Gasto en buenos sérums pero sentía que la piel no absorbía. Con el modo rojo la diferencia es inmediata. Al otro día me levanto con otra piel.' },
  { title: 'Lo recomiendo a todas', name: 'Natalia A.', avatar: '//www.luxcove.co/cdn/shop/files/4_6d5fe2b7-5b21-42f1-86a6-d13fd0a1a092.png?v=1741425640', stars: 5, text: 'Antes gastaba fortunas en tratamientos de spa. Ahora obtengo los mismos resultados en casa. ¡Me ahorro dinero!' },
  { title: 'Cero granos nuevos', name: 'Valentina G., 24', avatar: '//www.luxcove.co/cdn/shop/files/6_1bb22647-f558-4396-a07f-58716d687ff7.png?v=1741425681', stars: 5, text: 'Luz azul, 5 minutos por noche. Tres semanas después, cero granos nuevos. El único producto que realmente funcionó para mi acné.' },
  { title: 'Como un masaje de spa', name: 'Karina B.', avatar: '//www.luxcove.co/cdn/shop/files/6_1bb22647-f558-4396-a07f-58716d687ff7.png?v=1741425681', stars: 5, text: 'Super fácil de usar. Me siento, me relajo y lo dejo trabajar mientras veo la tele.' },
  { title: 'Mi favorito de la rutina', name: 'Carla B.', avatar: '//www.luxcove.co/cdn/shop/files/5_4674e838-6296-4ca1-9a34-6cc05243b642.png?v=1741425662', stars: 5, text: 'El calor y las vibraciones se sienten como un masaje de spa. ¡Es mi parte favorita del día!' },
  { title: 'Piel más limpia y luminosa', name: 'Noelia S.', avatar: '//www.luxcove.co/cdn/shop/files/8_3ecc94a3-ae31-49c0-a516-7c5b88caef34.png?v=1741425718', stars: 5, text: 'Mi piel está más limpia, luminosa y uniforme. ¡Es lo único que me ha funcionado a largo plazo!' },
  { title: 'Resultados de equipo profesional', name: 'Daniela R., 38', avatar: '//www.luxcove.co/cdn/shop/files/8_3ecc94a3-ae31-49c0-a516-7c5b88caef34.png?v=1741425718', stars: 5, text: 'Soy cosmetóloga y lo uso con clientas. Resultados de equipo profesional a una fracción del costo. Mis clientas vuelven a pedirlo.' },
];

/* C8 — Luces LED — reemplazá cada src con la URL de tu imagen */
export const lights = [
  { src: '//www.luxcove.co/cdn/shop/files/LUX_COVE_1.png?v=1723311444', color: '#FF4444', name: 'LUZ ROJA', nm: '630 nm', desc: 'Más colágeno, menos arrugas. Tu sérum penetra el doble. Piel más firme con cada uso.', border: false },
  { src: '//www.luxcove.co/cdn/shop/files/LUX_COVE_2.png?v=1723311580', color: '#4444FF', name: 'LUZ AZUL', nm: '415 nm', desc: 'Combate el acné activo y baja la inflamación. Sin irritar. Para piel joven o sensible.', border: false },
  { src: '//www.luxcove.co/cdn/shop/files/LUX_COVE_3.png?v=1723311771', color: '#44AA44', name: 'LUZ VERDE', nm: '525 nm', desc: 'Manchas reducidas, poros más cerrados, tono uniforme. Luminosidad que se nota sin filtros.', border: false },
  { src: '//www.luxcove.co/cdn/shop/files/9_ec8cb23b-11a8-4c0e-aef4-c93ac7971a89.png?v=1733574060', color: '#FF6600', name: 'MODO EMS', nm: null, desc: 'Tonificá los músculos faciales. Papada, cuello y mandíbula más definidos.', border: false },
  { src: '//www.luxcove.co/cdn/shop/files/10_933f78a5-a30e-43c1-b96d-57b02685bdae.png?v=1733574060', color: '#FF3366', name: 'MODO CALOR', nm: null, desc: 'Abrí los poros para que tus productos penetren mejor. Usalo antes del modo rojo.', border: false },
  { src: '//www.luxcove.co/cdn/shop/files/11_d559de47-ad6d-484e-9f09-45e1147e439e.png?v=1733574060', color: '#64B5F6', name: 'MODO LIMPIO', nm: null, desc: 'Desincrusta células muertas y exceso de sebo. Poros más limpios y menos visibles.', border: false },
];

/* C9 — Comparison rows */
export const compRows = [
  'Desarrollado por expertos en cuidado de piel.',
  'Resultados de nivel profesional.',
  '3 tipos de luces LED diferentes.',
  'Garantía devolución 90 días.',
  'Tecnología EMS para tonificar músculos.',
  'Modo Calor para producción de colágeno.',
];

export const STEPS = [
  {
    num: '1',
    title: 'Encendelo',
    desc: 'Encendé el dispositivo manteniendo pulsado el botón de encendido durante 3 segundos. Recomendamos usarlo después de aplicar tu crema hidratante y/o sérum.',
  },
  {
    num: '2',
    title: 'Seleccioná un LED y un modo',
    desc: 'Elegí entre las distintas luces LED y modos presionando el botón de encendido. Podés alternar entre 3 luces LED y elegir entre los modos EMS, Limpieza y Calor.',
  },
  {
    num: '3',
    title: 'Empezá el masaje',
    desc: 'Deslizá el dispositivo suavemente sobre el rostro, cuello y zona mandibular en movimientos ascendentes y circulares. Usalo 10-15 minutos por sesión.',
  },
];

/* C10 — FAQ completo (14 preguntas de Lux Cove) */
export const faqs = [
  { q: '¿Cuándo veo resultados?', a: 'La mayoría de los usuarios nota mejoras visibles dentro de las primeras 2–3 semanas de uso constante. Los resultados más notorios en líneas de expresión, firmeza y manchas aparecen entre las 6 y 8 semanas.' },
  { q: '¿Cuáles son los principales beneficios?', a: 'Lifting facial, reducción de arrugas, unificación del tono de piel, reducción de manchas oscuras, firmeza mandibular, reducción del acné y mejora de la absorción de tus productos.' },
  { q: '¿Cómo lo incorporo a mi rutina?', a: 'Aplicá tu sérum o crema hidratante y luego usá el dispositivo 10–15 minutos. Podés usarlo de 3 a 5 veces por semana.' },
  { q: '¿Qué pasa si lo uso sin sérum de vitamina C?', a: 'Igual funciona perfectamente. El sérum potencia los resultados, pero el dispositivo es igual de efectivo con tu hidratante habitual.' },
  { q: '¿Cómo uso el dispositivo?', a: 'Encendelo manteniendo el botón 3 segundos. Elegí la luz LED y el modo. Deslizalo en movimientos ascendentes por rostro, cuello y zona mandibular durante 10–15 minutos.' },
  { q: '¿Cómo se carga?', a: 'Se carga mediante el cable USB-C incluido. La batería dura hasta 2 horas de uso continuo. El LED indicador se apaga cuando está cargado.' },
  { q: '¿Cómo limpio el dispositivo?', a: 'Limpialo con un paño suave ligeramente húmedo después de cada uso. No sumergir en agua.' },
  { q: '¿Puedo usarlo si tengo implantes dentales?', a: 'Sí, el modo EMS es seguro para personas con implantes dentales. Si tenés dudas, consultá con tu médico.' },
  { q: '¿Duele usarlo?', a: 'No. La tecnología es no invasiva. El modo EMS puede sentirse como un leve hormigueo, completamente normal y seguro.' },
  { q: '¿El dispositivo viene con los 3 colores?', a: 'Sí, el dispositivo incluye las 3 luces LED (roja, azul y verde) más los modos EMS y Calor.' },
  { q: '¿Es apto para todo tipo de piel?', a: 'Sí, el dispositivo es apto para todo tipo de piel. Las 3 luces permiten personalizar el tratamiento según tus necesidades.' },
  { q: '¿Puedo usarlo tanto en cara como en cuello?', a: 'Sí, está diseñado específicamente para usarse en cara, cuello, mandíbula y zona del escote.' },
  { q: '¿Cuánto tarda en llegar mi pedido?', a: 'Hacemos envíos a todo el territorio argentino. El tiempo estimado es de 3 a 7 días hábiles con seguimiento incluido.' },
  { q: '¿Puedo devolver mi pedido si no estoy satisfecha/o?', a: 'Sí, ofrecemos devolución sin preguntas dentro de los 90 días. Si no quedás satisfecha/o, te reembolsamos el 100%.' },
];

/* Antes & Después carousel data */
export const beforeAfterData = [
  {
    name: 'María, 47',
    stars: 5,
    src: '//www.luxcove.co/cdn/shop/files/JOWLS_BEFORE_AFTER_1.png?v=1774893491',
    text: 'Lo fui posponiendo porque pensaba que a mi edad ya era demasiado tarde para cualquier cosa que no fuera cirugía. Mi hija finalmente me lo regaló por mi cumpleaños. La definición de mi mandíbula ha vuelto de una forma que no creía posible sin gastar una fortuna en una clínica. Siendo sincera, todavía me sorprende un poco.',
  },
  {
    name: 'Sabrina M., 29',
    stars: 5,
    src: '//www.luxcove.co/cdn/shop/files/DARK_SPOTS_BEFORE_AFTER_1.png?v=1774893533',
    text: 'Ni siquiera lo compré por las manchas oscuras, lo compré para mejorar la firmeza en general. Tengo esta mancha en la mejilla izquierda desde hace unos cinco años. Unas seis semanas después, me vi bajo la luz natural de la ventana y casi no la podía ver.',
  },
  {
    name: 'Laura K., 44',
    stars: 5,
    src: '//www.luxcove.co/cdn/shop/files/WRINKLES_BEFORE_AFTER_1.png?v=1774893605',
    text: 'En 3 semanas de uso, mi piel se ve mucho más firme y luminosa. El modo EMS se siente increíble, como un masaje facial de spa. Ahora es parte de mi rutina nocturna y no puedo imaginarme sin él.',
  },
  {
    name: 'Carmen, 26',
    stars: 5,
    src: 'https://www.luxcove.co/cdn/shop/files/DOUBLE_CHIN_BEFORE_AFTER.png?v=1773947992',
    text: 'Empecé a notar los resultados muy rápido. Mi piel se ve más tersa y las líneas alrededor de mis ojos se suavizaron bastante. Lo uso todas las noches y ya no podría imaginar mi rutina sin él.',
  },
  {
    name: 'Patricia, 49',
    stars: 5,
    src: 'https://www.luxcove.co/cdn/shop/files/DARK_CIRCLES_BEFORE_AFTER_df309dcd-9faa-44d2-b5d2-5f6dab5c82c8.png?v=1774893691',
    text: 'Tenía mucha flacidez en el cuello y la zona mandibular. Después de un mes de uso constante, la diferencia es increíble. Varias amigas me preguntaron si me hice algo porque me veía diferente.',
  },
  {
    name: 'Claudia, 35',
    stars: 5,
    src: 'https://www.luxcove.co/cdn/shop/files/ROSACEA_BEFORE_AFTER.png?v=1773948185',
    text: 'Compré varios dispositivos antes y ninguno me dio resultados. Este es diferente. La combinación de luces LED con el modo EMS se nota de verdad. Mi piel tiene más brillo y está más firme.',
  },
];

/* `sizes` del antes/después: lo comparten <SafeImg> y la precarga para que
   ambos elijan el mismo candidato del srcset. */
export const BA_SIZES = 'min(760px, 100vw)';

/* Videos — "Inspírate": pegá la URL del video en cada src */
export const VSTRIP_VIDEOS = [
  { src: 'https://www.luxcove.co/cdn/shop/videos/c/vp/a4204c7a612747989f855bd1662c3b33/a4204c7a612747989f855bd1662c3b33.HD-1080p-4.8Mbps-37186891.mp4?v=0', benefit: 'Lifting visible en 2 semanas' },
  { src: 'https://www.luxcove.co/cdn/shop/videos/c/vp/683529d2fa31496bafe16b7eba0f60ab/683529d2fa31496bafe16b7eba0f60ab.HD-1080p-2.5Mbps-53051219.mp4?v=0', benefit: 'Piel más firme y luminosa' },
  { src: 'https://www.luxcove.co/cdn/shop/videos/c/vp/a0469d5c274d415588e69875520ae50a/a0469d5c274d415588e69875520ae50a.HD-1080p-2.5Mbps-53052098.mp4?v=0', benefit: 'Mandíbula más definida' },
];

/* Reseñas foto post "Cómo usarlo" */
export const photoReviews = [
  {
    img: '//www.luxcove.co/cdn/shop/files/1_79630330-2c1a-43d4-b335-e7576b1155d6.png?v=1733341034',
    stars: 5,
    text: '"Llevo 3 semanas usando el Escultor LED y ya noto la diferencia. Mi piel está más firme, el cuello se ve más definido y recibo cumplidos todos los días. ¡Lo recomiendo a todas!"',
    name: 'Valentina R.',
  },
  {
    img: '//www.luxcove.co/cdn/shop/files/3_5dffbb28-be19-4fd6-9cf3-84c86808c281.png?v=1733341048',
    stars: 5,
    text: '"Nunca pensé que iba a ver resultados tan rápido. Mis líneas de expresión casi no se ven y mi mandíbula está mucho más definida. Es como tener un spa en casa."',
    name: 'Florencia M.',
  },
  {
    img: '//www.luxcove.co/cdn/shop/files/2_75a76c65-9f69-4fce-9a14-cfbe58c3ce8a.png?v=1733341040',
    stars: 5,
    text: '"Compré varios aparatos antes y ninguno me dio resultados. Este es completamente diferente. La diferencia en mi piel es increíble, mis amigas no lo pueden creer."',
    name: 'Daniela G.',
  },
  {
    img: '//www.luxcove.co/cdn/shop/files/Untitled_design_-_2024-08-10T173355.153_bbc4b909-ebe6-4d8c-b6da-3c98689bfa93.png?v=1723307775',
    stars: 5,
    text: '"Lo uso todas las noches mientras veo la tele y ya es parte de mi rutina. Mi piel nunca estuvo tan luminosa y firme. ¡Vale cada peso invertido!"',
    name: 'Analía P.',
  },
];

// S7–S9 — Bloques de modo (GIF + texto). `tone` elige el fondo de la sección
// y `reverse` invierte el orden imagen/texto en desktop.
const featGif = (file, v) => {
  const base = `//www.luxcove.co/cdn/shop/files/${file}?v=${v}`;
  return {
    src: `${base}&width=750`,
    srcSet: [360, 535, 750].map((w) => `${base}&width=${w} ${w}w`).join(', '),
  };
};

export const FEATURE_BLOCKS = [
  {
    id: 'ems',
    tone: 'white',
    alt: 'Modo EMS',
    ...featGif('GIF1-LFS-ezgif.com-video-to-gif-converter.gif', 1753723012),
    title: 'Conseguí un lifting facial instantáneo en casa.',
    paragraphs: [
      'Nuestro modo EMS avanzado (Estimulación Muscular Eléctrica) estimula los músculos faciales, favoreciendo una apariencia más firme y tonificada.',
      'Decile adiós a la piel flácida, la papada, el cuello de pavo y la doble mentón.',
    ],
  },
  {
    id: 'roja',
    tone: 'pink',
    reverse: true,
    alt: 'Luz roja',
    ...featGif('LFS-GIF31-ezgif.com-video-to-gif-converter.gif', 1753723174),
    title: 'Suavizá las líneas finas y las arrugas.',
    paragraphs: [
      'Nuestro modo de luz roja estimula la producción de colágeno para suavizar las líneas de expresión, mejorar la textura de la piel y aumentar su elasticidad para lograr un brillo juvenil.',
    ],
  },
  {
    id: 'verde',
    tone: 'white',
    alt: 'Luz verde',
    ...featGif('LFS-GIF3-ezgif.com-video-to-gif-converter.gif', 1753723244),
    title: 'Unificá el tono y la textura de la piel.',
    paragraphs: [
      'Nuestro modo de luz verde actúa sobre la producción excesiva de melanina, reduciendo la hiperpigmentación y atenuando las manchas oscuras para un tono de piel más claro y uniforme.',
    ],
  },
];
