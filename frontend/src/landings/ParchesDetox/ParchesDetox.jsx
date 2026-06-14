import { useState, useEffect, useRef } from 'react';
import { CheckoutSheet } from '../../pages/CheckoutSheet';
import { useCart } from '../../context/CartContext';
import { track } from '../../lib/metaPixel';
import api from '../../services/api';
import mc from '../parches-detox';
import './ParchesDetox.css';

/* ── Constantes ───────────────────────────────────────────── */
const PRODUCT_SLUG  = 'parches-detox';
const CHECKOUT_NAME = 'Parches Plantares Detox Kinoki';
const DEFAULT_PRICE   = 58000;
const DEFAULT_COMPARE = 119200;

// 🌿 Imagen de INGREDIENTES — reemplazá con tu URL real
const INGREDIENTS_IMG =
  'https://acdn-us.mitiendanube.com/stores/006/731/084/products/ingredientes-parches-detox-1024-1024.webp';

/* S1 — Announcement bar */
const annMsgs = [
  '🌙 ¡OFERTA ESPECIAL DE LANZAMIENTO!',
  '🚚 ENVÍO GRATIS A TODO EL PAÍS',
  '⭐ +10.000 NOCHES TRANSFORMADAS',
  '🔒 GARANTÍA 90 DÍAS O DEVOLUCIÓN',
];

/* S3 — Síntomas "¿Te sentís así?" */
const SYMPTOMS = [
  'Te despertás cansada/o, sin energía real',
  'Sentís las piernas pesadas o hinchadas',
  'No dormís profundo — te movés toda la noche',
  'Acumulás líquidos al final del día',
  'Tu sueño no es reparador, aunque duermas 8 horas',
  'Sentís el cuerpo cargado por la rutina diaria',
];

/* S4 — Stats circulares */
const STATS = [
  { pct: 92, text: <>Clientas que notaron <strong>más energía al despertar</strong> en las primeras 2 semanas.</> },
  { pct: 89, text: <>Reportaron <strong>piernas más livianas</strong> y menos hinchazón al final del día.</> },
  { pct: 85, text: <>Mejoraron la <strong>calidad de su sueño</strong> según encuesta interna.</> },
  { pct: 94, text: <>Lo <strong>recomendarían a una amiga</strong> sin dudarlo.</> },
];

/* S6-S8 — Feature blocks */
const FEATURES = [
  {
    title: 'Mientras dormís, sin esfuerzo',
    desc: 'Lo único que hacés es pegarlo en la planta del pie limpia antes de acostarte. El parche trabaja toda la noche absorbiendo lo que tu cuerpo libera. Vos solo dormís.',
    img: 'https://nesimu.com/cdn/shop/files/imgi_253_Transformacion_Visible_Nocturna_-_Ad_1_1.webp?v=1770704798&width=1500',
  },
  {
    title: 'Sin pastillas, sin dietas, sin rituales',
    desc: 'No tenés que tomar nada, ni cambiar lo que comés, ni hacer ejercicios extra. Cero fricción con tu rutina. El parche es un ritual nocturno simple que se incorpora solo.',
    img: 'https://pbs.twimg.com/media/HHsZpv3WwAgO1ri?format=jpg&name=small',
  },
  {
    title: 'Resultado visible desde la primera noche',
    desc: 'El parche entra blanco y amanece oscuro. Esa transformación visible en tu mano al despertar es la prueba de que algo pasó. No tenés que creer en nada raro — el resultado lo ves.',
    img: 'https://pbs.twimg.com/media/HHsZMmkXQAw-prn?format=jpg&name=small',
  },
];

/* S9 — Comparison rows */
const COMP_ROWS = [
  'Funciona mientras dormís — sin esfuerzo',
  'Resultado visible en la mañana',
  'Sin tomar ni comer nada distinto',
  'Apto para uso continuo todas las noches',
  'Ingredientes 100% naturales y herbales',
  'Garantía 90 días o te devolvemos el dinero',
];

/* S10 — Pasos "Cómo usarlo" */
const STEPS = [
  {
    num: '1',
    title: 'Limpiá la planta del pie',
    desc: 'Antes de acostarte, asegurate de tener la planta limpia y seca para que el parche se adhiera bien.',
  },
  {
    num: '2',
    title: 'Pegá el parche',
    desc: 'Sacá el film protector y aplicá el parche centrado en la planta del pie. La superficie blanca queda en contacto con la piel.',
  },
  {
    num: '3',
    title: 'Dormí toda la noche',
    desc: 'Vas a la cama como siempre. El parche trabaja durante 6 a 8 horas mientras tu cuerpo descansa.',
  },
  {
    num: '4',
    title: 'Retiralo al despertar',
    desc: 'A la mañana, despegalo con cuidado. Vas a ver el parche oscuro y húmedo: esa es la señal visible de que funcionó.',
  },
];

