import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import { useCart } from "../context/CartContext.jsx";
import { track } from "../lib/metaPixel";


/* ========================================================================
   CONFIGURACIÓN DE MARKETING
   ======================================================================== */
const MARKETING_CONTENT = {
  miniDescription: "Disfrutá de sonido Hi-Fi envolvente, cancelación de ruido y un diseño ergonómico pensado para acompañarte todo el día.",
  slider: {
    title: "Redescubrí tu música con calidad premium",
    text: "Notarás la diferencia al instante. Dejás atrás el sonido plano y metálico de los genéricos para pasar a graves profundos y voces claras.",
    labelBefore: "Estándar / Genérico",
    labelAfter: "Experiencia BoomHausS",
    imgBefore: "https://images.pexels.com/photos/3945667/pexels-photo-3945667.jpeg?auto=compress&cs=tinysrgb&w=800",
    imgAfter: "https://images.pexels.com/photos/3780681/pexels-photo-3780681.jpeg?auto=compress&cs=tinysrgb&w=800"
  },
  comparison: {
    title: "Elegí calidad y respaldo",
    text: "BoomHausS combina tecnología de audio avanzada con materiales duraderos. No pagues de más por una marca, pagá por el producto.",
    brandName: "BoomHausS",
    competitorName: "Otros Genéricos",
    features: [
      { name: "Sonido de Alta Fidelidad (Hi-Fi)", us: true, others: false },
      { name: "Cancelación de Ruido (ANC)", us: true, others: false },
      { name: "Batería de +24hs totales", us: true, others: false },
      { name: "Sujeción firme y cómoda", us: true, others: false },
      { name: "Garantía escrita de 30 días", us: true, others: false },
    ]
  },
  problemSolution: {
    title: "¿Cansado de auriculares que fallan al poco tiempo?",
    text: "Es común encontrar opciones que prometen mucho y duran poco. Nosotros priorizamos la durabilidad y la fidelidad de sonido para que tu inversión valga la pena.",
    bullets: [
      "✅ Construcción sólida y materiales de calidad.",
      "✅ Conexión inmediata y estable.",
      "✅ Resistentes al uso diario e intensivo."
    ],
    media: "https://images.pexels.com/photos/3780681/pexels-photo-3780681.jpeg?auto=compress&cs=tinysrgb&w=800"
  },
  bigMedia: {
    title: "Diseño sofisticado, rendimiento potente",
    src: "https://res.cloudinary.com/duyth9azk/video/upload/v1767851440/Agent_video_Pippit_20260108054656_skdj2p.mp4",
    isVideo: true
  },
  authority: {
    title: "Calidad probada y recomendada",
    quote: "En este segmento, es la mejor relación precio-calidad del mercado local. El equilibrio de frecuencias es notable y la construcción se siente muy sólida.",
    name: "Martín L.",
    job: "Productor Musical & Audio",
    img: "https://pbs.twimg.com/media/G-HOmkUWIAE-T0J?format=jpg&name=small"
  },
  steps: {
    title: "Conectalos en segundos",
    items: [
      "Abrí el estuche para activar el emparejamiento.",
      "Seleccionalos desde el Bluetooth de tu celular.",
      "¡Listo! Disfrutá de tu música sin interrupciones."
    ]
  },
  faq: [
    { q: "¿Tienen garantía?", a: "Sí, comprá con confianza. Ofrecemos 30 días de garantía por cualquier falla de fábrica. Si tenés un problema, te lo solucionamos." },
    { q: "¿Son compatibles con iPhone y Android?", a: "Totalmente. Funcionan perfecto con cualquier dispositivo que tenga Bluetooth (Celulares, Tablets, PC)." },
    { q: "¿Realizan envíos al interior?", a: "Sí, llegamos a cualquier punto del país. Una vez despachado, te enviamos el código de seguimiento para que sepas dónde está tu pedido." },
    { q: "¿Cuánto dura la batería?", a: "Tienen una autonomía de 5-6 horas continuas, y el estuche te brinda cargas extra para llegar a más de 24 horas de uso total." },
  ]
};

/* =========================
   COMPONENTES UI
========================= */

// NUEVO: NAVBAR MÓVIL ESTILO AQUALYS
// NUEVO: NAVBAR MÓVIL (CORREGIDO)
function MobileNavbar() {
  const context = useCart();
  // PROTECCIÓN: Si el contexto o el carrito son undefined, usamos un array vacío []
  const cart = context?.cart || [];

  // Ahora es seguro usar reduce porque cart siempre será al menos un array vacío
  const cartCount = cart.reduce((acc, item) => acc + (item.quantity || 1), 0);

  return (
    <nav className="mobile-nav">
      <div className="mn-left">
        {/* Aquí podrías poner una función para abrir un menú lateral si tuvieras */}
        <button className="mn-btn" type="button">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
      </div>
      <div className="mn-center">
        <span className="mn-brand">BoomHausS</span>
      </div>
      <div className="mn-right">
        {/* Botón Mis Pedidos / Usuario */}
        <Link to="/orders" className="mn-btn">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
        </Link>
        {/* Botón Carrito */}
        <Link to="/cart" className="mn-btn mn-cart-btn">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
          {cartCount > 0 && <span className="mn-badge">{cartCount}</span>}
        </Link>
      </div>
    </nav>
  );
}

