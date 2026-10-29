/* Datos de la landing de la Depiladora IPL (sin JSX). Los textos y URLs se
   editan acá; las secciones en sections/ solo los renderizan. */
/* ── Constantes ───────────────────────────────────────────── */
export const PRODUCT_SLUG   = 'Depiladora Permanente IPL En casa';
export const CHECKOUT_NAME  = 'Depiladora IPL Profesional';
export const DEFAULT_PRICE  = 88900;
export const DEFAULT_COMPARE = 189000;

// 🖼 Imágenes del bundle — reemplazá con tus URLs
export const BUNDLE_PRODUCT_IMG = "https://pbs.twimg.com/media/HLTKZJmXwAAfbK5?format=jpg&name=small";
export const BUNDLE_RAZOR_IMG   = "https://acdn-us.mitiendanube.com/stores/006/731/084/products/chatgpt-image-3-jun-2026-14_48_12-b49e057d39ac8d5a9917805092514062-1024-1024.webp";
export const BUNDLE_EBOOK_IMG   = "https://nextcell.com.ar/wp-content/uploads/2026/02/D_NQ_NP_2X_736057-MLA54551293127_032023-F.webp";

// ✏️ Textos debajo de cada imagen del bundle
export const BUNDLE_PRODUCT_NAME = "Depiladora IPL";
export const BUNDLE_RAZOR_NAME   = "Depiladora De Cejas De Regalo";
export const BUNDLE_EBOOK_NAME   = "Depiladora 4en1";

/* Announcement bar */
export const annMsgs = [
  '🔴 ¡OFERTA RELÁMPAGO ACTIVA!',
  '🚚 ENVÍO GRATIS EN TODOS LOS PEDIDOS',
  '⭐ +10.000 CLIENTAS SATISFECHAS',
  '💰 GARANTÍA DE DEVOLUCIÓN 90 DÍAS',
];

/* Beneficios hero */
export const BENEFITS = [
  'Sin dolor — tecnología de luz pulsada intensa',
  'Resultados visibles desde la sesión 3 (~3 semanas)',
  '80% menos vello en solo 6 sesiones',
  'Piernas, axilas, bikini, brazos, bozo y mentón',
  '5 niveles de intensidad para todo tipo de piel',
  'Ahorrás cientos de dólares en depilación profesional',
];

/* Accordion */
export const PRODUCT_TABS = [
  {
    key: 'detalles',
    title: 'Detalles del producto',
    content: [
      'La Depiladora IPL de Amelor usa tecnología de Luz Pulsada Intensa para actuar directamente sobre el folículo piloso, debilitándolo progresivamente hasta eliminar el crecimiento del vello de forma permanente.',
      'Con 5 niveles de intensidad ajustables, podés personalizar el tratamiento según tu tipo de piel y zona del cuerpo. Funciona en piernas, axilas, bikini, brazos, bozo y mentón.',
      'El kit incluye afeitadora eléctrica para preparar la zona antes de cada sesión, gafas protectoras certificadas y adaptador de corriente.',
    ],
  },
  {
    key: 'resultados',
    title: '¿Cuándo veo resultados?',
    content: [
      'Desde la sesión 3 (≈3 semanas de uso), notarás reducción visible del vello y un crecimiento más lento y fino.',
      'Al completar 6 sesiones (~6 semanas), la mayoría de las usuarias reporta una reducción del 70–80% del vello en las zonas tratadas.',
      'Para mejores resultados: sesiones cada 2 semanas durante las primeras 6 sesiones, luego mantenimiento mensual o cuando notes nuevo crecimiento.',
    ],
  },
  {
    key: 'seguro',
    title: '¿Es seguro?',
    content: [
      'Sí. La tecnología IPL doméstica es completamente segura cuando se usa siguiendo las instrucciones. Siempre usá las gafas protectoras incluidas durante el tratamiento.',
      'No recomendado para pieles muy oscuras (Fitzpatrick VI) ni para zonas muy cercanas a los ojos. Consultá el manual completo antes del primer uso.',
    ],
  },
  {
    key: 'garantia',
    title: 'Garantía y envíos',
    content: [
      'Ofrecemos devoluciones por 90 días y garantía de 1 año. Si no quedás satisfecha/o, te devolvemos el dinero sin preguntas.',
      'Enviamos a todo el territorio argentino con seguimiento incluido. Tiempo estimado: 3 a 7 días hábiles.',
    ],
  },
];

