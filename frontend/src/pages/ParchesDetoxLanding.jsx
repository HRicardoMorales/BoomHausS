import { useState, useEffect, useRef, useMemo } from 'react';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { track } from '../lib/metaPixel';
import { CheckoutSheet } from './CheckoutSheet';
import mc from '../landings/parches-detox';

/* ============================================================
   BUNDLES
============================================================ */
const BUNDLES = [
  {
    id: 1,
    label: '3 cajas + 2 de Regalo · Edición Básica',
    badge: 'OFERTA ESPECIAL',
    price: 48800,
    was: 86000,
    qty: 20,
    popular: false,
    benefit: '🌿 20 parches + Ebook · Envío gratis a todo el país',
  },
  {
    id: 2,
    label: '6 cajas + 4 de Regalo · Kit Familiar',
    badge: 'MÁS ELEGIDO',
    price: 58800,
    was: 118200,
    qty: 60,
    popular: true,
    benefit: '📦 60 parches + Ebook · Envío gratis · Ideal para compartir',
  },
  {
    id: 3,
    label: '15 cajas + 5 de Regalo · Kit Premium',
    badge: 'MEJOR VALOR',
    price: 99800,
    was: 194900,
    qty: 100,
    popular: false,
    benefit: '💎 100 parches + Ebook + Pack sorpresa · Envío gratis',
  },
];

/* ============================================================
   MINI REVIEWS DATA
============================================================ */
const MINI_REVIEWS = [
  { name: 'Valentina C.', color: '#1B4D3E', text: '"Primera noche y ya noté diferencia. Me desperté sin ese peso de siempre."', stars: 5 },
  { name: 'Martín R.',    color: '#2F855A', text: '"El parche amaneció completamente oscuro. No sé qué pasó pero me sentí increíble."', stars: 5 },
  { name: 'Luciana P.',   color: '#276749', text: '"Lo uso hace dos semanas y duermo como no dormía hace años."', stars: 5 },
  { name: 'Federico G.',  color: '#1B4D3E', text: '"Llegó rápido y bien embalado. El Ebook también viene buenísimo."', stars: 5 },
  { name: 'Daniela M.',   color: '#2D6A4F', text: '"Escéptica al principio, pero el resultado es visible de verdad."', stars: 5 },
  { name: 'Gastón L.',    color: '#2F855A', text: '"Lo único que noto que funciona para dormir mejor. Totalmente recomendado."', stars: 5 },
];

/* ============================================================
   REVIEWS CAROUSEL DATA
============================================================ */
const REVIEWS = [
  {
    name: 'Carolina F.',
    title: 'EL MEJOR DESCANSO EN MESES',
    text: 'Nunca creí que algo tan simple pudiera hacer tanta diferencia. Desde que uso los parches me despierto descansada de verdad, sin ese cansancio que me acompañaba todos los días. El parche amanece oscuro y eso me genera mucha confianza.',
    stars: 5,
    src: 'https://nesimu.com/cdn/shop/files/imgi_43_D_NQ_NP_2X_676642-MLA97579090775_112025-F.jpg?v=1770705063&width=1420', // foto lifestyle: mujer descansada despertándose por la mañana, luz suave
  },
  {
    name: 'Rodrigo V.',
    title: 'LE REGALÉ A MI MAMÁ Y ELLA ME LO AGRADECIÓ',
    text: 'Soy escéptico pero le compré a mi mamá porque le cuesta dormir hace años. Me mandó un audio al día siguiente diciendo que fue la mejor noche en mucho tiempo. Ya pedimos otro kit.',
    stars: 5,
    src: 'https://nesimu.com/cdn/shop/files/imgi_33_713PY4u2yeL.jpg?v=1770705048&width=1420', // foto producto sobre mesa de luz con libro y vela — ambiente cálido nocturno
  },
  {
    name: 'Jimena S.',
    title: 'SE VE EL RESULTADO AL DESPERTAR',
    text: 'Lo que más me sorprendió es ver el parche oscuro en la mañana. Te das cuenta que algo está pasando. Me siento más liviana y con más energía durante el día. Totalmente recomendado.',
    stars: 5,
    src: 'https://nesimu.com/cdn/shop/files/imgi_36_71_StcLeTHL.jpg?v=1770705063&width=1420', // foto parche oscuro sostenido en mano sobre fondo blanco — primer plano nítido
  },
  {
    name: 'Hernán B.',
    title: 'LLEGÓ RÁPIDO Y EL EBOOK ES UN PLUS',
    text: 'Compré el 2x1, llegó en dos días a Capital. El Ebook que viene incluido tiene información muy buena sobre hábitos de descanso. Los parches funcionaron desde la primera noche para mí.',
    stars: 5,
    src: 'https://nesimu.com/cdn/shop/files/imgi_51_D_NQ_NP_2X_903416-MLA92304661828_092025-F.jpg?v=1770705073&width=1420', // foto caja de producto abierta con parches y ebook visibles — flat lay limpio
  },
];

/* ============================================================
   WAVE SEPARATOR
============================================================ */
function WaveSeparator({ from }) {
  const topColor  = from === 'blue' ? '#1B4D3E' : '#ffffff';
  const fillColor = from === 'blue' ? '#ffffff' : '#1B4D3E';
  return (
    <div className="wave-divider" style={{ '--wave-top-color': topColor }}>
      <svg className="waves-anim" xmlns="http://www.w3.org/2000/svg" viewBox="0 24 150 28" preserveAspectRatio="none">
        <defs>
          <path id="dtx-gentle-wave" d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z" />
        </defs>
        <g className="parallax1"><use xlinkHref="#dtx-gentle-wave" x="48" y="0" fill={fillColor} /></g>
        <g className="parallax2"><use xlinkHref="#dtx-gentle-wave" x="48" y="3" fill={fillColor} /></g>
        <g className="parallax3"><use xlinkHref="#dtx-gentle-wave" x="48" y="5" fill={fillColor} /></g>
        <g className="parallax4"><use xlinkHref="#dtx-gentle-wave" x="48" y="7" fill={fillColor} /></g>
      </svg>
    </div>
  );
}