/* S11 — Hero inline reviews (carousel chico arriba del CTA) */
const heroReviews = [
  { name: 'Valentina C.', avatar: 'https://i.pravatar.cc/80?img=47', stars: 5, text: 'Primera noche y el parche amaneció oscuro. Me desperté sin el peso de siempre — algo funcionó.' },
  { name: 'Luciana P.',   avatar: 'https://i.pravatar.cc/80?img=49', stars: 5, text: 'Llevaba meses con las piernas pesadas. Dos semanas de uso y ya no siento esa hinchazón.' },
  { name: 'Martín R.',    avatar: 'https://i.pravatar.cc/80?img=12', stars: 5, text: 'Ver el parche negro en la mano al despertar me convenció. No hice nada, solo dormí.' },
];

/* S12 — Reviews grid (reseñas largas con foto) */
const REVIEWS = [
  {
    name: 'Carolina F.',
    title: 'EL PARCHE NEGRO LO DICE TODO',
    text: 'Nunca creí que algo tan simple pudiera hacer tanta diferencia. Me despierto descansada de verdad. Lo que más me sorprendió es ver ese parche oscuro en la mano al despertar — claramente algo está pasando mientras dormís.',
    stars: 5,
    src: 'https://nesimu.com/cdn/shop/files/imgi_43_D_NQ_NP_2X_676642-MLA97579090775_112025-F.jpg?v=1770705063&width=1420',
  },
  {
    name: 'Rodrigo V.',
    title: 'MI MAMÁ ME LO AGRADECIÓ AL OTRO DÍA',
    text: 'Le compré a mi mamá porque le costaba dormir hace años. Al día siguiente me mandó un audio: "fue la mejor noche en mucho tiempo". El parche amaneció oscurísimo. Ya pedimos otro kit para mí.',
    stars: 5,
    src: 'https://nesimu.com/cdn/shop/files/imgi_33_713PY4u2yeL.jpg?v=1770705048&width=1420',
  },
  {
    name: 'Jimena S.',
    title: 'ME DESPERTÉ SIN EL PESO DE SIEMPRE',
    text: 'El resultado se ve, literal. El parche que sacás de la planta del pie al despertar es negro y húmedo. No necesitás creer en nada raro — el resultado está en tu mano. Y encima las piernas dejaron de pesarme.',
    stars: 5,
    src: 'https://nesimu.com/cdn/shop/files/imgi_36_71_StcLeTHL.jpg?v=1770705063&width=1420',
  },
  {
    name: 'Hernán B.',
    title: 'FUNCIONA DESDE LA PRIMERA NOCHE',
    text: 'Llegó rápido a Capital. Primera noche, parche negro al despertar. Sencillo y sin complicaciones. Lo pegás, dormís, y el resultado lo tenés en la mano a la mañana.',
    stars: 5,
    src: 'https://nesimu.com/cdn/shop/files/imgi_51_D_NQ_NP_2X_903416-MLA92304661828_092025-F.jpg?v=1770705073&width=1420',
  },
];

/* ── Subcomponente: círculo de stats con animación ───────── */
function StatsCircles({ items }) {
  const sectionRef = useRef(null);
  const [values, setValues] = useState(items.map(() => 0));

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // animate cada círculo hacia su valor final
          items.forEach((it, i) => {
            const target = it.pct;
            const start = Date.now();
            const dur = 1500;
            const tick = () => {
              const t = Math.min(1, (Date.now() - start) / dur);
              const eased = 1 - Math.pow(1 - t, 3);
              setValues((cur) => {
                const next = [...cur];
                next[i] = Math.round(target * eased);
                return next;
              });
              if (t < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
          });
          io.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [items]);

  return (
    <div ref={sectionRef} className="pdx-stats-grid">
      {items.map((it, i) => (
        <div key={i} className="pdx-stat-card">
          <div className="pdx-stat-circle" style={{ '--pdx-pct': `${values[i]}%` }}>
            <span className="pdx-stat-pct">{values[i]}%</span>
          </div>
          <p className="pdx-stat-text">{it.text}</p>
        </div>
      ))}
    </div>
  );
}

/* ── Subcomponente: Antes/Después slider ──────────────────── */
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
          <img className="pdx-ba-after" src={imgAfter} alt="Parche al despertar — oscuro" />
          <img className="pdx-ba-before" src={imgBefore} alt="Parche antes de usar — blanco" />
        </div>
        <span className="pdx-ba-badge pdx-ba-badge--before">{mc.beforeLabel || 'Antes de dormir'}</span>
        <span className="pdx-ba-badge pdx-ba-badge--after">{mc.afterLabel || 'Al despertar'}</span>
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
              stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  );
}

