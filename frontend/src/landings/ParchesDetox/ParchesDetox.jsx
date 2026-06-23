import { useState, useEffect, useRef, Fragment } from 'react';
import { CheckoutSheet } from '../../pages/CheckoutSheet';
import { useCart } from '../../context/CartContext';
import { track } from '../../lib/metaPixel';
import api from '../../services/api';
import mc from '../parches-detox';
import './ParchesDetox.css';

/* ── Constantes ─────────────────────────────────────────────── */
const PRODUCT_SLUG  = 'parches-detox';
const CHECKOUT_NAME = 'Parches Plantares Detox Kinoki';
const DEFAULT_PRICE   = 58000;
const DEFAULT_COMPARE = 96700;

/* Announcement bar */
const annMsgs = [
  '🌙 ¡OFERTA ESPECIAL DE LANZAMIENTO!',
  '🚚 ENVÍO GRATIS A TODO EL PAÍS',
  '⭐ +10.000 NOCHES TRANSFORMADAS',
  '🔒 GARANTÍA 90 DÍAS O DEVOLUCIÓN',
];

/* Hero benefits */
const BENEFITS = [
  { icon: '✨', text: 'Elimina dolores y tensión acumulada en el cuerpo' },
  { icon: '✅', text: 'Desintoxica y mejora tu energía desde la primera noche' },
  { icon: '💆‍♀️', text: 'Reduce inflamaciones y piernas pesadas' },
  { icon: '🌿', text: 'Ingredientes 100% naturales ' },
  { icon: '😴', text: 'Sueño más profundo y descanso reparador' },
];

