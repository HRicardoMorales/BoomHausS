import { useState, useEffect, useRef, useMemo } from 'react';
import { CheckoutSheet } from '../../pages/CheckoutSheet';
import { useCart } from '../../context/CartContext';
import { track } from '../../lib/metaPixel';
import api from '../../services/api';
import './DepiladoraIPL.css';

/* ── Constantes ───────────────────────────────────────────── */
const PRODUCT_SLUG   = 'depiladora-ipl';
const CHECKOUT_NAME  = 'Depiladora IPL Profesional';
const DEFAULT_PRICE  = 39900;
const DEFAULT_COMPARE = 89000;

// 🖼 Imágenes del bundle — reemplazá con tus URLs
const BUNDLE_PRODUCT_IMG = "https://acdn-us.mitiendanube.com/stores/006/731/084/products/6428cf2f-d00e-4db4-a9b6-44635b9c302e-f1709437539a2f618417603729146590-1024-1024.webp";
const BUNDLE_RAZOR_IMG   = "https://acdn-us.mitiendanube.com/stores/006/731/084/products/6428cf2f-d00e-4db4-a9b6-44635b9c302e-f1709437539a2f618417603729146590-1024-1024.webp";
const BUNDLE_EBOOK_IMG   = "https://pbs.twimg.com/media/HKF3ODKWEAAqpdo?format=jpg&name=small";

// ✏️ Textos debajo de cada imagen del bundle
const BUNDLE_PRODUCT_NAME = "Depiladora IPL";
const BUNDLE_RAZOR_NAME   = "Afeitadora eléctrica";
const BUNDLE_EBOOK_NAME   = "Guía de uso";

/* Announcement bar */
const annMsgs = [
  '🔴 ¡OFERTA RELÁMPAGO ACTIVA!',
  '🚚 ENVÍO GRATIS EN TODOS LOS PEDIDOS',
  '⭐ +10.000 CLIENTAS SATISFECHAS',
  '💰 GARANTÍA DE DEVOLUCIÓN 90 DÍAS',
];

/* Beneficios hero */
const BENEFITS = [
  'Sin dolor — tecnología de luz pulsada intensa',
  'Resultados visibles desde la sesión 3 (~3 semanas)',
  '80% menos vello en solo 6 sesiones',
  'Piernas, axilas, bikini, brazos, bozo y mentón',
  '5 niveles de intensidad para todo tipo de piel',
  'Ahorrás cientos de dólares en depilación profesional',
];

