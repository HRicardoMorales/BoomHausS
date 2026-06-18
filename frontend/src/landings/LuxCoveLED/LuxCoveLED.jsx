import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckoutSheet } from '../../pages/CheckoutSheet';
import { useCart } from '../../context/CartContext';
import { track } from '../../lib/metaPixel';
import api from '../../services/api';
import './LuxCoveLED.css';

/* ── Constantes ───────────────────────────────────────────── */
const PRODUCT_SLUG = 'escultor-led';
const CHECKOUT_NAME = 'Escultor Facial LED 3 en 1';
const DEFAULT_PRICE = 39900;
const DEFAULT_COMPARE = 115000;

// 🖼 Imágenes del bundle — reemplazá con tus URLs
const BUNDLE_PRODUCT_IMG  = "https://pbs.twimg.com/media/HKF3r-fWwAAD87X?format=jpg&name=small";
const EBOOK_IMG           = "https://pbs.twimg.com/media/HKF3ODKWEAAqpdo?format=jpg&name=small";

// ✏️ Textos debajo de cada imagen del bundle
const BUNDLE_PRODUCT_NAME = "Escultor LED";
const BUNDLE_EBOOK_NAME   = "eBook de rutinas";

// 🎁 Configuraciones de campaña — una entrada por campaña de publicidad
// Uso: /lp/escultor-led?regalo=masajeador  /lp/escultor-led?regalo=espatula  etc.
// - img:     imagen del producto de regalo en el bundle
// - name:    nombre del producto de regalo
// - heroImg: (opcional) reemplaza la imagen principal del hero para esa campaña. null = imagen por defecto
const GIFT_CONFIGS = {
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
const annMsgs = [
  '🔴 ¡OFERTA RELÁMPAGO ACTIVA!',
  '🚚 ENVÍO GRATIS EN TODOS LOS PEDIDOS',
  '⭐ +10.000 CLIENTES SATISFECHOS',
  '💰 GARANTÍA DE DEVOLUCIÓN 90 DÍAS',
];

const FOR_WHOM = [
  'Querés reducir la papada o la flaccidez sin gastar en clínicas',
  'Usás sérums y cremas pero no ves resultados reales',
  'Tenés acné, poros grandes o piel sin brillo',
  'Querés redefinir tu rostro y verte mejor sin depender de nadie',
];

/* C4 — Accordion tabs con key para matching de íconos */
const PRODUCT_TABS = [
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

/* C4 — Accordion icons (4 para los 4 tabs) */
const accordionIcons = [
  <svg key="clip" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="4" y="3" width="12" height="15" rx="1.5" /><path d="M7 3V2a1 1 0 012 0v1h2V2a1 1 0 012 0v1" /><line x1="7" y1="8" x2="13" y2="8" /><line x1="7" y1="11" x2="13" y2="11" /><line x1="7" y1="14" x2="10" y2="14" /></svg>,
  <svg key="clock" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="10" cy="10" r="7" /><polyline points="10,6 10,10 13,12" /></svg>,
  <svg key="heart" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M10 16s-7-4.5-7-9a4 4 0 018 0 4 4 0 018 0c0 4.5-7 9-7 9z" /></svg>,
  <svg key="shield" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M10 2l7 3v5c0 4-3 7-7 8-4-1-7-4-7-8V5l7-3z" /><polyline points="7,10 9,12 13,8" /></svg>,
];

/* C5 — Hero inline reviews */
const heroReviews = [
  { name: 'Verónica C.', avatar: '//www.luxcove.co/cdn/shop/files/the-face-of-a-40-year-old-woman.png?v=1739893013', stars: 5, text: 'No estaba segura de este aparato, pero después de usarlo unas pocas veces, mi rostro y mandíbula se ven más definidos. ¡Mi piel se siente más firme!' },
  { name: 'Romina S.', avatar: '//www.luxcove.co/cdn/shop/files/feeling-cute-today-25-v0-wiakf8p.png?v=1739893136', stars: 5, text: '¡Los resultados son increíbles! Mi piel se ve más luminosa y firme desde la primera semana.' },
  { name: 'Jesica K.', avatar: '//www.luxcove.co/cdn/shop/files/8713e5a4996b69964a57527507ac53ed.png?v=1739892933', stars: 5, text: 'Tenía mis dudas, pero mis líneas de expresión se suavizaron y mi mandíbula luce más definida. ¡Recibo muchísimos cumplidos!' },
];

/* C6 — Stats para círculos animados */
const statsData = [
  { pct: 90, text: <>Clientas que notaron <strong>reducción visible de papada</strong> en las primeras 4 semanas.</> },
  { pct: 89, text: <>Dicen que sus <strong>líneas de expresión se suavizaron</strong> usando el Escultor LED.</> },
  { pct: 85, text: <>Reportan <strong>mejora significativa</strong> en tono y textura de piel.</> },
  { pct: 92, text: <>Lo <strong>recomendarían a una amiga</strong> o familiar sin dudarlo.</> },
];

/* Features — reemplazá cada src con la URL de tu ícono */
const FEATURES = [
  { src: '//www.luxcove.co/cdn/shop/files/1_c3ca10bf-3c36-44dc-b12e-e9188af4728e.png?v=1723298248', title: 'Nivel profesional', desc: 'Resultados de clínica, desde tu casa.' },
  { src: '//www.luxcove.co/cdn/shop/files/2_8fe3211c-e4d9-487b-bd6a-5315d7204b5e.png?v=1723298321', title: 'Resultados duraderos', desc: 'Más colágeno, piel más firme y renovada con el uso continuo.' },
  { src: '//www.luxcove.co/cdn/shop/files/3_5f51b942-e250-4831-8c25-d2a8108af37a.png?v=1723298339', title: 'Solo 10-15 min por día', desc: 'Sin complicaciones. Usalo mientras ves la tele o antes de dormir.' },
  { src: '//www.luxcove.co/cdn/shop/files/Untitled_design_-_2024-08-10T150022.576.png?v=1723298445', title: 'Garantía 90 días', desc: 'Si no quedás satisfecha/o, te devolvemos el dinero. Sin preguntas.' },
];

/* C7 — Mini reviews data */
const reviewsData = [
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
const lights = [
  { src: '//www.luxcove.co/cdn/shop/files/LUX_COVE_1.png?v=1723311444', color: '#FF4444', name: 'LUZ ROJA', nm: '630 nm', desc: 'Más colágeno, menos arrugas. Tu sérum penetra el doble. Piel más firme con cada uso.', border: false },
  { src: '//www.luxcove.co/cdn/shop/files/LUX_COVE_2.png?v=1723311580', color: '#4444FF', name: 'LUZ AZUL', nm: '415 nm', desc: 'Combate el acné activo y baja la inflamación. Sin irritar. Para piel joven o sensible.', border: false },
  { src: '//www.luxcove.co/cdn/shop/files/LUX_COVE_3.png?v=1723311771', color: '#44AA44', name: 'LUZ VERDE', nm: '525 nm', desc: 'Manchas reducidas, poros más cerrados, tono uniforme. Luminosidad que se nota sin filtros.', border: false },
  { src: '//www.luxcove.co/cdn/shop/files/9_ec8cb23b-11a8-4c0e-aef4-c93ac7971a89.png?v=1733574060', color: '#FF6600', name: 'MODO EMS', nm: null, desc: 'Tonificá los músculos faciales. Papada, cuello y mandíbula más definidos.', border: false },
  { src: '//www.luxcove.co/cdn/shop/files/10_933f78a5-a30e-43c1-b96d-57b02685bdae.png?v=1733574060', color: '#FF3366', name: 'MODO CALOR', nm: null, desc: 'Abrí los poros para que tus productos penetren mejor. Usalo antes del modo rojo.', border: false },
  { src: '//www.luxcove.co/cdn/shop/files/11_d559de47-ad6d-484e-9f09-45e1147e439e.png?v=1733574060', color: '#64B5F6', name: 'MODO LIMPIO', nm: null, desc: 'Desincrusta células muertas y exceso de sebo. Poros más limpios y menos visibles.', border: false },
];

/* C9 — Comparison rows */
const compRows = [
  'Desarrollado por expertos en cuidado de piel.',
  'Resultados de nivel profesional.',
  '3 tipos de luces LED diferentes.',
  'Garantía devolución 90 días.',
  'Tecnología EMS para tonificar músculos.',
  'Modo Calor para producción de colágeno.',
];

const STEPS = [
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
const faqs = [
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
const beforeAfterData = [
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

/* GIFs de secciones de features — precargados al montar */
const FEAT_GIFS = [
  '//www.luxcove.co/cdn/shop/files/GIF1-LFS-ezgif.com-video-to-gif-converter.gif?v=1753723012&width=750',
  '//www.luxcove.co/cdn/shop/files/LFS-GIF31-ezgif.com-video-to-gif-converter.gif?v=1753723174&width=750',
  '//www.luxcove.co/cdn/shop/files/LFS-GIF3-ezgif.com-video-to-gif-converter.gif?v=1753723244&width=750',
];

/* Videos — "Inspírate": pegá la URL del video en cada src */
const VSTRIP_VIDEOS = [
  { src: 'https://www.luxcove.co/cdn/shop/videos/c/vp/a4204c7a612747989f855bd1662c3b33/a4204c7a612747989f855bd1662c3b33.HD-1080p-4.8Mbps-37186891.mp4?v=0', benefit: 'Lifting visible en 2 semanas' },
  { src: 'https://www.luxcove.co/cdn/shop/videos/c/vp/683529d2fa31496bafe16b7eba0f60ab/683529d2fa31496bafe16b7eba0f60ab.HD-1080p-2.5Mbps-53051219.mp4?v=0', benefit: 'Piel más firme y luminosa' },
  { src: 'https://www.luxcove.co/cdn/shop/videos/c/vp/a0469d5c274d415588e69875520ae50a/a0469d5c274d415588e69875520ae50a.HD-1080p-2.5Mbps-53052098.mp4?v=0', benefit: 'Mandíbula más definida' },
];

/* Reseñas foto post "Cómo usarlo" */
const photoReviews = [
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

/* ── Sub-componentes ──────────────────────────────────────── */
function ImgPlaceholder({ label, style = {} }) {
  return (
    <div className="led-img-placeholder" style={style}>{label}</div>
  );
}

/* C6 — Stats circulares animados (adaptado del masajeador EMS) */
function LedStatsCircles({ items }) {
  const circleRefs = useRef([]);
  const animatedRef = useRef(items.map(() => false));
  const [values, setValues] = useState(() => items.map(() => 0));

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const idx = Number(entry.target.dataset.idx);
          if (animatedRef.current[idx]) return;
          animatedRef.current[idx] = true;
          const target = items[idx].pct;
          let current = 0;
          const step = () => {
            if (current <= target) {
              setValues(prev => {
                const next = [...prev];
                next[idx] = current;
                return next;
              });
              current++;
              requestAnimationFrame(step);
            }
          };
          step();
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.1 }
    );
    circleRefs.current.forEach(el => el && observer.observe(el));
    return () => observer.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="led-sc-section">
      <div className="led-sc-list">
        {items.map((item, i) => (
          <div key={i} className="led-sc-row" ref={el => circleRefs.current[i] = el} data-idx={i}>
            <div className="led-sc-circle" style={{ '--led-sc-pct': `${values[i]}%` }}>
              <span className="led-sc-pct">{values[i]}%</span>
            </div>
            <p className="led-sc-text">{item.text}</p>
          </div>
        ))}
      </div>
      <div className="led-sc-footer">
        <p className="led-sc-footer-note">*Basado en compras verificadas</p>
        <div className="led-sc-footer-stats">
          <div className="led-sc-stat">
            <span className="led-sc-stat-val">+10.000</span>
            <span className="led-sc-stat-lbl">CLIENTES</span>
          </div>
          <div className="led-sc-stat">
            <span className="led-sc-stat-val">4.8/5</span>
            <span className="led-sc-stat-lbl">SATISFACCIÓN</span>
          </div>
          <div className="led-sc-stat">
            <span className="led-sc-stat-val">+5.000</span>
            <span className="led-sc-stat-lbl">RESEÑAS</span>
          </div>
        </div>
      </div>
    </div>
  );
}


/* ── Componente principal ─────────────────────────────────── */
export default function LuxCoveLED() {
  const [searchParams] = useSearchParams();
  // Lee ?regalo=<key> de la URL — si no hay param, usa el primero de GIFT_CONFIGS
  const giftKey = searchParams.get('regalo') || Object.keys(GIFT_CONFIGS)[0];
  const giftConfig = GIFT_CONFIGS[giftKey] || Object.values(GIFT_CONFIGS)[0];
  const REGALO_IMG         = giftConfig.img;
  const BUNDLE_REGALO_NAME = giftConfig.name;

  const [product, setProduct] = useState(null);
  const [productReady, setProductReady] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [openTab, setOpenTab] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [annIdx, setAnnIdx] = useState(0);
  const [annVisible, setAnnVisible] = useState(true);
  const [testIdx, setTestIdx] = useState(0);
  const [slidesPerView, setSlidesPerView] = useState(1);
  const [stickyVisible, setStickyVisible] = useState(false);
  const [hrIdx, setHrIdx] = useState(0);   // hero review
  const [lightIdx, setLightIdx] = useState(0);   // lights carousel
  const [baIdx, setBaIdx] = useState(0);   // before/after carousel
  const [prIdx, setPrIdx] = useState(0);   // photo reviews carousel
  const [selectedBundle, setSelectedBundle] = useState(0);

  const ctaRef = useRef(null);
  const lightsTrackRef = useRef(null);
  const prTouchX = useRef(null);
  const { addItem } = useCart();

  const prHandleTouchStart = (e) => { prTouchX.current = e.touches[0].clientX; };
  const prHandleTouchEnd = (e) => {
    if (prTouchX.current === null) return;
    const diff = prTouchX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) setPrIdx(i => Math.min(i + 1, photoReviews.length - 1));
      else setPrIdx(i => Math.max(i - 1, 0));
    }
    prTouchX.current = null;
  };

  const handleLightsScroll = () => {
    if (!lightsTrackRef.current) return;
    const idx = Math.round(lightsTrackRef.current.scrollLeft / 167);
    setLightIdx(Math.min(idx, lights.length - 1));
  };
  const scrollToLight = (i) => {
    setLightIdx(i);
    lightsTrackRef.current?.scrollTo({ left: i * 167, behavior: 'smooth' });
  };

  /* API fetch */
  useEffect(() => {
    api.get(`/products/slug/${PRODUCT_SLUG}`)
      .then(r => { setProduct(r.data?.data || r.data); setProductReady(true); })
      .catch(() => setProductReady(true));
  }, []);

  /* Precarga imágenes del before/after para que estén listas al instante */
  useEffect(() => {
    beforeAfterData.forEach(item => {
      const img = new window.Image();
      img.src = item.src.startsWith('//') ? `https:${item.src}` : item.src;
    });
  }, []);

  /* Precarga GIFs de features para evitar el blanco mientras cargan */
  useEffect(() => {
    FEAT_GIFS.forEach(src => {
      const img = new window.Image();
      img.src = src.startsWith('//') ? `https:${src}` : src;
    });
  }, []);

  /* Resetea la imagen activa cuando cambia la campaña */
  useEffect(() => { setActiveImg(0); }, [giftKey]);

  /* Slides per view */
  useEffect(() => {
    const update = () => setSlidesPerView(window.innerWidth >= 768 ? 3 : 1);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  /* C1 — Announcement rotation */
  useEffect(() => {
    const t = setInterval(() => {
      setAnnVisible(false);
      setTimeout(() => { setAnnIdx(i => (i + 1) % annMsgs.length); setAnnVisible(true); }, 400);
    }, 3000);
    return () => clearInterval(t);
  }, []);

  /* Sticky bar */
  useEffect(() => {
    if (!productReady || !ctaRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const pastCta = !entry.isIntersecting && entry.boundingClientRect.top < 0;
        setStickyVisible(pastCta);
      },
      { threshold: 0 }
    );
    observer.observe(ctaRef.current);
    return () => observer.disconnect();
  }, [productReady]);

  const price = product?.price ?? DEFAULT_PRICE;
  const compareAt = product?.compareAtPrice ?? DEFAULT_COMPARE;
  const discountPct = compareAt > price ? Math.round(((compareAt - price) / compareAt) * 100) : 65;
  const soldOut = product?.stock === 0;

  const fmt = (n) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);

  const BUNDLES = useMemo(() => [
    {
      id: 0,
      label: "Pack Completo",
      badge: "MÁS POPULAR",
      perks: "Envío gratis · 3 cuotas sin interés",
      bundlePrice: price,
      comparePrice: compareAt,
      productThumbName: BUNDLE_PRODUCT_NAME,
      extras: [
        { id: "regalo", label: BUNDLE_REGALO_NAME, img: REGALO_IMG },
        { id: "ebook",  label: BUNDLE_EBOOK_NAME,  img: EBOOK_IMG  },
      ],
    },
  ], [price, compareAt]);

  const handleBuy = () => {
    if (soldOut) return;
    const bundle = BUNDLES[selectedBundle];
    const productData = product || { _id: PRODUCT_SLUG, name: CHECKOUT_NAME, slug: PRODUCT_SLUG };
    addItem(
      { ...productData, name: CHECKOUT_NAME },
      1,
      {
        bundleTotal:    bundle.bundlePrice,
        compareAtPrice: bundle.comparePrice,
        gifts:          bundle.extras.map(e => e.label),
        bundleImgs:     bundle.extras.map(e => e.img).filter(Boolean),
      },
    );
    track('InitiateCheckout', { value: Number(bundle.bundlePrice) || 0, currency: 'ARS', content_name: CHECKOUT_NAME });
    setShowCheckout(true);
  };

  const maxTestIdx = Math.max(0, reviewsData.length - slidesPerView);
  const testPrev = () => setTestIdx(i => Math.max(0, i - 1));
  const testNext = () => setTestIdx(i => Math.min(maxTestIdx, i + 1));

  const productImages = useMemo(() => [
    { src: giftConfig.heroImg || "https://pbs.twimg.com/media/HK-ZytcXMAAunJK?format=jpg&name=small", alt: 'Escultor Facial LED 3 en 1 — Vista principal (img-hero.jpg)' },
    { src: "https://pbs.twimg.com/media/HKA1hrNXQAAVdG0?format=jpg&name=large", alt: 'Beneficios del dispositivo (img-galeria-2.jpg)' },
    { src: "https://pbs.twimg.com/media/HKA1jJVXYAA_oLr?format=jpg&name=large", alt: 'Resultados visibles (img-galeria-3.jpg)' },
    { src: "https://pbs.twimg.com/media/HKA1kgxWgAAhXD1?format=jpg&name=large", alt: 'Escultor Facial LED 3 en 1 — Vista principal (img-hero.jpg)' },
    { src: "https://pbs.twimg.com/media/HKA1sUIWkAAKS81?format=jpg&name=large", alt: 'Beneficios del dispositivo (img-galeria-2.jpg)' },
    { src: "https://pbs.twimg.com/media/HKA1uGXX0AAffQ0?format=jpg&name=large", alt: 'Resultados visibles (img-galeria-3.jpg)' },
    { src: "https://pbs.twimg.com/media/HKA1vV5XcAA5yDM?format=jpg&name=large", alt: 'Escultor Facial LED 3 en 1 — Vista principal (img-hero.jpg)' },
    { src: "https://pbs.twimg.com/media/HKA14M6XkAATjmH?format=jpg&name=large", alt: 'Beneficios del dispositivo (img-galeria-2.jpg)' },
    { src: "https://pbs.twimg.com/media/HKA1_2IXYAEiKWs?format=jpg&name=large", alt: 'Resultados visibles (img-galeria-3.jpg)' },
  ], [giftConfig.heroImg]);

  if (!productReady) {
    return (
      <div className="led-loading-wrap">
        <div className="led-loading-bar" />
      </div>
    );
  }

  return (
    <>
      <div className="led-wrap">

        {/* ══ S1 — ANNOUNCEMENT BAR (C1) ══ */}
        <div className="led-ann-bar">
          <span className={`led-ann-msg ${annVisible ? 'visible' : 'hidden'}`}>
            {annMsgs[annIdx]}
          </span>
        </div>

        {/* ══ S2 — HERO ══ */}
        <div className="led-hero">
          <div className="led-hero-inner">

            {/* Galería */}
            <div className="led-gallery">
              <div className="led-gallery-main">
                {productImages[activeImg]?.src
                  ? <img src={productImages[activeImg].src} alt={productImages[activeImg].alt} />
                  : <ImgPlaceholder label={productImages[activeImg]?.alt} style={{ minHeight: 280 }} />
                }
              </div>
              <div className="led-thumbs">
                {productImages.map((img, i) => (
                  <div
                    key={i}
                    className={`led-thumb${i === activeImg ? ' led-thumb-active' : ''}`}
                    onClick={() => setActiveImg(i)}
                    role="button" tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && setActiveImg(i)}
                    aria-label={`Imagen ${i + 1}`}
                  >
                    {img.src
                      ? <img src={img.src} alt={img.alt} />
                      : <div className="led-img-placeholder" style={{ fontSize: 10, minHeight: 'unset', height: '100%' }}>{i + 1}</div>
                    }
                  </div>
                ))}
              </div>
            </div>

            {/* Info de compra */}
            <div className="led-info">
              <div className="led-stars">
                <span style={{ color: '#FFC6C6' }}>★★★★★</span>
                <span className="led-stars-count">4.8 / 5</span>
                <span className="led-reviews-count">| Más de 10.000 clientes satisfechos</span>
              </div>

              <h1 className="led-product-title">Escultor Facial LED 3 en 1 de Amelor</h1>

              <div className="led-pricing">
                <span className="led-price-original">{fmt(compareAt)}</span>
                <span className="led-price-sale">{fmt(price)}</span>
                <span className="led-badge-discount">{discountPct}% OFF</span>
                <span className="led-cuotas">3 cuotas sin interés de <strong>{fmt(Math.ceil(price / 3))}</strong></span>
              </div>

              <div className="led-target-section">
                <h3 className="led-target-title">¿Es para vos?</h3>
                <ul className="led-target-list">
                  {FOR_WHOM.map((item, i) => (
                    <li key={i}>→ {item}</li>
                  ))}
                </ul>
              </div>

              {/* Bundle selector */}
              <div className="led-bundles">
                {BUNDLES.map((b, i) => (
                  <label key={b.id} className={`led-bundle-opt${selectedBundle === i ? ' selected' : ''}`} onClick={() => setSelectedBundle(i)}>
                    <input type="radio" name="led-bundle" checked={selectedBundle === i} onChange={() => setSelectedBundle(i)} />
                    <div className="led-bundle-body">
                      <div className="led-bundle-top">
                        <div className="led-bundle-left">
                          <div className="led-bundle-label-row">
                            <span className="led-bundle-label">{b.label}</span>
                            {b.badge && <span className="led-bundle-badge">{b.badge}</span>}
                          </div>
                          <span className="led-bundle-perks">{b.perks}</span>
                        </div>
                        <div className="led-bundle-price-col">
                          <span className="led-bundle-price">{fmt(b.bundlePrice)}</span>
                          <span className="led-bundle-compare">{fmt(b.comparePrice)}</span>
                        </div>
                      </div>

                      {b.extras.length > 0 && (
                        <div className="led-bundle-extras-wrap">
                          <div className="led-bundle-thumbs">
                            <div className="led-bundle-item">
                              <div className="led-bundle-thumb">
                                {(BUNDLE_PRODUCT_IMG || productImages[0]?.src)
                                  ? <img src={BUNDLE_PRODUCT_IMG || productImages[0].src} alt="Escultor Facial LED" />
                                  : <span>💡</span>}
                              </div>
                              <span className="led-bundle-item-name">{b.productThumbName}</span>
                            </div>
                            <span className="led-bundle-plus">+</span>
                            <div className="led-bundle-item">
                              <div className="led-bundle-thumb">
                                {REGALO_IMG ? <img src={REGALO_IMG} alt={b.extras[0].label} /> : <span>🎁</span>}
                                <span className="led-bundle-sticker">GRATIS</span>
                              </div>
                              <span className="led-bundle-item-name">{b.extras[0].label}</span>
                            </div>
                            <span className="led-bundle-plus">+</span>
                            <div className="led-bundle-item">
                              <div className="led-bundle-thumb led-bundle-thumb--ebook">
                                {EBOOK_IMG ? <img src={EBOOK_IMG} alt={b.extras[1].label} /> : <span>📖</span>}
                                <span className="led-bundle-sticker">GRATIS</span>
                              </div>
                              <span className="led-bundle-item-name">{b.extras[1].label}</span>
                            </div>
                          </div>
                          <div className="led-bundle-shipping">🚚 Envío gratis a todo el país</div>
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>

              <div className="led-urgency">
                <span>🔴</span>
                <span>Casi agotado | Solo quedan 7 unidades</span>
              </div>

              <button ref={ctaRef} className="led-btn-cta" onClick={handleBuy} disabled={soldOut}>
                {soldOut ? 'AGOTADO' : 'AGREGAR AL CARRITO ➔'}
              </button>

              {/* C2 — Trust badges (reemplazá con tus PNGs) */}
              <div className="led-trust-badges">
                <div className="led-trust-item">
                  <img
                    src="//www.luxcove.co/cdn/shop/files/Untitled_design_-_2024-06-30T131118.961.png?v=1719749489"
                    alt="Garantía"
                    style={{ width: 44, height: 44, borderRadius: 8 }}
                  />
                  <span>Garantía devolución<br />90 días</span>
                </div>
                <div className="led-trust-item">
                  <img src="//www.luxcove.co/cdn/shop/files/Untitled_design_-_2024-06-30T131541.485.png?v=1719749753" style={{ width: 44, height: 44, minHeight: 'unset', borderRadius: 8 }} />
                  <span>Envío gratis<br />en todos los pedidos</span>
                </div>
                <div className="led-trust-item">
                  <svg className="color" xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 50 50" style={{ flexShrink: 0 }} fill="currentColor"><path d="M 21.4375 1.0058594 C 20.081703 1.0463506 18.771739 1.7524791 18.025391 2.9863281 L 17.761719 3.4238281 C 17.385173 4.0455037 16.721685 4.4283987 15.996094 4.4433594 L 15.994141 4.4433594 L 15.482422 4.4550781 C 13.286577 4.5008101 11.497809 6.2882845 11.453125 8.484375 L 11.441406 8.9960938 C 11.426446 9.7216978 11.042385 10.386559 10.421875 10.761719 L 9.984375 11.027344 C 8.1054479 12.164721 7.4493952 14.60833 8.5078125 16.533203 L 8.5097656 16.533203 L 8.7558594 16.982422 C 9.1060077 17.618128 9.1060077 18.385778 8.7558594 19.021484 L 8.5097656 19.46875 C 7.4515168 21.393317 8.1061771 23.837315 9.9863281 24.974609 L 10.423828 25.238281 C 11.045504 25.614827 11.428399 26.278315 11.443359 27.003906 L 11.443359 27.005859 L 11.455078 27.517578 C 11.49207 29.293819 12.67637 30.78643 14.287109 31.322266 L 9.0917969 42.580078 A 1.0001 1.0001 0 0 0 10 44 L 16.519531 44 L 20.21875 48.625 A 1.0001 1.0001 0 0 0 21.916016 48.400391 L 25.03125 41.28125 L 28.146484 48.400391 A 1.0001 1.0001 0 0 0 29.84375 48.625 L 33.542969 44 L 40.0625 44 A 1.0001 1.0001 0 0 0 40.970703 42.580078 L 35.767578 31.304688 C 37.351214 30.753718 38.510287 29.274384 38.546875 27.517578 L 38.546875 27.515625 L 38.558594 27.005859 L 38.558594 27.003906 C 38.573554 26.278302 38.957615 25.613441 39.578125 25.238281 L 40.017578 24.972656 C 41.896553 23.835278 42.550604 21.393623 41.492188 19.46875 L 41.490234 19.466797 L 41.240234 19.015625 C 40.892213 18.380675 40.892703 17.614886 41.242188 16.980469 L 41.490234 16.533203 L 41.490234 16.53125 C 42.548024 14.607519 41.893895 12.165278 40.015625 11.027344 L 40.013672 11.025391 L 39.576172 10.761719 C 38.954541 10.385361 38.571601 9.7216849 38.556641 8.9960938 L 38.556641 8.9941406 L 38.544922 8.484375 L 38.544922 8.4824219 C 38.499191 6.2865703 36.711715 4.4978091 34.515625 4.453125 L 34.003906 4.4414062 C 33.278302 4.4264453 32.613441 4.0423845 32.238281 3.421875 L 31.972656 2.984375 C 30.835362 1.104224 28.391364 0.44956368 26.466797 1.5078125 L 26.466797 1.5097656 L 26.017578 1.7558594 C 25.381872 2.1060077 24.614222 2.1060077 23.978516 1.7558594 L 23.53125 1.5097656 C 23.050108 1.2452034 22.537032 1.0874427 22.019531 1.0292969 C 21.825469 1.0074922 21.631185 1.0000749 21.4375 1.0058594 z M 21.386719 3 C 21.782233 2.9711393 22.192072 3.0548121 22.568359 3.2617188 L 23.013672 3.5078125 C 24.247966 4.1876642 25.750081 4.1876642 26.984375 3.5078125 L 27.431641 3.2597656 L 27.431641 3.2617188 C 28.435074 2.7099676 29.669013 3.0396824 30.261719 4.0195312 L 30.527344 4.4570312 C 31.255989 5.6612476 32.553769 6.411729 33.960938 6.4414062 L 34.474609 6.453125 C 35.619859 6.476427 36.523573 7.3781883 36.546875 8.5234375 L 36.546875 8.5253906 L 36.556641 9.0371094 C 36.585681 10.445518 37.336691 11.743202 38.541016 12.472656 L 38.978516 12.738281 C 39.957765 13.330624 40.288615 14.563305 39.738281 15.566406 L 39.490234 16.015625 C 38.810383 17.249919 38.810383 18.750081 39.490234 19.984375 L 39.492188 19.986328 L 39.492188 19.988281 L 39.740234 20.431641 C 40.291817 21.434767 39.959494 22.669097 38.980469 23.261719 L 38.542969 23.527344 C 37.337478 24.256184 36.587633 25.554495 36.558594 26.962891 L 36.548828 27.474609 L 36.548828 27.476562 C 36.525528 28.621813 35.621812 29.523573 34.476562 29.546875 L 33.962891 29.558594 C 32.55523 29.588284 31.258416 30.337244 30.529297 31.541016 L 30.529297 31.542969 L 30.263672 31.980469 C 29.670966 32.960318 28.437027 33.290032 27.433594 32.738281 L 27.433594 32.740234 L 26.986328 32.492188 C 25.752034 31.812335 24.249919 31.812335 23.015625 32.492188 L 22.568359 32.740234 L 22.568359 32.738281 C 21.565233 33.289864 20.330903 32.959494 19.738281 31.980469 L 19.472656 31.542969 C 18.744011 30.338752 17.446232 29.588271 16.039062 29.558594 L 16.037109 29.558594 L 15.525391 29.546875 C 14.380141 29.523575 13.476427 28.621813 13.453125 27.476562 L 13.453125 27.474609 L 13.443359 26.962891 C 13.414319 25.554482 12.663309 24.256798 11.458984 23.527344 L 11.021484 23.261719 C 10.04167 22.668878 9.7099674 21.435074 10.261719 20.431641 L 10.507812 19.986328 L 10.507812 19.984375 C 11.186723 18.750406 11.187351 17.249349 10.507812 16.015625 L 10.259766 15.568359 L 10.261719 15.568359 C 9.7101357 14.565233 10.040506 13.330903 11.019531 12.738281 L 11.457031 12.472656 C 12.661248 11.744011 13.411729 10.446231 13.441406 9.0390625 L 13.441406 9.0371094 L 13.453125 8.5253906 C 13.476425 7.3801414 14.378187 6.4764275 15.523438 6.453125 L 15.525391 6.453125 L 16.037109 6.4433594 C 17.445518 6.4143204 18.743202 5.6633088 19.472656 4.4589844 L 19.738281 4.0214844 C 20.034634 3.5315599 20.489931 3.2024706 20.998047 3.0664062 C 21.125076 3.0323902 21.254881 3.0096202 21.386719 3 z M 32.283203 11.085938 L 24.042969 23.966797 L 17.419922 18.005859 L 16.080078 19.494141 L 24.457031 27.03125 L 33.966797 12.164062 L 32.283203 11.085938 z M 33.701172 31.603516 L 38.498047 42 L 33.0625 42 A 1.0001 1.0001 0 0 0 32.28125 42.375 L 29.314453 46.082031 L 26.123047 38.783203 L 27.806641 34.935547 C 29.413838 35.18657 31.089508 34.478857 31.974609 33.015625 L 32.240234 32.578125 C 32.562592 32.045913 33.099287 31.704691 33.701172 31.603516 z M 16.357422 31.611328 C 16.936501 31.724996 17.45057 32.063489 17.761719 32.578125 L 18.027344 33.015625 C 19.164722 34.8946 21.60833 35.550604 23.533203 34.492188 L 23.533203 34.490234 L 23.982422 34.244141 C 24.592626 33.908038 25.321448 33.903754 25.941406 34.212891 L 20.748047 46.082031 L 17.78125 42.375 A 1.0001 1.0001 0 0 0 17 42 L 11.564453 42 L 16.357422 31.611328 z" /></svg>
                  <span>Garantía<br />1 año</span>
                </div>
              </div>

              {/* C3 — Medios de pago */}
              <div className="led-payment-block">
                <div className="led-payment-grid">
                  <img className="led-pay-chip" src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Mercado_Pago.svg/3840px-Mercado_Pago.svg.png" alt="MercadoPago" style={{ height: 22 }} />
                  <svg className="led-pay-chip" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="pi-visa-h" viewBox="0 0 38 24" width="38" height="24"><title id="pi-visa-h">Visa</title><path opacity=".07" d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.4 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.4-3-3-3z"/><path fill="#fff" d="M35 1c1.1 0 2 .9 2 2v18c0 1.1-.9 2-2 2H3c-1.1 0-2-.9-2-2V3c0-1.1.9-2 2-2h32"/><path d="M28.3 10.1H28c-.4 1-.7 1.5-1 3h1.9c-.3-1.5-.3-2.2-.6-3zm2.9 5.9h-1.7c-.1 0-.1 0-.2-.1l-.2-.9-.1-.2h-2.4c-.1 0-.2 0-.2.2l-.3.9c0 .1-.1.1-.1.1h-2.1l.2-.5L27 8.7c0-.5.3-.7.8-.7h1.5c.1 0 .2 0 .2.2l1.4 6.5c.1.4.2.7.2 1.1.1.1.1.1.1.2zm-13.4-.3l.4-1.8c.1 0 .2.1.2.1.7.3 1.4.5 2.1.4.2 0 .5-.1.7-.2.5-.2.5-.7.1-1.1-.2-.2-.5-.3-.8-.5-.4-.2-.8-.4-1.1-.7-1.2-1-.8-2.4-.1-3.1.6-.4.9-.8 1.7-.8 1.2 0 2.5 0 3.1.2h.1c-.1.6-.2 1.1-.4 1.7-.5-.2-1-.4-1.5-.4-.3 0-.6 0-.9.1-.2 0-.3.1-.4.2-.2.2-.2.5 0 .7l.5.4c.4.2.8.4 1.1.6.5.3 1 .8 1.1 1.4.2.9-.1 1.7-.9 2.3-.5.4-.7.6-1.4.6-1.4 0-2.5.1-3.4-.2-.1.2-.1.2-.2.1zm-3.5.3c.1-.7.1-.7.2-1 .5-2.2 1-4.5 1.4-6.7.1-.2.1-.3.3-.3H18c-.2 1.2-.4 2.1-.7 3.2-.3 1.5-.6 3-1 4.5 0 .2-.1.2-.3.2M5 8.2c0-.1.2-.2.3-.2h3.4c.5 0 .9.3 1 .8l.9 4.4c0 .1 0 .1.1.2 0-.1.1-.1.1-.1l2.1-5.1c-.1-.1 0-.2.1-.2h2.1c0 .1 0 .1-.1.2l-3.1 7.3c-.1.2-.1.3-.2.4-.1.1-.3 0-.5 0H9.7c-.1 0-.2 0-.2-.2L7.9 9.5c-.2-.2-.5-.5-.9-.6-.6-.3-1.7-.5-1.9-.5L5 8.2z" fill="#142688"/></svg>
                  <svg className="led-pay-chip" viewBox="0 0 38 24" xmlns="http://www.w3.org/2000/svg" role="img" width="38" height="24" aria-labelledby="pi-master-h"><title id="pi-master-h">Mastercard</title><path opacity=".07" d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.4 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.4-3-3-3z"/><path fill="#fff" d="M35 1c1.1 0 2 .9 2 2v18c0 1.1-.9 2-2 2H3c-1.1 0-2-.9-2-2V3c0-1.1.9-2 2-2h32"/><circle fill="#EB001B" cx="15" cy="12" r="7"/><circle fill="#F79E1B" cx="23" cy="12" r="7"/><path fill="#FF5F00" d="M22 12c0-2.4-1.2-4.5-3-5.7-1.8 1.3-3 3.4-3 5.7s1.2 4.5 3 5.7c1.8-1.2 3-3.3 3-5.7z"/></svg>
                  <svg className="led-pay-chip" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="pi-amex-h" viewBox="0 0 38 24" width="38" height="24"><title id="pi-amex-h">American Express</title><path fill="#000" d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.4 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.4-3-3-3Z" opacity=".07"/><path fill="#006FCF" d="M35 1c1.1 0 2 .9 2 2v18c0 1.1-.9 2-2 2H3c-1.1 0-2-.9-2-2V3c0-1.1.9-2 2-2h32Z"/><path fill="#FFF" d="M22.012 19.936v-8.421L37 11.528v2.326l-1.732 1.852L37 17.573v2.375h-2.766l-1.47-1.622-1.46 1.628-9.292-.02Z"/><path fill="#006FCF" d="M23.013 19.012v-6.57h5.572v1.513h-3.768v1.028h3.678v1.488h-3.678v1.01h3.768v1.531h-5.572Z"/><path fill="#006FCF" d="m28.557 19.012 3.083-3.289-3.083-3.282h2.386l1.884 2.083 1.89-2.082H37v.051l-3.017 3.23L37 18.92v.093h-2.307l-1.917-2.103-1.898 2.104h-2.321Z"/><path fill="#FFF" d="M22.71 4.04h3.614l1.269 2.881V4.04h4.46l.77 2.159.771-2.159H37v8.421H19l3.71-8.421Z"/><path fill="#006FCF" d="m23.395 4.955-2.916 6.566h2l.55-1.315h2.98l.55 1.315h2.05l-2.904-6.566h-2.31Zm.25 3.777.875-2.09.873 2.09h-1.748Z"/><path fill="#006FCF" d="M28.581 11.52V4.953l2.811.01L32.84 9l1.456-4.046H37v6.565l-1.74.016v-4.51l-1.644 4.494h-1.59L30.35 7.01v4.51h-1.768Z"/></svg>
                  <svg className="led-pay-chip" version="1.1" xmlns="http://www.w3.org/2000/svg" role="img" x="0" y="0" width="38" height="24" viewBox="0 0 165.521 105.965" xmlSpace="preserve" aria-labelledby="pi-apple-h"><title id="pi-apple-h">Apple Pay</title><path fill="#000" d="M150.698 0H14.823c-.566 0-1.133 0-1.698.003-.477.004-.953.009-1.43.022-1.039.028-2.087.09-3.113.274a10.51 10.51 0 0 0-2.958.975 9.932 9.932 0 0 0-4.35 4.35 10.463 10.463 0 0 0-.975 2.96C.113 9.611.052 10.658.024 11.696a70.22 70.22 0 0 0-.022 1.43C0 13.69 0 14.256 0 14.823v76.318c0 .567 0 1.132.002 1.699.003.476.009.953.022 1.43.028 1.036.09 2.084.275 3.11a10.46 10.46 0 0 0 .974 2.96 9.897 9.897 0 0 0 1.83 2.52 9.874 9.874 0 0 0 2.52 1.83c.947.483 1.917.79 2.96.977 1.025.183 2.073.245 3.112.273.477.011.953.017 1.43.02.565.004 1.132.004 1.698.004h135.875c.565 0 1.132 0 1.697-.004.476-.002.952-.009 1.431-.02 1.037-.028 2.085-.09 3.113-.273a10.478 10.478 0 0 0 2.958-.977 9.955 9.955 0 0 0 4.35-4.35c.483-.947.789-1.917.974-2.96.186-1.026.246-2.074.274-3.11.013-.477.02-.954.022-1.43.004-.567.004-1.132.004-1.699V14.824c0-.567 0-1.133-.004-1.699a63.067 63.067 0 0 0-.022-1.429c-.028-1.038-.088-2.085-.274-3.112a10.4 10.4 0 0 0-.974-2.96 9.94 9.94 0 0 0-4.35-4.35A10.52 10.52 0 0 0 156.939.3c-1.028-.185-2.076-.246-3.113-.274a71.417 71.417 0 0 0-1.431-.022C151.83 0 151.263 0 150.698 0z"/><path fill="#FFF" d="M150.698 3.532l1.672.003c.452.003.905.008 1.36.02.793.022 1.719.065 2.583.22.75.135 1.38.34 1.984.648a6.392 6.392 0 0 1 2.804 2.807c.306.6.51 1.226.645 1.983.154.854.197 1.783.218 2.58.013.45.019.9.02 1.36.005.557.005 1.113.005 1.671v76.318c0 .558 0 1.114-.004 1.682-.002.45-.008.9-.02 1.35-.022.796-.065 1.725-.221 2.589a6.855 6.855 0 0 1-.645 1.975 6.397 6.397 0 0 1-2.808 2.807c-.6.306-1.228.511-1.971.645-.881.157-1.847.2-2.574.22-.457.01-.912.017-1.379.019-.555.004-1.113.004-1.669.004H14.801c-.55 0-1.1 0-1.66-.004a74.993 74.993 0 0 1-1.35-.018c-.744-.02-1.71-.064-2.584-.22a6.938 6.938 0 0 1-1.986-.65 6.337 6.337 0 0 1-1.622-1.18 6.355 6.355 0 0 1-1.178-1.623 6.935 6.935 0 0 1-.646-1.985c-.156-.863-.2-1.788-.22-2.578a66.088 66.088 0 0 1-.02-1.355l-.003-1.327V14.474l.002-1.325a66.7 66.7 0 0 1 .02-1.357c.022-.792.065-1.717.222-2.587a6.924 6.924 0 0 1 .646-1.981c.304-.598.7-1.144 1.18-1.623a6.386 6.386 0 0 1 1.624-1.18 6.96 6.96 0 0 1 1.98-.646c.865-.155 1.792-.198 2.586-.22.452-.012.905-.017 1.354-.02l1.677-.003h135.875"/><g><g><path fill="#000" d="M43.508 35.77c1.404-1.755 2.356-4.112 2.105-6.52-2.054.102-4.56 1.355-6.012 3.112-1.303 1.504-2.456 3.959-2.156 6.266 2.306.2 4.61-1.152 6.063-2.858"/><path fill="#000" d="M45.587 39.079c-3.35-.2-6.196 1.9-7.795 1.9-1.6 0-4.049-1.8-6.698-1.751-3.447.05-6.645 2-8.395 5.1-3.598 6.2-.95 15.4 2.55 20.45 1.699 2.5 3.747 5.25 6.445 5.151 2.55-.1 3.549-1.65 6.647-1.65 3.097 0 3.997 1.65 6.696 1.6 2.798-.05 4.548-2.5 6.247-5 1.95-2.85 2.747-5.6 2.797-5.75-.05-.05-5.396-2.101-5.446-8.251-.05-5.15 4.198-7.6 4.398-7.751-2.399-3.548-6.147-3.948-7.447-4.048"/></g><g><path fill="#000" d="M78.973 32.11c7.278 0 12.347 5.017 12.347 12.321 0 7.33-5.173 12.373-12.529 12.373h-8.058V69.62h-5.822V32.11h14.062zm-8.24 19.807h6.68c5.07 0 7.954-2.729 7.954-7.46 0-4.73-2.885-7.434-7.928-7.434h-6.706v14.894z"/><path fill="#000" d="M92.764 61.847c0-4.809 3.665-7.564 10.423-7.98l7.252-.442v-2.08c0-3.04-2.001-4.704-5.562-4.704-2.938 0-5.07 1.507-5.51 3.82h-5.252c.157-4.86 4.731-8.395 10.918-8.395 6.654 0 10.995 3.483 10.995 8.89v18.663h-5.38v-4.497h-.13c-1.534 2.937-4.914 4.782-8.579 4.782-5.406 0-9.175-3.222-9.175-8.057zm17.675-2.417v-2.106l-6.472.416c-3.64.234-5.536 1.585-5.536 3.95 0 2.288 1.975 3.77 5.068 3.77 3.95 0 6.94-2.522 6.94-6.03z"/><path fill="#000" d="M120.975 79.652v-4.496c.364.051 1.247.103 1.715.103 2.573 0 4.029-1.09 4.913-3.899l.52-1.663-9.852-27.293h6.082l6.863 22.146h.13l6.862-22.146h5.927l-10.216 28.67c-2.34 6.577-5.017 8.735-10.683 8.735-.442 0-1.872-.052-2.261-.157z"/></g></g></svg>
                </div>
              </div>

              {/* C5 — Review inline hero */}
              <div className="led-hero-review">
                <div className="led-hr-avatar">
                  <img src={heroReviews[hrIdx].avatar} alt={heroReviews[hrIdx].name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                </div>
                <div className="led-hr-content">
                  <div className="led-hr-top">
                    <strong className="led-hr-name">{heroReviews[hrIdx].name}</strong>
                    <span className="led-hr-stars">{'★'.repeat(heroReviews[hrIdx].stars)}</span>
                  </div>
                  <p className="led-hr-text">"{heroReviews[hrIdx].text}"</p>
                </div>
                <button className="led-hr-next" onClick={() => setHrIdx(i => (i + 1) % heroReviews.length)} aria-label="Siguiente reseña">›</button>
              </div>

              {/* C4 — Acordeón con íconos */}
              <div className="led-accordion">
                {PRODUCT_TABS.map((tab, i) => (
                  <div key={i} className="led-acc-item">
                    <button
                      className="led-acc-trigger"
                      onClick={() => setOpenTab(openTab === i ? null : i)}
                      aria-expanded={openTab === i}
                    >
                      <span className="led-acc-icon">{accordionIcons[i]}</span>
                      <span className="led-acc-title">{tab.title}</span>
                      <span className={`led-acc-arrow${openTab === i ? ' open' : ''}`}>›</span>
                    </button>
                    <div className={`led-acc-body${openTab === i ? ' open' : ''}`} aria-hidden={openTab !== i}>
                      <div className="led-acc-body-inner">
                        {tab.content.map((line, j) => <p key={j}>{line}</p>)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ══ S3 — TESTIMONIOS CAROUSEL (C13 — estrellas rosas + avatar) ══ */}
        <div className="led-section led-section--pink">
          <div className="led-container">
            <h2 className="led-section-title">
              A nuestros clientes les <em>ENCANTA</em> nuestro Escultor Facial LED
            </h2>
            <div className="led-test-viewport">
              <div
                className="led-test-track"
                style={{ transform: `translateX(-${testIdx * (100 / slidesPerView)}%)` }}
              >
                {reviewsData.map((t, i) => (
                  <div key={i} className="led-test-slide">
                    <div className="led-test-card">
                      <div className="led-review-avatar">
                        <img src={t.avatar} alt={t.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                      </div>
                      <div className="led-review-stars">{'★'.repeat(t.stars)}</div>
                      <p className="led-test-text">"{t.text}"</p>
                      <div className="led-test-name">— {t.name}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="led-test-nav">
              <button className="led-test-btn" onClick={testPrev} aria-label="Anterior">‹</button>
              <div className="led-test-dots">
                {Array.from({ length: maxTestIdx + 1 }).map((_, i) => (
                  <button key={i} className={`led-test-dot${i === testIdx ? ' led-active' : ''}`} onClick={() => setTestIdx(i)} aria-label={`Ir al testimonio ${i + 1}`} />
                ))}
              </div>
              <button className="led-test-btn" onClick={testNext} aria-label="Siguiente">›</button>
            </div>
          </div>
        </div>

        {/* ══ S4 — VIDEOS (vstrip) ══ */}
        <div className="led-section led-section--white" style={{ paddingTop: 32, paddingBottom: 32 }}>
          <div className="led-container">
            <div className="led-vstrip-header">
              <div className="led-vstrip-kicker">✦ CLIENTES SATISFECHOS</div>
              <h2 className="led-vstrip-title">Inspírate ✨</h2>
              <p className="led-vstrip-sub">¡Mirá cómo nuestros clientes transforman sus rostros con el Escultor Facial LED!</p>
            </div>
            <div className="led-vstrip-row">
              {VSTRIP_VIDEOS.map((v, i) => (
                <div key={i} className="led-vstrip-item">
                  <div className="led-vstrip-media">
                    <video
                      src={v.src}
                      autoPlay
                      loop
                      muted
                      playsInline
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', borderRadius: 'inherit' }}
                    />
                  </div>
                  <div className="led-vstrip-benefit">{v.benefit}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══ S5 — STATS CIRCULARES (C6) ══ */}
        <div className="led-section led-section--white">
          <div className="led-container">
            <h2 className="led-section-title">Vea resultados visibles en solo 30 días.</h2>
            <p className="led-section-sub">Así es como nuestro Escultor Facial LED está transformando vidas, una tez radiante a la vez.</p>
            <div className="led-stats-image">
              <img src="//www.luxcove.co/cdn/shop/files/US_VS_THEM_FACELIFT_SURGERY.png?v=1773769643" alt="Resultados del producto" style={{ width: '100%', aspectRatio: '4/3', minHeight: 180, objectFit: 'cover', borderRadius: 12 }} />
            </div>
            <LedStatsCircles items={statsData} />
          </div>
        </div>

        {/* ══ S6 — 4 FEATURES CON ÍCONOS ══ */}
        <div className="led-section led-section--white">
          <div className="led-container">
            <div className="led-features-grid">
              {FEATURES.map((f, i) => (
                <div key={i} className="led-feature-item">
                  <img
                    src={f.src}
                    alt={f.title}
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 8,
                      objectFit: 'contain'
                    }}
                  />
                  <div className="led-feature-title">{f.title}</div>
                  <div className="led-feature-desc">{f.desc}</div>
                </div>
              ))}
            </div>
            <p className="led-feature-credibility">⭐ Elegido por estetas y cosmetólogas. Resultados de clínica, precio accesible.</p>
            <div className="led-cta-row">
              <button className="led-btn-cta-center" onClick={handleBuy} disabled={soldOut}>
                {soldOut ? 'AGOTADO' : 'AGREGAR AL CARRITO ➔'}
              </button>
            </div>
          </div>
        </div>

        {/* ══ S7 — FEATURE EMS ══ */}
        <div className="led-feat-section" style={{ background: '#fff' }}>
          <div className="led-feat-inner">
            <div className="led-feat-img">
              <img
                src="//www.luxcove.co/cdn/shop/files/GIF1-LFS-ezgif.com-video-to-gif-converter.gif?v=1753723012&width=750"
                srcSet="//www.luxcove.co/cdn/shop/files/GIF1-LFS-ezgif.com-video-to-gif-converter.gif?v=1753723012&width=360 360w, //www.luxcove.co/cdn/shop/files/GIF1-LFS-ezgif.com-video-to-gif-converter.gif?v=1753723012&width=535 535w, //www.luxcove.co/cdn/shop/files/GIF1-LFS-ezgif.com-video-to-gif-converter.gif?v=1753723012&width=750 750w"
                sizes="(min-width: 750px) 50vw, 100vw"
                alt="Modo EMS"
                style={{ width: '100%', height: '100%', minHeight: 240, objectFit: 'cover' }}
              />
            </div>
            <div className="led-feat-text">
              <h2 className="led-feat-title">Conseguí un lifting facial instantáneo en casa.</h2>
              <p className="led-feat-desc">Nuestro modo EMS avanzado (Estimulación Muscular Eléctrica) estimula los músculos faciales, favoreciendo una apariencia más firme y tonificada.</p>
              <p className="led-feat-desc">Decile adiós a la piel flácida, la papada, el cuello de pavo y la doble mentón.</p>
            </div>
          </div>
        </div>

        {/* ══ S8 — FEATURE LUZ ROJA ══ */}
        <div className="led-feat-section" style={{ background: '#FFC6C6' }}>
          <div className="led-feat-inner led-feat-reverse">
            <div className="led-feat-img">
              <img
                src="//www.luxcove.co/cdn/shop/files/LFS-GIF31-ezgif.com-video-to-gif-converter.gif?v=1753723174&width=750"
                srcSet="//www.luxcove.co/cdn/shop/files/LFS-GIF31-ezgif.com-video-to-gif-converter.gif?v=1753723174&width=360 360w, //www.luxcove.co/cdn/shop/files/LFS-GIF31-ezgif.com-video-to-gif-converter.gif?v=1753723174&width=535 535w, //www.luxcove.co/cdn/shop/files/LFS-GIF31-ezgif.com-video-to-gif-converter.gif?v=1753723174&width=750 750w"
                sizes="(min-width: 750px) 50vw, 100vw"
                alt="Luz roja"
                style={{ width: '100%', height: '100%', minHeight: 240, objectFit: 'cover' }}
              />
            </div>
            <div className="led-feat-text">
              <h2 className="led-feat-title">Suavizá las líneas finas y las arrugas.</h2>
              <p className="led-feat-desc">Nuestro modo de luz roja estimula la producción de colágeno para suavizar las líneas de expresión, mejorar la textura de la piel y aumentar su elasticidad para lograr un brillo juvenil.</p>
            </div>
          </div>
        </div>

        {/* ══ S9 — FEATURE LUZ VERDE ══ */}
        <div className="led-feat-section" style={{ background: '#fff' }}>
          <div className="led-feat-inner">
            <div className="led-feat-img">
              <img
                src="//www.luxcove.co/cdn/shop/files/LFS-GIF3-ezgif.com-video-to-gif-converter.gif?v=1753723244&width=750"
                srcSet="//www.luxcove.co/cdn/shop/files/LFS-GIF3-ezgif.com-video-to-gif-converter.gif?v=1753723244&width=360 360w, //www.luxcove.co/cdn/shop/files/LFS-GIF3-ezgif.com-video-to-gif-converter.gif?v=1753723244&width=535 535w, //www.luxcove.co/cdn/shop/files/LFS-GIF3-ezgif.com-video-to-gif-converter.gif?v=1753723244&width=750 750w"
                sizes="(min-width: 750px) 50vw, 100vw"
                alt="Luz verde"
                style={{ width: '100%', height: '100%', minHeight: 240, objectFit: 'cover' }}
              />
            </div>
            <div className="led-feat-text">
              <h2 className="led-feat-title">Unificá el tono y la textura de la piel.</h2>
              <p className="led-feat-desc">Nuestro modo de luz verde actúa sobre la producción excesiva de melanina, reduciendo la hiperpigmentación y atenuando las manchas oscuras para un tono de piel más claro y uniforme.</p>
            </div>
          </div>
        </div>

        {/* ══ S10 — LUCES LED CARRUSEL (C8) ══ */}
        <div className="led-lights-section">
          <h2 className="led-lights-title">Obtené tratamientos de miles de pesos con un solo dispositivo.</h2>
          <div className="led-lights-track-wrap" ref={lightsTrackRef} onScroll={handleLightsScroll}>
            <div className="led-lights-track">
              {lights.map((light, i) => (
                <div key={i} className="led-lights-card">
                  <div
                    className="led-lights-img-wrap"
                    style={{ borderColor: light.border ? '#bbb' : light.color }}
                  >
                    <img
                      src={light.src}
                      alt={light.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                    />
                  </div>
                  <span className="led-lights-name">{light.name}</span>
                  {light.nm && <span className="led-lights-nm">({light.nm})</span>}
                  <p className="led-lights-desc">{light.desc}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="led-lights-dots">
            {lights.map((_, i) => (
              <button key={i} className={`led-lights-dot-btn${i === lightIdx ? ' active' : ''}`} onClick={() => scrollToLight(i)} aria-label={`Luz ${i + 1}`} />
            ))}
          </div>
        </div>

        {/* ══ S11 — ANTES & DESPUÉS CAROUSEL ══ */}
        <div className="led-section led-section--pink">
          <div className="led-container">
            <h2 className="led-section-title">Clientes reales, resultados reales</h2>
            <div className="led-ba-carousel">
              <div className="led-ba-card">
                <div className="led-ba-img">
                  <img
                    src={beforeAfterData[baIdx].src}
                    alt={beforeAfterData[baIdx].name}
                    loading="eager"
                    decoding="async"
                    style={{ width: '100%', aspectRatio: '4/3', minHeight: 220, objectFit: 'cover', borderRadius: 0 }}
                  />
                  <div className="led-ba-day-labels">
                    <span className="led-ba-day">Día 1</span>
                    <span className="led-ba-day">Día 30</span>
                  </div>
                </div>
                <div className="led-ba-body">
                  <div className="led-ba-meta">
                    <span className="led-ba-name">{beforeAfterData[baIdx].name}</span>
                    <span className="led-ba-stars">{'★'.repeat(beforeAfterData[baIdx].stars)}</span>
                  </div>
                  <p className="led-ba-text">"{beforeAfterData[baIdx].text}"</p>
                </div>
              </div>
              <div className="led-ba-nav">
                <button className="led-test-btn" onClick={() => setBaIdx(i => Math.max(0, i - 1))} disabled={baIdx === 0} aria-label="Anterior">‹</button>
                <div className="led-test-dots">
                  {beforeAfterData.map((_, i) => (
                    <button key={i} className={`led-test-dot${i === baIdx ? ' led-active' : ''}`} onClick={() => setBaIdx(i)} aria-label={`Resultado ${i + 1}`} />
                  ))}
                </div>
                <button className="led-test-btn" onClick={() => setBaIdx(i => Math.min(beforeAfterData.length - 1, i + 1))} disabled={baIdx === beforeAfterData.length - 1} aria-label="Siguiente">›</button>
              </div>
            </div>
          </div>
        </div>

        {/* ══ S13 — TABLA COMPARATIVA FULL WIDTH (C9) ══ */}
        <div className="led-comp-section">
          <h2 className="led-comp-title">Amelor VS OTRAS MARCAS</h2>
          <p className="led-comp-sub">Nos enorgullecemos de la calidad de nuestros productos; no podemos decir lo mismo de otras marcas.</p>
          <div className="led-comp-table">
            <div className="led-comp-header">
              <div className="led-comp-col-feature"></div>
              <div className="led-comp-col-us">Amelor</div>
              <div className="led-comp-col-them">Otras marcas</div>
            </div>
            {compRows.map((row, i) => (
              <div key={i} className={`led-comp-row ${i % 2 === 0 ? 'even' : 'odd'}`}>
                <div className="led-comp-col-feature">{row}</div>
                <div className="led-comp-col-us"><span className="led-comp-check">✓</span></div>
                <div className="led-comp-col-them"><span className="led-comp-cross">✗</span></div>
              </div>
            ))}
          </div>
        </div>

        {/* ══ S14 — GARANTÍA (C12 — SVG escudo) ══ */}
        <div className="led-section led-section--white">
          <div className="led-container">
            <div className="led-guarantee">
              <div className="led-guarantee-icon">
                <img
                  src="//www.luxcove.co/cdn/shop/files/Untitled_design_-_2024-08-10T191415.055_c5c01040-8d0b-4eb2-91b8-433509c299e1.png?v=1723313727&width=360"
                  srcSet="//www.luxcove.co/cdn/shop/files/Untitled_design_-_2024-08-10T191415.055_c5c01040-8d0b-4eb2-91b8-433509c299e1.png?v=1723313727&width=165 165w, //www.luxcove.co/cdn/shop/files/Untitled_design_-_2024-08-10T191415.055_c5c01040-8d0b-4eb2-91b8-433509c299e1.png?v=1723313727&width=360 360w, //www.luxcove.co/cdn/shop/files/Untitled_design_-_2024-08-10T191415.055_c5c01040-8d0b-4eb2-91b8-433509c299e1.png?v=1723313727&width=535 535w"
                  sizes="160px"
                  alt="Garantía 90 días"
                  loading="lazy"
                  style={{ width: 160, height: 160, objectFit: 'contain' }}
                />
              </div>
              <h2 className="led-guarantee-title">Probalo sin riesgos</h2>
              <p className="led-guarantee-text">
                Estamos seguros de que te va a encantar nuestro producto, pero si no es para vos, no te preocupes.
                Probalo durante 90 días y, si no quedás completamente satisfecha/o, devolvelo y te reembolsamos
                el importe íntegro, sin preguntas. Tu satisfacción es nuestra prioridad.
              </p>
              <button className="led-btn-cta-center" onClick={handleBuy} disabled={soldOut}>
                {soldOut ? 'AGOTADO' : 'AGREGAR AL CARRITO ➔'}
              </button>
            </div>
          </div>
        </div>

        {/* ══ S15 — CÓMO USAR (C11 — círculos rosa + línea punteada) ══ */}
        <div className="led-section led-section--white">
          <div className="led-container">
            <h2 className="led-section-title">Cómo usarlo</h2>
            <div className="led-steps">
              {STEPS.map((step, i) => (
                <div key={i} className="led-step-item">
                  <div className="led-step-num">{step.num}</div>
                  <div className="led-step-content">
                    <h3 className="led-step-title">{step.title}</h3>
                    <p className="led-step-desc">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══ S15b — RESEÑAS FOTO CAROUSEL (post cómo usar) ══ */}
        <div className="led-photo-reviews-section">
          <div className="led-pr-inner">
            <div className="led-pr-viewport" onTouchStart={prHandleTouchStart} onTouchEnd={prHandleTouchEnd}>
              <div className="led-pr-track" style={{ transform: `translateX(-${prIdx * (100 / photoReviews.length)}%)` }}>
                {photoReviews.map((r, i) => (
                  <div key={i} className="led-pr-card">
                    <img src={r.img} alt={r.name} className="led-pr-img" />
                    <div className="led-pr-body">
                      <span className="led-pr-stars">{'★'.repeat(r.stars)}</span>
                      <p className="led-pr-text">{r.text}</p>
                      <span className="led-pr-name">- {r.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="led-pr-dots">
              {photoReviews.map((_, i) => (
                <button
                  key={i}
                  className={`led-pr-dot${i === prIdx ? ' led-pr-dot--active' : ''}`}
                  onClick={() => setPrIdx(i)}
                  aria-label={`Reseña ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ══ S16 — FAQ COMPLETO (C10 — 14 preguntas) ══ */}
        <div className="led-faq-section">
          <div className="led-container">
            <h2 className="led-faq-title">Preguntas frecuentes</h2>
            <p className="led-faq-sub">Todo lo que necesitás saber sobre el Escultor Facial LED 3 en 1.</p>
            <div className="led-faq-list">
              {faqs.map((faq, i) => (
                <div key={i} className="led-faq-item">
                  <button
                    className="led-faq-trigger"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    aria-expanded={openFaq === i}
                  >
                    <span className="led-faq-q">{faq.q}</span>
                    <span className={`led-faq-arrow${openFaq === i ? ' open' : ''}`}>›</span>
                  </button>
                  <div className={`led-faq-body${openFaq === i ? ' open' : ''}`} aria-hidden={openFaq !== i}>
                    <div className="led-faq-body-inner">{faq.a}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>{/* /led-wrap */}

      {/* Sticky CTA bar (mobile) */}
      <div className={`led-sticky-bar${stickyVisible ? ' led-visible' : ''}`} aria-hidden={!stickyVisible}>
        <button className="led-btn-cta" onClick={handleBuy} disabled={soldOut}>
          {soldOut ? 'AGOTADO' : 'AGREGAR AL CARRITO ➔'}
        </button>
      </div>

      {/* ══ FOOTER ══ */}
      <footer className="lp-footer">
        <div className="lp-footer-body">
          <div className="lp-footer-brand">
            <div className="lp-footer-logo">Amelor</div>
            <p className="lp-footer-tagline">Resultados de clínica. Desde tu casa.</p>
          </div>
          <div className="lp-footer-trust">
            <div className="lp-footer-ti"><span>🔒</span>Pago seguro</div>
            <div className="lp-footer-ti"><span>🚚</span>Envío gratis</div>
            <div className="lp-footer-ti"><span>🛡️</span>Garantía total</div>
            <div className="lp-footer-ti"><span>💳</span>3 cuotas sin interés</div>
          </div>
          <div className="lp-footer-pay">
            <span className="lp-footer-pay-label">Medios de pago aceptados</span>
            <div className="lp-footer-pay-row">
              <span className="lp-pay-chip">MercadoPago</span>
              <span className="lp-pay-chip">Visa</span>
              <span className="lp-pay-chip">Mastercard</span>
              <span className="lp-pay-chip">Amex</span>
            </div>
          </div>
          <div className="lp-footer-bottom">
            <span>© 2026 Amelor · Todos los derechos reservados</span>
          </div>
        </div>
      </footer>

      {showCheckout && (
        <CheckoutSheet
          onClose={() => setShowCheckout(false)}
          primaryColor="#000000"
          primaryHover="#222222"
          accentColor="#c06b6b"
          fontFamily="'Montserrat', sans-serif"
        />
      )}
    </>
  );
}