/* ── Componente principal ─────────────────────────────────── */
export default function ParchesDetoxLanding() {
  const [product, setProduct] = useState(null);
  const [productReady, setProductReady] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [openFaq, setOpenFaq] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [annIdx, setAnnIdx] = useState(0);
  const [annVisible, setAnnVisible] = useState(true);
  const [stickyVisible, setStickyVisible] = useState(false);
  const [hrIdx, setHrIdx] = useState(0);
  const [selectedBundle, setSelectedBundle] = useState(1); // el "más elegido" por default

  const ctaRef = useRef(null);
  const { addItem } = useCart();

  /* API fetch */
  useEffect(() => {
    api.get(`/products/slug/${PRODUCT_SLUG}`)
      .then((r) => { setProduct(r.data?.data || r.data); setProductReady(true); })
      .catch(() => setProductReady(true));
  }, []);

  /* Announcement rotation */
  useEffect(() => {
    const t = setInterval(() => {
      setAnnVisible(false);
      setTimeout(() => {
        setAnnIdx((i) => (i + 1) % annMsgs.length);
        setAnnVisible(true);
      }, 400);
    }, 3000);
    return () => clearInterval(t);
  }, []);

  /* Hero review rotation */
  useEffect(() => {
    const t = setInterval(() => setHrIdx((i) => (i + 1) % heroReviews.length), 5000);
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
      { threshold: 0 },
    );
    observer.observe(ctaRef.current);
    return () => observer.disconnect();
  }, [productReady]);

  /* ── Bundles desde el config (parches-detox.js) ─────────── */
  const BUNDLES = (mc.bundles || []).map((b, i) => ({
    id: i,
    label: b.label,
    badge: b.badge,
    qty: b.qty,
    price: b.price,
    compareAt: b.compareAt,
    benefit: b.benefit,
    popular: b.popular,
  }));

  /* ── Galería del hero ───────────────────────────────────── */
  const productImages = [
    { src: mc.images?.[0], alt: 'Parches Plantares Detox — vista principal' },
    { src: mc.images?.[1], alt: 'Parche antes de usar — blanco' },
    { src: mc.images?.[2], alt: 'Parche al despertar — oscuro y húmedo' },
    { src: mc.images?.[3], alt: 'Caja del producto' },
  ].filter((x) => x.src);

  const fmt = (n) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);

  const handleBuy = () => {
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
        // Producto principal + producto de regalo lado a lado en el carrito
        bundleImgs:     mainImg ? [mainImg, mainImg] : undefined,
        // Texto del regalo del mismo producto (NO el benefit que era descriptivo)
        gifts:          [`+${bundle.qty} cajas de REGALO 🎁`],
      },
    );
    track('InitiateCheckout', { value: bundle.price, currency: 'ARS', content_name: CHECKOUT_NAME });
    setShowCheckout(true);
  };

  if (!productReady) {
    return (
      <div className="pdx-loading-wrap">
        <div className="pdx-loading-bar" />
      </div>
    );
  }

  const selected = BUNDLES[selectedBundle] || BUNDLES[0];

  return (
    <>
      <div className="pdx-wrap">

        {/* ══ S1 — ANNOUNCEMENT BAR ══════════════════════════ */}
        <div className="pdx-ann-bar">
          <span className={`pdx-ann-msg ${annVisible ? 'visible' : 'hidden'}`}>
            {annMsgs[annIdx]}
          </span>
        </div>

        {/* ══ S2 — HERO ══════════════════════════════════════ */}
        <div className="pdx-hero">
          <div className="pdx-hero-inner">

            {/* Galería */}
            <div className="pdx-gallery">
              <div className="pdx-gallery-main">
                {productImages[activeImg]?.src && (
                  <img src={productImages[activeImg].src} alt={productImages[activeImg].alt} />
                )}
              </div>
              <div className="pdx-thumbs">
                {productImages.map((img, i) => (
                  <button
                    key={i}
                    className={`pdx-thumb${i === activeImg ? ' pdx-thumb--active' : ''}`}
                    onClick={() => setActiveImg(i)}
                    aria-label={`Imagen ${i + 1}`}
                  >
                    <img src={img.src} alt={img.alt} />
                  </button>
                ))}
              </div>
            </div>

            {/* Info de compra */}
            <div className="pdx-info">
              <div className="pdx-stars">
                <span style={{ color: '#FFB800' }}>★★★★★</span>
                <span className="pdx-stars-count">{mc.reviewScore || 4.8} / 5 · {mc.reviewCount || 124} reseñas</span>
              </div>

              <h1 className="pdx-product-title">Parches Plantares Detox <em>Kinoki</em></h1>

              <p className="pdx-product-desc">{mc.miniDescription}</p>

              <ul className="pdx-trust">
                {(mc.trustBullets || []).map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>

              {/* Bundle selector */}
              <div className="pdx-bundles" ref={ctaRef}>
                {BUNDLES.map((b, idx) => {
                  const isActive = idx === selectedBundle;
                  const discountPct = b.compareAt > b.price
                    ? Math.round(((b.compareAt - b.price) / b.compareAt) * 100)
                    : 0;
                  return (
                    <label
                      key={b.id}
                      className={`pdx-bundle${isActive ? ' pdx-bundle--active' : ''}${b.popular ? ' pdx-bundle--popular' : ''}`}
                    >
                      <input
                        type="radio"
                        name="pdx-bundle"
                        checked={isActive}
                        onChange={() => setSelectedBundle(idx)}
                      />
                      {b.badge && <span className="pdx-bundle-badge">{b.badge}</span>}

                      <div className="pdx-bundle-head">
                        <div className="pdx-bundle-radio" aria-hidden="true">
                          <span className="pdx-bundle-radio-dot" />
                        </div>
                        <div className="pdx-bundle-title-wrap">
                          <span className="pdx-bundle-title">{b.label}</span>
                          {b.benefit && <span className="pdx-bundle-benefit">{b.benefit}</span>}
                        </div>
                        <div className="pdx-bundle-price">
                          {b.compareAt > b.price && (
                            <span className="pdx-bundle-was">{fmt(b.compareAt)}</span>
                          )}
                          <span className="pdx-bundle-now">{fmt(b.price)}</span>
                          {discountPct > 0 && (
                            <span className="pdx-bundle-off">-{discountPct}%</span>
                          )}
                        </div>
                      </div>

                      {/* Visual: producto + producto de regalo */}
                      {isActive && (
                        <div className="pdx-bundle-gift">
                          <div className="pdx-bundle-item">
                            <div className="pdx-bundle-thumb">
                              {productImages[0]?.src && <img src={productImages[0].src} alt="Parches" />}
                            </div>
                            <span>{b.qty} cajas</span>
                          </div>
                          <span className="pdx-bundle-plus">+</span>
                          <div className="pdx-bundle-item">
                            <div className="pdx-bundle-thumb pdx-bundle-thumb--gift">
                              {productImages[0]?.src && <img src={productImages[0].src} alt="Regalo" />}
                              <span className="pdx-bundle-gift-tag">GRATIS</span>
                            </div>
                            <span>{b.qty} cajas DE REGALO</span>
                          </div>
                        </div>
                      )}
                    </label>
                  );
                })}
              </div>

              {/* Hero review carousel */}
              <div className="pdx-hero-review">
                <div className="pdx-hr-avatar">
                  <img src={heroReviews[hrIdx].avatar} alt={heroReviews[hrIdx].name} />
                </div>
                <div className="pdx-hr-body">
                  <div className="pdx-hr-stars">{'★'.repeat(heroReviews[hrIdx].stars)}</div>
                  <p className="pdx-hr-text">"{heroReviews[hrIdx].text}"</p>
                  <span className="pdx-hr-name">— {heroReviews[hrIdx].name}</span>
                </div>
              </div>

              {/* CTA principal */}
              <button className="pdx-cta" onClick={handleBuy}>
                {mc.ctaLine1 || 'QUIERO PROBAR ESTA NOCHE'} 🌙
              </button>

              {mc.stockAlert?.show && (
                <p className="pdx-stock-alert">{mc.stockAlertText}</p>
              )}
            </div>
          </div>
        </div>

        {/* ══ S3 — ¿TE SENTÍS ASÍ? ═══════════════════════════ */}
        <section className="pdx-section pdx-feel">
          <h2 className="pdx-section-title">¿Te sentís <em>así</em>?</h2>
          <p className="pdx-section-sub">Si te identificás con alguna de estas señales, no estás solo/a:</p>
          <div className="pdx-feel-grid">
            <div className="pdx-feel-img">
              <img src={mc.images?.[4]} alt="Cansancio al despertar" />
            </div>
            <ul className="pdx-feel-list">
              {SYMPTOMS.map((s, i) => (
                <li key={i}>
                  <span className="pdx-feel-check">✓</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ══ S4 — STATS CIRCULARES ══════════════════════════ */}
        <section className="pdx-section pdx-stats">
          <h2 className="pdx-section-title">Lo que dicen <em>los números</em></h2>
          <p className="pdx-section-sub">Resultados reportados por nuestros clientes después de 2 semanas de uso continuo.</p>
          <StatsCircles items={STATS} />
          <p className="pdx-stats-footnote">*Basado en encuesta interna a clientes verificados.</p>
        </section>

        {/* ══ S5 — INGREDIENTES (UNA IMAGEN) ═════════════════ */}
        <section className="pdx-section pdx-ingredients">
          <h2 className="pdx-section-title">Ingredientes <em>100% naturales</em></h2>
          <p className="pdx-section-sub">Una formulación herbal de origen oriental, diseñada para trabajar mientras descansás.</p>
          <div className="pdx-ingredients-img">
            <img src={INGREDIENTS_IMG} alt="Composición de ingredientes naturales del parche detox" />
          </div>
        </section>

        {/* ══ S6-S8 — FEATURE BLOCKS ═════════════════════════ */}
        {FEATURES.map((f, i) => (
          <section key={i} className={`pdx-section pdx-feature pdx-feature--${i % 2 === 0 ? 'left' : 'right'}`}>
            <div className="pdx-feature-inner">
              <div className="pdx-feature-img">
                <img src={f.img} alt={f.title} />
              </div>
              <div className="pdx-feature-body">
                <h3 className="pdx-feature-title">{f.title}</h3>
                <p className="pdx-feature-desc">{f.desc}</p>
                <button className="pdx-feature-cta" onClick={handleBuy}>
                  QUIERO PROBARLO →
                </button>
              </div>
            </div>
          </section>
        ))}

        {/* ══ S9 — COMPARISON TABLE ══════════════════════════ */}
        <section className="pdx-section pdx-comp">
          <h2 className="pdx-section-title">Parches Detox <em>vs el resto</em></h2>
          <p className="pdx-section-sub">Por qué los Parches Plantares ganan contra los métodos tradicionales.</p>
          <div className="pdx-comp-table">
            <div className="pdx-comp-row pdx-comp-row--head">
              <span className="pdx-comp-feature">Ventaja</span>
              <span className="pdx-comp-us">Parches Detox</span>
              <span className="pdx-comp-them">Otros</span>
            </div>
            {COMP_ROWS.map((row, i) => (
              <div key={i} className="pdx-comp-row">
                <span className="pdx-comp-feature">{row}</span>
                <span className="pdx-comp-us">
                  <span className="pdx-comp-check">✓</span>
                </span>
                <span className="pdx-comp-them">
                  <span className="pdx-comp-x">✕</span>
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ══ S10 — ANTES/DESPUÉS SLIDER ═════════════════════ */}
        <section className="pdx-section pdx-ba">
          <h2 className="pdx-section-title">{mc.beforeAfterTitle || 'La prueba en tu mano al despertar'}</h2>
          <p className="pdx-section-sub">{mc.beforeAfterSubtitle}</p>
          {mc.images?.[5] && mc.images?.[6] && (
            <BeforeAfterSlider imgBefore={mc.images[5]} imgAfter={mc.images[6]} />
          )}
        </section>

        {/* ══ S11 — CÓMO USARLO ══════════════════════════════ */}
        <section className="pdx-section pdx-howto">
          <h2 className="pdx-section-title">¿Cómo <em>usarlo</em>?</h2>
          <p className="pdx-section-sub">Un ritual nocturno de 30 segundos. Sin complicaciones.</p>
          <div className="pdx-steps">
            {STEPS.map((s, i) => (
              <div key={i} className="pdx-step">
                <div className="pdx-step-img">
                  {mc.images?.[7 + i] && <img src={mc.images[7 + i]} alt={s.title} />}
                </div>
                <div className="pdx-step-body">
                  <span className="pdx-step-num">{s.num}</span>
                  <h4 className="pdx-step-title">{s.title}</h4>
                  <p className="pdx-step-desc">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ══ S12 — REVIEWS GRID ═════════════════════════════ */}
        <section className="pdx-section pdx-reviews">
          <h2 className="pdx-section-title">Historias <em>reales</em></h2>
          <p className="pdx-section-sub">+10.000 personas ya transformaron sus noches.</p>
          <div className="pdx-reviews-grid">
            {REVIEWS.map((r, i) => (
              <article key={i} className="pdx-review-card">
                <div className="pdx-review-img">
                  <img src={r.src} alt={r.name} />
                </div>
                <div className="pdx-review-body">
                  <div className="pdx-review-stars">{'★'.repeat(r.stars)}</div>
                  <h4 className="pdx-review-title">{r.title}</h4>
                  <p className="pdx-review-text">"{r.text}"</p>
                  <span className="pdx-review-name">— {r.name}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ══ S13 — GARANTÍA ═════════════════════════════════ */}
        <section className="pdx-section pdx-guarantee">
          <div className="pdx-guarantee-inner">
            <div className="pdx-guarantee-badge">
              <svg viewBox="0 0 80 80" fill="none">
                <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="3" />
                <path d="M25 41l10 10 20-22" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="pdx-guarantee-title">{mc.guarantee?.title || 'CERO RIESGO. CERO EXCUSAS.'}</h2>
            <p className="pdx-guarantee-text">{mc.guarantee?.sub}</p>
            <div className="pdx-guarantee-pills">
              <span>🔒 90 días de garantía</span>
              <span>🚚 Envío gratis</span>
              <span>💳 3 cuotas sin interés</span>
            </div>
            <button className="pdx-cta pdx-cta--guarantee" onClick={handleBuy}>
              {mc.guarantee?.cta || 'EMPEZAR ESTA NOCHE'} →
            </button>
          </div>
        </section>

        {/* ══ S14 — FAQ ══════════════════════════════════════ */}
        <section className="pdx-section pdx-faq">
          <h2 className="pdx-section-title">Preguntas <em>frecuentes</em></h2>
          <p className="pdx-section-sub">Todo lo que necesitás saber sobre los Parches Detox.</p>
          <div className="pdx-faq-list">
            {(mc.faq || []).map((f, i) => (
              <div key={i} className={`pdx-faq-item${openFaq === i ? ' pdx-faq-item--open' : ''}`}>
                <button className="pdx-faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span>{f.q}</span>
                  <span className="pdx-faq-arrow">{openFaq === i ? '−' : '+'}</span>
                </button>
                {openFaq === i && <div className="pdx-faq-a">{f.a}</div>}
              </div>
            ))}
          </div>
        </section>

        {/* ══ FOOTER MÍNIMO ══════════════════════════════════ */}
        <footer className="pdx-footer">
          <div className="pdx-footer-brand">Amelor</div>
          <p className="pdx-footer-tagline">Productos que mejoran tu día a día</p>
          <div className="pdx-footer-trust">
            <span>🔒 Pago seguro</span>
            <span>🚚 Envío gratis</span>
            <span>🛡️ Garantía total</span>
          </div>
          <div className="pdx-footer-links">
            <a href="/terms">Términos</a>
            <span>·</span>
            <a href="/privacy">Privacidad</a>
            <span>·</span>
            <a href="/returns">Devoluciones</a>
          </div>
        </footer>
      </div>

      {/* ══ STICKY CTA ══════════════════════════════════════ */}
      <div className={`pdx-sticky${stickyVisible ? ' pdx-sticky--visible' : ''}`} aria-hidden={!stickyVisible}>
        <div className="pdx-sticky-info">
          <span className="pdx-sticky-was">{fmt(selected?.compareAt || DEFAULT_COMPARE)}</span>
          <span className="pdx-sticky-now">{fmt(selected?.price || DEFAULT_PRICE)}</span>
        </div>
        <button className="pdx-sticky-cta" onClick={handleBuy}>
          {mc.stickyBtnText || 'COMPRAR AHORA'}
        </button>
      </div>

      {showCheckout && (
        <CheckoutSheet
          onClose={() => setShowCheckout(false)}
          primaryColor="#1B4D3E"
          primaryHover="#2D6A4F"
          accentColor="#C9A961"
          fontFamily="'Montserrat', sans-serif"
        />
      )}
    </>
  );
}