/* Accordion */
const PRODUCT_TABS = [
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

const accordionIcons = [
  <svg key="clip" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="4" y="3" width="12" height="15" rx="1.5" /><path d="M7 3V2a1 1 0 012 0v1h2V2a1 1 0 012 0v1" /><line x1="7" y1="8" x2="13" y2="8" /><line x1="7" y1="11" x2="13" y2="11" /><line x1="7" y1="14" x2="10" y2="14" /></svg>,
  <svg key="clock" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="10" cy="10" r="7" /><polyline points="10,6 10,10 13,12" /></svg>,
  <svg key="heart" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M10 16s-7-4.5-7-9a4 4 0 018 0 4 4 0 018 0c0 4.5-7 9-7 9z" /></svg>,
  <svg key="shield" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M10 2l7 3v5c0 4-3 7-7 8-4-1-7-4-7-8V5l7-3z" /><polyline points="7,10 9,12 13,8" /></svg>,
];

/* Hero inline reviews */
const heroReviews = [
  { name: 'Valentina C.', avatar: '//www.luxcove.co/cdn/shop/files/the-face-of-a-40-year-old-woman.png?v=1739893013', stars: 5, text: 'Estoy sorprendida. Los resultados son increíbles a tan bajo costo. Calculo que en 3 meses no voy a tener nada. Sin dolor. No duden en comprar.' },
  { name: 'Florencia M.', avatar: '//www.luxcove.co/cdn/shop/files/feeling-cute-today-25-v0-wiakf8p.png?v=1739893136', stars: 5, text: 'Es la segunda vez que compro este producto. Para mí es sensacional, práctico, cómodo y de excelente resultado. Ya no gasto en cera.' },
  { name: 'Daniela G.', avatar: '//www.luxcove.co/cdn/shop/files/8713e5a4996b69964a57527507ac53ed.png?v=1739892933', stars: 5, text: 'Practicamente tenia barba y ahora que me depilo tarda 4 dias que es un monton. Resultado rapido. Sin dolor. Económico.' },
];

/* Stats circulares */
const statsData = [
  { pct: 91, text: <>Clientas que notaron <strong>reducción visible de vello</strong> desde la sesión 3.</> },
  { pct: 88, text: <>Dicen que es <strong>mucho menos doloroso</strong> que la cera o el hilo.</> },
  { pct: 93, text: <>No necesitaron <strong>volver al centro estético</strong> después de 8 semanas.</> },
  { pct: 96, text: <>Lo <strong>recomendarían a una amiga</strong> sin dudarlo.</> },
];

/* 4 Features */
const FEATURES = [
  { icon: '⚡', title: 'Resultados desde la sesión 3', desc: 'Notarás reducción visible del vello en tan solo 3 semanas. Sin esperar meses para ver cambios.' },
  { icon: '🏠', title: 'En casa, cuando quieras', desc: 'Sin turnos, sin traslados, sin agenda. Usá el dispositivo en tu hogar a cualquier hora.' },
  { icon: '💰', title: 'Pagás una sola vez', desc: 'Terminá con el gasto mensual recurrente en cera, hilo y centro estético. Una inversión única.' },
  { icon: '🛡️', title: 'Probalo sin riesgo 90 días', desc: 'Garantía de devolución total si no quedás completamente satisfecha/o. Sin preguntas.' },
];

/* Testimonios carrusel */
const reviewsData = [
  { title: '¡Sin dolor y sin vello!', name: 'Analía R.', avatar: '//www.luxcove.co/cdn/shop/files/2_227e3980-11a4-4119-9ed4-d0963676a467.png?v=1741425800', stars: 5, text: 'Tenía muchos pelos encarnados de la cera. Con la IPL eso desapareció completamente. Mi piel está lisa y sin irritación. ¡La mejor compra del año!' },
  { title: 'Me ahorré un dineral', name: 'Natalia B.', avatar: '//www.luxcove.co/cdn/shop/files/4_6d5fe2b7-5b21-42f1-86a6-d13fd0a1a092.png?v=1741425640', stars: 5, text: 'Antes gastaba en depilación cada mes. Con la IPL ya no necesito ir al centro estético. En 2 meses recuperé lo que pagué y sigo ahorrando.' },
  { title: 'Perfecta para el verano', name: 'Karina F.', avatar: '//www.luxcove.co/cdn/shop/files/6_1bb22647-f558-4396-a07f-58716d687ff7.png?v=1741425681', stars: 5, text: 'Compré en noviembre para estar lista en verano. ¡Fue la mejor decisión! A los 45 días ya tenía las piernas y axilas lisísimas. Voy a la pileta sin preocupación.' },
  { title: 'Resultados increíbles', name: 'Mariana P.', avatar: '//www.luxcove.co/cdn/shop/files/5_4674e838-6296-4ca1-9a34-6cc05243b642.png?v=1741425662', stars: 5, text: 'Me sorprendió porque nunca había probado IPL. El nivel 4 funciona perfecto para mi piel clara. Muy recomendable y fácil de usar.' },
  { title: 'Chau cera para siempre', name: 'Romina S.', avatar: '//www.luxcove.co/cdn/shop/files/8_3ecc94a3-ae31-49c0-a516-7c5b88caef34.png?v=1741425718', stars: 5, text: 'Llevo 8 semanas usándola y el vello redujo un montón. Antes me depilaba cada 15 días, ahora casi no tengo pelo. La uso mientras veo la tele, súper cómodo.' },
];

/* Tabla comparativa */
const compRows = [
  { feature: 'Precio anual estimado',      ipl: 'Pago único',            wax: '+$200.000 ARS/año',     laser: '+$400.000 ARS/año' },
  { feature: 'Dolor',                       ipl: 'Sin dolor',             wax: 'Alto',                  laser: 'Moderado' },
  { feature: 'Pelos encarnados',            ipl: 'No genera',             wax: 'Muy frecuentes',        laser: 'Poco frecuentes' },
  { feature: 'Requiere turnos/traslado',    ipl: 'No',                    wax: 'Sí',                    laser: 'Sí' },
  { feature: 'Resultados duraderos',        ipl: 'Meses / permanente',    wax: '2–4 semanas',           laser: 'Permanente' },
  { feature: 'Comodidad en casa',           ipl: '✓',                     wax: 'Difícil',               laser: 'No posible' },
];

/* ── NUEVO: Progreso semana a semana por zona corporal ────── */
// 🖼 Reemplazá cada `src` con fotos reales de antes/después de esa zona
const ZONE_TABS = [
  {
    id: 'piernas', label: 'Piernas', emoji: '🦵',
    problem: 'El área más grande — responde bien desde la semana 3',
    src: 'https://acdn-us.mitiendanube.com/stores/006/731/084/products/6428cf2f-d00e-4db4-a9b6-44635b9c302e-f1709437539a2f618417603729146590-1024-1024.webp',
    progress: [
      { weeks: 'Semana 1–3',  pct: 25, desc: 'El vello crece más lento y más fino. Tardás más días en volver a depilarte.' },
      { weeks: 'Semana 4–6',  pct: 55, desc: 'Reducción del 50%. Podés pasar semanas sin necesitar afeitar.' },
      { weeks: 'Semana 8–12', pct: 85, desc: 'Piernas prácticamente lisas. Mantenimiento 1 vez al mes.' },
    ],
  },
  {
    id: 'axilas', label: 'Axilas', emoji: '✨',
    problem: 'Zona pequeña — respuesta más rápida y visible',
    src: 'https://acdn-us.mitiendanube.com/stores/006/731/084/products/6428cf2f-d00e-4db4-a9b6-44635b9c302e-f1709437539a2f618417603729146590-1024-1024.webp',
    progress: [
      { weeks: 'Semana 1–3',  pct: 35, desc: 'Reducción inmediata. Cada sesión dura menos de 3 minutos.' },
      { weeks: 'Semana 4–6',  pct: 68, desc: 'Más del 65% menos vello. Sin manchas ni irritación post-depilación.' },
      { weeks: 'Semana 8–12', pct: 92, desc: 'Axilas prácticamente sin vello. Sin desodorante oscuro, sin vergüenza.' },
    ],
  },
  {
    id: 'bikini', label: 'Bikini', emoji: '👙',
    problem: 'Zona sensible — sin dolor, sin pelos encarnados',
    src: 'https://acdn-us.mitiendanube.com/stores/006/731/084/products/6428cf2f-d00e-4db4-a9b6-44635b9c302e-f1709437539a2f618417603729146590-1024-1024.webp',
    progress: [
      { weeks: 'Semana 1–3',  pct: 25, desc: 'Crecimiento más lento desde las primeras sesiones. Sin irritación ni pelos encarnados.' },
      { weeks: 'Semana 4–6',  pct: 58, desc: 'Reducción notable. Sin la irritación habitual de la cera o la cuchilla.' },
      { weeks: 'Semana 8–12', pct: 87, desc: 'Lista para la pileta y la playa en cualquier momento, sin apuros.' },
    ],
  },
  {
    id: 'cara', label: 'Cara', emoji: '🫦',
    problem: 'Bozo, mentón, patillas — sin dolor y sin sombra',
    src: 'https://acdn-us.mitiendanube.com/stores/006/731/084/products/6428cf2f-d00e-4db4-a9b6-44635b9c302e-f1709437539a2f618417603729146590-1024-1024.webp',
    progress: [
      { weeks: 'Semana 1–3',  pct: 18, desc: 'Crecimiento más lento en bozo, mentón y zona mandibular.' },
      { weeks: 'Semana 4–6',  pct: 45, desc: 'El vello que crece es más fino y claro. Menos "sombra" visible.' },
      { weeks: 'Semana 8–12', pct: 80, desc: 'Rostro liso y uniforme. Confianza total para cualquier foto.' },
    ],
  },
  {
    id: 'brazos', label: 'Brazos', emoji: '💪',
    problem: 'Brazos y antebrazos — piel suave para siempre',
    src: 'https://acdn-us.mitiendanube.com/stores/006/731/084/products/6428cf2f-d00e-4db4-a9b6-44635b9c302e-f1709437539a2f618417603729146590-1024-1024.webp',
    progress: [
      { weeks: 'Semana 1–3',  pct: 22, desc: 'Reducción inicial del vello en brazos y antebrazos.' },
      { weeks: 'Semana 4–6',  pct: 52, desc: 'El vello crece más ralo y más fino que al principio.' },
      { weeks: 'Semana 8–12', pct: 85, desc: 'Brazos suaves y sin vello. Usá cualquier ropa sin pensarlo.' },
    ],
  },
  {
    id: 'abdomen', label: 'Abdomen', emoji: '🌟',
    problem: 'Perfecta para el verano — la línea del ombligo',
    src: 'https://acdn-us.mitiendanube.com/stores/006/731/084/products/6428cf2f-d00e-4db4-a9b6-44635b9c302e-f1709437539a2f618417603729146590-1024-1024.webp',
    progress: [
      { weeks: 'Semana 1–3',  pct: 20, desc: 'Primeras reducciones visibles en la línea del abdomen.' },
      { weeks: 'Semana 4–6',  pct: 50, desc: 'Menos de la mitad del vello original.' },
      { weeks: 'Semana 8–12', pct: 85, desc: 'Abdomen liso. Lista para la playa en cualquier momento.' },
    ],
  },
];

/* ── NUEVO: Timeline de resultados ─────────────────────── */
const TIMELINE = [
  { stage: 'Semanas 1–3',  icon: '🌱', title: 'Primeras señales',   desc: 'El vello crece más lento y más fino. Empezás a notar que tardás más días en volver a afeitarte.', pct: '~25%' },
  { stage: 'Semanas 4–8',  icon: '📉', title: 'Reducción visible',  desc: 'Más del 50% de reducción en las zonas tratadas. Podés pasar semanas enteras sin necesitar nada.', pct: '~55%' },
  { stage: 'Semanas 8–12', icon: '✨', title: 'Piel prácticamente libre', desc: 'Piel lisa y sin vello. Solo mantenimiento mensual para mantener los resultados permanentes.', pct: '~85%' },
];

/* ── NUEVO: Beneficios adicionales del IPL ─────────────── */
const EXTRA_BENEFITS = [
  { icon: '🌟', title: 'Elimina manchas del sol', desc: 'La luz IPL reduce la hiperpigmentación y las manchas causadas por la exposición solar.' },
  { icon: '🧬', title: 'Estimula el colágeno', desc: 'Los pulsos de luz activan la producción de colágeno, mejorando la textura general de la piel.' },
  { icon: '🚫', title: 'Adiós pelos encarnados', desc: 'Al actuar sobre la raíz, los pelos encarnados desaparecen progresivamente para siempre.' },
  { icon: '✨', title: 'Piel más luminosa', desc: 'Sin vello, la piel refleja más luz y luce más uniforme y radiante.' },
  { icon: '🩹', title: 'Sin irritación ni rojeces', desc: 'Sin cera, sin tirones, sin enrojecimientos. La piel queda perfectamente lisa.' },
  { icon: '💆', title: 'Poros más cerrados', desc: 'Mejora la textura rugosa de la piel y reduce los poros dilatados en las zonas tratadas.' },
];

/* Pasos */
const STEPS = [
  { num: '1', title: 'Afeitá la zona', desc: 'Antes de cada sesión, afeitá la zona a tratar con la afeitadora eléctrica incluida. El IPL actúa sobre la raíz del vello, no sobre el vello visible.' },
  { num: '2', title: 'Elegí tu nivel', desc: 'Ponete las gafas protectoras incluidas. Empezá en el nivel 1 y aumentá gradualmente. La mayoría de las usuarias trabaja en nivel 3 o 4.' },
  { num: '3', title: 'Aplicá los pulsos', desc: 'Apoyá el dispositivo sobre la piel y presioná el botón. Avanzá zona por zona. Repetí cada 2 semanas las primeras 6 sesiones, luego mantenimiento mensual.' },
];

/* Antes & Después */
const beforeAfterData = [
  { name: 'Valentina, 29', stars: 5, label: 'Semana 1', label2: 'Semana 6', src: 'https://acdn-us.mitiendanube.com/stores/006/731/084/products/6428cf2f-d00e-4db4-a9b6-44635b9c302e-f1709437539a2f618417603729146590-1024-1024.webp', text: '"Practicamente tenia barba y ahora que me depilo tarda 4 días que es un montón. Estoy feliz. Resultado rápido. Sin dolor. Económica. No duden en comprar."' },
  { name: 'Florencia M., 34', stars: 5, label: 'Semana 1', label2: 'Semana 6', src: 'https://acdn-us.mitiendanube.com/stores/006/731/084/products/6428cf2f-d00e-4db4-a9b6-44635b9c302e-f1709437539a2f618417603729146590-1024-1024.webp', text: '"Es la segunda vez que compro este producto, para mí es sensacional, práctico, cómodo y de excelente resultado. Ya no gasto en el centro estético."' },
  { name: 'Natalia R., 38', stars: 5, label: 'Semana 1', label2: 'Semana 8', src: 'https://acdn-us.mitiendanube.com/stores/006/731/084/products/6428cf2f-d00e-4db4-a9b6-44635b9c302e-f1709437539a2f618417603729146590-1024-1024.webp', text: '"Antes gastaba en depilación cada mes. Con la IPL ya no necesito ir al centro estético. En 2 meses recuperé lo que pagué. El ahorro es brutal."' },
];

/* FAQ */
const faqs = [
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

/* ── Sub-componente: Stats circulares ─────────────────────── */
function IplStatsCircles({ items }) {
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
              setValues(prev => { const next = [...prev]; next[idx] = current; return next; });
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
    <div className="ipl-sc-section">
      <div className="ipl-sc-list">
        {items.map((item, i) => (
          <div key={i} className="ipl-sc-row" ref={el => circleRefs.current[i] = el} data-idx={i}>
            <div className="ipl-sc-circle" style={{ '--ipl-sc-pct': `${values[i]}%` }}>
              <span className="ipl-sc-pct">{values[i]}%</span>
            </div>
            <p className="ipl-sc-text">{item.text}</p>
          </div>
        ))}
      </div>
      <div className="ipl-sc-footer">
        <p className="ipl-sc-footer-note">*Basado en compras verificadas</p>
        <div className="ipl-sc-footer-stats">
          <div className="ipl-sc-stat"><span className="ipl-sc-stat-val">+10.000</span><span className="ipl-sc-stat-lbl">CLIENTAS</span></div>
          <div className="ipl-sc-stat"><span className="ipl-sc-stat-val">4.9/5</span><span className="ipl-sc-stat-lbl">SATISFACCIÓN</span></div>
          <div className="ipl-sc-stat"><span className="ipl-sc-stat-val">+5.000</span><span className="ipl-sc-stat-lbl">RESEÑAS</span></div>
        </div>
      </div>
    </div>
  );
}

/* ── Componente principal ─────────────────────────────────── */
export default function DepiladoraIPL() {
  const [product, setProduct]           = useState(null);
  const [productReady, setProductReady] = useState(false);
  const [activeImg, setActiveImg]       = useState(0);
  const [openTab, setOpenTab]           = useState(null);
  const [openFaq, setOpenFaq]           = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [annIdx, setAnnIdx]             = useState(0);
  const [annVisible, setAnnVisible]     = useState(true);
  const [testIdx, setTestIdx]           = useState(0);
  const [slidesPerView, setSlidesPerView] = useState(1);
  const [stickyVisible, setStickyVisible] = useState(false);
  const [hrIdx, setHrIdx]               = useState(0);
  const [baIdx, setBaIdx]               = useState(0);
  const [selectedBundle, setSelectedBundle] = useState(0);
  const [activeZone, setActiveZone]         = useState(0);

  const ctaRef   = useRef(null);
  const baTouchX = useRef(null);
  const { addItem } = useCart();

  /* API fetch */
  useEffect(() => {
    api.get(`/products/slug/${PRODUCT_SLUG}`)
      .then(r => { setProduct(r.data?.data || r.data); setProductReady(true); })
      .catch(() => setProductReady(true));
  }, []);

  /* Precarga imágenes before/after */
  useEffect(() => {
    beforeAfterData.forEach(item => {
      const img = new window.Image();
      img.src = item.src;
    });
  }, []);

  /* Slides per view */
  useEffect(() => {
    const update = () => setSlidesPerView(window.innerWidth >= 768 ? 3 : 1);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  /* Announcement rotation */
  useEffect(() => {
    const t = setInterval(() => {
      setAnnVisible(false);
      setTimeout(() => { setAnnIdx(i => (i + 1) % annMsgs.length); setAnnVisible(true); }, 400);
    }, 3000);
    return () => clearInterval(t);
  }, []);

  /* Hero review rotation */
  useEffect(() => {
    const t = setInterval(() => setHrIdx(i => (i + 1) % heroReviews.length), 5000);
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

  const price      = product?.price ?? DEFAULT_PRICE;
  const compareAt  = product?.compareAtPrice ?? DEFAULT_COMPARE;
  const discountPct = compareAt > price ? Math.round(((compareAt - price) / compareAt) * 100) : 55;
  const soldOut    = product?.stock === 0;

  const fmt = (n) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);

  const BUNDLES = useMemo(() => [
    {
      id: 0,
      label: 'Pack Completo',
      badge: 'MÁS POPULAR',
      perks: 'Envío gratis · 3 cuotas sin interés',
      bundlePrice: price,
      comparePrice: compareAt,
      productThumbName: BUNDLE_PRODUCT_NAME,
      extras: [
        { id: 'razor', label: BUNDLE_RAZOR_NAME, img: BUNDLE_RAZOR_IMG },
        { id: 'ebook', label: BUNDLE_EBOOK_NAME,  img: BUNDLE_EBOOK_IMG },
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
    track('InitiateCheckout', { value: parseFloat(bundle.bundlePrice) || 0, currency: 'ARS', content_name: CHECKOUT_NAME });
    setShowCheckout(true);
  };

  const maxTestIdx = Math.max(0, reviewsData.length - slidesPerView);
  const testPrev = () => setTestIdx(i => Math.max(0, i - 1));
  const testNext = () => setTestIdx(i => Math.min(maxTestIdx, i + 1));

  const baTouchStart = (e) => { baTouchX.current = e.touches[0].clientX; };
  const baTouchEnd   = (e) => {
    if (baTouchX.current === null) return;
    const diff = baTouchX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) setBaIdx(i => Math.min(i + 1, beforeAfterData.length - 1));
      else setBaIdx(i => Math.max(i - 1, 0));
    }
    baTouchX.current = null;
  };

  // 🖼 Galería de imágenes del producto — reemplazá con tus URLs reales
  const productImages = [
    { src: 'https://acdn-us.mitiendanube.com/stores/006/731/084/products/6428cf2f-d00e-4db4-a9b6-44635b9c302e-f1709437539a2f618417603729146590-1024-1024.webp', alt: 'Depiladora IPL — vista principal' },
    { src: 'https://acdn-us.mitiendanube.com/stores/006/731/084/products/6428cf2f-d00e-4db4-a9b6-44635b9c302e-f1709437539a2f618417603729146590-1024-1024.webp', alt: 'Depiladora IPL — uso en piernas' },
    { src: 'https://acdn-us.mitiendanube.com/stores/006/731/084/products/6428cf2f-d00e-4db4-a9b6-44635b9c302e-f1709437539a2f618417603729146590-1024-1024.webp', alt: 'Depiladora IPL — kit completo' },
    { src: 'https://acdn-us.mitiendanube.com/stores/006/731/084/products/6428cf2f-d00e-4db4-a9b6-44635b9c302e-f1709437539a2f618417603729146590-1024-1024.webp', alt: 'Depiladora IPL — niveles de intensidad' },
  ];

  if (!productReady) {
    return (
      <div className="ipl-loading-wrap">
        <div className="ipl-loading-bar" />
      </div>
    );
  }

  return (
    <>
      <div className="ipl-wrap">

        {/* ══ S1 — ANNOUNCEMENT BAR ══ */}
        <div className="ipl-ann-bar">
          <span className={`ipl-ann-msg ${annVisible ? 'visible' : 'hidden'}`}>
            {annMsgs[annIdx]}
          </span>
        </div>

        {/* ══ S2 — HERO ══ */}
        <div className="ipl-hero">
          <div className="ipl-hero-inner">

            {/* Galería */}
            <div className="ipl-gallery">
              <div className="ipl-gallery-main">
                <img
                  src={productImages[activeImg].src}
                  alt={productImages[activeImg].alt}
                  loading="eager"
                  decoding="async"
                />
              </div>
              <div className="ipl-thumbs">
                {productImages.map((img, i) => (
                  <div
                    key={i}
                    className={`ipl-thumb${i === activeImg ? ' ipl-thumb-active' : ''}`}
                    onClick={() => setActiveImg(i)}
                    role="button" tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && setActiveImg(i)}
                    aria-label={`Imagen ${i + 1}`}
                  >
                    <img src={img.src} alt={img.alt} />
                  </div>
                ))}
              </div>
            </div>

            {/* Info de compra */}
            <div className="ipl-info">
              <div className="ipl-stars">
                <span style={{ color: '#F472B6' }}>★★★★★</span>
                <span className="ipl-stars-count">4.9 / 5</span>
                <span className="ipl-reviews-count">| Más de 10.000 clientas satisfechas</span>
              </div>

              <h1 className="ipl-product-title">Depiladora IPL Profesional de Amelor</h1>

              <div className="ipl-pricing">
                <span className="ipl-price-original">{fmt(compareAt)}</span>
                <span className="ipl-price-sale">{fmt(price)}</span>
                <span className="ipl-badge-discount">{discountPct}% OFF</span>
                <span className="ipl-cuotas">3 cuotas sin interés de <strong>{fmt(Math.ceil(price / 3))}</strong></span>
              </div>

              <ul className="ipl-benefits">
                {BENEFITS.map((b, i) => (
                  <li key={i} className="ipl-benefit-item">
                    <span className="ipl-benefit-check">✅</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>

              {/* Bundle selector */}
              <div className="ipl-bundles">
                {BUNDLES.map((b, i) => (
                  <label
                    key={b.id}
                    className={`ipl-bundle-opt${selectedBundle === i ? ' selected' : ''}`}
                    onClick={() => setSelectedBundle(i)}
                  >
                    <input type="radio" name="ipl-bundle" checked={selectedBundle === i} onChange={() => setSelectedBundle(i)} />
                    <div className="ipl-bundle-body">
                      <div className="ipl-bundle-top">
                        <div className="ipl-bundle-left">
                          <div className="ipl-bundle-label-row">
                            <span className="ipl-bundle-label">{b.label}</span>
                            {b.badge && <span className="ipl-bundle-badge">{b.badge}</span>}
                          </div>
                          <span className="ipl-bundle-perks">{b.perks}</span>
                        </div>
                        <div className="ipl-bundle-price-col">
                          <span className="ipl-bundle-price">{fmt(b.bundlePrice)}</span>
                          <span className="ipl-bundle-compare">{fmt(b.comparePrice)}</span>
                        </div>
                      </div>

                      {b.extras.length > 0 && (
                        <div className="ipl-bundle-extras-wrap">
                          <div className="ipl-bundle-thumbs">
                            {/* Producto principal */}
                            <div className="ipl-bundle-item">
                              <div className="ipl-bundle-thumb">
                                <img src={BUNDLE_PRODUCT_IMG} alt={b.productThumbName} />
                              </div>
                              <span className="ipl-bundle-item-name">{b.productThumbName}</span>
                            </div>
                            <span className="ipl-bundle-plus">+</span>
                            {/* Extra 1 */}
                            <div className="ipl-bundle-item">
                              <div className="ipl-bundle-thumb">
                                <img src={b.extras[0].img} alt={b.extras[0].label} />
                                <span className="ipl-bundle-sticker">GRATIS</span>
                              </div>
                              <span className="ipl-bundle-item-name">{b.extras[0].label}</span>
                            </div>
                            <span className="ipl-bundle-plus">+</span>
                            {/* Extra 2 */}
                            <div className="ipl-bundle-item">
                              <div className="ipl-bundle-thumb">
                                <img src={b.extras[1].img} alt={b.extras[1].label} />
                                <span className="ipl-bundle-sticker">GRATIS</span>
                              </div>
                              <span className="ipl-bundle-item-name">{b.extras[1].label}</span>
                            </div>
                          </div>
                          <div className="ipl-bundle-shipping">🚚 Envío gratis a todo el país</div>
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>

              <div className="ipl-urgency">
                <span>🔴</span>
                <span>Casi agotado | Solo quedan 7 unidades</span>
              </div>

              <button ref={ctaRef} className="ipl-btn-cta" onClick={handleBuy} disabled={soldOut}>
                {soldOut ? 'AGOTADO' : 'AGREGAR AL CARRITO ➔'}
              </button>

              {/* Trust badges */}
              <div className="ipl-trust-badges">
                <div className="ipl-trust-item">
                  <img src="//www.luxcove.co/cdn/shop/files/Untitled_design_-_2024-06-30T131118.961.png?v=1719749489" alt="Garantía" style={{ width: 44, height: 44, borderRadius: 8 }} />
                  <span>Garantía devolución<br />90 días</span>
                </div>
                <div className="ipl-trust-item">
                  <img src="//www.luxcove.co/cdn/shop/files/Untitled_design_-_2024-06-30T131541.485.png?v=1719749753" alt="Envío" style={{ width: 44, height: 44, borderRadius: 8 }} />
                  <span>Envío gratis<br />en todos los pedidos</span>
                </div>
                <div className="ipl-trust-item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 50 50" fill="currentColor" style={{ flexShrink: 0 }}><path d="M 21.4375 1.0058594 C 20.081703 1.0463506 18.771739 1.7524791 18.025391 2.9863281 L 17.761719 3.4238281 C 17.385173 4.0455037 16.721685 4.4283987 15.996094 4.4433594 L 15.994141 4.4433594 L 15.482422 4.4550781 C 13.286577 4.5008101 11.497809 6.2882845 11.453125 8.484375 L 11.441406 8.9960938 C 11.426446 9.7216978 11.042385 10.386559 10.421875 10.761719 L 9.984375 11.027344 C 8.1054479 12.164721 7.4493952 14.60833 8.5078125 16.533203 L 8.5097656 16.533203 L 8.7558594 16.982422 C 9.1060077 17.618128 9.1060077 18.385778 8.7558594 19.021484 L 8.5097656 19.46875 C 7.4515168 21.393317 8.1061771 23.837315 9.9863281 24.974609 L 10.423828 25.238281 C 11.045504 25.614827 11.428399 26.278315 11.443359 27.003906 L 11.443359 27.005859 L 11.455078 27.517578 C 11.49207 29.293819 12.67637 30.78643 14.287109 31.322266 L 9.0917969 42.580078 A 1.0001 1.0001 0 0 0 10 44 L 16.519531 44 L 20.21875 48.625 A 1.0001 1.0001 0 0 0 21.916016 48.400391 L 25.03125 41.28125 L 28.146484 48.400391 A 1.0001 1.0001 0 0 0 29.84375 48.625 L 33.542969 44 L 40.0625 44 A 1.0001 1.0001 0 0 0 40.970703 42.580078 L 35.767578 31.304688 C 37.351214 30.753718 38.510287 29.274384 38.546875 27.517578 L 38.546875 27.515625 L 38.558594 27.005859 L 38.558594 27.003906 C 38.573554 26.278302 38.957615 25.613441 39.578125 25.238281 L 40.017578 24.972656 C 41.896553 23.835278 42.550604 21.393623 41.492188 19.46875 L 41.490234 19.466797 L 41.240234 19.015625 C 40.892213 18.380675 40.892703 17.614886 41.242188 16.980469 L 41.490234 16.533203 C 42.548024 14.607519 41.893895 12.165278 40.015625 11.027344 L 39.576172 10.761719 C 38.954541 10.385361 38.571601 9.7216849 38.556641 8.9960938 L 38.544922 8.484375 C 38.499191 6.2865703 36.711715 4.4978091 34.515625 4.453125 L 34.003906 4.4414062 C 33.278302 4.4264453 32.613441 4.0423845 32.238281 3.421875 L 31.972656 2.984375 C 30.835362 1.104224 28.391364 0.44956368 26.466797 1.5078125 L 26.017578 1.7558594 C 25.381872 2.1060077 24.614222 2.1060077 23.978516 1.7558594 L 23.53125 1.5097656 C 23.050108 1.2452034 22.537032 1.0874427 22.019531 1.0292969 C 21.825469 1.0074922 21.631185 1.0000749 21.4375 1.0058594 z" /></svg>
                  <span>Garantía<br />1 año</span>
                </div>
              </div>

              {/* Medios de pago */}
              <div className="ipl-payment-block">
                <div className="ipl-payment-grid">
                  <img className="ipl-pay-chip" src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Mercado_Pago.svg/3840px-Mercado_Pago.svg.png" alt="MercadoPago" style={{ height: 22 }} />
                  <svg className="ipl-pay-chip" xmlns="http://www.w3.org/2000/svg" role="img" viewBox="0 0 38 24" width="38" height="24" aria-label="Visa"><path opacity=".07" d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.4 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.4-3-3-3z"/><path fill="#fff" d="M35 1c1.1 0 2 .9 2 2v18c0 1.1-.9 2-2 2H3c-1.1 0-2-.9-2-2V3c0-1.1.9-2 2-2h32"/><path d="M28.3 10.1H28c-.4 1-.7 1.5-1 3h1.9c-.3-1.5-.3-2.2-.6-3zm2.9 5.9h-1.7c-.1 0-.1 0-.2-.1l-.2-.9-.1-.2h-2.4c-.1 0-.2 0-.2.2l-.3.9c0 .1-.1.1-.1.1h-2.1l.2-.5L27 8.7c0-.5.3-.7.8-.7h1.5c.1 0 .2 0 .2.2l1.4 6.5c.1.4.2.7.2 1.1.1.1.1.1.1.2zm-13.4-.3l.4-1.8c.1 0 .2.1.2.1.7.3 1.4.5 2.1.4.2 0 .5-.1.7-.2.5-.2.5-.7.1-1.1-.2-.2-.5-.3-.8-.5-.4-.2-.8-.4-1.1-.7-1.2-1-.8-2.4-.1-3.1.6-.4.9-.8 1.7-.8 1.2 0 2.5 0 3.1.2h.1c-.1.6-.2 1.1-.4 1.7-.5-.2-1-.4-1.5-.4-.3 0-.6 0-.9.1-.2 0-.3.1-.4.2-.2.2-.2.5 0 .7l.5.4c.4.2.8.4 1.1.6.5.3 1 .8 1.1 1.4.2.9-.1 1.7-.9 2.3-.5.4-.7.6-1.4.6-1.4 0-2.5.1-3.4-.2-.1.2-.1.2-.2.1zm-3.5.3c.1-.7.1-.7.2-1 .5-2.2 1-4.5 1.4-6.7.1-.2.1-.3.3-.3H18c-.2 1.2-.4 2.1-.7 3.2-.3 1.5-.6 3-1 4.5 0 .2-.1.2-.3.2M5 8.2c0-.1.2-.2.3-.2h3.4c.5 0 .9.3 1 .8l.9 4.4c0 .1 0 .1.1.2 0-.1.1-.1.1-.1l2.1-5.1c-.1-.1 0-.2.1-.2h2.1c0 .1 0 .1-.1.2l-3.1 7.3c-.1.2-.1.3-.2.4-.1.1-.3 0-.5 0H9.7c-.1 0-.2 0-.2-.2L7.9 9.5c-.2-.2-.5-.5-.9-.6-.6-.3-1.7-.5-1.9-.5L5 8.2z" fill="#142688"/></svg>
                  <svg className="ipl-pay-chip" viewBox="0 0 38 24" xmlns="http://www.w3.org/2000/svg" role="img" width="38" height="24" aria-label="Mastercard"><path opacity=".07" d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.4 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.4-3-3-3z"/><path fill="#fff" d="M35 1c1.1 0 2 .9 2 2v18c0 1.1-.9 2-2 2H3c-1.1 0-2-.9-2-2V3c0-1.1.9-2 2-2h32"/><circle fill="#EB001B" cx="15" cy="12" r="7"/><circle fill="#F79E1B" cx="23" cy="12" r="7"/><path fill="#FF5F00" d="M22 12c0-2.4-1.2-4.5-3-5.7-1.8 1.3-3 3.4-3 5.7s1.2 4.5 3 5.7c1.8-1.2 3-3.3 3-5.7z"/></svg>
                </div>
              </div>

              {/* Review inline hero */}
              <div className="ipl-hero-review">
                <div className="ipl-hr-avatar">
                  <img src={heroReviews[hrIdx].avatar} alt={heroReviews[hrIdx].name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                </div>
                <div className="ipl-hr-content">
                  <div className="ipl-hr-top">
                    <strong className="ipl-hr-name">{heroReviews[hrIdx].name}</strong>
                    <span className="ipl-hr-stars">{'★'.repeat(heroReviews[hrIdx].stars)}</span>
                  </div>
                  <p className="ipl-hr-text">"{heroReviews[hrIdx].text}"</p>
                </div>
                <button className="ipl-hr-next" onClick={() => setHrIdx(i => (i + 1) % heroReviews.length)} aria-label="Siguiente reseña">›</button>
              </div>

              {/* Acordeón */}
              <div className="ipl-accordion">
                {PRODUCT_TABS.map((tab, i) => (
                  <div key={i} className="ipl-acc-item">
                    <button
                      className="ipl-acc-trigger"
                      onClick={() => setOpenTab(openTab === i ? null : i)}
                      aria-expanded={openTab === i}
                    >
                      <span className="ipl-acc-icon">{accordionIcons[i]}</span>
                      <span className="ipl-acc-title">{tab.title}</span>
                      <span className={`ipl-acc-arrow${openTab === i ? ' open' : ''}`}>›</span>
                    </button>
                    <div className={`ipl-acc-body${openTab === i ? ' open' : ''}`} aria-hidden={openTab !== i}>
                      <div className="ipl-acc-body-inner">
                        {tab.content.map((line, j) => <p key={j}>{line}</p>)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ══ S3 — TESTIMONIOS CAROUSEL ══ */}
        <div className="ipl-section ipl-section--rose">
          <div className="ipl-container">
            <h2 className="ipl-section-title">A nuestras clientas les <em>ENCANTA</em> la Depiladora IPL</h2>
            <div className="ipl-test-viewport">
              <div className="ipl-test-track" style={{ transform: `translateX(-${testIdx * (100 / slidesPerView)}%)` }}>
                {reviewsData.map((t, i) => (
                  <div key={i} className="ipl-test-slide">
                    <div className="ipl-test-card">
                      <div className="ipl-review-avatar">
                        <img src={t.avatar} alt={t.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                      </div>
                      <div className="ipl-review-stars">{'★'.repeat(t.stars)}</div>
                      <p className="ipl-test-text">"{t.text}"</p>
                      <div className="ipl-test-name">— {t.name}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="ipl-test-nav">
              <button className="ipl-test-btn" onClick={testPrev} aria-label="Anterior">‹</button>
              <div className="ipl-test-dots">
                {Array.from({ length: maxTestIdx + 1 }).map((_, i) => (
                  <button key={i} className={`ipl-test-dot${i === testIdx ? ' ipl-active' : ''}`} onClick={() => setTestIdx(i)} aria-label={`Testimonio ${i + 1}`} />
                ))}
              </div>
              <button className="ipl-test-btn" onClick={testNext} aria-label="Siguiente">›</button>
            </div>
          </div>
        </div>

        {/* ══ S3.5 — PROGRESO SEMANA A SEMANA ══ */}
        <div className="ipl-section ipl-section--white">
          <div className="ipl-container">
            <h2 className="ipl-section-title">Resultados desde casa, semana a semana</h2>
            <p className="ipl-section-sub">Elegí tu zona y mirá cómo progresa el tratamiento.</p>
            <div className="ipl-zone-tabs">
              {ZONE_TABS.map((zone, i) => (
                <button
                  key={zone.id}
                  className={`ipl-zone-tab${activeZone === i ? ' ipl-zone-tab--active' : ''}`}
                  onClick={() => setActiveZone(i)}
                >
                  <span className="ipl-zone-tab-emoji">{zone.emoji}</span>
                  <span className="ipl-zone-tab-label">{zone.label}</span>
                </button>
              ))}
            </div>
            <div className="ipl-zone-content">
              <div className="ipl-zone-img-wrap">
                <img
                  src={ZONE_TABS[activeZone].src}
                  alt={`Resultados ${ZONE_TABS[activeZone].label}`}
                  loading="lazy"
                />
              </div>
              <div className="ipl-zone-progress-wrap">
                <p className="ipl-zone-problem">{ZONE_TABS[activeZone].problem}</p>
                {ZONE_TABS[activeZone].progress.map((step, i) => (
                  <div key={i} className="ipl-zone-step">
                    <div className="ipl-zone-step-header">
                      <span className="ipl-zone-step-weeks">{step.weeks}</span>
                      <span className="ipl-zone-step-pct">{step.pct}% menos vello</span>
                    </div>
                    <div className="ipl-zone-bar-bg">
                      <div className="ipl-zone-bar-fill" style={{ width: `${step.pct}%` }} />
                    </div>
                    <p className="ipl-zone-step-desc">{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ══ S4 — HOOK "PAGÁS UNA VEZ" ══ */}
        <div className="ipl-feat-section" style={{ background: '#fff' }}>
          <div className="ipl-feat-inner">
            <div className="ipl-feat-img">
              <img
                src="https://acdn-us.mitiendanube.com/stores/006/731/084/products/6428cf2f-d00e-4db4-a9b6-44635b9c302e-f1709437539a2f618417603729146590-1024-1024.webp"
                alt="Depiladora IPL en uso"
                loading="lazy"
                style={{ width: '100%', height: '100%', minHeight: 280, objectFit: 'cover' }}
              />
            </div>
            <div className="ipl-feat-text">
              <div className="ipl-feat-kicker">💰 AHORRO REAL</div>
              <h2 className="ipl-feat-title">Terminá con el ciclo interminable de gastar plata en depilación.</h2>
              <p className="ipl-feat-desc">Cera, hilo, centro estético — el gasto nunca termina. Con la IPL, pagás una sola vez y la usás de por vida. Más de 999.999 pulsos para años y años de uso.</p>
              <p className="ipl-feat-desc">En promedio, las clientas recuperan la inversión en menos de 2 meses de uso.</p>
            </div>
          </div>
        </div>

        {/* ══ S5 — HOOK "SIN DOLOR" ══ */}
        <div className="ipl-feat-section" style={{ background: 'var(--ipl-section-rose)' }}>
          <div className="ipl-feat-inner ipl-feat-reverse">
            <div className="ipl-feat-img">
              <img
                src="https://acdn-us.mitiendanube.com/stores/006/731/084/products/6428cf2f-d00e-4db4-a9b6-44635b9c302e-f1709437539a2f618417603729146590-1024-1024.webp"
                alt="Depiladora IPL sin dolor"
                loading="lazy"
                style={{ width: '100%', height: '100%', minHeight: 280, objectFit: 'cover' }}
              />
            </div>
            <div className="ipl-feat-text">
              <div className="ipl-feat-kicker">✨ SIN DOLOR</div>
              <h2 className="ipl-feat-title">Olvidate del dolor de la cera. Para siempre.</h2>
              <p className="ipl-feat-desc">La tecnología IPL no arranca el vello — actúa sobre la raíz con pulsos de luz suaves. Sin tirones, sin irritación, sin pelos encarnados.</p>
              <p className="ipl-feat-desc">Resultados visibles desde la sesión 3. Sin citas, sin traslados, sin apuros.</p>
            </div>
          </div>
        </div>

        {/* ══ S6 — HOOK "PARA TODO EL CUERPO" ══ */}
        <div className="ipl-feat-section" style={{ background: '#fff' }}>
          <div className="ipl-feat-inner">
            <div className="ipl-feat-img">
              <img
                src="https://acdn-us.mitiendanube.com/stores/006/731/084/products/6428cf2f-d00e-4db4-a9b6-44635b9c302e-f1709437539a2f618417603729146590-1024-1024.webp"
                alt="Depiladora IPL para todo el cuerpo"
                loading="lazy"
                style={{ width: '100%', height: '100%', minHeight: 280, objectFit: 'cover' }}
              />
            </div>
            <div className="ipl-feat-text">
              <div className="ipl-feat-kicker">🏆 TODO EL CUERPO</div>
              <h2 className="ipl-feat-title">Piernas, axilas, bikini, brazos, bozo — todo en un solo dispositivo.</h2>
              <p className="ipl-feat-desc">5 niveles de intensidad para adaptar el tratamiento a cada zona del cuerpo y cada tipo de piel. Una sola compra que reemplaza todos tus gastos de depilación.</p>
            </div>
          </div>
        </div>

        {/* ══ S7 — STATS CIRCULARES ══ */}
        <div className="ipl-section ipl-section--white">
          <div className="ipl-container">
            <h2 className="ipl-section-title">Resultados reales, números reales.</h2>
            <p className="ipl-section-sub">Basado en encuestas a clientas de Amelor con compra verificada.</p>
            <IplStatsCircles items={statsData} />
          </div>
        </div>

        {/* ══ S8 — 4 FEATURES CON ÍCONOS ══ */}
        <div className="ipl-section ipl-section--white">
          <div className="ipl-container">
            <div className="ipl-features-grid">
              {FEATURES.map((f, i) => (
                <div key={i} className="ipl-feature-item">
                  <div className="ipl-feature-icon">{f.icon}</div>
                  <div className="ipl-feature-title">{f.title}</div>
                  <div className="ipl-feature-desc">{f.desc}</div>
                </div>
              ))}
            </div>
            <div className="ipl-cta-row">
              <button className="ipl-btn-cta-center" onClick={handleBuy} disabled={soldOut}>
                {soldOut ? 'AGOTADO' : 'AGREGAR AL CARRITO ➔'}
              </button>
            </div>
          </div>
        </div>

        {/* ══ S8.5 — BENEFICIOS EXTRA DEL IPL ══ */}
        <div className="ipl-section ipl-section--rose">
          <div className="ipl-container">
            <h2 className="ipl-section-title">Más allá de la depilación</h2>
            <p className="ipl-section-sub">La luz IPL hace mucho más que eliminar el vello.</p>
            <div className="ipl-extra-benefits">
              {EXTRA_BENEFITS.map((b, i) => (
                <div key={i} className="ipl-extra-benefit-item">
                  <div className="ipl-extra-benefit-icon">{b.icon}</div>
                  <h3 className="ipl-extra-benefit-title">{b.title}</h3>
                  <p className="ipl-extra-benefit-desc">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══ S9 — TABLA COMPARATIVA ══ */}
        <div className="ipl-comp-section">
          <h2 className="ipl-comp-title">IPL en casa vs Cera vs Láser profesional</h2>
          <p className="ipl-comp-sub">Comparativa honesta para que tomes la mejor decisión.</p>
          <div className="ipl-comp-table">
            <div className="ipl-comp-header">
              <div className="ipl-comp-col-feature"></div>
              <div className="ipl-comp-col-us">IPL Amelor</div>
              <div className="ipl-comp-col-wax">Cera / Hilo</div>
              <div className="ipl-comp-col-laser">Láser prof.</div>
            </div>
            {compRows.map((row, i) => (
              <div key={i} className={`ipl-comp-row ${i % 2 === 0 ? 'even' : 'odd'}`}>
                <div className="ipl-comp-col-feature">{row.feature}</div>
                <div className="ipl-comp-col-us ipl-comp-highlight">{row.ipl}</div>
                <div className="ipl-comp-col-wax ipl-comp-bad">{row.wax}</div>
                <div className="ipl-comp-col-laser ipl-comp-mid">{row.laser}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ══ S10 — ANTES & DESPUÉS CAROUSEL ══ */}
        <div className="ipl-section ipl-section--rose">
          <div className="ipl-container">
            <h2 className="ipl-section-title">Clientas reales, resultados reales</h2>
            <p className="ipl-section-sub">Reseñas verificadas de compradoras en Argentina.</p>
            <div className="ipl-ba-carousel" onTouchStart={baTouchStart} onTouchEnd={baTouchEnd}>
              <div className="ipl-ba-card">
                <div className="ipl-ba-img">
                  <img
                    src={beforeAfterData[baIdx].src}
                    alt={beforeAfterData[baIdx].name}
                    loading="eager"
                    decoding="async"
                    style={{ width: '100%', aspectRatio: '4/3', minHeight: 220, objectFit: 'cover', borderRadius: 0 }}
                  />
                  <div className="ipl-ba-day-labels">
                    <span className="ipl-ba-day">{beforeAfterData[baIdx].label}</span>
                    <span className="ipl-ba-day">{beforeAfterData[baIdx].label2}</span>
                  </div>
                </div>
                <div className="ipl-ba-body">
                  <div className="ipl-ba-meta">
                    <span className="ipl-ba-name">{beforeAfterData[baIdx].name}</span>
                    <span className="ipl-ba-stars">{'★'.repeat(beforeAfterData[baIdx].stars)}</span>
                  </div>
                  <p className="ipl-ba-text">{beforeAfterData[baIdx].text}</p>
                </div>
              </div>
              <div className="ipl-ba-nav">
                <button className="ipl-test-btn" onClick={() => setBaIdx(i => Math.max(0, i - 1))} disabled={baIdx === 0} aria-label="Anterior">‹</button>
                <div className="ipl-test-dots">
                  {beforeAfterData.map((_, i) => (
                    <button key={i} className={`ipl-test-dot${i === baIdx ? ' ipl-active' : ''}`} onClick={() => setBaIdx(i)} aria-label={`Resultado ${i + 1}`} />
                  ))}
                </div>
                <button className="ipl-test-btn" onClick={() => setBaIdx(i => Math.min(beforeAfterData.length - 1, i + 1))} disabled={baIdx === beforeAfterData.length - 1} aria-label="Siguiente">›</button>
              </div>
            </div>
          </div>
        </div>

        {/* ══ S10.5 — TIMELINE DE RESULTADOS ══ */}
        <div className="ipl-timeline-section">
          <div className="ipl-container">
            <h2 className="ipl-section-title ipl-title-light">Tu camino hacia la piel perfecta</h2>
            <p className="ipl-section-sub ipl-sub-light">Lo que vas a experimentar semana a semana.</p>
            <div className="ipl-timeline">
              {TIMELINE.map((t, i) => (
                <div key={i} className="ipl-timeline-card">
                  <div className="ipl-timeline-icon">{t.icon}</div>
                  <div className="ipl-timeline-stage">{t.stage}</div>
                  <div className="ipl-timeline-pct">{t.pct} reducción</div>
                  <h3 className="ipl-timeline-title">{t.title}</h3>
                  <p className="ipl-timeline-desc">{t.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══ S11 — CÓMO USARLA ══ */}
        <div className="ipl-section ipl-section--white">
          <div className="ipl-container">
            <h2 className="ipl-section-title">Cómo usarla</h2>
            <p className="ipl-section-sub">3 pasos simples para una sesión completa.</p>
            <div className="ipl-steps">
              {STEPS.map((step, i) => (
                <div key={i} className="ipl-step-item">
                  <div className="ipl-step-num">{step.num}</div>
                  <div className="ipl-step-content">
                    <h3 className="ipl-step-title">{step.title}</h3>
                    <p className="ipl-step-desc">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══ S12 — GARANTÍA ══ */}
        <div className="ipl-section ipl-section--white">
          <div className="ipl-container">
            <div className="ipl-guarantee">
              <div className="ipl-guarantee-icon">
                <img
                  src="//www.luxcove.co/cdn/shop/files/Untitled_design_-_2024-08-10T191415.055_c5c01040-8d0b-4eb2-91b8-433509c299e1.png?v=1723313727"
                  alt="Garantía 90 días"
                  loading="lazy"
                  style={{ width: 160, height: 160, objectFit: 'contain' }}
                />
              </div>
              <h2 className="ipl-guarantee-title">Probala sin riesgos</h2>
              <p className="ipl-guarantee-text">
                Estamos seguras de que vas a ver resultados reales. Pero si por alguna razón no quedás satisfecha/o,
                devolvela en hasta 90 días y te reembolsamos el 100% del importe. Sin preguntas, sin vueltas.
                Tu piel lisa te espera — sin riesgo.
              </p>
              <button className="ipl-btn-cta-center" onClick={handleBuy} disabled={soldOut}>
                {soldOut ? 'AGOTADO' : 'AGREGAR AL CARRITO ➔'}
              </button>
            </div>
          </div>
        </div>

        {/* ══ S13 — FAQ ══ */}
        <div className="ipl-faq-section">
          <div className="ipl-container">
            <h2 className="ipl-faq-title">Preguntas frecuentes</h2>
            <p className="ipl-faq-sub">Todo lo que necesitás saber sobre la Depiladora IPL.</p>
            <div className="ipl-faq-list">
              {faqs.map((faq, i) => (
                <div key={i} className="ipl-faq-item">
                  <button
                    className="ipl-faq-trigger"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    aria-expanded={openFaq === i}
                  >
                    <span className="ipl-faq-q">{faq.q}</span>
                    <span className={`ipl-faq-arrow${openFaq === i ? ' open' : ''}`}>›</span>
                  </button>
                  <div className={`ipl-faq-body${openFaq === i ? ' open' : ''}`} aria-hidden={openFaq !== i}>
                    <div className="ipl-faq-body-inner">{faq.a}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>{/* /ipl-wrap */}

      {/* Sticky CTA bar */}
      <div className={`ipl-sticky-bar${stickyVisible ? ' ipl-visible' : ''}`} aria-hidden={!stickyVisible}>
        <button className="ipl-btn-cta" onClick={handleBuy} disabled={soldOut}>
          {soldOut ? 'AGOTADO' : 'AGREGAR AL CARRITO ➔'}
        </button>
      </div>

      {/* Footer */}
      <footer className="ipl-footer">
        <div className="ipl-footer-body">
          <div className="ipl-footer-brand">
            <div className="ipl-footer-logo">Amelor</div>
            <p className="ipl-footer-tagline">Tecnología que mejora tu vida diaria</p>
          </div>
          <div className="ipl-footer-trust-row">
            <div className="ipl-footer-ti"><span>🔒</span>Pago seguro</div>
            <div className="ipl-footer-ti"><span>🚚</span>Envío gratis</div>
            <div className="ipl-footer-ti"><span>🛡️</span>Garantía total</div>
            <div className="ipl-footer-ti"><span>💳</span>3 cuotas sin interés</div>
          </div>
          <div className="ipl-footer-bottom">
            <span>© 2026 Amelor · Todos los derechos reservados</span>
          </div>
        </div>
      </footer>

      {showCheckout && (
        <CheckoutSheet
          onClose={() => setShowCheckout(false)}
          primaryColor="#9F1239"
          primaryHover="#7f0f2e"
          accentColor="#F9A8D4"
          fontFamily="'Montserrat', sans-serif"
        />
      )}
    </>
  );
}