/* ============================================================
   BEFORE / AFTER SLIDER
============================================================ */
function BeforeAfterSlider({ imgBefore, imgAfter }) {
  const containerRef = useRef(null);

  const handleSlider = (e) => {
    if (containerRef.current) {
      containerRef.current.style.setProperty('--position', `${e.target.value}%`);
    }
  };

  return (
    <div className="ba-wrap">
      {/* ref en el contenedor — --position se actualiza directo en el DOM sin re-render */}
      <div className="ba-container" ref={containerRef} style={{ '--position': '50%' }}>
        <div className="ba-img-wrap">
          {/* imagen "después": oscuro al despertar — ocupa 100% del contenedor */}
          <img className="ba-img-after" src={imgAfter} alt="Parche Detox al despertar — oscuro y manchado" />
          {/* imagen "antes": blanco — se recorta a width:var(--position) vía CSS, sin inline style */}
          <img className="ba-img-before" src={imgBefore} alt="Parche Detox antes de usar — blanco y fresco" />
        </div>
        {/* badges dentro de ba-container (position:relative) para z-index correcto */}
        <span className="ba-badge ba-badge-before">{mc.beforeLabel || 'Antes de dormir'}</span>
        <span className="ba-badge ba-badge-after">{mc.afterLabel  || 'Al despertar'}</span>
        {/* input sin estado controlado — onInput dispara en cada movimiento (touch + mouse) */}
        <input
          type="range" min="0" max="100" defaultValue="50"
          onInput={handleSlider}
          className="ba-range"
          aria-label="Comparar antes y después"
        />
        <div className="ba-line" />
        <div className="ba-handle">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M6 9H12M6 9L4 7M6 9L4 11M12 9L14 7M12 9L14 11"
              stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   MINI REVIEWS BAR
============================================================ */
function MiniReviewsBar() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActive(i => (i + 1) % MINI_REVIEWS.length), 5000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="mrb">
      <div className="mrb-label">LO QUE DICEN NUESTROS CLIENTES</div>
      <div className="mrb-viewport">
        <div className="mrb-track" style={{ transform: `translateX(-${active * 100}%)` }}>
          {MINI_REVIEWS.map((rev, i) => (
            <div className="mrb-slide" key={i}>
              <div className="mrb-card">
                <div className="mrb-card-header">
                  <div className="mrb-card-avatar" style={{ background: rev.color }}>{rev.name[0]}</div>
                  <div className="mrb-card-meta">
                    <div className="mrb-card-name">{rev.name}</div>
                    <div className="mrb-card-stars">
                      <div className="stars-inline">
                        {[1,2,3,4,5].map(s => <span key={s} className={`s${s <= rev.stars ? ' on' : ''}`}>★</span>)}
                      </div>
                    </div>
                  </div>
                </div>
                <p className="mrb-card-text">{rev.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mrb-dots">
        {MINI_REVIEWS.map((_, i) => (
          <button key={i} className={`mrb-dot${i === active ? ' on' : ''}`} onClick={() => setActive(i)} />
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   REVIEWS CAROUSEL PRO
============================================================ */
function ReviewsCarouselPro({ reviewImages = [], imagesReady = true }) {
  const rowRef = useRef(null);
  const [active, setActive] = useState(0);
  const scrollTo = (i) => {
    setActive(i);
    const row = rowRef.current;
    if (!row) return;
    const slide = row.children[i];
    if (slide) slide.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  };
  return (
    <div className="rv-wrap">
      <div className="rv-row" ref={rowRef}>
        {REVIEWS.map((r, i) => (
          <div className="rv-slide" key={i}>
            <div className="rv-card">
              <div className="rv-imgBox">
                {imagesReady
                  ? <img src={reviewImages[i] || r.src} alt={`Reseña de ${r.name}`} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                  : <div style={{ width:'100%', height:'100%', background:'#eef0f2' }} />
                }
                <div className="rv-quote">"</div>
              </div>
              <div className="rv-body">
                <div className="stars-inline">
                  {[1,2,3,4,5].map(s => <span key={s} className={`s${s <= r.stars ? ' on' : ''}`}>★</span>)}
                </div>
                <div className="rv-title">{r.title}</div>
                <p className="rv-text">{r.text}</p>
                <div className="rv-name">— {r.name}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button className="rv-nav rv-prev" onClick={() => scrollTo(Math.max(0, active - 1))}>‹</button>
      <button className="rv-nav rv-next" onClick={() => scrollTo(Math.min(REVIEWS.length - 1, active + 1))}>›</button>
      <div className="rv-dots">
        {REVIEWS.map((_, i) => (
          <button key={i} className={`rv-dot${i === active ? ' on' : ''}`} onClick={() => scrollTo(i)} />
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   WA TAB
============================================================ */
function WaTab({ wa }) {
  const [open, setOpen] = useState(false);
  const timerRef = useRef(null);
  useEffect(() => {
    timerRef.current = setTimeout(() => setOpen(true), 4000);
    return () => clearTimeout(timerRef.current);
  }, []);
  if (!wa?.show) return null;
  const href = `https://wa.me/${wa.number}?text=${encodeURIComponent(wa.message)}`;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className={`wa-tab${open ? ' wa-tab--open' : ''}`}
      aria-label="WhatsApp"
      onClick={() => setOpen(false)}
    >
      <span className="wa-tab-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
        </svg>
      </span>
      {open && <span className="wa-tab-label">¿Consultas?</span>}
    </a>
  );
}

/* ============================================================
   MAIN COMPONENT
============================================================ */
export default function ParchesDetoxLanding() {
  const [product,        setProduct]       = useState(null);
  const [productReady,   setProductReady]  = useState(false);
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [selectedBundle, setSelectedBundle] = useState(BUNDLES[1]);
  const [openFaq,        setOpenFaq]        = useState(null);
  const [showSheet,      setShowSheet]      = useState(false);
  const { addItem } = useCart();

  useEffect(() => {
    api.get(`/products/slug/${mc.productSlug}`)
      .then(r => { setProduct(r.data?.data || r.data); setProductReady(true); })
      .catch(() => { setProductReady(true); });
  }, []);

  // Admin puede editar: precio, precio tachado y nombre de cada bundle.
  // Fuente de verdad del código para: badge, benefit, qty, popular.
  // Para editar bundles: Panel Admin → Productos → Parches Detox → Paquetes.
  const displayBundles = useMemo(() => {
    return BUNDLES.map((b, idx) => {
      const db = product?.bundles?.[idx];
      return {
        ...b,
        label: db?.label   || b.label,
        price: db?.price   || b.price,
        was:   db?.compareAt ?? b.was,
      };
    });
  }, [product]);

  // Mantiene el bundle seleccionado en sync con el índice correcto al cargar el producto
  useEffect(() => {
    const idx = BUNDLES.findIndex(b => b.id === selectedBundle.id);
    const next = displayBundles[idx >= 0 ? idx : 1] ?? displayBundles[0];
    if (next) setSelectedBundle(next);
  }, [displayBundles]);

  const handleBuy = () => {
    if (!product) return;
    addItem(
      { ...product, name: `Parches Detox — ${selectedBundle.label}` },
      1,
      { bundleTotal: selectedBundle.price, compareAtPrice: selectedBundle.was },
    );
    track('InitiateCheckout', {
      value: selectedBundle.price / 100,
      currency: 'ARS',
      content_name: mc.checkoutName,
    });
    setShowSheet(true);
  };

  const fmt = (n) => '$' + Number(n).toLocaleString('es-AR');

  // Hero gallery — mismo patrón que ProductDetail.jsx:
  //   1. product.imageUrl (campo directo del admin)
  //   2. product.images[] (array del admin, una URL por línea)
  //   3. fallback: mc.images[0..3] del config (parches-detox.js)
  const heroImgs = useMemo(() => {
    const arr = [];
    if (product?.imageUrl) arr.push(product.imageUrl);
    if (Array.isArray(product?.images)) {
      product.images.forEach(x => {
        if (x && typeof x === 'string' && !arr.includes(x)) arr.push(x);
      });
    }
    if (arr.length) return arr;
    return (mc.images || []).slice(0, 4).filter(Boolean);
  }, [product]);

  // Imágenes de las demás secciones: fallback al config (parches-detox.js → images[]).
  // Índices: 4 feel | 5 antes | 6 después | 7-10 howto | 11 nocturna | 12-14 vstrip | 15-18 reseñas
  const imgs = useMemo(() => {
    const db = (product?.images || []).map(img => img?.url || img || '');
    const cfg = mc.images || [];
    return Array.from({ length: 19 }, (_, i) => db[i] || cfg[i] || '');
  }, [product]);

  // No renderizar hasta tener los datos reales — elimina el flash del estado inicial de config
  if (!productReady) {
    return (
      <>
        <style>{`@keyframes _dtxBar{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
        <div style={{ minHeight:'100vh', background:'#fff' }}>
          <div style={{ height:3, background:'linear-gradient(90deg,#1B4D3E,#4ade80,#1B4D3E)', backgroundSize:'200% 100%', animation:'_dtxBar 1.1s linear infinite' }} />
        </div>
      </>
    );
  }

  return (
    <div className="dtx-wrap">

      {/* ============================================================
          HERO — imagen+thumbs izquierda / info+bundles derecha
      ============================================================ */}
      <div className="pd-hero-row">

        {/* Columna izquierda: imagen principal + thumbnails */}
        <section className="pd-media-fullwidth">
          <section className="pd-media">
            <div className="pd-mediaMain pd-mediaMain--bigger">
              <img
                key={activeImgIndex}
                className="pd-mainImg pd-mainImg--anim"
                src={heroImgs[activeImgIndex]}
                alt="Parches Plantares Detox Kinoki"
                style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}
              />
            </div>
            <div className="pd-thumbs-row">
              {heroImgs.map((img, idx) => (
                <button
                  key={idx}
                  className={`pd-thumb${idx === activeImgIndex ? ' is-active' : ''}`}
                  onClick={() => setActiveImgIndex(idx)}
                >
                  <img src={img} alt={`Vista ${idx + 1}`} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                </button>
              ))}
            </div>
          </section>
        </section>

        {/* Columna derecha: info + bundle picker */}
        <div className="container pd-container">
          <aside className="pd-info">
            <div className="hero-top hero-top--compact">

              {/* Avatars + reseñas — igual que ProductDetail */}
              <div className="reviews-container">
                <div className="avatars">
                  <img className="avatar" src="https://img.freepik.com/free-photo/stylish-african-american-woman-smiling_23-2148770405.jpg" alt="Cliente 1" />
                  <img className="avatar" src="https://thumbs.dreamstime.com/b/beautiful-african-american-woman-relaxing-outside-happy-middle-aged-smiling-46298787.jpg" alt="Cliente 2" />
                  <img className="avatar" src="https://media.istockphoto.com/id/1320651997/photo/young-woman-close-up-isolated-studio-portrait.jpg?s=612x612&w=0&k=20&c=lV6pxz-DknISGT2jjiSvUmSaw0hpMDf-dBpT8HTSAUI=" alt="Cliente 3" />
                </div>
                <span className="text-grey">
                  Calificado <strong>4.8/5</strong> basado en <strong>+847 reseñas</strong>
                </span>
              </div>

              {/* Título del hero — editable desde admin → Productos → nombre */}
              <h1 className="hero-title hero-title--compact">
                {product?.name
                  ? product.name
                  : <>Desintoxica Tu Cuerpo Mientras Duermes<br />Parches Detox Kinoki</>
                }
              </h1>

              {/* Subtítulo */}
              <div className="hero-subtitle">{mc.heroSubtitle}</div>

              {/* Trust bullets */}
              <div className="emoji-bullets">
                {mc.trustBullets.map((b, i) => (
                  <div key={i} className="emoji-bullet">{b}</div>
                ))}
              </div>

              {/* Trust tablets — igual a ProductDetail */}
              <div className="bnd2-tablets">
                <div className="bnd2-tablet">
                  <span className="bnd2-tablet-ico">🚚</span>
                  <span className="bnd2-tablet-line1">Envío Gratis</span>
                  <span className="bnd2-tablet-line2">a todo el país</span>
                </div>
                <div className="bnd2-tablet">
                  <span className="bnd2-tablet-ico">💳</span>
                  <span className="bnd2-tablet-line1">Cuotas</span>
                  <span className="bnd2-tablet-line2">sin interés</span>
                </div>
                <div className="bnd2-tablet">
                  <span className="bnd2-tablet-ico">🛡️</span>
                  <span className="bnd2-tablet-line1">Garantía</span>
                  <span className="bnd2-tablet-line2">7 días</span>
                </div>
              </div>

              {/* Bundle picker */}
              <div className="bnd2-wrap">
                <div className="bnd2-section-title">✨ Ofertas por Tiempo Limitado ✨</div>

                {displayBundles.map((b) => (
                  <div
                    key={b.id}
                    className={`bnd2-card${selectedBundle.id === b.id ? ' bnd2-card--on' : ''}${b.popular ? ' bnd2-card--pop' : ''}`}
                    onClick={() => setSelectedBundle(b)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && setSelectedBundle(b)}
                  >
                    {b.popular && <div className="bnd2-float-badge">⭐ MÁS ELEGIDO</div>}
                    <div className="bnd2-row">
                      <input type="radio" className="bnd2-radio" readOnly checked={selectedBundle.id === b.id} aria-label={b.label} />
                      <div className="bnd2-center">
                        <span className="bnd2-name">{b.label}</span>
                        <span className={`bnd2-badge${b.popular ? ' bnd2-badge--pop' : ''}`}>{b.badge}</span>
                      </div>
                      <div className="bnd2-prices">
                        <span className="bnd2-was">{fmt(b.was)}</span>
                        <span className="bnd2-now">{fmt(b.price)}</span>
                      </div>
                    </div>
                    <div className="bnd2-benefit">{b.benefit}</div>
                  </div>
                ))}

                {/* CTA — igual a ProductDetail */}
                <button className="bnd2-cta" type="button" onClick={handleBuy}>
                  AGREGAR AL CARRITO
                </button>

                {/* Pago seguro + logos */}
                <div className="bnd2-payments">
                  <p className="bnd2-payments-title">🔒 Pago Seguro</p>
                  <div className="bnd2-payments-icons">
                    {/* Visa */}
                    <div className="hero-pay-icon"><svg viewBox="0 0 48 32" width="36" height="24"><rect width="48" height="32" rx="4" fill="#fff" stroke="#ddd" strokeWidth="1"/><path d="M19.5 21h-3.2l2-12.4h3.2L19.5 21zm12.8-12.1c-.6-.3-1.6-.5-2.9-.5-3.2 0-5.4 1.7-5.4 4.1 0 1.8 1.6 2.8 2.8 3.4 1.2.6 1.7 1 1.6 1.5 0 .8-1 1.2-1.9 1.2-1.3 0-1.9-.2-3-.7l-.4-.2-.4 2.7c.7.4 2.1.7 3.5.7 3.4 0 5.5-1.7 5.6-4.2 0-1.4-.8-2.5-2.7-3.4-1.1-.6-1.8-.9-1.8-1.5 0-.5.6-1 1.8-1 1 0 1.8.2 2.4.5l.3.1.5-2.7zm8.3-.3h-2.5c-.8 0-1.3.2-1.7 1L32 21h3.4l.7-1.8h4.1l.4 1.8H44l-2.7-12.4h-2.7zm-3.3 8l1.7-4.6.8 4.6h-2.5zM16.3 8.6l-3.1 8.5-.3-1.7c-.6-2-2.4-4.2-4.5-5.2l2.9 10.7h3.4l5.1-12.3h-3.5z" fill="#1A1F71"/><path d="M10.4 8.6H5.1l-.1.3c4 1 6.7 3.5 7.8 6.5l-1.1-5.7c-.2-.8-.8-1-1.3-1.1z" fill="#F9A533"/></svg></div>
                    {/* Mastercard */}
                    <div className="hero-pay-icon"><svg viewBox="0 0 48 32" width="36" height="24"><rect width="48" height="32" rx="4" fill="#fff" stroke="#ddd" strokeWidth="1"/><circle cx="19" cy="16" r="9" fill="#EB001B"/><circle cx="29" cy="16" r="9" fill="#F79E1B"/><path d="M24 9.3a9 9 0 013 6.7 9 9 0 01-3 6.7 9 9 0 01-3-6.7 9 9 0 013-6.7z" fill="#FF5F00"/></svg></div>
                    {/* American Express */}
                    <div className="hero-pay-icon"><svg viewBox="0 0 48 32" width="36" height="24"><rect width="48" height="32" rx="4" fill="#016FD0"/><text x="24" y="13" textAnchor="middle" fill="#fff" fontSize="5.5" fontWeight="bold" fontFamily="Arial">AMERICAN</text><text x="24" y="21" textAnchor="middle" fill="#fff" fontSize="5.5" fontWeight="bold" fontFamily="Arial">EXPRESS</text></svg></div>
                    {/* Mercado Pago */}
                    <div className="hero-pay-icon"><svg viewBox="0 0 48 32" width="36" height="24"><rect width="48" height="32" rx="4" fill="#fff" stroke="#ddd" strokeWidth="1"/><rect x="4" y="9" width="40" height="14" rx="2" fill="#009EE3"/><text x="24" y="19" textAnchor="middle" fill="#fff" fontSize="6" fontWeight="bold" fontFamily="Arial">MERCADO PAGO</text></svg></div>
                    {/* Naranja */}
                    <div className="hero-pay-icon"><svg viewBox="0 0 48 32" width="36" height="24"><rect width="48" height="32" rx="4" fill="#FF6200"/><text x="24" y="20" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="bold" fontFamily="Arial">naranja</text></svg></div>
                    {/* Galicia */}
                    <div className="hero-pay-icon"><svg viewBox="0 0 48 32" width="36" height="24"><rect width="48" height="32" rx="4" fill="#fff" stroke="#ddd" strokeWidth="1"/><rect x="4" y="9" width="40" height="14" rx="2" fill="#E31837"/><text x="24" y="19" textAnchor="middle" fill="#fff" fontSize="7.5" fontWeight="bold" fontFamily="Arial">Galicia</text></svg></div>
                    {/* BBVA */}
                    <div className="hero-pay-icon"><svg viewBox="0 0 48 32" width="36" height="24"><rect width="48" height="32" rx="4" fill="#fff" stroke="#ddd" strokeWidth="1"/><rect x="4" y="9" width="40" height="14" rx="2" fill="#004481"/><text x="24" y="19.5" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="bold" fontFamily="Arial">BBVA</text></svg></div>
                  </div>
                </div>

                {/* Urgencia — igual a ProductDetail */}
                <div className="bnd2-urgency">
                  <span className="bnd2-urgency-dot" />
                  ¡Últimas unidades!
                </div>
              </div>

            </div>
          </aside>
        </div>
      </div>

      {/* ============================================================
          BANDAS DE CONTENIDO
      ============================================================ */}
      <div className="pd-bands">

        {/* Mini reviews bar */}
        <section className="pd-band pd-band--light">
          <div className="dtx-container">
            <MiniReviewsBar />
          </div>
        </section>

        <WaveSeparator from="light" />

        {/* ── ¿TE SENTÍS ASÍ? ── */}
        <section className="pd-band pd-band--blue">
          <div className="dtx-container dtx-py">
            <div className="pd-feel-row">
              <div className="pd-feel-img-col">
                {/* persona cansada mirando el techo a la mañana, luz gris difusa, sábanas arrugadas */}
                <img className="pd-feel-img" src="https://pbs.twimg.com/media/HHsW_2lWwAMRUNJ?format=jpg&name=small" alt="Persona cansada al despertar — se siente pesada y sin energía" />
              </div>
              <div className="pd-feel-cards-col">
                {/* TÍTULO EDITABLE: sección síntomas — cambiar "¿Te sentís así?" */}
                <h2 className="pd-feel-title">¿Te sentís así?</h2>
                <div className="pd-feel-grid">
                  {[
                    '😴 Te despertás cansado/a aunque dormiste muchas horas',
                    '🦶 Sensación de pesadez o hinchazón en las piernas',
                    '🌫️ Niebla mental: te cuesta concentrarte en la mañana',
                    '😣 Dolor o tensión en la planta del pie al levantarte',
                    '🔄 Sueño poco reparador, te movés mucho durante la noche',
                    '⚡ Poca energía durante el día sin razón aparente',
                  ].map((s, i) => (
                    <div key={i} className="pd-feel-card">
                      <span className="pd-feel-check">✅</span>
                      <span className="pd-feel-card-text">{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <WaveSeparator from="blue" />

        {/* ── ANTES / DESPUÉS ── */}
        <section className="pd-band pd-band--light">
          <div className="dtx-container dtx-py">
            <div className="sec-head">
              {/* TÍTULO EDITABLE: sección antes/después — cambiar en parches-detox.js → beforeAfterTitle */}
              <h2 className="sec-title">{mc.beforeAfterTitle}</h2>
              <p className="sec-sub">{mc.beforeAfterSubtitle}</p>
            </div>
            <BeforeAfterSlider imgBefore={imgs[5]} imgAfter={imgs[6]} />
            <p className="dtx-ba-hint">← Arrastrá el divisor para ver la diferencia →</p>
          </div>
        </section>

        <WaveSeparator from="light" />

        {/* ── CÓMO USARLO ── */}
        <section className="pd-band pd-band--blue">
          <div className="dtx-container dtx-py">
            <div className="sec-head">
              {/* TÍTULO EDITABLE: sección instrucciones — cambiar "¿CÓMO USARLO?" */}
              <h2 className="sec-title" style={{ color: 'rgba(255,255,255,.92)' }}>¿CÓMO USARLO?</h2>
              {/* SUBTÍTULO EDITABLE: cambiar "4 simples pasos · Sin complicaciones · Solo 5 segundos" */}
              <p className="sec-sub" style={{ color: 'rgba(255,255,255,.55)' }}>4 simples pasos · Sin complicaciones · Solo 5 segundos</p>
            </div>
            <div className="pd-howto-grid">
              {[
                { num: '01', text: 'Lavá y secá bien la planta del pie antes de acostarte.' },
                { num: '02', text: 'Despegá el adhesivo y posicioná el parche en el centro de la planta.' },
                { num: '03', text: 'Dormí normalmente. El parche actúa durante las 6-8 horas de sueño.' },
                { num: '04', text: 'Al despertar, retirá el parche y observá el cambio de color.' },
              ].map((step, i) => (
                <div key={i} className="pd-howto-card">
                  <div className="pd-howto-img-wrap">
                    <img className="pd-howto-img" src={imgs[7 + i]} alt={`Paso ${step.num}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  </div>
                  <div className="pd-howto-num">{step.num}</div>
                  <p className="pd-howto-text">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <WaveSeparator from="blue" />

        {/* ── IMAGEN TRANSFORMACIÓN NOCTURNA ── */}
        <section className="pd-band pd-band--light">
          <div style={{ paddingTop: 52, paddingBottom: 52 }}>
            <img
              src={imgs[11]}
              alt="Transformación visible nocturna — Parches Detox Kinoki"
              style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'contain' }}
            />
          </div>
        </section>

        <WaveSeparator from="light" />

        {/* ── VSTRIP — 3 fotos verticales ── */}
        <section className="pd-band pd-band--blue">
          <div className="dtx-container dtx-py">
            <div className="vstrip-section">
              <div className="vstrip-header">
                {/* KICKER EDITABLE: etiqueta sobre el título — cambiar "✦ CLIENTES SATISFECHOS" */}
                <span className="vstrip-kicker">✦ CLIENTES SATISFECHOS</span>
                {/* TÍTULO EDITABLE: sección fotos de clientes — cambiar texto a continuación */}
                <h2 className="vstrip-title" style={{ color: 'rgba(255,255,255,.92)' }}>
                  Únete a miles de personas<br />que despiertan mejor
                </h2>
                {/* SUBTÍTULO EDITABLE: cambiar "Resultados reales · Uso nocturno · Sin esfuerzo" */}
                <p className="vstrip-sub" style={{ color: 'rgba(255,255,255,.55)' }}>
                  Resultados reales · Uso nocturno · Sin esfuerzo
                </p>
              </div>
              <div className="vstrip-row">
                {[
                  { label: '✅ Uso nocturno' },
                  { label: '🌿 Resultado visible' },
                  { label: '😊 Clientes felices' },
                ].map((item, i) => (
                  <div key={i} className="vstrip-item">
                    <div className="vstrip-media">
                      <img className="vstrip-video" src={imgs[12 + i]} alt={item.label} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    </div>
                    <div className="vstrip-label">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <WaveSeparator from="blue" />

        {/* ── RESEÑAS COMPLETAS ── */}
        <section className="pd-band pd-band--light">
          <div className="dtx-container dtx-py">
            <div className="sec-head">
              {/* TÍTULO EDITABLE: sección reseñas — cambiar "LO QUE DICEN NUESTROS CLIENTES" */}
              <h2 className="sec-title">LO QUE DICEN NUESTROS CLIENTES</h2>
              {/* SUBTÍTULO EDITABLE: cambiar "+847 reseñas verificadas · Promedio 4.8 ⭐" */}
              <p className="sec-sub">+847 reseñas verificadas · Promedio 4.8 ⭐</p>
            </div>
            <ReviewsCarouselPro reviewImages={imgs.slice(15, 19)} imagesReady={productReady} />
          </div>
        </section>

        <WaveSeparator from="light" />

        {/* ── GARANTÍA ── */}
        <section className="pd-band pd-band--blue">
          <div className="dtx-container">
            <div className="grt-section">
              <div className="grt-medal">
                <div className="grt-medal-face">
                  <span className="grt-medal-sup">GARANTÍA</span>
                  <span className="grt-medal-num">7</span>
                  <span className="grt-medal-bot">DÍAS</span>
                </div>
              </div>
              {/* TÍTULO EDITABLE: sección garantía — cambiar en parches-detox.js → guarantee.title */}
              <h2 className="grt-title">{mc.guarantee.title}</h2>
              {/* TEXTO EDITABLE: descripción de la garantía — cambiar en parches-detox.js → guarantee.sub */}
              <p className="grt-sub">{mc.guarantee.sub}</p>
              <div className="grt-pills">
                <span className="grt-pill">✅ Sin preguntas</span>
                <span className="grt-pill">✅ Sin trámites</span>
                <span className="grt-pill">✅ Devolución completa</span>
                <span className="grt-pill">🚚 Envío gratis</span>
              </div>
              <button className="grt-cta" onClick={handleBuy}>{mc.guarantee.cta}</button>
            </div>
          </div>
        </section>

        <WaveSeparator from="blue" />

        {/* ── FAQ ── */}
        <section className="pd-band pd-band--light">
          <div className="dtx-container dtx-py" style={{ paddingBottom: '100px' }}>
            <div className="faq-acc-wrap">
              {/* TÍTULO EDITABLE: sección FAQ — cambiar "Preguntas frecuentes" */}
              <h2 className="faq-acc-title">Preguntas frecuentes</h2>
              <div className="faq-acc">
                {mc.faq.map((item, i) => (
                  <div key={i} className={`faq-acc-item${openFaq === i ? ' active' : ''}`}>
                    <div className="faq-acc-header" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                      {item.q}
                      <span className="faq-acc-indicator">▾</span>
                    </div>
                    <div className="faq-acc-content">
                      <p>{item.a}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

      </div>{/* /pd-bands */}

      {/* ============================================================
          STICKY BAR — visible en todos los tamaños de pantalla
      ============================================================ */}
      <div className="pd-sticky-bar">
        <div className="pd-sticky-info">
          <div className="pd-sticky-prices">
            <span className="pd-sticky-old">{fmt(selectedBundle.was)}</span>
            <span className="pd-sticky-now">{fmt(selectedBundle.price)}</span>
          </div>
          <span className="pd-sticky-qty">{selectedBundle.qty} parches incluidos</span>
        </div>
        <button className="pd-sticky-btn" onClick={handleBuy}>
          {mc.stickyBtnText}
        </button>
      </div>

      <WaTab wa={mc.whatsapp} />

      {showSheet && <CheckoutSheet onClose={() => setShowSheet(false)} />}

      {/* ============================================================
          ESTILOS — prefijo pd- para secciones nuevas, clases reutilizadas
          de ProductDetail incluidas aquí para evitar dependencia de orden
      ============================================================ */}
      <style>{`

        /* ── Layout helpers ── */
        .dtx-wrap { font-family: inherit; }
        .dtx-container { width:100%; max-width:1180px; margin:0 auto; padding:0 16px; }
        .dtx-py { padding-top:44px; padding-bottom:44px; }
        .pd-info { display:flex; flex-direction:column; padding:20px 0; min-width:0; width:100%; max-width:100%; }
        @media (min-width:980px) { .pd-info { padding:28px 0; } }
        @media (max-width:980px) { .pd-info { padding:0 4px; box-sizing:border-box; } }
        .hero-top--compact { padding:6px 2px 0 !important; }

        /* ── Hero row ── */
        .pd-hero-row { display:block; }
        @media (min-width:980px) {
          .pd-hero-row { display:flex; align-items:flex-start; max-width:1180px; margin:0 auto; }
          .pd-hero-row .pd-media-fullwidth { flex:0 0 50%; max-width:50%; position:sticky; top:70px; align-self:flex-start; }
          .pd-hero-row .pd-container { flex:1; min-width:0; margin:0 !important; padding:0 28px 0 24px; max-width:50%; }
        }

        /* ── Product media ── */
        .pd-media-fullwidth { width:100%; }
        .pd-media { padding:0 !important; overflow:hidden; border-radius:0 !important; box-shadow:none !important; }
        .pd-mediaMain--bigger { position:relative; width:100%; background:#f8fafc; overflow:hidden; border-radius:0; height:520px; }
        @media (min-width:980px) { .pd-mediaMain--bigger { height:560px; border-radius:16px; } }
        @media (max-width:980px) { .pd-mediaMain--bigger { height:420px; } }
        @media (max-width:520px)  { .pd-mediaMain--bigger { height:360px; } }
        .pd-mainImg--anim { animation:dtxFadeIn 150ms ease forwards; }
        @keyframes dtxFadeIn { from{opacity:0;} to{opacity:1;} }

        /* ── Thumbs ── */
        .pd-thumbs-row { display:flex; gap:6px; padding:6px 8px; overflow-x:auto; scrollbar-width:none; justify-content:center; }
        .pd-thumbs-row::-webkit-scrollbar { display:none; }
        .pd-thumb { flex:1; min-width:0; max-width:90px; aspect-ratio:4/3; border-radius:8px; overflow:hidden; border:2px solid rgba(0,0,0,.08); background:#f1f3f5; padding:0; cursor:pointer; transition:border-color .15s ease, opacity .15s ease; opacity:.65; }
        .pd-thumb.is-active { border-color:rgba(27,77,62,.7); opacity:1; }
        .pd-thumb img { width:100%; height:100%; object-fit:cover; display:block; }

        /* ── Hero info ── */
        .reviews-container { display:flex; align-items:center; justify-content:center; margin:5px 0; }
        .avatars { display:flex; margin-right:5px; margin-left:7px; }
        .avatar { width:28px; height:28px; border-radius:50%; border:2px solid #fff; margin-left:-7px; object-fit:cover; }
        .text-grey { font-weight:normal; font-size:12px; color:#868686; line-height:0; }
        .text-grey strong { font-weight:800; color:#2e2f3c; }
        .hero-title--compact { margin:0 !important; text-align:center !important; font-size:32px !important; line-height:1.05 !important; font-weight:1100 !important; }
        @media (max-width:520px) { .hero-title--compact { font-size:26px !important; } }
        .hero-subtitle { text-align:center; font-weight:900; font-size:16px; margin-top:8px; }

        /* ── Emoji bullets ── */
        .emoji-bullets { display:flex; flex-direction:column; gap:8px; margin:10px 0 4px; width:100%; }
        .emoji-bullet { font-size:.90rem; font-weight:700; color:rgba(11,18,32,.82); line-height:1.35; }
        @media (max-width:520px) { .emoji-bullet { font-size:.86rem; } }

        /* ── Trust tablets ── */
        .bnd2-tablets { display:flex; gap:8px; margin:12px 0 0; width:100%; }
        .bnd2-tablet { flex:1; display:flex; flex-direction:column; align-items:center; gap:3px; padding:10px 6px; border-radius:12px; border:1px solid rgba(11,18,32,.11); background:#fff; text-align:center; }
        .bnd2-tablet-ico   { font-size:1.25rem; line-height:1; }
        .bnd2-tablet-line1 { font-size:.72rem; font-weight:800; color:rgba(11,18,32,.80); line-height:1.2; }
        .bnd2-tablet-line2 { font-size:.65rem; font-weight:600; color:rgba(11,18,32,.48); line-height:1.2; }

        /* ── Bundle picker ── */
        .bnd2-wrap { display:flex; flex-direction:column; gap:10px; margin:14px 0 4px; }
        .bnd2-card { position:relative; border-radius:14px; border:1.5px solid rgba(11,18,32,.13); border-left:4px solid rgba(11,18,32,.10); background:#fff; cursor:pointer; transition:border-color .14s,background .14s,box-shadow .14s,border-left-color .14s; user-select:none; overflow:visible; padding:13px 14px 13px 12px; }
        .bnd2-card:hover { border-color:rgba(27,77,62,.30); border-left-color:rgba(27,77,62,.40); background:rgba(27,77,62,.02); }
        .bnd2-card--on { border-color:#1B4D3E !important; border-left:4px solid #1B4D3E !important; background:rgba(27,77,62,.04) !important; box-shadow:0 4px 18px rgba(27,77,62,.10); }
        .bnd2-card--pop { border-color:rgba(27,77,62,.25); border-left-color:rgba(27,77,62,.30); background:rgba(27,77,62,.02); margin-top:6px; }
        .bnd2-card--pop.bnd2-card--on { box-shadow:0 6px 22px rgba(27,77,62,.15); }
        .bnd2-float-badge { position:absolute; top:-11px; left:50%; transform:translateX(-50%); background:linear-gradient(135deg,#1B4D3E,#2F855A); color:#fff; font-size:.68rem; font-weight:900; letter-spacing:.07em; text-transform:uppercase; padding:3px 14px; border-radius:999px; white-space:nowrap; box-shadow:0 3px 10px rgba(27,77,62,.30); }
        .bnd2-row { display:flex; align-items:center; gap:10px; }
        .bnd2-radio { width:18px; height:18px; flex-shrink:0; accent-color:#1B4D3E; cursor:pointer; }
        .bnd2-center { flex:1; min-width:0; display:flex; flex-direction:column; align-items:flex-start; gap:4px; }
        .bnd2-name { font-size:.91rem; font-weight:800; color:rgba(11,18,32,.88); line-height:1.2; }
        .bnd2-badge { font-size:.62rem; font-weight:900; letter-spacing:.06em; text-transform:uppercase; padding:3px 9px; border-radius:999px; background:rgba(27,77,62,.10); color:#1B4D3E; border:1px solid rgba(27,77,62,.20); white-space:nowrap; }
        .bnd2-badge--pop { background:linear-gradient(135deg,#1B4D3E,#2F855A); color:#fff; border-color:transparent; box-shadow:0 2px 8px rgba(27,77,62,.25); }
        .bnd2-prices { flex-shrink:0; display:flex; flex-direction:column; align-items:flex-end; gap:1px; }
        .bnd2-was { font-size:.72rem; color:rgba(11,18,32,.35); text-decoration:line-through; font-weight:600; line-height:1.1; }
        .bnd2-now { font-size:1.10rem; font-weight:900; color:rgba(11,18,32,.90); line-height:1.1; }
        .bnd2-benefit { margin-top:8px; padding:8px 10px; border-radius:8px; background:rgba(27,77,62,.07); font-size:.80rem; font-weight:700; color:#1B4D3E; letter-spacing:.01em; line-height:1.35; }
        .bnd2-cta { width:100%; padding:16px 20px; border-radius:14px; border:none; background:linear-gradient(135deg,#1B4D3E 0%,#2a6e59 100%); color:#fff; font-size:1.05rem; font-weight:900; letter-spacing:.07em; text-transform:uppercase; cursor:pointer; box-shadow:0 6px 22px rgba(27,77,62,.30); transition:transform .12s,box-shadow .12s,background .14s; margin-top:4px; }
        .bnd2-cta:hover { background:linear-gradient(135deg,#163d31 0%,#245c4a 100%); box-shadow:0 8px 28px rgba(27,77,62,.38); transform:translateY(-1px); }
        .bnd2-cta:active { transform:translateY(0) scale(.98); }
        .bnd2-urgency { display:flex; align-items:center; justify-content:center; gap:8px; padding:10px 16px; border-radius:999px; background:rgba(229,62,62,.08); border:1px solid rgba(229,62,62,.15); font-size:.80rem; font-weight:800; color:rgba(180,30,30,.85); letter-spacing:.02em; }
        .bnd2-urgency-dot { width:8px; height:8px; border-radius:50%; background:#e53e3e; flex-shrink:0; animation:bnd2Pulse 1.4s ease-in-out infinite; }
        @keyframes bnd2Pulse { 0%,100%{box-shadow:0 0 0 0 rgba(229,62,62,.55);} 50%{box-shadow:0 0 0 5px rgba(229,62,62,0);} }
        .bnd2-section-title { text-align:center; font-size:.88rem; font-weight:900; color:#1B4D3E; letter-spacing:.04em; margin-bottom:2px; }
        .bnd2-payments { display:flex; flex-direction:column; align-items:center; gap:6px; margin-top:2px; }
        .bnd2-payments-title { font-size:.72rem; font-weight:700; color:rgba(11,18,32,.45); letter-spacing:.04em; text-transform:uppercase; margin:0; }
        .bnd2-payments-icons { display:flex; align-items:center; gap:6px; flex-wrap:wrap; justify-content:center; }
        .hero-pay-icon { display:flex; align-items:center; justify-content:center; }
        .hero-pay-icon svg { border-radius:4px; box-shadow:0 1px 3px rgba(0,0,0,.07); }

        /* ── Bands ── */
        .pd-bands > section:first-child { padding-top:28px; }
        .pd-band--light { background:#ffffff; }
        .pd-band--blue  { background:#1B4D3E; }

        /* ── Sec head ── */
        .sec-head { text-align:center; margin:0 0 20px; }
        .sec-title { margin:0; font-weight:1100; letter-spacing:.06em; text-transform:uppercase; font-size:1.55rem; color:rgba(11,18,32,.92); }
        @media (min-width:900px) { .sec-title { font-size:1.85rem; } }
        .sec-sub { margin-top:8px; color:rgba(11,18,32,.60); font-weight:850; font-size:.95rem; }

        /* ── Wave divider ── */
        .wave-divider { position:relative; width:100%; overflow:hidden; background:var(--wave-top-color); line-height:0; pointer-events:none; margin-top:-1px; margin-bottom:-1px; }
        .waves-anim { display:block; width:100%; height:auto; max-height:3rem; margin:0; }
        @media (min-width:1000px) { .waves-anim { max-height:6rem; } }
        .parallax1>use { animation:wMove1 10s linear infinite; animation-delay:-2s; }
        .parallax2>use { animation:wMove2  8s linear infinite; opacity:.4; animation-delay:-2s; }
        .parallax3>use { animation:wMove3  6s linear infinite; opacity:.3; animation-delay:-2s; }
        .parallax4>use { animation:wMove4  4s linear infinite; opacity:.2; animation-delay:-2s; }
        @keyframes wMove1 { 0%{transform:translate(85px,0)}  100%{transform:translate(-90px,0)} }
        @keyframes wMove2 { 0%{transform:translate(-90px,0)} 100%{transform:translate(85px,0)}  }
        @keyframes wMove3 { 0%{transform:translate(85px,0)}  100%{transform:translate(-90px,0)} }
        @keyframes wMove4 { 0%{transform:translate(-90px,0)} 100%{transform:translate(85px,0)}  }
        @media (prefers-reduced-motion:reduce) { .parallax1>use,.parallax2>use,.parallax3>use,.parallax4>use { animation:none !important; } }

        /* ── Mini reviews bar ── */
        .mrb { margin-top:14px; background:transparent; padding-bottom:28px; }
        .mrb-label { font-size:.70rem; font-weight:800; letter-spacing:.07em; text-transform:uppercase; color:rgba(11,18,32,.38); margin-bottom:8px; }
        .mrb-viewport { overflow:hidden; }
        .mrb-track { display:flex; width:100%; transition:transform .35s cubic-bezier(.4,0,.2,1); will-change:transform; }
        .mrb-slide { flex:0 0 100%; width:100%; }
        .mrb-card { background:#fff; border:1px solid rgba(2,8,23,.09); border-radius:14px; padding:12px 14px; box-shadow:0 2px 12px rgba(10,20,40,.07); display:flex; flex-direction:column; gap:8px; }
        .mrb-card-header { display:flex; align-items:center; gap:10px; }
        .mrb-card-avatar { width:34px; height:34px; border-radius:50%; color:#fff; font-weight:900; font-size:.95rem; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .mrb-card-meta { display:flex; flex-direction:column; gap:2px; min-width:0; }
        .mrb-card-name { font-size:.80rem; font-weight:800; color:rgba(11,18,32,.82); line-height:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .mrb-card-stars .stars-inline .s { font-size:11px; }
        .mrb-card-text { margin:0; font-size:.84rem; font-style:italic; color:rgba(11,18,32,.65); font-weight:500; line-height:1.5; }
        .mrb-dots { display:flex; justify-content:center; gap:5px; margin-top:10px; }
        .mrb-dot { width:5px; height:5px; border-radius:999px; border:none; background:rgba(2,8,23,.18); cursor:pointer; padding:0; transition:width .22s ease,background .18s ease; }
        .mrb-dot.on { background:rgba(27,77,62,.80); width:16px; }

        /* ── Stars ── */
        .stars-inline { display:inline-flex; gap:2px; justify-content:center; }
        .stars-inline .s { opacity:.25; font-size:14px; }
        .stars-inline .s.on { opacity:1; color:#D69E2E; }

        /* ── Before/After slider ── */
        .ba-wrap { display:flex; justify-content:center; padding:4px 0 8px; }
        .ba-container { position:relative; overflow:hidden; border-radius:16px; --position:50%; width:100%; max-width:680px; box-shadow:0 16px 48px rgba(0,0,0,.28); cursor:col-resize; }
        .ba-img-wrap { display:grid; position:relative; user-select:none; }
        .ba-img-after { display:block; width:100%; max-height:460px; object-fit:cover; object-position:center; grid-area:1/1; }
        .ba-img-before { display:block; position:absolute; inset:0; width:var(--position); height:100%; object-fit:cover; object-position:left center; grid-area:1/1; }
        .ba-badge { position:absolute; bottom:14px; background:rgba(255,255,255,.92); backdrop-filter:blur(6px); color:#0f172a; font-size:.78rem; font-weight:800; letter-spacing:.06em; text-transform:uppercase; padding:4px 10px; border-radius:999px; pointer-events:none; z-index:4; box-shadow:0 2px 8px rgba(0,0,0,.18); }
        .ba-badge-before { left:14px; }
        .ba-badge-after  { right:14px; }
        .ba-range { position:absolute; inset:0; width:100%; height:100%; opacity:0; cursor:pointer; z-index:10; margin:0; padding:0; -webkit-appearance:none; }
        .ba-line { position:absolute; inset:0; left:var(--position); transform:translateX(-50%); width:2px; height:100%; background:rgba(255,255,255,.9); pointer-events:none; z-index:5; }
        .ba-handle { position:absolute; top:50%; left:var(--position); transform:translate(-50%,-50%); width:40px; height:40px; background:rgba(255,255,255,.92); backdrop-filter:blur(4px); border-radius:999px; display:grid; place-items:center; pointer-events:none; z-index:6; box-shadow:0 2px 12px rgba(0,0,0,.30); color:#1e293b; }
        .dtx-ba-hint { text-align:center; margin-top:14px; font-size:.85rem; color:rgba(11,18,32,.45); font-weight:600; }
        @media (max-width:520px) { .ba-container{border-radius:12px;} .ba-img-after,.ba-img-before{max-height:280px;} }

        /* ── ¿Te sentís así? ── */
        .pd-feel-row { display:grid; grid-template-columns:1fr; gap:28px; align-items:stretch; }
        @media (min-width:900px) { .pd-feel-row { grid-template-columns:1fr 1fr; } }
        .pd-feel-img-col { position:relative; border-radius:20px; overflow:hidden; min-height:300px; background:rgba(255,255,255,.05); }
        .pd-feel-img { width:100%; height:100%; object-fit:cover; display:block; position:absolute; inset:0; }
        .pd-feel-cards-col { display:flex; flex-direction:column; gap:12px; }
        .pd-feel-title { font-size:1.85rem; font-weight:1000; color:rgba(255,255,255,.92); margin:0 0 8px; letter-spacing:-.02em; line-height:1.15; }
        @media (max-width:520px) { .pd-feel-title { font-size:1.5rem; } }
        .pd-feel-grid { display:flex; flex-direction:column; gap:10px; }
        .pd-feel-card { display:flex; align-items:flex-start; gap:10px; padding:12px 14px; border-radius:12px; border:1px solid rgba(255,255,255,.10); background:rgba(255,255,255,.05); }
        .pd-feel-check { font-size:1rem; flex-shrink:0; line-height:1.45; }
        .pd-feel-card-text { font-size:.88rem; font-weight:700; color:rgba(255,255,255,.85); line-height:1.45; }

        /* ── Cómo usarlo ── */
        .pd-howto-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:20px; margin-top:24px; }
        @media (min-width:900px) { .pd-howto-grid { grid-template-columns:repeat(4,1fr); gap:24px; } }
        .pd-howto-card { display:flex; flex-direction:column; align-items:center; gap:10px; text-align:center; }
        .pd-howto-img-wrap { width:100%; aspect-ratio:1/1; border-radius:16px; overflow:hidden; background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.10); }
        .pd-howto-img { width:100%; height:100%; object-fit:cover; display:block; }
        .pd-howto-num { width:40px; height:40px; border-radius:50%; border:2px solid rgba(255,255,255,.35); background:rgba(255,255,255,.08); display:flex; align-items:center; justify-content:center; font-size:1rem; font-weight:900; color:rgba(255,255,255,.90); flex-shrink:0; }
        .pd-howto-text { margin:0; font-size:.84rem; font-weight:700; color:rgba(255,255,255,.75); line-height:1.45; }

        /* ── Ingredientes ── */
        .pd-ing-grid { display:grid; grid-template-columns:1fr; gap:12px; margin-top:24px; }
        @media (min-width:640px) { .pd-ing-grid { grid-template-columns:repeat(2,1fr); gap:16px; } }
        .pd-ing-card { display:flex; align-items:center; gap:14px; padding:14px 16px; border-radius:14px; border:1px solid rgba(11,18,32,.09); background:#fff; box-shadow:0 2px 12px rgba(10,20,40,.06); }
        .pd-ing-text { flex:1; min-width:0; display:flex; flex-direction:column; gap:4px; }
        .pd-ing-name { font-size:.90rem; font-weight:900; color:rgba(11,18,32,.90); line-height:1.25; display:block; }
        .pd-ing-desc { margin:0; font-size:.79rem; color:rgba(11,18,32,.58); line-height:1.5; font-weight:500; }
        .pd-ing-img-wrap { width:72px; height:72px; flex-shrink:0; border-radius:10px; overflow:hidden; background:rgba(27,77,62,.06); border:1px solid rgba(27,77,62,.12); }
        .pd-ing-img { width:100%; height:100%; object-fit:cover; display:block; }

        /* ── VStrip ── */
        .vstrip-section { margin-bottom:0; }
        .vstrip-header { text-align:center; margin-bottom:16px; }
        .vstrip-kicker { display:inline-block; font-size:.68rem; font-weight:900; letter-spacing:.12em; text-transform:uppercase; color:#4ade80; background:rgba(74,222,128,.10); border:1px solid rgba(74,222,128,.20); padding:4px 12px; border-radius:999px; margin-bottom:10px; }
        .vstrip-title { font-size:1.18rem; font-weight:1000; letter-spacing:-.01em; margin:0 0 5px; line-height:1.25; }
        @media (min-width:900px) { .vstrip-title { font-size:1.38rem; } }
        .vstrip-sub { font-size:.88rem; font-weight:600; margin:0; }
        .vstrip-row { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; }
        .vstrip-item { display:flex; flex-direction:column; gap:7px; min-width:0; }
        .vstrip-media { aspect-ratio:9/16; border-radius:20px; overflow:hidden; background:rgba(11,18,32,.05); position:relative; }
        .vstrip-video { width:100%; height:100%; object-fit:cover; display:block; }
        .vstrip-label { text-align:center; font-size:.75rem; font-weight:800; color:rgba(255,255,255,.65); letter-spacing:.04em; text-transform:uppercase; }

        /* ── Reviews carousel ── */
        .rv-wrap { position:relative; margin-top:14px; }
        .rv-row { display:flex; gap:16px; overflow-x:auto; scroll-snap-type:x mandatory; padding:10px 6px 16px; -webkit-overflow-scrolling:touch; }
        .rv-slide { scroll-snap-align:center; flex:0 0 auto; width:min(520px,88vw); }
        .rv-card { background:#fff; border:1px solid rgba(2,8,23,.10); border-radius:22px; box-shadow:0 22px 70px rgba(10,20,40,.16); overflow:hidden; }
        .rv-imgBox { position:relative; width:100%; aspect-ratio:4/3; background:#f1f5f9; }
        .rv-quote { position:absolute; right:14px; bottom:14px; width:46px; height:46px; border-radius:999px; background:#E53E3E; color:#fff; display:grid; place-items:center; font-weight:1100; box-shadow:0 16px 40px rgba(229,62,62,.35); font-size:1.5rem; }
        .rv-body { padding:16px 16px 18px; display:flex; flex-direction:column; gap:8px; text-align:center; }
        .rv-title { font-weight:1100; text-transform:uppercase; letter-spacing:.05em; color:rgba(11,18,32,.92); font-size:.88rem; }
        .rv-text { margin:0; color:rgba(11,18,32,.70); line-height:1.6; font-weight:650; font-size:.88rem; }
        .rv-name { margin-top:4px; font-weight:900; color:rgba(11,18,32,.62); font-size:.85rem; }
        .rv-nav { position:absolute; top:50%; transform:translateY(-50%); width:44px; height:44px; border-radius:999px; border:1px solid rgba(2,8,23,.10); background:rgba(255,255,255,.95); box-shadow:0 18px 55px rgba(10,20,40,.18); cursor:pointer; display:grid; place-items:center; font-size:24px; z-index:10; }
        .rv-prev { left:-8px; } .rv-next { right:-8px; }
        @media (max-width:560px) { .rv-nav { display:none; } }
        .rv-dots { display:flex; justify-content:center; gap:8px; margin-top:10px; }
        .rv-dot { width:8px; height:8px; border-radius:999px; border:none; background:rgba(2,8,23,.18); cursor:pointer; transition:transform .18s ease,background .18s ease; padding:0; }
        .rv-dot.on { background:rgba(27,77,62,.95); transform:scale(1.25); }

        /* ── Guarantee medal ── */
        .grt-section { text-align:center; padding:56px 20px 52px; display:flex; flex-direction:column; align-items:center; }
        .grt-medal {
          width:180px; height:180px; border-radius:50%; display:flex; align-items:center; justify-content:center; margin-bottom:28px; flex-shrink:0;
          filter:drop-shadow(0 12px 32px rgba(218,165,32,.60)); animation:grtShine 3.5s ease-in-out infinite;
          background:
            radial-gradient(circle at 38% 32%,rgba(255,245,120,.55) 0%,transparent 38%),
            conic-gradient(#9A6B00 0deg,#FFD700 8deg,#DAA520 16deg,#FFD700 24deg,#9A6B00 32deg,#FFD700 40deg,#DAA520 48deg,#FFD700 56deg,#9A6B00 64deg,#FFD700 72deg,#DAA520 80deg,#FFD700 88deg,#9A6B00 96deg,#FFD700 104deg,#DAA520 112deg,#FFD700 120deg,#9A6B00 128deg,#FFD700 136deg,#DAA520 144deg,#FFD700 152deg,#9A6B00 160deg,#FFD700 168deg,#DAA520 176deg,#FFD700 184deg,#9A6B00 192deg,#FFD700 200deg,#DAA520 208deg,#FFD700 216deg,#9A6B00 224deg,#FFD700 232deg,#DAA520 240deg,#FFD700 248deg,#9A6B00 256deg,#FFD700 264deg,#DAA520 272deg,#FFD700 280deg,#9A6B00 288deg,#FFD700 296deg,#DAA520 304deg,#FFD700 312deg,#9A6B00 320deg,#FFD700 328deg,#DAA520 336deg,#FFD700 344deg,#9A6B00 352deg,#FFD700 360deg);
          clip-path:polygon(50% 0%,55% 4%,62% 2%,65% 7%,72% 6%,74% 12%,81% 12%,82% 18%,89% 20%,88% 27%,95% 30%,92% 37%,99% 41%,95% 48%,100% 53%,95% 59%,99% 65%,93% 70%,96% 77%,89% 80%,90% 87%,83% 89%,82% 96%,74% 96%,71% 100%,64% 97%,59% 100%,53% 97%,47% 100%,41% 97%,36% 100%,29% 97%,26% 96%,18% 96%,17% 89%,10% 87%,11% 80%,4% 77%,7% 70%,1% 65%,5% 59%,0% 53%,5% 48%,1% 41%,8% 37%,5% 30%,12% 27%,11% 20%,18% 18%,19% 12%,26% 12%,28% 6%,35% 7%,38% 2%,45% 4%);
        }
        @keyframes grtShine { 0%,100%{filter:drop-shadow(0 10px 28px rgba(218,165,32,.55));} 50%{filter:drop-shadow(0 14px 44px rgba(255,215,0,.85));} }
        @media (prefers-reduced-motion:reduce) { .grt-medal{animation:none;} }
        .grt-medal-face { width:136px; height:136px; border-radius:50%; background:linear-gradient(160deg,#1c1a0e 0%,#0b172a 55%,#060d1a 100%); border:2px solid rgba(255,215,0,.22); box-shadow:inset 0 3px 10px rgba(0,0,0,.50),inset 0 -1px 4px rgba(255,215,0,.10); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:0; }
        .grt-medal-sup { font-size:.50rem; font-weight:900; letter-spacing:.16em; text-transform:uppercase; color:#FFD700; line-height:1.2; }
        .grt-medal-num { font-size:3.6rem; font-weight:1100; line-height:.95; color:#FFD700; letter-spacing:-.06em; text-shadow:0 2px 14px rgba(255,215,0,.50); }
        .grt-medal-bot { font-size:.65rem; font-weight:900; letter-spacing:.22em; text-transform:uppercase; color:rgba(255,215,0,.75); line-height:1.2; }
        .grt-title { margin:0 0 14px; font-weight:1100; letter-spacing:.03em; text-transform:uppercase; font-size:2.1rem; line-height:1.05; color:#fff; }
        @media (max-width:520px) { .grt-title{font-size:1.6rem;} .grt-medal{width:148px;height:148px;} .grt-medal-face{width:112px;height:112px;} .grt-medal-num{font-size:2.9rem;} }
        .grt-sub { margin:0 auto 28px; max-width:420px; font-weight:700; font-size:1rem; color:rgba(255,255,255,.65); line-height:1.70; }
        .grt-pills { display:flex; flex-wrap:wrap; gap:10px; justify-content:center; margin-bottom:32px; }
        .grt-pill { padding:9px 16px; border-radius:999px; border:1px solid rgba(255,255,255,.10); background:rgba(255,255,255,.05); font-weight:800; font-size:.83rem; color:rgba(255,255,255,.78); white-space:nowrap; }
        .grt-cta { display:inline-block; padding:16px 42px; border:none; border-radius:14px; background:linear-gradient(135deg,#B8860B 0%,#DAA520 40%,#FFD700 100%); color:#0b172a; font-weight:1100; font-size:1rem; letter-spacing:.04em; cursor:pointer; font-family:inherit; box-shadow:0 14px 42px rgba(218,165,32,.40); transition:transform .15s ease,box-shadow .15s ease; }
        .grt-cta:hover { transform:translateY(-2px); box-shadow:0 20px 52px rgba(255,215,0,.55); }
        .grt-cta:active { transform:scale(.98); }
        @media (max-width:520px) { .grt-section{padding:44px 16px 40px;} .grt-pill{font-size:.79rem;padding:8px 12px;} .grt-cta{width:100%;padding:16px;} }

        /* ── FAQ ── */
        .faq-acc-wrap { width:100%; max-width:760px; margin:0 auto; padding:24px 0 8px; }
        .faq-acc-title { font-size:1.55rem; font-weight:900; color:rgba(11,18,32,.90); text-align:center; margin:0 0 24px; letter-spacing:-.02em; line-height:1.2; }
        @media (max-width:520px) { .faq-acc-title{font-size:1.25rem;} }
        .faq-acc { width:100%; border-radius:5px; }
        .faq-acc-item { border-bottom:1px solid #ccc; margin-bottom:3px; }
        .faq-acc-item:last-child { border-bottom:none; }
        .faq-acc-header { padding:14px 8px; cursor:pointer; font-weight:700; font-size:14px; display:flex; justify-content:space-between; align-items:center; color:rgba(11,18,32,.88); user-select:none; line-height:1.4; transition:color .2s ease; }
        .faq-acc-header:hover { color:#1B4D3E; }
        .faq-acc-item.active .faq-acc-header { color:#1B4D3E; }
        .faq-acc-indicator { font-size:1.4em; margin-left:12px; flex-shrink:0; color:#1B4D3E; font-weight:400; line-height:1; transition:transform .3s ease; display:inline-block; }
        .faq-acc-item.active .faq-acc-indicator { transform:rotate(180deg); }
        .faq-acc-content { max-height:0; overflow:hidden; padding:0 10px; transition:max-height .35s ease,padding .3s ease; }
        .faq-acc-content p { margin:6px 0 14px; font-size:13.5px; color:rgba(11,18,32,.62); line-height:1.6; }
        .faq-acc-item.active .faq-acc-content { max-height:300px; padding:4px 10px 4px; }

        /* ── Sticky bar — píldora flotante centrada ── */
        .pd-sticky-bar { position:fixed; left:50%; bottom:18px; width:min(calc(100% - 24px),560px); transform:translateX(-50%); z-index:9999; display:flex; align-items:center; gap:12px; background:rgba(255,255,255,.97); backdrop-filter:blur(14px); border:1px solid rgba(11,18,32,.10); border-radius:999px; padding:9px 10px 9px 20px; box-shadow:0 22px 54px rgba(2,8,23,.22); overflow:hidden; }
        .pd-sticky-info { flex:1; min-width:0; display:flex; flex-direction:column; gap:0; }
        .pd-sticky-prices { display:flex; flex-direction:column; gap:0; }
        .pd-sticky-old { color:rgba(11,18,32,.38); font-weight:700; text-decoration:line-through; font-size:.65rem; white-space:nowrap; line-height:1.3; }
        .pd-sticky-now { font-weight:900; color:rgba(11,18,32,.92); font-size:.92rem; white-space:nowrap; line-height:1.25; }
        .pd-sticky-qty { font-size:.58rem; font-weight:600; color:#1B4D3E; white-space:nowrap; line-height:1.3; }
        .pd-sticky-btn { flex-shrink:0; border:none; background:linear-gradient(135deg,#1B4D3E 0%,#153D31 60%,#0F2D24 100%); color:#fff; font-weight:900; font-size:.80rem; border-radius:999px; padding:11px 18px; cursor:pointer; box-shadow:0 6px 20px rgba(27,77,62,.28); letter-spacing:.04em; text-transform:uppercase; transition:transform .12s ease,box-shadow .12s ease; white-space:nowrap; }
        .pd-sticky-btn:active { transform:scale(.98); box-shadow:0 4px 14px rgba(27,77,62,.22); }
        @media (max-width:380px) { .pd-sticky-bar{padding:8px 8px 8px 16px;gap:8px;} .pd-sticky-now{font-size:.82rem;} .pd-sticky-btn{font-size:.72rem;padding:9px 12px;} }

        /* ── WhatsApp tab ── */
        .wa-tab { position:fixed; right:16px; bottom:82px; z-index:9998; display:flex; align-items:center; gap:8px; background:#25D366; border-radius:999px; padding:10px; text-decoration:none; box-shadow:0 6px 20px rgba(37,211,102,.38); transition:padding .22s ease,box-shadow .18s ease; }
        .wa-tab--open { padding:10px 16px 10px 10px; }
        .wa-tab-icon { display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .wa-tab-label { font-size:.82rem; font-weight:800; color:#fff; white-space:nowrap; }

      `}</style>
    </div>
  );
}