function BeforeAfterSlider() {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef(null);
  const { slider } = MARKETING_CONTENT;
  const handleMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX : e.clientX;
    const pos = ((x - rect.left) / rect.width) * 100;
    setSliderPos(Math.min(100, Math.max(0, pos)));
  };
  return (
    <div className="landing-section">
      <div className="landing-container split-layout reverse-mobile">
        <div className="split-text"><h3 className="landing-title">{slider.title}</h3><p className="landing-p">{slider.text}</p></div>
        <div className="split-media">
          <div className="ba-slider-container" ref={containerRef} onMouseMove={handleMove} onTouchMove={handleMove}>
            <img src={slider.imgAfter} alt="Despues" className="ba-img" />
            <div className="ba-label ba-after">{slider.labelAfter}</div>
            <div className="ba-overlay" style={{ width: `${sliderPos}%` }}>
              <img src={slider.imgBefore} alt="Antes" className="ba-img" style={{ filter: "grayscale(50%) contrast(0.8)" }} />
              <div className="ba-label ba-before">{slider.labelBefore}</div>
            </div>
            <div className="ba-handle" style={{ left: `${sliderPos}%` }}><div className="ba-line"></div><div className="ba-circle">◄ ►</div></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ComparisonTable() {
  const { comparison } = MARKETING_CONTENT;
  return (
    <div className="landing-section">
      <div className="landing-container split-layout">
        <div className="split-text"><h3 className="landing-title">{comparison.title}</h3><p className="landing-p">{comparison.text}</p></div>
        <div className="split-media">
          <div className="comp-table">
            <div className="comp-header"><div className="comp-col-empty"></div><div className="comp-col-us">{comparison.brandName}</div><div className="comp-col-others">{comparison.competitorName}</div></div>
            {comparison.features.map((f, i) => (
              <div key={i} className="comp-row"><div className="comp-feature-name">{f.name}</div><div className="comp-check-us">{f.us ? <span className="check-icon">✔</span> : <span>✘</span>}</div><div className="comp-check-others">{f.others ? <span className="check-icon">✔</span> : <span className="cross-icon">✕</span>}</div></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function BigMediaSection() {
  const { bigMedia } = MARKETING_CONTENT;
  return (
    <div className="landing-section full-width-bg">
      <div className="landing-container text-center">
        <h3 className="landing-center-title" style={{ color: 'white', marginBottom: '1rem' }}>{bigMedia.title}</h3>
        <div className="video-placeholder-container">
          {bigMedia.isVideo ? (<video
            src={bigMedia.src}
            autoPlay
            loop
            muted  // <--- ESTO ES CLAVE
            playsInline // <--- NECESARIO PARA IPHONE
            className="landing-video-real"
          />) : (<><div className="video-overlay"><span className="play-button">▶</span></div><img src={bigMedia.src} alt="Demo" className="landing-video-cover" /></>)}
        </div>
      </div>
    </div>
  );
}

function ProblemSolutionSection() {
  const { problemSolution } = MARKETING_CONTENT;
  return (
    <div className="landing-section">
      <div className="landing-container split-layout reverse-mobile">
        <div className="split-text"><h3 className="landing-title">{problemSolution.title}</h3><p className="landing-p">{problemSolution.text}</p><ul className="landing-list">{problemSolution.bullets.map((b, i) => <li key={i}>{b}</li>)}</ul></div>
        <div className="split-media"><img src={problemSolution.media} alt="Solución" className="landing-img-rounded" /></div>
      </div>
    </div>
  );
}

function AuthoritySection() {
  const { authority } = MARKETING_CONTENT;
  return (
    <div className="landing-section authority-bg">
      <div className="landing-container authority-flex">
        <div className="authority-img-box"><img src={authority.img} alt="Experto" className="authority-img-fixed" /></div>
        <div className="authority-text"><h3 className="landing-title" style={{ fontSize: "1.4rem" }}>{authority.title}</h3><p className="landing-p" style={{ marginBottom: "0.5rem" }}>"{authority.quote}"</p><div className="authority-sign"><strong>{authority.name}</strong><span>{authority.job}</span></div></div>
      </div>
    </div>
  );
}

function HowToUseSection() {
  const { steps } = MARKETING_CONTENT;
  return (
    <div className="landing-section">
      <h3 className="landing-center-title">{steps.title}</h3>
      <div className="landing-container steps-grid-fixed">{steps.items.map((step, i) => (<div key={i} className="step-item"><div className="step-num">{i + 1}</div><p style={{ margin: 0 }}>{step}</p></div>))}</div>
    </div>
  );
}

function FaqSection() {
  const [openIndex, setOpenIndex] = useState(null);
  const { faq } = MARKETING_CONTENT;
  const toggle = (i) => setOpenIndex(openIndex === i ? null : i);
  return (
    <div className="landing-section">
      <h3 className="landing-center-title">Preguntas Frecuentes</h3>
      <div className="landing-container faq-container">{faq.map((item, i) => (<div key={i} className="faq-item"><button className={`faq-question ${openIndex === i ? "active" : ""}`} onClick={() => toggle(i)}>{item.q}<span className="faq-icon">{openIndex === i ? "−" : "+"}</span></button><div className="faq-answer" style={{ maxHeight: openIndex === i ? "200px" : "0" }}><p>{item.a}</p></div></div>))}</div>
    </div>
  );
}

function TestimonialsSection() {
  const reviews = [
    { title: "El sonido es increíble", author: "Sofía G. · CABA", text: "Me sorprendió la calidad de los graves. Se escuchan súper nítidos.", image: "https://pbs.twimg.com/media/G-Hf4tiXwAA2fdM?format=jpg&name=small" },
    { title: "Muy cómodos", author: "Nicolás R. · Zona Norte", text: "Los uso para entrenar y no se caen para nada. La batería dura un montón.", image: "https://pbs.twimg.com/media/G-HgooxWgAAaixg?format=jpg&name=small" },
    { title: "Compra sin vueltas", author: "Camila P. · La Plata", text: "Hice la transferencia y llegaron al día siguiente. La presentación es excelente.", image: "https://pbs.twimg.com/media/G-Hf0gJW0AAYBFx?format=jpg&name=small" },
    { title: "Me encanta", author: "Martina L. · Córdoba", text: "Al principio dudaba, pero cuando los probé me quedé loca. Un viaje de ida." },
    { title: "Llegó impecable", author: "Lucas M. · Mendoza", text: "El envío fue rápido y el paquete llegó súper protegido." },
    { title: "Excelente servicio", author: "Valentina S. · Rosario", text: "Tuve una duda y me ayudaron por WhatsApp al toque. Un 10." }
  ];
  return (
    <div className="landing-section" style={{ background: "transparent", padding: "20px 0" }}>
      <div className="landing-container">
        <div style={{ marginBottom: "25px", textAlign: "center" }}><span className="tm-badge">Opiniones</span><h3 className="tm-main-title">Lo que dicen nuestros clientes</h3><p className="tm-subtitle">Testimonios reales de compras verificadas.</p></div>
        <div className="reviews-grid">{reviews.map((r, i) => (<div key={i} className="tm-card"><div className="tm-card-top"><span className="tm-card-title">{r.title}</span><span className="tm-stars">★★★★★</span></div><div className="tm-author">{r.author}</div><p className="tm-text">“{r.text}”</p>{r.image && (<div className="tm-review-img-box"><img src={r.image} alt="Review" className="tm-review-img" loading="lazy" /></div>)}<div className="tm-tags"><div className="tm-tag">Verificado</div><div className="tm-tag">Entrega OK</div></div></div>))}</div>
      </div>
    </div>
  );
}

/* =========================
   HELPERS & MAIN
========================= */
function formatARS(n) { try { return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n); } catch { return `$${n}`; } }
function calcDiscountPercent(price, compareAt) { const p = Number(price); const c = Number(compareAt); if (!Number.isFinite(p) || !Number.isFinite(c) || c <= p || c <= 0) return null; return Math.round(((c - p) / c) * 100); }
function Stars({ value = 4.8 }) { const v = Number(value); const full = Math.round(Number.isFinite(v) ? v : 4.8); const stars = Array.from({ length: 5 }, (_, i) => i < full); return (<div className="hero-stars">{stars.map((on, i) => (<span key={i} className={`hero-star ${on ? "on" : ""}`}>★</span>))} <span className="hero-ratingText">{Number.isFinite(v) ? v.toFixed(1) : "4.8"}</span></div>); }
function moneyARS(n) { const num = Number(n); if (Number.isNaN(num)) return "$0"; return `$${Math.round(num).toLocaleString("es-AR")}`; }
function clampInt(v, min, max) { const n = Number(v); if (!Number.isFinite(n)) return min; return Math.min(max, Math.max(min, Math.round(n))); }

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const storeName = import.meta.env.VITE_STORE_NAME || "Encontratodo";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [product, setProduct] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [qty, setQty] = useState(1);
  const [bundle, setBundle] = useState(1);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const minSwipeDistance = 40;
  const lastViewedRef = useRef(null);

  useEffect(() => {
    async function fetchOne() {
      try { setLoading(true); const res = await api.get(`/products/${id}`); if (res.data?.ok) setProduct(res.data.data); else setError("No se pudo cargar."); } catch (e) { setError("Error al cargar."); } finally { setLoading(false); }
    }
    fetchOne();
  }, [id]);

  const images = useMemo(() => { if (!product) return []; const arr = []; if (product.imageUrl) arr.push(product.imageUrl); if (Array.isArray(product.images)) product.images.forEach((x) => { if (x && typeof x === "string" && !arr.includes(x)) arr.push(x); }); return arr; }, [product]);
  const nextImage = () => { if (images.length > 0) setActiveImgIndex((prev) => (prev + 1) % images.length); };
  const prevImage = () => { if (images.length > 0) setActiveImgIndex((prev) => (prev - 1 + images.length) % images.length); };
  const onTouchStart = (e) => { setTouchEnd(null); setTouchStart(e.targetTouches[0].clientX); };
  const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);
  const onTouchEnd = () => { if (!touchStart || !touchEnd) return; const distance = touchStart - touchEnd; if (distance > minSwipeDistance) nextImage(); if (distance < -minSwipeDistance) prevImage(); };
  const onMouseDown = (e) => setTouchStart(e.clientX);
  const onMouseUp = (e) => { if (!touchStart) return; const distance = touchStart - e.clientX; if (distance > minSwipeDistance) nextImage(); if (distance < -minSwipeDistance) prevImage(); setTouchStart(null); };

  const price = Number(product?.price) || 0;
  const compareAt = Number(product?.compareAtPrice) || (price ? Math.round(price * 2) : 0);
  const discountPct = calcDiscountPercent(price, compareAt) || 0;
  const soldCount = product?.soldCount ?? product?.socialProofCount ?? 4766;
  const rating = product?.rating ?? 4.8;
  const reviewCount = product?.reviewCount ?? 1168;
  const dbBullets = Array.isArray(product?.highlights) && product.highlights.length ? product.highlights : [product?.bullet1, product?.bullet2, product?.bullet3].filter(Boolean);
  const defaultBullets = ["Excelente Calidad Garantizada", "Compra Protegida 100%", "Envío Rápido y Seguro"];
  const bullets = dbBullets.length > 0 ? dbBullets : defaultBullets;

  const pack2Discount = 18;
  const unitPrice = price;
  const totalQty = qty;
  const promoOn = bundle === 2;
  const pairsQty = promoOn ? Math.floor(totalQty / 2) * 2 : 0;
  const remQty = totalQty - pairsQty;
  const displayTotal = promoOn ? Math.round(pairsQty * unitPrice * (1 - pack2Discount / 100) + remQty * unitPrice) : Math.round(totalQty * unitPrice);

  const contentId = useMemo(() => product?.sku || product?.productId || product?._id || (product?.id ? String(product.id) : null) || id || "SPEAKER_1", [product, id]);

  useEffect(() => { if (!product) return; if (lastViewedRef.current === contentId) return; lastViewedRef.current = contentId; track("ViewContent", { content_ids: [String(contentId)], content_type: "product", value: Number(price) || 0, currency: "ARS" }); }, [product, contentId, price]);

  const handleAddToCart = () => { if (!product) return; track("AddToCart", { content_ids: [String(contentId)], content_type: "product", value: Number(displayTotal) || 0, currency: "ARS", num_items: Number(totalQty) || 1 }); const promo = promoOn ? { type: "bundle2", discountPct: pack2Discount } : null; addItem(product, totalQty, promo ? { promo } : undefined); setShowToast(true); setTimeout(() => setShowToast(false), 5000); window.dispatchEvent(new CustomEvent("cart:added", { detail: { name: product?.name || "Producto" } })); };
  const handleBuyNow = () => { if (!product) return; track("InitiateCheckout", { content_ids: [String(contentId)], content_type: "product", value: Number(displayTotal) || 0, currency: "ARS", num_items: Number(totalQty) || 1 }); const promo = promoOn ? { type: "bundle2", discountPct: pack2Discount } : null; addItem(product, totalQty, promo ? { promo } : undefined); navigate("/checkout"); };

  const arrowStyle = { position: "absolute", top: "50%", transform: "translateY(-50%)", width: "36px", height: "36px", borderRadius: "50%", background: "rgba(255,255,255,0.9)", border: "1px solid rgba(0,0,0,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", cursor: "pointer", zIndex: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.15)" };

  if (loading) return (<main className="section"><div className="container"><div className="pd-skeleton card"><div className="pd-skel-left" /><div className="pd-skel-right" /></div></div></main>);
  if (error || !product) return (<main className="section"><div className="container"><div className="card" style={{ padding: "1.1rem" }}><div className="pd-badge">Error</div><p className="pd-error" style={{ marginTop: "0.75rem" }}>{error || "Producto no encontrado."}</p><div style={{ marginTop: "0.9rem" }}><Link className="btn btn-ghost" to="/products">← Volver</Link></div></div></div></main>);

  return (
    <main className="section main-wrapper">


      <div className="container" style={{ marginTop: "10px" }}>
        <div className="pd-grid" style={{ alignItems: "stretch" }}>
          <section className="pd-media card" style={{ padding: 0, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
            <div className="pd-mediaMain" style={{ flex: 1, position: "relative", width: "100%", overflow: "hidden", background: "#f8fbff", cursor: "grab", touchAction: "pan-y" }} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} onMouseDown={onMouseDown} onMouseUp={onMouseUp} onMouseLeave={() => setTouchStart(null)}>
              <div className="pd-discount" style={{ zIndex: 10 }}>{discountPct ? `${discountPct}%` : "OFERTA"} <span>OFF</span></div>
              {images.length > 0 ? (<><img className="pd-mainImg" src={images[activeImgIndex]} alt={product.name} loading="lazy" onDragStart={(e) => e.preventDefault()} style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0, pointerEvents: "none" }} />{images.length > 1 && (<><button type="button" style={{ ...arrowStyle, left: "10px" }} onClick={(e) => { e.stopPropagation(); prevImage(); }}>‹</button><button type="button" style={{ ...arrowStyle, right: "10px" }} onClick={(e) => { e.stopPropagation(); nextImage(); }}>›</button><div style={{ position: "absolute", bottom: "10px", right: "10px", background: "rgba(0,0,0,0.6)", color: "white", padding: "4px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: "bold", pointerEvents: "none" }}>{activeImgIndex + 1}/{images.length}</div></>)}</>) : (<div className="pd-empty" style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>Sin imagen</div>)}
            </div>
            {images.length > 1 && (<div className="pd-thumbs" style={{ padding: "10px", background: "#fff", borderTop: "1px solid #eee" }}>{images.slice(0, 8).map((img, idx) => (<button key={img} type="button" className={`pd-thumb ${idx === activeImgIndex ? "is-active" : ""}`} onClick={() => setActiveImgIndex(idx)} style={{ minWidth: "60px", height: "60px" }}><img src={img} alt="thumb" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></button>))}</div>)}
          </section>

          <aside className="pd-info">
            <div className="hero-top">
              <div className="hero-proof" style={{ marginBottom: "10px" }}><div className="hero-avatars" aria-hidden="true"><span className="av"></span><span className="av"></span><span className="av"></span></div><div className="hero-proofText"><b>{Number(soldCount).toLocaleString("es-AR")}</b> personas compraron</div></div>
              <h1 className="hero-title">{product.name}</h1>
              <p className="hero-mini-desc">{MARKETING_CONTENT.miniDescription}</p>
              <div className="hero-ratingRow"><Stars value={rating} /> <span className="hero-reviews">({Number(reviewCount).toLocaleString("es-AR")} reseñas)</span></div>
              <div className="hero-priceRow"><span className="hero-price">{formatARS(price || 0)}</span>{compareAt > price && (<><span className="hero-compare">{formatARS(compareAt)}</span><span className="hero-pill">{discountPct}% OFF</span></>)}</div>
              <div className="pd-ticks-container">{bullets.slice(0, 3).map((b, idx) => (<div key={idx} className="pd-tick-row"><div className="pd-tick-icon"><svg width="12" height="10" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 5L4.14286 8.14286L11 1.28571" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></div><span className="pd-tick-text">{b}</span></div>))}</div>
              <div className="pd-trust"><div className="pd-trustItem"><div className="pd-ico">❤</div><div>Pago 100%<br />protegido</div></div><div className="pd-trustItem"><div className="pd-ico">↩</div><div>Devolución sin<br />vueltas</div></div><div className="pd-trustItem"><div className="pd-ico">🚚</div><div>Envío gratis a<br />todo el país</div></div></div>
            </div>
            <div className="pd-divider">Compra en combo y ahorrá 🔥</div>
            <div className="pd-bundles">
              <label className={`pd-bundle ${bundle === 1 ? "is-selected" : ""}`}><input type="radio" name="bundle" checked={bundle === 1} onChange={() => setBundle(1)} /><div className="pd-bundleBody"><div className="pd-bundleLeft"><div className="pd-bundleTitle">Lleva 1 <span className="pd-miniTag">Envío gratis</span></div><div className="pd-bundleSub">Precio normal</div></div><div className="pd-bundleRight">{moneyARS(unitPrice)}</div></div></label>
              <label className={`pd-bundle ${bundle === 2 ? "is-selected" : ""}`}><input type="radio" name="bundle" checked={bundle === 2} onChange={() => { setBundle(2); setQty((q) => (q < 2 ? 2 : q)); }} /><div className="pd-bundleBody"><div className="pd-bundleLeft"><div className="pd-bundleTitle">Lleva 2 <span className="pd-miniTag">Envío gratis</span></div><div className="pd-bundleSub"><b>ahorra</b> {pack2Discount}% mas!!</div></div><div className="pd-bundleRight">{moneyARS(Math.round(unitPrice * 2 * (1 - pack2Discount / 100)))}<div className="pd-bundleCompare">{moneyARS(unitPrice * 2)}</div></div></div><div className="pd-popular">Más popular</div></label>
            </div>
            <div className="pd-qtyRow"><div className="pd-qtyLabel">Cantidad</div><div className="pd-qty"><button type="button" className="pd-qtyBtn" onClick={() => setQty((q) => clampInt(q - 1, 1, 20))}>−</button><div className="pd-qtyVal">{qty}</div><button type="button" className="pd-qtyBtn" onClick={() => setQty((q) => clampInt(q + 1, 1, 20))}>+</button></div><div className="pd-qtyHint">Total: {totalQty} u.</div></div>
            <div className="scarcity-text"><span className="scarcity-icon">🔥</span> ¡ATENCIÓN! Quedan las últimas 3 unidades</div>
            <button className="pd-ctaPrimary" type="button" onClick={handleAddToCart}>AGREGAR AL CARRITO <span className="pd-ctaSub">Total: {moneyARS(displayTotal)}</span></button>
            <button className="pd-ctaSecondary btn-breathing" type="button" onClick={handleBuyNow}>COMPRAR AHORA</button>
            <a className="pd-detailsLink" href="#details" onClick={(e) => { e.preventDefault(); document.getElementById("details")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>Ver todos los detalles →</a>
            <div className="pd-miniNav"><Link className="btn btn-ghost" to="/cart">Carrito</Link><Link className="btn btn-ghost" to="/checkout">Checkout</Link><Link className="btn btn-ghost" to="/products">Tienda</Link></div>
          </aside>
        </div>

        <section id="details" className="pd-details card" style={{ marginTop: "1.1rem" }}>
          <div className="pd-detailsHead"><div className="pd-badge">Detalles</div><div className="pd-detailsTitle">Todo lo que incluye tu compra</div></div>
          <div className="pd-detailsGrid"><div className="pd-detailBlock">
            <div className="pd-detailT">Descripción</div>
            <div className="pd-detailP" style={{ position: 'relative' }}>

              {isDescExpanded
                ? (product.description || `Producto premium de ${storeName}.`)
                : (product.description || `Producto premium de ${storeName}.`).slice(0, 150) + (product.description?.length > 150 ? '...' : '')}

              {/* Solo mostramos el botón si el texto es largo */}
              {(product.description?.length > 150 || !product.description) && (
                <button
                  type="button"
                  onClick={() => setIsDescExpanded(!isDescExpanded)}
                  style={{
                    display: 'block',
                    marginTop: '8px',
                    background: 'none',
                    border: 'none',
                    color: '#0B5CFF',
                    fontWeight: 'bold',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    padding: 0,
                    textDecoration: 'underline'
                  }}
                >
                  {isDescExpanded ? 'Ver menos' : 'Ver más'}
                </button>
              )}
            </div>
          </div><div className="pd-detailBlock"><div className="pd-detailT">Envío</div><p className="pd-detailP">Envío gratis a todo el país. Coordinamos por WhatsApp apenas se confirme el pago.</p></div><div className="pd-detailBlock"><div className="pd-detailT">Pago</div><p className="pd-detailP">Mercado Pago / Transferencia. Compra rápida y segura.</p></div></div>
        </section>

        <div style={{ marginTop: "3rem", display: "flex", flexDirection: "column", gap: "2rem", paddingBottom: "80px" }}>
          <AuthoritySection />
          <BeforeAfterSlider />
          <ComparisonTable />
          <ProblemSolutionSection />
          <BigMediaSection />
          <HowToUseSection />
          <TestimonialsSection />
          <FaqSection />
        </div>
      </div>

      {showToast && (<div className="pd-toast-wrapper"><div className="pd-toast-content"><div className="pd-toast-main"><img src={images[0]} alt="" className="pd-toast-img" /><div className="pd-toast-info"><span className="pd-toast-status">✓ ¡Agregado!</span><span className="pd-toast-name">{product.name}</span></div><button className="pd-toast-close" onClick={() => setShowToast(false)}>✕</button></div><div className="pd-toast-actions"><button className="pd-toast-btn-secondary" onClick={() => navigate('/cart')}>IR AL CARRITO</button><button className="pd-toast-btn-primary" onClick={() => navigate('/checkout')}>FINALIZAR COMPRA</button></div><div className="pd-toast-progress"></div></div></div>)}

      {/* 2. STICKY BAR PRO (Solo móvil) */}
      <div className="sticky-mobile-bar-pro">
        <div className="sticky-pro-info">
          <span className="sticky-pro-title">{product.name}</span>
          <div className="sticky-pro-prices">
            <span className="sticky-pro-price">{formatARS(price)}</span>
            {discountPct > 0 && <span className="sticky-pro-off">{discountPct}% OFF</span>}
          </div>
        </div>
        <button className="sticky-pro-btn" onClick={handleBuyNow}>COMPRAR AHORA</button>
      </div>

      <style>{`
        /* === MOBILE NAVBAR ESTILO AQUALYS === */
        .mobile-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: #fff;
          border-bottom: 1px solid #eee;
          position: sticky;
          top: 0;
          z-index: 9000;
          box-shadow: 0 2px 10px rgba(0,0,0,0.03);
        }
        @media (min-width: 768px) { .mobile-nav { display: none; } } /* Solo visible en móvil */

        .mn-left, .mn-right { flex: 1; display: flex; align-items: center; }
        .mn-center { flex: 2; text-align: center; }
        .mn-right { justify-content: flex-end; gap: 12px; }

        .mn-brand {
          font-size: 1.3rem;
          font-weight: 800;
          color: #000;
          letter-spacing: -0.5px;
        }

        .mn-btn {
          background: none;
          border: none;
          padding: 4px;
          color: #333;
          cursor: pointer;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .mn-cart-btn { color: #000; }
        .mn-badge {
          position: absolute;
          top: 0;
          right: 0;
          background: #E11D48;
          color: white;
          font-size: 0.65rem;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          transform: translate(25%, -25%);
        }

        /* === STICKY BAR PRO (FLOTANTE) === */
        .sticky-mobile-bar-pro {
          position: fixed;
          bottom: 20px; /* Flotando un poco arriba del borde */
          left: 15px;
          right: 15px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(0,0,0,0.05);
          padding: 10px 15px;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-radius: 16px; /* Bordes redondeados modernos */
          box-shadow: 0 8px 30px rgba(0,0,0,0.12); /* Sombra difusa y elegante */
          transform: translateY(150%);
          animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          animation-delay: 1.5s;
        }

        @media (min-width: 768px) { .sticky-mobile-bar-pro { display: none; } }

        .sticky-pro-info { display: flex; flex-direction: column; gap: 2px; }
        .sticky-pro-title { font-size: 0.75rem; color: #666; max-width: 120px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .sticky-pro-prices { display: flex; align-items: center; gap: 6px; }
        .sticky-pro-price { font-size: 1.1rem; font-weight: 800; color: #000; letter-spacing: -0.5px; }
        .sticky-pro-off { font-size: 0.65rem; background: #000; color: #fff; padding: 2px 4px; border-radius: 4px; font-weight: 700; }

        .sticky-pro-btn {
          background: #0B5CFF;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 12px;
          font-weight: 800;
          font-size: 0.9rem;
          letter-spacing: 0.5px;
          box-shadow: 0 4px 15px rgba(11, 92, 255, 0.3);
          transition: transform 0.2s;
        }
        .sticky-pro-btn:active { transform: scale(0.96); }

        @keyframes slideUp { to { transform: translateY(0); } }

        /* Ajustes Toast para que no tape */
        @media (max-width: 767px) { 
           .pd-toast-wrapper { top: 70px !important; bottom: auto !important; } /* Mover toast arriba en movil */
        }

        /* --- ESTILOS GENERALES (Mantenidos) --- */
        .authority-img-fixed { width: 100px !important; height: 100px !important; border-radius: 50%; object-fit: cover; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.1); display: block; }
        .steps-grid-fixed { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; text-align: center; width: 100%; }
        .step-item { background: #fff; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; display: flex; flex-direction: column; align-items: center; }
        
        .hero-title { font-size: 1.8rem; font-weight: 800; line-height: 1.2; color: #111827; margin-bottom: 0.5rem; }
        .hero-mini-desc { font-size: 1rem; color: #4B5563; line-height: 1.4; margin-bottom: 12px; font-weight: 500; }
        .hero-price { font-size: 2rem; font-weight: 800; color: #0B5CFF; letter-spacing: -0.5px; } 
        .hero-compare { font-size: 1.1rem; color: #9CA3AF; text-decoration: line-through; font-weight: 500; margin-left: 10px; }
        .hero-pill { background: #374151; color: white; font-size: 0.75rem; font-weight: 700; padding: 4px 8px; border-radius: 4px; margin-left: 8px; text-transform: uppercase; vertical-align: middle; }
        .hero-priceRow { display: flex; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; }
        .scarcity-text { color: #dc2626; font-weight: 800; font-size: 0.85rem; margin: 0 0 12px 0; display: flex; align-items: center; justify-content: center; gap: 6px; text-transform: uppercase; letter-spacing: 0.5px; animation: textFade 2s ease-in-out infinite; }

        .pd-trust { display: flex; justify-content: space-between; gap: 10px; margin: 20px 0; padding-top: 15px; border-top: 1px solid #f3f4f6; text-align: center; }
        .pd-trustItem { display: flex; flex-direction: column; align-items: center; font-size: 0.8rem; color: #333; flex: 1; line-height: 1.3; font-weight: 600; }
        .pd-ico { font-size: 1.4rem; margin-bottom: 6px; color: #0B5CFF; }

        .landing-section { padding: 40px 0; margin-bottom: 20px; }
        .landing-container { max-width: 900px; margin: 0 auto; padding: 0 15px; }
        .full-width-bg { background: #111827; width: 100vw; position: relative; left: 50%; right: 50%; margin-left: -50vw; margin-right: -50vw; padding: 60px 0; }
        .split-layout { display: flex; align-items: center; gap: 40px; }
        .split-text { flex: 1; }
        .split-media { flex: 1; }
        .landing-img-rounded { width: 100%; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
        .landing-title { font-size: 1.6rem; margin-bottom: 1rem; color: #1e293b; font-weight: 700; line-height: 1.2; }
        .landing-center-title { text-align: center; font-size: 1.8rem; margin-bottom: 2rem; font-weight: 800; color: #0f172a; }
        .landing-p { font-size: 1rem; line-height: 1.6; color: #475569; margin-bottom: 1.5rem; }
        .landing-list { list-style: none; padding: 0; display: flex; flexDirection: column; gap: 10px; }
        .landing-list li { font-size: 1rem; color: #334155; font-weight: 500; }
        .landing-video-cover { width: 100%; height: 100%; object-fit: cover; opacity: 0.6; transition: opacity 0.3s; }
        .landing-video-real { width: 100%; height: 100%; object-fit: cover; }
        .video-placeholder-container { position: relative; width: 100%; max-width: 800px; margin: 0 auto; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.4); aspect-ratio: 16/9; background: #000; cursor: pointer; }
        .video-overlay { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; z-index: 2; }
        .play-button { font-size: 4rem; margin-bottom: 10px; text-shadow: 0 4px 10px rgba(0,0,0,0.5); }

        @media (max-width: 768px) {
          .split-layout { flex-direction: column; }
          .reverse-mobile { flex-direction: column-reverse; }
          .landing-title { font-size: 1.4rem; text-align: center; }
          .landing-p { text-align: center; }
          .landing-center-title { font-size: 1.5rem; }
          .reviews-grid { grid-template-columns: 1fr; } 
        }
        
        .reviews-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 20px; align-items: start; }
        @media (max-width: 900px) { .reviews-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 600px) { .reviews-grid { grid-template-columns: 1fr; } }
        .tm-card { background: #fff; border: 1px solid #f1f1f1; border-radius: 16px; padding: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.03); display: flex; flex-direction: column; height: 100%; }
        .tm-card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
        .tm-card-title { font-weight: 800; color: #000; font-size: 1rem; }
        .tm-stars { color: #6c757d; font-size: 0.9rem; letter-spacing: 2px; }
        .tm-author { font-size: 0.85rem; color: #6c757d; margin-bottom: 14px; }
        .tm-text { font-size: 0.95rem; line-height: 1.5; color: #495057; font-style: italic; margin-bottom: 16px; flex: 1; }
        .tm-review-img-box { margin-bottom: 16px; border-radius: 12px; overflow: hidden; border: 1px solid #f0f0f0; }
        .tm-review-img { width: 100%; height: auto; max-height: 200px; object-fit: cover; display: block; }
        .tm-tags { display: flex; gap: 10px; }
        .tm-tag { background-color: #0d6efd; color: white; font-weight: 700; font-size: 0.75rem; padding: 6px 14px; border-radius: 50px; }
        .tm-badge { display: inline-block; background-color: #0d6efd; color: white; font-weight: 700; font-size: 0.8rem; padding: 6px 16px; border-radius: 50px; margin-bottom: 12px; }
        .tm-main-title { font-size: 1.8rem; color: #0d6efd; font-weight: 800; margin: 0 0 8px 0; line-height: 1.2; }
        .tm-subtitle { color: #6c757d; font-size: 0.95rem; margin: 0; }

        .ba-slider-container { position: relative; width: 100%; max-width: 600px; margin: 0 auto; overflow: hidden; border-radius: 16px; cursor: col-resize; box-shadow: 0 10px 25px rgba(0,0,0,0.1); user-select: none; }
        .ba-img { width: 100%; display: block; height: auto; pointer-events: none; }
        .ba-overlay { position: absolute; top: 0; left: 0; height: 100%; overflow: hidden; border-right: 2px solid white; }
        .ba-overlay .ba-img { width: auto; height: 100%; max-width: none; }
        .ba-handle { position: absolute; top: 0; bottom: 0; width: 40px; margin-left: -20px; display: flex; align-items: center; justify-content: center; z-index: 10; pointer-events: none; }
        .ba-line { position: absolute; top: 0; bottom: 0; width: 2px; background: white; left: 50%; transform: translateX(-50%); box-shadow: 0 0 5px rgba(0,0,0,0.3); }
        .ba-circle { width: 40px; height: 40px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; color: #333; box-shadow: 0 2px 6px rgba(0,0,0,0.2); font-weight: bold; position: relative; z-index: 2; }
        .ba-label { position: absolute; top: 10px; background: rgba(0,0,0,0.6); color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: bold; pointer-events: none; }
        .ba-before { left: 10px; }
        .ba-after { right: 10px; }

        .comp-table { background: #fff; border-radius: 16px; overflow: hidden; border: 1px solid #eee; box-shadow: 0 5px 20px rgba(0,0,0,0.05); }
        .comp-header { display: flex; background: #fff; padding: 15px; border-bottom: 2px solid #f3f4f6; align-items: flex-end; }
        .comp-col-empty { flex: 1.5; }
        .comp-col-us { flex: 1; text-align: center; font-weight: 800; font-size: 1.1rem; color: #000; }
        .comp-col-others { flex: 1; text-align: center; font-weight: 600; font-size: 1rem; color: #6b7280; }
        .comp-row { display: flex; padding: 15px; border-bottom: 1px solid #f3f4f6; align-items: center; }
        .comp-row:last-child { border-bottom: none; }
        .comp-feature-name { flex: 1.5; font-weight: 600; color: #1f2937; font-size: 0.95rem; }
        .comp-check-us { flex: 1; text-align: center; color: #10b981; font-weight: bold; font-size: 1.2rem; background: #ecfdf5; border-radius: 8px; padding: 4px; margin: 0 5px; }
        .comp-check-others { flex: 1; text-align: center; color: #ef4444; font-weight: bold; font-size: 1.2rem; opacity: 0.5; }
        .check-icon { display: inline-block; }
        .cross-icon { display: inline-block; }

/* === CORRECCIÓN FAQ === */
        .faq-container { 
            display: flex; 
            flex-direction: column; /* IMPORTANTE: con guion, no camelCase */
            gap: 15px; 
            width: 100%;
        }
        
        .faq-item { 
            width: 100%;
            border: 1px solid #e2e8f0; 
            border-radius: 12px; 
            overflow: hidden; 
            background: white; 
            box-shadow: 0 4px 6px rgba(0,0,0,0.02); /* Sombrita suave para que no se vea plano */
        }
        
        .faq-question { 
            width: 100%; 
            text-align: left; 
            padding: 16px 20px; 
            background: #fff; 
            border: none; 
            font-weight: 700; 
            color: #334155;
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            cursor: pointer; 
            font-size: 0.95rem;
        }
        
        .faq-question.active { 
            background: #f0f9ff; 
            color: #0B5CFF; 
        }
        
        .faq-answer { 
            padding: 0 20px; 
            overflow: hidden; 
            background: white; 
            color: #475569;
            line-height: 1.5;
            transition: all 0.3s ease;
        }
        
        .faq-question.active + .faq-answer { 
            padding: 0 20px 20px 20px; 
        }
        
        .faq-icon {
            font-size: 1.2rem;
            line-height: 1;
            color: #94a3b8;
        }
        .faq-question.active .faq-icon {
            color: #0B5CFF;
        }
        
        @keyframes textFade { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
        .btn-breathing { animation: breathe 4s ease-in-out infinite; transform-origin: center; position: relative; z-index: 2; }
        @keyframes breathe { 0% { transform: scale(1); box-shadow: 0 4px 6px rgba(0,0,0,0.1); } 50% { transform: scale(1.03); box-shadow: 0 10px 15px rgba(6, 55, 165, 0.2); } 100% { transform: scale(1); box-shadow: 0 4px 6px rgba(0,0,0,0.1); } }
        
        .pd-tick-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
        .pd-tick-icon { width: 22px; height: 22px; min-width: 22px; background: #25D366; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(37, 211, 102, 0.3); }
        .pd-tick-text { font-weight: 600; color: #334155; font-size: 0.95rem; }
        
        .authority-bg { background: #f0f9ff; border-left: 4px solid #0B5CFF; border-radius: 12px; padding: 30px; }
        .authority-flex { display: flex; gap: 20px; align-items: center; flex-wrap: wrap; }
        .authority-sign strong { display: block; color: #0f172a; }
        .authority-sign span { font-size: 0.9rem; color: #64748b; }
        .authority-img-box { flex: 0 0 100px; }
        
        .step-num { width: 40px; height: 40px; background: #0B5CFF; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 1.2rem; margin: 0 auto 15px; }

        .pd-toast-wrapper { position: fixed; z-index: 10000; animation: toastSlideIn 0.5s ease-out; }
        @media (min-width: 768px) { .pd-toast-wrapper { bottom: 24px; right: 24px; width: 350px; } }
        @media (max-width: 767px) { .pd-toast-wrapper { top: 12px; left: 12px; right: 12px; width: auto; } }
        .pd-toast-content { background: white; border-radius: 18px; padding: 12px; box-shadow: 0 10px 30px rgba(6, 55, 165, 0.15); border: 1px solid #DDF5FF; display: flex; flex-direction: column; gap: 10px; position: relative; overflow: hidden; }
        .pd-toast-main { display: flex; align-items: center; gap: 12px; }
        .pd-toast-img { width: 45px; height: 45px; border-radius: 10px; object-fit: cover; }
        .pd-toast-info { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
        .pd-toast-status { color: #22C3FF; font-weight: 800; font-size: 0.75rem; text-transform: uppercase; }
        .pd-toast-name { font-size: 0.85rem; font-weight: 600; color: #0637A5; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .pd-toast-close { background: none; border: none; color: #ccc; cursor: pointer; font-size: 1rem; padding: 4px; }
        .pd-toast-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .pd-toast-btn-primary { background: #0B5CFF; color: white; border: none; padding: 8px; border-radius: 10px; font-weight: bold; font-size: 0.75rem; cursor: pointer; }
        .pd-toast-btn-secondary { background: #DDF5FF; color: #0637A5; border: none; padding: 8px; border-radius: 10px; font-weight: bold; font-size: 0.75rem; cursor: pointer; }
        .pd-toast-progress { position: absolute; bottom: 0; left: 0; height: 3px; background: #22C3FF; width: 100%; animation: toastProgress 5s linear forwards; }
        @keyframes toastSlideIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes toastProgress { from { width: 100%; } to { width: 0%; } }
      `}</style>
    </main>
  );
}