/* Hero inline reviews */
export const heroReviews = [
  { name: 'Valentina C.', avatar: '//www.luxcove.co/cdn/shop/files/the-face-of-a-40-year-old-woman.png?v=1739893013', stars: 5, text: 'Estoy sorprendida. Los resultados son increíbles a tan bajo costo. Calculo que en 3 meses no voy a tener nada. Sin dolor. No duden en comprar.' },
  { name: 'Florencia M.', avatar: '//www.luxcove.co/cdn/shop/files/feeling-cute-today-25-v0-wiakf8p.png?v=1739893136', stars: 5, text: 'Es la segunda vez que compro este producto. Para mí es sensacional, práctico, cómodo y de excelente resultado. Ya no gasto en cera.' },
  { name: 'Daniela G.', avatar: '//www.luxcove.co/cdn/shop/files/8713e5a4996b69964a57527507ac53ed.png?v=1739892933', stars: 5, text: 'Practicamente tenia barba y ahora que me depilo tarda 4 dias que es un monton. Resultado rapido. Sin dolor. Económico.' },
];

/* Comparativa con tabs */
export const COMP_PRODUCT_IMG = "https://lummia.com.co/cdn/shop/files/gempages_492674466489303942-5eb0c882-6441-4c5f-be58-70233fe427a6.webp?v=1741388066&width=600"; // reemplazá con imagen real de la depiladora IPL
export const COMP_TABS = [
  {
    id: 'otras', label: 'Otras marcas', competitorImg: 'https://media.glamour.es/photos/698b1cd03fb8e7c4414fe31e/3:4/w_748%2Cc_limit/Tria_4X_Hair_Removal_Laser_1.jpg',
    points: [
      { bad: '5 niveles de intensidad',         good: '8 niveles de intensidad' },
      { bad: 'Sin pantalla y poco intuitiva',   good: 'Con pantalla LED y fácil de usar' },
      { bad: '+45 minutos por sesión',           good: 'Solo 15 minutos por sesión' },
      { bad: 'Materiales de mala calidad',       good: 'Robusta y con garantía de fábrica' },
      { bad: '500.000 disparos',                 good: '1.000.000 disparos — 20 años de vida útil' },
    ],
  },
  {
    id: 'laser', label: 'Láser', competitorImg: 'https://lummia.com.co/cdn/shop/files/gempages_492674466489303942-32a5bf71-9790-4151-9b59-49b8021d5411.webp?v=1741387678&width=600',
    points: [
      { bad: 'Tenés que ir al centro de estética', good: 'Hacé tu sesión desde tu casa' },
      { bad: '1 sesión cada 4–6 semanas',           good: 'Hacé sesiones cuando quieras' },
      { bad: 'Costo muy elevado',                    good: 'Bajo costo, única compra' },
      { bad: 'Dolorosas y sin privacidad',           good: 'Sin dolor y con total intimidad' },
      { bad: 'Si viajás, perdés el tratamiento',     good: 'Llevala a donde vayas' },
    ],
  },
  {
    id: 'rastrillo', label: 'Rastrillo', competitorImg: 'https://lummia.com.co/cdn/shop/files/gempages_492674466489303942-0eb8947a-43ca-486a-861e-9b347697f6ea.webp?v=1741386584&width=600',
    points: [
      { bad: 'Rasurarse constantemente',                  good: 'No te rasurarás nunca más' },
      { bad: 'Cortes, irritación y pelos encarnados',     good: 'Sin dolor y sin irritación' },
      { bad: 'Gasto recurrente todos los meses',          good: 'Ahorrás mucho más a largo plazo' },
      { bad: 'Contamina el medioambiente',                good: 'Sin desechos y ecoamigable' },
      { bad: 'Difícil conseguir un corte a ras',          good: 'Piel suave y sedosa, siempre' },
    ],
  },
  {
    id: 'cera', label: 'Cera', competitorImg: 'https://lummia.com.co/cdn/shop/files/gempages_492674466489303942-1cb94be2-fc2f-4bf1-9838-db900ce5aac9.webp?v=1741387601&width=600',
    points: [
      { bad: 'Maltrata mucho tu piel',               good: 'Completamente libre de dolor' },
      { bad: 'Gasto recurrente de por vida',          good: 'Una única compra para siempre' },
      { bad: 'Requiere turno o kit engorroso',        good: 'Muy fácil de usar, sin líos' },
      { bad: 'Tenés que depilarte cada semana',       good: 'Olvidate del vello para siempre' },
      { bad: 'Muchas compras y desechos',             good: 'Una única compra, sin desechos' },
    ],
  },
];