/* Product accordion tabs */
const PRODUCT_TABS = [
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

const accordionIcons = [
  <svg key="leaf" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M4 16c2-6 8-8 12-6-4 0-8 2-10 6"/><path d="M4 16c1-3 4-5 8-5"/><circle cx="4" cy="16" r="1" fill="currentColor"/></svg>,
  <svg key="clock" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="10" cy="10" r="7"/><polyline points="10,6 10,10 13,12"/></svg>,
  <svg key="shield2" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M10 2l7 3v5c0 4-3 7-7 8-4-1-7-4-7-8V5l7-3z"/><polyline points="7,10 9,12 13,8"/></svg>,
  <svg key="box" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 7l7-4 7 4v9l-7 4-7-4V7z"/><path d="M3 7l7 4 7-4M10 11v7"/></svg>,
];

/* Hero inline reviews */
const heroReviews = [
  { name: 'Valentina C.', avatar: 'https://i.pravatar.cc/80?img=47', stars: 5, text: 'Primera noche y el parche amaneció oscuro. Me desperté sin el peso de siempre — algo funcionó.' },
  { name: 'Luciana P.',   avatar: 'https://i.pravatar.cc/80?img=49', stars: 5, text: 'Llevaba meses con las piernas pesadas. Dos semanas de uso y ya no siento esa hinchazón.' },
  { name: 'Sabrina S..',    avatar: 'https://www.luxcove.co/cdn/shop/files/4_6d5fe2b7-5b21-42f1-86a6-d13fd0a1a092.png?v=1741425640', stars: 5, text: 'Ver el parche negro en la mano al despertar me convenció. No hice nada, solo dormí.' },
];

/* Stats circulares */
const statsData = [
  { pct: 92, text: <>Personas que notaron <strong>más energía al despertar</strong> en las primeras 2 semanas.</> },
  { pct: 89, text: <>Reportaron <strong>piernas más livianas</strong> y menos hinchazón al final del día.</> },
  { pct: 85, text: <>Mejoraron la <strong>calidad de su sueño</strong> según encuesta interna.</> },
  { pct: 94, text: <>Lo <strong>recomendarían a un amigo</strong> sin dudarlo.</> },
];

/* Video strip — placeholder hasta tener videos reales */
const VSTRIP_VIDEOS = [
  { src: "https://cdn.shopify.com/s/files/1/0778/4303/8517/files/gempages_508979000853398631-547c1f82-51e8-41d6-a511-3f54ad4a0a00.gif", benefit: '' },
  { src: "https://cdn.shopify.com/s/files/1/0778/4303/8517/files/gempages_508979000853398631-aaad44f2-d927-4ca4-afd1-df3058de82a4.gif", benefit: '' },
  { src: "https://cdn.shopify.com/s/files/1/0778/4303/8517/files/gempages_508979000853398631-1e1e15b6-6aaf-4796-b6be-a214e99db702.gif", benefit: '' },
];


/* Reviews carousel */
const REVIEWS = [
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
const STEPS = [
  { num: '1', title: 'Limpiá la planta del pie', desc: 'Antes de acostarte, asegurate de tener la planta limpia y seca para que el parche se adhiera correctamente.', img: "" },
  { num: '2', title: 'Pegá el parche',           desc: 'Sacá el film protector y aplicá el parche centrado en la planta del pie. La superficie blanca queda en contacto con la piel.', img: "" },
  { num: '3', title: 'Dormí toda la noche',      desc: 'Vas a la cama como siempre. El parche trabaja durante 6 a 8 horas mientras tu cuerpo descansa.', img: "" },
  { num: '4', title: 'Retiralo al despertar',    desc: 'A la mañana, despegalo con cuidado. Vas a ver el parche oscuro y húmedo: esa es la señal visible de que funcionó.', img: "" },
];

/* FAQ */
const faqs = [
  { q: '¿Cómo sé que funcionó?', a: 'El parche oscuro que tenés en la mano al despertar es la señal. Entra completamente blanco y amanece negro y húmedo. Sin haber hecho nada más que dormir. Aparte de eso, la mayoría de los clientes notan más energía y piernas más livianas desde la primera semana de uso continuo.' },
  { q: '¿Cuántas noches necesito para ver resultados?', a: 'El cambio de color en el parche se ve desde la primera noche. Para notar diferencia real en cómo te sentís — más descansado/a, piernas más livianas, más energía — lo ideal es una semana seguida. Muchos lo incorporan como ritual nocturno permanente.' },
  { q: '¿Para quién es ideal?', a: 'Para cualquier persona que se levante cansada, con piernas pesadas o sueño poco reparador. No requiere dieta, ni ejercicio, ni cambio de hábitos. Solo lo pegás en la planta del pie y dormís. Si tenés alguna condición médica o estás embarazada, consultá antes con tu médico.' },
  { q: '¿Tengo que cambiar algo en mi rutina?', a: 'No. Cero fricción. Lo único que hacés es pegarlo en la planta del pie limpia antes de acostarte. Sin pastillas, sin dietas, sin ejercicios. Funciona mientras dormís — eso es todo.' },
  { q: '¿Cuántos parches uso por noche?', a: 'Se usa un parche por planta del pie, es decir, 2 por noche (uno en cada pie). Cada kit incluye múltiples parches para varias noches de uso.' },
  { q: '¿Puedo usarlo todas las noches?', a: 'Sí. Es apto para uso continuo. Muchas personas lo usan todas las noches indefinidamente como parte de su ritual de bienestar nocturno.' },
  { q: '¿Qué hago si el parche no se oscureció?', a: 'En casos de pies muy fríos o poco sudoración, el parche puede oscurecerse menos. Asegurate de que el pie esté caliente y limpio antes de aplicarlo. Si después de varias noches no hay cambio de color, te aplicamos la garantía 90 días sin preguntas.' },
  { q: '¿Cuándo llega y cómo puedo pagar?', a: 'Envío gratis a todo el país. CABA y GBA: 24 a 72hs hábiles con opción de pago al recibirlo. Interior del país: 3 a 7 días hábiles por Correo Argentino, abonando con MercadoPago al comprar.' },
];

/* ── Subcomponente: Stats circulares ─────────────────────── */
function PdxStatsCircles({ items }) {
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
      { threshold: 0.1 },
    );
    circleRefs.current.forEach(el => el && observer.observe(el));
    return () => observer.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="pdx-sc-section">
      <div className="pdx-sc-list">
        {items.map((item, i) => (
          <div key={i} className="pdx-sc-row" ref={el => circleRefs.current[i] = el} data-idx={i}>
            <div className="pdx-sc-circle" style={{ '--pdx-sc-pct': `${values[i]}%` }}>
              <span className="pdx-sc-pct">{values[i]}%</span>
            </div>
            <p className="pdx-sc-text">{item.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Subcomponente: Antes/Después slider ─────────────────── */
function BeforeAfterSlider({ imgBefore, imgAfter }) {
  const containerRef = useRef(null);
  const handleSlider = (e) => {
    if (containerRef.current) {
      containerRef.current.style.setProperty('--pdx-ba-pos', `${e.target.value}%`);
    }
  };
  return (
    <div className="pdx-ba-wrap">
      <div className="pdx-ba-container" ref={containerRef} style={{ '--pdx-ba-pos': '50%' }}>
        <div className="pdx-ba-imgs">
          <img className="pdx-ba-after"  src={imgAfter}  alt="Parche al despertar — oscuro" />
          <img className="pdx-ba-before" src={imgBefore} alt="Parche antes de usar — blanco" />
        </div>
        <span className="pdx-ba-badge pdx-ba-badge--before">Antes de dormir</span>
        <span className="pdx-ba-badge pdx-ba-badge--after">Al despertar</span>
        <input
          type="range" min="0" max="100" defaultValue="50"
          onInput={handleSlider}
          className="pdx-ba-range"
          aria-label="Comparar antes y después"
        />
        <div className="pdx-ba-line" />
        <div className="pdx-ba-handle">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M6 9H12M6 9L4 7M6 9L4 11M12 9L14 7M12 9L14 11"
              stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </div>
  );
}

/* ── Componente principal ─────────────────────────────────── */
export default function ParchesDetoxLanding() {
  const [product, setProduct]             = useState(null);
  const [productReady, setProductReady]   = useState(false);
  const [activeImg, setActiveImg]         = useState(0);
  const [openTab, setOpenTab]             = useState(null);
  const [openFaq, setOpenFaq]             = useState(null);
  const [showCheckout, setShowCheckout]   = useState(false);
  const [annIdx, setAnnIdx]               = useState(0);
  const [annVisible, setAnnVisible]       = useState(true);
  const [stickyVisible, setStickyVisible] = useState(false);
  const [hrIdx, setHrIdx]                 = useState(0);
  const [selectedBundle, setSelectedBundle] = useState(0);
  const [reviewIdx, setReviewIdx]         = useState(0);
  const reviewTouchX                      = useRef(null);

  const ctaRef      = useRef(null);
  const { addItem } = useCart();

  /* API fetch */
  useEffect(() => {
    api.get(`/products/slug/${PRODUCT_SLUG}`)
      .then(r => { setProduct(r.data?.data || r.data); setProductReady(true); })
      .catch(() => setProductReady(true));
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
        setStickyVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      { threshold: 0 },
    );
    observer.observe(ctaRef.current);
    return () => observer.disconnect();
  }, [productReady]);

  const soldOut = product?.stock === 0;

  const fmt = (n) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);

  /* Bundles desde config */
  const BUNDLES = (mc.bundles || []).map((b, i) => ({
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

  /* Precio del hero = bundle seleccionado */
  const activeBundle = BUNDLES[selectedBundle] || BUNDLES[0];
  const price      = activeBundle?.price ?? DEFAULT_PRICE;
  const compareAt  = activeBundle?.compareAt ?? DEFAULT_COMPARE;
  const discountPct = compareAt > price ? Math.round(((compareAt - price) / compareAt) * 100) : 40;

  /* Galería del hero */
  const FALLBACK_IMAGES = [
    { src: mc.images?.[0], alt: 'Parches Plantares Detox Kinoki — vista principal' },
    { src: mc.images?.[1], alt: 'Parche antes de usar — blanco' },
    { src: mc.images?.[2], alt: 'Parche al despertar — oscuro' },
    { src: mc.images?.[3], alt: 'Caja del producto' },
  ].filter(x => x.src);

  const productImages = product?.images?.length
    ? product.images.map((src, i) => ({ src, alt: `Parches Detox — imagen ${i + 1}` }))
    : FALLBACK_IMAGES;

  const handleBuy = () => {
    if (soldOut) return;
    const bundle = BUNDLES[selectedBundle] || BUNDLES[0];
    if (!bundle) return;
    const productData = product || { _id: PRODUCT_SLUG, name: CHECKOUT_NAME, slug: PRODUCT_SLUG };
    const mainImg = productImages[0]?.src;
    addItem(
      { ...productData, name: CHECKOUT_NAME, imageUrl: mainImg },
      bundle.qty || 1,
      {
        bundleTotal:    bundle.price,
        compareAtPrice: bundle.compareAt,
        gifts:          bundle.giftQty ? [`+${bundle.giftQty} ${bundle.giftQty === 1 ? 'caja' : 'cajas'} de REGALO 🎁`] : [],
        bundleImgs:     mainImg ? [mainImg, mainImg] : undefined,
      },
    );
    track('InitiateCheckout', { value: parseFloat(bundle.price) || 0, currency: 'ARS', content_name: CHECKOUT_NAME });
    setShowCheckout(true);
  };

  if (!productReady) {
    return (
      <div className="pdx-loading-wrap">
        <div className="pdx-loading-bar" />
      </div>
    );
  }

  return (
    <>
      <div className="pdx-wrap">

        {/* ══ S1 — ANNOUNCEMENT BAR ══ */}
        <div className="pdx-ann-bar">
          <span className={`pdx-ann-msg ${annVisible ? 'visible' : 'hidden'}`}>
            {annMsgs[annIdx]}
          </span>
        </div>

        {/* ══ S2 — HERO ══ */}
        <div className="pdx-hero">
          <div className="pdx-hero-inner">

            {/* Galería */}
            <div className="pdx-gallery">
              <div className="pdx-gallery-main">
                {productImages[activeImg]?.src && (
                  <img
                    src={productImages[activeImg].src}
                    alt={productImages[activeImg].alt}
                    loading="eager"
                    decoding="async"
                  />
                )}
              </div>
              <div className="pdx-thumbs">
                {productImages.map((img, i) => (
                  <div
                    key={i}
                    className={`pdx-thumb${i === activeImg ? ' pdx-thumb-active' : ''}`}
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
            <div className="pdx-info">
              <div className="pdx-stars">
                <span style={{ color: '#22C55E' }}>★★★★★</span>
                <span className="pdx-stars-count">4.8 / 5</span>
                <span className="pdx-reviews-count">| Más de 10.000 noches transformadas</span>
              </div>

              <h1 className="pdx-product-title">Parches Desintoxicantes Plantares Detox </h1>

              <div className="pdx-pricing">
                <span className="pdx-price-original">{fmt(compareAt)}</span>
                <span className="pdx-price-sale">{fmt(price)}</span>
                <span className="pdx-badge-discount">{discountPct}% OFF</span>
                <span className="pdx-cuotas">3 cuotas sin interés de <strong>{fmt(Math.ceil(price / 3))}</strong></span>
              </div>

              <ul className="pdx-benefits">
                {BENEFITS.map((b, i) => (
                  <li key={i} className="pdx-benefit-item">
                    <span className="pdx-benefit-icon">{b.icon}</span>
                    <span className="pdx-benefit-text">{b.text}</span>
                  </li>
                ))}
              </ul>

              <div className="pdx-benefits-divider">
                <div className="pdx-benefits-divider-line" />
                <span className="pdx-benefits-divider-label">Elegí tu kit</span>
                <div className="pdx-benefits-divider-line" />
              </div>

              {/* Bundle selector */}
              <div className="pdx-bundles" ref={ctaRef}>
                {BUNDLES.map((b, idx) => {
                  const isActive = idx === selectedBundle;
                  return (
                    <Fragment key={b.id}>
                      <label
                        className={`pdx-bundle${isActive ? ' pdx-bundle--active' : ''}${b.popular ? ' pdx-bundle--popular' : ''}`}
                      >
                        <input
                          type="radio"
                          name="pdx-bundle"
                          checked={isActive}
                          onChange={() => setSelectedBundle(idx)}
                        />
                        {b.badge && <span className="pdx-bundle-badge">{b.badge}</span>}

                        <div className="pdx-bundle-row">
                          <div className="pdx-bundle-mini-img">
                            {(b.img || productImages[0]?.src) && (
                              <img src={b.img || productImages[0].src} alt={b.label} />
                            )}
                          </div>
                          <div className="pdx-bundle-info">
                            <div className="pdx-bundle-title-line">
                              <span className="pdx-bundle-title">{b.label}</span>
                              {b.cuotas && (
                                <span className="pdx-bundle-cuotas">{b.cuotas}</span>
                              )}
                            </div>
                            {b.benefit && (
                              <span className="pdx-bundle-benefit">{b.benefit}</span>
                            )}
                          </div>
                          <div className="pdx-bundle-price">
                            {b.compareAt > b.price && (
                              <span className="pdx-bundle-pct-badge">-{Math.round(((b.compareAt - b.price) / b.compareAt) * 100)}%</span>
                            )}
                            <span className="pdx-bundle-now">{fmt(b.price)}</span>
                            {b.compareAt > b.price && (
                              <span className="pdx-bundle-was">{fmt(b.compareAt)}</span>
                            )}
                          </div>
                        </div>
                      </label>
                      {b.bannerBelow && (
                        <div className="pdx-bundle-inter-banner">{b.bannerBelow}</div>
                      )}
                    </Fragment>
                  );
                })}
              </div>

              <div className="pdx-urgency">
                <span>🔴</span>
                <span>Casi agotado | Solo quedan 12 unidades</span>
              </div>

              <button className="pdx-btn-cta" onClick={handleBuy} disabled={soldOut}>
                {soldOut ? 'AGOTADO' : 'QUIERO PROBAR ESTA NOCHE 🌙'}
              </button>

              {/* Trust badges */}
              <div className="pdx-trust-badges">
                <div className="pdx-trust-item">
                  <img src="//www.luxcove.co/cdn/shop/files/Untitled_design_-_2024-06-30T131118.961.png?v=1719749489" alt="Garantía" style={{ width: 44, height: 44, borderRadius: 8 }} />
                  <span>Garantía devolución<br />90 días</span>
                </div>
                <div className="pdx-trust-item">
                  <img src="//www.luxcove.co/cdn/shop/files/Untitled_design_-_2024-06-30T131541.485.png?v=1719749753" alt="Envío" style={{ width: 44, height: 44, borderRadius: 8 }} />
                  <span>Envío gratis<br />en todos los pedidos</span>
                </div>
                <div className="pdx-trust-item">
                  <img src="//www.luxcove.co/cdn/shop/files/Untitled_design_-_2024-06-30T131118.961.png?v=1719749489" alt="Garantía" style={{ width: 44, height: 44, borderRadius: 8 }} />
                  <span>Garantía devolución<br />90 días</span>
                </div>
              </div>

              {/* Medios de pago */}
              <div className="pdx-payment-block">
                <div className="pdx-payment-grid">
                  <img className="pdx-pay-chip" src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Mercado_Pago.svg/3840px-Mercado_Pago.svg.png" alt="MercadoPago" style={{ height: 22 }} />
                  <svg className="pdx-pay-chip" xmlns="http://www.w3.org/2000/svg" role="img" viewBox="0 0 38 24" width="38" height="24" aria-label="Visa"><path opacity=".07" d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.4 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.4-3-3-3z"/><path fill="#fff" d="M35 1c1.1 0 2 .9 2 2v18c0 1.1-.9 2-2 2H3c-1.1 0-2-.9-2-2V3c0-1.1.9-2 2-2h32"/><path d="M28.3 10.1H28c-.4 1-.7 1.5-1 3h1.9c-.3-1.5-.3-2.2-.6-3zm2.9 5.9h-1.7c-.1 0-.1 0-.2-.1l-.2-.9-.1-.2h-2.4c-.1 0-.2 0-.2.2l-.3.9c0 .1-.1.1-.1.1h-2.1l.2-.5L27 8.7c0-.5.3-.7.8-.7h1.5c.1 0 .2 0 .2.2l1.4 6.5c.1.4.2.7.2 1.1.1.1.1.1.1.2zm-13.4-.3l.4-1.8c.1 0 .2.1.2.1.7.3 1.4.5 2.1.4.2 0 .5-.1.7-.2.5-.2.5-.7.1-1.1-.2-.2-.5-.3-.8-.5-.4-.2-.8-.4-1.1-.7-1.2-1-.8-2.4-.1-3.1.6-.4.9-.8 1.7-.8 1.2 0 2.5 0 3.1.2h.1c-.1.6-.2 1.1-.4 1.7-.5-.2-1-.4-1.5-.4-.3 0-.6 0-.9.1-.2 0-.3.1-.4.2-.2.2-.2.5 0 .7l.5.4c.4.2.8.4 1.1.6.5.3 1 .8 1.1 1.4.2.9-.1 1.7-.9 2.3-.5.4-.7.6-1.4.6-1.4 0-2.5.1-3.4-.2-.1.2-.1.2-.2.1zm-3.5.3c.1-.7.1-.7.2-1 .5-2.2 1-4.5 1.4-6.7.1-.2.1-.3.3-.3H18c-.2 1.2-.4 2.1-.7 3.2-.3 1.5-.6 3-1 4.5 0 .2-.1.2-.3.2M5 8.2c0-.1.2-.2.3-.2h3.4c.5 0 .9.3 1 .8l.9 4.4c0 .1 0 .1.1.2 0-.1.1-.1.1-.1l2.1-5.1c-.1-.1 0-.2.1-.2h2.1c0 .1 0 .1-.1.2l-3.1 7.3c-.1.2-.1.3-.2.4-.1.1-.3 0-.5 0H9.7c-.1 0-.2 0-.2-.2L7.9 9.5c-.2-.2-.5-.5-.9-.6-.6-.3-1.7-.5-1.9-.5L5 8.2z" fill="#142688"/></svg>
                  <svg className="pdx-pay-chip" viewBox="0 0 38 24" xmlns="http://www.w3.org/2000/svg" role="img" width="38" height="24" aria-label="Mastercard"><path opacity=".07" d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.4 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.4-3-3-3z"/><path fill="#fff" d="M35 1c1.1 0 2 .9 2 2v18c0 1.1-.9 2-2 2H3c-1.1 0-2-.9-2-2V3c0-1.1.9-2 2-2h32"/><circle fill="#EB001B" cx="15" cy="12" r="7"/><circle fill="#F79E1B" cx="23" cy="12" r="7"/><path fill="#FF5F00" d="M22 12c0-2.4-1.2-4.5-3-5.7-1.8 1.3-3 3.4-3 5.7s1.2 4.5 3 5.7c1.8-1.2 3-3.3 3-5.7z"/></svg>
                </div>
              </div>

              {/* Hero review */}
              <div className="pdx-hero-review">
                <div className="pdx-hr-avatar">
                  <img src={heroReviews[hrIdx].avatar} alt={heroReviews[hrIdx].name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                </div>
                <div className="pdx-hr-content">
                  <div className="pdx-hr-top">
                    <strong className="pdx-hr-name">{heroReviews[hrIdx].name}</strong>
                    <span className="pdx-hr-stars">{'★'.repeat(heroReviews[hrIdx].stars)}</span>
                  </div>
                  <p className="pdx-hr-text">"{heroReviews[hrIdx].text}"</p>
                </div>
                <button className="pdx-hr-next" onClick={() => setHrIdx(i => (i + 1) % heroReviews.length)} aria-label="Siguiente reseña">›</button>
              </div>

              {/* Acordeón */}
              <div className="pdx-accordion">
                {PRODUCT_TABS.map((tab, i) => (
                  <div key={i} className="pdx-acc-item">
                    <button
                      className="pdx-acc-trigger"
                      onClick={() => setOpenTab(openTab === i ? null : i)}
                      aria-expanded={openTab === i}
                    >
                      <span className="pdx-acc-icon">{accordionIcons[i]}</span>
                      <span className="pdx-acc-title">{tab.title}</span>
                      <span className={`pdx-acc-arrow${openTab === i ? ' open' : ''}`}>›</span>
                    </button>
                    <div className={`pdx-acc-body${openTab === i ? ' open' : ''}`} aria-hidden={openTab !== i}>
                      <div className="pdx-acc-body-inner">
                        {tab.content.map((line, j) => <p key={j}>{line}</p>)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ══ S3 — VIDEO STRIP ══ */}
        <section className="pdx-vstrip-section">
          <div className="pdx-container">
            <div className="pdx-vstrip-header">
              <div className="pdx-vstrip-kicker">✦ Clientes reales</div>
              <h2 className="pdx-vstrip-title">El ritual nocturno que transforma ✨</h2>
              <p className="pdx-vstrip-sub">Mirá cómo los Parches Detox cambian la mañana de nuestros clientes.</p>
            </div>
            <div className="pdx-vstrip-row">
              {VSTRIP_VIDEOS.map((v, i) => (
                <div key={i} className="pdx-vstrip-item">
                  <div className="pdx-vstrip-media">
                    {v.src
                      ? /\.(mp4|webm|ogg|mov)(\?|$)/i.test(v.src)
                        ? <video src={v.src} autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', borderRadius: 'inherit' }} />
                        : <img src={v.src} alt={v.benefit || `Video ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', borderRadius: 'inherit' }} />
                      : <div className="pdx-vstrip-ph"><span className="pdx-vstrip-ph-ico">🌙</span></div>
                    }
                  </div>
                  <div className="pdx-vstrip-benefit">{v.benefit}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ S4 — STATS CIRCULARES ══ */}
        <div className="pdx-section pdx-section--white">
          <div className="pdx-container">
            <h2 className="pdx-section-title">Resultados reales, números reales.</h2>
            <p className="pdx-section-sub">Basado en encuestas a clientes de Amelor con compra verificada.</p>
            <PdxStatsCircles items={statsData} />
          </div>
        </div>

        {/* ══ S6 — STORY BLOCK 1: PROBLEMAS DEL CLIENTE ══ */}
        <div className="pdx-feat-section" style={{ background: '#fff' }}>
          <div className="pdx-feat-inner">
            <div className="pdx-feat-img">
              <img
                src="https://cdn.shopify.com/s/files/1/0698/1468/1858/files/KINOKI001.webp?v=1728712902"
                alt="Problemas que resuelven los Parches Detox"
                loading="lazy"
                style={{ width: '100%', height: '100%', minHeight: 280, objectFit: 'cover' }}
              />
            </div>
            <div className="pdx-feat-text">
              <div className="pdx-feat-kicker">⚠️ ¿TE IDENTIFICÁS CON ESTO?</div>
              <h2 className="pdx-feat-title">Tu cuerpo te está mandando señales que no podés ignorar</h2>
              <p className="pdx-feat-desc">¿<strong>Dolor de espalda</strong>, kilos que no bajan, <strong>estrés constante</strong> o ansiedad? No son problemas separados — son señales de <strong>acumulación de toxinas</strong> que tu cuerpo no puede eliminar solo. Los Parches Detox lo hacen por vos, <strong>noche a noche</strong>, sin cambiar nada de tu rutina.</p>
            </div>
          </div>
        </div>

        {/* ══ S7 — STORY BLOCK 2: BENEFICIOS ══ */}
        <div className="pdx-feat-section" style={{ background: 'var(--pdx-section-green)' }}>
          <div className="pdx-feat-inner pdx-feat-reverse">
            <div className="pdx-feat-img">
              <img
                src="https://cdn.shopify.com/s/files/1/0698/1468/1858/files/PARCHE-BENEFICIOS_480x480_1_2abefb24-0283-4d39-9697-0ef9537237f2.webp?v=1727546498"
                alt="Beneficios de los Parches Detox"
                loading="lazy"
                style={{ width: '100%', height: '100%', minHeight: 280, objectFit: 'cover' }}
              />
            </div>
            <div className="pdx-feat-text">
              <div className="pdx-feat-kicker">✅ LA SOLUCIÓN</div>
              <h2 className="pdx-feat-title">5 beneficios que sentís desde la primera noche</h2>
              <p className="pdx-feat-desc">Los Parches Detox <strong>mejoran tu inmunidad</strong>, <strong>alivian el dolor y el estrés</strong>, mejoran la <strong>circulación sanguínea</strong> y eliminan las <strong>toxinas acumuladas</strong> en tu cuerpo — todo mientras dormís, sin que hagas absolutamente nada.</p>
            </div>
          </div>
        </div>

        {/* ══ S7B — STORY BLOCK 3: MÁS BENEFICIOS ══ */}
        <div className="pdx-feat-section" style={{ background: '#fff' }}>
          <div className="pdx-feat-inner">
            <div className="pdx-feat-img">
              <img
                src="https://cdn.shopify.com/s/files/1/0778/4303/8517/files/508979000853398631-bf837f33-9e47-4290-8463-4662db21bf9f.gif"
                alt="Transformación nocturna con Parches Detox"
                loading="lazy"
                style={{ width: '100%', height: '100%', minHeight: 280, objectFit: 'cover' }}
              />
            </div>
            <div className="pdx-feat-text">
              <div className="pdx-feat-kicker">🌿 LO QUE PASA MIENTRAS DORMÍS</div>
              <h2 className="pdx-feat-title">Despertás distinto. Ligero. Con energía real.</h2>
              <p className="pdx-feat-desc">La <strong>cúrcuma, jengibre y hojas de moxa</strong> activan la termogénesis plantar — el calor natural del pie moviliza lo que se acumuló durante el día. El parche lo absorbe todo, vos solo descansás.</p>
              <p className="pdx-feat-desc">Resultado: <strong>menos hinchazón</strong>, <strong>mejor circulación</strong>, noches más reparadoras y una mañana que se siente diferente desde el primer uso.</p>
            </div>
          </div>
        </div>

        {/* ══ S9 — IMAGEN INGREDIENTES ══ */}
        <section className="pdx-ingredients-section">
          <img
            src="https://nesimu.com/cdn/shop/files/imgi_253_Transformacion_Visible_Nocturna_-_Ad_1_1.webp?v=1770704798&width=1500"
            alt="Ingredientes naturales de los Parches Detox"
            className="pdx-ingredients-img"
            loading="lazy"
          />
        </section>

        {/* ══ S8 — BANNER KINOKI ══ */}
        <div className="pdx-kinoki-banner">
          <img
            src="https://cdn.shopify.com/s/files/1/0698/1468/1858/files/KINOKI002_1.webp?v=1728713376"
            alt="Parches Kinoki — beneficios"
            loading="lazy"
          />
        </div>

        {/* ══ S10 — RESEÑAS CARRUSEL ══ */}
        <div className="pdx-section pdx-section--green">
          <div className="pdx-container">
            <h2 className="pdx-section-title">Lo que dicen nuestros clientes</h2>
            <p className="pdx-section-sub">Reseñas verificadas de compradores reales.</p>
            <div
              className="pdx-rev-carousel"
              onTouchStart={e => { reviewTouchX.current = e.touches[0].clientX; }}
              onTouchEnd={e => {
                if (reviewTouchX.current === null) return;
                const diff = reviewTouchX.current - e.changedTouches[0].clientX;
                if (Math.abs(diff) > 40) {
                  if (diff > 0) setReviewIdx(i => Math.min(i + 1, REVIEWS.length - 1));
                  else setReviewIdx(i => Math.max(i - 1, 0));
                }
                reviewTouchX.current = null;
              }}
            >
              <div className="pdx-rev-card">
                <div className="pdx-review-img-wrap">
                  {REVIEWS[reviewIdx].reviewImg
                    ? <img src={REVIEWS[reviewIdx].reviewImg} alt={`Reseña de ${REVIEWS[reviewIdx].name}`} loading="lazy" />
                    : <div className="pdx-review-img-ph">🌿</div>
                  }
                </div>
                <div className="pdx-review-body">
                  <div className="pdx-review-top">
                    <span className="pdx-review-name">{REVIEWS[reviewIdx].name}</span>
                    <span className="pdx-review-stars">{'★'.repeat(REVIEWS[reviewIdx].stars)}</span>
                  </div>
                  <p className="pdx-review-text">{REVIEWS[reviewIdx].text}</p>
                </div>
              </div>
              <div className="pdx-rev-nav">
                <button className="pdx-rev-arrow" onClick={() => setReviewIdx(i => Math.max(i - 1, 0))} disabled={reviewIdx === 0}>‹</button>
                <div className="pdx-rev-dots">
                  {REVIEWS.map((_, i) => (
                    <button key={i} className={`pdx-rev-dot${i === reviewIdx ? ' active' : ''}`} onClick={() => setReviewIdx(i)} />
                  ))}
                </div>
                <button className="pdx-rev-arrow" onClick={() => setReviewIdx(i => Math.min(i + 1, REVIEWS.length - 1))} disabled={reviewIdx === REVIEWS.length - 1}>›</button>
              </div>
            </div>
          </div>
        </div>

        {/* ══ S11 — CÓMO USARLO ══ */}
        <div className="pdx-section pdx-section--white pdx-how-section">
          <div className="pdx-container">
            <div className="pdx-how-kicker">SIMPLE Y SIN SALIR DE CASA</div>
            <h2 className="pdx-section-title">¿Cómo se usa?</h2>
            <div className="pdx-steps">
              {STEPS.map((step, i) => (
                <div key={i} className="pdx-step-item">
                  <div className="pdx-step-img-wrap">
                    {step.img
                      ? <img src={step.img} alt={step.title} />
                      : <span className="pdx-step-img-ph">{step.num}</span>
                    }
                  </div>
                  <div className="pdx-step-content">
                    <div className="pdx-step-label">Paso {step.num}</div>
                    <h3 className="pdx-step-title">{step.title}</h3>
                    <p className="pdx-step-desc">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══ S12 — GARANTÍA ══ */}
        <div className="pdx-section pdx-section--white">
          <div className="pdx-container">
            <div className="pdx-guarantee">
              <div className="pdx-guarantee-icon">
                <img
                  src="https://img.icons8.com/ios_filled/1200/guarantee.jpg"
                  alt="Garantía 90 días"
                  loading="lazy"
                  style={{ width: 160, height: 160, objectFit: 'contain' }}
                />
              </div>
              <h2 className="pdx-guarantee-title">Cero riesgo. Cero excusas.</h2>
              <p className="pdx-guarantee-text">
                Estamos seguros de que vas a ver el parche oscuro en tu mano la primera mañana. Pero si por alguna razón no notás ningún resultado, devolvelo en hasta 90 días y te reembolsamos el 100% del importe. Sin preguntas, sin vueltas. Tu descanso te espera — sin riesgo.
              </p>
              <button className="pdx-btn-cta-center" onClick={handleBuy} disabled={soldOut}>
                {soldOut ? 'AGOTADO' : 'QUIERO PROBAR ESTA NOCHE 🌙'}
              </button>
            </div>
          </div>
        </div>

        {/* ══ S13 — FAQ ══ */}
        <div className="pdx-faq-section">
          <div className="pdx-container">
            <h2 className="pdx-faq-title">Preguntas frecuentes</h2>
            <p className="pdx-faq-sub">Todo lo que necesitás saber sobre los Parches Plantares Detox.</p>
            <div className="pdx-faq-list">
              {faqs.map((faq, i) => (
                <div key={i} className="pdx-faq-item">
                  <button
                    className="pdx-faq-trigger"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    aria-expanded={openFaq === i}
                  >
                    <span className="pdx-faq-q">{faq.q}</span>
                    <span className={`pdx-faq-arrow${openFaq === i ? ' open' : ''}`}>›</span>
                  </button>
                  <div className={`pdx-faq-body${openFaq === i ? ' open' : ''}`} aria-hidden={openFaq !== i}>
                    <div className="pdx-faq-body-inner">{faq.a}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>{/* /pdx-wrap */}

      {/* Sticky CTA bar */}
      <div className={`pdx-sticky-bar${stickyVisible ? ' pdx-visible' : ''}`} aria-hidden={!stickyVisible}>
        <button className="pdx-btn-cta" onClick={handleBuy} disabled={soldOut}>
          {soldOut ? 'AGOTADO' : 'QUIERO PROBAR ESTA NOCHE 🌙'}
        </button>
      </div>

      {/* Footer */}
      <footer className="pdx-footer">
        <div className="pdx-footer-body">
          <div className="pdx-footer-brand">
            <div className="pdx-footer-logo">Amelor</div>
            <p className="pdx-footer-tagline">Bienestar nocturno con ingredientes naturales</p>
          </div>
          <div className="pdx-footer-trust-row">
            <div className="pdx-footer-ti"><span>🔒</span>Pago seguro</div>
            <div className="pdx-footer-ti"><span>🚚</span>Envío gratis</div>
            <div className="pdx-footer-ti"><span>🛡️</span>Garantía 90 días</div>
            <div className="pdx-footer-ti"><span>💳</span>3 cuotas sin interés</div>
          </div>
          <div className="pdx-footer-bottom">
            <span>© 2026 Amelor · Todos los derechos reservados</span>
          </div>
        </div>
      </footer>

      {showCheckout && (
        <CheckoutSheet
          onClose={() => setShowCheckout(false)}
          primaryColor="#1B4D3E"
          primaryHover="#153D30"
          accentColor="#22C55E"
          accentBg="#F0FAF4"
          accentBorder="#86EFAC"
          accentText="#14532D"
          fontFamily="'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        />
      )}
    </>
  );
}