/* ── Progreso semana a semana por zona corporal ────── */
// 🖼 Reemplazá beforeSrc/afterSrc con fotos reales de antes/después de cada zona
export const ZONE_TABS = [
  {
    id: 'piernas', label: 'Piernas', emoji: '🦵',
    problem: 'El área más grande — responde bien desde la semana 3',
    beforeSrc: "https://myshinnyskin.com/cdn/shop/files/Piernas_antes_v4_800x.png?v=1762967695",
    afterSrc:  "https://myshinnyskin.com/cdn/shop/files/Piernas_despues_v4_800x.png?v=1762967695",
  },
  {
    id: 'axilas', label: 'Axilas', emoji: '✨',
    problem: 'Zona pequeña — respuesta más rápida y visible',
    beforeSrc: "https://myshinnyskin.com/cdn/shop/files/Axila_antes_v4_800x.png?v=1762967695",
    afterSrc:  "https://myshinnyskin.com/cdn/shop/files/Axila_despues_v4_800x.png?v=1762967695",
  },
  {
    id: 'bikini', label: 'Bikini', emoji: '👙',
    problem: 'Zona sensible — sin dolor, sin pelos encarnados',
    beforeSrc: "https://myshinnyskin.com/cdn/shop/files/Bikini_antes_v4_800x.png?v=1762967695",
    afterSrc:  "https://myshinnyskin.com/cdn/shop/files/Bikini_despues_v4_800x.png?v=1762967695",
  },
  {
    id: 'cara', label: 'Cara', emoji: '🫦',
    problem: 'Bozo, mentón, patillas — sin dolor y sin sombra',
    beforeSrc: "https://myshinnyskin.com/cdn/shop/files/Cara_antes_v4_800x.png?v=1762967695",
    afterSrc:  "https://myshinnyskin.com/cdn/shop/files/Cara_despues_v4_800x.png?v=1762967695",
  },
  {
    id: 'brazos', label: 'Brazos', emoji: '💪',
    problem: 'Brazos y antebrazos — piel suave para siempre',
    beforeSrc: "https://myshinnyskin.com/cdn/shop/files/Brazos_antes_v4_800x.png?v=1762967695",
    afterSrc:  "https://myshinnyskin.com/cdn/shop/files/Brazos_despues_v4_800x.png?v=1762967695",
  },
  {
    id: 'abdomen', label: 'Abdomen', emoji: '🌟',
    problem: 'Perfecta para el verano — la línea del ombligo',
    beforeSrc: "https://myshinnyskin.com/cdn/shop/files/Abdomen_antes_v4_800x.png?v=1762967695",
    afterSrc:  "https://myshinnyskin.com/cdn/shop/files/Abdomen_despues_v4_800x.png?v=1762967695",
  },
];

/* Pasos */
export const STEPS = [
  { num: '1', title: 'Rasura', desc: 'Esto permite que la luz llegue directo a la raíz del vello, asegurando resultados.', img: 'https://myshinnyskin.com/cdn/shop/files/Rasura.png?v=1762974154' },
  { num: '2', title: 'Depila', desc: 'La luz láser IPL debilita el folículo para que cada vez crezca menos vello hasta eliminarlo.', img: 'https://myshinnyskin.com/cdn/shop/files/Depila_clasica.png?v=1762974320' },
  { num: '3', title: 'Repite', desc: 'Sé constante y ve cómo mejora el aspecto de tu piel y se elimina el vello para siempre.', img: 'https://myshinnyskin.com/cdn/shop/files/Repite.png?v=1762974402' },
];

/* Videos strip — reemplazá cada src con tu video real de resultados IPL */
export const VSTRIP_VIDEOS = [
  { src: 'https://cdn.shopify.com/videos/c/vp/dcf0ea96e01a456bb397cabaab7e72e9/dcf0ea96e01a456bb397cabaab7e72e9.HD-720p-4.5Mbps-61798509.mp4', benefit: 'Sin dolor, desde el primer uso' },
  { src: 'https://cdn.shopify.com/videos/c/vp/51361e4133b948aa93d2c89daf449dfa/51361e4133b948aa93d2c89daf449dfa.HD-720p-2.1Mbps-61798513.mp4', benefit: 'Vello notablemente reducido en semanas' },
  { src: 'https://cdn.shopify.com/videos/c/vp/66ade865f1b14048a6780da0ed6ff8ca/66ade865f1b14048a6780da0ed6ff8ca.HD-720p-3.0Mbps-61798511.mp4', benefit: 'Piel lisa sin pelos encarnados' },
];

/* Reseñas — reemplazá reviewImg con la foto real de cada clienta */
export const REVIEWS = [
  {
    name: 'Jessica S.',
    stars: 5,
    reviewImg: 'https://images.loox.io/uploads/2024/9/11/e1xjtD-VD_mid.jpg',
    text: 'No tengo fotos del antes y después. Pero me encantó, recomiendo el producto al 100%. En áreas como el rostro en específico el bigote, desapareció desde la segunda semana. Los brazos se ha eliminado en un 90% el vello; piernas vamos al 50% y apenas voy en mi semana 8 🤩 He tenido dudas durante el proceso y siempre me atienden de buena manera.',
  },
  {
    name: 'Gabriela T.',
    stars: 5,
    reviewImg: 'https://images.loox.io/uploads/2023/5/3/Njzqz9myv_mid.jpg',
    text: 'Quiero compartir mi experiencia, al principio dudé, pero todo el proceso fue seguro y rápido, al tercer día ya tenía mi paquete. Llevo un mes y medio usándola y el vello tarda 5 días en crecer actualmente y crece más delgado. Algunas zonas ya no crecen. ¡Estoy muy satisfecha!',
  },
  {
    name: 'Angela R.',
    stars: 5,
    reviewImg: 'https://images.loox.io/uploads/2023/10/25/ShF_wb1Td_mid.jpg',
    text: 'No tenía mucha fe al principio por miedo a que no fueran reales los resultados prometidos pero con el tiempo que tengo me asombré de lo útil y económico. ¡Lo recomiendo muchísimo!',
  },
  {
    name: 'Alondra C.',
    stars: 5,
    reviewImg: 'https://images.loox.io/uploads/2023/6/13/W3KqgsE77_mid.jpg',
    text: 'Llevo un mes y una semana usándola, he visto cambios pero todavía me sale el bellito aunque tarda más en salir. También tenía muchos granitos en las piernas y con la máquina poco a poco se me están quitando. La recomiendo.',
  },
  {
    name: 'Mariana C.',
    stars: 5,
    reviewImg: 'https://images.loox.io/uploads/2022/3/22/4yweLfmf3_mid.jpg',
    text: 'La empecé a utilizar hace cinco semanas aproximadamente y en las piernas ya casi no me salen, se tardan casi una semana o un poco más. En mi caso las zonas más rebeldes han sido el bikini y las axilas, pero aún así se nota menos vello corporal.',
  },
];

/* FAQ */
export const faqs = [
  { q: '¿Cuándo veo resultados?', a: 'Desde la sesión 3 (≈3 semanas) notarás reducción visible del vello y crecimiento más lento. La reducción máxima del 70–80% se logra al completar las 6 sesiones iniciales (~6 semanas).' },
  { q: '¿Duele usarla?', a: 'No. A diferencia de la cera, el IPL no arranca el vello. Algunos usuarios sienten un leve calor en los niveles más altos, completamente tolerable.' },
  { q: '¿Para qué zonas del cuerpo funciona?', a: 'Piernas, axilas, bikini, brazos, bozo y mentón. No usar cerca de los ojos ni en el cuero cabelludo.' },
  { q: '¿Cuánto tiempo lleva cada sesión?', a: 'Axilas ~3 min, piernas enteras ~20 min. Con práctica, cuerpo completo en 30–45 minutos.' },
  { q: '¿Es apta para todo tipo de piel?', a: 'Funciona mejor en pieles claras a medias con vello oscuro. No se recomienda para pieles muy oscuras (Fitzpatrick VI) ni para vello muy claro o canoso.' },
  { q: '¿Cuántos pulsos tiene?', a: 'Más de 999.999 pulsos — equivale a años de uso. Con mantenimiento mensual, el dispositivo dura prácticamente de por vida.' },
  { q: '¿Cada cuánto tengo que usarla?', a: 'Primeras 6 sesiones: cada 2 semanas. Después: mantenimiento 1 vez al mes o cuando notes nuevo crecimiento.' },
  { q: '¿Puedo usarla en la zona del bikini?', a: 'Sí, está diseñada para la zona del bikini. Empezá con nivel bajo y aumentá según tu tolerancia. Evitá zonas muy sensibles.' },
  { q: '¿Qué incluye el kit?', a: 'Depiladora IPL + afeitadora eléctrica con hojas de acero + gafas protectoras + adaptador de corriente. Todo lo que necesitás desde el primer día.' },
  { q: '¿Necesito gafas protectoras?', a: 'Sí, siempre usá las gafas incluidas durante el tratamiento. El flash IPL es muy intenso y puede dañar la vista sin protección.' },
  { q: '¿Cuánto tarda en llegar?', a: 'Enviamos a todo el territorio argentino. Tiempo estimado: 3 a 7 días hábiles con seguimiento incluido.' },
  { q: '¿Puedo devolver si no me convence?', a: 'Sí, ofrecemos devolución sin preguntas dentro de los 90 días. Si no quedás satisfecha/o, te reembolsamos el 100%.' },
];

/* Galería de respaldo si el producto no tiene imágenes en la BD */
export const FALLBACK_IMAGES = [
  { src: 'https://pbs.twimg.com/media/HLTHxJ3XMAEJAU4?format=jpg&name=small', alt: 'Depiladora IPL — vista principal' },
  { src: 'https://pbs.twimg.com/media/HKgHfXqWgAApELS?format=jpg&name=large', alt: 'Depiladora IPL — uso en piernas' },
  { src: 'https://myshinnyskin.com/cdn/shop/files/3_a3c66998-a4ec-4c3c-a8aa-8d7cb0fde62c.png?v=1775490312&width=900', alt: 'Depiladora IPL — kit completo' },
  { src: 'https://myshinnyskin.com/cdn/shop/files/5_782843b2-6902-4f3d-83fc-27f1a9dbc644.png?v=1775490312&width=900', alt: 'Depiladora IPL — niveles de intensidad' },
  { src: 'https://pbs.twimg.com/media/HKgH8ehXcAA7xW4?format=jpg&name=large', alt: 'Depiladora IPL — vista principal' },
  { src: 'https://pbs.twimg.com/media/HKgH9poWIAA14c2?format=jpg&name=large', alt: 'Depiladora IPL — uso en piernas' },
  { src: 'https://pbs.twimg.com/media/HKgIUx_WAAA80i6?format=jpg&name=large', alt: 'Depiladora IPL — kit completo' },
  { src: 'https://pbs.twimg.com/media/HKgIhvjWsAEnBjq?format=jpg&name=large', alt: 'Depiladora IPL — niveles de intensidad' },
];

/* Bloques de texto + imagen (S5–S7) */
export const FEATURE_BLOCKS = [
  {
    background: '#fff',
    img: 'https://pbs.twimg.com/media/HKf3n8RWQAQx12B?format=jpg&name=small',
    alt: 'Depiladora IPL en uso',
    kicker: '🔄 SE ACABÓ EL CICLO',
    title: 'Cera, esperá, vuelve a salir, cera de nuevo ¿y si esta fuera la última vez?',
    paragraphs: [
      'Depilarte con cera o cuchilla no resuelve nada, solo pausa el problema un par de semanas. La IPL actúa sobre la raíz del folículo, así que cada sesión te acerca a un resultado que dura.',
      'No es que hagas algo mal — es que nunca tuviste la herramienta correcta.',
    ],
  },
  {
    background: 'var(--ipl-section-rose)',
    img: 'https://cld.accentuate.io/7054457438389/1658770290456/ROSE-SKIN_326.jpg?v=1764772816782&options=w_512',
    alt: 'Depiladora IPL sin dolor',
    kicker: '✨ SIN DOLOR',
    title: 'Olvidate del dolor de la cera. Para siempre.',
    paragraphs: [
      'La tecnología IPL no arranca el vello — actúa sobre la raíz con pulsos de luz suaves. Sin tirones, sin irritación, sin pelos encarnados.',
      'Resultados visibles desde la sesión 3. Sin citas, sin traslados, sin apuros.',
    ],
  },
  {
    background: '#fff',
    img: 'https://pbs.twimg.com/media/HKf5PG4XEAAF_95?format=jpg&name=small',
    alt: 'Depiladora IPL para todo el cuerpo',
    kicker: '🛡️ CERO RIESGO',
    title: 'Probalo en tu casa. Si no funciona, te devolvemos tu plata.',
    paragraphs: [
      'Tenés 90 días desde que lo recibís para comprobarlo vos misma. Si lo usaste y no notaste resultados, reembolso del 100%, sin letra chica. Envío gratis a todo el país y hasta 3 cuotas sin interés.',
    ],
  },
];
